import { BaseController, CoolController } from '@cool-midway/core';
import { CompanyLeadEntity } from '../../entity/lead';
import { CompanyLeadService } from '../../service/lead';

/**
 * 公司目录-销售部-线索
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: CompanyLeadEntity,
  service: CompanyLeadService,
  serviceApis: [
    {
      method: 'developmentPage',
      summary: '线索开发分页（进行中）',
    },
    {
      method: 'managementPage',
      summary: '线索管理分页（结果态）',
    },
    {
      method: 'toSuccess',
      summary: '线索转化成功',
    },
    {
      method: 'toDiscard',
      summary: '线索放弃',
    },
    {
      method: 'aiAnalyze',
      summary: '线索AI分析',
    },
  ],
  pageQueryOp: {
    keyWordLikeFields: ['a.leadNo', 'a.leadTitle', 'a.leadDetail'],
    fieldEq: ['a.ownerUserId', 'a.lastEditUserId'],
    select: ['a.*'],
  },
})
export class AdminCompanyLeadController extends BaseController {}
