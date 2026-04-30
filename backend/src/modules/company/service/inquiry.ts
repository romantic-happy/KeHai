import { BaseService, CoolTransaction } from '@cool-midway/core';
import { Inject, Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import * as moment from 'moment';
import { In, QueryRunner, Repository } from 'typeorm';
import { CompanyInquiryEntity } from '../entity/inquiry';
import { CompanyQuoteEntity } from '../entity/quote';
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { BaseSysMenuEntity } from '../../base/entity/sys/menu';
import { BaseSysRoleMenuEntity } from '../../base/entity/sys/role_menu';
import { BaseSysUserRoleEntity } from '../../base/entity/sys/user_role';
import { BaseSysPermsService } from '../../base/service/sys/perms';

/**
 * 公司目录-询价
 */
@Provide()
export class CompanyInquiryService extends BaseService {
  @Inject()
  ctx;

  @InjectEntityModel(CompanyInquiryEntity)
  companyInquiryEntity: Repository<CompanyInquiryEntity>;

  @InjectEntityModel(CompanyQuoteEntity)
  companyQuoteEntity: Repository<CompanyQuoteEntity>;

  @InjectEntityModel(BaseSysMenuEntity)
  baseSysMenuEntity: Repository<BaseSysMenuEntity>;

  @InjectEntityModel(BaseSysRoleMenuEntity)
  baseSysRoleMenuEntity: Repository<BaseSysRoleMenuEntity>;

  @InjectEntityModel(BaseSysUserRoleEntity)
  baseSysUserRoleEntity: Repository<BaseSysUserRoleEntity>;

  @Inject()
  baseSysPermsService: BaseSysPermsService;

  /**
   * TODO: 后续接入 AI 生成/回填流程后，再放开这些字段的业务写入。
   * 当前阶段 AI 字段统一置空，避免前端误写入导致数据语义不一致。
   */
  private normalizeAiFieldsToNull(param: any) {
    param.aiCategory = null;
    param.aiCategoryAnalysis = null;
    param.aiHistoryQuote = null;
    param.aiHistoryQuoteBasis = null;
  }

  /**
   * 负责人默认取填写人，但允许业务显式指定负责人姓名。
   */
  private normalizeOwnerName(param: any) {
    const creatorId = Number(param?.createUserId ?? this.ctx?.admin?.userId);
    const creatorName = String(
      this.ctx?.admin?.name ??
        this.ctx?.admin?.nickName ??
        this.ctx?.admin?.username ??
        ''
    ).trim();
    const ownerName =
      typeof param?.ownerName === 'string' ? param.ownerName.trim() : '';

    param.createUserId =
      Number.isFinite(creatorId) && creatorId > 0 ? creatorId : null;
    param.ownerName = ownerName || creatorName || null;
  }

  /**
   * 统一同步报价业务状态：0未报价 1报价中 2已报价
   */
  async syncBizStatus(queryRunner?: QueryRunner) {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(CompanyInquiryEntity)
      : this.companyInquiryEntity;

    // 无当前有效报价，统一回退为未报价
    await repo
      .createQueryBuilder()
      .update(CompanyInquiryEntity)
      .set({ quoteBizStatus: 0 })
      .where('quoteId is null OR requotePending = :requotePending', {
        requotePending: 1,
      })
      .andWhere('quoteBizStatus <> :bizStatus', { bizStatus: 0 })
      .execute();

    // 有报价且未待重报时，若状态非法则纠正为“报价中”（已报价=2由 accept 显式写入）
    await repo
      .createQueryBuilder()
      .update(CompanyInquiryEntity)
      .set({ quoteBizStatus: 1 })
      .where('quoteId is not null')
      .andWhere('requotePending = :requotePending', { requotePending: 0 })
      .andWhere('quoteBizStatus NOT IN (:...validStatus)', {
        validStatus: [1, 2],
      })
      .execute();

    return true;
  }

  /**
   * 新增（自动生成询价单号）
   */
  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async add(param: any, queryRunner?: QueryRunner) {
    delete param.id;

    this.normalizeAiFieldsToNull(param);
    this.normalizeOwnerName(param);

    const repo = queryRunner.manager.getRepository(CompanyInquiryEntity);

    const dateStr = moment().format('YYYYMMDD');
    const inquiryType = Number(param.inquiryType ?? 0);
    param.inquiryType = inquiryType;
    delete param.salesCategory;

    if (!Array.isArray(param.collaboratorUserIds)) {
      param.collaboratorUserIds = null;
    }
    if (!Array.isArray(param.attachments)) {
      param.attachments = null;
    }
    if (!Array.isArray(param.productItems)) {
      param.productItems = null;
    }

    param.deadlineDate = param.deadlineDate
      ? moment(param.deadlineDate).format('YYYY-MM-DD')
      : null;

    // 0-机械加工类 JG，1-机械维修类 WX，2-机械保养类 BY，3-项目类 XM，4-备件类 BJ
    const typeCodeMap = ['JG', 'WX', 'BY', 'XM', 'BJ'];
    const typeCode = typeCodeMap[inquiryType] || 'JG';
    const prefix = `XJ-${typeCode}-${dateStr}`;
    const count = await repo
      .createQueryBuilder('a')
      .where('a.inquiryNo like :p', { p: `${prefix}-%` })
      .getCount();
    const seq = String(count + 1).padStart(4, '0');

    // 不同询价类型字段清理（避免前端切换类型后残留数据）
    if (inquiryType === 0) {
      // 机械加工类：清空维修、保养、项目、备件列表相关字段
      param.repairType = null;
      param.faultDescription = null;
      param.siteEnvironment = null;
      param.siteAttachments = null;
      param.debugOwnership = null;
      param.maintenanceType = null;
      param.maintenanceContent = null;
      param.projectConstructType = null;
      param.projectConstructContent = null;
      param.projectConstructAttachments = null;
      param.projectSiteEnvDesc = null;
      param.projectSiteEnvAttachments = null;
      param.spareItems = null;
      // 机械加工类保留吊装需求字段
    } else if (inquiryType === 1) {
      // 机械维修类：清空加工、保养、项目、备件列表相关字段
      param.processingRequirement = null;
      param.drawingAttachments = null;
      param.maintenanceType = null;
      param.maintenanceContent = null;
      param.projectConstructType = null;
      param.projectConstructContent = null;
      param.projectConstructAttachments = null;
      param.projectSiteEnvDesc = null;
      param.projectSiteEnvAttachments = null;
      param.spareItems = null;
      // 机械维修类保留吊装需求字段
    } else if (inquiryType === 2) {
      // 机械保养类：清空加工、维修、项目相关字段
      param.processingRequirement = null;
      param.drawingAttachments = null;
      param.repairType = null;
      param.faultDescription = null;
      param.siteAttachments = null;
      param.debugOwnership = null;
      param.projectConstructType = null;
      param.projectConstructContent = null;
      param.projectConstructAttachments = null;
      param.projectSiteEnvDesc = null;
      param.projectSiteEnvAttachments = null;
      // 保养类也使用现场环境字段(siteEnvironment)
      // 机械保养类保留吊装需求字段
    } else if (inquiryType === 3) {
      // 项目类：清空加工、维修、保养、备件专属字段
      param.processingRequirement = null;
      param.drawingAttachments = null;
      param.repairType = null;
      param.faultDescription = null;
      param.maintenanceType = null;
      param.maintenanceContent = null;
      param.siteAttachments = null;
      param.debugOwnership = null;
      param.spareItems = null;
      // 备件类目前共用通用补充需求字段 + spareItems 列表
    } else if (inquiryType === 4) {
      // 备件类：清空加工、维修、保养、项目专属字段
      param.processingRequirement = null;
      param.drawingAttachments = null;
      param.repairType = null;
      param.faultDescription = null;
      param.maintenanceType = null;
      param.maintenanceContent = null;
      param.projectLocation = null;
      param.address = null;
      param.projectStartDate = null;
      param.projectEndDate = null;
      param.siteEnvironment = null;
      param.siteAttachments = null;
      param.debugOwnership = null;
      param.projectConstructType = null;
      param.projectConstructContent = null;
      param.projectConstructAttachments = null;
      param.projectSiteEnvDesc = null;
      param.projectSiteEnvAttachments = null;
      // 备件类不再使用这些通用补充字段
      param.sparePartsDetail = null;
      param.toolRequirement = null;
      param.softwareRequirement = null;
      param.capabilityRequirement = null;
      param.workerTypeAndCount = null;
      param.specificPersonnel = null;
      param.initialConstructionPlan = null;
      // 备件类不需要吊装需求
      param.hoistingRequirement = null;
    }

    const saved = await repo.save({
      ...param,
      inquiryNo: `${prefix}-${seq}`,
      quoteId: null,
      requotePending: 0,
      quoteBizStatus: 0,
      dealStatus: Number(param.dealStatus ?? 0),
    });

    return { id: saved.id };
  }

  /**
   * 编辑询价（补充 AI 字段置空逻辑）
   */
  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async update(param: any): Promise<void> {
    if (!param?.id) {
      throw new Error('缺少询价ID');
    }

    delete param.salesCategory;
    this.normalizeAiFieldsToNull(param);
    if (Object.prototype.hasOwnProperty.call(param, 'ownerName')) {
      param.ownerName =
        typeof param.ownerName === 'string' && param.ownerName.trim()
          ? param.ownerName.trim()
          : null;
    }
    await super.update(param);
  }

  /**
   * 销售端：报价单进度列表（分页）
   * - 待报价：quoteId 为空，quoteNo 为 null
   * - 报价中/已报价：quoteId 指向公司当前报价记录
   * - 负责人默认取填写人，但允许独立配置 ownerName
   */
  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async progressPage(query: any) {
    await this.syncBizStatus();

    const qb = this.companyInquiryEntity.createQueryBuilder('a');

    // 当前有效报价号
    qb.leftJoin(CompanyQuoteEntity, 'b', 'a.quoteId = b.id');

    // 填写人
    qb.leftJoin(BaseSysUserEntity, 'c', 'a.createUserId = c.id');

    qb.where('1=1');

    const quoteBizStatusNum =
      query?.quoteBizStatus === undefined || query?.quoteBizStatus === null
        ? null
        : Number(query.quoteBizStatus);
    if (quoteBizStatusNum !== null && [0, 1, 2].includes(quoteBizStatusNum)) {
      qb.andWhere('a.quoteBizStatus = :quoteBizStatus', {
        quoteBizStatus: quoteBizStatusNum,
      });
    }

    qb.select([
      'a.*',
      'b.quoteNo as quoteNo',
      'c.nickName as createUserName',
      'IFNULL(a.ownerName, c.nickName) as ownerName',
      'a.quoteBizStatus as quoteBizStatus',
    ]);

    return this.entityRenderPage(qb, query);
  }

  /**
   * 销售端接受某条报价：
   * - 设置询价 quoteId=quoteId
   */
  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async accept(quoteId: number, queryRunner?: QueryRunner) {
    const quoteIdNum = Number(quoteId);
    if (!Number.isFinite(quoteIdNum) || quoteIdNum <= 0) {
      throw new Error('缺少/无效的 quoteId');
    }

    const quoteRepo = queryRunner
      ? queryRunner.manager.getRepository(CompanyQuoteEntity)
      : this.companyQuoteEntity;
    const inquiryRepo = queryRunner
      ? queryRunner.manager.getRepository(CompanyInquiryEntity)
      : this.companyInquiryEntity;

    const quote = await quoteRepo.findOne({
      where: { id: quoteIdNum },
    });
    if (!quote) {
      throw new Error('报价记录不存在');
    }
    if (!quote.inquiryId) {
      throw new Error('报价关联的询价不存在');
    }

    // 接受的报价应标记为有效
    await quoteRepo.update(quoteIdNum, { isRejected: 0 });

    await inquiryRepo.update(quote.inquiryId, {
      quoteId: quoteIdNum,
      requotePending: 0,
      quoteBizStatus: 2,
      rejectReason: null,
    });
  }

  /**
   * 销售端拒绝某条报价：
   * - 标记该 quote 为已拒绝（isRejected=1）
   * - 若该 quote 正是询价当前 quoteId，则询价进入待重报
   *   且保留 quoteId，便于供应链再次报价时复用已填字段
   */
  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async reject(
    quoteId: number,
    rejectReason?: string,
    queryRunner?: QueryRunner
  ) {
    const quoteIdNum = Number(quoteId);
    if (!Number.isFinite(quoteIdNum) || quoteIdNum <= 0) {
      throw new Error('缺少/无效的 quoteId');
    }

    const quoteRepo = queryRunner
      ? queryRunner.manager.getRepository(CompanyQuoteEntity)
      : this.companyQuoteEntity;
    const inquiryRepo = queryRunner
      ? queryRunner.manager.getRepository(CompanyInquiryEntity)
      : this.companyInquiryEntity;

    const quote = await quoteRepo.findOne({
      where: { id: quoteIdNum },
    });
    if (!quote) {
      throw new Error('报价记录不存在');
    }
    if (!quote.inquiryId) {
      throw new Error('报价关联的询价不存在');
    }

    await quoteRepo.update(quoteIdNum, { isRejected: 1 });

    // 只有当拒绝的是当前生效报价时，才更新询价为未报价并保留 quoteId
    const inquiry = await inquiryRepo.findOne({
      where: { id: quote.inquiryId },
    });
    if (inquiry && inquiry.quoteId === quoteIdNum) {
      await inquiryRepo.update(quote.inquiryId, {
        quoteId: quoteIdNum,
        requotePending: 1,
        quoteBizStatus: 0,
        rejectReason: rejectReason ? String(rejectReason) : null,
      });
    }
  }

  /**
   * 填写销售实际报价（逐产品）
   */
  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async saveSalesPricing(param: any, queryRunner?: QueryRunner) {
    const inquiryId = Number(param?.inquiryId);
    if (!Number.isFinite(inquiryId) || inquiryId <= 0) {
      throw new Error('缺少/无效的 inquiryId');
    }

    const inquiryRepo = queryRunner
      ? queryRunner.manager.getRepository(CompanyInquiryEntity)
      : this.companyInquiryEntity;

    const inquiry = await inquiryRepo.findOne({ where: { id: inquiryId } });
    if (!inquiry) {
      throw new Error('询价不存在');
    }
    if (!inquiry.quoteId || Number(inquiry.requotePending) === 1) {
      throw new Error('当前询价无有效报价，不能填写销售实际报价');
    }

    const productItems = Array.isArray(param?.productItems)
      ? param.productItems
      : inquiry.productItems;
    if (!Array.isArray(productItems) || !productItems.length) {
      throw new Error('请先维护产品明细');
    }

    for (const item of productItems) {
      const salesActualPrice = Number(item?.salesActualPrice);
      if (!Number.isFinite(salesActualPrice) || salesActualPrice < 0) {
        throw new Error('请为每个产品填写有效的销售实际报价');
      }
    }

    await inquiryRepo.update(inquiryId, {
      productItems,
      salesQuoteRemark: param?.salesQuoteRemark || null,
      salesQuoteTime: new Date(),
    });

    return { id: inquiryId };
  }

  /**
   * 未成单：记录丢单原因
   */
  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async saveLostDeal(param: any, queryRunner?: QueryRunner) {
    const inquiryId = Number(param?.inquiryId);
    if (!Number.isFinite(inquiryId) || inquiryId <= 0) {
      throw new Error('缺少/无效的 inquiryId');
    }

    const lostReason = param?.lostReason;
    if (!lostReason) {
      throw new Error('未成单时必须填写丢单原因');
    }

    const salesQuoteNum = Number(param?.salesQuote);
    if (!Number.isFinite(salesQuoteNum) || salesQuoteNum < 0) {
      throw new Error('请填写有效的销售报价');
    }

    const inquiryRepo = queryRunner
      ? queryRunner.manager.getRepository(CompanyInquiryEntity)
      : this.companyInquiryEntity;
    const inquiry = await inquiryRepo.findOne({ where: { id: inquiryId } });
    if (!inquiry) {
      throw new Error('询价不存在');
    }

    // TODO: 后续接入 AI 生成/回填流程后，再放开这些字段的业务写入。
    // TODO: 未成单记录归档逻辑待完善

    await inquiryRepo.update(inquiryId, {
      dealStatus: 1,
      lostReason: String(lostReason),
      salesQuote: salesQuoteNum,
    });

    return { id: inquiryId, dealStatus: 1 };
  }

  /**
   * 已成单：转换合同订单，部分内容流转到成单记录中
   */
  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async convertToContractOrder(param: any, queryRunner?: QueryRunner) {
    const inquiryId = Number(param?.inquiryId);
    if (!Number.isFinite(inquiryId) || inquiryId <= 0) {
      throw new Error('缺少/无效的 inquiryId');
    }

    const salesQuoteNum = Number(param?.salesQuote);
    if (!Number.isFinite(salesQuoteNum) || salesQuoteNum < 0) {
      throw new Error('请填写有效的销售报价');
    }

    const inquiryRepo = queryRunner
      ? queryRunner.manager.getRepository(CompanyInquiryEntity)
      : this.companyInquiryEntity;
    const inquiry = await inquiryRepo.findOne({ where: { id: inquiryId } });
    if (!inquiry) {
      throw new Error('询价不存在');
    }

    // TODO: 后续接入 AI 生成/回填流程后，再放开这些字段的业务写入。
    // TODO: 合同订单创建逻辑待完善
    // TODO: 成单记录归档逻辑待完善（部分内容流转到成单记录中）
    // TODO: 供应链报价转采购报价，销售增加利润与客户议价的流转逻辑待完善

    await inquiryRepo.update(inquiryId, {
      dealStatus: 2,
      contractOrderNo: param?.contractOrderNo || null,
      salesQuote: salesQuoteNum,
    });

    return { id: inquiryId, dealStatus: 2 };
  }

  /**
   * 提交成单结果
   */
  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async saveDealResult(param: any, queryRunner?: QueryRunner) {
    const inquiryId = Number(param?.inquiryId);
    if (!Number.isFinite(inquiryId) || inquiryId <= 0) {
      throw new Error('缺少/无效的 inquiryId');
    }

    const dealStatus = Number(param?.dealStatus);
    if (![1, 2].includes(dealStatus)) {
      throw new Error('dealStatus 仅支持 1-未成单 2-已成单');
    }

    const inquiryRepo = queryRunner
      ? queryRunner.manager.getRepository(CompanyInquiryEntity)
      : this.companyInquiryEntity;
    const inquiry = await inquiryRepo.findOne({ where: { id: inquiryId } });
    if (!inquiry) {
      throw new Error('询价不存在');
    }

    if (dealStatus === 1 && !param?.lostReason) {
      throw new Error('未成单时必须填写丢单原因');
    }
    if (dealStatus === 2 && !param?.contractOrderNo) {
      throw new Error('已成单时必须填写合同订单号');
    }

    await inquiryRepo.update(inquiryId, {
      dealStatus,
      lostReason: dealStatus === 1 ? String(param.lostReason) : null,
      contractOrderNo:
        dealStatus === 2
          ? String(param.contractOrderNo)
          : inquiry.contractOrderNo,
    });

    return { id: inquiryId, dealStatus };
  }

  /**
   * 确保“报价单”菜单存在，避免权限同步因脏数据/缺失数据失败。
   */
  private async ensureQuoteMenu() {
    const quoteRouter = '/company/business/quote';
    let quoteMenu = await this.baseSysMenuEntity.findOne({
      where: {
        router: quoteRouter,
      },
      order: {
        id: 'ASC',
      },
    });

    if (!quoteMenu) {
      quoteMenu = await this.baseSysMenuEntity.findOne({
        where: {
          name: '报价单',
        },
        order: {
          id: 'ASC',
        },
      });
    }

    let businessMenu = await this.baseSysMenuEntity.findOne({
      where: {
        router: '/company/business',
      },
      order: {
        id: 'ASC',
      },
    });

    if (!businessMenu) {
      const companyMenu = await this.baseSysMenuEntity.findOne({
        where: {
          router: '/company',
        },
        order: {
          id: 'ASC',
        },
      });
      businessMenu = await this.baseSysMenuEntity.save({
        parentId: companyMenu?.id ?? null,
        name: '销售管理',
        router: '/company/business',
        perms: null,
        type: 0,
        icon: 'icon-menu',
        orderNum: 1,
        viewPath: null,
        keepAlive: true,
        isShow: true,
      } as any);
    }

    if (!quoteMenu) {
      quoteMenu = await this.baseSysMenuEntity.save({
        parentId: businessMenu.id,
        name: '报价单',
        router: quoteRouter,
        perms: null,
        type: 1,
        icon: 'icon-log',
        orderNum: 2,
        viewPath: 'modules/company/views/business/quote.vue',
        keepAlive: true,
        isShow: true,
      } as any);
      return quoteMenu;
    }

    const patch: any = {};
    if (quoteMenu.type !== 1) {
      patch.type = 1;
    }
    if (quoteMenu.router !== quoteRouter) {
      patch.router = quoteRouter;
    }
    if (!quoteMenu.parentId && businessMenu?.id) {
      patch.parentId = businessMenu.id;
    }
    if (Object.keys(patch).length > 0) {
      await this.baseSysMenuEntity.update(quoteMenu.id, patch);
      Object.assign(quoteMenu, patch);
    }
    return quoteMenu;
  }

  /**
   * 确保“报价单-权限”菜单存在且为按钮类型(type=2)。
   */
  private async ensureQuotePermMenu(
    quoteMenuId: number,
    requiredPerms: string[]
  ) {
    let permMenu = await this.baseSysMenuEntity.findOne({
      where: {
        parentId: quoteMenuId,
        type: 2,
      },
      order: {
        id: 'ASC',
      },
    });

    if (!permMenu) {
      // 历史数据中可能存在 type 错误的“权限”菜单，优先纠正它。
      const legacyPermMenu = await this.baseSysMenuEntity.findOne({
        where: {
          parentId: quoteMenuId,
          name: '权限',
        },
        order: {
          id: 'ASC',
        },
      });
      if (legacyPermMenu) {
        await this.baseSysMenuEntity.update(legacyPermMenu.id, {
          type: 2,
          router: null,
        });
        legacyPermMenu.type = 2;
        legacyPermMenu.router = null;
        permMenu = legacyPermMenu;
      }
    }

    if (!permMenu) {
      permMenu = await this.baseSysMenuEntity.save({
        parentId: quoteMenuId,
        name: '权限',
        router: null,
        perms: requiredPerms.join(','),
        type: 2,
        icon: null,
        orderNum: 0,
        viewPath: null,
        keepAlive: true,
        isShow: true,
      } as any);
      return permMenu;
    }

    const currentPerms = (permMenu.perms || '')
      .split(',')
      .map(e => e.trim())
      .filter(Boolean);
    const merged = Array.from(new Set([...currentPerms, ...requiredPerms]));
    const mergedText = merged.join(',');
    const patch: any = {};
    if (mergedText !== (permMenu.perms || '')) {
      patch.perms = mergedText;
    }
    if (permMenu.type !== 2) {
      patch.type = 2;
    }
    if (permMenu.router !== null) {
      patch.router = null;
    }
    if (Object.keys(patch).length > 0) {
      await this.baseSysMenuEntity.update(permMenu.id, patch);
      Object.assign(permMenu, patch);
    }
    return permMenu;
  }

  /**
   * 同步销售报价页“同意/拒绝”权限到菜单、角色和用户缓存
   */
  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async syncQuotePerms() {
    const requiredPerms = ['company:inquiry:accept', 'company:inquiry:reject'];
    const quoteMenu = await this.ensureQuoteMenu();
    const permMenu = await this.ensureQuotePermMenu(
      quoteMenu.id,
      requiredPerms
    );

    const quoteRoleMenus = await this.baseSysRoleMenuEntity.findBy({
      menuId: quoteMenu.id,
    });
    const roleIds = Array.from(new Set(quoteRoleMenus.map(e => e.roleId)));

    if (roleIds.length > 0) {
      const existing = await this.baseSysRoleMenuEntity.find({
        where: {
          menuId: permMenu.id,
          roleId: In(roleIds),
        },
      });
      const existRoleIdSet = new Set(existing.map(e => e.roleId));
      const appendRows = roleIds
        .filter(roleId => !existRoleIdSet.has(roleId))
        .map(roleId => ({ roleId, menuId: permMenu.id }));
      if (appendRows.length > 0) {
        await this.baseSysRoleMenuEntity.save(appendRows as any);
      }
    }

    const userRoleRows =
      roleIds.length > 0
        ? await this.baseSysUserRoleEntity.find({
            where: {
              roleId: In(roleIds),
            },
          })
        : [];
    const userIdSet = new Set(userRoleRows.map(e => e.userId));
    const currentUserId = Number(this.ctx?.admin?.userId);
    if (Number.isFinite(currentUserId) && currentUserId > 0) {
      userIdSet.add(currentUserId);
    }
    const userIds = Array.from(userIdSet);
    for (const userId of userIds) {
      await this.baseSysPermsService.refreshPerms(userId);
    }

    return {
      permMenuId: permMenu.id,
      roleCount: roleIds.length,
      userCount: userIds.length,
      perms: requiredPerms,
    };
  }
}
