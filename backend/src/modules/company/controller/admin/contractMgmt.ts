import { Body, Get, Inject, Post, Query } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { CoolController, BaseController, CoolCommException } from '@cool-midway/core';
import { CompanyContractMgmtEntity } from '../../entity/contractMgmt';
import { CompanyContractMgmtService } from '../../service/contractMgmt';
import { CompanyContractService } from '../../service/contract';
import { createReadStream, existsSync } from 'fs';

@CoolController({
  api: ['add', 'update', 'info', 'list', 'page'],
  entity: CompanyContractMgmtEntity,
  service: CompanyContractMgmtService,
  insertParam: ctx => {
    return { createUserId: ctx.admin.userId };
  },
  pageQueryOp: {
    keyWordLikeFields: ['a.contractNo', 'a.contractName', 'a.customerName'],
    fieldEq: ['a.contractCategory', 'a.contractStatus'],
    select: ['a.*'],
  },
  serviceApis: [
    { method: 'contractPage', summary: '合同高级分页查询' },
    { method: 'contractInfo', summary: '合同详情查询' },
    { method: 'logicDelete', summary: '逻辑删除合同' },
    { method: 'getCategories', summary: '获取合同类别列表' },
  ],
})
export class AdminCompanyContractMgmtController extends BaseController {
  @Inject()
  ctx: Context;

  @Inject()
  contractMgmtService: CompanyContractMgmtService;

  @Inject()
  companyContractService: CompanyContractService;

  @Post('/delete', { summary: '逻辑删除合同' })
  async softDelete(@Body() body: { id?: number; ids?: number[] }) {
    if (!body.id && !body.ids?.length) {
      throw new CoolCommException('缺少合同ID');
    }
    await this.contractMgmtService.logicDelete(body.id || body.ids);
    return this.ok();
  }

  @Get('/categories', { summary: '获取合同类别列表（含模板路径）' })
  async categories() {
    const result = await this.contractMgmtService.getCategories();
    return this.ok(result);
  }

  @Get('/template', { summary: '下载合同模板文件' })
  async downloadTemplate(@Query('category') category: number) {
    if (category === undefined || category === null) {
      throw new CoolCommException('缺少合同类别');
    }
    const diskPath = this.contractMgmtService.getTemplateDiskPath(category);
    if (!diskPath) {
      throw new CoolCommException('该类别无对应模板');
    }
    if (!diskPath.toLowerCase().endsWith('.docx')) {
      throw new CoolCommException('仅支持 docx 文件');
    }
    if (!existsSync(diskPath)) {
      throw new CoolCommException('模板文件不存在，请先部署模板');
    }
    this.ctx.set(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    const name = diskPath.split(/[/\\]/).pop() || 'template.docx';
    this.ctx.set(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(name)}"`
    );
    this.ctx.body = createReadStream(diskPath);
  }

  @Get('/download', { summary: '下载合同文件' })
  async download(@Query('path') pathParam: string) {
    if (!pathParam) {
      throw new CoolCommException('缺少文件路径');
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
