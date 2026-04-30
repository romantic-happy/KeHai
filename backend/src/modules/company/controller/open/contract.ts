import { Body, Get, Inject, Options, Post, Query } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { CoolController, BaseController, CoolCommException } from '@cool-midway/core';
import { CompanyContractService } from '../../service/contract';

/**
 * 公司目录-合同（Dify HTTP 节点回调，无需登录）
 */
@CoolController({
  description: '合同 Dify 回调',
})
export class OpenCompanyContractController extends BaseController {
  @Inject()
  ctx: Context;

  @Inject()
  companyContractService: CompanyContractService;

  /**
   * 浏览器跨域预检（部分环境会先 OPTIONS）
   */
  @Options('/receive', { summary: 'receive 预检' })
  async receiveOptions() {
    this.ctx.status = 204;
    this.ctx.set('Access-Control-Allow-Origin', '*');
    this.ctx.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    this.ctx.set(
      'Access-Control-Allow-Headers',
      'Content-Type, X-Contract-Secret, Authorization'
    );
  }

  /**
   * Dify 工作流 HTTP 节点调用：写入 Word 并关联 taskId
   */
  @Post('/receive', { summary: '接收 Dify 生成的合同正文' })
  async receive(
    @Body()
    body: {
      taskId: string;
      contractText: string;
      contractType: string,
      contractName?: string;
    },
    @Query('secret') secretQuery?: string
  ) {
    const auth = this.ctx.get('authorization') || '';
    const bearer =
      auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
    const headerSecret =
      this.ctx.get('x-contract-secret') || bearer || undefined;
    const secret = headerSecret || secretQuery;
    try {
      this.companyContractService.validateCallbackSecret(secret);
    } catch (e: any) {
      this.ctx.status = 401;
      throw new CoolCommException(e?.message || '未授权', 401);
    }
    if (!body?.taskId) {
      throw new CoolCommException('缺少 taskId');
    }
    if (!body?.contractText) {
      throw new CoolCommException('缺少contractText');
    }
    try {
      const fileUrl = await this.companyContractService.completeFromCallback(
        body.taskId,
        body.contractText,
        body.contractType,
        body.contractName,
      );
      this.ctx.set('Access-Control-Allow-Origin', '*');
      return this.ok({ fileUrl });
    } catch (e: any) {
      this.ctx.set('Access-Control-Allow-Origin', '*');
      throw new CoolCommException(e?.message || '生成 Word 失败');
    }
  }

  /**
   * 健康检查（可选）
   */
  @Get('/ping', { summary: '回调连通性' })
  async ping() {
    return this.ok({ ok: true });
  }
}
