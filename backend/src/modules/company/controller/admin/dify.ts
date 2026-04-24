import { Controller, Inject, Post } from '@midwayjs/core';
import { Body } from '@midwayjs/core';
import { DifyService } from '../../service/dify';

@Controller('/company/dify')
export class DifyController {
  @Inject()
  difyService!: DifyService;

  @Post('/intelligentPriceInquiry')
  async intelligentPriceInquiry(
    @Body() body: { brand: string; name: string; dimension: string }
  ) {
    if (!body.brand || !body.name || !body.dimension) {
      return { code: 400, message: '品牌、名称、规格型号均为必填项' };
    }
    try {
      const result = await this.difyService.queryMaterialPrice(
        body.brand,
        body.name,
        body.dimension
      );
      return { code: 1000, data: result };
    } catch (error: any) {
      return { code: 500, message: error.message };
    }
  }

  @Post('/customerInfo')
  async getCustomerInfo(@Body() body: { name: string }) {
    if (!body.name) {
      return { code: 400, message: '名称不能为空' };
    }
    try {
      const result = await this.difyService.getCustomerInfo(body.name);
      return { code: 1000, data: result };
    } catch (error: any) {
      return { code: 500, message: error.message };
    }
  }

  @Post('/receptionScript')
  async getReceptionScript(@Body() body: { user_name: string }) {
    if (!body.user_name) {
      return { code: 400, message: '用户名称不能为空' };
    }
    try {
      const result = await this.difyService.getReceptionScript(body.user_name);
      return { code: 1000, data: result };
    } catch (error: any) {
      return { code: 500, message: error.message };
    }
  }

  @Post('/supplierRecommend')
  async getSupplierRecommend(
    @Body() body: { name: string; dimension: string }
  ) {
    if (!body.name || !body.dimension) {
      return { code: 400, message: '名称和规格型号均为必填项' };
    }
    try {
      const result = await this.difyService.getSupplierRecommend(
        body.name,
        body.dimension
      );
      return { code: 1000, data: result };
    } catch (error: any) {
      return { code: 500, message: error.message };
    }
  }

  @Post('/analyzeLead')
  async analyzeLead(@Body() body: { title: string; detail: string }) {
    if (!body.title || !body.detail) {
      return { code: 400, message: '线索题目和详情均为必填项' };
    }
    try {
      const result = await this.difyService.analyzeLead(
        body.title,
        body.detail
      );
      return { code: 1000, data: result };
    } catch (error: any) {
      console.info(error);
      return { code: 500, message: error.message };
    }
  }

  @Post('/customerPortrait')
  async getCustomerPortrait(@Body() body: { name: string }) {
    if (!body.name) {
      return { code: 400, message: '客户名称不能为空' };
    }
    try {
      const result = await this.difyService.getCustomerPortrait(body.name);
      return { code: 1000, data: result };
    } catch (error: any) {
      return { code: 500, message: error.message };
    }
  }
}
