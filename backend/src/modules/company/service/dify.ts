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
      return `Parameter "${name}" is required`;
    }
    if (value === undefined || value === null || value === '') {
      return null;
    }
    const actualType = typeof value;
    if (actualType !== type) {
      return `Parameter "${name}" type error, expected ${type}, actual ${actualType}`;
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
      return 'Supplier AI background check Dify API Key is not configured';
    }
    return `Workflow ${workflowKey} Dify API Key is not configured`;
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
      return { success: false, error: `Workflow not found: ${workflowKey}` };

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
        this.DIFY_API_URL!,
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
          error.response?.data?.message || error.message || 'Dify call failed',
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

  async supplierBackgroundCheck(params: {
    supplierName: string;
    supplierType: string;
    supplierSource?: string;
    contactName: string;
    contactInfo?: string;
    supplierNature?: string;
    businessCategory?: string;
    paymentTerm?: string;
    cooperationRelation?: string;
    managementStatus?: string;
    remark?: string;
  }) {
    const result = await this.runWorkflow('supplierBackgroundCheck', params);
    if (!result.success) throw new Error(result.error);
    // console.info(result.data);
    return {
      message: result.data?.message || result.data?.result || 'Background check completed',
      prompt: result.data,
    };
  }
}
