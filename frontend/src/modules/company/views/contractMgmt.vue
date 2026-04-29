<template>
	<cl-crud ref="Crud">
		<cl-row>
			<cl-refresh-btn />
			<cl-add-btn />
			<cl-multi-delete-btn />
			<cl-flex1 />
			<cl-search-key :placeholder="$t('搜索合同编号/合同名称/客户名称')" :width="260" />
		</cl-row>

		<cl-row>
			<cl-table ref="Table">
				<template #column-contractAmount="{ scope }">
					{{ formatAmount(scope.row.contractAmount) }}
				</template>

				<template #column-contractStatus="{ scope }">
					<el-tag
						disable-transitions
						size="small"
						effect="plain"
						:type="
							options.contractStatus.find(e => e.value === scope.row.contractStatus)
								?.type || 'info'
						"
					>
						{{
							(options.contractStatus.find(
								e => e.value === scope.row.contractStatus
							)?.label as string) || '-'
						}}
					</el-tag>
				</template>

				<template #column-contractCategory="{ scope }">
					<el-tag
						disable-transitions
						size="small"
						effect="plain"
						:type="
							options.contractCategory.find(
								e => e.value === scope.row.contractCategory
							)?.type || 'info'
						"
					>
						{{
							(options.contractCategory.find(
								e => e.value === scope.row.contractCategory
							)?.label as string) || '-'
						}}
					</el-tag>
				</template>

				<template #column-dateRange="{ scope }">
					{{ formatRange(scope.row.startDate, scope.row.endDate) }}
				</template>
			</cl-table>
		</cl-row>

		<cl-row>
			<cl-flex1 />
			<cl-pagination />
		</cl-row>

		<cl-upsert ref="Upsert">
			<template #slot-productSelector="{ scope }">
				<contract-product-selector
					v-model="selectedQuoteProducts"
					:quote-id="scope.quoteId"
					:inquiry-id="scope.inquiryId"
					@update:quoteId="(v: any) => (scope.quoteId = v)"
					@update:inquiryId="(v: any) => (scope.inquiryId = v)"
					@amountChange="(v: any) => onQuoteAmountChange(scope, v)"
					@customerChange="(v: any) => onQuoteCustomerChange(scope, v)"
				/>
			</template>
		</cl-upsert>
	</cl-crud>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'company-contract-mgmt'
});

import { useCrud, useTable, useUpsert } from '@cool-vue/crud';
import { useCool } from '/@/cool';
import { useI18n } from 'vue-i18n';
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { TagProps } from 'element-plus';
import ContractProductSelector from './components/contract-product-selector.vue';

const { service, route } = useCool();
const { t } = useI18n();

type ContractOption = {
	label: string;
	value: number;
	type: TagProps['type'];
};

const options = reactive<{
	contractCategory: ContractOption[];
	contractStatus: ContractOption[];
}>({
	contractCategory: [
		{ label: t('项目类（搬迁改造）'), value: 0, type: 'info' },
		{ label: t('机械类（维保）'), value: 1, type: 'warning' },
		{ label: t('调试类'), value: 2, type: 'success' },
		{ label: t('电气（排故维修）类'), value: 3, type: 'danger' },
		{ label: t('备品备件'), value: 4, type: 'primary' }
	],
	contractStatus: [
		{ label: t('草稿'), value: 0, type: 'info' },
		{ label: t('审批中'), value: 1, type: 'warning' },
		{ label: t('已生效'), value: 2, type: 'success' },
		{ label: t('已完结'), value: 3, type: 'success' as TagProps['type'] },
		{ label: t('已作废'), value: 4, type: 'danger' }
	]
});

const selectedQuoteProducts = ref<any[]>([]);

function formatAmount(val: any) {
	if (val === null || val === undefined) return '-';
	const num = Number(val);
	if (isNaN(num)) return val;
	return num.toLocaleString('zh-CN', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
}

function formatRange(start?: any, end?: any) {
	const s = start ? String(start).slice(0, 10) : '';
	const e = end ? String(end).slice(0, 10) : '';
	return s || e ? `${s || '-'} ~ ${e || '-'}` : '-';
}

function onQuoteAmountChange(scope: any, amount: number) {
	scope.contractAmount = amount;
}

function onQuoteCustomerChange(scope: any, customer: string) {
	if (customer && !scope.customerName) {
		scope.customerName = customer;
	}
}

const Upsert = useUpsert<any>({
	dialog: {
		width: 'min(1400px, 92vw)'
	},
	props: {
		labelWidth: '120px'
	},
	items: [
		() => {
			return () => {
				return {
					label: t('合同编号'),
					prop: 'contractNo',
					span: 12,
					hidden: Upsert.value?.mode == 'add',
					component: {
						name: 'el-input',
						props: {
							disabled: true,
							placeholder: t('保存后自动生成')
						}
					}
				};
			};
		},
		{
			label: t('合同名称'),
			prop: 'contractName',
			span: 12,
			required: true,
			component: {
				name: 'el-input',
				props: { clearable: true, maxlength: 300 }
			}
		},
		{
			label: t('合同类别'),
			prop: 'contractCategory',
			span: 12,
			required: true,
			value: 0,
			component: {
				name: 'el-select',
				options: options.contractCategory,
				props: { clearable: true }
			}
		},
		{
			label: t('合同状态'),
			prop: 'contractStatus',
			span: 12,
			value: 0,
			component: {
				name: 'el-select',
				options: options.contractStatus,
				props: { clearable: true }
			}
		},
		{
			label: t('客户名称'),
			prop: 'customerName',
			span: 12,
			required: true,
			component: {
				name: 'el-input',
				props: { clearable: true, maxlength: 200 }
			}
		},
		{
			label: t('合同金额'),
			prop: 'contractAmount',
			span: 12,
			value: 0,
			component: {
				name: 'el-input-number',
				props: {
					min: 0,
					precision: 2,
					controls: false
				}
			}
		},
		{
			label: t('成单关键'),
			prop: 'dealKey',
			span: 24,
			component: {
				name: 'el-input',
				props: { clearable: true }
			}
		},
		{
			label: t('立项日期'),
			prop: 'signDate',
			span: 12,
			component: {
				name: 'el-date-picker',
				props: {
					type: 'date',
					'value-format': 'YYYY-MM-DD',
					clearable: true
				}
			}
		},
		{
			label: t('交付日期'),
			prop: 'deliveryDate',
			span: 12,
			component: {
				name: 'el-date-picker',
				props: {
					type: 'date',
					'value-format': 'YYYY-MM-DD',
					clearable: true
				}
			}
		},
		{
			label: t('合同开始日期'),
			prop: 'startDate',
			span: 12,
			component: {
				name: 'el-date-picker',
				props: {
					type: 'date',
					'value-format': 'YYYY-MM-DD',
					clearable: true
				}
			}
		},
		{
			label: t('合同结束日期'),
			prop: 'endDate',
			span: 12,
			component: {
				name: 'el-date-picker',
				props: {
					type: 'date',
					'value-format': 'YYYY-MM-DD',
					clearable: true
				}
			}
		},
		{
			label: t('从报价单选择产品'),
			prop: 'quoteId',
			span: 24,
			component: { name: 'slot-productSelector' }
		},
		{
			prop: 'inquiryId',
			hidden: true,
			component: { name: 'el-input' }
		},
		{
			label: t('合同详情'),
			prop: 'contractDetails',
			span: 24,
			component: {
				name: 'el-input',
				props: {
					type: 'textarea',
					rows: 4,
					clearable: true
				}
			}
		},
		{
			label: t('合同附件'),
			prop: 'contractAttachments',
			span: 24,
			component: {
				name: 'cl-upload',
				props: {
					type: 'file',
					multiple: true,
					limit: 5,
					accept: '.doc,.docx,.pdf,.jpg,.png',
					text: t('上传合同附件')
				}
			}
		},
		{
			label: t('备注'),
			prop: 'remark',
			span: 24,
			component: {
				name: 'el-input',
				props: {
					type: 'textarea',
					rows: 3,
					clearable: true
				}
			}
		},
		() => {
			return () => {
				return {
					label: t('创建人'),
					prop: 'createUserName',
					span: 12,
					hidden: Upsert.value?.mode == 'add',
					component: {
						name: 'el-input',
						props: { disabled: true }
					}
				};
			};
		},
		() => {
			return () => {
				return {
					label: t('创建时间'),
					prop: 'createTime',
					span: 12,
					hidden: Upsert.value?.mode == 'add',
					component: {
						name: 'cl-date-text',
						props: { format: 'YYYY-MM-DD HH:mm' }
					}
				};
			};
		}
	],

	onOpened(data) {
		if ((data as any).quoteId) {
			selectedQuoteProducts.value = (data as any).productItems || [];
		} else {
			selectedQuoteProducts.value = [];
		}
	},

	onSubmit(data, { next, done }) {
		if (!data.contractName) {
			ElMessage.error(t('请填写合同名称'));
			done();
			return;
		}
		if (data.contractCategory === undefined || data.contractCategory === null) {
			ElMessage.error(t('请选择合同类别'));
			done();
			return;
		}

		const payload = { ...data };
		payload.productItems = selectedQuoteProducts.value;
		delete payload.contractNo;
		delete payload.createUserId;
		delete payload.createUserName;
		delete payload.isDeleted;
		delete payload.templatePath;
		delete payload.templateVariables;
		delete payload.createTime;
		delete payload.updateTime;

		next(payload);
	},

	onClose(action, done) {
		selectedQuoteProducts.value = [];
		done();
	}
});

const Table = useTable<any>({
	columns: [
		{ type: 'selection', width: 60 },
		{ label: t('合同编号'), prop: 'contractNo', minWidth: 180 },
		{ label: t('合同名称'), prop: 'contractName', minWidth: 200 },
		{
			label: t('合同类别'),
			prop: 'contractCategory',
			minWidth: 150,
			dict: options.contractCategory
		},
		{ label: t('客户名称'), prop: 'customerName', minWidth: 150 },
		{
			label: t('合同金额'),
			prop: 'contractAmount',
			minWidth: 130,
			sortable: 'custom'
		},
		{
			label: t('合同状态'),
			prop: 'contractStatus',
			minWidth: 100,
			dict: options.contractStatus
		},
		{
			label: t('合同期限'),
			prop: 'dateRange',
			minWidth: 200
		},
		{
			label: t('签订日期'),
			prop: 'signDate',
			minWidth: 120,
			component: { name: 'cl-date-text', props: { format: 'YYYY-MM-DD' } }
		},
		{
			label: t('创建人'),
			prop: 'createUserName',
			minWidth: 100
		},
		{
			label: t('创建时间'),
			prop: 'createTime',
			minWidth: 170,
			sortable: 'desc',
			component: { name: 'cl-date-text' }
		},
		{
			label: t('更新时间'),
			prop: 'updateTime',
			minWidth: 170,
			sortable: 'custom',
			component: { name: 'cl-date-text' }
		},
		{
			type: 'op',
			buttons: ['edit', 'delete'],
			width: 170
		}
	]
});

const Crud = useCrud(
	{
		service: (service as any).company?.contractMgmt,
		onDelete(selection, { next }) {
			return next({ ids: selection.map((e: any) => e.id) });
		}
	},
	app => {
		app.refresh();
	}
);

function handleRouteQuery() {
	const q = route.query as Record<string, any>;
	if (!q.contractName && !q.customerName && !q.quoteId) return;

	const prefilled: Record<string, any> = {};
	if (q.contractName) prefilled.contractName = String(q.contractName);
	if (q.customerName) prefilled.customerName = String(q.customerName);
	if (q.amount !== undefined && q.amount !== null && q.amount !== '') {
		const n = Number(q.amount);
		if (Number.isFinite(n)) prefilled.contractAmount = n;
	}
	if (q.contractDetails) prefilled.contractDetails = String(q.contractDetails);
	if (q.quoteId) prefilled.quoteId = Number(q.quoteId) || undefined;
	if (q.inquiryId) prefilled.inquiryId = Number(q.inquiryId) || undefined;

	Crud.value?.rowAppend(prefilled);
}

onMounted(() => {
	handleRouteQuery();
});
</script>
