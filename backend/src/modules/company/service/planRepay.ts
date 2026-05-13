import { BaseService, CoolTransaction } from '@cool-midway/core';
import { Provide, Inject } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { CompanyPlanRepayEntity } from '../entity/planRepay';

@Provide()
export class CompanyPlanRepayService extends BaseService {
  @Inject()
  ctx;

  @InjectEntityModel(CompanyPlanRepayEntity)
  companyPlanRepayEntity: Repository<CompanyPlanRepayEntity>;

  @CoolTransaction({ isolation: 'SERIALIZABLE' })
  async confirmRepay(param: any, queryRunner?: QueryRunner) {
    const id = Number(param?.id);
    if (!id) {
      throw new Error('缺少计划回款ID');
    }

    const repo = queryRunner.manager.getRepository(CompanyPlanRepayEntity);
    const record = await repo.findOne({ where: { id } });
    if (!record) {
      throw new Error('计划回款记录不存在');
    }
    if (record.repayStatus === 1) {
      throw new Error('该记录已确认回款，请勿重复操作');
    }

    await repo.update(id, {
      repayStatus: 1,
      actualRepayAmount: Number(param.actualRepayAmount) || Number(record.invoiceAmount) || 0,
      actualRepayDate: param.actualRepayDate || new Date().toISOString().slice(0, 10),
      remark: param.remark ?? record.remark,
      updateTime: new Date() as any,
    });

    return { id };
  }
}
