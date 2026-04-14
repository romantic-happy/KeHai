import { BaseService, CoolTransaction } from '@cool-midway/core';
import { Inject, Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import * as moment from 'moment';
import { QueryRunner, Repository } from 'typeorm';
import { CompanyContractOrderEntity } from '../entity/contractOrder';
import { CompanyCustomerEntity } from '../entity/customer';
import { CompanyInvoiceEntity } from '../entity/invoice';

/**
 * 公司目录-开票管理
 */
@Provide()
export class CompanyInvoiceService extends BaseService {
  @Inject()
  ctx;

  @InjectEntityModel(CompanyInvoiceEntity)
  companyInvoiceEntity: Repository<CompanyInvoiceEntity>;

  @InjectEntityModel(CompanyCustomerEntity)
  companyCustomerEntity: Repository<CompanyCustomerEntity>;

  @InjectEntityModel(CompanyContractOrderEntity)
  companyContractOrderEntity: Repository<CompanyContractOrderEntity>;

  /**
   * 新增：生成开票单号；编辑：带 id 更新
   */
  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async add(param: any, queryRunner?: QueryRunner) {
    const invRepo = queryRunner.manager.getRepository(CompanyInvoiceEntity);
    const custRepo = queryRunner.manager.getRepository(CompanyCustomerEntity);

    const idNum = param?.id ? Number(param.id) : 0;
    if (idNum) {
      const exist = await invRepo.findOne({ where: { id: idNum } });
      if (!exist) {
        throw new Error('开票记录不存在');
      }
      const customerId = Number(param.customerId);
      const customer = await custRepo.findOne({ where: { id: customerId } });
      if (!customer) {
        throw new Error('客户不存在');
      }
      const detailRows = this.normalizeDetailRows(param.detailRows);
      const contractOrderIds = this.normalizeIdArray(param.contractOrderIds);
      const collaboratorUserIds = this.normalizeIdArray(
        param.collaboratorUserIds
      );

      await invRepo.update(idNum, {
        customerId,
        customerName: customer.customerName,
        contractOrderIds,
        contractOrderLabels: param.contractOrderLabels ?? '',
        expectedPaybackDate: String(param.expectedPaybackDate ?? ''),
        invoiceAmount: Number(param.invoiceAmount) || 0,
        invoiceType: param.invoiceType ?? null,
        ownerUserId:
          param.ownerUserId != null ? Number(param.ownerUserId) : null,
        collaboratorUserIds: collaboratorUserIds.length
          ? collaboratorUserIds
          : null,
        remark: param.remark ?? null,
        detailRows,
        taxNo: param.taxNo ?? null,
        bankName: param.bankName ?? null,
        bankAccount: param.bankAccount ?? null,
        bankBranchCode: param.bankBranchCode ?? null,
        updateTime: new Date() as any,
      });
      return { id: idNum };
    }

    delete param.id;
    const customerId = Number(param.customerId);
    const customer = await custRepo.findOne({ where: { id: customerId } });
    if (!customer) {
      throw new Error('客户不存在');
    }

    const invoiceNo = await this.nextInvoiceNo(invRepo);
    const detailRows = this.normalizeDetailRows(param.detailRows);
    const contractOrderIds = this.normalizeIdArray(param.contractOrderIds);
    const collaboratorUserIds = this.normalizeIdArray(
      param.collaboratorUserIds
    );

    const saved = await invRepo.save({
      invoiceNo,
      customerId,
      customerName: customer.customerName,
      contractOrderIds,
      contractOrderLabels: param.contractOrderLabels ?? '',
      expectedPaybackDate: String(param.expectedPaybackDate ?? ''),
      invoiceAmount: Number(param.invoiceAmount) || 0,
      invoiceType: param.invoiceType ?? null,
      ownerUserId: param.ownerUserId != null ? Number(param.ownerUserId) : null,
      collaboratorUserIds: collaboratorUserIds.length
        ? collaboratorUserIds
        : null,
      remark: param.remark ?? null,
      detailRows,
      taxNo: param.taxNo ?? null,
      bankName: param.bankName ?? null,
      bankAccount: param.bankAccount ?? null,
      bankBranchCode: param.bankBranchCode ?? null,
      createUserId: this.ctx?.admin?.userId ?? null,
    });

    return { id: saved.id };
  }

  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async update(param: any, queryRunner?: QueryRunner): Promise<void> {
    if (!param?.id) {
      throw new Error('缺少开票ID');
    }
    await this.add(param, queryRunner);
  }

  /**
   * 按客户分页查询合同订单（开票时多选）
   */
  async contractOrderPage(query: any) {
    const customerId = Number(query?.customerId);
    const qb = this.companyContractOrderEntity.createQueryBuilder('a');
    qb.where('1=1');
    if (customerId) {
      qb.andWhere('a.customerId = :cid', { cid: customerId });
    } else {
      qb.andWhere('1=0');
    }
    if (query?.keyWord) {
      qb.andWhere('(a.orderNo like :kw or a.title like :kw)', {
        kw: `%${query.keyWord}%`,
      });
    }
    return this.entityRenderPage(qb, query);
  }

  /**
   * 读取该客户最近一次开票的发票抬头信息（税号、开户行等），用于老客户自动带出
   */
  async invoiceProfileByCustomer(query: any) {
    const customerId = Number(query?.customerId);
    if (!customerId) {
      return null;
    }
    const row = await this.companyInvoiceEntity.findOne({
      where: { customerId },
      order: { createTime: 'DESC' },
    });
    if (!row) {
      return null;
    }
    return {
      taxNo: row.taxNo,
      bankName: row.bankName,
      bankAccount: row.bankAccount,
      bankBranchCode: row.bankBranchCode,
    };
  }

  private async nextInvoiceNo(invRepo: Repository<CompanyInvoiceEntity>) {
    const dateStr = moment().format('YYYYMMDD');
    const prefix = `KP-${dateStr}-`;
    const count = await invRepo
      .createQueryBuilder('a')
      .where('a.invoiceNo like :p', { p: `${prefix}%` })
      .getCount();
    const seq = String(count + 1).padStart(4, '0');
    return `${prefix}${seq}`;
  }

  private normalizeDetailRows(raw: any): any[] {
    if (raw == null) {
      return [];
    }
    if (typeof raw === 'string') {
      try {
        const p = JSON.parse(raw);
        return Array.isArray(p) ? p : [];
      } catch {
        return [];
      }
    }
    return Array.isArray(raw) ? raw : [];
  }

  private normalizeIdArray(raw: any): number[] {
    if (raw == null) {
      return [];
    }
    let arr = raw;
    if (typeof raw === 'string') {
      try {
        arr = JSON.parse(raw);
      } catch {
        return [];
      }
    }
    if (!Array.isArray(arr)) {
      return [];
    }
    return arr.map(e => Number(e)).filter(e => !Number.isNaN(e));
  }
}
