import { BaseService, CoolTransaction } from '@cool-midway/core';
import { Inject, Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { CompanyLeadEntity } from '../entity/lead';

/**
 * 公司目录-销售部-线索
 */
@Provide()
export class CompanyLeadService extends BaseService {
  @Inject()
  ctx;

  @InjectEntityModel(CompanyLeadEntity)
  companyLeadEntity: Repository<CompanyLeadEntity>;

  private getCurrentUser() {
    const userIdNum = Number(this.ctx?.admin?.userId);
    const userId =
      Number.isFinite(userIdNum) && userIdNum > 0 ? userIdNum : null;
    const userName =
      this.ctx?.admin?.name ||
      this.ctx?.admin?.nickName ||
      this.ctx?.admin?.username ||
      null;

    return {
      userId,
      userName,
    };
  }

  private getStatusLabel(status: number) {
    const map = ['待跟进', '跟进中', '转化成功', '已放弃'];
    return map[status] || '待跟进';
  }

  private normalizeDevelopStatus(status: any) {
    const statusNum = Number(status);
    return [0, 1, 2, 3].includes(statusNum) ? statusNum : 0;
  }

  private ensureLeadPayload(data: any) {
    const leadNo = String(data?.leadNo || '').trim();
    const leadTitle = String(data?.leadTitle || '').trim();
    const leadDetail = String(data?.leadDetail || '').trim();

    if (!leadNo) {
      throw new Error('线索编号不能为空');
    }
    if (!leadTitle) {
      throw new Error('线索题目不能为空');
    }
    if (!leadDetail) {
      throw new Error('线索详情不能为空');
    }

    return {
      leadNo,
      leadTitle,
      leadDetail,
    };
  }

  private buildPrompt(data: {
    leadNo: string;
    leadTitle: string;
    leadDetail: string;
    leadStatus: number;
  }) {
    return [
      '你是一名销售线索分析助手，请基于线索内容给出结构化分析。',
      `线索编号：${data.leadNo}`,
      `线索题目：${data.leadTitle}`,
      `线索详情：${data.leadDetail}`,
      `当前状态：${this.getStatusLabel(data.leadStatus)}`,
      '输出要求：',
      '1) 线索价值判断（高/中/低 + 理由）',
      '2) 关键风险（最多3条）',
      '3) 跟进策略（沟通对象、沟通方式、节奏）',
      '4) 下一步动作（3条，尽量可执行）',
    ].join('\n');
  }

  private buildPromptAnalysis(data: {
    leadNo: string;
    leadTitle: string;
    leadDetail: string;
    leadStatus: number;
  }) {
    const text = `${data.leadTitle} ${data.leadDetail}`.toLowerCase();

    const hasBudget = /预算|金额|报价|price|budget|采购/.test(text);
    const hasDecisionMaker = /老板|总监|经理|负责人|决策|采购部|决策人/.test(
      text
    );
    const hasTimeline = /本周|本月|下周|尽快|紧急|季度|交期|时间/.test(text);
    const hasCompetitor = /竞品|比价|对比|替代|已有供应商/.test(text);
    const hasContact = /电话|微信|邮箱|联系人|手机|回访/.test(text);

    let score = 45;
    if (hasBudget) score += 15;
    if (hasDecisionMaker) score += 15;
    if (hasTimeline) score += 12;
    if (hasContact) score += 8;
    if (hasCompetitor) score -= 8;
    score = Math.max(5, Math.min(95, score));

    let level = '中';
    if (score >= 75) level = '高';
    if (score <= 45) level = '低';

    const risks: string[] = [];
    if (!hasBudget) risks.push('预算信息不明确，报价落地概率存在不确定性。');
    if (!hasDecisionMaker) risks.push('决策链条未确认，可能造成推进周期拉长。');
    if (!hasTimeline) risks.push('需求时间窗口不清晰，优先级判断困难。');
    if (hasCompetitor) risks.push('存在竞品比价风险，需提前准备差异化价值点。');
    if (!risks.length) {
      risks.push('当前风险整体可控，重点关注沟通节奏与需求变化。');
    }

    const actions = [
      '在24小时内完成一次有效触达，确认核心需求与预算区间。',
      '补全决策人、使用场景、交付时间三个关键字段。',
      '准备一版针对该线索的价值主张与报价框架，便于下一轮沟通。',
    ];

    const strategy = [
      `沟通对象：${
        hasDecisionMaker
          ? '已触达决策相关角色，可继续深挖'
          : '优先定位决策人/采购负责人'
      }`,
      `沟通方式：${
        hasContact
          ? '优先沿用现有联系方式（电话/微信）'
          : '先补齐可直连联系方式，再安排触达'
      }`,
      `跟进节奏：${
        hasTimeline
          ? '按需求时间节点推进，每2天同步一次'
          : '采用“首触达+48小时复盘”的节奏'
      }`,
    ];

    return [
      `【线索价值判断】${level}（评分 ${score}/100）`,
      `当前状态：${this.getStatusLabel(data.leadStatus)}`,
      '',
      '【关键风险】',
      ...risks.map((e, i) => `${i + 1}. ${e}`),
      '',
      '【跟进策略】',
      ...strategy.map((e, i) => `${i + 1}. ${e}`),
      '',
      '【下一步动作】',
      ...actions.map((e, i) => `${i + 1}. ${e}`),
    ].join('\n');
  }

  /**
   * 新增线索（线索开发阶段仅允许：待跟进/跟进中）
   */
  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async add(param: any, queryRunner?: QueryRunner) {
    delete param.id;

    const repo = queryRunner.manager.getRepository(CompanyLeadEntity);
    const { userId, userName } = this.getCurrentUser();
    const base = this.ensureLeadPayload(param);

    const saved = await repo.save({
      ...param,
      ...base,
      leadStatus: this.normalizeDevelopStatus(param?.leadStatus),
      ownerUserId: userId,
      ownerName: userName,
      lastEditUserId: userId,
      lastEditName: userName,
    });

    return { id: saved.id };
  }

  /**
   * 更新前统一处理最后编辑人与线索开发态状态值
   */
  async modifyBefore(data: any, type: 'delete' | 'update' | 'add') {
    if (type !== 'add' && type !== 'update') {
      return;
    }

    const { userId, userName } = this.getCurrentUser();

    if (type === 'update') {
      data.lastEditUserId = userId;
      data.lastEditName = userName;

      if (Object.prototype.hasOwnProperty.call(data, 'leadStatus')) {
        data.leadStatus = this.normalizeDevelopStatus(data.leadStatus);
      }

      if (
        Object.prototype.hasOwnProperty.call(data, 'leadNo') ||
        Object.prototype.hasOwnProperty.call(data, 'leadTitle') ||
        Object.prototype.hasOwnProperty.call(data, 'leadDetail')
      ) {
        const current = await this.companyLeadEntity.findOne({
          where: { id: Number(data.id) || 0 },
        });

        this.ensureLeadPayload({
          leadNo: data.leadNo ?? current?.leadNo,
          leadTitle: data.leadTitle ?? current?.leadTitle,
          leadDetail: data.leadDetail ?? current?.leadDetail,
        });
      }
    }
  }

  /**
   * 线索开发分页（进行中：待跟进/跟进中）
   */
  async developmentPage(query: any) {
    const qb = this.companyLeadEntity.createQueryBuilder('a');

    qb.where('a.leadStatus IN (:...statuses)', { statuses: [0, 1] });

    const statusNum = Number(query?.leadStatus);
    if ([0, 1].includes(statusNum)) {
      qb.andWhere('a.leadStatus = :leadStatus', { leadStatus: statusNum });
    }

    if (query?.keyWord) {
      qb.andWhere(
        '(a.leadNo like :kw or a.leadTitle like :kw or a.leadDetail like :kw)',
        {
          kw: `%${query.keyWord}%`,
        }
      );
    }

    return this.entityRenderPage(qb, query);
  }

  /**
   * 线索全部分页（支持状态筛选）
   */
  async page(query: any) {
    const qb = this.companyLeadEntity.createQueryBuilder('a');

    if (query?.leadStatuses && Array.isArray(query.leadStatuses)) {
      qb.where('a.leadStatus IN (:...statuses)', {
        statuses: query.leadStatuses,
      });
    }

    if (query?.keyWord) {
      qb.andWhere(
        '(a.leadNo like :kw or a.leadTitle like :kw or a.leadDetail like :kw)',
        {
          kw: `%${query.keyWord}%`,
        }
      );
    }

    return this.entityRenderPage(qb, query);
  }

  /**
   * 线索管理分页（结果态：转化成功/已放弃）
   */
  async managementPage(query: any) {
    const qb = this.companyLeadEntity.createQueryBuilder('a');

    qb.where('a.leadStatus IN (:...statuses)', { statuses: [2, 3] });

    const statusNum = Number(query?.leadStatus);
    if ([2, 3].includes(statusNum)) {
      qb.andWhere('a.leadStatus = :leadStatus', { leadStatus: statusNum });
    }

    if (query?.keyWord) {
      qb.andWhere(
        '(a.leadNo like :kw or a.leadTitle like :kw or a.leadDetail like :kw)',
        {
          kw: `%${query.keyWord}%`,
        }
      );
    }

    return this.entityRenderPage(qb, query);
  }

  private async updateResultStatus(
    id: number,
    targetStatus: 2 | 3,
    queryRunner?: QueryRunner
  ) {
    const idNum = Number(id);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      throw new Error('缺少/无效的线索ID');
    }

    const repo = queryRunner
      ? queryRunner.manager.getRepository(CompanyLeadEntity)
      : this.companyLeadEntity;

    const lead = await repo.findOne({ where: { id: idNum } });
    if (!lead) {
      throw new Error('线索不存在');
    }

    const { userId, userName } = this.getCurrentUser();
    await repo.update(idNum, {
      leadStatus: targetStatus,
      lastEditUserId: userId,
      lastEditName: userName,
      updateTime: new Date(),
    });

    return { id: idNum, leadStatus: targetStatus };
  }

  /**
   * 线索转化成功
   */
  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async toSuccess(param: { id: number }, queryRunner?: QueryRunner) {
    return this.updateResultStatus(param?.id, 2, queryRunner);
  }

  /**
   * 线索放弃
   */
  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async toDiscard(param: { id: number }, queryRunner?: QueryRunner) {
    return this.updateResultStatus(param?.id, 3, queryRunner);
  }

  /**
   * 线索AI分析（仅提示词策略，无知识库）
   */
  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async aiAnalyze(
    param: {
      id?: number;
      leadNo?: string;
      leadTitle?: string;
      leadDetail?: string;
      leadStatus?: number;
    },
    queryRunner?: QueryRunner
  ) {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(CompanyLeadEntity)
      : this.companyLeadEntity;

    const idNum = Number(param?.id);
    const lead =
      Number.isFinite(idNum) && idNum > 0
        ? await repo.findOne({ where: { id: idNum } })
        : null;

    const merged = {
      leadNo: param?.leadNo ?? lead?.leadNo,
      leadTitle: param?.leadTitle ?? lead?.leadTitle,
      leadDetail: param?.leadDetail ?? lead?.leadDetail,
      leadStatus: Number(param?.leadStatus ?? lead?.leadStatus ?? 0),
    };

    const base = this.ensureLeadPayload(merged);
    const modelInput = {
      ...base,
      leadStatus: [0, 1, 2, 3].includes(merged.leadStatus)
        ? merged.leadStatus
        : 0,
    };

    const prompt = this.buildPrompt(modelInput);
    const analysis = this.buildPromptAnalysis(modelInput);

    if (lead?.id) {
      const { userId, userName } = this.getCurrentUser();
      await repo.update(lead.id, {
        aiAnalysis: analysis,
        lastEditUserId: userId,
        lastEditName: userName,
        updateTime: new Date(),
      });
    }

    return {
      analysis,
      prompt,
    };
  }
}
