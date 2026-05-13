import { Body, Inject, Post } from '@midwayjs/core';
import { BaseController, CoolController } from '@cool-midway/core';
import { CompanyInvoiceEntity } from '../../entity/invoice';
import { CompanyInvoiceService } from '../../service/invoice';

@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: CompanyInvoiceEntity,
  service: CompanyInvoiceService,
  serviceApis: [
    {
      method: 'contractOrderPage',
      summary: '按客户分页查询合同订单（开票选单）',
    },
    {
      method: 'invoiceProfileByCustomer',
      summary: '按客户读取最近一次开票的发票抬头信息',
    },
  ],
  insertParam: ctx => {
    return {
      createUserId: ctx.admin.userId,
    };
  },
  pageQueryOp: {
    keyWordLikeFields: ['a.invoiceNo', 'a.customerName', 'a.contractOrderLabels'],
    fieldEq: ['a.customerId', 'a.invoiceStatus'],
    select: ['a.*'],
  },
})
export class AdminCompanyInvoiceController extends BaseController {
  @Inject()
  invoiceService: CompanyInvoiceService;

  @Post('/confirm', { summary: '确认开票' })
  async confirm(@Body() body: { id: number }) {
    if (!body?.id) {
      throw new Error('缺少开票ID');
    }
    const result = await this.invoiceService.confirmInvoice({ id: body.id });
    return this.ok(result);
  }
}
