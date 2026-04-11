import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 公司目录-销售部-线索
 */
@Entity('company_lead')
export class CompanyLeadEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ comment: '线索编号', length: 50 })
  leadNo: string;

  @Index()
  @Column({ comment: '线索题目', length: 200 })
  leadTitle: string;

  @Column({ comment: '线索详情', type: 'text' })
  leadDetail: string;

  @Index()
  @Column({
    comment: '线索状态',
    dict: ['待跟进', '跟进中', '转化成功', '已放弃'],
    type: 'tinyint',
    default: 0,
  })
  leadStatus: number;

  @Column({ comment: 'AI线索分析', type: 'text', nullable: true })
  aiAnalysis: string;

  @Index()
  @Column({ comment: '负责人ID', nullable: true })
  ownerUserId: number;

  @Column({ comment: '负责人', length: 50, nullable: true })
  ownerName: string;

  @Index()
  @Column({ comment: '最后编辑人ID', nullable: true })
  lastEditUserId: number;

  @Column({ comment: '最后编辑人', length: 50, nullable: true })
  lastEditName: string;
}
