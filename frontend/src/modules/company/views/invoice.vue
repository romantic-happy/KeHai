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
				<template #slot-invoiceForm>
					<div class="invoice-upsert-body">
						<el-card shadow="never" class="invoice-upsert-body__card">
							<template #header>
								<span class="invoice-upsert-body__title">基础信息</span>
							</template>
							<el-row :gutter="16">
								<el-col :xs="24" :md="12">
									<el-form-item label="关联客户">
										<el-select v-model="localCustomerId" @change="onCustomerChange" clearable placeholder="单选" class="w-full">
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
											v-model="localContractOrderIds"
											multiple
											collapse-tags
											placeholder="可多选合并开票"
											class="w-full"
											:disabled="!localCustomerId"
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
											v-model="localExpectedPaybackDate"
											type="date"
											value-format="YYYY-MM-DD"
											placeholder="流转至计划回款"
											class="w-full"
										/>
									</el-form-item>
								</el-col>
								<el-col :xs="24" :md="12">
									<el-form-item label="开票金额">
										<el-input :model-value="formatMoney(localInvoiceAmount)" disabled>
											<template #append>元</template>
										</el-input>
										<div class="invoice-upsert-body__hint">由明细汇总，系统自动计算</div>
									</el-form-item>
								</el-col>
								<el-col :xs="24" :md="12">
									<el-form-item label="开票类型">
										<el-select v-model="localInvoiceType" clearable placeholder="非必填" class="w-full">
											<el-option label="增值税专用发票" value="vat_special" />
											<el-option label="增值税普通发票" value="vat_normal" />
										</el-select>
									</el-form-item>
								</el-col>
								<el-col :xs="24" :md="12">
									<el-form-item label="负责人">
										<el-select v-model="localOwnerUserId" clearable placeholder="后台用户" class="w-full">
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
											v-model="localCollaboratorUserIds"
											multiple
											collapse-tags
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
										<el-input v-model="localRemark" type="textarea" :rows="2" maxlength="500" show-word-limit />
									</el-form-item>
								</el-col>
								<el-col :span="24">
									<el-form-item label="附件">
										<cl-upload v-model="localAttachmentUrls" multiple :limit="5" />
									</el-form-item>
								</el-col>
							</el-row>
						</el-card>

						<el-card shadow="never" class="invoice-upsert-body__card">
							<template #header>
								<span class="invoice-upsert-body__title">开票明细</span>
								<span class="invoice-upsert-body__sub">选单后自动带出，金额可改（分批开票）</span>
							</template>
							<el-table :data="localDetailRows" border size="small" empty-text="请先选择客户与合同订单">
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
									<el-tag v-if="localTaxNo || localBankName" type="success" size="small">已关联历史开票信息</el-tag>
									<el-tag v-else type="info" size="small">新客户或首次需完整填写</el-tag>
								</div>
							</template>
							<p class="invoice-upsert-body__tip">新客户首次开票需填写；老客户有历史开票记录时可自动带出抬头。</p>
							<el-row :gutter="16">
								<el-col :xs="24" :md="12">
									<el-form-item label="税号">
										<el-input v-model="localTaxNo" clearable />
									</el-form-item>
								</el-col>
								<el-col :xs="24" :md="12">
									<el-form-item label="开户行名称">
										<el-input v-model="localBankName" clearable />
									</el-form-item>
								</el-col>
								<el-col :xs="24" :md="12">
									<el-form-item label="开户账号">
										<el-input v-model="localBankAccount" clearable />
									</el-form-item>
								</el-col>
								<el-col :xs="24" :md="12">
									<el-form-item label="开户行行号">
										<el-input v-model="localBankBranchCode" clearable placeholder="联行号" />
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
import { ElMessage, ElMessageBox } from 'element-plus';
import type { InvoiceDetailRow, InvoiceRecord } from './invoiceTypes';
import { invoiceTypeLabel, invoiceStatusLabel } from './invoiceTypes';
import { computed, onMounted, ref, watch } from 'vue';

const { service } = useCool();

const inv = (service as any).company?.invoice;
if (!inv?.page) {
	console.warn('[company-invoice] service.company.invoice 未就绪，请启动后端并刷新以生成 eps');
}

const customerOptions = ref<{ id: number; customerName: string }[]>([]);
const contractOrderOptions = ref<
	{ id: number; orderNo: string; title?: string; contractAmount: number; planRepayLabel?: string; actualRepayLabel?: string }[]
>([]);
const salesUserOptions = ref<{ id: number; label: string }[]>([]);

const localCustomerId = ref<any>(null);
const localContractOrderIds = ref<number[]>([]);
const localExpectedPaybackDate = ref('');
const localInvoiceType = ref('');
const localOwnerUserId = ref<any>(null);
const localCollaboratorUserIds = ref<number[]>([]);
const localRemark = ref('');
const localAttachmentUrls = ref<any[]>([]);
const localDetailRows = ref<InvoiceDetailRow[]>([]);
const localTaxNo = ref('');
const localBankName = ref('');
const localBankAccount = ref('');
const localBankBranchCode = ref('');

const localInvoiceAmount = computed(() => {
	return localDetailRows.value.reduce((s, r) => s + (Number(r.invoiceAmount) || 0), 0);
});

function onCustomerChange() {
	const cid = localCustomerId.value ? Number(localCustomerId.value) : 0;
	localContractOrderIds.value = [];
	localDetailRows.value = [];
	localTaxNo.value = '';
	localBankName.value = '';
	localBankAccount.value = '';
	localBankBranchCode.value = '';
	contractOrderOptions.value = [];
	setTimeout(async () => {
		if (localCustomerId.value !== cid) return;
		await loadContractOrders(cid);
		if (!cid || Upsert.value?.mode !== 'add' || !inv?.invoiceProfileByCustomer) return;
		try {
			const r = await inv.invoiceProfileByCustomer({ customerId: cid });
			if (r?.taxNo || r?.bankName) {
				localTaxNo.value = r.taxNo || '';
				localBankName.value = r.bankName || '';
				localBankAccount.value = r.bankAccount || '';
				localBankBranchCode.value = r.bankBranchCode || '';
			}
		} catch { /* ignore */ }
	}, 0);
}

watch(localContractOrderIds, (newIds) => {
	if (!contractOrderOptions.value.length) return;
	const cust = customerOptions.value.find(c => c.id === localCustomerId.value);
	const name = cust?.customerName ?? '-';
	const orders = contractOrderOptions.value.filter(o => newIds.includes(o.id));
	localDetailRows.value = orders.map(o => ({
		orderId: o.id,
		customerName: name,
		orderNo: o.orderNo,
		planRepayLabel: o.planRepayLabel || '',
		actualRepayLabel: o.actualRepayLabel || '',
		invoiceAmount: Number(o.contractAmount) || 0,
		currency: '人民币'
	}));
});

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
	if (!customerId || !inv?.contractOrderPage) {
		contractOrderOptions.value = [];
		return;
	}
	try {
		const res = await inv.contractOrderPage({ customerId, page: 1, size: 200 });
		contractOrderOptions.value = (res.list || []).map((e: any) => ({
			id: Number(e.id),
			orderNo: e.orderNo,
			title: e.title,
			contractAmount: Number(e.contractAmount) || 0,
			planRepayLabel: e.planRepayLabel,
			actualRepayLabel: e.actualRepayLabel
		}));
	} catch (err) {
		console.error('[invoice] loadContractOrders failed:', err);
		contractOrderOptions.value = [];
	}
}

function ensureArr(v: any): any[] {
	if (Array.isArray(v)) return v;
	return [];
}

function ensureStr(v: any): string {
	if (typeof v === 'string') return v;
	return '';
}

function normalizeDetailRows(raw: any): InvoiceDetailRow[] {
	if (!raw) return [];
	if (typeof raw === 'string') {
		try { return JSON.parse(raw); } catch { return []; }
	}
	if (Array.isArray(raw)) return raw;
	return [];
}

function fromScopeToLocal(d: any) {
	localCustomerId.value = d.customerId != null ? d.customerId : null;
	localContractOrderIds.value = (ensureArr(d.contractOrderIds) as any[]).map(Number).filter((n: number) => !Number.isNaN(n));
	localExpectedPaybackDate.value = ensureStr(d.expectedPaybackDate);
	localInvoiceType.value = ensureStr(d.invoiceType);
	localOwnerUserId.value = d.ownerUserId != null && d.ownerUserId !== '' ? d.ownerUserId : null;
	localCollaboratorUserIds.value = (ensureArr(d.collaboratorUserIds) as any[]).map(Number).filter((n: number) => !Number.isNaN(n));
	localRemark.value = ensureStr(d.remark);
	localAttachmentUrls.value = ensureArr(d.attachmentUrls);
	localDetailRows.value = normalizeDetailRows(d.detailRows);
	localTaxNo.value = ensureStr(d.taxNo);
	localBankName.value = ensureStr(d.bankName);
	localBankAccount.value = ensureStr(d.bankAccount);
	localBankBranchCode.value = ensureStr(d.bankBranchCode);
}

async function handleConfirm(row: InvoiceRecord) {
	if (!row.id) return;
	if (row.invoiceStatus === 1) {
		ElMessage.warning('该开票申请已确认');
		return;
	}
	try {
		await ElMessageBox.confirm('确认开票后，系统将自动生成对应的计划回款记录，是否继续？', '确认开票', {
			confirmButtonText: '确认',
			cancelButtonText: '取消',
			type: 'warning'
		});
		if (!inv?.confirm) {
			ElMessage.error('确认开票接口未就绪');
			return;
		}
		await inv.confirm({ id: row.id });
		ElMessage.success('确认开票成功，已自动生成计划回款记录');
		Crud.value?.refresh();
	} catch {
		// 用户取消
	}
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
			formatter(row) { return formatMoney(row.invoiceAmount ?? 0); }
		},
		{ label: '预计回款日期', prop: 'expectedPaybackDate', minWidth: 130 },
		{
			label: '开票类型',
			prop: 'invoiceType',
			minWidth: 140,
			formatter(row) { return invoiceTypeLabel(row.invoiceType); }
		},
		{
			label: '开票状态',
			prop: 'invoiceStatus',
			minWidth: 100,
			formatter(row) { return invoiceStatusLabel(row.invoiceStatus); }
		},
		{
			label: '创建时间',
			prop: 'createTime',
			minWidth: 170,
			sortable: 'desc',
			component: { name: 'cl-date-text' }
		},
		{
			type: 'op',
			width: 230,
			buttons: [
				'edit',
				'delete',
				{
					label: '确认开票',
					type: 'success',
					show({ scope }: any) { return scope.row.invoiceStatus !== 1; },
					onClick({ scope }: any) { handleConfirm(scope.row); }
				}
			]
		}
	]
});

const Crud = useCrud({ service: inv || ({} as any) }, app => { if (inv?.page) app.refresh(); });

const Upsert = useUpsert<InvoiceRecord>({
	dialog: {
		title: '开票',
		width: 'min(1100px, 96vw)',
		height: 'min(88vh, 920px)'
	},
	props: { labelWidth: '0px' },
	items: [
		{ prop: 'id' as any, hidden: true, component: { name: 'el-input' } },
		{ prop: '_invoiceForm', label: '', span: 24, component: { name: 'slot-invoiceForm' } }
	],

	onOpened(data) {
		const d = data as any;
		fromScopeToLocal(d);
		if (d.customerId) {
			loadContractOrders(Number(d.customerId)).then(() => {
				if (localContractOrderIds.value.length) {
					localContractOrderIds.value = [...localContractOrderIds.value];
				}
			});
		}
	},

	onSubmit(_data, { close, done }) {
		if (!inv?.add) { ElMessage.error('开票接口未就绪'); done(); return; }
		const d = _data as any;

		d.customerId = localCustomerId.value;
		d.contractOrderIds = [...localContractOrderIds.value];
		d.expectedPaybackDate = localExpectedPaybackDate.value;
		d.invoiceType = localInvoiceType.value;
		d.ownerUserId = localOwnerUserId.value;
		d.collaboratorUserIds = [...localCollaboratorUserIds.value];
		d.remark = localRemark.value;
		d.attachmentUrls = [...localAttachmentUrls.value];
		d.detailRows = localDetailRows.value.map(r => ({ ...r }));
		d.invoiceAmount = localInvoiceAmount.value;
		d.taxNo = localTaxNo.value;
		d.bankName = localBankName.value;
		d.bankAccount = localBankAccount.value;
		d.bankBranchCode = localBankBranchCode.value;

		if (!d.customerId) { ElMessage.error('请选择关联客户'); done(); return; }
		if (!d.contractOrderIds?.length) { ElMessage.error('请选择至少一个合同订单'); done(); return; }
		if (!d.expectedPaybackDate) { ElMessage.error('请选择预计回款日期'); done(); return; }
		if (!d.detailRows?.length) { ElMessage.error('请完善开票明细'); done(); return; }

		const ids = (d.contractOrderIds || []) as number[];
		const labels = contractOrderOptions.value.filter(o => ids.includes(o.id)).map(o => o.orderNo);
		d.contractOrderLabels = labels.length ? labels.join('、') : (d.contractOrderLabels || '');

		const isAdd = !d.id || d.id === '' || Number(d.id) === 0;
		const req = isAdd ? inv.add(d) : inv.update(d);

		req
			.then(() => { ElMessage.success('保存成功'); close(); Crud.value?.refresh(); })
			.catch((e: Error) => { ElMessage.error(e?.message || '保存失败'); done(); });
	}
});

function formatMoney(n: number) {
	return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
	min-height: 0;
	padding-right: 2px;
}

.invoice-upsert-body__card {
	:deep(.el-card__header) { padding: 10px 14px; }
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

.w-full { width: 100%; }

:deep(.cl-upsert__body .el-form-item) { margin-bottom: 14px; }
</style>
