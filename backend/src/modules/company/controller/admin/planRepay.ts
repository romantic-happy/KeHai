import { Body, Inject, Post } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { CompanyPlanRepayEntity } from '../../entity/planRepay';
import { CompanyPlanRepayService } from '../../service/planRepay';

@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: CompanyPlanRepayEntity,
  service: CompanyPlanRepayService,
  pageQueryOp: {
    keyWordLikeFields: ['a.invoiceNo', 'a.customerName', 'a.contractOrderNo'],
    fieldEq: ['a.customerId', 'a.repayStatus'],
    select: ['a.*'],
  },
})
export class AdminCompanyPlanRepayController extends BaseController {
  @Inject()
  planRepayService: CompanyPlanRepayService;

  @Post('/confirmRepay', { summary: '确认回款' })
  async confirmRepay(@Body() body: { id: number; actualRepayAmount?: number; actualRepayDate?: string; remark?: string }) {
    if (!body?.id) {
      throw new Error('缺少计划回款ID');
    }
    const result = await this.planRepayService.confirmRepay(body);
    return this.ok(result);
  }
}
