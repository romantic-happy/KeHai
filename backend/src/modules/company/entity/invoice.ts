import { BaseEntity, transformerJson } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/** 开票明细行（JSON 存储） */
export type InvoiceDetailRow = {
  orderId: number;
  customerName: string;
  orderNo: string;
  planRepayLabel: string;
  actualRepayLabel: string;
  invoiceAmount: number;
  currency: string;
};

/**
 * 公司目录-开票管理
 */
@Entity('company_invoice')
export class CompanyInvoiceEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ comment: '开票单号', length: 50 })
  invoiceNo: string;

  @Index()
  @Column({ comment: '关联客户ID' })
  customerId: number;

  @Column({ comment: '客户名称', length: 200 })
  customerName: string;

  @Column({
    comment: '关联合同订单ID列表（company_contract_order.id）',
    type: 'json',
    transformer: transformerJson,
  })
  contractOrderIds: number[];

  @Column({ comment: '合同订单展示文本', type: 'text', nullable: true })
  contractOrderLabels: string;

  @Column({ comment: '预计回款日期', length: 20 })
  expectedPaybackDate: string;

  @Column({
    comment: '开票金额',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  invoiceAmount: number;

  @Column({ comment: '开票类型 vat_special / vat_normal', length: 32, nullable: true })
  invoiceType: string;

  @Column({ comment: '负责人用户ID', nullable: true })
  ownerUserId: number;

  @Column({
    comment: '协作人用户ID列表',
    type: 'json',
    nullable: true,
    transformer: transformerJson,
  })
  collaboratorUserIds: number[];

  @Column({ comment: '备注', type: 'text', nullable: true })
  remark: string;

  @Column({
    comment: '开票明细分项',
    type: 'json',
    transformer: transformerJson,
  })
  detailRows: InvoiceDetailRow[];

  @Column({ comment: '税号', length: 100, nullable: true })
  taxNo: string;

  @Column({ comment: '开户行名称', length: 200, nullable: true })
  bankName: string;

  @Column({ comment: '开户账号', length: 100, nullable: true })
  bankAccount: string;

  @Column({ comment: '开户行行号', length: 50, nullable: true })
  bankBranchCode: string;

  @Column({ comment: '创建人ID', nullable: true })
  createUserId: number;
}
