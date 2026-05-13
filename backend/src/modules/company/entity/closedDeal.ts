import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 公司目录-已成单记录
 */
@Entity('company_closed_deal')
export class CompanyClosedDealEntity extends BaseEntity {
  @Index()
  @Column({ comment: '客户名称', length: 200 })
  customerName: string;

  @Index()
  @Column({ comment: '合同编号', length: 100 })
  contractNo: string;

  @Column({ comment: '项目名称', length: 200 })
  projectName: string;

  @Column({
    comment: '合同金额',
    type: 'decimal',
    precision: 14,
    scale: 2,
    nullable: true,
  })
  contractAmount: number;

  @Index()
  @Column({ comment: '时间', type: 'datetime', nullable: true })
  dealTime: Date;

  @Column({ comment: '联系人', length: 100, nullable: true })
  contactPerson: string;

  @Column({ comment: '成单关键', type: 'text', nullable: true })
  dealKey: string;

  @Index()
  @Column({ comment: '关联询价ID', nullable: true })
  inquiryId: number;
}
