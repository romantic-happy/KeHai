import { BaseController, CoolController } from '@cool-midway/core';
import { CompanyCustomerEntity } from '../../entity/customer';
import { CompanyCustomerService } from '../../service/customer';

/**
 * 公司目录-销售部-客户管理
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: CompanyCustomerEntity,
  service: CompanyCustomerService,
  pageQueryOp: {
    // 关键词模糊搜索：客户编号、名称
    keyWordLikeFields: ['a.customerNo', 'a.customerName'],
    // 精确筛选字段
    fieldEq: [
      'a.level',
      'a.backgroundOwner',
    ],
    // 默认查询字段
    select: ['a.*'],
  },
  serviceApis: [
    { method: 'closedDealPage', summary: '已成单记录分页' },
    { method: 'lostDealPage', summary: '未成单记录分页' },
  ],
})
export class AdminCompanyCustomerController extends BaseController {}
