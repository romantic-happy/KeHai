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

  @InjectEntityModel(CompanySupplierEntity)
  companySupplierEntity: Repository<CompanySupplierEntity>;

  @InjectEntityModel(CompanyQuoteEntity)
  companyQuoteEntity: Repository<CompanyQuoteEntity>;

  @Inject()
  difyService: DifyService;

  private currentUserId() {
    const id = Number(this.ctx?.admin?.userId);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  private normalize(data: any, type: 'add' | 'update' | 'transfer') {
    if (!data) {
      throw new Error('缺少供应商信息');
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
        throw new Error('管理状态为失效时必须填写失效原因');
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
        throw new Error('供应商名称、来源、联系人、联系方式、管理状态为必填');
      }
    }

    if (data.supplierType === 'formal') {
      if (!data.supplierNature) {
        throw new Error('正式供应商必须填写供应商性质');
      }
      if (
        !Array.isArray(data.businessCategory) ||
        data.businessCategory.length === 0
      ) {
        throw new Error('正式供应商必须选择业务类别');
      }
      if (!data.cooperationRelation) {
        throw new Error('正式供应商必须填写合作关系');
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
      throw new Error('缺少有效的供应商ID');
    }

    const repo = queryRunner.manager.getRepository(CompanySupplierEntity);
    const supplier = await repo.findOne({ where: { id } });
    if (!supplier) {
      throw new Error('供应商不存在');
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
    const supplier = await this.getSupplierByRequiredId(param);
    const inputs = this.buildSupplierBackgroundInputs(supplier);
    const result = await this.difyService.analyzeSupplierBackground(inputs);
    const saved = {
      type: 'supplierBackgroundCheck',
      generatedAt: new Date().toISOString(),
      supplierSnapshot: inputs,
      result,
    };

    await this.companySupplierEntity.update(supplier.id, {
      aiBackgroundCheck: JSON.stringify(saved),
    });

    return {
      configured: true,
      message: 'AI背调生成成功',
      prompt: JSON.stringify(saved, null, 2),
      data: saved,
    };
  }

  async aiSupplierProfile(param: any) {
    const supplier = await this.getSupplierByRequiredId(param);
    const quoteRecords = await this.getQuoteRecordsBySupplier(supplier);
    const quoteRecordNote =
      quoteRecords.length > 0
        ? `共找到 ${quoteRecords.length} 条报价记录`
        : '暂无报价记录，仅基于供应商基础信息生成画像';
    const quoteRecordsText =
      quoteRecords.length > 0 ? JSON.stringify(quoteRecords, null, 2) : '[]';
    const supplierSnapshot = this.buildSupplierProfileSnapshot(supplier);
    const inputs = {
      ...supplierSnapshot,
      quoteRecordNote,
      quoteRecords: quoteRecordsText,
    };
    const result = await this.difyService.analyzeSupplierProfile(inputs);
    const saved = {
      type: 'supplierProfile',
      generatedAt: new Date().toISOString(),
      supplierSnapshot,
      quoteRecordNote,
      quoteRecords: quoteRecordsText,
      result,
    };

    await this.companySupplierEntity.update(supplier.id, {
      aiSupplierProfile: JSON.stringify(saved),
    });

    return {
      configured: true,
      message: 'AI画像生成成功',
      prompt: JSON.stringify(saved, null, 2),
      data: saved,
    };
  }

  async quoteRecords(param: any) {
    const supplier = await this.getSupplierForAi(param);
    const list = await this.getQuoteRecordsBySupplier(supplier);

    return {
      supplierName: supplier.supplierName,
      aiSupplierProfile: supplier.aiSupplierProfile,
      list,
      placeholder: list.length === 0,
    };
  }

  private async getSupplierByRequiredId(param: any) {
    const id = Number(param?.id);
    if (!Number.isFinite(id) || id <= 0) {
      throw new Error('查询参数[id]不存在');
    }

    const supplier = await this.companySupplierEntity.findOne({
      where: { id },
    });
    if (!supplier) {
      throw new Error('供应商不存在');
    }
    return supplier;
  }

  private async getQuoteRecordsBySupplier(supplier: CompanySupplierEntity) {
    const qb = this.companyQuoteEntity.createQueryBuilder('a');
    qb.where('a.supplier = :name', { name: supplier.supplierName });
    qb.orderBy('a.createTime', 'DESC');
    qb.limit(20);
    return qb.getMany();
  }

  private valueText(value: any) {
    if (value === undefined || value === null) return '';
    if (Array.isArray(value)) return value.join(',');
    return String(value);
  }

  private buildSupplierBackgroundInputs(supplier: CompanySupplierEntity) {
    return {
      supplierName: this.valueText(supplier.supplierName),
      supplierType: this.valueText(supplier.supplierType),
      supplierSource: this.valueText(supplier.supplierSource),
      contactName: this.valueText(supplier.contactName),
      contactInfo: this.valueText(supplier.contactInfo),
      supplierNature: this.valueText(supplier.supplierNature),
      businessCategory: this.valueText(supplier.businessCategory),
      paymentTerm: this.valueText(supplier.paymentTerm),
      cooperationRelation: this.valueText(supplier.cooperationRelation),
      managementStatus: this.valueText(supplier.manageStatus),
      remark: this.valueText(supplier.remark),
    };
  }

  private buildSupplierProfileSnapshot(supplier: CompanySupplierEntity) {
    return {
      supplierId: this.valueText(supplier.id),
      supplierName: this.valueText(supplier.supplierName),
      supplierType: this.valueText(supplier.supplierType),
      supplierSource: this.valueText(supplier.supplierSource),
      supplierNature: this.valueText(supplier.supplierNature),
      businessCategory: this.valueText(supplier.businessCategory),
      paymentTerm: this.valueText(supplier.paymentTerm),
      cooperationRelation: this.valueText(supplier.cooperationRelation),
      managementStatus: this.valueText(supplier.manageStatus),
      remark: this.valueText(supplier.remark),
    };
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
      throw new Error('供应商不存在');
    }
    return supplier;
  }
}
