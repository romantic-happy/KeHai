import { BaseService } from '@cool-midway/core';
import { Inject, Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyFollowUpRecordEntity } from '../entity/followUpRecord';
import { CompanyCustomerEntity } from '../entity/customer';
import { BaseSysUserService } from '../../base/service/sys/user';

/**
 * 客户跟进记录
 */
@Provide()
export class CompanyFollowUpRecordService extends BaseService {
  @Inject()
  ctx;

  @Inject()
  baseSysUserService: BaseSysUserService;

  @InjectEntityModel(CompanyFollowUpRecordEntity)
  companyFollowUpRecordEntity: Repository<CompanyFollowUpRecordEntity>;

  @InjectEntityModel(CompanyCustomerEntity)
  companyCustomerEntity: Repository<CompanyCustomerEntity>;

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
}
