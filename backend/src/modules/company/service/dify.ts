import { Provide } from '@midwayjs/core';
import axios from 'axios';
import difyConfigs, {
  DifyWorkflowConfig,
  DifyInputConfig,
} from '../dify.config';

export interface DifyResponse {
  success: boolean;
  data?: any;
  error?: string;
}

@Provide()
export class DifyService {
  private readonly DIFY_API_URL =
    process.env.DIFY_API_URL || 'http://119.146.180.66:6859/v1/workflows/run';
  private readonly RESPONSE_MODE = process.env.DIFY_RESPONSE_MODE || 'blocking';
  private readonly DIFY_USER = process.env.DIFY_USER || 'kehai-supplier-user';

  private workflowMap: Map<string, DifyWorkflowConfig> = new Map();

  constructor() {
    this.initWorkflows();
  }

  private initWorkflows() {
    difyConfigs.forEach(config => {
      this.workflowMap.set(config.key, config);
    });
  }

  private validateInput(config: DifyInputConfig, value: any): string | null {
    const { name, required, type } = config;
    if (required && (value === undefined || value === null || value === '')) {
      return `参数 "${name}" 为必填项`;
    }
    if (value === undefined || value === null || value === '') {
      return null;
    }
    const actualType = typeof value;
    if (actualType !== type) {
      return `参数 "${name}" 类型错误，期望 ${type}，实际 ${actualType}`;
    }
    return null;
  }

  private validateInputs(
    config: DifyWorkflowConfig,
    inputs: Record<string, any>
  ): string | null {
    for (const inputConfig of config.inputs) {
      const error = this.validateInput(inputConfig, inputs[inputConfig.name]);
      if (error) return error;
    }
    return null;
  }

  private getMissingApiKeyMessage(workflowKey: string) {
    if (workflowKey === 'supplierBackgroundCheck') {
      return '供应商 AI 背调未配置 Dify API Key';
    }
    if (workflowKey === 'supplierProfile') {
      return '供应商 AI 画像未配置 Dify API Key';
    }
    return `工作流 ${workflowKey} 未配置 Dify API Key`;
  }

  private normalizeWorkflowOutput(data: any) {
    const parseText = (text: string) => {
      try {
        return JSON.parse(text);
      } catch {
        return { rawText: text };
      }
    };

    if (typeof data === 'string') {
      return parseText(data);
    }

    if (data && typeof data === 'object') {
      for (const key of ['text', 'result', 'output', 'answer']) {
        if (typeof data[key] === 'string') {
          return parseText(data[key]);
        }
      }
    }

    return data;
  }

  async runWorkflow(
    workflowKey: string,
    inputs: Record<string, any>
  ): Promise<DifyResponse> {
    const config = this.workflowMap.get(workflowKey);
    if (!config)
      return { success: false, error: `未找到工作流: ${workflowKey}` };

    if (!config.apiKey) {
      return {
        success: false,
        error: this.getMissingApiKeyMessage(workflowKey),
      };
    }

    const validationError = this.validateInputs(config, inputs);
    if (validationError) return { success: false, error: validationError };

    try {
      const response = await axios.post(
        this.DIFY_API_URL,
        { inputs, response_mode: this.RESPONSE_MODE, user: this.DIFY_USER },
        {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 300000,
        }
      );
      return { success: true, data: response.data?.data?.outputs };
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.message || error.message || 'Dify 调用失败',
      };
    }
  }

  async queryMaterialPrice(brand: string, name: string, dimension: string) {
    const result = await this.runWorkflow('materialQuote', {
      brand,
      name,
      dimension,
    });
    if (!result.success) throw new Error(result.error);
    return {
      unitPriceExclTax: result.data?.pricewithouttax,
      unitPriceInclTax: result.data?.pricewithtax,
      explanation: result.data?.explanation,
    };
  }

  async getCustomerInfo(name: string) {
    const result = await this.runWorkflow('customerInfo', {
      name,
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  }

  async getReceptionScript(user_name: string) {
    const result = await this.runWorkflow('receptionScript', {
      user_name,
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  }

  async getSupplierRecommend(name: string, dimension: string) {
    const result = await this.runWorkflow('supplierRecommend', {
      name,
      dimension,
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  }

  async analyzeLead(title: string, detail: string) {
    const result = await this.runWorkflow('leadAnalysis', {
      title,
      detail,
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  }

  async analyzeFollowUp(customerName: string, details: string) {
    const result = await this.runWorkflow('followUpAnalysis', {
      customerName,
      details,
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  }

  async analyzePortrait(name: string) {
    const result = await this.runWorkflow('customerPortrait', {
      name,
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  }

  async analyzeCustomerOrder(
    name: string,
    docking_record: string,
    Order_Records: string,
    Unclosed_Order_Records: string
  ) {
    const result = await this.runWorkflow('customerOrderAnalysis', {
      name,
      docking_record,
      Order_Records,
      Unclosed_Order_Records,
    });
    if (!result.success) throw new Error(result.error);
    return {
      text: result.data?.text,
    };
  }

  async getKeyPersonGuide(inputs: {
    customerName: string;
    name: string;
    position: string;
    roleType: string;
    lastContactContent: string;
    remark: string;
    birthday: string;
  }) {
    const config = this.workflowMap.get('keyPersonGuide');
    if (!config?.apiKey || /todo/i.test(config.apiKey)) {
      throw new Error('keyPersonGuide 未配置真实 Dify API Key');
    }

    const result = await this.runWorkflow('keyPersonGuide', {
      customerName: inputs.customerName,
      name: inputs.name,
      position: inputs.position,
      roleType: inputs.roleType,
      lastContactContent: inputs.lastContactContent || '',
      remark: inputs.remark || '',
      birthday: inputs.birthday || '',
    });
    if (!result.success) throw new Error(result.error);
    return this.normalizeWorkflowOutput(result.data);
  }

  async analyzeSupplierBackground(inputs: Record<string, any>) {
    const result = await this.runWorkflow('supplierBackgroundCheck', inputs);
    if (!result.success) throw new Error(result.error);
    return this.normalizeWorkflowOutput(result.data);
  }

  async analyzeSupplierProfile(inputs: Record<string, any>) {
    const result = await this.runWorkflow('supplierProfile', inputs);
    if (!result.success) throw new Error(result.error);
    return this.normalizeWorkflowOutput(result.data);
  }
}
