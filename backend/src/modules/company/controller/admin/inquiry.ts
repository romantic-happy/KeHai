import {
  BaseController,
  CoolController,
  CoolCommException,
} from '@cool-midway/core';
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
      summary: '报价单进度分页（含负责人）',
    },
    {
      method: 'syncBizStatus',
      summary: '同步报价业务状态',
    },
    {
      method: 'saveLostDeal',
      summary: '未成单：记录丢单原因',
    },
    {
      method: 'convertToContractOrder',
      summary: '已成单：转换合同订单',
    },
  ],
  insertParam: ctx => {
    return {
      createUserId: ctx.admin.userId,
    };
  },
  pageQueryOp: {
    keyWordLikeFields: ['a.inquiryNo', 'a.customer', 'a.projectName'],
    // 销售端列表按业务状态筛选；进度统计与筛选在商务管理页面完成
    fieldEq: ['a.inquiryType', 'a.quoteBizStatus'],
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
  async reject(@Body() body: { quoteId: number; rejectReason?: string }) {
    const quoteIdNum = Number(body?.quoteId);
    if (!Number.isFinite(quoteIdNum) || quoteIdNum <= 0) {
      throw new CoolCommException('缺少/无效的 quoteId');
    }

    await this.companyInquiryService.reject(quoteIdNum, body?.rejectReason);
    return this.ok({
      quoteId: quoteIdNum,
      rejectReason: body?.rejectReason || null,
    });
  }

  /**
   * 销售填写实际报价（每个产品）
   */
  @Post('/saveSalesPricing', { summary: '保存销售实际报价' })
  async saveSalesPricing(
    @Body()
    body: {
      inquiryId: number;
      productItems?: any[];
      salesQuoteRemark?: string;
    }
  ) {
    const inquiryIdNum = Number(body?.inquiryId);
    if (!Number.isFinite(inquiryIdNum) || inquiryIdNum <= 0) {
      throw new CoolCommException('缺少/无效的 inquiryId');
    }
    return this.ok(await this.companyInquiryService.saveSalesPricing(body));
  }

  /**
   * 提交成单结果（未成单/已成单）
   */
  @Post('/saveDealResult', { summary: '提交成单结果' })
  async saveDealResult(
    @Body()
    body: {
      inquiryId: number;
      dealStatus: number;
      lostReason?: string;
      contractOrderNo?: string;
    }
  ) {
    const inquiryIdNum = Number(body?.inquiryId);
    if (!Number.isFinite(inquiryIdNum) || inquiryIdNum <= 0) {
      throw new CoolCommException('缺少/无效的 inquiryId');
    }
    return this.ok(await this.companyInquiryService.saveDealResult(body));
  }

  /**
   * 未成单：记录丢单原因
   */
  @Post('/saveLostDeal', { summary: '未成单' })
  async saveLostDeal(
    @Body()
    body: {
      inquiryId: number;
      lostReason: string;
      salesQuote: number;
    }
  ) {
    const inquiryIdNum = Number(body?.inquiryId);
    if (!Number.isFinite(inquiryIdNum) || inquiryIdNum <= 0) {
      throw new CoolCommException('缺少/无效的 inquiryId');
    }
    const salesQuoteNum = Number(body?.salesQuote);
    if (!Number.isFinite(salesQuoteNum) || salesQuoteNum < 0) {
      throw new CoolCommException('请填写有效的销售报价');
    }
    return this.ok(await this.companyInquiryService.saveLostDeal(body));
  }

  /**
   * 已成单：转换合同订单，部分内容流转到成单记录中
   */
  @Post('/convertToContractOrder', { summary: '已成单，转换合同订单' })
  async convertToContractOrder(
    @Body()
    body: {
      inquiryId: number;
      contractOrderNo?: string;
      salesQuote: number;
      dealKey?: string;
    }
  ) {
    const inquiryIdNum = Number(body?.inquiryId);
    if (!Number.isFinite(inquiryIdNum) || inquiryIdNum <= 0) {
      throw new CoolCommException('缺少/无效的 inquiryId');
    }
    const salesQuoteNum = Number(body?.salesQuote);
    if (!Number.isFinite(salesQuoteNum) || salesQuoteNum < 0) {
      throw new CoolCommException('请填写有效的销售报价');
    }
    return this.ok(
      await this.companyInquiryService.convertToContractOrder(body)
    );
  }

  /**
   * 同步报价单同意/拒绝权限（菜单/角色/缓存）
   */
  @Post('/syncQuotePerms', { summary: '同步报价操作权限' })
  async syncQuotePerms() {
    return this.ok(await this.companyInquiryService.syncQuotePerms());
  }
}
