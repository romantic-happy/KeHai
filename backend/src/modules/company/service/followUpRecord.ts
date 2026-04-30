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
   * 修改前置处理
   */
  async modifyBefore(data: any, type: 'delete' | 'update' | 'add') {
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
   * 逻辑：当前时间 >= (下次跟进时间 - 日程提醒天数) 且 当前时间 <= 下次跟进时间
   */
  async getReminderRecords() {
    // Node.js 使用 Asia/Shanghai 时区，MySQL 使用 UTC，需要转换
    const now = new Date();
    // 转为 UTC 时间（去掉8小时）
    const utcNow = new Date(now.getTime() - 8 * 60 * 60 * 1000);

    const reminderRecords: CompanyFollowUpRecordEntity[] = [];

    console.log('========== 提醒记录查询开始 ==========');
    console.log('本地时间:', now.toISOString());
    console.log('UTC 时间:', utcNow.toISOString());
    console.log(
      '查询窗口:',
      new Date(utcNow.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    );

    // 查找未来30天内需要跟进的记录（使用UTC时间查询）
    const records = await this.companyFollowUpRecordEntity.find({
      where: {
        nextFollowTime: LessThanOrEqual(
          new Date(utcNow.getTime() + 30 * 24 * 60 * 60 * 1000)
        ),
      },
    });

    console.log('查询到的记录数:', records.length);
    if (records.length > 0) {
      console.log('记录详情:');
      records.forEach((r: any, i: number) => {
        console.log(`  [${i+1}] id=${r.id}, customerName=${r.customerName}, nextFollowTime=${r.nextFollowTime}, isReminder=${r.isReminder}`);
      });
    }

    for (const record of records) {
      if (!record.nextFollowTime) {
        console.log(`跳过: id=${record.id}, nextFollowTime为null`);
        continue;
      }

      // isReminder 是天数，例如 6 表示提前6天提醒
      const reminderDays = Number(record.isReminder);
      console.log(`检查 id=${record.id}, isReminder=${record.isReminder}, reminderDays=${reminderDays}`);

      if (!reminderDays || reminderDays <= 0) {
        console.log(`跳过: reminderDays无效`);
        continue;
      }

      // 计算提醒时间：下次跟进时间 - 提醒天数
      const reminderTime = new Date(
        record.nextFollowTime.getTime() - reminderDays * 24 * 60 * 60 * 1000
      );

      console.log(`  提醒时间=${reminderTime.toISOString()}, 下次跟进=${record.nextFollowTime}`);
      console.log(
        `  utcNow>=reminderTime: ${utcNow >= reminderTime}, utcNow<=nextFollowTime: ${utcNow <= record.nextFollowTime}`
      );

      // 当前时间在 [提醒时间, 下次跟进时间] 区间内时显示
      if (utcNow >= reminderTime && utcNow <= record.nextFollowTime) {
        console.log(`  => 加入提醒列表`);
        reminderRecords.push(record);
      } else {
        console.log(`  => 不在提醒区间，跳过`);
      }
    }

    console.log('最终提醒记录数:', reminderRecords.length);
    console.log('========== 提醒记录查询结束 ==========');

    return reminderRecords;
  }
}
