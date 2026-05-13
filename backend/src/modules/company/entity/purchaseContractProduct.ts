import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * Company purchase contract product detail.
 */
@Entity('company_purchase_contract_product')
export class CompanyPurchaseContractProductEntity extends BaseEntity {
  @Index()
  @Column({ comment: 'Purchase contract ID' })
  contractId: number;

  @Index()
  @Column({ comment: 'Quote ID', nullable: true })
  quoteId: number;

  @Column({ comment: 'Quote product ID', length: 100, nullable: true })
  quoteProductId: string;

  @Index()
  @Column({ comment: 'Inquiry ID', nullable: true })
  inquiryId: number;

  @Index()
  @Column({ comment: 'Product ID', nullable: true })
  productId: number;

  @Index()
  @Column({ comment: 'Product name', length: 200 })
  productName: string;

  @Column({ comment: 'Brand', length: 100, nullable: true })
  brand: string;

  @Column({ comment: 'Model', length: 150, nullable: true })
  model: string;

  @Column({ comment: 'Quality', length: 100, nullable: true })
  quality: string;

  @Column({
    comment: 'Purchase price',
    type: 'decimal',
    precision: 14,
    scale: 2,
  })
  purchasePrice: number;

  @Column({
    comment: 'Purchase quantity',
    type: 'decimal',
    precision: 14,
    scale: 4,
  })
  purchaseQuantity: number;

  @Column({
    comment: 'Pending purchase quantity',
    type: 'decimal',
    precision: 14,
    scale: 4,
    nullable: true,
  })
  pendingPurchaseQuantity: number;

  @Column({
    comment: 'Purchased quantity',
    type: 'decimal',
    precision: 14,
    scale: 4,
    nullable: true,
  })
  purchasedQuantity: number;

  @Column({
    comment: 'Amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
  })
  amount: number;

  @Column({ comment: 'Remark', type: 'text', nullable: true })
  remark: string;
}
