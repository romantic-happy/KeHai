import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 公司目录-供应链部-采购需求
 */
@Entity('company_purchase_requirement')
export class CompanyPurchaseRequirementEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ comment: '采购需求编号', length: 50 })
  requirementNo: string;

  @Index()
  @Column({
    comment: '来源类型 0-合同订单 1-储备采购',
    dict: ['合同订单', '储备采购'],
    type: 'tinyint',
    default: 0,
  })
  sourceType: number;

  @Column({ comment: '来源业务ID', nullable: true })
  sourceBizId: number;

  @Column({ comment: '来源单据号', length: 100, nullable: true })
  sourceBizNo: string;

  @Column({ comment: '合同订单号', length: 100, nullable: true })
  contractOrderNo: string;

  @Column({ comment: '客户名称', length: 100, nullable: true })
  customerName: string;

  @Index()
  @Column({ comment: '负责人', length: 100, nullable: true })
  ownerName: string;

  @Index()
  @Column({ comment: '交付日期', type: 'date', nullable: true })
  deliveryDate: Date;

  @Column({ comment: '交付标准', type: 'text', nullable: true })
  deliveryStandard: string;

  @Column({ comment: '产品名称', length: 200 })
  productName: string;

  @Column({ comment: '品牌', length: 100, nullable: true })
  productBrand: string;

  @Column({ comment: '型号', length: 100, nullable: true })
  productModel: string;

  @Column({
    comment: '库存数量',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  inventoryQty: number;

  @Column({ comment: '关联报价单号', length: 50, nullable: true })
  quoteNo: string;

  @Index()
  @Column({
    comment: '采购状态 0-未采购 1-已采购',
    dict: ['未采购', '已采购'],
    type: 'tinyint',
    default: 0,
  })
  purchaseStatus: number;
}
