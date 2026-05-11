import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 公司目录-供应链部-采购单明细（由采购需求生成）
 */
@Entity('company_purchase_order_item')
export class CompanyPurchaseOrderItemEntity extends BaseEntity {
  @Index()
  @Column({ comment: '采购单ID' })
  purchaseOrderId: number;

  @Index()
  @Column({ comment: '采购单号', length: 50 })
  purchaseOrderNo: string;

  @Index({ unique: true })
  @Column({ comment: '采购需求ID' })
  requirementId: number;

  @Column({ comment: '采购需求编号', length: 50 })
  requirementNo: string;

  @Column({ comment: '合同订单号', length: 100, nullable: true })
  contractOrderNo: string;

  @Column({ comment: '负责人', length: 100, nullable: true })
  ownerName: string;

  @Column({ comment: '交付日期', type: 'date', nullable: true })
  deliveryDate: Date;

  @Column({ comment: '产品名称', length: 200 })
  productName: string;

  @Column({ comment: '品牌', length: 100, nullable: true })
  productBrand: string;

  @Column({ comment: '型号', length: 100, nullable: true })
  productModel: string;

  @Column({ comment: '报价单号', length: 50, nullable: true })
  quoteNo: string;
}
