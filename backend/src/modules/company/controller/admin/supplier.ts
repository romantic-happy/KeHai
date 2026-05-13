import { BaseController, CoolController } from '@cool-midway/core';
import { CompanySupplierEntity } from '../../entity/supplier';
import { CompanySupplierService } from '../../service/supplier';

/**
 * Company directory - supply chain supplier management.
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: CompanySupplierEntity,
  service: CompanySupplierService,
  serviceApis: [
    {
      method: 'transfer',
      summary: 'Temporary supplier transfer to formal supplier',
    },
    {
      method: 'aiBackgroundCheck',
      summary: 'AI background check placeholder',
    },
    {
      method: 'quoteRecords',
      summary: 'Supplier quote records placeholder',
    },
  ],
  insertParam: ctx => {
    return {
      createUserId: ctx.admin.userId,
    };
  },
  pageQueryOp: {
    keyWordLikeFields: ['a.supplierName', 'a.contactName', 'a.contactInfo'],
    fieldEq: [
      'a.supplierType',
      'a.supplierSource',
      'a.infoStatus',
      'a.manageStatus',
      'a.cooperationRelation',
    ],
    select: ['a.*'],
  },
})
export class AdminCompanySupplierController extends BaseController {}
