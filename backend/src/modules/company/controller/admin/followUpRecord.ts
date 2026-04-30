import { BaseController, CoolController } from '@cool-midway/core';
import { Body, Inject, Post } from '@midwayjs/core';
import { CompanyFollowUpRecordEntity } from '../../entity/followUpRecord';
import { CompanyFollowUpRecordService } from '../../service/followUpRecord';

/**
 * 客户跟进记录
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: CompanyFollowUpRecordEntity,
  service: CompanyFollowUpRecordService,
  pageQueryOp: {
    keyWordLikeFields: ['a.details', 'a.keyPerson', 'a.customerName', 'a.ownerUserName'],
    fieldEq: ['a.method', 'a.status', 'a.result'],
  },
})
export class AdminCompanyFollowUpRecordController extends BaseController {
  @Inject()
  followUpRecordService!: CompanyFollowUpRecordService;

  /**
   * 根据客户名称模糊搜索未成单记录、成单记录、跟进记录
   */
  @Post('/getCustomerOrderData')
  async getCustomerOrderData(@Body('customerName') customerName: string) {
    if (!customerName) {
      return { code: 400, message: '客户名称不能为空' };
    }
    const data = await this.followUpRecordService.getCustomerOrderData(customerName);
    return { code: 1000, data };
  }

  /**
   * 获取需要提醒的跟进记录
   */
  @Post('/getReminderRecords')
  async getReminderRecords() {
    const data = await this.followUpRecordService.getReminderRecords();
    return { code: 1000, data };
  }
}
