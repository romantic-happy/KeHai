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
    const supplier = await this.getSupplierForAi(param);
    return await this.difyService.supplierBackgroundCheck({
      supplierName: supplier.supplierName,
      supplierType: supplier.supplierType,
      supplierSource: supplier.supplierSource,
      contactName: supplier.contactName,
      contactInfo: supplier.contactInfo,
      supplierNature: supplier.supplierNature,
      businessCategory: (supplier.businessCategory || []).join('、'),
      paymentTerm: supplier.paymentTerm?.toString(),
      cooperationRelation: supplier.cooperationRelation,
      managementStatus: supplier.manageStatus,
      remark: supplier.remark,
    });
  }

  async aiSupplierProfile(param: any) {
    const supplier = await this.getSupplierForAi(param);
    const prompt = [
      '供应商AI画像占位请求，后续根据历史报价记录总结。',
      `供应商名称：${supplier.supplierName || ''}`,
      `业务类别：${(supplier.businessCategory || []).join('、')}`,
      '需要总结：主营品类、价格水平、合作稳定性、质量与质保表现、风险提示。',
    ].join('\n');

    return {
      configured: false,
      message: 'AI接口暂未配置',
      prompt,
    };
  }

  async quoteRecords(param: any) {
    const supplier = await this.getSupplierForAi(param);
    const qb = this.companyQuoteEntity.createQueryBuilder('a');
    qb.where('a.supplier = :name', { name: supplier.supplierName });
    qb.orderBy('a.createTime', 'DESC');
    qb.limit(20);
    const list = await qb.getMany();

    return {
      supplierName: supplier.supplierName,
      aiSupplierProfile: supplier.aiSupplierProfile,
      list,
      placeholder: list.length === 0,
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
