import { BaseService, CoolTransaction } from '@cool-midway/core';
import { Inject, Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { CompanyQuoteEntity } from '../entity/quote';
import { CompanySupplierEntity } from '../entity/supplier';
import { DifyService } from './dify';

@Provide()
export class CompanySupplierService extends BaseService {
  @Inject()
  ctx;

  @Inject()
  difyService: DifyService;

  @InjectEntityModel(CompanySupplierEntity)
  companySupplierEntity: Repository<CompanySupplierEntity>;

  @InjectEntityModel(CompanyQuoteEntity)
  companyQuoteEntity: Repository<CompanyQuoteEntity>;

  private currentUserId() {
    const id = Number(this.ctx?.admin?.userId);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  private normalize(data: any, type: 'add' | 'update' | 'transfer') {
    if (!data) {
      throw new Error('Invalid supplier data');
    }

    if (data.supplierName !== undefined) {
      data.supplierName = String(data.supplierName || '').trim();
    }
    if (data.contactName !== undefined) {
      data.contactName = String(data.contactName || '').trim();
    }
    if (data.contactInfo !== undefined) {
      data.contactInfo = String(data.contactInfo || '').trim();
    }

    if (type === 'add') {
      data.supplierType = data.supplierType || 'temporary';
      data.infoStatus = data.infoStatus || 'active';
      data.manageStatus = data.manageStatus || 'valid';
      data.quoteStartTime = data.quoteStartTime || new Date();
    }

    if (data.supplierType === 'formal' || type === 'transfer') {
      data.supplierType = 'formal';
      data.cooperationRelation = data.cooperationRelation || 'normal';
    }

    if (data.manageStatus === 'invalid') {
      const reason = String(data.invalidReason || '').trim();
      if (!reason) {
        throw new Error('Invalid supplier data');
      }
      data.invalidReason = reason;
    } else if (data.manageStatus === 'valid') {
      data.invalidReason = data.invalidReason || null;
    }

    const required = [
      'supplierName',
      'supplierSource',
      'contactName',
      'contactInfo',
      'manageStatus',
    ];
    for (const key of required) {
      if (data[key] === undefined) continue;
      if (data[key] === null || data[key] === '') {
        throw new Error('Invalid supplier data');
      }
    }

    if (data.supplierType === 'formal') {
      if (!data.supplierNature) {
        throw new Error('Invalid supplier data');
      }
      if (
        !Array.isArray(data.businessCategory) ||
        data.businessCategory.length === 0
      ) {
        throw new Error('Invalid supplier data');
      }
      if (!data.cooperationRelation) {
        throw new Error('Invalid supplier data');
      }
    }

    return data;
  }

  async modifyBefore(data: any, type: 'delete' | 'update' | 'add') {
    if (type !== 'add' && type !== 'update') return;
    this.normalize(data, type);
    data.lastEditUserId = this.currentUserId();

    // Temporary supplier activation rules are kept here for a future scheduled task:
    // 1. quoteStartTime + 3 months without cooperation => infoStatus = pending.
    // 2. quoteStartTime + 6 months without cooperation => infoStatus = dormant.
  }

  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async add(param: any, queryRunner?: QueryRunner) {
    delete param.id;
    const repo = queryRunner.manager.getRepository(CompanySupplierEntity);
    const data = this.normalize(
      {
        ...param,
        createUserId: param.createUserId ?? this.currentUserId(),
        lastEditUserId: this.currentUserId(),
      },
      'add'
    );
    const saved = await repo.save(data);
    return { id: saved.id };
  }

  async page(query: any) {
    const qb = this.companySupplierEntity.createQueryBuilder('a');

    if (query?.keyWord) {
      qb.andWhere(
        '(a.supplierName like :kw or a.contactName like :kw or a.contactInfo like :kw)',
        {
          kw: `%${query.keyWord}%`,
        }
      );
    }

    [
      'supplierType',
      'supplierSource',
      'infoStatus',
      'manageStatus',
      'cooperationRelation',
    ].forEach(key => {
      const value = query?.[key];
      if (value !== undefined && value !== null && value !== '') {
        qb.andWhere(`a.${key} = :${key}`, { [key]: value });
      }
    });

    if (query?.businessCategory) {
      qb.andWhere(
        'JSON_CONTAINS(a.businessCategory, JSON_QUOTE(:businessCategory))',
        {
          businessCategory: query.businessCategory,
        }
      );
    }

    qb.select(['a.*']);
    qb.orderBy('a.updateTime', 'DESC');
    return this.entityRenderPage(qb, query);
  }

  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async transfer(param: any, queryRunner?: QueryRunner) {
    const id = Number(param?.id);
    if (!Number.isFinite(id) || id <= 0) {
      throw new Error('Invalid supplier id');
    }

    const repo = queryRunner.manager.getRepository(CompanySupplierEntity);
    const supplier = await repo.findOne({ where: { id } });
    if (!supplier) {
      throw new Error('Invalid supplier data');
    }

    const data = this.normalize(
      {
        ...supplier,
        ...param,
        id,
        supplierType: 'formal',
        cooperationRelation:
          param.cooperationRelation || supplier.cooperationRelation || 'normal',
        lastEditUserId: this.currentUserId(),
      },
      'transfer'
    );

    await repo.update(id, data);
    return { id, supplierType: 'formal' };
  }

  async aiBackgroundCheck(param: any) {
    const supplier = await this.getSupplierForAi(param);
    return await this.difyService.supplierBackgroundCheck({
      supplierName: supplier.supplierName,
      supplierType: supplier.supplierType,
      supplierSource: supplier.supplierSource,
      contactName: supplier.contactName,
      contactInfo: supplier.contactInfo,
      supplierNature: supplier.supplierNature,
      businessCategory: Array.isArray(supplier.businessCategory)
        ? supplier.businessCategory.join(',')
        : supplier.businessCategory,
      paymentTerm: supplier.paymentTerm?.toString(),
      cooperationRelation: supplier.cooperationRelation,
      managementStatus: supplier.manageStatus,
      remark: supplier.remark,
    });
  }

  async quoteRecords(param: any) {
    const supplier = await this.getSupplierForAi(param);
    const list = await this.getQuoteRecordsBySupplier(supplier);

    return {
      supplierName: supplier.supplierName,
      list,
      placeholder: list.length === 0,
    };
  }

  private async getQuoteRecordsBySupplier(supplier: CompanySupplierEntity) {
    const qb = this.companyQuoteEntity.createQueryBuilder('a');
    qb.where('a.supplier = :name', { name: supplier.supplierName });
    qb.orderBy('a.createTime', 'DESC');
    qb.limit(20);
    return qb.getMany();
  }

  private async getSupplierForAi(param: any) {
    const id = Number(param?.id);
    if (!Number.isFinite(id) || id <= 0) {
      return param || {};
    }

    const supplier = await this.companySupplierEntity.findOne({
      where: { id },
    });
    if (!supplier) {
      throw new Error('Invalid supplier data');
    }
    return supplier;
  }
}
