import { BaseService, CoolTransaction } from '@cool-midway/core';
import { Inject, Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import * as moment from 'moment';
import { QueryRunner, Repository } from 'typeorm';
import { CompanyCustomerEntity } from '../entity/customer';

/**
 * 公司目录-客户
 */
@Provide()
export class CompanyCustomerService extends BaseService {
  @Inject()
  ctx;

  @InjectEntityModel(CompanyCustomerEntity)
  companyCustomerEntity: Repository<CompanyCustomerEntity>;

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
}
