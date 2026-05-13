import { BaseService, CoolTransaction } from '@cool-midway/core';
import { Inject, Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import * as moment from 'moment';
import { QueryRunner, Repository } from 'typeorm';
import { CompanyCustomerEntity } from '../entity/customer';
import { CompanyClosedDealEntity } from '../entity/closedDeal';
import { CompanyLostDealEntity } from '../entity/lostDeal';

/**
 * 公司目录-客户
 */
@Provide()
export class CompanyCustomerService extends BaseService {
  @Inject()
  ctx;

  @InjectEntityModel(CompanyCustomerEntity)
  companyCustomerEntity: Repository<CompanyCustomerEntity>;

  @InjectEntityModel(CompanyClosedDealEntity)
  companyClosedDealEntity: Repository<CompanyClosedDealEntity>;

  @InjectEntityModel(CompanyLostDealEntity)
  companyLostDealEntity: Repository<CompanyLostDealEntity>;

  /**
   * 分页查询（实现客户编号自然排序）
   */
  async page(query: any) {
    const qb = this.companyCustomerEntity.createQueryBuilder('a');
    qb.select(['a.*']);

    // 获取前端传入的排序字段和方向
    const sortField = query.sort || query.prop || 'customerNo';
    const sortOrder = (query.order || 'asc').toUpperCase();

    // 处理客户编号的数字排序
    if (sortField === 'customerNo') {
      if (sortOrder === 'ASC') {
        qb.orderBy('LENGTH(a.customerNo)', 'ASC').addOrderBy(
          'a.customerNo',
          'ASC'
        );
      } else {
        qb.orderBy('LENGTH(a.customerNo)', 'DESC').addOrderBy(
          'a.customerNo',
          'DESC'
        );
      }
      // 防止 sqlRenderPage 再次覆盖排序规则
      delete query.sort;
      delete query.prop;
      delete query.order;
    }

    // 关键词搜索
    if (query.keyWord) {
      qb.andWhere('(a.customerNo LIKE :keyWord OR a.customerName LIKE :keyWord)', {
        keyWord: `%${query.keyWord}%`,
      });
      // 防止 sqlRenderPage 再次应用 keyWordLikeFields 导致生成的 SQL 有问题
      delete query.keyWord;
    }

    // 筛选条件
    if (query.level) {
      qb.andWhere('a.level = :level', { level: query.level });
    }
    if (query.backgroundOwner) {
      qb.andWhere('a.backgroundOwner = :backgroundOwner', {
        backgroundOwner: query.backgroundOwner,
      });
    }

    return this.entityRenderPage(qb, query);
  }

  /**
   * 新增客户（自动生成客户编号）
   */
  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async add(param: any, queryRunner?: QueryRunner) {
    delete param.id;

    const repo = queryRunner.manager.getRepository(CompanyCustomerEntity);

    const dateStr = moment().format('YYYYMMDD');
    const prefix = `KH-${dateStr}`;

    const count = await repo
      .createQueryBuilder('a')
      .where('a.customerNo like :p', { p: `${prefix}-%` })
      .getCount();

    const seq = String(count + 1).padStart(4, '0');

    const saved = await repo.save({
      ...param,
      customerNo: `${prefix}-${seq}`,
    });

    return { id: saved.id };
  }

  async closedDealPage(query: any) {
    const qb = this.companyClosedDealEntity.createQueryBuilder('a');
    qb.select(['a.*']);

    if (query.keyWord) {
      qb.andWhere(
        '(a.customerName LIKE :keyWord OR a.contractNo LIKE :keyWord OR a.projectName LIKE :keyWord)',
        { keyWord: `%${query.keyWord}%` }
      );
      delete query.keyWord;
    }

    return this.entityRenderPage(qb, query);
  }

  async lostDealPage(query: any) {
    const qb = this.companyLostDealEntity.createQueryBuilder('a');
    qb.select(['a.*']);

    if (query.keyWord) {
      qb.andWhere(
        '(a.customerName LIKE :keyWord OR a.quoteNo LIKE :keyWord OR a.projectName LIKE :keyWord)',
        { keyWord: `%${query.keyWord}%` }
      );
      delete query.keyWord;
    }

    return this.entityRenderPage(qb, query);
  }

  async createClosedDeal(param: any, queryRunner?: QueryRunner) {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(CompanyClosedDealEntity)
      : this.companyClosedDealEntity;

    return repo.save({
      customerName: param.customerName,
      contractNo: param.contractNo,
      projectName: param.projectName,
      contractAmount: param.contractAmount,
      dealTime: param.dealTime || new Date(),
      contactPerson: param.contactPerson || null,
      dealKey: param.dealKey || null,
      inquiryId: param.inquiryId || null,
    });
  }

  async createLostDeal(param: any, queryRunner?: QueryRunner) {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(CompanyLostDealEntity)
      : this.companyLostDealEntity;

    return repo.save({
      customerName: param.customerName,
      quoteNo: param.quoteNo,
      projectName: param.projectName,
      quoteAmount: param.quoteAmount,
      lostTime: param.lostTime || new Date(),
      contactPerson: param.contactPerson || null,
      lostReason: param.lostReason || null,
      inquiryId: param.inquiryId || null,
    });
  }
}
