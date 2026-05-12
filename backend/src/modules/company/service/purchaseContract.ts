import { BaseService, CoolTransaction } from '@cool-midway/core';
import { Inject, Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import * as moment from 'moment';
import { In, QueryRunner, Repository } from 'typeorm';
import { CompanyInquiryEntity } from '../entity/inquiry';
import { CompanyPurchaseContractEntity } from '../entity/purchaseContract';
import { CompanyPurchaseContractProductEntity } from '../entity/purchaseContractProduct';
import { CompanyQuoteEntity } from '../entity/quote';
import { CompanySupplierEntity } from '../entity/supplier';

@Provide()
export class CompanyPurchaseContractService extends BaseService {
  @InjectEntityModel(CompanyPurchaseContractEntity)
  purchaseContractEntity: Repository<CompanyPurchaseContractEntity>;

  @InjectEntityModel(CompanyPurchaseContractProductEntity)
  purchaseContractProductEntity: Repository<CompanyPurchaseContractProductEntity>;

  @InjectEntityModel(CompanySupplierEntity)
  supplierEntity: Repository<CompanySupplierEntity>;

  @InjectEntityModel(CompanyQuoteEntity)
  quoteEntity: Repository<CompanyQuoteEntity>;

  @InjectEntityModel(CompanyInquiryEntity)
  inquiryEntity: Repository<CompanyInquiryEntity>;

  private toNumber(value: any, field: string, min = 0) {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= min) {
      throw new Error(`${field}必须大于${min}`);
    }
    return num;
  }

  private toNonNegativeNumber(value: any, field: string) {
    if (value === undefined || value === null || value === '') {
      throw new Error(`${field}不能为空`);
    }
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) {
      throw new Error(`${field}不能小于0`);
    }
    return num;
  }

  private round(value: number, precision = 2) {
    const base = Math.pow(10, precision);
    return Math.round(value * base) / base;
  }

  private optionalNumber(value: any, field: string, precision = 4) {
    if (value === undefined || value === null || value === '') return null;
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) {
      throw new Error(`${field}不能小于0`);
    }
    return this.round(num, precision);
  }

  private normalizeDate(value: any, field: string) {
    if (!value) {
      throw new Error(`${field}不能为空`);
    }
    const date = moment(value);
    if (!date.isValid()) {
      throw new Error(`${field}格式不正确`);
    }
    return date.format('YYYY-MM-DD');
  }

  private async fillSupplier(param: any) {
    const supplierId = Number(param?.supplierId);
    if (!Number.isFinite(supplierId) || supplierId <= 0) {
      throw new Error('请选择有效供应商');
    }

    const supplier = await this.supplierEntity.findOne({
      where: { id: supplierId },
    });
    if (!supplier) {
      throw new Error('供应商不存在');
    }

    param.supplierId = supplier.id;
    param.supplierName = supplier.supplierName;
    param.supplierType = supplier.supplierType;
  }

  private normalizeAttachments(param: any) {
    if (!Array.isArray(param.attachments) || param.attachments.length === 0) {
      throw new Error('请上传采购合同附件');
    }
    param.attachments = param.attachments.filter(Boolean);
    if (param.attachments.length === 0) {
      throw new Error('请上传采购合同附件');
    }
  }

  private async calculatePurchasedQuantity(
    item: any,
    currentContractId?: number,
    repo: Repository<CompanyPurchaseContractProductEntity> = this.purchaseContractProductEntity
  ) {
    const qb = repo.createQueryBuilder('p');
    qb.select('COALESCE(SUM(p.purchaseQuantity), 0)', 'total');

    const contractId = Number(currentContractId);
    if (Number.isFinite(contractId) && contractId > 0) {
      qb.andWhere('p.contractId <> :contractId', { contractId });
    }

    const quoteProductId = this.firstText(item?.quoteProductId);
    if (quoteProductId) {
      qb.andWhere('p.quoteProductId = :quoteProductId', { quoteProductId });
    } else if (item?.quoteId && item?.productId) {
      qb.andWhere('p.quoteId = :quoteId', { quoteId: Number(item.quoteId) });
      qb.andWhere('p.productId = :productId', {
        productId: Number(item.productId),
      });
    } else if (item?.quoteId && item?.productName) {
      qb.andWhere('p.quoteId = :quoteId', { quoteId: Number(item.quoteId) });
      qb.andWhere('p.productName = :productName', {
        productName: String(item.productName).trim(),
      });
      qb.andWhere('p.brand <=> :brand', {
        brand: item?.brand ? String(item.brand) : null,
      });
      qb.andWhere('p.model <=> :model', {
        model: item?.model ? String(item.model) : null,
      });
    } else if (item?.inquiryId && item?.productName) {
      qb.andWhere('p.inquiryId = :inquiryId', {
        inquiryId: Number(item.inquiryId),
      });
      qb.andWhere('p.productName = :productName', {
        productName: String(item.productName).trim(),
      });
      qb.andWhere('p.brand <=> :brand', {
        brand: item?.brand ? String(item.brand) : null,
      });
      qb.andWhere('p.model <=> :model', {
        model: item?.model ? String(item.model) : null,
      });
    } else {
      return 0;
    }

    const row = await qb.getRawOne();
    return this.round(Number(row?.total) || 0, 4);
  }

  private async normalizeProducts(
    products: any[],
    _currentContractId?: number,
    _repo: Repository<CompanyPurchaseContractProductEntity> = this.purchaseContractProductEntity
  ) {
    if (!Array.isArray(products) || products.length === 0) {
      throw new Error('请至少添加一条采购产品明细');
    }

    let purchaseAmount = 0;
    const rows = [];

    for (let index = 0; index < products.length; index++) {
      const item = products[index];
      const productName = String(item?.productName || '').trim();
      if (!productName) {
        throw new Error(`第${index + 1}条明细缺少产品名称`);
      }

      const purchasePrice = this.toNonNegativeNumber(
        item?.purchasePrice,
        `第${index + 1}条采购价格`
      );
      const purchaseQuantity = this.toNumber(
        item?.purchaseQuantity,
        `第${index + 1}条采购数量`
      );
      const amount = this.round(purchasePrice * purchaseQuantity);
      purchaseAmount += amount;

      rows.push({
        quoteId: item?.quoteId ? Number(item.quoteId) : null,
        quoteProductId: item?.quoteProductId
          ? String(item.quoteProductId)
          : null,
        inquiryId: item?.inquiryId ? Number(item.inquiryId) : null,
        productId: item?.productId ? Number(item.productId) : null,
        productName,
        brand: item?.brand ? String(item.brand) : null,
        model: item?.model ? String(item.model) : null,
        quality: item?.quality ? String(item.quality) : null,
        purchasePrice: this.round(purchasePrice),
        purchaseQuantity: this.round(purchaseQuantity, 4),
        pendingPurchaseQuantity: this.optionalNumber(
          item?.pendingPurchaseQuantity,
          `第${index + 1}条待采购数量`
        ),
        purchasedQuantity: this.optionalNumber(
          item?.purchasedQuantity,
          `第${index + 1}条已采购数量`
        ),
        amount,
        remark: item?.remark ? String(item.remark) : null,
      });
    }

    return {
      products: rows,
      purchaseAmount: this.round(purchaseAmount),
    };
  }

  private async generateNo(
    repo: Repository<CompanyPurchaseContractEntity>,
    field: 'contractNo' | 'orderNo',
    prefix: string
  ) {
    const dateStr = moment().format('YYYYMMDD');
    const fullPrefix = `${prefix}-${dateStr}`;
    const count = await repo
      .createQueryBuilder('a')
      .where(`a.${field} like :p`, { p: `${fullPrefix}-%` })
      .getCount();
    const seq = String(count + 1).padStart(4, '0');
    return `${fullPrefix}-${seq}`;
  }

  private async buildSavePayload(
    param: any,
    currentContractId?: number,
    productRepo: Repository<CompanyPurchaseContractProductEntity> = this.purchaseContractProductEntity
  ) {
    await this.fillSupplier(param);
    this.normalizeAttachments(param);

    const orderDate = param.orderDate
      ? this.normalizeDate(param.orderDate, '下单日期')
      : moment().format('YYYY-MM-DD');
    const expectedArrivalDate = this.normalizeDate(
      param.expectedArrivalDate,
      '预计到货日期'
    );
    const result = await this.normalizeProducts(
      param.products,
      currentContractId,
      productRepo
    );

    return {
      contract: {
        supplierId: param.supplierId,
        supplierName: param.supplierName,
        supplierType: param.supplierType,
        purchaseAmount: result.purchaseAmount,
        orderDate,
        expectedArrivalDate,
        attachments: param.attachments,
        remark: param.remark ? String(param.remark) : null,
      },
      products: result.products,
    };
  }

  private parseArray(value: any) {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  private optionalPositiveNumber(value: any) {
    if (value === undefined || value === null || value === '') return null;
    const num = Number(value);
    return Number.isFinite(num) && num >= 0 ? num : null;
  }

  private firstText(...values: any[]) {
    for (const value of values) {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return String(value).trim();
      }
    }
    return '';
  }

  private firstNumber(...values: any[]) {
    for (const value of values) {
      const num = this.optionalPositiveNumber(value);
      if (num !== null) return num;
    }
    return null;
  }

  private sourceQuantity(...values: any[]) {
    const num = this.firstNumber(...values);
    return num && num > 0 ? num : null;
  }

  private rowQuantity(row: any) {
    return this.sourceQuantity(
      row?.sourceQuantity,
      row?.quantity,
      row?.num,
      row?.count,
      row?.productQuantity,
      row?.quoteQuantity,
      row?.demandQuantity,
      row?.purchaseQuantity
    );
  }

  private normalizeText(value: any) {
    return this.firstText(value).toLowerCase();
  }

  private sameProduct(a: any, b: any) {
    const aName = this.normalizeText(
      a?.productName ?? a?.materialName ?? a?.name ?? a?.goodsName
    );
    const bName = this.normalizeText(
      b?.productName ?? b?.materialName ?? b?.name ?? b?.goodsName
    );
    if (!aName || !bName || aName !== bName) return false;

    const aBrand = this.normalizeText(a?.brand);
    const bBrand = this.normalizeText(b?.brand);
    const aModel = this.normalizeText(a?.model ?? a?.spec ?? a?.specification);
    const bModel = this.normalizeText(b?.model ?? b?.spec ?? b?.specification);

    return (!aBrand || !bBrand || aBrand === bBrand) &&
      (!aModel || !bModel || aModel === bModel);
  }

  private parseQuoteProductKey(quoteProductId: any) {
    const key = this.firstText(quoteProductId);
    if (!key) return null;

    const dash = key.match(/^(\d+)-([a-zA-Z]+)-(\d+)(?:-(\d+))?$/);
    if (dash) {
      return {
        quoteId: Number(dash[1]),
        sourceType: dash[2],
        index: Number(dash[3]),
        childIndex: dash[4] === undefined ? undefined : Number(dash[4]),
      };
    }

    const dot = key.match(/^(spareQuoteItems|productItems|spareItems)\.(\d+)(?:\.suppliers\.(\d+))?$/);
    if (dot) {
      return {
        sourceType: dot[1],
        index: Number(dot[2]),
        childIndex: dot[3] === undefined ? undefined : Number(dot[3]),
      };
    }

    return null;
  }

  private findMatchingQuantity(item: any, lists: any[][]) {
    for (const list of lists) {
      const found = (list || []).find(row => this.sameProduct(item, row));
      const quantity = this.rowQuantity(found);
      if (quantity !== null) return quantity;
    }
    return null;
  }

  private async resolveSourceQuantity(item: any) {
    const quoteId = Number(item?.quoteId);
    const inquiryId = Number(item?.inquiryId);
    let quote: any = null;
    let inquiry: any = null;

    if (Number.isFinite(quoteId) && quoteId > 0) {
      quote = await this.quoteEntity.findOne({ where: { id: quoteId } });
      if (quote?.inquiryId) {
        inquiry = await this.inquiryEntity.findOne({
          where: { id: Number(quote.inquiryId) },
        });
      }
    }

    if (!inquiry && Number.isFinite(inquiryId) && inquiryId > 0) {
      inquiry = await this.inquiryEntity.findOne({ where: { id: inquiryId } });
    }

    const spareQuoteItems = this.parseArray(quote?.spareQuoteItems);
    const productItems = this.parseArray(inquiry?.productItems);
    const spareItems = this.parseArray(inquiry?.spareItems);
    const key = this.parseQuoteProductKey(item?.quoteProductId);

    if (key?.sourceType === 'spareQuoteItems') {
      const source = spareQuoteItems[key.index];
      const quantity = this.rowQuantity(source);
      if (quantity !== null) return quantity;
      return this.findMatchingQuantity(source || item, [spareItems, productItems]);
    }

    if (key?.sourceType === 'productItems') {
      const quantity = this.rowQuantity(productItems[key.index]);
      if (quantity !== null) return quantity;
    }

    if (key?.sourceType === 'spareItems') {
      const quantity = this.rowQuantity(spareItems[key.index]);
      if (quantity !== null) return quantity;
    }

    const matched = this.findMatchingQuantity(item, [
      spareQuoteItems,
      productItems,
      spareItems,
    ]);
    if (matched !== null) return matched;

    return this.rowQuantity(item);
  }

  private buildQuoteProductId(
    quoteId: number,
    sourceType: string,
    index: number,
    childIndex?: number
  ) {
    return [quoteId, sourceType, index, childIndex]
      .filter(value => value !== undefined && value !== null)
      .join('-');
  }

  private buildOption(base: any, source: any) {
    const sourceQuantity = this.sourceQuantity(source.sourceQuantity);
    const purchasePrice = this.firstNumber(source.purchasePrice);
    const purchasedQuantity = this.firstNumber(source.purchasedQuantity) || 0;
    const pendingPurchaseQuantity =
      sourceQuantity !== null
        ? Math.max(this.round(sourceQuantity - purchasedQuantity, 4), 0)
        : null;
    const purchaseQuantity =
      pendingPurchaseQuantity !== null && pendingPurchaseQuantity > 0
        ? pendingPurchaseQuantity
        : sourceQuantity !== null
          ? 0
          : 1;
    return {
      ...base,
      quoteProductId: source.quoteProductId,
      productId: source.productId ? Number(source.productId) : null,
      productName: this.firstText(source.productName),
      brand: this.firstText(source.brand),
      model: this.firstText(source.model),
      quality: this.firstText(source.quality),
      sourceQuantity,
      purchasePrice,
      purchaseQuantity,
      pendingPurchaseQuantity,
      purchasedQuantity,
      amount:
        purchasePrice !== null
          ? this.round(purchasePrice * purchaseQuantity)
          : 0,
      sourceType: source.sourceType,
      sourceLabel: [base.quoteNo, base.inquiryNo, base.customerName]
        .filter(Boolean)
        .join(' '),
    };
  }

  private async enrichProductQuantities(
    products: any[],
    currentContractId?: number
  ) {
    const rows = [];
    for (const item of products || []) {
      const sourceQuantity = await this.resolveSourceQuantity(item);
      const purchaseQuantity =
        item?.purchaseQuantity === undefined ||
        item?.purchaseQuantity === null ||
        item?.purchaseQuantity === ''
          ? sourceQuantity || 1
          : Number(item.purchaseQuantity);
      rows.push({
        ...item,
        sourceQuantity,
        purchaseQuantity,
      });
    }
    return rows;
  }

  private buildProductSummary(products: any[]) {
    const rows = Array.isArray(products) ? products : [];
    const productNames = Array.from(
      new Set(rows.map(item => this.firstText(item?.productName)).filter(Boolean))
    );
    const purchaseQuantityTotal = rows.reduce(
      (sum, item) => sum + (Number(item?.purchaseQuantity) || 0),
      0
    );
    const pendingPurchaseQuantityTotal = rows.reduce(
      (sum, item) => sum + (Number(item?.pendingPurchaseQuantity) || 0),
      0
    );
    const purchasedQuantityTotal = rows.reduce(
      (sum, item) => sum + (Number(item?.purchasedQuantity) || 0),
      0
    );
    const productsPreview = rows.slice(0, 3).map(item => ({
      productName: item?.productName || '',
      brand: item?.brand || '',
      model: item?.model || '',
      purchaseQuantity: Number(item?.purchaseQuantity) || 0,
      pendingPurchaseQuantity: Number(item?.pendingPurchaseQuantity) || 0,
      purchasedQuantity: Number(item?.purchasedQuantity) || 0,
      sourceQuantity:
        item?.sourceQuantity === undefined || item?.sourceQuantity === null
          ? null
          : Number(item.sourceQuantity),
    }));

    return {
      productNames: productNames.join('、'),
      productCount: productNames.length,
      purchaseQuantityTotal: this.round(purchaseQuantityTotal, 4),
      pendingPurchaseQuantityTotal: this.round(
        pendingPurchaseQuantityTotal,
        4
      ),
      purchasedQuantityTotal: this.round(purchasedQuantityTotal, 4),
      productsPreview,
    };
  }

  private async attachProductSummaries(pageResult: any) {
    const list = Array.isArray(pageResult?.list)
      ? pageResult.list
      : Array.isArray(pageResult)
        ? pageResult
        : [];
    const ids = list.map((item: any) => Number(item.id)).filter(Boolean);
    if (!ids.length) return pageResult;

    const products = await this.purchaseContractProductEntity.find({
      where: { contractId: In(ids) },
      order: { id: 'ASC' },
    });
    const group = new Map<number, any[]>();
    for (const item of products) {
      const contractId = Number(item.contractId);
      if (!group.has(contractId)) group.set(contractId, []);
      group.get(contractId).push(item);
    }

    for (const contract of list) {
      const contractProducts = group.get(Number(contract.id)) || [];
      Object.assign(contract, this.buildProductSummary(contractProducts));
    }

    return pageResult;
  }

  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async add(param: any, queryRunner?: QueryRunner) {
    delete param.id;
    delete param.contractNo;
    delete param.orderNo;

    const repo = queryRunner.manager.getRepository(
      CompanyPurchaseContractEntity
    );
    const productRepo = queryRunner.manager.getRepository(
      CompanyPurchaseContractProductEntity
    );
    const payload = await this.buildSavePayload(param, undefined, productRepo);

    const saved = await repo.save({
      ...payload.contract,
      contractNo: await this.generateNo(repo, 'contractNo', 'CGHT'),
      orderNo: await this.generateNo(repo, 'orderNo', 'CGDD'),
    });

    await productRepo.save(
      payload.products.map(item => ({
        ...item,
        contractId: saved.id,
      }))
    );

    return {
      id: saved.id,
      contractNo: saved.contractNo,
      orderNo: saved.orderNo,
    };
  }

  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async update(param: any, queryRunner?: QueryRunner) {
    const id = Number(param?.id);
    if (!Number.isFinite(id) || id <= 0) {
      throw new Error('缺少采购合同ID');
    }

    const repo = queryRunner.manager.getRepository(
      CompanyPurchaseContractEntity
    );
    const productRepo = queryRunner.manager.getRepository(
      CompanyPurchaseContractProductEntity
    );

    const exists = await repo.findOne({ where: { id } });
    if (!exists) {
      throw new Error('采购合同不存在');
    }

    const payload = await this.buildSavePayload(param, id, productRepo);

    await repo.update(id, {
      ...payload.contract,
      contractNo: exists.contractNo,
      orderNo: exists.orderNo,
      updateTime: new Date() as any,
    });
    await productRepo.delete({ contractId: id });
    await productRepo.save(
      payload.products.map(item => ({
        ...item,
        contractId: id,
      }))
    );
  }

  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async delete(ids: number[] | string, queryRunner?: QueryRunner) {
    const idArr = Array.isArray(ids)
      ? ids.map(e => Number(e)).filter(e => !!e)
      : String(ids)
          .split(',')
          .map(e => Number(e))
          .filter(e => !!e);
    if (!idArr.length) return;

    const repo = queryRunner.manager.getRepository(
      CompanyPurchaseContractEntity
    );
    const productRepo = queryRunner.manager.getRepository(
      CompanyPurchaseContractProductEntity
    );
    await productRepo.delete({ contractId: In(idArr) });
    await repo.delete(idArr);
  }

  async info(id: number, infoIgnoreProperty?: string[]) {
    const contract: any = await super.info(id, infoIgnoreProperty);
    if (!contract?.id) return contract;

    const products = await this.purchaseContractProductEntity.find({
      where: { contractId: contract.id },
      order: { id: 'ASC' },
    });

    return {
      ...contract,
      products,
    };
  }

  async page(query: any) {
    const qb = this.purchaseContractEntity.createQueryBuilder('a');
    qb.where('1=1');

    if (query?.keyWord) {
      qb.andWhere(
        '(a.contractNo like :kw or a.orderNo like :kw or a.supplierName like :kw)',
        { kw: `%${query.keyWord}%` }
      );
    }

    if (query?.supplierId) {
      qb.andWhere('a.supplierId = :supplierId', {
        supplierId: Number(query.supplierId),
      });
    }

    qb.select(['a.*']);
    qb.orderBy('a.createTime', 'DESC');
    const result = await this.entityRenderPage(qb, query);
    return this.attachProductSummaries(result);
  }

  async quoteProductOptions(query: any) {
    console.log('[purchaseContract] quoteProductOptions called', query || {});

    const quoteId = Number(query?.quoteId);
    const keyWord = String(query?.keyWord || '').trim();
    const size = Math.min(Math.max(Number(query?.size) || 100, 1), 200);
    const qb = this.quoteEntity.createQueryBuilder('q');

    qb.leftJoin(CompanyInquiryEntity, 'i', 'q.inquiryId = i.id');
    qb.where('1=1');
    qb.select([
      'q.id as quoteId',
      'q.quoteNo as quoteNo',
      'q.inquiryId as inquiryId',
      'q.supplier as supplierName',
      'q.spareQuoteItems as spareQuoteItems',
      'i.inquiryNo as inquiryNo',
      'i.customer as customerName',
      'i.projectName as projectName',
      'i.equipmentBrand as equipmentBrand',
      'i.equipmentModelQty as equipmentModelQty',
      'i.productItems as productItems',
      'i.spareItems as spareItems',
    ]);

    if (quoteId > 0) {
      qb.andWhere('q.id = :quoteId', { quoteId });
    }
    if (keyWord) {
      qb.andWhere(
        '(q.quoteNo like :kw or i.inquiryNo like :kw or i.customer like :kw or i.projectName like :kw or CAST(q.spareQuoteItems AS CHAR) like :kw)',
        { kw: `%${keyWord}%` }
      );
    }

    qb.orderBy('q.createTime', 'DESC');
    qb.limit(quoteId > 0 ? 1 : size);

    const rows = await qb.getRawMany();
    console.log(
      '[purchaseContract] quoteProductOptions company_quote count',
      rows.length
    );

    const options: any[] = [];

    rows.forEach((row: any) => {
      const quoteIdNum = Number(row.quoteId);
      const inquiryIdNum = Number(row.inquiryId);
      const base = {
        quoteId: Number.isFinite(quoteIdNum) && quoteIdNum > 0 ? quoteIdNum : null,
        inquiryId:
          Number.isFinite(inquiryIdNum) && inquiryIdNum > 0
            ? inquiryIdNum
            : null,
        quoteNo: this.firstText(row.quoteNo),
        inquiryNo: this.firstText(row.inquiryNo),
        customerName: this.firstText(row.customerName),
        projectName: this.firstText(row.projectName),
        supplierName: this.firstText(row.supplierName),
      };
      const buildSourceProductId = (
        sourceType: string,
        index: number,
        childIndex?: number
      ) => this.buildQuoteProductId(quoteIdNum, sourceType, index, childIndex);

      const quoteItems = this.parseArray(row.spareQuoteItems);
      console.log('[purchaseContract] quote row', {
        id: quoteIdNum,
        quoteNo: row.quoteNo,
        inquiryId: inquiryIdNum,
        hasSpareQuoteItems: quoteItems.length > 0,
      });

      quoteItems.forEach((item: any, index: number) => {
        const suppliers = Array.isArray(item?.suppliers) ? item.suppliers : [];
        const addQuoteItem = (supplier: any = {}, supplierIndex?: number) => {
          const sourceQuantity = this.rowQuantity(item);
          const purchasePrice = this.firstNumber(
            supplier?.purchasePrice,
            supplier?.price,
            supplier?.unitPrice,
            supplier?.unitPriceInclTax,
            supplier?.unitPriceExclTax,
            item?.purchasePrice,
            item?.price,
            item?.unitPrice,
            item?.cost
          );

          options.push(
            this.buildOption(base, {
              quoteProductId: buildSourceProductId(
                'spareQuoteItems',
                index,
                supplierIndex
              ),
              productId: item?.productId,
              productName: this.firstText(
                item?.name,
                item?.materialName,
                item?.productName,
                item?.goodsName
              ),
              brand: this.firstText(item?.brand, supplier?.brand),
              model: this.firstText(item?.model, item?.spec, item?.specification),
              quality: this.firstText(item?.quality, supplier?.quality),
              sourceQuantity,
              purchasePrice,
              sourceType: 'spareQuoteItems',
            })
          );
        };

        if (suppliers.length === 0) {
          addQuoteItem();
          return;
        }
        suppliers.forEach((supplier: any, supplierIndex: number) =>
          addQuoteItem(supplier, supplierIndex)
        );
      });

      if (quoteItems.length > 0) return;

      const productItems = this.parseArray(row.productItems);
      productItems.forEach((item: any, index: number) => {
        options.push(
          this.buildOption(base, {
            quoteProductId: buildSourceProductId('productItems', index),
            productId: item?.productId,
            productName: this.firstText(
              item?.productName,
              item?.name,
              item?.goodsName,
              item?.materialName
            ),
            brand: item?.brand,
            model: this.firstText(item?.model, item?.spec, item?.specification),
            quality: item?.quality,
            sourceQuantity: this.rowQuantity(item),
            purchasePrice: this.firstNumber(
              item?.purchasePrice,
              item?.supplierQuotePrice,
              item?.salesActualPrice,
              item?.quotePrice,
              item?.unitPrice,
              item?.price,
              item?.cost
            ),
            sourceType: 'productItems',
          })
        );
      });

      if (productItems.length > 0) return;

      const spareItems = this.parseArray(row.spareItems);
      spareItems.forEach((item: any, index: number) => {
        options.push(
          this.buildOption(base, {
            quoteProductId: buildSourceProductId('spareItems', index),
            productId: item?.productId,
            productName: this.firstText(
              item?.name,
              item?.productName,
              item?.goodsName,
              item?.materialName
            ),
            brand: item?.brand,
            model: this.firstText(item?.model, item?.spec, item?.specification),
            quality: item?.quality,
            sourceQuantity: this.rowQuantity(item),
            purchasePrice: null,
            sourceType: 'spareItems',
          })
        );
      });

      if (spareItems.length > 0) return;

      const equipmentModelQty = this.firstText(row.equipmentModelQty);
      if (equipmentModelQty) {
        options.push(
          this.buildOption(base, {
            quoteProductId: buildSourceProductId('equipmentModelQty', 0),
            productName: equipmentModelQty,
            brand: row.equipmentBrand,
            model: equipmentModelQty,
            quality: '',
            sourceQuantity: null,
            purchasePrice: null,
            sourceType: 'equipmentModelQty',
          })
        );
      }
    });

    const list = keyWord
      ? options.filter(item =>
          [
            item.productName,
            item.brand,
            item.model,
            item.quality,
            item.quoteNo,
            item.inquiryNo,
            item.customerName,
            item.supplierName,
            item.projectName,
          ]
            .filter(Boolean)
            .some(value => String(value).includes(keyWord))
        )
      : options;

    console.log(
      '[purchaseContract] quoteProductOptions options count',
      list.length
    );

    return {
      list: list.map(item => {
        const sourceQuantity = this.optionalPositiveNumber(item.sourceQuantity);
        const pending =
          item.pendingPurchaseQuantity === undefined ||
          item.pendingPurchaseQuantity === null ||
          item.pendingPurchaseQuantity === ''
            ? sourceQuantity
            : this.optionalPositiveNumber(item.pendingPurchaseQuantity);
        const purchaseQuantity =
          item.purchaseQuantity === undefined ||
          item.purchaseQuantity === null ||
          item.purchaseQuantity === ''
            ? sourceQuantity || 1
            : Number(item.purchaseQuantity);

        return {
          ...item,
          sourceQuantity,
          pendingPurchaseQuantity: pending,
          purchasedQuantity:
            item.purchasedQuantity === undefined ||
            item.purchasedQuantity === null ||
            item.purchasedQuantity === ''
              ? 0
              : Number(item.purchasedQuantity),
          purchaseQuantity,
          amount:
            item.purchasePrice !== null && item.purchasePrice !== undefined
              ? this.round(Number(item.purchasePrice) * purchaseQuantity)
              : 0,
        };
      }),
    };
  }
}
