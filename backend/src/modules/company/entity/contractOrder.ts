import { BaseEntity, transformerJson } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 合同/订单（供开票等环节选择关联订单；可后续与合同模块对接扩展）
 */
@Entity('company_contract_order')
export class CompanyContractOrderEntity extends BaseEntity {
  @Index()
  @Column({ comment: '客户ID（company_customer.id）', nullable: true })
  customerId: number;

  @Column({ comment: '客户名称', length: 100, nullable: true })
  customerName: string;

  @Index()
  @Column({ comment: '合同/订单号', length: 80 })
  orderNo: string;

  @Index()
  @Column({ comment: '来源询价ID', nullable: true })
  inquiryId: number;

  @Column({ comment: '标题/摘要', length: 300, nullable: true })
  title: string;

  @Column({ comment: '负责人', length: 100, nullable: true })
  ownerName: string;

  @Index()
  @Column({ comment: '交付日期', type: 'date', nullable: true })
  deliveryDate: Date;

  @Column({ comment: '交付标准', type: 'text', nullable: true })
  deliverStandard: string;

  @Index()
  @Column({ comment: '报价ID', nullable: true })
  quoteId: number;

  @Column({ comment: '报价单号', length: 50, nullable: true })
  quoteNo: string;

  @Column({
    comment: '合同金额',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  contractAmount: number;

  @Column({ comment: '计划回款展示', type: 'text', nullable: true })
  planRepayLabel: string;

  @Column({ comment: '实际回款展示', type: 'text', nullable: true })
  actualRepayLabel: string;

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
}
