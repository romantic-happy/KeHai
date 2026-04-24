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
  private readonly DIFY_API_URL = 'http://10.10.2.103:6859/v1/workflows/run'; // TODO
  private readonly RESPONSE_MODE = 'blocking';
  private readonly DIFY_USER = '2782129289@qq.com';

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

  async runWorkflow(
    workflowKey: string,
    inputs: Record<string, any>
  ): Promise<DifyResponse> {
    const config = this.workflowMap.get(workflowKey);
    if (!config)
      return { success: false, error: `未找到工作流: ${workflowKey}` };

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
}
