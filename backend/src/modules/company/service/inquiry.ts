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
   * 新增（自动生成询价单号）
   */
  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async add(param: any, queryRunner?: QueryRunner) {
    delete param.id;

    const repo = queryRunner.manager.getRepository(CompanyInquiryEntity);

    const dateStr = moment().format('YYYYMMDD');
    const inquiryType = Number(param.inquiryType ?? 0);
    param.inquiryType = inquiryType;
    param.salesCategory = Number(param.salesCategory ?? inquiryType);

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
      quoteStatus: 0,
      quoteId: null,
      requotePending: 0,
    });

    return { id: saved.id };
  }

  /**
   * 销售端：报价单进度列表（分页）
   * - 待报价：quoteId 为空，quoteNo 为 null
   * - 报价中/已定：quoteId 指向公司当前报价记录
   * - 负责人展示 createUserId 对应的 nickName
   */
  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async progressPage(query: any) {
    const qb = this.companyInquiryEntity.createQueryBuilder('a');

    // 当前有效报价号
    qb.leftJoin(CompanyQuoteEntity, 'b', 'a.quoteId = b.id');

    // 负责人（填写人）
    qb.leftJoin(BaseSysUserEntity, 'c', 'a.createUserId = c.id');

    qb.where('1=1');

    // 可选过滤：若前端传了 quoteStatus 就做过滤；不传则展示全部
    const quoteStatusNum =
      query?.quoteStatus === undefined || query?.quoteStatus === null
        ? null
        : Number(query.quoteStatus);
    if (quoteStatusNum !== null && [0, 1, 2].includes(quoteStatusNum)) {
      qb.andWhere('a.quoteStatus = :quoteStatus', {
        quoteStatus: quoteStatusNum,
      });
    }

    qb.select(['a.*', 'b.quoteNo as quoteNo', 'c.nickName as createUserName']);

    return this.entityRenderPage(qb, query);
  }

  /**
   * 销售端接受某条报价：
   * - 设置询价 quoteStatus=2（报价已定）
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
      quoteStatus: 2,
      quoteId: quoteIdNum,
      requotePending: 0,
    });
  }

  /**
   * 销售端拒绝某条报价：
   * - 标记该 quote 为已拒绝（isRejected=1）
   * - 若该 quote 正是询价当前 quoteId，则询价保持 quoteStatus=1（报价中）
   *   且保留 quoteId，便于供应链再次报价时复用已填字段
   */
  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async reject(quoteId: number, queryRunner?: QueryRunner) {
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

    // 只有当拒绝的是当前生效报价时，才更新询价为报价中并保留 quoteId
    const inquiry = await inquiryRepo.findOne({
      where: { id: quote.inquiryId },
    });
    if (inquiry && inquiry.quoteId === quoteIdNum) {
      await inquiryRepo.update(quote.inquiryId, {
        quoteStatus: 1,
        quoteId: quoteIdNum,
        requotePending: 1,
      });
    }
  }

  /**
   * 同步销售报价页“同意/拒绝”权限到菜单、角色和用户缓存
   */
  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async syncQuotePerms() {
    const requiredPerms = ['company:inquiry:accept', 'company:inquiry:reject'];
    const quoteMenu = await this.baseSysMenuEntity.findOne({
      where: {
        router: '/company/business/quote',
        type: 1,
      },
    });
    if (!quoteMenu) {
      throw new Error('未找到报价单菜单');
    }

    let permMenu = await this.baseSysMenuEntity.findOne({
      where: {
        parentId: quoteMenu.id,
        type: 2,
      },
      order: {
        id: 'ASC',
      },
    });

    if (!permMenu) {
      permMenu = await this.baseSysMenuEntity.save({
        parentId: quoteMenu.id,
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
    } else {
      const currentPerms = (permMenu.perms || '')
        .split(',')
        .map(e => e.trim())
        .filter(Boolean);
      const merged = Array.from(new Set([...currentPerms, ...requiredPerms]));
      const mergedText = merged.join(',');
      if (mergedText !== (permMenu.perms || '')) {
        await this.baseSysMenuEntity.update(permMenu.id, { perms: mergedText });
        permMenu.perms = mergedText;
      }
    }

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
