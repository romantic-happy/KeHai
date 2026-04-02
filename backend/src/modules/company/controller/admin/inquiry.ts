import { BaseController, CoolController, CoolCommException } from '@cool-midway/core';
import { Body, Inject, Post } from '@midwayjs/core';
import { CompanyInquiryEntity } from '../../entity/inquiry';
import { CompanyQuoteEntity } from '../../entity/quote';
import { CompanyInquiryService } from '../../service/inquiry';

/**
 * 公司目录-销售部-询价
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: CompanyInquiryEntity,
  service: CompanyInquiryService,
  serviceApis: [
    {
      method: 'progressPage',
      summary: '报价单进度分页（含负责人）'
    }
  ],
  insertParam: ctx => {
    return {
      createUserId: ctx.admin.userId,
    };
  },
  pageQueryOp: {
    keyWordLikeFields: ['a.inquiryNo', 'a.customer', 'a.projectName'],
    // 销售端列表不对 quoteStatus 做默认过滤/筛选
    // 进度统计与筛选在商务管理页面完成
    fieldEq: ['a.inquiryType'],
    select: [
      'a.*',
      'b.quoteNo as quoteNo',
      'b.totalCost as quoteTotalCost',
      'b.supplier as quoteSupplier',
      'b.priceExclTax as quotePriceExclTax',
      'b.taxRate as quoteTaxRate',
      'b.priceInclTax as quotePriceInclTax',
      'b.isRejected as quoteIsRejected',
    ],
    join: [
      {
        entity: CompanyQuoteEntity,
        alias: 'b',
        condition: 'a.quoteId = b.id',
        type: 'leftJoin',
      },
    ],
  },
})
export class AdminCompanyInquiryController extends BaseController {
  @Inject()
  companyInquiryService: CompanyInquiryService;

  /**
   * 接受某条报价（销售端）
   */
  @Post('/accept', { summary: '接受报价' })
  async accept(@Body() body: { quoteId: number }) {
    const quoteIdNum = Number(body?.quoteId);
    if (!Number.isFinite(quoteIdNum) || quoteIdNum <= 0) {
      throw new CoolCommException('缺少/无效的 quoteId');
    }

    await this.companyInquiryService.accept(quoteIdNum);
    return this.ok({ quoteId: quoteIdNum });
  }

  /**
   * 拒绝某条报价（销售端）
   */
  @Post('/reject', { summary: '拒绝报价' })
  async reject(@Body() body: { quoteId: number }) {
    const quoteIdNum = Number(body?.quoteId);
    if (!Number.isFinite(quoteIdNum) || quoteIdNum <= 0) {
      throw new CoolCommException('缺少/无效的 quoteId');
    }

    await this.companyInquiryService.reject(quoteIdNum);
    return this.ok({ quoteId: quoteIdNum });
  }

  /**
   * 同步报价单同意/拒绝权限（菜单/角色/缓存）
   */
  @Post('/syncQuotePerms', { summary: '同步报价操作权限' })
  async syncQuotePerms() {
    return this.ok(await this.companyInquiryService.syncQuotePerms());
  }
}

