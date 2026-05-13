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

			<template #slot-inquiryInfo>
				<div v-if="relatedInquiry" class="inquiry-info-section">
					<el-divider content-position="left">{{ $t('关联询价单信息') }}</el-divider>
					<el-descriptions :column="2" border size="small">
						<el-descriptions-item :label="$t('询价单号')">{{ relatedInquiry.inquiryNo }}</el-descriptions-item>
						<el-descriptions-item :label="$t('询价类型')">{{ inquiryTypeLabel }}</el-descriptions-item>
						<el-descriptions-item :label="$t('项目名称')">{{ relatedInquiry.projectName }}</el-descriptions-item>
						<el-descriptions-item :label="$t('客户')">{{ relatedInquiry.customer }}</el-descriptions-item>
						<el-descriptions-item :label="$t('联系人')">{{ relatedInquiry.contactPerson || '-' }}</el-descriptions-item>
						<el-descriptions-item :label="$t('项目地点')">{{ formatLocation(relatedInquiry.projectLocation) }}</el-descriptions-item>
						<el-descriptions-item v-if="relatedInquiry.address" :label="$t('具体地址')" :span="2">{{ relatedInquiry.address }}</el-descriptions-item>
						<el-descriptions-item v-if="relatedInquiry.projectStartDate" :label="$t('项目工期')">
							{{ relatedInquiry.projectStartDate }} ~ {{ relatedInquiry.projectEndDate || '-' }}
						</el-descriptions-item>
						<el-descriptions-item v-if="relatedInquiry.equipmentBrand" :label="$t('设备品牌')">{{ relatedInquiry.equipmentBrand }}</el-descriptions-item>
						<el-descriptions-item v-if="relatedInquiry.equipmentModelQty" :label="$t('设备型号及数量')">{{ relatedInquiry.equipmentModelQty }}</el-descriptions-item>
						<el-descriptions-item v-if="relatedInquiry.deliverStandard" :label="$t('交付标准')" :span="2">{{ relatedInquiry.deliverStandard }}</el-descriptions-item>
						<el-descriptions-item v-if="relatedInquiry.afterSalesRequirement" :label="$t('售后要求')" :span="2">{{ relatedInquiry.afterSalesRequirement }}</el-descriptions-item>
						<el-descriptions-item v-if="relatedInquiry.remark" :label="$t('备注')" :span="2">{{ relatedInquiry.remark }}</el-descriptions-item>
					</el-descriptions>

					<div v-if="relatedInquiry.productItems && relatedInquiry.productItems.length" style="margin-top: 12px">
						<div class="inquiry-sub-title">{{ $t('产品明细') }}</div>
						<el-table :data="relatedInquiry.productItems" border size="small" max-height="200">
							<el-table-column prop="productName" :label="$t('产品名称')" min-width="120" />
							<el-table-column prop="brand" :label="$t('品牌')" width="100" />
							<el-table-column prop="model" :label="$t('型号')" width="120" />
							<el-table-column prop="quantity" :label="$t('数量')" width="70" />
							<el-table-column prop="unit" :label="$t('单位')" width="60" />
							<el-table-column prop="remark" :label="$t('备注')" min-width="100" />
						</el-table>
					</div>

					<div v-if="relatedInquiry.spareItems && relatedInquiry.spareItems.length" style="margin-top: 12px">
						<div class="inquiry-sub-title">{{ $t('备件明细') }}</div>
						<el-table :data="relatedInquiry.spareItems" border size="small" max-height="200">
							<el-table-column prop="name" :label="$t('物料名称')" min-width="120" />
							<el-table-column prop="categoryBig" :label="$t('大类')" width="100" />
							<el-table-column prop="categorySmall" :label="$t('小类')" width="100" />
							<el-table-column prop="spec" :label="$t('规格型号')" width="120" />
							<el-table-column prop="quantity" :label="$t('数量')" width="70" />
							<el-table-column prop="brand" :label="$t('品牌')" width="100" />
						</el-table>
					</div>

					<template v-if="relatedInquiry.inquiryType === 0">
						<el-descriptions :column="2" border size="small" style="margin-top: 12px">
							<el-descriptions-item v-if="relatedInquiry.processingRequirement" :label="$t('加工要求')" :span="2">{{ relatedInquiry.processingRequirement }}</el-descriptions-item>
						</el-descriptions>
					</template>

					<template v-if="relatedInquiry.inquiryType === 1">
						<el-descriptions :column="2" border size="small" style="margin-top: 12px">
							<el-descriptions-item v-if="relatedInquiry.repairType" :label="$t('维修类型')">{{ relatedInquiry.repairType }}</el-descriptions-item>
							<el-descriptions-item v-if="relatedInquiry.siteEnvironment !== undefined && relatedInquiry.siteEnvironment !== null" :label="$t('现场环境')">{{ siteEnvLabel }}</el-descriptions-item>
							<el-descriptions-item v-if="relatedInquiry.faultDescription" :label="$t('故障描述')" :span="2">{{ relatedInquiry.faultDescription }}</el-descriptions-item>
							<el-descriptions-item v-if="relatedInquiry.debugOwnership !== undefined && relatedInquiry.debugOwnership !== null" :label="$t('调试归属')">{{ debugOwnershipLabel }}</el-descriptions-item>
						</el-descriptions>
					</template>

					<template v-if="relatedInquiry.inquiryType === 2">
						<el-descriptions :column="2" border size="small" style="margin-top: 12px">
							<el-descriptions-item v-if="relatedInquiry.maintenanceType !== undefined && relatedInquiry.maintenanceType !== null" :label="$t('保养类型')">{{ maintenanceTypeLabel }}</el-descriptions-item>
							<el-descriptions-item v-if="relatedInquiry.maintenanceContent" :label="$t('保养内容')" :span="2">{{ relatedInquiry.maintenanceContent }}</el-descriptions-item>
							<el-descriptions-item v-if="relatedInquiry.maintenanceScope" :label="$t('保养范围')" :span="2">{{ relatedInquiry.maintenanceScope }}</el-descriptions-item>
						</el-descriptions>
					</template>

					<template v-if="relatedInquiry.inquiryType === 3">
						<el-descriptions :column="2" border size="small" style="margin-top: 12px">
							<el-descriptions-item v-if="relatedInquiry.projectConstructType !== undefined && relatedInquiry.projectConstructType !== null" :label="$t('施工类型')">{{ projectConstructTypeLabel }}</el-descriptions-item>
							<el-descriptions-item v-if="relatedInquiry.projectConstructContent" :label="$t('施工内容')" :span="2">{{ relatedInquiry.projectConstructContent }}</el-descriptions-item>
							<el-descriptions-item v-if="relatedInquiry.projectSiteEnvDesc" :label="$t('现场环境描述')" :span="2">{{ relatedInquiry.projectSiteEnvDesc }}</el-descriptions-item>
						</el-descriptions>
					</template>

					<el-descriptions v-if="relatedInquiry.toolRequirement || relatedInquiry.softwareRequirement || relatedInquiry.capabilityRequirement || relatedInquiry.workerTypeAndCount || relatedInquiry.specificPersonnel || relatedInquiry.initialConstructionPlan" :column="2" border size="small" style="margin-top: 12px">
						<el-descriptions-item v-if="relatedInquiry.toolRequirement" :label="$t('工具要求')" :span="2">{{ relatedInquiry.toolRequirement }}</el-descriptions-item>
						<el-descriptions-item v-if="relatedInquiry.softwareRequirement" :label="$t('软件要求')" :span="2">{{ relatedInquiry.softwareRequirement }}</el-descriptions-item>
						<el-descriptions-item v-if="relatedInquiry.hoistingRequirement !== undefined && relatedInquiry.hoistingRequirement !== null" :label="$t('吊装需求')">{{ hoistingLabel }}</el-descriptions-item>
						<el-descriptions-item v-if="relatedInquiry.capabilityRequirement" :label="$t('能力需求')" :span="2">{{ relatedInquiry.capabilityRequirement }}</el-descriptions-item>
						<el-descriptions-item v-if="relatedInquiry.workerTypeAndCount" :label="$t('技工种及人数')" :span="2">{{ relatedInquiry.workerTypeAndCount }}</el-descriptions-item>
						<el-descriptions-item v-if="relatedInquiry.specificPersonnel" :label="$t('具体人员')" :span="2">{{ relatedInquiry.specificPersonnel }}</el-descriptions-item>
						<el-descriptions-item v-if="relatedInquiry.initialConstructionPlan" :label="$t('初步施工方案')" :span="2">{{ relatedInquiry.initialConstructionPlan }}</el-descriptions-item>
					</el-descriptions>
				</div>
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
import { computed, onMounted, reactive, ref } from 'vue';
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
		{ label: t('编辑中'), value: 0, type: 'info' },
		{ label: t('未审核'), value: 1, type: 'warning' },
		{ label: t('已审核'), value: 2, type: 'success' }
	]
});

const selectedQuoteProducts = ref<any[]>([]);
const relatedInquiry = ref<any>(null);

const inquiryTypeDict = ['机械加工类', '机械维修类', '机械保养类', '项目类', '备件类'];
const siteEnvDict = ['本体落地装（正装）', '倒装', '高台', '不入场'];
const debugOwnershipDict = ['不需要', '科海', '客户'];
const maintenanceTypeDict = ['基础', '高级'];
const projectConstructTypeDict = ['工作站搬迁', '工作站改造', '工作站恢复功能', '工作站翻新', '新建工作站'];
const hoistingDict = ['无', '吊装机', '龙门架', '现场建筑', '其他'];

const inquiryTypeLabel = computed(() => {
	const t = relatedInquiry.value?.inquiryType;
	return t !== undefined && t !== null ? inquiryTypeDict[t] || t : '-';
});
const siteEnvLabel = computed(() => {
	const t = relatedInquiry.value?.siteEnvironment;
	return t !== undefined && t !== null ? siteEnvDict[t] || t : '-';
});
const debugOwnershipLabel = computed(() => {
	const t = relatedInquiry.value?.debugOwnership;
	return t !== undefined && t !== null ? debugOwnershipDict[t] || t : '-';
});
const maintenanceTypeLabel = computed(() => {
	const t = relatedInquiry.value?.maintenanceType;
	return t !== undefined && t !== null ? maintenanceTypeDict[t] || t : '-';
});
const projectConstructTypeLabel = computed(() => {
	const t = relatedInquiry.value?.projectConstructType;
	return t !== undefined && t !== null ? projectConstructTypeDict[t] || t : '-';
});
const hoistingLabel = computed(() => {
	const t = relatedInquiry.value?.hoistingRequirement;
	return t !== undefined && t !== null ? hoistingDict[t] || t : '-';
});

function formatLocation(loc: any) {
	if (!loc) return '-';
	const parts = [loc.province, loc.city, loc.county].filter(Boolean);
	return parts.length ? parts.join(' / ') : '-';
}

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
					label: t('关联询价'),
					prop: 'inquiryInfo',
					span: 24,
					hidden: Upsert.value?.mode == 'add' || !relatedInquiry.value,
					component: {
						name: 'slot-inquiryInfo'
					}
				};
			};
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
		relatedInquiry.value = null;
		if ((data as any).quoteId) {
			selectedQuoteProducts.value = (data as any).productItems || [];
		} else {
			selectedQuoteProducts.value = [];
		}

		const id = (data as any)?.id;
		if (id && Upsert.value?.mode === 'edit') {
			(service as any).company?.contractMgmt
				?.contractInfoWithInquiry?.({ id })
				.then((res: any) => {
					if (res?.inquiry) {
						relatedInquiry.value = res.inquiry;
					}
				})
				.catch(() => {
					relatedInquiry.value = null;
				});
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
		relatedInquiry.value = null;
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

<style scoped>
.inquiry-info-section {
	margin-bottom: 16px;
}

.inquiry-sub-title {
	font-weight: 600;
	font-size: 14px;
	margin-bottom: 8px;
	color: #303133;
}
</style>
