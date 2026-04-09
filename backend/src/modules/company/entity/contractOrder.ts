import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 合同/订单（供开票等环节选择关联订单；可后续与合同模块对接扩展）
 */
@Entity('company_contract_order')
export class CompanyContractOrderEntity extends BaseEntity {
  @Index()
  @Column({ comment: '客户ID（company_customer.id）' })
  customerId: number;

  @Index()
  @Column({ comment: '合同/订单号', length: 80 })
  orderNo: string;

  @Column({ comment: '标题/摘要', length: 300, nullable: true })
  title: string;

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
}
