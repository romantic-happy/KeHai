<template>
	<div class="quote-product-items">
		<div class="quote-product-items__header">
			<el-button type="success" size="small" @click="addProduct">
				{{ $t('新增产品') }}
			</el-button>
			<el-button type="primary" size="small" @click="autoFillFromInquiry" :disabled="!inquiryId">
				{{ $t('从询价单填充') }}
			</el-button>
		</div>

		<div
			v-for="(product, pIndex) in productItems"
			:key="pIndex"
			class="quote-product-items__product"
		>
			<el-card shadow="never" class="mb-2">
				<template #header>
					<div class="quote-product-items__product-header">
						<span>{{ $t('产品') }} {{ pIndex + 1 }}</span>
						<el-button
							type="danger"
							text
							size="small"
							@click="removeProduct(pIndex)"
						>
							{{ $t('删除产品') }}
						</el-button>
					</div>
				</template>

				<el-form :model="product" label-width="80px" size="small">
					<el-row :gutter="10">
						<el-col :span="6">
							<el-form-item :label="$t('产品名称')" required>
								<el-input v-model="product.productName" clearable />
							</el-form-item>
						</el-col>
						<el-col :span="4">
							<el-form-item :label="$t('品牌')">
								<el-input v-model="product.brand" clearable />
							</el-form-item>
						</el-col>
						<el-col :span="4">
							<el-form-item :label="$t('型号')">
								<el-input v-model="product.model" clearable />
							</el-form-item>
						</el-col>
						<el-col :span="3">
							<el-form-item :label="$t('数量')" required>
								<el-input-number
									v-model="product.quantity"
									:min="1"
									:controls="false"
								/>
							</el-form-item>
						</el-col>
						<el-col :span="2">
							<el-form-item :label="$t('单位')">
								<el-input v-model="product.unit" clearable />
							</el-form-item>
						</el-col>
						<el-col :span="2">
							<el-form-item :label="$t('分类大')">
								<el-input v-model="product.categoryBig" clearable />
							</el-form-item>
						</el-col>
						<el-col :span="3">
							<el-form-item :label="$t('操作')">
								<el-button
									type="primary"
									size="small"
									:loading="isLoading(getProductCacheKey(pIndex))"
									@click="handleRecommendSupplier(product, pIndex)"
								>
									{{ $t('推荐供应商') }}
								</el-button>
							</el-form-item>
						</el-col>
					</el-row>
				</el-form>

				<div class="quote-product-items__suppliers-title">
					<span>{{ $t('供应商报价明细') }}</span>
					<el-button
						type="primary"
						size="small"
						@click="addSupplier(pIndex)"
					>
						{{ $t('新增供应商报价') }}
					</el-button>
				</div>

				<el-table
					:data="Array.isArray(product.suppliers) ? product.suppliers : []"
					size="small"
					border
					class="mt-1"
				>
					<el-table-column :label="$t('供应商')" min-width="140">
						<template #default="{ row }">
							<el-input v-model="row.supplier" clearable />
						</template>
					</el-table-column>
					<el-table-column :label="$t('质量')" min-width="120">
						<template #default="{ row }">
							<el-select v-model="row.quality" clearable :placeholder="$t('请选择')">
								<el-option
									v-for="q in qualityOptions"
									:key="q"
									:label="q"
									:value="q"
								/>
							</el-select>
						</template>
					</el-table-column>
					<el-table-column :label="$t('未税单价')" min-width="110">
						<template #default="{ row }">
							<el-input-number
								v-model="row.unitPriceExclTax"
								:min="0"
								:controls="false"
								@change="calcSupplierPrice(row, 'excl', product.quantity)"
							/>
						</template>
					</el-table-column>
					<el-table-column :label="$t('税率(%)')" min-width="90">
						<template #default="{ row }">
							<el-input-number
								v-model="row.taxRate"
								:min="0"
								:max="100"
								:controls="false"
								@change="calcSupplierPrice(row, 'rate', product.quantity)"
							/>
						</template>
					</el-table-column>
					<el-table-column :label="$t('含税单价')" min-width="110">
						<template #default="{ row }">
							<el-input-number
								v-model="row.unitPriceInclTax"
								:min="0"
								:controls="false"
								@change="calcSupplierPrice(row, 'incl', product.quantity)"
							/>
						</template>
					</el-table-column>
					<el-table-column :label="$t('含税总价')" min-width="110">
						<template #default="{ row }">
							<el-input-number
								v-model="row.totalPriceInclTax"
								:min="0"
								:controls="false"
							/>
						</template>
					</el-table-column>
					<el-table-column :label="$t('运费')" min-width="90">
						<template #default="{ row }">
							<el-input-number
								v-model="row.freight"
								:min="0"
								:controls="false"
							/>
						</template>
					</el-table-column>
					<el-table-column :label="$t('货期(天)')" min-width="100">
						<template #default="{ row }">
							<el-input v-model="row.delivery" clearable />
						</template>
					</el-table-column>
					<el-table-column :label="$t('质保期(天)')" min-width="100">
						<template #default="{ row }">
							<el-input v-model="row.warrantyPeriod" clearable />
						</template>
					</el-table-column>
					<el-table-column :label="$t('备注')" min-width="140">
						<template #default="{ row }">
							<el-input v-model="row.remark" clearable />
						</template>
					</el-table-column>
					<el-table-column :label="$t('操作')" width="100" align="center">
						<template #default="{ $index }">
							<el-button
								type="danger"
								text
								size="small"
								@click="removeSupplier(pIndex, $index)"
							>
								{{ $t('删除') }}
							</el-button>
						</template>
					</el-table-column>
				</el-table>
			</el-card>
		</div>

		<div v-if="productItems.length === 0" class="quote-product-items__empty">
			{{ $t('暂无产品明细，请点击"新增产品"或"从询价单填充"') }}
		</div>
	</div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useCool } from '/@/cool';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { useDifyApi } from '../../api/dify';
import { useAsyncLoading } from '/@/composables/useAsyncLoading';

interface ProductSupplier {
	supplier: string;
	quality?: string;
	unitPriceExclTax?: number;
	taxRate?: number;
	unitPriceInclTax?: number;
	totalPriceInclTax?: number;
	freight?: number;
	delivery?: string;
	warrantyPeriod?: string;
	remark?: string;
}

interface ProductItem {
	productSeq: number;
	productName: string;
	brand: string;
	model: string;
	quantity: number;
	unit: string;
	categoryBig?: string;
	categoryMid?: string;
	categorySmall?: string;
	suppliers: ProductSupplier[];
	remark?: string;
}

const props = defineProps<{
	modelValue?: ProductItem[];
	inquiryId?: number;
	inquiryType?: number;
}>();

const emit = defineEmits<{
	'update:modelValue': [value: ProductItem[]];
}>();

const { service } = useCool();
const { t } = useI18n();
const { getSupplierRecommend } = useDifyApi();
const { isLoading, runWithLoading } = useAsyncLoading();

const qualityOptions = [
	'原装全新',
	'国产全新',
	'冲新',
	'翻新',
	'二手',
	'服务'
];

const productItems = ref<ProductItem[]>(props.modelValue || []);

watch(
	() => productItems.value,
	(val) => {
		emit('update:modelValue', val);
	},
	{ deep: true }
);

watch(
	() => props.modelValue,
	(val) => {
		if (val && Array.isArray(val)) {
			productItems.value = val.map(item => ({
				...item,
				suppliers: Array.isArray(item.suppliers) ? item.suppliers : []
			}));
		}
	}
);

function addProduct() {
	productItems.value.push({
		productSeq: productItems.value.length + 1,
		productName: '',
		brand: '',
		model: '',
		quantity: 1,
		unit: '项',
		categoryBig: '',
		categoryMid: '',
		categorySmall: '',
		suppliers: []
	});
}

function removeProduct(index: number) {
	productItems.value.splice(index, 1);
	resequence();
}

function resequence() {
	productItems.value.forEach((item, index) => {
		item.productSeq = index + 1;
	});
}

function addSupplier(productIndex: number) {
	const product = productItems.value[productIndex];
	if (!product) return;
	if (!Array.isArray(product.suppliers)) {
		product.suppliers = [];
	}
	product.suppliers.push({
		supplier: '',
		quality: undefined,
		unitPriceExclTax: undefined,
		taxRate: 13,
		unitPriceInclTax: undefined,
		totalPriceInclTax: undefined,
		freight: undefined,
		delivery: undefined,
		warrantyPeriod: undefined,
		remark: ''
	});
}

function removeSupplier(productIndex: number, supplierIndex: number) {
	const product = productItems.value[productIndex];
	if (!product || !Array.isArray(product.suppliers)) return;
	product.suppliers.splice(supplierIndex, 1);
}

function calcSupplierPrice(row: ProductSupplier, trigger: 'excl' | 'incl' | 'rate', quantity: number = 1) {
	const excl = Number(row.unitPriceExclTax) || 0;
	const rate = Number(row.taxRate) || 0;
	const incl = Number(row.unitPriceInclTax) || 0;

	if (trigger === 'excl' || trigger === 'rate') {
		row.unitPriceInclTax = Math.round(excl * (1 + rate / 100) * 100) / 100;
	} else if (trigger === 'incl') {
		row.unitPriceExclTax =
			rate > 0
				? Math.round((incl / (1 + rate / 100)) * 100) / 100
				: incl;
	}

	const qty = Number(quantity) || 1;
	row.totalPriceInclTax = Math.round(Number(row.unitPriceInclTax) * qty * 100) / 100;
}

async function autoFillFromInquiry() {
	if (!props.inquiryId) {
		ElMessage.warning(t('请先选择询价单'));
		return;
	}

	try {
		const res: any = await (service as any).company.quote.inquiryProductItems({
			params: { inquiryId: props.inquiryId }
		});

		if (res?.items && Array.isArray(res.items) && res.items.length > 0) {
			const existingNames = new Set(
				productItems.value.map(p => p.productName)
			);
			let addedCount = 0;
			for (const item of res.items) {
				if (!existingNames.has(item.productName)) {
					productItems.value.push({
						...item,
						suppliers: []
					});
					addedCount++;
				}
			}
			resequence();
			if (addedCount > 0) {
				ElMessage.success(t('已从询价单填充') + addedCount + t('条产品明细'));
			} else {
				ElMessage.info(t('询价单中的产品已全部存在'));
			}
		} else {
			ElMessage.info(t('询价单中暂无可填充的产品明细'));
		}
	} catch (e: any) {
		ElMessage.error(e?.message || t('获取询价单产品明细失败'));
	}
}

function getProductCacheKey(pIndex: number): string {
	const p = productItems.value[pIndex];
	const name = p?.productName || '';
	const model = p?.model || '';
	return `product_supplier||${pIndex}||${name}||${model}`;
}

async function handleRecommendSupplier(product: ProductItem, pIndex: number) {
	const name = product.productName || '';
	const model = product.model || '';

	if (!name) {
		ElMessage.warning(t('产品名称为必填项'));
		return;
	}

	await runWithLoading(getProductCacheKey(pIndex), async () => {
		const result = await getSupplierRecommend({
			name: name,
			dimension: model
		});

		const suppliers: string[] = [];
		if (result && result.outputs) {
			if (result.outputs.Supplier_Recommendation1) {
				suppliers.push(result.outputs.Supplier_Recommendation1);
			}
			if (result.outputs.Supplier_Recommendation2) {
				suppliers.push(result.outputs.Supplier_Recommendation2);
			}
			if (result.outputs.Supplier_Recommendation3) {
				suppliers.push(result.outputs.Supplier_Recommendation3);
			}
		} else if (result) {
			if (result.Supplier_Recommendation1) {
				suppliers.push(result.Supplier_Recommendation1);
			}
			if (result.Supplier_Recommendation2) {
				suppliers.push(result.Supplier_Recommendation2);
			}
			if (result.Supplier_Recommendation3) {
				suppliers.push(result.Supplier_Recommendation3);
			}
		}

		if (suppliers.length > 0) {
			for (const supplierName of suppliers) {
				addSupplier(pIndex);
				const p = productItems.value[pIndex];
				if (p && Array.isArray(p.suppliers) && p.suppliers.length > 0) {
					const lastSupplier = p.suppliers[p.suppliers.length - 1];
					lastSupplier.supplier = supplierName;
				}
			}
			ElMessage.success(t('已添加') + suppliers.length + t('个推荐供应商'));

			let judgeText = '';
			if (result && result.outputs && result.outputs.judge) {
				judgeText = result.outputs.judge;
			} else if (result && result.judge) {
				judgeText = result.judge;
			}

			if (judgeText) {
				ElMessage.info({
					message: `${t('核心判断')}：${judgeText}`,
					duration: 0,
					showClose: true
				});
			}
		} else {
			ElMessage.warning(t('未找到推荐供应商'));
		}

		return result;
	}, {
		loadingText: t('正在推荐供应商...'),
		successText: t('推荐成功'),
		errorText: t('推荐失败')
	});
}

defineExpose({
	productItems
});
</script>

<style lang="scss" scoped>
.quote-product-items {
	display: flex;
	flex-direction: column;
	gap: 8px;

	&__header {
		display: flex;
		gap: 8px;
		margin-bottom: 4px;
	}

	&__product-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-weight: 600;
	}

	&__suppliers-title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 8px 0 4px;
		font-weight: 600;
		font-size: 13px;
	}

	&__empty {
		text-align: center;
		padding: 24px;
		color: var(--el-text-color-secondary);
		font-size: 13px;
	}
}
</style>
