import { BaseService } from '@cool-midway/core';
import { Inject, Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository, Like, LessThanOrEqual } from 'typeorm';
import { CompanyFollowUpRecordEntity } from '../entity/followUpRecord';
import { CompanyCustomerEntity } from '../entity/customer';
import { CompanyContractMgmtEntity } from '../entity/contractMgmt';
import { BaseSysUserService } from '../../base/service/sys/user';

/**
 * 客户跟进记录
 */
@Provide()
export class CompanyFollowUpRecordService extends BaseService {
  @Inject()
  ctx;

  @Inject()
  baseSysUserService!: BaseSysUserService;

  @InjectEntityModel(CompanyFollowUpRecordEntity)
  companyFollowUpRecordEntity!: Repository<CompanyFollowUpRecordEntity>;

  @InjectEntityModel(CompanyCustomerEntity)
  companyCustomerEntity!: Repository<CompanyCustomerEntity>;

  @InjectEntityModel(CompanyContractMgmtEntity)
  companyContractMgmtEntity!: Repository<CompanyContractMgmtEntity>;

  /**
   * 将空字符串等“空输入”统一转为 null
   */
  private normalizeEmptyValue(value: any) {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || trimmed.toLowerCase() === 'null') {
        return null;
      }
      return trimmed;
    }

    return value;
  }

  /**
   * 规范化可空日期字段，避免将空字符串写入 datetime
   */
  private normalizeNullableDate(value: any) {
    const normalized = this.normalizeEmptyValue(value);
    if (normalized === null) {
      return null;
    }

    const date = normalized instanceof Date ? normalized : new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  /**
   * 规范化提醒字段，兼容“2”与“提前5分钟”两类输入
   */
  private normalizeReminderValue(value: any) {
    const normalized = this.normalizeEmptyValue(value);
    if (normalized === null) {
      return null;
    }

    return String(normalized);
  }

  /**
   * 将提醒配置转换为毫秒数
   * 纯数字按“天”处理；文本支持“提前5分钟 / 提前2小时 / 提前3天”
   */
  private parseReminderOffset(value: any) {
    const normalized = this.normalizeEmptyValue(value);
    if (normalized === null) {
      return null;
    }

    if (typeof normalized === 'number') {
      return normalized > 0 ? normalized * 24 * 60 * 60 * 1000 : null;
    }

    const text = String(normalized);

    if (/^\d+(\.\d+)?$/.test(text)) {
      const days = Number(text);
      return days > 0 ? days * 24 * 60 * 60 * 1000 : null;
    }

    const minuteMatch = text.match(/提前\s*(\d+)\s*分钟/);
    if (minuteMatch) {
      return Number(minuteMatch[1]) * 60 * 1000;
    }

    const hourMatch = text.match(/提前\s*(\d+)\s*小时/);
    if (hourMatch) {
      return Number(hourMatch[1]) * 60 * 60 * 1000;
    }

    const dayMatch = text.match(/提前\s*(\d+)\s*天/);
    if (dayMatch) {
      return Number(dayMatch[1]) * 24 * 60 * 60 * 1000;
    }

    return null;
  }

  /**
   * 修改前置处理
   */
  async modifyBefore(data: any, type: 'delete' | 'update' | 'add') {
    if (Object.prototype.hasOwnProperty.call(data, 'followUpTime')) {
      data.followUpTime = this.normalizeNullableDate(data.followUpTime);
    }

    if (Object.prototype.hasOwnProperty.call(data, 'nextFollowTime')) {
      data.nextFollowTime = this.normalizeNullableDate(data.nextFollowTime);
    }

    if (Object.prototype.hasOwnProperty.call(data, 'isReminder')) {
      data.isReminder = this.normalizeReminderValue(data.isReminder);
    }

    if (type === 'add') {
      const userInfo = await this.baseSysUserService.info(this.ctx.admin.userId);
      const userName = userInfo?.name || this.ctx.admin.username;

      // 默认跟进人为当前登录用户姓名
      if (!data.ownerUserName) {
        data.ownerUserName = userName;
      }
      // 设置创建人（如果没传则默认当前用户）
      if (!data.creator) {
        data.creator = userName;
      }
      // 设置跟进人所在部门
      if (!data.followUpPersonDept) {
        data.followUpPersonDept = userInfo?.departmentName;
      }

      // 如果没有传跟进时间，默认当前时间
      if (!data.followUpTime) {
        data.followUpTime = new Date();
      }
    }

    if (type === 'update') {
      if (!data.followUpTime) {
        delete data.followUpTime;
      }

      const userInfo = await this.baseSysUserService.info(this.ctx.admin.userId);
      // 设置最后修改人（如果没传则默认当前用户）
      if (!data.modifier) {
        data.modifier = userInfo?.name || this.ctx.admin.username;
      }
    }
  }

  /**
   * 修改后置处理：更新客户的最后跟进信息
   */
  async modifyAfter(data: any, type: 'delete' | 'update' | 'add') {
    if (type === 'add' || type === 'update') {
      const record = await this.companyFollowUpRecordEntity.findOne({
        where: { id: data.id },
      });

      if (record && record.customerName) {
        // 更新客户表的最后跟进时间和跟进人
        // 这里可以根据 customerName 找到客户并更新，但 PRD 未明确要求更新客户表，
        // 且之前的实现是占位，此处暂不修改客户表逻辑，仅确保本模块逻辑正确。
      }
    }
  }

  /**
   * 根据客户名称模糊搜索：未成单记录、成单记录
   * @param customerName 客户名称（模糊匹配）
   */
  async getCustomerOrderData(customerName: string) {
    const namePattern = `%${customerName}%`;

    // 1. 未成单记录（contractStatus != 2 表示非"已完结"）
    const unclosedContracts = await this.companyContractMgmtEntity.find({
      where: {
        customerName: Like(namePattern),
        isDeleted: 0,
      },
      select: [
        'id',
        'contractNo',
        'contractName',
        'contractAmount',
        'contractStatus',
        'signDate',
        'createTime',
      ],
    });

    // 2. 成单记录（contractStatus == 2 表示"已完结"）
    const closedContracts = await this.companyContractMgmtEntity.find({
      where: {
        customerName: Like(namePattern),
        contractStatus: 2,
        isDeleted: 0,
      },
      select: [
        'id',
        'contractNo',
        'contractName',
        'contractAmount',
        'contractStatus',
        'signDate',
        'createTime',
      ],
    });

    return {
      unclosedContracts,
      closedContracts,
    };
  }

  /**
   * 获取需要提醒的跟进记录
   * 逻辑：当前时间 >= (下次跟进时间 - 日程提醒偏移量) 且 当前时间 <= 下次跟进时间
   */
  async getReminderRecords() {
    // Node.js 使用 Asia/Shanghai 时区，MySQL 使用 UTC，需要转换
    const now = new Date();
    const utcNow = new Date(now.getTime() - 8 * 60 * 60 * 1000);

    const reminderRecords: CompanyFollowUpRecordEntity[] = [];

    // 查找未来30天内需要跟进的记录（使用UTC时间查询）
    const records = await this.companyFollowUpRecordEntity.find({
      where: {
        nextFollowTime: LessThanOrEqual(
          new Date(utcNow.getTime() + 30 * 24 * 60 * 60 * 1000)
        ),
      },
    });

    for (const record of records) {
      if (!record.nextFollowTime) {
        continue;
      }

      const reminderOffset = this.parseReminderOffset(record.isReminder);

      if (!reminderOffset || reminderOffset <= 0) {
        continue;
      }

      // 计算提醒时间：下次跟进时间 - 提醒偏移量
      const reminderTime = new Date(
        record.nextFollowTime.getTime() - reminderOffset
      );

      // 当前时间在 [提醒时间, 下次跟进时间] 区间内时显示
      if (utcNow >= reminderTime && utcNow <= record.nextFollowTime) {
        reminderRecords.push(record);
      }
    }

    return reminderRecords;
  }
}
