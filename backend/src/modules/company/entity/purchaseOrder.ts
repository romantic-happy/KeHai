import { BaseEntity } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 公司目录-供应链部-采购单
 */
@Entity('company_purchase_order')
export class CompanyPurchaseOrderEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ comment: '采购单号', length: 50 })
  purchaseOrderNo: string;

  @Index()
  @Column({
    comment: '单据状态 0-已创建 1-已下单',
    dict: ['已创建', '已下单'],
    type: 'tinyint',
    default: 0,
  })
  orderStatus: number;

  @Column({ comment: '合并需求数量', default: 0 })
  requirementCount: number;

  @Column({ comment: '备注', type: 'text', nullable: true })
  remark: string;
}
