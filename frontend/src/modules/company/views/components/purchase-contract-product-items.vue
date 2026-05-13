<template>
	<div class="purchase-contract-product-items">
		<div class="purchase-contract-product-items__toolbar">
			<el-button type="primary" size="small" @click="openQuoteDialog">
				{{ $t('从报价单选择') }}
			</el-button>
			<el-button type="success" size="small" @click="addRow">
				{{ $t('新增明细') }}
			</el-button>
			<div class="purchase-contract-product-items__amount">
				{{ $t('采购金额') }}：{{ formatAmount(totalAmount) }}
			</div>
		</div>

		<el-table :data="items" border size="small" class="purchase-contract-product-items__table">
			<el-table-column :label="$t('产品名称')" min-width="160">
				<template #default="{ row }">
					<el-input v-model="row.productName" clearable @change="emitItems" />
				</template>
			</el-table-column>
			<el-table-column :label="$t('品牌')" min-width="120">
				<template #default="{ row }">
					<el-input v-model="row.brand" clearable @change="emitItems" />
				</template>
			</el-table-column>
			<el-table-column :label="$t('型号')" min-width="130">
				<template #default="{ row }">
					<el-input v-model="row.model" clearable @change="emitItems" />
				</template>
			</el-table-column>
			<el-table-column :label="$t('质量')" min-width="120">
				<template #default="{ row }">
					<el-input v-model="row.quality" clearable @change="emitItems" />
				</template>
			</el-table-column>
			<el-table-column :label="$t('采购价格')" min-width="120">
				<template #default="{ row }">
					<el-input-number
						v-model="row.purchasePrice"
						:min="0"
						:precision="2"
						:controls="false"
						class="w-full"
						@change="emitItems"
					/>
				</template>
			</el-table-column>
			<el-table-column :label="$t('采购数量')" min-width="120">
				<template #default="{ row }">
					<el-input-number
						v-model="row.purchaseQuantity"
						:min="0"
						:precision="4"
						:controls="false"
						class="w-full"
						@change="handlePurchaseQuantityChange(row)"
					/>
					<div v-if="isOverPending(row)" class="purchase-contract-product-items__warning">
						{{ $t('超过待采购数量') }}
					</div>
				</template>
			</el-table-column>
			<el-table-column :label="$t('来源数量')" min-width="110">
				<template #default="{ row }">
					<span>{{ formatNullableQuantity(row.sourceQuantity) }}</span>
				</template>
			</el-table-column>
			<el-table-column :label="$t('待采购数量')" min-width="120">
				<template #default="{ row }">
					<el-input-number
						v-model="row.pendingPurchaseQuantity"
						:min="0"
						:precision="4"
						:controls="false"
						class="w-full"
						@change="emitItems"
					/>
				</template>
			</el-table-column>
			<el-table-column :label="$t('已采购数量')" min-width="120">
				<template #default="{ row }">
					<el-input-number
						v-model="row.purchasedQuantity"
						:min="0"
						:precision="4"
						:controls="false"
						class="w-full"
						@change="emitItems"
					/>
				</template>
			</el-table-column>
			<el-table-column :label="$t('小计')" min-width="120">
				<template #default="{ row }">
					{{ formatAmount(calcAmount(row)) }}
				</template>
			</el-table-column>
			<el-table-column :label="$t('操作')" width="90" fixed="right" align="center">
				<template #default="{ $index }">
					<el-button type="danger" text size="small" @click="removeRow($index)">
						{{ $t('删除') }}
					</el-button>
				</template>
			</el-table-column>
		</el-table>

		<div v-if="items.length === 0" class="purchase-contract-product-items__empty">
			{{ $t('暂无采购产品明细') }}
		</div>

		<el-dialog v-model="quoteDialog.visible" :title="$t('从报价单选择产品')" width="900px">
			<div class="purchase-contract-product-items__search">
				<el-input
					v-model="quoteDialog.keyWord"
					clearable
					:placeholder="$t('搜索报价单号/询价单号/产品/品牌/型号')"
					@keyup.enter="loadQuoteProducts"
				/>
				<el-button type="primary" :loading="quoteDialog.loading" @click="loadQuoteProducts">
					{{ $t('查询') }}
				</el-button>
			</div>
			<el-table
				:data="quoteDialog.list"
				border
				size="small"
				height="420px"
				:empty-text="$t('暂无报价单产品数据')"
				@selection-change="selection => (quoteDialog.selection = selection)"
			>
				<el-table-column type="selection" width="45" />
				<el-table-column prop="quoteNo" :label="$t('报价单号')" min-width="150" />
				<el-table-column prop="inquiryNo" :label="$t('询价单号')" min-width="150" />
				<el-table-column prop="customerName" :label="$t('客户')" min-width="130" />
				<el-table-column prop="supplierName" :label="$t('报价供应商')" min-width="130" />
				<el-table-column prop="productName" :label="$t('产品名称')" min-width="150" />
				<el-table-column prop="brand" :label="$t('品牌')" min-width="100" />
				<el-table-column prop="model" :label="$t('型号')" min-width="120" />
				<el-table-column prop="quality" :label="$t('质量')" min-width="100" />
				<el-table-column prop="sourceQuantity" :label="$t('来源数量')" min-width="100" />
				<el-table-column prop="purchasePrice" :label="$t('参考价格')" min-width="100" />
				<el-table-column prop="purchaseQuantity" :label="$t('参考数量')" min-width="100" />
				<el-table-column prop="sourceType" :label="$t('来源')" min-width="130" />
			</el-table>
			<template #footer>
				<el-button @click="quoteDialog.visible = false">{{ $t('取消') }}</el-button>
				<el-button type="primary" @click="appendQuoteProducts">{{ $t('添加') }}</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { request } from '/@/cool/service/request';
import { config } from '/@/config';

type ProductItem = {
	id?: number;
	contractId?: number;
	quoteId?: number;
	quoteProductId?: string;
	inquiryId?: number;
	productId?: number;
	productName?: string;
	brand?: string;
	model?: string;
	quality?: string;
	purchasePrice?: number | null;
	purchaseQuantity?: number | null;
	pendingPurchaseQuantity?: number | null;
	purchasedQuantity?: number | null;
	amount?: number | null;
	remark?: string;
	sourceQuantity?: number | null;
	sourceType?: string;
	quoteNo?: string;
	inquiryNo?: string;
	customerName?: string;
	supplierName?: string;
};

const props = defineProps<{
	modelValue?: ProductItem[];
}>();

const emit = defineEmits<{
	'update:modelValue': [value: ProductItem[]];
	amountChange: [value: number];
}>();

const { t } = useI18n();
const items = ref<ProductItem[]>([]);
let lastEmittedValue = '';

const quoteDialog = reactive({
	visible: false,
	loading: false,
	keyWord: '',
	list: [] as any[],
	selection: [] as any[]
});

const totalAmount = computed(() => {
	return items.value.reduce((sum, item) => sum + calcAmount(item), 0);
});

watch(
	() => props.modelValue,
	value => {
		const next = Array.isArray(value) ? value.map(normalizeRow) : [];
		if (serializeRows(toPayload(next)) !== serializeRows(toPayload(items.value))) {
			items.value = next;
		}
	},
	{ immediate: true, deep: true }
);

watch(
	items,
	() => emitItems(),
	{ deep: true }
);

function normalizeRow(row: any = {}): ProductItem {
	return {
		quoteId: row.quoteId ?? undefined,
		quoteProductId: row.quoteProductId ?? undefined,
		inquiryId: row.inquiryId ?? undefined,
		productId: row.productId ?? undefined,
		productName: row.productName || '',
		brand: row.brand || '',
		model: row.model || '',
		quality: row.quality || '',
		purchasePrice: row.purchasePrice === null || row.purchasePrice === undefined ? null : Number(row.purchasePrice),
		purchaseQuantity:
			row.purchaseQuantity === null || row.purchaseQuantity === undefined ? 1 : Number(row.purchaseQuantity),
		pendingPurchaseQuantity:
			row.pendingPurchaseQuantity === null || row.pendingPurchaseQuantity === undefined
				? null
				: Number(row.pendingPurchaseQuantity),
		purchasedQuantity:
			row.purchasedQuantity === null || row.purchasedQuantity === undefined
				? 0
				: Number(row.purchasedQuantity),
		amount: row.amount === null || row.amount === undefined ? 0 : Number(row.amount),
		remark: row.remark || '',
		sourceQuantity:
			row.sourceQuantity === null || row.sourceQuantity === undefined
				? null
				: Number(row.sourceQuantity),
		sourceType: row.sourceType || undefined,
		quoteNo: row.quoteNo || undefined,
		inquiryNo: row.inquiryNo || undefined,
		customerName: row.customerName || undefined,
		supplierName: row.supplierName || undefined
	};
}

function addRow() {
	const row = createEmptyRow();
	items.value = [...items.value, row];
	emitItems();
}

function removeRow(index: number) {
	items.value = items.value.filter((_, i) => i !== index);
	emitItems();
}

function createEmptyRow(): ProductItem {
	return normalizeRow({
		productName: '',
		brand: '',
		model: '',
		quality: '',
		purchasePrice: null,
		purchaseQuantity: 1,
		pendingPurchaseQuantity: null,
		purchasedQuantity: 0,
		sourceQuantity: null,
		amount: 0,
		remark: ''
	});
}

function emitItems() {
	const payload = toPayload(items.value);
	const serialized = serializeRows(payload);
	if (serialized !== lastEmittedValue) {
		lastEmittedValue = serialized;
		emit('update:modelValue', payload);
	}
	emit('amountChange', totalAmount.value);
}

function toPayload(rows: ProductItem[]) {
	return rows.map(row => ({ ...row, amount: calcAmount(row) }));
}

function serializeRows(rows: ProductItem[]) {
	return JSON.stringify(rows);
}

function calcAmount(row: ProductItem) {
	const price = Number(row.purchasePrice) || 0;
	const quantity = Number(row.purchaseQuantity) || 0;
	return Math.round(price * quantity * 100) / 100;
}

function formatQuantity(value: any) {
	const num = Number(value);
	if (!Number.isFinite(num)) return '0';
	return num.toLocaleString('zh-CN', {
		maximumFractionDigits: 4
	});
}

function formatNullableQuantity(value: any) {
	if (value === null || value === undefined || value === '') return '-';
	return formatQuantity(value);
}

function isQuoteSource(row: ProductItem) {
	return !!row.quoteProductId || (row.sourceQuantity !== null && row.sourceQuantity !== undefined);
}

function isOverPending(row: ProductItem) {
	const pending = Number(row.pendingPurchaseQuantity);
	if (!Number.isFinite(pending) || pending <= 0) return false;
	return Number(row.purchaseQuantity) > pending;
}

function handlePurchaseQuantityChange(row: ProductItem) {
	if (isOverPending(row)) {
		ElMessage.warning(t('采购数量已超过待采购数量，请确认是否需要超采'));
	}
	emitItems();
}

function formatAmount(value: any) {
	const num = Number(value);
	if (!Number.isFinite(num)) return '-';
	return num.toLocaleString('zh-CN', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
}

function openQuoteDialog() {
	console.log('[purchase-contract] open quote selector');
	quoteDialog.visible = true;
	loadQuoteProducts();
}

async function loadQuoteProducts() {
	quoteDialog.loading = true;
	const params = { keyWord: quoteDialog.keyWord, size: 100 };
	console.log('[purchase-contract] request quoteProductOptions params', params);
	try {
		const res = await request({
			url: apiUrl('/admin/company/purchaseContract/quoteProductOptions'),
			method: 'post',
			data: params
		} as any);
		console.log('[purchase-contract] quoteProductOptions response', res);
		quoteDialog.list = normalizeQuoteProductResponse(res);
	} catch (e: any) {
		ElMessage.error(e?.message || t('报价产品加载失败'));
	} finally {
		quoteDialog.loading = false;
	}
}

function apiUrl(path: string) {
	return `${config.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

function normalizeQuoteProductResponse(res: any) {
	const data = res?.data ?? res;
	if (Array.isArray(data)) return data;
	if (Array.isArray(data?.list)) return data.list;
	if (Array.isArray(data?.records)) return data.records;
	if (Array.isArray(data?.data)) return data.data;
	if (Array.isArray(data?.rows)) return data.rows;
	return [];
}

function appendQuoteProducts() {
	if (!quoteDialog.selection.length) {
		ElMessage.warning(t('请选择采购产品'));
		return;
	}
	const existingKeys = new Set(
		items.value
			.filter(row => row.quoteProductId)
			.map(row => `${row.quoteId || ''}-${row.quoteProductId}`)
	);
	let addedCount = 0;
	let duplicateCount = 0;
	quoteDialog.selection.forEach(row => {
		const key = `${row.quoteId || ''}-${row.quoteProductId || ''}`;
		if (row.quoteProductId && existingKeys.has(key)) {
			duplicateCount++;
			return;
		}
		existingKeys.add(key);
		items.value = [
			...items.value,
			normalizeRow({
				...row,
				purchasePrice: row.purchasePrice ?? null,
				purchaseQuantity: row.purchaseQuantity || 1,
				pendingPurchaseQuantity: row.pendingPurchaseQuantity ?? row.sourceQuantity ?? null,
				purchasedQuantity: row.purchasedQuantity ?? 0,
				amount: row.amount ?? 0
			})
		];
		addedCount++;
	});
	if (addedCount === 0) {
		ElMessage.info(t('选择的产品已在明细中'));
		return;
	}
	emitItems();
	if (duplicateCount > 0) {
		ElMessage.info(t('已跳过重复产品') + duplicateCount + t('条'));
	}
	quoteDialog.selection = [];
	quoteDialog.visible = false;
}
</script>

<style lang="scss" scoped>
.purchase-contract-product-items {
	display: flex;
	flex-direction: column;
	gap: 8px;
	width: 100%;

	&__toolbar {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	&__amount {
		margin-left: auto;
		font-weight: 600;
	}

	&__table {
		width: 100%;
	}

	&__empty {
		padding: 18px;
		text-align: center;
		color: var(--el-text-color-secondary);
		border: 1px dashed var(--el-border-color);
		border-radius: 6px;
	}

	&__warning {
		margin-top: 4px;
		font-size: 12px;
		color: var(--el-color-warning);
		line-height: 16px;
	}

	&__search {
		display: flex;
		gap: 8px;
		margin-bottom: 12px;
	}
}

.w-full {
	width: 100%;
}
</style>
