import { BaseEntity, transformerJson } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 公司目录-询价
 */
@Entity('company_inquiry')
export class CompanyInquiryEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ comment: '询价单号', length: 50 })
  inquiryNo: string;

  @Index()
  @Column({
    comment: '询价类型',
    dict: ['机械加工类', '机械维修类', '机械保养类', '项目类', '备件类'],
    type: 'tinyint',
    default: 0,
  })
  inquiryType: number;

  @Index()
  @Column({ comment: '客户', length: 100 })
  customer: string;

  @Column({
    comment: '协作人ID列表',
    nullable: true,
    type: 'json',
    transformer: transformerJson,
  })
  collaboratorUserIds: number[];

  @Index()
  @Column({ comment: '报价截止日期', type: 'date', nullable: true })
  deadlineDate: Date;

  @Column({
    comment: '附件URL列表',
    nullable: true,
    type: 'json',
    transformer: transformerJson,
  })
  attachments: string[];

  @Column({ comment: '备注', type: 'text', nullable: true })
  remark: string;

  @Column({
    comment: '产品明细',
    nullable: true,
    type: 'json',
    transformer: transformerJson,
  })
  productItems: {
    productName: string;
    brand?: string;
    model?: string;
    quantity?: number;
    unit?: string;
    supplierQuotePrice?: number;
    salesActualPrice?: number;
    remark?: string;
  }[];

  @Column({ comment: 'AI分类', length: 100, nullable: true })
  aiCategory: string;

  @Column({ comment: 'AI分类分析', type: 'text', nullable: true })
  aiCategoryAnalysis: string;

  @Column({ comment: 'AI历史报价', type: 'text', nullable: true })
  aiHistoryQuote: string;

  @Column({ comment: 'AI历史报价依据', type: 'text', nullable: true })
  aiHistoryQuoteBasis: string;

  @Index()
  @Column({
    comment: '报价业务状态',
    // 0:未报价 1：报价中 2：已报价 3：已逾期 4：已失效
    dict: ['未报价', '报价中', '已报价', '已逾期', '已失效'],
    type: 'tinyint',
    default: 0,
  })
  quoteBizStatus: number;

  @Column({ comment: '驳回原因', type: 'text', nullable: true })
  rejectReason: string;

  @Column({ comment: '销售报价', type: 'decimal', precision: 14, scale: 2, nullable: true })
  salesQuote: number;

  @Column({ comment: '销售报价备注', type: 'text', nullable: true })
  salesQuoteRemark: string;

  @Column({ comment: '销售报价时间', type: 'datetime', nullable: true })
  salesQuoteTime: Date;

  @Index()
  @Column({
    comment: '是否成单',
    // 0：未确认 1：未成单 2：已成单
    dict: ['未确认', '未成单', '已成单'],
    type: 'tinyint',
    default: 0,
  })
  dealStatus: number;

  @Column({ comment: '丢单原因', type: 'text', nullable: true })
  lostReason: string;

  @Column({ comment: '合同订单号', length: 100, nullable: true })
  contractOrderNo: string;

  @Index()
  @Column({ comment: '项目名称', length: 200 })
  projectName: string;

  @Column({
    comment: '项目地点（省市县）',
    nullable: true,
    type: 'json',
    transformer: transformerJson,
  })
  projectLocation: {
    province?: string;
    city?: string;
    county?: string;
    code?: string;
  };

  @Column({ comment: '具体地址', length: 255, nullable: true })
  address: string;

  @Index()
  @Column({ comment: '项目工期开始', type: 'date', nullable: true })
  projectStartDate: Date;

  @Index()
  @Column({ comment: '项目工期结束', type: 'date', nullable: true })
  projectEndDate: Date;

  @Column({ comment: '设备品牌', length: 100, nullable: true })
  equipmentBrand: string;

  @Column({ comment: '设备型号及数量', type: 'text', nullable: true })
  equipmentModelQty: string;

  @Column({ comment: '交付标准', type: 'text', nullable: true })
  deliverStandard: string;

  @Column({ comment: '售后要求', type: 'text', nullable: true })
  afterSalesRequirement: string;

  // ===================== 通用补充需求 =====================

  @Column({ comment: '备件明细', type: 'text', nullable: true })
  sparePartsDetail: string;

  @Column({
    comment: '备件明细列表（多物料）',
    nullable: true,
    type: 'json',
    transformer: transformerJson,
  })
  spareItems: {
    // 物料名称
    name: string;
    // 物料大类
    categoryBig?: string;
    // 物料小类
    categorySmall?: string;
    // 规格型号
    spec?: string;
    // 数量（如需）
    quantity?: string;
    // 品牌
    brand?: string;
  }[];

  @Column({ comment: '工具要求', type: 'text', nullable: true })
  toolRequirement: string;

  @Column({ comment: '软件要求', type: 'text', nullable: true })
  softwareRequirement: string;

  @Column({
    comment: '吊装需求',
    dict: ['无', '吊装机', '龙门架', '现场建筑', '其他'],
    type: 'tinyint',
    nullable: true,
  })
  hoistingRequirement: number;

  @Column({ comment: '能力需求', type: 'text', nullable: true })
  capabilityRequirement: string;

  @Column({ comment: '技工种及人数', type: 'text', nullable: true })
  workerTypeAndCount: string;

  @Column({
    comment: '具体人员（内部人员/委外）',
    type: 'text',
    nullable: true,
  })
  specificPersonnel: string;

  @Column({ comment: '初步施工方案', type: 'text', nullable: true })
  initialConstructionPlan: string;

  @Column({ comment: '创建人ID', nullable: true })
  createUserId: number;

  @Index()
  @Column({ comment: '负责人姓名（默认填写人）', length: 100, nullable: true })
  ownerName: string;

  // @Index()
  // @Column({
  //   comment: '报价状态',
  //   // 0：待报价（未收到供应链报价）
  //   // 1：报价中（已收到供应链报价，销售尚未接受）
  //   // 2：报价已定（销售已接受供应链报价，可转合同）
  //   dict: ['待报价', '报价中', '报价已定'],
  //   type: 'tinyint',
  //   default: 0,
  // })
  // quoteStatus: number;

  @Index()
  @Column({ comment: '最新报价ID', nullable: true })
  quoteId: number;

  @Index()
  @Column({
    comment: '待重报标记 0-否 1-是',
    dict: ['否', '是'],
    type: 'tinyint',
    default: 0,
  })
  requotePending: number;

  // ===================== 机械加工类 =====================

  @Column({ comment: '加工要求', type: 'text', nullable: true })
  processingRequirement: string;

  @Column({
    comment: '图纸附件',
    nullable: true,
    type: 'json',
    transformer: transformerJson,
  })
  drawingAttachments: string[];

  // ===================== 机械维修类 =====================

  @Column({ comment: '维修类型（支持自填）', length: 50, nullable: true })
  repairType: string;

  @Column({ comment: '故障描述', type: 'text', nullable: true })
  faultDescription: string;

  @Column({
    comment: '现场环境',
    dict: ['本体落地装（正装）', '倒装', '高台', '不入场'],
    type: 'tinyint',
    nullable: true,
  })
  siteEnvironment: number;

  @Column({
    comment: '现场附件（图片/视频）',
    nullable: true,
    type: 'json',
    transformer: transformerJson,
  })
  siteAttachments: string[];

  @Column({
    comment: '明确调试归属',
    dict: ['不需要', '科海', '客户'],
    type: 'tinyint',
    nullable: true,
  })
  debugOwnership: number;

  // ===================== 机械保养类 =====================

  @Column({
    comment: '保养类型',
    dict: ['基础', '高级'],
    type: 'tinyint',
    nullable: true,
  })
  maintenanceType: number;

  @Column({ comment: '保养内容', type: 'text', nullable: true })
  maintenanceContent: string;

  @Column({ comment: '保养范围', type: 'text', nullable: true })
  maintenanceScope: string;

  // ===================== 项目类 =====================

  @Column({
    comment: '施工类型',
    dict: [
      '工作站搬迁',
      '工作站改造',
      '工作站恢复功能',
      '工作站翻新',
      '新建工作站',
    ],
    type: 'tinyint',
    nullable: true,
  })
  projectConstructType: number;

  @Column({ comment: '施工内容', type: 'text', nullable: true })
  projectConstructContent: string;

  @Column({
    comment: '施工内容附件（客户技术协议）',
    nullable: true,
    type: 'json',
    transformer: transformerJson,
  })
  projectConstructAttachments: string[];

  @Column({ comment: '现场环境描述', type: 'text', nullable: true })
  projectSiteEnvDesc: string;

  @Column({
    comment: '现场环境附件（图片+视频）',
    nullable: true,
    type: 'json',
    transformer: transformerJson,
  })
  projectSiteEnvAttachments: string[];
}
