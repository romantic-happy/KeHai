import { BaseController, CoolController } from '@cool-midway/core';
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
export class AdminCompanyFollowUpRecordController extends BaseController {}
