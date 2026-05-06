/**
 * Dify 工作流配置文件
 */

export interface DifyInputConfig {
  name: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean';
}

export interface DifyWorkflowConfig {
  key: string;
  name: string;
  apiKey: string;
  inputs: DifyInputConfig[];
}

/**
 * 从环境变量获取 Dify API Key
 * 环境变量命名规则: DIFY_KEY_${workflowKey}
 * 例如: DIFY_KEY_materialQuote=app-xxx
 */
function getDifyApiKey(key: string, fallback: string): string {
  const envKey = `DIFY_KEY_${key}`;
  return process.env[envKey] || fallback;
}

export default [
  {
    key: 'materialQuote',
    name: '物料智能询价',
    apiKey: getDifyApiKey('materialQuote', 'TODO_REPLACE'),
    inputs: [
      { name: 'brand', required: true, type: 'string' },
      { name: 'name', required: true, type: 'string' },
      { name: 'dimension', required: true, type: 'string' },
    ],
  },
  {
    key: 'customerInfo',
    name: '客户信息提供',
    apiKey: getDifyApiKey('customerInfo', 'TODO_REPLACE'),
    inputs: [{ name: 'name', required: true, type: 'string' }],
  },
  {
    key: 'receptionScript',
    name: '客户接待话术',
    apiKey: getDifyApiKey('receptionScript', 'TODO_REPLACE'),
    inputs: [{ name: 'user_name', required: true, type: 'string' }],
  },
  {
    key: 'supplierRecommend',
    name: '供应商推荐',
    apiKey: getDifyApiKey('supplierRecommend', 'TODO_REPLACE'),
    inputs: [
      { name: 'name', required: true, type: 'string' },
      { name: 'dimension', required: true, type: 'string' },
    ],
  },
  {
    key: 'leadAnalysis',
    name: '线索智能分析',
    apiKey: getDifyApiKey('leadAnalysis', 'TODO_REPLACE'),
    inputs: [
      { name: 'title', required: true, type: 'string' },
      { name: 'detail', required: true, type: 'string' },
    ],
  },
  {
    key: 'customerPortrait',
    name: '客户画像生成',
    apiKey: getDifyApiKey('customerPortrait', 'TODO_REPLACE'),
    inputs: [{ name: 'name', required: true, type: 'string' }],
  },
  {
    key: 'customerOrderAnalysis',
    name: '客户订单分析',
    apiKey: getDifyApiKey('customerOrderAnalysis', 'TODO_REPLACE'),
    inputs: [
      { name: 'name', required: true, type: 'string' },
      { name: 'docking_record', required: true, type: 'string' },
      { name: 'Order_Records', required: true, type: 'string' },
      { name: 'Unclosed_Order_Records', required: true, type: 'string' },
    ],
  },
  {
    key: 'keyPersonGuide',
    name: '关键人 AI 销售指导',
    apiKey: 'app-Pm4oirrNCINeKXBdDykIBhhe',
    inputs: [
      { name: 'customerName', required: true, type: 'string' },
      { name: 'name', required: true, type: 'string' },
      { name: 'position', required: true, type: 'string' },
      { name: 'roleType', required: true, type: 'string' },
      { name: 'lastContactContent', required: false, type: 'string' },
      { name: 'remark', required: false, type: 'string' },
      { name: 'birthday', required: false, type: 'string' },
    ],
  },
  {
    key: 'supplierBackgroundCheck',
    name: '供应商 AI 背调',
    apiKey: 'app-s3GNinuZ8F6XXF0Xv1hy6mtM',
    inputs: [
      { name: 'supplierName', required: true, type: 'string' },
      { name: 'supplierType', required: false, type: 'string' },
      { name: 'supplierSource', required: false, type: 'string' },
      { name: 'contactName', required: false, type: 'string' },
      { name: 'contactInfo', required: false, type: 'string' },
      { name: 'supplierNature', required: false, type: 'string' },
      { name: 'businessCategory', required: false, type: 'string' },
      { name: 'paymentTerm', required: false, type: 'string' },
      { name: 'cooperationRelation', required: false, type: 'string' },
      { name: 'managementStatus', required: false, type: 'string' },
      { name: 'remark', required: false, type: 'string' },
    ],
  },
  {
    key: 'supplierProfile',
    name: '供应商 AI 画像',
    apiKey: 'app-yFuL7nraS36E8G2Z3XV5Sngc',
    inputs: [
      { name: 'supplierId', required: true, type: 'string' },
      { name: 'supplierName', required: true, type: 'string' },
      { name: 'supplierType', required: false, type: 'string' },
      { name: 'supplierSource', required: false, type: 'string' },
      { name: 'supplierNature', required: false, type: 'string' },
      { name: 'businessCategory', required: false, type: 'string' },
      { name: 'paymentTerm', required: false, type: 'string' },
      { name: 'cooperationRelation', required: false, type: 'string' },
      { name: 'managementStatus', required: false, type: 'string' },
      { name: 'remark', required: false, type: 'string' },
      { name: 'quoteRecordNote', required: false, type: 'string' },
      { name: 'quoteRecords', required: false, type: 'string' },
    ],
  },
] as DifyWorkflowConfig[];
