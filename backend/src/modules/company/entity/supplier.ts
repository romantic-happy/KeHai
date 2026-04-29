import { BaseEntity, transformerJson } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * Company directory - supply chain supplier.
 */
@Entity('company_supplier')
export class CompanySupplierEntity extends BaseEntity {
  @Index()
  @Column({ comment: 'Supplier name', length: 200 })
  supplierName: string;

  @Index()
  @Column({
    comment: 'Supplier type: temporary/formal',
    type: 'varchar',
    length: 20,
    default: 'temporary',
  })
  supplierType: string;

  @Index()
  @Column({ comment: 'Supplier source', type: 'varchar', length: 50 })
  supplierSource: string;

  @Column({ comment: 'Remark', type: 'text', nullable: true })
  remark: string;

  @Column({ comment: 'Contact name', length: 100 })
  contactName: string;

  @Column({ comment: 'Contact info', length: 200 })
  contactInfo: string;

  @Index()
  @Column({
    comment: 'Information status: active/pending/dormant',
    type: 'varchar',
    length: 20,
    default: 'active',
  })
  infoStatus: string;

  @Index()
  @Column({
    comment: 'Manage status: valid/invalid',
    type: 'varchar',
    length: 20,
    default: 'valid',
  })
  manageStatus: string;

  @Column({
    comment: 'Supplier nature',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  supplierNature: string;

  @Column({
    comment: 'Business category list',
    type: 'json',
    nullable: true,
    transformer: transformerJson,
  })
  businessCategory: string[];

  @Column({ comment: 'Payment term days', nullable: true })
  paymentTerm: number;

  @Index()
  @Column({
    comment: 'Cooperation relation',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  cooperationRelation: string;

  @Column({ comment: 'AI background check', type: 'text', nullable: true })
  aiBackgroundCheck: string;

  @Column({ comment: 'AI supplier profile', type: 'text', nullable: true })
  aiSupplierProfile: string;

  @Column({ comment: 'Invalid reason', type: 'text', nullable: true })
  invalidReason: string;

  @Column({ comment: 'First quote date', type: 'datetime', nullable: true })
  quoteStartTime: Date;

  @Column({ comment: 'Last quote date', type: 'datetime', nullable: true })
  lastQuoteTime: Date;

  @Column({ comment: 'Created by user id', nullable: true })
  createUserId: number;

  @Column({ comment: 'Last edit user id', nullable: true })
  lastEditUserId: number;
}
