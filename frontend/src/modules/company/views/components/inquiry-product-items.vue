<template>
	<div class="inquiry-product-items">
		<div class="inquiry-product-items__header">
			<el-button type="success" size="small" @click="addProduct">
				{{ $t('新增产品') }}
			</el-button>
		</div>

		<div
			v-for="(product, pIndex) in productItems"
			:key="pIndex"
			class="inquiry-product-items__product"
		>
			<el-card shadow="never" class="mb-2">
				<template #header>
					<div class="inquiry-product-items__product-header">
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
					</el-row>
				</el-form>
			</el-card>
		</div>

		<div v-if="productItems.length === 0" class="inquiry-product-items__empty">
			{{ $t('暂无产品明细，请点击"新增产品"') }}
		</div>
	</div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

interface InquiryProductItem {
	productSeq: number;
	productName: string;
	brand: string;
	model: string;
	quantity: number;
	unit: string;
}

const props = defineProps<{
	modelValue?: InquiryProductItem[];
}>();

const emit = defineEmits<{
	'update:modelValue': [value: InquiryProductItem[]];
}>();

const { t } = useI18n();

const productItems = ref<InquiryProductItem[]>(props.modelValue || []);

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
			productItems.value = val;
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
		unit: '项'
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

defineExpose({
	productItems
});
</script>

<style lang="scss" scoped>
.inquiry-product-items {
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

	&__empty {
		text-align: center;
		padding: 24px;
		color: var(--el-text-color-secondary);
		font-size: 13px;
	}
}
</style>
