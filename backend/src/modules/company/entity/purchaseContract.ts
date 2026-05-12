import { BaseEntity, transformerJson } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * Company purchase contract.
 */
@Entity('company_purchase_contract')
export class CompanyPurchaseContractEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ comment: 'Purchase contract no', length: 80 })
  contractNo: string;

  @Index({ unique: true })
  @Column({ comment: 'Purchase order no', length: 80 })
  orderNo: string;

  @Index()
  @Column({ comment: 'Supplier ID' })
  supplierId: number;

  @Index()
  @Column({ comment: 'Supplier name', length: 200 })
  supplierName: string;

  @Index()
  @Column({
    comment: 'Supplier type: temporary/formal',
    type: 'varchar',
    length: 20,
  })
  supplierType: string;

  @Column({
    comment: 'Purchase amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  purchaseAmount: number;

  @Index()
  @Column({ comment: 'Order date', type: 'date' })
  orderDate: Date;

  @Index()
  @Column({ comment: 'Expected arrival date', type: 'date' })
  expectedArrivalDate: Date;

  @Column({
    comment: 'Contract attachments',
    nullable: true,
    type: 'json',
    transformer: transformerJson,
  })
  attachments: string[];

  @Column({ comment: 'Remark', type: 'text', nullable: true })
  remark: string;
}
