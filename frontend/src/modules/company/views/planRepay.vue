<template>
	<div class="company-plan-repay-crud">
		<cl-crud ref="Crud">
			<cl-row>
				<cl-refresh-btn />
				<cl-flex1 />
				<cl-search-key placeholder="搜索开票单号/客户/合同订单" :width="280" />
			</cl-row>

			<cl-row>
				<cl-table ref="Table" />
			</cl-row>

			<cl-row>
				<cl-flex1 />
				<cl-pagination />
			</cl-row>

			<cl-upsert ref="Upsert">
				<template #slot-repayForm="{ scope }">
					<div class="repay-upsert-body">
						<el-card shadow="never" class="repay-upsert-body__card">
							<template #header>
								<span class="repay-upsert-body__title">回款确认</span>
							</template>
							<el-row :gutter="16">
								<el-col :xs="24" :md="12">
									<el-form-item label="开票单号">
										<el-input :model-value="scope.invoiceNo" disabled />
									</el-form-item>
								</el-col>
								<el-col :xs="24" :md="12">
									<el-form-item label="客户名称">
										<el-input :model-value="scope.customerName" disabled />
									</el-form-item>
								</el-col>
								<el-col :xs="24" :md="12">
									<el-form-item label="合同订单号">
										<el-input :model-value="scope.contractOrderNo" disabled />
									</el-form-item>
								</el-col>
								<el-col :xs="24" :md="12">
									<el-form-item label="预计回款日期">
										<el-input :model-value="scope.expectedPaybackDate" disabled />
									</el-form-item>
								</el-col>
								<el-col :xs="24" :md="12">
									<el-form-item label="开票金额">
										<el-input :model-value="formatMoney(scope.invoiceAmount)" disabled>
											<template #append>元</template>
										</el-input>
									</el-form-item>
								</el-col>
								<el-col :xs="24" :md="12">
									<el-form-item label="货币名称">
										<el-input :model-value="scope.currency || '人民币'" disabled />
									</el-form-item>
								</el-col>
								<el-col :xs="24" :md="12">
									<el-form-item label="实际回款金额">
										<el-input-number
											v-model="scope.actualRepayAmount"
											:min="0"
											:precision="2"
											:step="100"
											controls-position="right"
											class="w-full"
										/>
									</el-form-item>
								</el-col>
								<el-col :xs="24" :md="12">
									<el-form-item label="实际回款日期">
										<el-date-picker
											v-model="scope.actualRepayDate"
											type="date"
											value-format="YYYY-MM-DD"
											placeholder="选择回款日期"
											class="w-full"
										/>
									</el-form-item>
								</el-col>
								<el-col :span="24">
									<el-form-item label="备注">
										<el-input
											v-model="scope.remark"
											type="textarea"
											:rows="2"
											maxlength="500"
											show-word-limit
										/>
									</el-form-item>
								</el-col>
							</el-row>
						</el-card>
					</div>
				</template>
			</cl-upsert>
		</cl-crud>
	</div>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'company-plan-repay'
});

import { useCrud, useTable, useUpsert } from '@cool-vue/crud';
import { useCool } from '/@/cool';
import { ElMessage, ElMessageBox } from 'element-plus';
import { onMounted, ref } from 'vue';

const { service } = useCool();

const planRepayApi = (service as any).company?.planRepay;
if (!planRepayApi?.page) {
	console.warn('[company-plan-repay] service.company.planRepay 未就绪，请启动后端并刷新以生成 eps');
}

type PlanRepayRecord = {
	id?: number;
	invoiceId?: number;
	invoiceNo?: string;
	customerId?: number;
	customerName?: string;
	contractOrderId?: number;
	contractOrderNo?: string;
	expectedPaybackDate?: string;
	invoiceAmount?: number;
	currency?: string;
	repayStatus?: number;
	actualRepayAmount?: number;
	actualRepayDate?: string;
	remark?: string;
	createTime?: string;
	updateTime?: string;
};

function repayStatusLabel(v?: number) {
	if (v === 1) return '已回款';
	return '未回款';
}

function formatMoney(n: number) {
	return (n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function handleConfirmRepay(row: PlanRepayRecord) {
	if (!row.id) return;
	if (row.repayStatus === 1) {
		ElMessage.warning('该记录已确认回款');
		return;
	}
	try {
		await ElMessageBox.confirm('确认该笔回款已到账？', '确认回款', {
			confirmButtonText: '确认',
			cancelButtonText: '取消',
			type: 'warning'
		});
		if (!planRepayApi?.confirmRepay) {
			ElMessage.error('确认回款接口未就绪');
			return;
		}
		await planRepayApi.confirmRepay({
			id: row.id,
			actualRepayAmount: row.invoiceAmount,
			actualRepayDate: new Date().toISOString().slice(0, 10)
		});
		ElMessage.success('确认回款成功');
		Crud.value?.refresh();
	} catch {
		// 用户取消
	}
}

const Table = useTable<PlanRepayRecord>({
	columns: [
		{ type: 'selection', width: 60 },
		{ label: '开票单号', prop: 'invoiceNo', minWidth: 170 },
		{ label: '客户名称', prop: 'customerName', minWidth: 160, showOverflowTooltip: true },
		{ label: '合同订单号', prop: 'contractOrderNo', minWidth: 150, showOverflowTooltip: true },
		{
			label: '开票金额',
			prop: 'invoiceAmount',
			minWidth: 120,
			formatter(row) {
				return formatMoney(row.invoiceAmount ?? 0);
			}
		},
		{ label: '货币', prop: 'currency', minWidth: 80 },
		{ label: '预计回款日期', prop: 'expectedPaybackDate', minWidth: 130 },
		{
			label: '回款状态',
			prop: 'repayStatus',
			minWidth: 100,
			formatter(row) {
				return repayStatusLabel(row.repayStatus);
			}
		},
		{
			label: '实际回款金额',
			prop: 'actualRepayAmount',
			minWidth: 130,
			formatter(row) {
				return row.actualRepayAmount ? formatMoney(row.actualRepayAmount) : '-';
			}
		},
		{ label: '实际回款日期', prop: 'actualRepayDate', minWidth: 130 },
		{
			label: '创建时间',
			prop: 'createTime',
			minWidth: 170,
			sortable: 'desc',
			component: { name: 'cl-date-text' }
		},
		{
			type: 'op',
			width: 200,
			buttons: [
				{
					label: '确认回款',
					type: 'success',
					show({ scope }: any) {
						return scope.row.repayStatus !== 1;
					},
					onClick({ scope }: any) {
						handleConfirmRepay(scope.row);
					}
				},
				'delete'
			]
		}
	]
});

const Crud = useCrud(
	{
		service: planRepayApi || ({} as any)
	},
	app => {
		if (planRepayApi?.page) {
			app.refresh();
		}
	}
);

const Upsert = useUpsert<PlanRepayRecord>({
	dialog: {
		title: '回款确认',
		width: 'min(800px, 96vw)',
		height: 'auto'
	},
	props: {
		labelWidth: '0px'
	},
	items: [
		{ prop: 'id' as any, hidden: true, component: { name: 'el-input' } },
		{
			prop: '_repayForm',
			label: '',
			span: 24,
			component: { name: 'slot-repayForm' }
		}
	],
	onOpened(data) {
		const d = data as any;
		if (d.actualRepayAmount == null) {
			d.actualRepayAmount = Number(d.invoiceAmount) || 0;
		}
		if (!d.actualRepayDate) {
			d.actualRepayDate = new Date().toISOString().slice(0, 10);
		}
	},
	onSubmit(data, { close, done }) {
		if (!planRepayApi?.confirmRepay) {
			ElMessage.error('确认回款接口未就绪');
			done();
			return;
		}
		const d = data as any;
		planRepayApi
			.confirmRepay({
				id: d.id,
				actualRepayAmount: d.actualRepayAmount,
				actualRepayDate: d.actualRepayDate,
				remark: d.remark
			})
			.then(() => {
				ElMessage.success('确认回款成功');
				close();
				Crud.value?.refresh();
			})
			.catch((e: Error) => {
				ElMessage.error(e?.message || '操作失败');
				done();
			});
	}
});
</script>

<style lang="scss" scoped>
.company-plan-repay-crud {
	height: 100%;
	min-height: 0;
	display: flex;
	flex-direction: column;
}

.repay-upsert-body {
	display: flex;
	flex-direction: column;
	gap: 12px;
	min-height: 0;
	padding-right: 2px;
}

.repay-upsert-body__card {
	:deep(.el-card__header) {
		padding: 10px 14px;
	}
}

.repay-upsert-body__title {
	font-size: 15px;
	font-weight: 600;
}

.w-full {
	width: 100%;
}

:deep(.cl-upsert__body .el-form-item) {
	margin-bottom: 14px;
}
</style>
