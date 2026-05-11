import { BaseController, CoolController } from '@cool-midway/core';
import { CompanyPurchaseRequirementEntity } from '../../entity/purchaseRequirement';
import { CompanyPurchaseRequirementService } from '../../service/purchaseRequirement';

/**
 * 公司目录-供应链部-采购需求
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'page'],
  entity: CompanyPurchaseRequirementEntity,
  service: CompanyPurchaseRequirementService,
  serviceApis: [
    {
      method: 'generatePurchaseOrder',
      summary: '合并采购',
    },
  ],
})
export class AdminCompanyPurchaseRequirementController extends BaseController {}
