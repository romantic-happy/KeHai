import { BaseService, CoolTransaction } from '@cool-midway/core';
import { Inject, Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import * as moment from 'moment';
import { QueryRunner, Repository } from 'typeorm';
import { CompanyContractOrderEntity } from '../entity/contractOrder';
import { CompanyCustomerEntity } from '../entity/customer';
import { CompanyInvoiceEntity } from '../entity/invoice';
import { CompanyPlanRepayEntity } from '../entity/planRepay';

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

  @InjectEntityModel(CompanyPlanRepayEntity)
  companyPlanRepayEntity: Repository<CompanyPlanRepayEntity>;

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
      const attachmentUrls = this.normalizeStringArray(param.attachmentUrls);

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
        attachmentUrls: attachmentUrls.length ? attachmentUrls : null,
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
    const attachmentUrls = this.normalizeStringArray(param.attachmentUrls);

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
      attachmentUrls: attachmentUrls.length ? attachmentUrls : null,
      taxNo: param.taxNo ?? null,
      bankName: param.bankName ?? null,
      bankAccount: param.bankAccount ?? null,
      bankBranchCode: param.bankBranchCode ?? null,
      invoiceStatus: 0,
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

  async contractOrderPage(query: any) {
    const customerId = Number(query?.customerId);
    const qb = this.companyContractOrderEntity.createQueryBuilder('a');
    qb.select([
      'a.id as id',
      'a.customerId as customerId',
      'a.customerName as customerName',
      'a.orderNo as orderNo',
      'a.title as title',
      'a.contractAmount as contractAmount',
      'a.planRepayLabel as planRepayLabel',
      'a.actualRepayLabel as actualRepayLabel',
      'a.inquiryId as inquiryId',
      'a.ownerName as ownerName',
      'a.deliveryDate as deliveryDate',
      'a.quoteId as quoteId',
      'a.quoteNo as quoteNo',
      'a.productItems as productItems',
      'a.createTime as createTime',
      'a.updateTime as updateTime',
    ]);
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

  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async confirmInvoice(param: any, queryRunner?: QueryRunner) {
    const id = Number(param?.id);
    if (!id) {
      throw new Error('缺少开票ID');
    }

    const invRepo = queryRunner.manager.getRepository(CompanyInvoiceEntity);
    const planRepo = queryRunner.manager.getRepository(CompanyPlanRepayEntity);

    const invoice = await invRepo.findOne({ where: { id } });
    if (!invoice) {
      throw new Error('开票记录不存在');
    }
    if (invoice.invoiceStatus === 1) {
      throw new Error('该开票申请已确认，请勿重复操作');
    }

    await invRepo.update(id, {
      invoiceStatus: 1,
      updateTime: new Date() as any,
    });

    const detailRows: any[] = invoice.detailRows || [];
    for (const row of detailRows) {
      await planRepo.save({
        invoiceId: invoice.id,
        invoiceNo: invoice.invoiceNo,
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        contractOrderId: row.orderId || null,
        contractOrderNo: row.orderNo || '',
        expectedPaybackDate: invoice.expectedPaybackDate,
        invoiceAmount: Number(row.invoiceAmount) || 0,
        currency: row.currency || '人民币',
        repayStatus: 0,
      });
    }

    return { id };
  }

  private async nextInvoiceNo(invRepo: Repository<CompanyInvoiceEntity>) {
    const dateStr = moment().format('YYYYMMDD');
    const prefix = `KP-${dateStr}-`;
    const row = await invRepo
      .createQueryBuilder('a')
      .select('MAX(a.invoiceNo) as maxNo')
      .where('a.invoiceNo like :p', { p: `${prefix}%` })
      .getRawOne();
    const maxNo: string = row?.maxNo || '';
    const lastSeq = maxNo ? parseInt(maxNo.replace(prefix, ''), 10) || 0 : 0;
    const seq = String(lastSeq + 1).padStart(4, '0');
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

  private normalizeStringArray(raw: any): string[] {
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
}
