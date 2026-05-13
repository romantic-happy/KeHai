import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

@Entity('company_plan_repay')
export class CompanyPlanRepayEntity extends BaseEntity {
  @Index()
  @Column({ comment: '关联开票ID', nullable: true })
  invoiceId: number;

  @Index()
  @Column({ comment: '开票单号', length: 50, nullable: true })
  invoiceNo: string;

  @Index()
  @Column({ comment: '客户ID', nullable: true })
  customerId: number;

  @Column({ comment: '客户名称', length: 200, nullable: true })
  customerName: string;

  @Column({ comment: '关联合同订单ID', nullable: true })
  contractOrderId: number;

  @Column({ comment: '合同订单号', length: 80, nullable: true })
  contractOrderNo: string;

  @Column({ comment: '预计回款日期', length: 20, nullable: true })
  expectedPaybackDate: string;

  @Column({
    comment: '开票金额',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  invoiceAmount: number;

  @Column({ comment: '货币名称', length: 20, nullable: true })
  currency: string;

  @Index()
  @Column({
    comment: '回款状态 0-未回款 1-已回款',
    type: 'tinyint',
    default: 0,
  })
  repayStatus: number;

  @Column({ comment: '实际回款金额', type: 'decimal', precision: 14, scale: 2, nullable: true })
  actualRepayAmount: number;

  @Column({ comment: '实际回款日期', length: 20, nullable: true })
  actualRepayDate: string;

  @Column({ comment: '备注', type: 'text', nullable: true })
  remark: string;
}
