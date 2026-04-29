<template>
	<div class="contract-product-selector">
		<div class="contract-product-selector__header">
			<el-select
				v-model="selectedQuoteId"
				:placeholder="$t('选择报价单')"
				clearable
				filterable
				@change="onQuoteChange"
				style="width: 100%"
			>
				<el-option
					v-for="item in quoteList"
					:key="item.id"
					:label="`${item.inquiryNo || ''} - ${item.projectName || ''}`"
					:value="item.id"
				/>
			</el-select>
		</div>

		<div v-if="quoteProducts.length > 0" class="contract-product-selector__products">
			<el-table :data="quoteProducts" border size="small" @selection-change="onSelectionChange">
				<el-table-column type="selection" width="40" />
				<el-table-column prop="productName" :label="$t('产品名称')" min-width="120" />
				<el-table-column prop="brand" :label="$t('品牌')" width="100" />
				<el-table-column prop="model" :label="$t('型号')" width="120" />
				<el-table-column prop="quantity" :label="$t('数量')" width="70" />
				<el-table-column prop="unit" :label="$t('单位')" width="60" />
			</el-table>
		</div>

		<div v-if="selectedQuoteId && quoteProducts.length === 0" class="contract-product-selector__empty">
			{{ $t('该报价单暂无产品明细') }}
		</div>
	</div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue';
import { useCool } from '/@/cool';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	modelValue?: any[];
	quoteId?: number;
	inquiryId?: number;
}>();

const emit = defineEmits<{
	'update:modelValue': [value: any[]];
	'update:quoteId': [value: number];
	'update:inquiryId': [value: number];
	amountChange: [value: number];
	customerChange: [value: any];
}>();

const { service } = useCool();
const { t } = useI18n();

const quoteList = ref<any[]>([]);
const selectedQuoteId = ref<number | undefined>(props.quoteId);
const quoteProducts = ref<any[]>([]);
const selectedProducts = ref<any[]>(props.modelValue || []);

watch(
	() => props.quoteId,
	(val) => {
		if (val !== selectedQuoteId.value) {
			selectedQuoteId.value = val;
			if (val) {
				loadQuoteProducts(val);
			}
		}
	}
);

watch(
	() => props.modelValue,
	(val) => {
		if (val) {
			selectedProducts.value = val;
		}
	}
);

onMounted(() => {
	loadQuoteList();
	if (props.quoteId) {
		loadQuoteProducts(props.quoteId);
	}
});

async function loadQuoteList() {
	try {
		const res = await service.company.inquiry.page({ size: 999 });
		quoteList.value = res.list || [];
	} catch (e) {
		console.error('Failed to load quote list', e);
	}
}

async function loadQuoteProducts(quoteId: number) {
	try {
		const res = await service.company.inquiry.info({ id: quoteId });
		let products: any[] = [];

		if (res.productItems && Array.isArray(res.productItems)) {
			products = res.productItems.map((item: any, index: number) => ({
				sourceQuoteItemId: `q${quoteId}_p${index}`,
				quoteId: quoteId,
				productName: item.productName || '',
				brand: item.brand || '',
				model: item.model || '',
				quantity: item.quantity || 0,
				unit: item.unit || '',
			}));
		}

		if (res.spareItems && Array.isArray(res.spareItems)) {
			const spareProducts = res.spareItems.map((item: any, index: number) => ({
				sourceQuoteItemId: `q${quoteId}_s${index}`,
				quoteId: quoteId,
				productName: item.productName || item.name || '',
				brand: item.brand || '',
				model: item.model || item.spec || '',
				quantity: item.quantity || 0,
				unit: item.unit || '个',
			}));
			products = [...products, ...spareProducts];
		}

		quoteProducts.value = products;
	} catch (e) {
		console.error('Failed to load quote products', e);
		quoteProducts.value = [];
	}
}

function onQuoteChange(val: number) {
	emit('update:quoteId', val);
	selectedProducts.value = [];
	emit('update:modelValue', []);

	if (val) {
		loadQuoteProducts(val);
		const quote = quoteList.value.find((q) => q.id === val);
		if (quote) {
			emit('update:inquiryId', quote.id);
			if (quote.customerId) {
				emit('customerChange', { customerId: quote.customerId, customerName: quote.customerName });
			}
		}
	} else {
		quoteProducts.value = [];
	}
}

function onSelectionChange(selection: any[]) {
	selectedProducts.value = selection;
	emit('update:modelValue', selection);

	const totalAmount = selection.reduce((sum, item) => {
		return sum + (item.amount || 0);
	}, 0);
	emit('amountChange', totalAmount);
}
</script>

<style lang="scss" scoped>
.contract-product-selector {
	display: flex;
	flex-direction: column;
	gap: 10px;

	&__header {
		width: 100%;
	}

	&__products {
		max-height: 300px;
		overflow-y: auto;
	}

	&__empty {
		text-align: center;
		padding: 20px;
		color: var(--el-text-color-secondary);
		font-size: 13px;
	}
}
</style>
