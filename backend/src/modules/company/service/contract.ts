import { BaseService } from '@cool-midway/core';
import { Config, Inject, Provide } from '@midwayjs/core';
import { InjectClient } from '@midwayjs/core';
import { CachingFactory, MidwayCache } from '@midwayjs/cache-manager';
import axios from 'axios';
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import * as fs from 'fs';
import * as moment from 'moment';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { pUploadPath } from '../../../comm/path';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

export type ContractTaskStatus = 'pending' | 'ready' | 'failed';

export interface ContractTaskState {
  status: ContractTaskStatus;
  fileUrl?: string;
  message?: string;
  createdAt: number;
}

/**
 * 公司目录-合同（Dify Webhook + Word 生成）
 */
@Provide()
export class CompanyContractService extends BaseService {
  @Config('contract')
  contractConfig: {
    difyWebhookUrl?: string;
    callbackSecret?: string;
  };

  @InjectClient(CachingFactory, 'default')
  midwayCache: MidwayCache;

  private taskKey(taskId: string) {
    return `company:contract:task:${taskId}`;
  }

  /**
   * 将正文按行写入 docx
   */
  // async generateDocxBuffer(text: string, title?: string): Promise<Buffer> {
  //   const lines = String(text || '').split(/\r?\n/);
  //   const children: Paragraph[] = [];
  //   if (title) {
  //     children.push(
  //       new Paragraph({
  //         text: title,
  //         heading: HeadingLevel.HEADING_1,
  //       })
  //     );
  //   }
  //   for (const line of lines) {
  //     children.push(
  //       new Paragraph({
  //         children: [new TextRun({ text: line.length ? line : ' ' })],
  //       })
  //     );
  //   }
  //   const doc = new Document({
  //     sections: [
  //       {
  //         children,
  //       },
  //     ],
  //   });
  //   const buf = await Packer.toBuffer(doc);
  //   return Buffer.from(buf);
  // }

  // private extractLooseJsonStringField(
  //   raw: string,
  //   fieldName: string
  // ): string | null {
  //   const needle = `"${fieldName}"`;
  //   const pos = raw.indexOf(needle);
  //   if (pos < 0) return null;
  //   let i = pos + needle.length;
  //   while (i < raw.length && /\s/.test(raw[i])) i++;
  //   if (raw[i] !== ':') return null;
  //   i++;
  //   while (i < raw.length && /\s/.test(raw[i])) i++;
  //   if (raw[i] !== '"') return null;
  //   i++;
  //   let out = '';
  //   while (i < raw.length) {
  //     const c = raw[i];
  //     if (c === '\\' && i + 1 < raw.length) {
  //       const n = raw[i + 1];
  //       if (n === 'n') {
  //         out += '\n';
  //         i += 2;
  //       } else if (n === 'r') {
  //         out += '\r';
  //         i += 2;
  //       } else if (n === 't') {
  //         out += '\t';
  //         i += 2;
  //       } else if (n === '\\' || n === '"') {
  //         out += n;
  //         i += 2;
  //       } else if (n === 'u' && i + 5 < raw.length) {
  //         const hex = raw.slice(i + 2, i + 6);
  //         if (/^[0-9a-fA-F]{4}$/.test(hex)) {
  //           out += String.fromCharCode(parseInt(hex, 16));
  //           i += 6;
  //         } else {
  //           out += c;
  //           i++;
  //         }
  //       } else {
  //         out += n;
  //         i += 2;
  //       }
  //       continue;
  //     }
  //     if (c === '"') break;
  //     out += c;
  //     i++;
  //   }
  //   return out;
  // }

  // private normalizeContractRawToPlainText(raw: string): string {
  //   let s = String(raw ?? '').trim();
  //   if (!s) return s;

  //   const fence = /^```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```$/i.exec(s);
  //   if (fence) {
  //     s = fence[1].trim();
  //   }

  //   const tryParseObject = (jsonStr: string): Record<string, unknown> | null => {
  //     try {
  //       const v = JSON.parse(jsonStr);
  //       return v !== null && typeof v === 'object' && !Array.isArray(v)
  //         ? (v as Record<string, unknown>)
  //         : null;
  //     } catch {
  //       return null;
  //     }
  //   };

  //   let obj = tryParseObject(s);
  //   if (!obj) {
  //     try {
  //       const once = JSON.parse(s);
  //       if (typeof once === 'string') {
  //         obj = tryParseObject(once.trim());
  //       }
  //     } catch {
  //       /* 非 JSON */
  //     }
  //   }

  //   if (obj) {
  //     const o = obj;
  //     const pick = (k: string) =>
  //       typeof o[k] === 'string' ? (o[k] as string) : undefined;
  //     const named =
  //       pick('合同内容') ??
  //       pick('contractText') ??
  //       pick('content') ??
  //       pick('text');
  //     if (named != null) return named;

  //     const keys = Object.keys(o);
  //     if (keys.length === 1 && typeof o[keys[0]] === 'string') {
  //       return o[keys[0]] as string;
  //     }

  //     const strVals = Object.values(o).filter(
  //       (v): v is string => typeof v === 'string' && v.trim().length > 0
  //     );
  //     if (strVals.length > 0) {
  //       strVals.sort((a, b) => b.length - a.length);
  //       return strVals[0];
  //     }
  //   }

  //   const loose =
  //     this.extractLooseJsonStringField(s, '合同内容') ??
  //     this.extractLooseJsonStringField(s, 'contractText') ??
  //     this.extractLooseJsonStringField(s, 'content') ??
  //     this.extractLooseJsonStringField(s, 'text');
  //   if (loose != null) return loose;

  //   return String(raw ?? '').trim();
  // }

  // ======================新方式：填充模板生成docx======================

  async generateDocxByTemplate(
    templateFileName: string, //模板文件名
    data: Record<string, any> //contractData数据
  ): Promise<Buffer> {
    //模板存放路径
    const templatePath = path.join(
      __dirname,
      '../../../../public/contracttemplate',
      templateFileName
    );

    //读取模板文件
    const templateContent = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(templateContent);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.setData(data);
    doc.render();

    //生成buffer
    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });
    return buf;
  }


  /**
   * 文件名安全化（防路径穿越）
   */
  private sanitizeFileBase(name: string): string {
    const base = path.basename(name || 'contract').replace(/[^\w\u4e00-\u9fa5\-_.]/g, '_');
    return base.slice(0, 80) || 'contract';
  }

  /**
   * 写入上传目录，返回 /upload/ 开头的相对 URL
   */
  saveToUpload(buffer: Buffer, fileBaseName: string): string {
    const dateDir = moment().format('YYYYMMDD');
    const dir = path.join(pUploadPath(), dateDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const safe = this.sanitizeFileBase(fileBaseName);
    const unique = `${uuidv4()}_${safe}.docx`;
    const fullPath = path.join(dir, unique);
    fs.writeFileSync(fullPath, buffer);
    return `/upload/${dateDir}/${unique}`;
  }

  async getTask(taskId: string): Promise<ContractTaskState | undefined> {
    const v = await this.midwayCache.get(this.taskKey(taskId));
    return v as ContractTaskState | undefined;
  }

  private async setTask(taskId: string, state: ContractTaskState) {
    await this.midwayCache.set(
      this.taskKey(taskId),
      state,
      60 * 60 * 1000
    );
  }

  /**
   * 调用 Dify Workflow Webhook
   */
  async triggerDify(inputs: Record<string, unknown>) {
    const url = this.contractConfig?.difyWebhookUrl;
    if (!url) {
      throw new Error('未配置 Dify Webhook 地址（contract.difyWebhookUrl / DIFY_CONTRACT_WEBHOOK_URL）');
    }
    const reqConfig = {
      timeout: 120000,
      headers: { 'Content-Type': 'application/json' },
      validateStatus: (s: number) => s >= 200 && s < 300,
    };

    try {
      // 首选 Dify 常见结构：{ inputs: {...} }
      await axios.post(url, { inputs }, reqConfig);
    } catch (e: any) {
      const status = e?.response?.status;
      // 兼容某些 webhook 直接要求平铺字段
      if (status === 400) {
        try {
          await axios.post(url, inputs, reqConfig);
          return;
        } catch (e2: any) {
          const detail =
            e2?.response?.data?.message ||
            e2?.response?.data?.error ||
            JSON.stringify(e2?.response?.data || {});
          throw new Error(`Dify 请求失败(${e2?.response?.status || 0})：${detail}`);
        }
      }
      const detail =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        '未知错误';
      throw new Error(`Dify 请求失败(${status || 0})：${detail}`);
    }
  }

  /**
   * 管理端：发起生成（先登记任务再触发 Dify）
   */

  async startGenerate(
    taskId: string,
    inputs: {
      contractName: string;
      customerName: string;
      amount: number;
      // contractType: string | number;
      contractType: string;
      contractDetails: string;
    }
  ) {
    await this.setTask(taskId, {
      status: 'pending',
      createdAt: Date.now(),
    });
    await this.triggerDify({
      taskId,
      contractName: inputs.contractName,
      customerName: inputs.customerName,
      amount: inputs.amount,
      contractType: inputs.contractType,
      contractDetails: inputs.contractDetails,
    });

  }

  /**
   * Dify HTTP 节点回调：写入 Word 并标记任务完成
   */
  // async completeFromCallback(
  //   taskId: string,
  //   contractText: string,
  //   contractName?: string
  // ): Promise<string> {
  //   const exist = await this.getTask(taskId);
  //   if (!exist) {
  //     throw new Error('无效的任务 taskId，请确认 Webhook 与 HTTP 节点使用了同一 taskId');
  //   }
  //   const plain = this.normalizeContractRawToPlainText(contractText);
  //   const buf = await this.generateDocxBuffer(
  //     plain,
  //     contractName || undefined
  //   );
  //   const baseName = contractName || `contract_${taskId}`;
  //   const fileUrl = this.saveToUpload(buf, baseName);
  //   await this.setTask(taskId, {
  //     status: 'ready',
  //     fileUrl,
  //     createdAt: exist.createdAt,
  //   });
  //   return fileUrl;
  // }
  //====================新：透传合同类型并选择模板=========
  async completeFromCallback(
    taskId: string,
    contractText: any,
    contractType: string,
    contractName?: string
  ): Promise<string> {
    const exist = await this.getTask(taskId);
    if (!exist) throw new Error('无效taskId');

    //注意contractType也是字符串形式的 0,1,2等
    const templateMap = {
      '0': '项目类（搬迁改造）合同.docx',
      '1': '机械类（维保）合同.docx',
      '2': '调试类合同.docx',
      '3': '电气（排故维修）类合同.docx',
      '4': '备品备件合同.docx',
    };
    const templateFile = templateMap[contractType];

    //用模板生成docx
    const buf = await this.generateDocxByTemplate(templateFile, contractText);
    const baseName = contractName || `contract_${taskId}`;
    const fileUrl = this.saveToUpload(buf, baseName);

    await this.setTask(taskId, {
      status: 'ready',
      fileUrl,
      createdAt: exist.createdAt,
    });
    return fileUrl;
  }

  async markFailed(taskId: string, message: string) {
    const exist = (await this.getTask(taskId)) || {
      status: 'pending' as const,
      createdAt: Date.now(),
    };
    await this.setTask(taskId, {
      status: 'failed',
      message,
      createdAt: exist.createdAt,
    });
  }

  /**
   * 校验开放接口密钥
   */
  validateCallbackSecret(headerSecret: string | undefined) {
    const expected = this.contractConfig?.callbackSecret;
    if (!expected) {
      throw new Error('未配置回调密钥（contract.callbackSecret / DIFY_CONTRACT_CALLBACK_SECRET）');
    }
    if (!headerSecret || headerSecret !== expected) {
      throw new Error('密钥无效');
    }
  }

  /**
   * 解析 /upload/ 相对路径为磁盘绝对路径（并校验在上传目录内）
   */
  resolveUploadDiskPath(uploadUrlPath: string): string {
    if (!uploadUrlPath || typeof uploadUrlPath !== 'string') {
      throw new Error('路径无效');
    }
    const normalized = uploadUrlPath.split('?')[0].trim();
    if (!normalized.startsWith('/upload/')) {
      throw new Error('仅允许访问 /upload 下文件');
    }
    const rel = normalized.replace(/^\/upload\/?/, '');
    if (rel.includes('..') || path.isAbsolute(rel)) {
      throw new Error('非法路径');
    }
    const base = pUploadPath();
    const full = path.resolve(base, rel);
    if (!full.startsWith(path.resolve(base) + path.sep)) {
      throw new Error('路径越界');
    }
    if (!fs.existsSync(full)) {
      throw new Error('文件不存在');
    }
    return full;
  }
}
