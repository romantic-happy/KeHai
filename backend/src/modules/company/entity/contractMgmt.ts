import { BaseEntity, transformerJson } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 销售合同管理
 */
@Entity('company_contract_mgmt')
export class CompanyContractMgmtEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ comment: '合同编号', length: 80 })
  contractNo: string;

  @Index()
  @Column({ comment: '合同名称', length: 300 })
  contractName: string;

  @Index()
  @Column({
    comment: '合同类别',
    dict: ['项目类（搬迁改造）', '机械类（维保）', '调试类', '电气（排故维修）类', '备品备件'],
    type: 'tinyint',
    default: 0,
  })
  contractCategory: number;

  @Index()
  @Column({ comment: '客户ID', nullable: true })
  customerId: number;

  @Column({ comment: '客户名称', length: 200, nullable: true })
  customerName: string;

  @Column({
    comment: '合同金额',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  contractAmount: number;

  @Index()
  @Column({
    comment: '合同状态',
    dict: ['编辑中', '未审核', '已审核'],
    type: 'tinyint',
    default: 0,
  })
  contractStatus: number;

  @Column({ comment: '成单关键', length: 500, nullable: true })
  dealKey: string;

  @Column({ comment: '交付日期', type: 'date', nullable: true })
  deliveryDate: Date;

  @Column({ comment: '合同详情', type: 'text', nullable: true })
  contractDetails: string;

  @Column({ comment: '合同开始日期', type: 'date', nullable: true })
  startDate: Date;

  @Column({ comment: '合同结束日期', type: 'date', nullable: true })
  endDate: Date;

  @Column({ comment: '签订日期', type: 'date', nullable: true })
  signDate: Date;

  @Column({ comment: '合同文件路径', length: 500, nullable: true })
  filePath: string;

  @Column({ comment: '模板文件路径', length: 500, nullable: true })
  templatePath: string;

  @Column({
    comment: '合同附件',
    type: 'json',
    nullable: true,
    transformer: transformerJson,
  })
  contractAttachments: string[];

  @Column({ comment: '备注', type: 'text', nullable: true })
  remark: string;

  @Index()
  @Column({ comment: '来源询价ID', nullable: true })
  inquiryId: number;

  @Column({
    comment: '产品明细',
    type: 'json',
    nullable: true,
    transformer: transformerJson,
  })
  productItems: {
    productName: string;
    brand?: string;
    model?: string;
    quantity?: number;
    unit?: string;
    price?: number;
    remark?: string;
  }[];

  @Index()
  @Column({ comment: '创建人ID', nullable: true })
  createUserId: number;

  @Column({ comment: '创建人姓名', length: 100, nullable: true })
  createUserName: string;

  @Index()
  @Column({
    comment: '是否删除',
    type: 'tinyint',
    default: 0,
  })
  isDeleted: number;

  @Column({
    comment: '合同变量数据（用于模板填充）',
    type: 'json',
    nullable: true,
    transformer: transformerJson,
  })
  templateVariables: Record<string, any>;

  @Column({ comment: '版本号', default: 1 })
  version: number;
}
