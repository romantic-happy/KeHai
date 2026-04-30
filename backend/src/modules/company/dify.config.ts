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

export default [
  {
    key: 'materialQuote',
    name: '物料智能询价',
    apiKey: 'app-DwJlTWY7azTC8osHFmDZ0IkR', // TODO
    inputs: [
      { name: 'brand', required: true, type: 'string' },
      { name: 'name', required: true, type: 'string' },
      { name: 'dimension', required: true, type: 'string' },
    ],
  },
  {
    key: 'customerInfo',
    name: '客户信息提供',
    apiKey: 'app-3wX5QOPsMa1JiwUHBHsh49Hg', // TODO
    inputs: [{ name: 'name', required: true, type: 'string' }],
  },
  {
    key: 'receptionScript',
    name: '客户接待话术',
    apiKey: 'app-0Hu24lwKapNjZQZoZYljILnf', // TODO
    inputs: [{ name: 'user_name', required: true, type: 'string' }],
  },
  {
    key: 'supplierRecommend',
    name: '供应商推荐',
    apiKey: 'app-fO76RrFaAA2DAODImOVcmYVs', // TODO
    inputs: [
      { name: 'name', required: true, type: 'string' },
      { name: 'dimension', required: true, type: 'string' },
    ],
  },
  {
    key: 'leadAnalysis',
    name: '线索智能分析',
    apiKey: 'app-wvN7QZhMFjMa808dEWEDszCN', // TODO: 替换为实际的API Key
    inputs: [
      { name: 'title', required: true, type: 'string' },
      { name: 'detail', required: true, type: 'string' },
    ],
  },
  {
    key: 'customerPortrait',
    name: '客户画像生成',
    apiKey: 'TODO_REPLACE_WITH_ACTUAL_KEY', // TODO: 等待焕峰分配 Key
    inputs: [{ name: 'name', required: true, type: 'string' }],
  },
  {
    key: 'customerOrderAnalysis',
    name: '客户订单分析',
    apiKey: 'app-yyaJ0pp53bdqddr8dg72ahUT', // TODO: 请替换为实际的 API Key
    inputs: [
      { name: 'name', required: true, type: 'string' },
      { name: 'docking_record', required: true, type: 'string' },
      { name: 'Order_Records', required: true, type: 'string' },
      { name: 'Unclosed_Order_Records', required: true, type: 'string' },
    ],
  },
] as DifyWorkflowConfig[];
