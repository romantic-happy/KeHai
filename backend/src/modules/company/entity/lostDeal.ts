import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 公司目录-未成单记录
 */
@Entity('company_lost_deal')
export class CompanyLostDealEntity extends BaseEntity {
  @Index()
  @Column({ comment: '客户名称', length: 200 })
  customerName: string;

  @Index()
  @Column({ comment: '报价单号', length: 100 })
  quoteNo: string;

  @Column({ comment: '项目名称', length: 200 })
  projectName: string;

  @Column({
    comment: '报价金额',
    type: 'decimal',
    precision: 14,
    scale: 2,
    nullable: true,
  })
  quoteAmount: number;

  @Index()
  @Column({ comment: '时间', type: 'datetime', nullable: true })
  lostTime: Date;

  @Column({ comment: '联系人', length: 100, nullable: true })
  contactPerson: string;

  @Column({ comment: '丢单原因', type: 'text', nullable: true })
  lostReason: string;

  @Index()
  @Column({ comment: '关联询价ID', nullable: true })
  inquiryId: number;
}
