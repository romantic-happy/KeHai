import { BaseService, CoolTransaction } from '@cool-midway/core';
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import * as moment from 'moment';
import { In, QueryRunner, Repository } from 'typeorm';
import { CompanyPurchaseOrderEntity } from '../entity/purchaseOrder';
import { CompanyPurchaseOrderItemEntity } from '../entity/purchaseOrderItem';
import { CompanyPurchaseRequirementEntity } from '../entity/purchaseRequirement';

/**
 * 公司目录-供应链部-采购需求
 */
@Provide()
export class CompanyPurchaseRequirementService extends BaseService {
  @InjectEntityModel(CompanyPurchaseOrderEntity)
  companyPurchaseOrderEntity: Repository<CompanyPurchaseOrderEntity>;

  @InjectEntityModel(CompanyPurchaseOrderItemEntity)
  companyPurchaseOrderItemEntity: Repository<CompanyPurchaseOrderItemEntity>;

  @InjectEntityModel(CompanyPurchaseRequirementEntity)
  companyPurchaseRequirementEntity: Repository<CompanyPurchaseRequirementEntity>;

  /**
   * 新增采购需求
   */
  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async add(param: any, queryRunner?: QueryRunner) {
    delete param.id;

    const repo = queryRunner.manager.getRepository(
      CompanyPurchaseRequirementEntity
    );
    const requirementNo =
      typeof param?.requirementNo === 'string' && param.requirementNo.trim()
        ? param.requirementNo.trim()
        : await this.generateRequirementNo(repo);

    const saved = await repo.save({
      ...this.normalizePayload(param),
      requirementNo,
    });

    return { id: saved.id, requirementNo };
  }

  /**
   * 编辑采购需求
   */
  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async update(param: any, queryRunner?: QueryRunner) {
    const idNum = Number(param?.id);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      throw new Error('缺少有效的采购需求ID');
    }

    const repo = queryRunner.manager.getRepository(
      CompanyPurchaseRequirementEntity
    );
    const exist = await repo.findOne({ where: { id: idNum } });
    if (!exist) {
      throw new Error('采购需求不存在');
    }

    const payload = this.normalizePayload(param);

    await repo.update(idNum, payload);
  }

  /**
   * 删除采购需求
   */
  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async delete(ids: number[] | string, queryRunner?: QueryRunner) {
    const repo = queryRunner.manager.getRepository(
      CompanyPurchaseRequirementEntity
    );
    const idArr = Array.isArray(ids)
      ? ids.map(e => Number(e)).filter(e => !!e)
      : String(ids)
          .split(',')
          .map(e => Number(e))
          .filter(e => !!e);

    if (!idArr.length) {
      return;
    }

    const rows = await repo.find({
      where: {
        id: In(idArr),
      },
    });

    if (!rows.length) {
      return;
    }

    const purchased = rows.find(e => Number(e.purchaseStatus) === 1);
    if (purchased) {
      throw new Error('已采购的需求不允许删除');
    }

    await repo.delete(idArr);
  }

  /**
   * 采购需求分页
   */
  async page(query: any) {
    const qb = this.companyPurchaseRequirementEntity.createQueryBuilder('a');
    qb.where('1 = 1');

    const keyWord = query?.keyWord?.trim();
    const searchField = query?.searchField?.trim();
    if (keyWord) {
      const kw = `%${keyWord}%`;
      const fieldMap: Record<string, string> = {
        requirementNo: 'a.requirementNo',
        contractOrderNo: 'a.contractOrderNo',
        sourceType: 'a.sourceType',
        purchaseStatus: 'a.purchaseStatus',
        ownerName: 'a.ownerName',
        productName: 'a.productName',
        productBrand: 'a.productBrand',
        productModel: 'a.productModel',
        quoteNo: 'a.quoteNo',
      };
      if (searchField && fieldMap[searchField]) {
        if (searchField === 'sourceType' || searchField === 'purchaseStatus') {
          qb.andWhere(`${fieldMap[searchField]} = :kw`, { kw: Number(keyWord) });
        } else {
          qb.andWhere(`${fieldMap[searchField]} like :kw`, { kw });
        }
      } else {
        qb.andWhere(
          `(
            a.requirementNo like :kw
            or a.contractOrderNo like :kw
            or a.ownerName like :kw
            or a.productName like :kw
            or a.productBrand like :kw
            or a.productModel like :kw
            or a.quoteNo like :kw
          )`,
          { kw }
        );
      }
    }

    const sourceType =
      query?.sourceType === undefined ||
      query?.sourceType === null ||
      query?.sourceType === ''
        ? null
        : Number(query.sourceType);
    if (sourceType !== null && [0, 1].includes(sourceType)) {
      qb.andWhere('a.sourceType = :sourceType', { sourceType });
    }

    const purchaseStatus =
      query?.purchaseStatus === undefined ||
      query?.purchaseStatus === null ||
      query?.purchaseStatus === ''
        ? null
        : Number(query.purchaseStatus);
    if (purchaseStatus !== null && [0, 1].includes(purchaseStatus)) {
      qb.andWhere('a.purchaseStatus = :purchaseStatus', { purchaseStatus });
    }

    if (query?.ownerName) {
      qb.andWhere('a.ownerName like :ownerName', {
        ownerName: `%${String(query.ownerName).trim()}%`,
      });
    }

    if (query?.deliveryStartDate) {
      qb.andWhere('a.deliveryDate >= :deliveryStartDate', {
        deliveryStartDate: String(query.deliveryStartDate),
      });
    }

    if (query?.deliveryEndDate) {
      qb.andWhere('a.deliveryDate <= :deliveryEndDate', {
        deliveryEndDate: String(query.deliveryEndDate),
      });
    }

    if (!query?.sort) {
      qb.orderBy('a.createTime', 'DESC');
    }

    return this.entityRenderPage(qb, query);
  }

  /**
   * 合并采购
   */
  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async generatePurchaseOrder(param: any, queryRunner?: QueryRunner) {
    const requirementIds = this.normalizeIds(
      param?.ids ?? param?.requirementIds ?? param?.id
    );
    if (!requirementIds.length) {
      throw new Error('请先选择采购需求');
    }

    const requirementRepo = queryRunner.manager.getRepository(
      CompanyPurchaseRequirementEntity
    );
    const orderRepo =
      queryRunner.manager.getRepository(CompanyPurchaseOrderEntity);
    const orderItemRepo = queryRunner.manager.getRepository(
      CompanyPurchaseOrderItemEntity
    );

    const rows = await requirementRepo.find({
      where: {
        id: In(requirementIds),
      },
      order: {
        id: 'ASC',
      },
    });

    if (rows.length !== requirementIds.length) {
      throw new Error('部分采购需求不存在，请刷新后重试');
    }

    const purchasedRow = rows.find(e => Number(e.purchaseStatus) === 1);
    if (purchasedRow) {
      throw new Error(
        `采购需求 ${purchasedRow.requirementNo || purchasedRow.id} 已采购，不允许重复合并采购`
      );
    }

    const existingOrderItem = await orderItemRepo.findOne({
      where: {
        requirementId: In(requirementIds),
      },
      order: {
        id: 'DESC',
      },
    });
    if (existingOrderItem) {
      throw new Error(
        `采购需求 ${existingOrderItem.requirementNo || existingOrderItem.requirementId} 已参与合并采购，不允许重复合并`
      );
    }

    const purchaseOrderNo = await this.generatePurchaseOrderNo(orderRepo);
    const savedOrder = await orderRepo.save({
      purchaseOrderNo,
      orderStatus: 0,
      requirementCount: rows.length,
      remark: this.normalizeText(param?.remark),
    });

    await orderItemRepo.save(
      rows.map(row => ({
        purchaseOrderId: savedOrder.id,
        purchaseOrderNo,
        requirementId: row.id,
        requirementNo: row.requirementNo,
        contractOrderNo: row.contractOrderNo,
        ownerName: row.ownerName,
        deliveryDate: row.deliveryDate,
        productName: row.productName,
        productBrand: row.productBrand,
        productModel: row.productModel,
        quoteNo: row.quoteNo,
      }))
    );

    return {
      purchaseOrderId: savedOrder.id,
      purchaseOrderNo,
      requirementCount: rows.length,
      requirementIds,
    };
  }

  private async generateRequirementNo(
    repo: Repository<CompanyPurchaseRequirementEntity>
  ) {
    const dateStr = moment().format('YYYYMMDD');
    const prefix = `CGXQ-${dateStr}`;
    const count = await repo
      .createQueryBuilder('a')
      .where('a.requirementNo like :prefix', { prefix: `${prefix}-%` })
      .getCount();

    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  private async generatePurchaseOrderNo(
    repo: Repository<CompanyPurchaseOrderEntity>
  ) {
    const dateStr = moment().format('YYYYMMDD');
    const prefix = `CGDD-${dateStr}`;
    const count = await repo
      .createQueryBuilder('a')
      .where('a.purchaseOrderNo like :prefix', { prefix: `${prefix}-%` })
      .getCount();

    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  private normalizeNumber(value: any) {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  private normalizeText(value: any) {
    if (value === null || value === undefined) {
      return null;
    }
    const text = String(value).trim();
    return text || null;
  }

  private normalizeIds(value: any) {
    const arr = Array.isArray(value) ? value : String(value || '').split(',');
    return Array.from(
      new Set(
        arr
          .map(e => Number(e))
          .filter(e => Number.isFinite(e) && e > 0)
      )
    );
  }

  private normalizePayload(param: any) {
    return {
      sourceType:
        param?.sourceType === undefined ||
        param?.sourceType === null ||
        param?.sourceType === ''
          ? 0
          : Number(param.sourceType),
      sourceBizId: this.normalizeNumber(param?.sourceBizId),
      sourceBizNo: this.normalizeText(param?.sourceBizNo),
      contractOrderNo: this.normalizeText(param?.contractOrderNo),
      customerName: this.normalizeText(param?.customerName),
      ownerName: this.normalizeText(param?.ownerName),
      deliveryDate: this.normalizeText(param?.deliveryDate),
      deliveryStandard: this.normalizeText(param?.deliveryStandard),
      productName: this.normalizeText(param?.productName),
      productBrand: this.normalizeText(param?.productBrand),
      productModel: this.normalizeText(param?.productModel),
      inventoryQty: this.normalizeNumber(param?.inventoryQty) ?? 0,
      quoteNo: this.normalizeText(param?.quoteNo),
      purchaseStatus:
        param?.purchaseStatus === undefined ||
        param?.purchaseStatus === null ||
        param?.purchaseStatus === ''
          ? 0
          : Number(param.purchaseStatus),
    };
  }
}
