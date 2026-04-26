<template>
	<div class="contract-product-selector">
		<el-divider content-position="left">选择报价单</el-divider>

		<el-select
			v-model="selectedQuoteId"
			placeholder="请选择报价单"
			clearable
			filterable
			style="width: 100%; margin-bottom: 16px"
			@change="onQuoteChange"
		>
			<el-option
				v-for="q in quoteList"
				:key="q.id"
				:label="q.label"
				:value="q.id"
			/>
		</el-select>

		<template v-if="availableItems.length > 0">
			<el-divider content-position="left">可选产品（勾选添加到合同）</el-divider>

			<el-table
				:data="availableItems"
				border
				size="small"
				style="margin-bottom: 16px"
				@selection-change="onSelectionChange"
			>
				<el-table-column type="selection" width="50" />
				<el-table-column label="序号" prop="productSeq" width="60" />
				<el-table-column label="产品名称" prop="productName" min-width="140" />
				<el-table-column label="品牌" prop="brand" width="100" />
				<el-table-column label="型号" prop="model" width="120" />
				<el-table-column label="数量" prop="quantity" width="70" />
				<el-table-column label="单位" prop="unit" width="60" />
				<el-table-column label="分类" width="100">
					<template #default="{ row }">
						{{ row.categorySmall || row.categoryBig || '-' }}
					</template>
				</el-table-column>
				<el-table-column label="采购参考价" width="110">
					<template #default="{ row }">
						{{ row.purchasePrice ? `¥${row.purchasePrice}` : '-' }}
					</template>
				</el-table-column>
				<el-table-column v-if="isSpareType" label="供应商" width="180">
					<template #default="{ row }">
						<el-select
							v-if="row.supplierOptions && row.supplierOptions.length > 0"
							:model-value="row.supplierIndex ?? 0"
							size="small"
							placeholder="选择供应商"
							@change="(val: any) => onSupplierChange(row, val)"
						>
							<el-option
								v-for="s in row.supplierOptions"
								:key="s.index"
								:label="`${s.supplier} (¥${s.unitPriceInclTax})`"
								:value="s.index"
							/>
						</el-select>
						<span v-else>{{ row.supplierName || '-' }}</span>
					</template>
				</el-table-column>
			</el-table>
		</template>

		<template v-if="selectedItems.length > 0">
			<el-divider content-position="left">
				已选产品（填写销售价格）
				<span style="color: #409eff; margin-left: 12px">
					合计：¥{{ totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
				</span>
			</el-divider>

			<el-table :data="selectedItems" border size="small">
				<el-table-column label="序号" width="60">
					<template #default="{ $index }">
						{{ $index + 1 }}
					</template>
				</el-table-column>
				<el-table-column label="产品名称" prop="productName" min-width="120" />
				<el-table-column label="品牌" prop="brand" width="90" />
				<el-table-column label="型号" prop="model" width="100" />
				<el-table-column label="数量" prop="quantity" width="70" />
				<el-table-column label="单位" prop="unit" width="55" />
				<el-table-column label="销售单价(含税)" width="140">
					<template #default="{ row }">
						<el-input-number
							v-model="row.salesPriceInclTax"
							size="small"
							:min="0"
							:precision="2"
							:controls="false"
							style="width: 100%"
							@change="calcRow(row)"
						/>
					</template>
				</el-table-column>
				<el-table-column label="税率(%)" width="90">
					<template #default="{ row }">
						<el-input-number
							v-model="row.taxRate"
							size="small"
							:min="0"
							:max="100"
							:precision="2"
							:controls="false"
							style="width: 100%"
							@change="calcRow(row)"
						/>
					</template>
				</el-table-column>
				<el-table-column label="销售单价(未税)" width="120">
					<template #default="{ row }">
						{{ row.salesPriceExclTax?.toFixed(2) ?? '0.00' }}
					</template>
				</el-table-column>
				<el-table-column label="价税合计" width="120">
					<template #default="{ row }">
						{{ row.totalPriceInclTax?.toFixed(2) ?? '0.00' }}
					</template>
				</el-table-column>
				<el-table-column label="操作" width="60" fixed="right">
					<template #default="{ $index }">
						<el-button type="danger" link size="small" @click="removeItem($index)">
							移除
						</el-button>
					</template>
				</el-table-column>
			</el-table>
		</template>

		<el-empty v-if="availableItems.length === 0 && !selectedQuoteId" description="请先选择报价单" :image-size="60" />
	</div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useCool } from '/@/cool';

interface SelectedItem {
	productSeq: number;
	productName: string;
	brand: string;
	model: string;
	quantity: number;
	unit: string;
	categoryBig: string;
	categoryMid: string;
	categorySmall: string;
	salesPriceInclTax: number;
	taxRate: number;
	salesPriceExclTax: number;
	totalPriceInclTax: number;
	sourceType: string;
	sourceQuoteItemId: string;
	supplierName: string;
	supplierIndex: number;
	purchasePrice?: number;
	supplierOptions?: any[];
}

const props = defineProps<{
	modelValue: SelectedItem[];
	quoteId?: number;
	inquiryId?: number;
}>();

const emit = defineEmits<{
	'update:modelValue': [value: SelectedItem[]];
	'update:quoteId': [value: number | undefined];
	'update:inquiryId': [value: number | undefined];
	'amountChange': [value: number];
	'customerChange': [value: string];
}>();

const { service } = useCool();

const selectedQuoteId = ref<number | undefined>(undefined);
const quoteList = ref<any[]>([]);
const availableItems = ref<any[]>([]);
const selectedItems = ref<SelectedItem[]>([]);
const currentInquiryType = ref(0);
const currentCustomer = ref('');
const currentProjectName = ref('');

const isSpareType = computed(() => currentInquiryType.value === 4);

const totalAmount = computed(() => {
	return selectedItems.value.reduce((sum, item) => sum + (Number(item.totalPriceInclTax) || 0), 0);
});

watch(
	() => props.modelValue,
	(val) => {
		if (Array.isArray(val) && val.length > 0) {
			selectedItems.value = val.map((item) => ({ ...item }));
		}
	},
	{ immediate: true }
);

watch(
	() => props.quoteId,
	(val) => {
		if (val && !selectedQuoteId.value) {
			selectedQuoteId.value = val;
			loadQuoteProductItems(val);
		}
	},
	{ immediate: true }
);

watch(totalAmount, (val) => {
	emit('amountChange', val);
});

watch(
	() => selectedItems.value,
	(val) => {
		emit('update:modelValue', val);
	},
	{ deep: true }
);

onMounted(async () => {
	await loadQuoteList();
	if (props.quoteId) {
		selectedQuoteId.value = props.quoteId;
		await loadQuoteProductItems(props.quoteId);
	}
});

async function loadQuoteList() {
	try {
		const res: any = await (service as any).company.contractMgmt.quoteListForSelect();
		quoteList.value = res || [];
	} catch (e: any) {
		console.error('加载报价单列表失败:', e);
	}
}

async function loadQuoteProductItems(quoteId: number) {
	try {
		const res: any = await (service as any).company.contractMgmt.quoteProductItems({
			params: { quoteId },
		});
		currentInquiryType.value = res.inquiryType ?? 0;
		currentCustomer.value = res.customer || '';
		currentProjectName.value = res.projectName || '';
		emit('update:inquiryId', res.inquiryId);
		emit('customerChange', res.customer || '');

		availableItems.value = (res.items || []).map((item: any) => ({
			...item,
			supplierIndex: 0,
		}));
	} catch (e: any) {
		console.error('加载报价单产品明细失败:', e);
	}
}

function onQuoteChange(quoteId: number) {
	emit('update:quoteId', quoteId || undefined);
	if (quoteId) {
		loadQuoteProductItems(quoteId);
	} else {
		availableItems.value = [];
		currentInquiryType.value = 0;
	}
}

function onSelectionChange(selection: any[]) {
	const existingIds = new Set(selectedItems.value.map((i) => i.sourceQuoteItemId));
	for (const item of selection) {
		if (!existingIds.has(item.sourceQuoteItemId)) {
			const supplier = item.supplierOptions?.[item.supplierIndex ?? 0];
			selectedItems.value.push({
				productSeq: item.productSeq,
				productName: item.productName,
				brand: item.brand || '',
				model: item.model || '',
				quantity: item.quantity || 1,
				unit: item.unit || '',
				categoryBig: item.categoryBig || '',
				categoryMid: item.categoryMid || '',
				categorySmall: item.categorySmall || '',
				salesPriceInclTax: 0,
				taxRate: supplier?.taxRate ?? 13,
				salesPriceExclTax: 0,
				totalPriceInclTax: 0,
				sourceType: item.sourceType || 'manual',
				sourceQuoteItemId: item.sourceQuoteItemId || '',
				supplierName: supplier?.supplier || item.supplierName || '',
				supplierIndex: item.supplierIndex ?? 0,
				purchasePrice: item.purchasePrice,
				supplierOptions: item.supplierOptions,
			});
		}
	}

	const selectedIds = new Set(selection.map((i) => i.sourceQuoteItemId));
	selectedItems.value = selectedItems.value.filter((i) => selectedIds.has(i.sourceQuoteItemId));

	emit('update:modelValue', selectedItems.value);
}

function onSupplierChange(row: any, supplierIndex: number) {
	row.supplierIndex = supplierIndex;
	const supplier = row.supplierOptions?.[supplierIndex];
	if (supplier) {
		row.supplierName = supplier.supplier;
		row.purchasePrice = supplier.unitPriceInclTax;
	}

	const existing = selectedItems.value.find((i) => i.sourceQuoteItemId === row.sourceQuoteItemId);
	if (existing && supplier) {
		existing.supplierName = supplier.supplier;
		existing.supplierIndex = supplierIndex;
		existing.taxRate = supplier.taxRate ?? 13;
		calcRow(existing);
	}
}

function calcRow(row: SelectedItem) {
	const priceInclTax = Number(row.salesPriceInclTax) || 0;
	const taxRate = Number(row.taxRate) || 0;
	const qty = Number(row.quantity) || 1;

	row.salesPriceExclTax =
		taxRate > 0
			? Math.round((priceInclTax / (1 + taxRate / 100)) * 100) / 100
			: priceInclTax;
	row.totalPriceInclTax = Math.round(qty * priceInclTax * 100) / 100;

	emit('update:modelValue', selectedItems.value);
}

function removeItem(index: number) {
	const removed = selectedItems.value.splice(index, 1)[0];
	emit('update:modelValue', selectedItems.value);
}
</script>

<style lang="scss" scoped>
.contract-product-selector {
	width: 100%;

	:deep(.el-divider__text) {
		font-weight: 600;
		font-size: 14px;
	}

	:deep(.el-input-number) {
		.el-input__inner {
			text-align: right;
		}
	}
}
</style>
