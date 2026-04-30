import { Entity, Column, Index, PrimaryGeneratedColumn } from 'typeorm';
import { CoolBaseEntity } from '@cool-midway/core';

/**
 * 客户跟进记录
 */
@Entity('company_follow_up_record')
export class CompanyFollowUpRecordEntity extends CoolBaseEntity {
  @PrimaryGeneratedColumn({ comment: 'ID' })
  id: number;

  @Index()
  @Column({
    comment: '创建时间',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createTime: Date;

  @Index()
  @Column({
    comment: '更新时间',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updateTime: Date;

  @Index()
  @Column({ comment: '客户名称', length: 512, nullable: true })
  customerName: string;

  @Column({ comment: '关键人', length: 512, nullable: true })
  keyPerson: string;

  @Index()
  @Column({ comment: '跟进人', length: 512, nullable: true })
  ownerUserName: string;

  @Column({ comment: '跟进方式', length: 512, nullable: true })
  method: string;

  @Column({ comment: '跟进状态', length: 512, nullable: true })
  status: string;

  @Column({ comment: '跟进结果', length: 512, nullable: true })
  result: string;

  @Column({
    comment: '跟进时间',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  followUpTime: Date;

  @Column({ comment: '下次跟进时间', type: 'datetime', nullable: true })
  nextFollowTime: Date;

   @Column({ comment: '日程提醒', type: 'tinyint', nullable: true })
  isReminder: number;

  @Column({ comment: '跟进人所在部门', length: 512, nullable: true })
  followUpPersonDept: string;

  @Column({ comment: '创建人', length: 512, nullable: true })
  creator: string;

  @Column({ comment: '最后修改人', length: 512, nullable: true })
  modifier: string;

  @Column({ comment: '核算维度', length: 512, nullable: true })
  accountingDimension: string;

  @Column({ comment: '协作人', type: 'text', nullable: true })
  collaborators: string;

  @Column({ comment: '联系详情', type: 'text', nullable: true })
  details: string;

  @Column({ comment: 'AI销售指导', type: 'text', nullable: true })
  aiGuide: string;
}
