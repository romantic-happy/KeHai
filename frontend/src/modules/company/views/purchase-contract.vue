<template>
	<cl-crud ref="Crud">
		<cl-row>
			<cl-refresh-btn />
			<cl-add-btn />
			<cl-multi-delete-btn />
			<cl-flex1 />
			<cl-search-key :placeholder="$t('搜索采购合同号/合同订单号/供应商名称')" :width="320" />
		</cl-row>

		<cl-row>
			<cl-table ref="Table">
				<template #column-productNames="{ scope }">
					<el-tooltip
						v-if="scope.row.productNames"
						:content="scope.row.productNames"
						placement="top"
					>
						<span class="purchase-contract__products">
							{{ formatProductNames(scope.row) }}
						</span>
					</el-tooltip>
					<span v-else>-</span>
				</template>
				<template #column-purchaseAmount="{ scope }">
					{{ formatAmount(scope.row.purchaseAmount) }}
				</template>
				<template #column-purchaseQuantityTotal="{ scope }">
					{{ formatQuantity(scope.row.purchaseQuantityTotal) }}
				</template>
				<template #column-pendingPurchaseQuantityTotal="{ scope }">
					{{ formatQuantity(scope.row.pendingPurchaseQuantityTotal) }}
				</template>
				<template #column-purchasedQuantityTotal="{ scope }">
					{{ formatQuantity(scope.row.purchasedQuantityTotal) }}
				</template>
			</cl-table>
		</cl-row>

		<cl-row>
			<cl-flex1 />
			<cl-pagination />
		</cl-row>

		<cl-upsert ref="Upsert">
			<template #slot-productItems="{ scope }">
				<purchase-contract-product-items
					v-if="scope"
					v-model="scope.products"
					@amount-change="(value: number) => onProductsAmountChange(scope, value)"
				/>
			</template>
			<template #slot-purchaseAmount="{ scope }">
				<div class="purchase-contract__amount">
					{{ formatAmount(scope.purchaseAmount || calcProductsAmount(scope.products)) }}
				</div>
			</template>
		</cl-upsert>
	</cl-crud>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'company-purchase-contract'
});

import { useCrud, useTable, useUpsert } from '@cool-vue/crud';
import { ElMessage } from 'element-plus';
import { onMounted, reactive } from 'vue';
import { useCool } from '/@/cool';
import { BaseService } from '/@/cool/service';
import { useI18n } from 'vue-i18n';
import PurchaseContractProductItems from './components/purchase-contract-product-items.vue';

const { service } = useCool();
const { t } = useI18n();
const purchaseFallback = new BaseService('admin/company/purchaseContract') as any;
const supplierFallback = new BaseService('admin/company/supplier') as any;

const supplierTypeOptions = [
	{ label: t('临时'), value: 'temporary', type: 'warning' },
	{ label: t('正式'), value: 'formal', type: 'success' }
];

const options = reactive({
	suppliers: [] as Array<{ label: string; value: number; supplierType: string }>
});

function purchaseContractApi() {
	return (service as any).company?.purchaseContract || purchaseFallback;
}

function supplierApi() {
	return (service as any).company?.supplier || supplierFallback;
}

function today() {
	const d = new Date();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const date = String(d.getDate()).padStart(2, '0');
	return `${d.getFullYear()}-${month}-${date}`;
}

function formatAmount(value: any) {
	const num = Number(value);
	if (!Number.isFinite(num)) return '-';
	return num.toLocaleString('zh-CN', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
}

function formatQuantity(value: any) {
	const num = Number(value);
	if (!Number.isFinite(num)) return '-';
	return num.toLocaleString('zh-CN', {
		maximumFractionDigits: 4
	});
}

function formatProductNames(row: any) {
	const names = String(row?.productNames || '')
		.split('、')
		.filter(Boolean);
	if (names.length <= 1) return row?.productNames || '-';
	return `${names.slice(0, 2).join('、')} 等${row.productCount || names.length}项`;
}

function calcProductsAmount(products: any[]) {
	if (!Array.isArray(products)) return 0;
	return products.reduce((sum, row) => {
		const price = Number(row?.purchasePrice) || 0;
		const quantity = Number(row?.purchaseQuantity) || 0;
		return sum + Math.round(price * quantity * 100) / 100;
	}, 0);
}

function onProductsAmountChange(scope: any, amount: number) {
	scope.purchaseAmount = amount;
}

async function loadSuppliers() {
	try {
		const res = await supplierApi().list({});
		const list = Array.isArray(res) ? res : res?.list || [];
		options.suppliers.length = 0;
		list.forEach((item: any) => {
			options.suppliers.push({
				label: item.supplierName || item.a_supplierName || '-',
				value: Number(item.id ?? item.a_id),
				supplierType: item.supplierType || item.a_supplierType || ''
			});
		});
	} catch (e: any) {
		ElMessage.error(e?.message || t('供应商加载失败'));
	}
}

function syncSupplierType(scope: any) {
	const supplier = options.suppliers.find(item => item.value === Number(scope.supplierId));
	scope.supplierType = supplier?.supplierType || '';
}

function validateForm(data: any) {
	if (!data.supplierId) {
		ElMessage.error(t('请选择供应商'));
		return false;
	}
	if (!data.expectedArrivalDate) {
		ElMessage.error(t('请选择预计到货日期'));
		return false;
	}
	if (!Array.isArray(data.attachments) || data.attachments.length === 0) {
		ElMessage.error(t('请上传合同附件'));
		return false;
	}
	if (!Array.isArray(data.products) || data.products.length === 0) {
		ElMessage.error(t('请至少添加一条采购产品明细'));
		return false;
	}
	for (let i = 0; i < data.products.length; i++) {
		const row = data.products[i];
		if (!row.productName) {
			ElMessage.error(t('请填写产品名称'));
			return false;
		}
		if (
			row.purchasePrice === null ||
			row.purchasePrice === undefined ||
			row.purchasePrice === '' ||
			!(Number(row.purchasePrice) >= 0)
		) {
			ElMessage.error(t('请填写有效采购价格'));
			return false;
		}
		if (!(Number(row.purchaseQuantity) > 0)) {
			ElMessage.error(t('采购数量必须大于0'));
			return false;
		}
	}
	return true;
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
			return () => ({
				label: t('采购合同号'),
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
			});
		},
		() => {
			return () => ({
				label: t('合同订单号'),
				prop: 'orderNo',
				span: 12,
				hidden: Upsert.value?.mode == 'add',
				component: {
					name: 'el-input',
					props: {
						disabled: true,
						placeholder: t('保存后自动生成')
					}
				}
			});
		},
		{
			label: t('供应商名称'),
			prop: 'supplierId',
			span: 12,
			required: true,
			component: {
				name: 'el-select',
				options: options.suppliers,
				props: {
					clearable: true,
					filterable: true,
					onChange(value: number) {
						const supplier = options.suppliers.find(item => item.value === Number(value));
						Upsert.value?.setForm('supplierType', supplier?.supplierType || '');
					}
				}
			}
		},
		{
			label: t('供应商类型'),
			prop: 'supplierType',
			span: 12,
			component: {
				name: 'el-select',
				options: supplierTypeOptions,
				props: {
					disabled: true
				}
			}
		},
		{
			label: t('下单日期'),
			prop: 'orderDate',
			span: 12,
			required: true,
			value: today(),
			component: {
				name: 'el-date-picker',
				props: {
					type: 'date',
					valueFormat: 'YYYY-MM-DD',
					clearable: false
				}
			}
		},
		{
			label: t('预计到货日期'),
			prop: 'expectedArrivalDate',
			span: 12,
			required: true,
			component: {
				name: 'el-date-picker',
				props: {
					type: 'date',
					valueFormat: 'YYYY-MM-DD',
					clearable: true
				}
			}
		},
		{
			label: t('采购金额'),
			prop: 'purchaseAmount',
			span: 12,
			component: {
				name: 'slot-purchaseAmount'
			}
		},
		{
			label: t('合同附件'),
			prop: 'attachments',
			span: 24,
			required: true,
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
			label: t('采购产品明细'),
			prop: 'products',
			span: 24,
			required: true,
			component: {
				name: 'slot-productItems'
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
		}
	],
	onOpened(data) {
		if (Upsert.value?.mode === 'add') {
			data.orderDate = data.orderDate || today();
			data.products = Array.isArray(data.products) ? data.products : [];
			data.attachments = Array.isArray(data.attachments) ? data.attachments : [];
		}
		if (Upsert.value?.mode !== 'add') {
			data.products = Array.isArray(data.products) ? data.products : [];
			data.attachments = Array.isArray(data.attachments) ? data.attachments : [];
		}
		syncSupplierType(data);
		data.purchaseAmount = calcProductsAmount(data.products);
	},
	onSubmit(data, { next, done }) {
		if (!validateForm(data)) {
			done();
			return;
		}
		const payload = {
			...data,
			products: data.products.map((item: any) => ({ ...item })),
			purchaseAmount: undefined,
			contractNo: undefined,
			orderNo: undefined,
			supplierName: undefined,
			supplierType: undefined,
			createTime: undefined,
			updateTime: undefined,
			tenantId: undefined
		};
		next(payload);
	}
});

const Table = useTable<any>({
	columns: [
		{ type: 'selection', width: 60 },
		{ label: t('采购合同号'), prop: 'contractNo', minWidth: 170 },
		{ label: t('合同订单号'), prop: 'orderNo', minWidth: 170 },
		{ label: t('供应商名称'), prop: 'supplierName', minWidth: 180 },
		{
			label: t('供应商类型'),
			prop: 'supplierType',
			minWidth: 110,
			dict: supplierTypeOptions
		},
		{ label: t('采购产品'), prop: 'productNames', minWidth: 220 },
		{
			label: t('采购金额'),
			prop: 'purchaseAmount',
			minWidth: 130,
			sortable: 'custom'
		},
		{
			label: t('本次采购总数量'),
			prop: 'purchaseQuantityTotal',
			minWidth: 120
		},
		{
			label: t('待采购数量'),
			prop: 'pendingPurchaseQuantityTotal',
			minWidth: 120
		},
		{
			label: t('已采购数量'),
			prop: 'purchasedQuantityTotal',
			minWidth: 120
		},
		{
			label: t('下单日期'),
			prop: 'orderDate',
			minWidth: 130,
			component: { name: 'cl-date-text', props: { format: 'YYYY-MM-DD' } }
		},
		{
			label: t('预计到货日期'),
			prop: 'expectedArrivalDate',
			minWidth: 140,
			component: { name: 'cl-date-text', props: { format: 'YYYY-MM-DD' } }
		},
		{
			label: t('创建时间'),
			prop: 'createTime',
			minWidth: 170,
			sortable: 'desc',
			component: { name: 'cl-date-text' }
		},
		{
			type: 'op',
			buttons: ['edit', 'delete'],
			width: 170,
			fixed: 'right'
		}
	]
});

const crudService = {
	page(params: any) {
		return purchaseContractApi().page(params);
	},
	list(params: any) {
		return purchaseContractApi().list(params);
	},
	info(params: any) {
		return purchaseContractApi().info(params);
	},
	add(params: any) {
		return purchaseContractApi().add(params);
	},
	update(params: any) {
		return purchaseContractApi().update(params);
	},
	delete(params: any) {
		return purchaseContractApi().delete(params);
	}
};

const Crud = useCrud(
	{
		service: crudService,
		onDelete(selection, { next }) {
			return next({ ids: selection.map((e: any) => e.id) });
		}
	},
	app => {
		app.refresh();
	}
);

onMounted(() => {
	loadSuppliers();
});
</script>

<style lang="scss" scoped>
.purchase-contract__amount {
	font-weight: 600;
	line-height: 32px;
	color: var(--el-text-color-primary);
}

.purchase-contract__products {
	display: inline-block;
	max-width: 210px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	vertical-align: middle;
}
</style>
