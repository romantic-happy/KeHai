import { Body, Get, Inject, Post, Query } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { CoolController, BaseController, CoolCommException } from '@cool-midway/core';
import { CompanyContractService } from '../../service/contract';
import { createReadStream } from 'fs';
import { v4 as uuidv4 } from 'uuid';

/**
 * 公司目录-销售部-合同（生成 / 轮询 / 下载）
 */
@CoolController({
  description: '合同生成',
})
export class AdminCompanyContractController extends BaseController {
  @Inject()
  ctx: Context;

  @Inject()
  companyContractService: CompanyContractService;

  /**
   * 触发 Dify 工作流并登记任务
   */
  @Post('/generate', { summary: '生成合同（触发 Dify）' })
  async generate(
    @Body()
    body: {
      contractName: string;
      customerName: string;
      amount: unknown;
      contractType: string | number;
      contractDetails: string;
    }
  ) {
    const taskId = uuidv4();
    const rawAmount = body.amount;
    if (rawAmount === null || rawAmount === undefined || rawAmount === '') {
      throw new CoolCommException('请填写合同金额');
    }
    const amountNum = Number(rawAmount);
    if (!Number.isFinite(amountNum) || amountNum < 0) {
      throw new CoolCommException('合同金额须为非负数字');
    }
    try {
      await this.companyContractService.startGenerate(taskId, {
        contractName: body.contractName,
        customerName: body.customerName,
        amount: amountNum,
        contractType: body.contractType,
        contractDetails: body.contractDetails,
      });
      return this.ok({ taskId });
    } catch (e: any) {
      await this.companyContractService.markFailed(
        taskId,
        e?.message || '触发 Dify 失败'
      );
      throw new CoolCommException(e?.message || '触发 Dify 失败');
    }
  }

  /**
   * 轮询任务状态
   */
  @Get('/poll', { summary: '查询合同生成状态' })
  async poll(@Query('taskId') taskId: string) {
    if (!taskId) {
      throw new CoolCommException('缺少 taskId');
    }
    const state = await this.companyContractService.getTask(taskId);
    if (!state) {
      return this.ok({ status: 'unknown', message: '任务不存在或已过期' });
    }
    return this.ok({
      status: state.status,
      fileUrl: state.fileUrl,
      message: state.message,
    });
  }

  /**
   * 带权限下载 /upload 下 docx（供前端预览）
   */
  @Get('/download', { summary: '下载合同 Word 文件' })
  async download(@Query('path') pathParam: string) {
    if (!pathParam) {
      throw new CoolCommException('缺少 path');
    }
    try {
      const diskPath = this.companyContractService.resolveUploadDiskPath(
        pathParam
      );
      if (!diskPath.toLowerCase().endsWith('.docx')) {
        throw new CoolCommException('仅支持 docx 文件');
      }
      this.ctx.set(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      const name = diskPath.split(/[/\\]/).pop() || 'contract.docx';
      this.ctx.set(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(name)}"`
      );
      this.ctx.body = createReadStream(diskPath);
    } catch (e: any) {
      throw new CoolCommException(e?.message || '读取文件失败');
    }
  }
}
