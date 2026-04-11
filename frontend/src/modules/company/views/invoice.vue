<template>
	<div class="company-invoice-crud">
		<cl-crud ref="Crud">
			<cl-row>
				<cl-refresh-btn />
				<cl-add-btn />
				<cl-multi-delete-btn />
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
				<template #slot-invoiceForm="{ scope }">
					<div class="invoice-upsert-body">
						<el-card shadow="never" class="invoice-upsert-body__card">
							<template #header>
								<span class="invoice-upsert-body__title">基础信息</span>
							</template>
							<el-row :gutter="16">
								<el-col :xs="24" :md="12">
									<el-form-item label="关联客户">
										<el-select
											v-model="scope.customerId"
											filterable
											clearable
											placeholder="单选"
											class="w-full"
											@change="() => onCustomerChange(scope)"
										>
											<el-option
												v-for="c in customerOptions"
												:key="c.id"
												:label="c.customerName"
												:value="c.id"
											/>
										</el-select>
									</el-form-item>
								</el-col>
								<el-col :xs="24" :md="12">
									<el-form-item label="关联合同订单">
										<el-select
											v-model="scope.contractOrderIds"
											multiple
											filterable
											collapse-tags
											collapse-tags-tooltip
											placeholder="可多选合并开票"
											class="w-full"
											:disabled="!scope.customerId"
											@change="() => onOrdersChange(scope)"
										>
											<el-option
												v-for="o in contractOrderOptions"
												:key="o.id"
												:label="`${o.orderNo}（${o.title || '-'}）`"
												:value="o.id"
											/>
										</el-select>
									</el-form-item>
								</el-col>
								<el-col :xs="24" :md="12">
									<el-form-item label="预计回款日期">
										<el-date-picker
											v-model="scope.expectedPaybackDate"
											type="date"
											value-format="YYYY-MM-DD"
											placeholder="流转至计划回款"
											class="w-full"
										/>
									</el-form-item>
								</el-col>
								<el-col :xs="24" :md="12">
									<el-form-item label="开票金额">
										<el-input :model-value="formatMoney(sumDetail(scope))" disabled>
											<template #append>元</template>
										</el-input>
										<div class="invoice-upsert-body__hint">由明细汇总，系统自动计算</div>
									</el-form-item>
								</el-col>
								<el-col :xs="24" :md="12">
									<el-form-item label="开票类型">
										<el-select v-model="scope.invoiceType" clearable placeholder="非必填" class="w-full">
											<el-option label="增值税专用发票" value="vat_special" />
											<el-option label="增值税普通发票" value="vat_normal" />
										</el-select>
									</el-form-item>
								</el-col>
								<el-col :xs="24" :md="12">
									<el-form-item label="负责人">
										<el-select
											v-model="scope.ownerUserId"
											clearable
											filterable
											placeholder="后台用户"
											class="w-full"
										>
											<el-option
												v-for="u in salesUserOptions"
												:key="u.id"
												:label="u.label"
												:value="u.id"
											/>
										</el-select>
									</el-form-item>
								</el-col>
								<el-col :xs="24" :md="12">
									<el-form-item label="协作人">
										<el-select
											v-model="scope.collaboratorUserIds"
											multiple
											filterable
											collapse-tags
											collapse-tags-tooltip
											placeholder="可多选"
											class="w-full"
										>
											<el-option
												v-for="u in salesUserOptions"
												:key="u.id"
												:label="u.label"
												:value="u.id"
											/>
										</el-select>
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
								<el-col :span="24">
									<el-form-item label="附件">
										<el-upload action="#" :auto-upload="false" :show-file-list="true">
											<el-button type="primary" plain>选择文件</el-button>
											<template #tip>
												<span class="invoice-upsert-body__hint">对接上传接口后生效</span>
											</template>
										</el-upload>
									</el-form-item>
								</el-col>
							</el-row>
						</el-card>

						<el-card shadow="never" class="invoice-upsert-body__card">
							<template #header>
								<span class="invoice-upsert-body__title">开票明细</span>
								<span class="invoice-upsert-body__sub">选单后自动带出，金额可改（分批开票）</span>
							</template>
							<el-table :data="scope.detailRows || []" border size="small" empty-text="请先选择客户与合同订单">
								<el-table-column prop="customerName" label="关联客户" min-width="120" show-overflow-tooltip />
								<el-table-column prop="orderNo" label="关联合同订单" min-width="140" show-overflow-tooltip />
								<el-table-column prop="planRepayLabel" label="关联计划回款" min-width="130" show-overflow-tooltip />
								<el-table-column prop="actualRepayLabel" label="关联实际回款" min-width="130" show-overflow-tooltip />
								<el-table-column label="开票金额" min-width="150">
									<template #default="{ row }">
										<el-input-number
											v-model="row.invoiceAmount"
											:min="0"
											:precision="2"
											:step="100"
											controls-position="right"
											class="invoice-upsert-body__num"
										/>
									</template>
								</el-table-column>
								<el-table-column label="货币名称" min-width="110">
									<template #default="{ row }">
										<el-input v-model="row.currency" placeholder="人民币" clearable />
									</template>
								</el-table-column>
							</el-table>
						</el-card>

						<el-card shadow="never" class="invoice-upsert-body__card">
							<template #header>
								<div class="invoice-upsert-body__invoice-head">
									<span class="invoice-upsert-body__title">发票信息</span>
									<el-tag v-if="showHistoryTag(scope)" type="success" size="small">已关联历史开票信息</el-tag>
									<el-tag v-else type="info" size="small">新客户或首次需完整填写</el-tag>
								</div>
							</template>
							<p class="invoice-upsert-body__tip">新客户首次开票需填写；老客户有历史开票记录时可自动带出抬头。</p>
							<el-row :gutter="16">
								<el-col :xs="24" :md="12">
									<el-form-item label="税号">
										<el-input v-model="scope.taxNo" clearable />
									</el-form-item>
								</el-col>
								<el-col :xs="24" :md="12">
									<el-form-item label="开户行名称">
										<el-input v-model="scope.bankName" clearable />
									</el-form-item>
								</el-col>
								<el-col :xs="24" :md="12">
									<el-form-item label="开户账号">
										<el-input v-model="scope.bankAccount" clearable />
									</el-form-item>
								</el-col>
								<el-col :xs="24" :md="12">
									<el-form-item label="开户行行号">
										<el-input v-model="scope.bankBranchCode" clearable placeholder="联行号" />
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
	name: 'company-invoice-form'
});

import { useCrud, useTable, useUpsert } from '@cool-vue/crud';
import { useCool } from '/@/cool';
import { ElMessage } from 'element-plus';
import type { InvoiceDetailRow, InvoiceRecord } from './invoiceTypes';
import { invoiceTypeLabel } from './invoiceTypes';
import { onMounted, ref } from 'vue';

const { service } = useCool();

/** eps 未生成时使用 any */
const inv = (service as any).company?.invoice;
if (!inv?.page) {
	console.warn('[company-invoice] service.company.invoice 未就绪，请启动后端并刷新以生成 eps');
}

const customerOptions = ref<{ id: number; customerName: string }[]>([]);
const contractOrderOptions = ref<
	{
		id: number;
		orderNo: string;
		title?: string;
		contractAmount: number;
		planRepayLabel?: string;
		actualRepayLabel?: string;
	}[]
>([]);
const salesUserOptions = ref<{ id: number; label: string }[]>([]);

async function loadCustomerOptions() {
	const api = (service as any).company?.customer;
	if (!api?.page) return;
	const res = await api.page({ page: 1, size: 500 });
	customerOptions.value = (res.list || []).map((e: any) => ({
		id: Number(e.id),
		customerName: e.customerName ?? e.a_customerName ?? ''
	}));
}

async function loadSalesUsers() {
	const api = (service as any).base?.sys?.user;
	if (!api?.page) return;
	const res = await api.page({ page: 1, size: 200 });
	salesUserOptions.value = (res.list || []).map((e: any) => ({
		id: Number(e.id),
		label: `${e.name || e.nickName || e.username || e.id}（ID:${e.id}）`
	}));
}

async function loadContractOrders(customerId: number) {
	contractOrderOptions.value = [];
	if (!customerId || !inv?.contractOrderPage) return;
	const res = await inv.contractOrderPage({ customerId, page: 1, size: 200 });
	contractOrderOptions.value = (res.list || []).map((e: any) => ({
		id: Number(e.id),
		orderNo: e.orderNo,
		title: e.title,
		contractAmount: Number(e.contractAmount) || 0,
		planRepayLabel: e.planRepayLabel,
		actualRepayLabel: e.actualRepayLabel
	}));
}

const Table = useTable<InvoiceRecord>({
	columns: [
		{ type: 'selection', width: 60 },
		{ label: '开票单号', prop: 'invoiceNo', minWidth: 170 },
		{ label: '客户', prop: 'customerName', minWidth: 160, showOverflowTooltip: true },
		{
			label: '开票金额',
			prop: 'invoiceAmount',
			minWidth: 120,
			formatter(row) {
				return formatMoney(row.invoiceAmount ?? 0);
			}
		},
		{ label: '预计回款日期', prop: 'expectedPaybackDate', minWidth: 130 },
		{
			label: '开票类型',
			prop: 'invoiceType',
			minWidth: 140,
			formatter(row) {
				return invoiceTypeLabel(row.invoiceType);
			}
		},
		{
			label: '创建时间',
			prop: 'createTime',
			minWidth: 170,
			sortable: 'desc',
			component: { name: 'cl-date-text' }
		},
		{ type: 'op', buttons: ['edit', 'delete'], width: 170 }
	]
});

const Crud = useCrud(
	{
		service: inv || ({} as any)
	},
	app => {
		if (inv?.page) {
			app.refresh();
		}
	}
);

const Upsert = useUpsert<InvoiceRecord>({
	dialog: {
		title: '开票',
		width: 'min(1100px, 96vw)',
		/** 必须给 cl-dialog 固定高度，内部 el-scrollbar 才能纵向滚动，否则内容被裁切且无滚动条 */
		height: 'min(88vh, 920px)'
	},
	props: {
		labelWidth: '0px'
	},
	items: [
		{ prop: 'id' as any, hidden: true, component: { name: 'el-input' } },
		{
			prop: '_invoiceForm',
			label: '',
			span: 24,
			component: { name: 'slot-invoiceForm' }
		}
	],

	onOpened(data) {
		const d = data as any;
		if (!d.detailRows) d.detailRows = [];
		if (!Array.isArray(d.contractOrderIds)) d.contractOrderIds = [];
		if (!Array.isArray(d.collaboratorUserIds)) d.collaboratorUserIds = [];
		if (typeof d.detailRows === 'string') {
			try {
				d.detailRows = JSON.parse(d.detailRows);
			} catch {
				d.detailRows = [];
			}
		}
		// 统一为 number，避免与后端 id 类型不一致
		d.contractOrderIds = (d.contractOrderIds || []).map((x: any) => Number(x)).filter((x: number) => !Number.isNaN(x));
		d.collaboratorUserIds = (d.collaboratorUserIds || [])
			.map((x: any) => Number(x))
			.filter((x: number) => !Number.isNaN(x));
		if (d.ownerUserId != null && d.ownerUserId !== '') {
			d.ownerUserId = Number(d.ownerUserId);
		}
		if (Upsert.value?.mode === 'add') {
			d.expectedPaybackDate = d.expectedPaybackDate || '';
			d.invoiceType = d.invoiceType || '';
			d.remark = d.remark || '';
		}
		if (d.customerId) {
			loadContractOrders(Number(d.customerId));
		}
	},

	onSubmit(data, { close, done }) {
		if (!inv?.add) {
			ElMessage.error('开票接口未就绪');
			done();
			return;
		}
		const d = data as any;
		if (!d.customerId) {
			ElMessage.error('请选择关联客户');
			done();
			return;
		}
		if (!d.contractOrderIds?.length) {
			ElMessage.error('请选择至少一个合同订单');
			done();
			return;
		}
		if (!d.expectedPaybackDate) {
			ElMessage.error('请选择预计回款日期');
			done();
			return;
		}
		if (!d.detailRows?.length) {
			ElMessage.error('请完善开票明细');
			done();
			return;
		}
		d.invoiceAmount = sumDetail(d);
		const ids = (d.contractOrderIds || []) as number[];
		const labels = contractOrderOptions.value.filter(o => ids.includes(o.id)).map(o => o.orderNo);
		d.contractOrderLabels = labels.length ? labels.join('、') : (d.contractOrderLabels || '');

		const mode = Upsert.value?.mode;
		const req = mode === 'add' ? inv.add(d) : inv.update(d);

		req
			.then(() => {
				ElMessage.success('保存成功');
				close();
				Crud.value?.refresh();
			})
			.catch((e: Error) => {
				ElMessage.error(e?.message || '保存失败');
				done();
			});
	}
});

function formatMoney(n: number) {
	return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function sumDetail(scope: any) {
	const rows: InvoiceDetailRow[] = scope?.detailRows || [];
	return rows.reduce((s, r) => s + (Number(r.invoiceAmount) || 0), 0);
}

function showHistoryTag(scope: any) {
	return !!(scope?.taxNo || scope?.bankName);
}

async function onCustomerChange(scope: any) {
	scope.contractOrderIds = [];
	scope.detailRows = [];
	scope.taxNo = '';
	scope.bankName = '';
	scope.bankAccount = '';
	scope.bankBranchCode = '';
	await loadContractOrders(Number(scope.customerId));
	if (!scope.customerId || Upsert.value?.mode !== 'add' || !inv?.invoiceProfileByCustomer) return;
	try {
		const r = await inv.invoiceProfileByCustomer({ customerId: scope.customerId });
		if (r?.taxNo || r?.bankName) {
			scope.taxNo = r.taxNo || '';
			scope.bankName = r.bankName || '';
			scope.bankAccount = r.bankAccount || '';
			scope.bankBranchCode = r.bankBranchCode || '';
		}
	} catch {
		// ignore
	}
}

function onOrdersChange(scope: any) {
	const cust = customerOptions.value.find(c => c.id === scope.customerId);
	const name = cust?.customerName ?? '-';
	const ids: number[] = (scope.contractOrderIds || []).map((x: any) => Number(x));
	const orders = contractOrderOptions.value.filter(o => ids.includes(o.id));
	scope.detailRows = orders.map(o => ({
		orderId: o.id,
		customerName: name,
		orderNo: o.orderNo,
		planRepayLabel: o.planRepayLabel || '',
		actualRepayLabel: o.actualRepayLabel || '',
		invoiceAmount: Number(o.contractAmount) || 0,
		currency: '人民币'
	}));
}

onMounted(() => {
	loadCustomerOptions();
	loadSalesUsers();
});
</script>

<style lang="scss" scoped>
.company-invoice-crud {
	height: 100%;
	min-height: 0;
	display: flex;
	flex-direction: column;
}

.invoice-upsert-body {
	display: flex;
	flex-direction: column;
	gap: 12px;
	/* 滚动由 cl-dialog 内 el-scrollbar 承担，此处不再限制高度，避免双滚动/不出现滚动条 */
	min-height: 0;
	padding-right: 2px;
}

.invoice-upsert-body__card {
	:deep(.el-card__header) {
		padding: 10px 14px;
	}
}

.invoice-upsert-body__title {
	font-size: 15px;
	font-weight: 600;
}

.invoice-upsert-body__sub {
	font-size: 12px;
	color: var(--el-text-color-secondary);
	font-weight: normal;
	margin-left: 8px;
}

.invoice-upsert-body__hint {
	font-size: 12px;
	color: var(--el-text-color-secondary);
	margin-top: 4px;
}

.invoice-upsert-body__tip {
	font-size: 13px;
	color: var(--el-text-color-secondary);
	margin: 0 0 10px;
}

.invoice-upsert-body__invoice-head {
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
}

.invoice-upsert-body__num {
	width: 100%;
	min-width: 130px;
}

.w-full {
	width: 100%;
}

:deep(.cl-upsert__body .el-form-item) {
	margin-bottom: 14px;
}
</style>
