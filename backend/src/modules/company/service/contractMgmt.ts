import { BaseService, CoolTransaction } from '@cool-midway/core';
import { Inject, Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import * as moment from 'moment';
import { QueryRunner, Repository } from 'typeorm';
import { CompanyContractMgmtEntity } from '../entity/contractMgmt';
import { CompanyFollowUpRecordEntity } from '../entity/followUpRecord';
import * as path from 'path';
import { pUploadPath } from '../../../comm/path';

const CONTRACT_CATEGORY_MAP: Record<number, string> = {
  0: '项目类（搬迁改造）合同',
  1: '机械类（维保）合同',
  2: '调试类合同',
  3: '电气（排故维修）类合同',
  4: '备品备件合同',
};

const CONTRACT_NO_PREFIX_MAP: Record<number, string> = {
  0: 'XM',
  1: 'JX',
  2: 'TS',
  3: 'DQ',
  4: 'BP',
};

@Provide()
export class CompanyContractMgmtService extends BaseService {
  @Inject()
  ctx;

  @InjectEntityModel(CompanyContractMgmtEntity)
  contractMgmtEntity: Repository<CompanyContractMgmtEntity>;

  static getCategoryName(category: number): string {
    return CONTRACT_CATEGORY_MAP[category] ?? '未知类别';
  }

  static getCategoryMap(): Record<number, string> {
    return { ...CONTRACT_CATEGORY_MAP };
  }

  static getNoPrefix(category: number): string {
    return CONTRACT_NO_PREFIX_MAP[category] ?? 'HT';
  }

  getTemplateRelativePath(category: number): string {
    const fileName = CONTRACT_CATEGORY_MAP[category];
    if (!fileName) return null;
    return `contract_templates/${fileName}.docx`;
  }

  getTemplateDiskPath(category: number): string | null {
    const rel = this.getTemplateRelativePath(category);
    if (!rel) return null;
    const base = pUploadPath();
    return path.resolve(base, rel);
  }

  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async add(param: any, queryRunner?: QueryRunner) {
    delete param.id;

    const repo = queryRunner.manager.getRepository(CompanyContractMgmtEntity);

    const category = param.contractCategory ?? 0;
    const dateStr = moment().format('YYYYMMDD');
    const prefix = `HT-${CompanyContractMgmtService.getNoPrefix(category)}-${dateStr}`;

    const count = await repo
      .createQueryBuilder('a')
      .where('a.contractNo like :p', { p: `${prefix}-%` })
      .getCount();

    const seq = String(count + 1).padStart(4, '0');
    const contractNo = `${prefix}-${seq}`;

    const currentUserName =
      this.ctx?.admin?.name ||
      this.ctx?.admin?.nickName ||
      this.ctx?.admin?.username ||
      null;

    const templatePath = this.getTemplateRelativePath(category);

    const saved = await repo.save({
      ...param,
      contractNo,
      createUserId: this.ctx?.admin?.userId,
      createUserName: currentUserName,
      templatePath,
      version: 1,
      isDeleted: 0,
    });

    return { id: saved.id, contractNo };
  }

  async modifyBefore(data: any, type: 'delete' | 'update' | 'add') {
    if (type === 'update' && data.id) {
      const idNum = Number(data.id);
      if (idNum) {
        const origin = await this.contractMgmtEntity.findOne({
          where: { id: idNum },
        });
        if (origin) {
          data.version = (origin.version || 1) + 1;
          if (
            data.contractCategory !== undefined &&
            data.contractCategory !== origin.contractCategory
          ) {
            data.templatePath = this.getTemplateRelativePath(
              data.contractCategory
            );
          }
        }
      }
    }

    if (type === 'delete' && data.id) {
      const idNum = Number(data.id);
      if (idNum) {
        await this.contractMgmtEntity.update(idNum, { isDeleted: 1 });
      }
    }
  }

  async contractPage(query: any) {
    const { page = 1, size = 20, order = 'createTime', sort = 'desc', keyWord, contractCategory, contractStatus, contractNo, startDate, endDate } = query;

    const qb = this.contractMgmtEntity.createQueryBuilder('a');

    qb.where('a.isDeleted = 0');

    if (keyWord) {
      qb.andWhere(
        '(a.contractNo LIKE :kw OR a.contractName LIKE :kw OR a.customerName LIKE :kw)',
        { kw: `%${keyWord}%` }
      );
    }

    if (contractCategory !== undefined && contractCategory !== null && contractCategory !== '') {
      qb.andWhere('a.contractCategory = :category', { category: Number(contractCategory) });
    }

    if (contractStatus !== undefined && contractStatus !== null && contractStatus !== '') {
      qb.andWhere('a.contractStatus = :status', { status: Number(contractStatus) });
    }

    if (contractNo) {
      qb.andWhere('a.contractNo LIKE :cno', { cno: `%${contractNo}%` });
    }

    if (startDate) {
      qb.andWhere('a.startDate >= :sd', { sd: startDate });
    }

    if (endDate) {
      qb.andWhere('a.endDate <= :ed', { ed: endDate });
    }

    qb.orderBy(`a.${order}`, sort.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
    qb.skip((page - 1) * size).take(size);

    const [list, total] = await qb.getManyAndCount();

    return { list, pagination: { page: Number(page), size: Number(size), total } };
  }

  async contractInfo(id: number) {
    const contract = await this.contractMgmtEntity.findOne({
      where: { id, isDeleted: 0 },
    });
    if (!contract) {
      return null;
    }
    return contract;
  }

  async logicDelete(id: number | number[]) {
    const ids = Array.isArray(id) ? id : [id];
    return this.contractMgmtEntity.delete(ids);
  }

  async getCategories() {
    return Object.entries(CONTRACT_CATEGORY_MAP).map(([key, name]) => ({
      value: Number(key),
      label: name,
      templatePath: this.getTemplateRelativePath(Number(key)),
    }));
  }

  async getCustomerRecords(customerId: number) {
    const contractRepo = this.contractMgmtEntity;
    const followUpRepo = contractRepo.manager.getRepository(CompanyFollowUpRecordEntity);

    const customer = await contractRepo.findOne({
      where: { id: customerId },
      select: ['customerName'],
    });
    const customerName = customer?.customerName;

    const wonContracts = await contractRepo.find({
      where: { customerId, isDeleted: 0, contractStatus: 3 },
      order: { signDate: 'DESC' },
    });

    const lostContracts = await contractRepo.find({
      where: { customerId, isDeleted: 0, contractStatus: 4 },
      order: { signDate: 'DESC' },
    });

    const followUpRecords = customerName
      ? await followUpRepo
          .createQueryBuilder('f')
          .where('f.customerName = :name', { name: customerName })
          .orderBy('f.followUpTime', 'DESC')
          .getMany()
      : [];

    return {
      wonContracts,
      lostContracts,
      followUpRecords,
    };
  }

  async getCustomerRecordsByName(customerName: string) {
    const contractRepo = this.contractMgmtEntity;
    const followUpRepo = contractRepo.manager.getRepository(CompanyFollowUpRecordEntity);

    const qb = contractRepo.createQueryBuilder('a');
    qb.where('a.isDeleted = 0');
    qb.andWhere('a.customerName LIKE :name', { name: `%${customerName}%` });

    const wonContracts = await contractRepo
      .createQueryBuilder('a')
      .where('a.isDeleted = 0')
      .andWhere('a.customerName LIKE :name', { name: `%${customerName}%` })
      .andWhere('a.contractStatus = :status', { status: 3 })
      .orderBy('a.signDate', 'DESC')
      .getMany();

    const lostContracts = await contractRepo
      .createQueryBuilder('a')
      .where('a.isDeleted = 0')
      .andWhere('a.customerName LIKE :name', { name: `%${customerName}%` })
      .andWhere('a.contractStatus = :status', { status: 4 })
      .orderBy('a.signDate', 'DESC')
      .getMany();

    const followUpRecords = await followUpRepo
      .createQueryBuilder('f')
      .where('f.customerName LIKE :name', { name: `%${customerName}%` })
      .orderBy('f.followUpTime', 'DESC')
      .getMany();

    return {
      wonContracts,
      lostContracts,
      followUpRecords,
    };
  }
}
