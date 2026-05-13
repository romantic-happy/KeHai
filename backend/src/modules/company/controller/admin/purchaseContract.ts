import { BaseController, CoolController } from '@cool-midway/core';
import { CompanyPurchaseContractEntity } from '../../entity/purchaseContract';
import { CompanyPurchaseContractService } from '../../service/purchaseContract';

/**
 * Company purchase contract management.
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: CompanyPurchaseContractEntity,
  service: CompanyPurchaseContractService,
  serviceApis: [
    {
      method: 'quoteProductOptions',
      summary: 'Quote product options for purchase contract',
    },
  ],
  pageQueryOp: {
    keyWordLikeFields: ['a.contractNo', 'a.orderNo', 'a.supplierName'],
    fieldEq: ['a.supplierId', 'a.supplierType'],
    select: ['a.*'],
  },
})
export class AdminCompanyPurchaseContractController extends BaseController {}
