import { transformerJson } from '../../base/entity/base';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { CoolBaseEntity } from '@cool-midway/core';

/**
 * 公司目录-客户
 */
@Entity('company_customer')
export class CompanyCustomerEntity extends CoolBaseEntity {
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

  // ===================== 分组一：新建客户填写 =====================

  @Index()
  @Column({ comment: '客户名称', length: 512, nullable: true })
  customerName: string;

  @Column({
    comment: '来源',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  backgroundSource: string;

  @Column({
    comment: '线索',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  clue: string;

  @Column({
    comment: '行业大分类',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  industryCategoryMajor: string;

  @Column({
    comment: '行业小分类',
    type: 'text',
    nullable: true,
  })
  industryCategoryMinor: string;

  @Index()
  @Column({ comment: '负责人', length: 512, nullable: true })
  backgroundOwner: string;

  @Column({
    comment: '协作人列表',
    type: 'json',
    nullable: true,
    transformer: transformerJson,
  })
  backgroundCollaboratorUserIds: string[];

  @Index()
  @Column({
    comment: '客户关系',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  level: string;

  @Index()
  @Column({
    comment: '合作阶段',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  manageStatus: string;

  @Column({ comment: '备注', type: 'text', nullable: true })
  backgroundRemark: string;

  // ===================== 分组二：AI客户背调 =====================

  @Column({ comment: '公司背景', type: 'text', nullable: true })
  backgroundCompanyProfile: string;

  @Column({ comment: '经营范围/企业经营项目', type: 'text', nullable: true })
  businessScope: string;

  @Column({ comment: '成立时间', type: 'varchar', length: 512, nullable: true })
  backgroundEstablishDate: string;

  @Column({
    comment: '注册资金',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  backgroundRegisteredCapital: string;

  @Column({ comment: '企业性质', length: 512, nullable: true })
  backgroundEnterpriseType: string;

  @Column({
    comment: '是否上市',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  backgroundIsListed: string;

  @Column({ comment: '详细地址', length: 512, nullable: true })
  address: string;

  @Column({
    comment: '当年营业额',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  backgroundTurnoverCurrent: string;

  @Column({
    comment: '上一年营业额',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  backgroundTurnoverLast: string;

  @Column({
    comment: '上上年营业额',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  backgroundTurnoverPrev: string;

  @Column({
    comment: '年产值',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  annualOutputValue: string;

  @Column({
    comment: '预算',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  budget: string;

  @Column({ comment: '上级客户', length: 512, nullable: true })
  backgroundSuperiorCustomer: string;

  @Column({ comment: '下游客户', length: 512, nullable: true })
  backgroundDownstreamCustomer: string;

  @Column({
    comment: '机器人工艺',
    type: 'text',
    nullable: true,
  })
  backgroundRobot: string;

  @Column({ comment: '公司网址', length: 512, nullable: true })
  backgroundWebsite: string;

  @Column({ comment: '电话', length: 512, nullable: true })
  backgroundPhone: string;

  @Column({ comment: '电子邮件', length: 512, nullable: true })
  backgroundEmail: string;

  @Column({ comment: '国家', length: 512, default: '中国', nullable: true })
  backgroundCountry: string;

  @Column({ comment: '省', length: 512, nullable: true })
  backgroundProvince: string;

  @Column({ comment: '市', length: 512, nullable: true })
  backgroundCity: string;

  @Column({ comment: '区', length: 512, nullable: true })
  backgroundDistrict: string;

  @Column({ comment: '详细地址(扩展)', length: 512, nullable: true })
  backgroundAddressDetail: string;

  @Column({ comment: '竞争对手', type: 'text', nullable: true })
  competitors: string;

  // ===================== 分组三：客户管理 =====================

  @Column({
    comment: '关键人',
    type: 'json',
    nullable: true,
    transformer: transformerJson,
  })
  keyContacts: any[];

  @Column({ comment: 'AI 客户画像', type: 'text', nullable: true })
  backgroundPortrait: string;

  @Column({ comment: '客户编号', length: 512, nullable: true })
  customerNo: string;
}
