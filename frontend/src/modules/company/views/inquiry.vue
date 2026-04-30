<template>
	<cl-crud ref="Crud">
		<cl-row>
			<cl-refresh-btn />
			<cl-add-btn />
			<cl-multi-delete-btn />
			<cl-flex1 />

			<!-- 关键字搜索：按 inquiryNo/customer/projectName -->
			<cl-search-key :placeholder="$t('搜索报价单号/客户/项目名称')" :width="260" />
		</cl-row>

		<cl-row>
			<cl-table :key="permRenderKey" ref="Table">
				<template #column-quoteSummary="{ scope }">
					<template v-if="getQuoteStatus(scope.row) === 0">
						<el-tag disable-transitions effect="plain" type="danger">
							{{ $t('待报价') }}
						</el-tag>
					</template>

					<template v-else>
						<div class="quote-summary">
							<div class="quote-summary__top">
								<div class="quote-summary__no">{{ scope.row.quoteNo || '-' }}</div>

								<el-tag disable-transitions effect="plain"
									:type="getQuoteStatus(scope.row) === 1 ? 'warning' : 'success'">
									{{
										getQuoteStatus(scope.row) === 1 ? $t('报价中') : $t('报价已定')
									}}
								</el-tag>
							</div>

							<template v-if="isQuoteRejected(scope.row)">
								<div class="quote-summary__row">
									<span class="label">{{ $t('报价信息') }}</span>
									<span class="value">-</span>
								</div>
							</template>

							<!-- 非备件类：显示供应商 + 未税/税率/含税/总成本 -->
							<template v-else-if="scope.row.inquiryType !== 4">
								<div class="quote-summary__row">
									<span class="label">{{ $t('供应商') }}</span>
									<span class="value">{{ scope.row.quoteSupplier || '-' }}</span>
								</div>
								<div class="quote-summary__row">
									<span class="label">{{ $t('未税') }}</span>
									<span class="value">{{ scope.row.quotePriceExclTax ?? '-' }}</span>
									<span class="label ml-2">{{ $t('税率') }}</span>
									<span class="value">{{ scope.row.quoteTaxRate ?? '-' }}%</span>
								</div>
								<div class="quote-summary__row">
									<span class="label">{{ $t('含税') }}</span>
									<span class="value">{{ scope.row.quotePriceInclTax ?? '-' }}</span>
									<span class="label ml-2">{{ $t('总成本') }}</span>
									<span class="value">{{ scope.row.quoteTotalCost ?? '-' }}</span>
								</div>
							</template>

							<!-- 备件类：只显示未税 / 含税 / 总成本 -->
							<template v-else>
								<div class="quote-summary__row">
									<span class="label">{{ $t('未税') }}</span>
									<span class="value">{{ scope.row.quotePriceExclTax ?? '-' }}</span>
								</div>
								<div class="quote-summary__row">
									<span class="label">{{ $t('含税') }}</span>
									<span class="value">{{ scope.row.quotePriceInclTax ?? '-' }}</span>
								</div>
								<div class="quote-summary__row">
									<span class="label">{{ $t('总成本') }}</span>
									<span class="value">{{ scope.row.quoteTotalCost ?? '-' }}</span>
								</div>
							</template>

							<div class="quote-summary__actions" v-if="
								getQuoteStatus(scope.row) === 1 &&
								getQuoteId(scope.row) > 0 &&
								!isQuoteRejected(scope.row)
							">
								<el-button type="primary" size="small" @click="onAccept(getQuoteId(scope.row))"
									v-permission="'company:inquiry:accept'">
									{{ $t('接受报价') }}
								</el-button>
								<el-button type="danger" size="small" @click="onReject(getQuoteId(scope.row))"
									v-permission="'company:inquiry:reject'">
									{{ $t('拒绝报价') }}
								</el-button>
							</div>

							<div class="quote-summary__actions" v-else-if="getQuoteStatus(scope.row) === 2">
								<el-button type="success" size="small" @click="goContract(scope.row)">
									{{ $t('转合同') }}
								</el-button>
							</div>
						</div>
					</template>
				</template>
			</cl-table>
		</cl-row>

		<cl-row>
			<cl-flex1 />
			<cl-pagination />
		</cl-row>

		<!-- 拒单弹窗 -->
		<el-dialog v-model="lostDialogVisible" :title="$t('拒单')" width="420px" :close-on-click-modal="false">
			<el-form label-position="top">
				<el-form-item :label="$t('拒单原因')">
					<el-input v-model="lostForm.lostReason" type="textarea" :rows="3" :placeholder="$t('请输入拒单原因')" />
				</el-form-item>
				<el-form-item :label="$t('销售报价')">
					<el-input v-model="lostForm.salesQuote" :placeholder="$t('请输入销售报价')" />
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="lostDialogVisible = false">{{ $t('取消') }}</el-button>
				<el-button type="primary" @click="confirmLostDialog">{{ $t('确定') }}</el-button>
			</template>
		</el-dialog>

		<cl-upsert ref="Upsert">
			<!-- 备件类：物料列表可增删多条（绑定 spareItems） -->
			<template #slot-materialList="{ scope }">
				<div v-if="scope">
					<el-table :data="scope.spareItems || []" size="small" border
						style="width: 100%; margin-bottom: 8px">
						<el-table-column :label="$t('物料名称')" min-width="160">
							<template #default="{ $index }">
								<el-input v-model="scope.spareItems[$index].name" :placeholder="$t('请输入物料名称')"
									clearable />
							</template>
						</el-table-column>
						<el-table-column :label="$t('物料大类')" min-width="140">
							<template #default="{ $index }">
								<el-select v-model="scope.spareItems[$index].categoryBig" :placeholder="$t('请选择物料大类')"
									clearable>
									<el-option v-for="opt in options.spareBigCategory" :key="opt.value"
										:label="opt.label" :value="opt.value" />
								</el-select>
							</template>
						</el-table-column>
						<el-table-column :label="$t('物料小类')" min-width="160">
							<template #default="{ $index }">
								<el-select v-model="scope.spareItems[$index].categorySmall" :placeholder="$t('请选择物料小类')"
									clearable>
									<el-option v-for="opt in
										(scope.spareItems[$index].categoryBig === 'robot'
											? options.spareSubCategoryRobot
											: options.spareSubCategoryNonRobot)" :key="opt.value" :label="opt.label" :value="opt.value" />
								</el-select>
							</template>
						</el-table-column>
						<el-table-column :label="$t('规格型号')" min-width="140">
							<template #default="{ $index }">
								<el-input v-model="scope.spareItems[$index].spec" :placeholder="$t('请输入规格型号')"
									clearable />
							</template>
						</el-table-column>
						<el-table-column :label="$t('数量')" min-width="100">
							<template #default="{ $index }">
								<el-input v-model="scope.spareItems[$index].quantity" :placeholder="$t('请输入数量')"
									clearable />
							</template>
						</el-table-column>
						<el-table-column :label="$t('品牌')" min-width="160">
							<template #default="{ $index }">
								<el-input v-model="scope.spareItems[$index].brand" :placeholder="$t('请输入品牌')"
									clearable />
							</template>
						</el-table-column>
						<el-table-column :label="$t('操作')" width="100" align="center">
							<template #default="{ $index }">
								<el-button type="success" size="small" @click="removeSpareItem(scope, $index)">
									{{ $t('删除') }}
								</el-button>
							</template>
						</el-table-column>
					</el-table>

					<el-button type="success" size="small" @click="addSpareItem(scope)">
						{{ $t('新增物料') }}
					</el-button>
				</div>
			</template>


		</cl-upsert>
	</cl-crud>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'company-inquiry'
});

import { useCrud, useTable, useUpsert } from '@cool-vue/crud';
import { useCool } from '/@/cool';
import { useI18n } from 'vue-i18n';
import { onMounted, reactive, ref } from 'vue';
import { Document } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { request } from '/@/cool/service/request';
import { config } from '/@/config';
import { useBase } from '/$/base';

const { service, router, mitt } = useCool();
const { t } = useI18n();
const { menu } = useBase();
const permRenderKey = ref(0);

const options = reactive({
	customers: [] as any[],
	inquiryType: [
		{ label: t('项目类'), value: 3, type: 'info' },
		{ label: t('机械保养类'), value: 2, type: 'warning' },
		{ label: t('机械维修类'), value: 1, type: 'success' },
		{ label: t('机械加工类'), value: 0, type: 'danger' },
		{ label: t('备件类'), value: 4, type: 'primary' }
	],
	salesCategory: [
		{ label: t('项目类'), value: 3, type: 'info' },
		{ label: t('机械保养类'), value: 2, type: 'warning' },
		{ label: t('机械维修类'), value: 1, type: 'success' },
		{ label: t('机械加工类'), value: 0, type: 'danger' },
		{ label: t('备件类'), value: 4, type: 'primary' }
	],
	siteEnvironment: [
		{ label: t('本体落地装（正装）'), value: 0 },
		{ label: t('倒装'), value: 1 },
		{ label: t('高台'), value: 2 },
		{ label: t('不入场'), value: 3 }
	],
	debugOwnership: [
		{ label: t('不需要'), value: 0 },
		{ label: t('科海'), value: 1 },
		{ label: t('客户'), value: 2 }
	],
	maintenanceType: [
		{ label: t('基础'), value: 0 },
		{ label: t('高级'), value: 1 }
	],
	quoteBizStatus: [
		{ label: t('未报价'), value: 0 },
		{ label: t('报价中'), value: 1 },
		{ label: t('已报价'), value: 2 },
		{ label: t('已逾期'), value: 3 },
		{ label: t('已失效'), value: 4 }
	],
	dealStatus: [
		{ label: t('未确认'), value: 0 },
		{ label: t('未成单'), value: 1 },
		{ label: t('已成单'), value: 2 }
	],
	requotePending: [
		{ label: t('否'), value: 0 },
		{ label: t('是'), value: 1 }
	],
	hoistingRequirement: [
		{ label: t('无'), value: 0 },
		{ label: t('吊装机'), value: 1 },
		{ label: t('龙门架'), value: 2 },
		{ label: t('现场建筑'), value: 3 },
		{ label: t('其他'), value: 4 }
	],
	projectConstructType: [
		{ label: t('工作站搬迁'), value: 0 },
		{ label: t('工作站改造'), value: 1 },
		{ label: t('工作站恢复功能'), value: 2 },
		{ label: t('工作站翻新'), value: 3 },
		{ label: t('新建工作站'), value: 4 }
	],
	repairType: [
		{ label: t('漏油'), value: '漏油' },
		{ label: t('中心手'), value: '中心手' },
		{ label: t('平衡缸'), value: '平衡缸' },
		{ label: t('轴承'), value: '轴承' }
	],
	spareBigCategory: [
		{ label: t('机器人类'), value: 'robot' },
		{ label: t('非机器人类'), value: 'nonRobot' }
	],
	spareSubCategoryRobot: [
		{ label: t('整机机器人'), value: '整机机器人' },
		{ label: t('本体核心部件'), value: '本体核心部件' },
		{ label: t('示教器及其配件'), value: '示教器及其配件' },
		{ label: t('电气部分'), value: '电气部分' }
	],
	spareSubCategoryNonRobot: [
		{ label: t('五金件'), value: '五金件' },
		{ label: t('风扇（非机器人）'), value: '风扇（非机器人）' },
		{ label: t('密封件'), value: '密封件' },
		{ label: t('线缆（非机器人）'), value: '线缆（非机器人）' },
		{ label: t('传感器安全类'), value: '传感器安全类' },
		{ label: t('焊机类（备件+辅料）'), value: '焊机类（备件+辅料）' },
		{ label: t('西门子备件'), value: '西门子备件' },
		{ label: t('气动液压分类'), value: '气动液压分类' },
		{ label: t('传动机械'), value: '传动机械' },
		{ label: t('硬盘'), value: '硬盘' },
		{ label: t('油脂'), value: '油脂' }
	]
});

const hideInAdd = (_scope: any) => Upsert.value?.mode === 'add';
const hideInEdit = (_scope: any) => Upsert.value?.mode === 'edit';
const hideByDealStatus =
	(status: number[]) =>
		({ scope }: any) =>
			!status.includes(Number(scope?.dealStatus ?? 0));
const mergeHidden = (...rules: Array<(params: any) => boolean>) => (params: any) =>
	rules.some(rule => rule(params));

const Upsert = useUpsert({
	dialog: {
		width: '1000px'
	},
	props: {
		labelWidth: '120px'
	},
	items: [
		() => {
			return () => {
				return {
					label: t('报价单号'),
					prop: 'inquiryNo',
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
			label: t('客户'),
			prop: 'customerId',
			component: {
				name: 'el-select',
				options: options.customers,
				props: {
					clearable: true,
					filterable: true,
					placeholder: t('请选择客户')
				}
			},
			span: 12,
			required: true,
			hook: {
				submit(value: any, { form }: any) {
					const selected = options.customers.find((c: any) => c.value === value);
					form.customer = selected?.label || '';
					return undefined;
				}
			}
		},
		{
			label: t('负责人姓名'),
			prop: 'ownerName',
			component: { name: 'el-input', props: { clearable: true } },
			span: 12
		},
		{
			label: t('协作人ID列表'),
			prop: 'collaboratorUserIds',
			component: { name: 'el-input', props: { clearable: true } },
			span: 12
		},
		{
			label: t('报价截止日期'),
			prop: 'deadlineDate',
			component: {
				name: 'el-date-picker',
				props: { type: 'date', valueFormat: 'YYYY-MM-DD' }
			},
			span: 12
		},
		{
			label: t('附件URL列表'),
			prop: 'attachments',
			component: { name: 'el-input', props: { clearable: true } },
			span: 12
		},
		{
			label: t('备注'),
			prop: 'remark',
			component: { name: 'el-input', props: { clearable: true } },
			span: 12
		},
		{
			label: t('产品明细'),
			prop: 'productItems',
			component: { name: 'el-input', props: { clearable: true } },
			span: 12
		},
		() => {
			return () => ({
				label: t('AI分类'),
				prop: 'aiCategory',
				component: { name: 'el-input', props: { clearable: true } },
				span: 12,
				hidden: Upsert.value?.mode === 'edit'
			});
		},
		() => {
			return () => ({
				label: t('AI分类分析'),
				prop: 'aiCategoryAnalysis',
				component: { name: 'el-input', props: { clearable: true } },
				span: 12,
				hidden: Upsert.value?.mode === 'edit'
			});
		},
		() => {
			return () => ({
				label: t('AI历史报价'),
				prop: 'aiHistoryQuote',
				component: { name: 'el-input', props: { clearable: true } },
				span: 12,
				hidden: Upsert.value?.mode === 'edit'
			});
		},
		() => {
			return () => ({
				label: t('AI历史报价依据'),
				prop: 'aiHistoryQuoteBasis',
				component: { name: 'el-input', props: { clearable: true } },
				span: 12,
				hidden: Upsert.value?.mode === 'edit'
			});
		},
		() => {
			return () => ({
				label: t('报价业务状态'),
				prop: 'quoteBizStatus',
				component: { name: 'el-radio-group', options: options.quoteBizStatus },
				value: 0,
				hidden: Upsert.value?.mode === 'edit'
			});
		},
		() => {
			return () => ({
				label: t('驳回原因'),
				prop: 'rejectReason',
				component: { name: 'el-input', props: { clearable: true } },
				span: 12,
				hidden: Upsert.value?.mode === 'edit'
			});
		},
		() => {
			return () => ({
				label: t('销售报价备注'),
				prop: 'salesQuoteRemark',
				component: { name: 'el-input', props: { clearable: true } },
				span: 12,
				hidden: Upsert.value?.mode === 'edit'
			});
		},
		() => {
			return () => ({
				label: t('销售报价时间'),
				prop: 'salesQuoteTime',
				component: {
					name: 'el-date-picker',
					props: { type: 'datetime', valueFormat: 'YYYY-MM-DD HH:mm:ss' }
				},
				span: 12,
				hidden: Upsert.value?.mode === 'edit'
			});
		},
		() => {
			return () => ({
				label: t('是否成单'),
				prop: 'dealStatus',
				component: { name: 'el-radio-group', options: options.dealStatus },
				value: 0,
				hidden: Upsert.value?.mode === 'edit'
			});
		},
		() => {
			return () => ({
				label: t('丢单原因'),
				prop: 'lostReason',
				component: { name: 'el-input', props: { clearable: true } },
				span: 12,
				hidden: Upsert.value?.mode === 'edit'
			});
		},
		() => {
			return () => ({
				label: t('合同订单号'),
				prop: 'contractOrderNo',
				component: { name: 'el-input', props: { clearable: true } },
				span: 12,
				hidden: Upsert.value?.mode === 'edit'
			});
		},
		{
			label: t('项目名称'),
			prop: 'projectName',
			component: { name: 'el-input', props: { clearable: true } },
			span: 12,
			required: true
		},
		{
			label: t('项目地点（省市县）'),
			prop: 'projectLocation',
			component: { name: 'cl-distpicker' },
			span: 12,
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType == 4
		},
		{
			label: t('具体地址'),
			prop: 'address',
			component: { name: 'el-input', props: { clearable: true } },
			span: 12,
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType == 4
		},
		{
			label: t('项目工期'),
			prop: 'projectDateRange',
			hook: {
				bind: (_: any, { form }: any) => {
					const arr = [form.projectStartDate, form.projectEndDate].filter(Boolean);
					return arr.length ? arr : [];
				},
				submit: (value: any, { form }: any) => {
					const [start, end] = value || [];
					form.projectStartDate = start;
					form.projectEndDate = end;
					return undefined;
				}
			},
			component: {
				name: 'el-date-picker',
				props: {
					type: 'daterange',
					'value-format': 'YYYY-MM-DD',
					startPlaceholder: t('开始日期'),
					endPlaceholder: t('结束日期'),
					clearable: true
				}
			},
			span: 24,
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType == 4
		},
		{
			label: t('报价类型'),
			prop: 'inquiryType',
			value: 3,
			required: true,
			component: {
				name: 'el-select',
				options: options.inquiryType,
				props: {
					clearable: false,
					onChange(val: number) {
						Upsert.value?.setForm('salesCategory', val);
					}
				}
			}
		},
		{
			label: t('加工要求'),
			prop: 'processingRequirement',
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType != 0,
			component: {
				name: 'el-input',
				props: { clearable: true, type: 'textarea', rows: 4 }
			},
			span: 24
		},
		{
			label: t('图纸附件'),
			prop: 'drawingAttachments',
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType != 0,
			component: {
				name: 'cl-upload',
				props: {
					type: 'file',
					multiple: true,
					icon: Document,
					text: t('上传图纸')
				}
			},
			span: 24
		},
		{
			label: t('维修类型（下拉+可自填）'),
			prop: 'repairType',
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType != 1,
			component: {
				name: 'el-select',
				options: options.repairType,
				props: {
					filterable: true,
					allowCreate: true,
					defaultFirstOption: true,
					clearable: true
				}
			},
			span: 24
		},
		{
			label: t('故障描述'),
			prop: 'faultDescription',
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType != 1,
			component: {
				name: 'el-input',
				props: { clearable: true, type: 'textarea', rows: 4 }
			},
			span: 24
		},
		{
			label: t('现场环境'),
			prop: 'siteEnvironmentRepair',
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType != 1,
			component: {
				name: 'el-select',
				options: options.siteEnvironment,
				props: { clearable: true }
			},
			span: 24
		},
		{
			label: t('现场附件（图片/视频）'),
			prop: 'siteAttachments',
			hidden: ({ scope }: any) => scope.inquiryType != 1,
			component: {
				name: 'cl-upload',
				props: {
					type: 'file',
					multiple: true,
					accept: 'image/*,video/*',
					icon: Document,
					text: t('上传现场附件')
				}
			},
			span: 24
		},
		{
			label: t('明确调试归属'),
			prop: 'debugOwnership',
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType != 1,
			component: {
				name: 'el-select',
				options: options.debugOwnership,
				props: { clearable: true }
			},
			span: 24
		},
		{
			label: t('现场环境'),
			prop: 'siteEnvironmentMaintain',
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType != 2,
			component: {
				name: 'el-select',
				options: options.siteEnvironment,
				props: { clearable: true }
			},
			span: 12
		},
		{
			label: t('保养类型'),
			prop: 'maintenanceType',
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType != 2,
			component: {
				name: 'el-select',
				options: options.maintenanceType,
				props: { clearable: true }
			},
			span: 12
		},
		{
			label: t('保养范围'),
			prop: 'maintenanceScope',
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType != 2,
			component: {
				name: 'el-input',
				props: { clearable: true, type: 'textarea', rows: 4 }
			},
			span: 24
		},
		{
			label: t('保养内容'),
			prop: 'maintenanceContent',
			hidden: ({ scope }: any) => scope.inquiryType != 2,
			component: {
				name: 'el-input',
				props: { clearable: true, type: 'textarea', rows: 4 }
			},
			span: 24
		},
		{
			label: t('施工类型'),
			prop: 'projectConstructType',
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType != 3,
			component: {
				name: 'el-select',
				options: options.projectConstructType,
				props: { clearable: true }
			},
			span: 24
		},
		{
			label: t('施工内容'),
			prop: 'projectConstructContent',
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType != 3,
			component: {
				name: 'el-input',
				props: { clearable: true, type: 'textarea', rows: 4 }
			},
			span: 24
		},
		{
			label: t('施工内容附件（客户技术协议）'),
			prop: 'projectConstructAttachments',
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType != 3,
			component: {
				name: 'cl-upload',
				props: {
					type: 'file',
					multiple: true,
					text: t('上传技术协议')
				}
			},
			span: 24
		},
		{
			label: t('现场环境说明'),
			prop: 'projectSiteEnvDesc',
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType != 3,
			component: {
				name: 'el-input',
				props: { clearable: true, type: 'textarea', rows: 4 }
			},
			span: 24
		},
		{
			label: t('现场环境附件（图片/视频）'),
			prop: 'projectSiteEnvAttachments',
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType != 3,
			component: {
				name: 'cl-upload',
				props: {
					type: 'file',
					multiple: true,
					accept: 'image/*,video/*',
					text: t('上传现场环境图片/视频')
				}
			},
			span: 24
		},
		{
			label: t('设备品牌'),
			prop: 'equipmentBrand',
			component: { name: 'el-input', props: { clearable: true } },
			span: 12,
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType == 4
		},
		{
			label: t('设备型号及数量'),
			prop: 'equipmentModelQty',
			component: { name: 'el-input', props: { clearable: true } },
			span: 12,
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType == 4
		},
		{
			label: t('销售类别'),
			prop: 'salesCategory',
			value: 0,
			component: {
				name: 'el-select',
				options: options.salesCategory,
				props: { disabled: true }
			},
			required: false,
			hidden: () => true
		},
		{
			label: t('物料列表'),
			prop: 'spareItems',
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType != 4,
			component: {
				name: 'slot-materialList'
			},
			span: 24
		},
		{
			label: t('交付标准'),
			prop: 'deliverStandard',
			component: {
				name: 'el-input',
				props: { clearable: true, type: 'textarea', rows: 3 }
			},
			span: 12,
			required: true
		},
		{
			label: t('售后要求'),
			prop: 'afterSalesRequirement',
			component: {
				name: 'el-input',
				props: { clearable: true, type: 'textarea', rows: 3 }
			},
			span: 12,
			required: true
		},
		{
			label: t('备件明细'),
			prop: 'sparePartsDetail',
			component: {
				name: 'el-input',
				props: { clearable: true, type: 'textarea', rows: 3 }
			},
			span: 12,
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType == 4
		},
		{
			label: t('工具要求'),
			prop: 'toolRequirement',
			component: {
				name: 'el-input',
				props: { clearable: true, type: 'textarea', rows: 3 }
			},
			span: 12,
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType == 4
		},
		{
			label: t('软件要求'),
			prop: 'softwareRequirement',
			component: {
				name: 'el-input',
				props: { clearable: true, type: 'textarea', rows: 3 }
			},
			span: 12,
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType == 4
		},
		{
			label: t('吊装需求'),
			prop: 'hoistingRequirement',
			component: {
				name: 'el-select',
				options: options.hoistingRequirement,
				props: {
					clearable: true
				}
			},
			span: 12,
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType == 4
		},
		{
			label: t('能力需求'),
			prop: 'capabilityRequirement',
			component: {
				name: 'el-input',
				props: { clearable: true, type: 'textarea', rows: 3 }
			},
			span: 12,
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType == 4
		},
		{
			label: t('技术工种及人数'),
			prop: 'workerTypeAndCount',
			component: {
				name: 'el-input',
				props: { clearable: true, type: 'textarea', rows: 3 }
			},
			span: 12,
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType == 4
		},
		{
			label: t('具体人员（内部人员/委外）'),
			prop: 'specificPersonnel',
			component: {
				name: 'el-input',
				props: { clearable: true, type: 'textarea', rows: 3 }
			},
			span: 12,
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType == 4
		},
		{
			label: t('初步施工方案'),
			prop: 'initialConstructionPlan',
			component: {
				name: 'el-input',
				props: { clearable: true, type: 'textarea', rows: 4 }
			},
			span: 24,
			required: true,
			hidden: ({ scope }: any) => scope.inquiryType == 4
		},
		{
			label: t('创建人ID'),
			prop: 'createUserId',
			component: { name: 'el-input', props: { clearable: true } },
			span: 12,
			hidden: () => true
		},
		{
			label: t('最新报价ID'),
			prop: 'quoteId',
			component: { name: 'el-input', props: { clearable: true } },
			span: 12,
			hidden: () => true
		},
		{
			label: t('待重报标记'),
			prop: 'requotePending',
			component: { name: 'el-radio-group', options: options.requotePending },
			value: 0,
			hidden: () => true
		}
	],

	onOpened(data) {
		if (data?.inquiryType !== undefined) {
			data.salesCategory = data.inquiryType;
		}

		if (data?.inquiryType === 4) {
			if (!Array.isArray(data.spareItems)) {
				data.spareItems = data.spareItems ? [].concat(data.spareItems as any) : [];
			}

			data.spareItems = data.spareItems.map((item: any) => {
				const next: any = { ...(item || {}) };
				if (next.categoryBig == null) {
					next.categoryBig = next.bigCategory ?? next.category ?? 'robot';
				}
				if (next.categorySmall == null) {
					next.categorySmall = next.subCategory ?? '';
				}
				if (next.brand == null) {
					next.brand = next.remark ?? '';
				}
				return next;
			});
		}

		if (data?.inquiryType === 1) {
			if (data.siteEnvironmentRepair === undefined && data.siteEnvironment !== undefined) {
				(data as any).siteEnvironmentRepair = data.siteEnvironment;
			}
		}
		if (data?.inquiryType === 2) {
			if (data.siteEnvironmentMaintain === undefined && data.siteEnvironment !== undefined) {
				(data as any).siteEnvironmentMaintain = data.siteEnvironment;
			}
		}
	},

	onSubmit(data, { next }) {
		data.ownerName = String(data.ownerName || '').trim();
		if (data.inquiryType !== 4) {
			data.spareItems = undefined;
		}

		const fixedInquiryType = Number((data as any).inquiryType);

		let siteEnv = (data as any).siteEnvironment;
		if (fixedInquiryType === 1 && (data as any).siteEnvironmentRepair !== undefined) {
			siteEnv = (data as any).siteEnvironmentRepair;
		}
		if (fixedInquiryType === 2 && (data as any).siteEnvironmentMaintain !== undefined) {
			siteEnv = (data as any).siteEnvironmentMaintain;
		}

		next({
			...data,
			inquiryType: isNaN(fixedInquiryType) ? data.inquiryType : fixedInquiryType,
			salesCategory: isNaN(fixedInquiryType) ? data.inquiryType : fixedInquiryType,
			projectDateRange: undefined,
			...(siteEnv !== undefined ? { siteEnvironment: siteEnv } : {})
		});
	}
});

function ensureSpareItems(form: any) {
	if (!form.spareItems || !Array.isArray(form.spareItems)) {
		form.spareItems = [];
	}
}

function addSpareItem(form: any) {
	if (!form) return;
	ensureSpareItems(form);
	form.spareItems.push({
		name: '',
		categoryBig: 'robot',
		categorySmall: '',
		spec: '',
		quantity: '',
		brand: ''
	});
}

function removeSpareItem(form: any, index: number) {
	if (!form) return;
	ensureSpareItems(form);
	if (index >= 0 && index < form.spareItems.length) {
		form.spareItems.splice(index, 1);
	}
}

const lostDialogVisible = ref(false);
const lostForm = reactive({
	lostReason: '',
	salesQuote: ''
});
let lostTargetRow: any = null;

function openLostDialog(row: any) {
	lostTargetRow = row;
	lostForm.lostReason = '';
	lostForm.salesQuote = '';
	lostDialogVisible.value = true;
}

async function confirmLostDialog() {
	if (!lostForm.lostReason || lostForm.lostReason.trim() === '') {
		ElMessage.error(t('拒单原因不能为空'));
		return;
	}
	const num = Number(lostForm.salesQuote);
	if (!lostForm.salesQuote || lostForm.salesQuote.trim() === '' || !Number.isFinite(num) || num < 0) {
		ElMessage.error(t('请输入有效的销售报价'));
		return;
	}
	try {
		await service.company.inquiry.saveLostDeal({
			inquiryId: lostTargetRow.id,
			lostReason: lostForm.lostReason.trim(),
			salesQuote: num
		});
		ElMessage.success(t('已标记为拒单'));
		lostDialogVisible.value = false;
		refresh();
	} catch (e: any) {
		ElMessage.error(e?.message || t('操作失败'));
	}
}

const Table = useTable({
	columns: [
		{ type: 'selection', width: 60 },
		{ label: t('报价单号'), prop: 'inquiryNo', minWidth: 160 },
		{ label: t('负责人姓名'), prop: 'ownerName', minWidth: 120 },
		{
			label: t('报价类型'),
			prop: 'inquiryType',
			minWidth: 120,
			dict: options.inquiryType
		},
		{ label: t('客户'), prop: 'customer', minWidth: 140 },
		{
			label: t('报价截止日期'),
			prop: 'deadlineDate',
			minWidth: 130,
			component: { name: 'cl-date-text', props: { format: 'YYYY-MM-DD' } }
		},
		{ label: t('项目名称'), prop: 'projectName', minWidth: 180 },
		{
			label: t('项目地点（省市县）'),
			prop: 'projectLocation',
			minWidth: 160,
			formatter(row: any) {
				const v = row.projectLocation;
				if (Array.isArray(v)) return v.filter(Boolean).join('');
				return v || '-';
			}
		},
		{
			label: t('项目工期'),
			prop: 'projectRange',
			minWidth: 200,
			formatter(row: any) {
				const s = row.projectStartDate ? String(row.projectStartDate).slice(0, 10) : '';
				const e = row.projectEndDate ? String(row.projectEndDate).slice(0, 10) : '';
				return s || e ? `${s || '-'} ~ ${e || '-'}` : '-';
			}
		},
		{
			label: t('总成本'),
			prop: 'quoteTotalCost',
			minWidth: 120,
			formatter(row: any) {
				return row.quoteTotalCost != null ? row.quoteTotalCost : '-';
			}
		},
		{
			label: t('未税报价'),
			prop: 'quotePriceExclTax',
			minWidth: 120,
			formatter(row: any) {
				return row.quotePriceExclTax != null ? row.quotePriceExclTax : '-';
			}
		},
		{
			label: t('含税报价'),
			prop: 'quotePriceInclTax',
			minWidth: 120,
			formatter(row: any) {
				return row.quotePriceInclTax != null ? row.quotePriceInclTax : '-';
			}
		},
		{
			label: t('销售报价'),
			prop: 'salesQuote',
			minWidth: 120,
			formatter(row: any) {
				return row.salesQuote != null ? row.salesQuote : '-';
			}
		},
		{
			label: t('报价业务状态'),
			prop: 'quoteBizStatus',
			minWidth: 120,
			dict: options.quoteBizStatus
		},
		{
			label: t('是否成单'),
			prop: 'dealStatus',
			minWidth: 120,
			dict: options.dealStatus
		},
		{ label: t('最新报价ID'), prop: 'quoteId', minWidth: 120 },
		{
			label: t('待重报标记'),
			prop: 'requotePending',
			minWidth: 120,
			dict: options.requotePending
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
			width: 180,
			buttons: ({ scope }: { scope: any }) => {
				const quoteBizStatus = Number(scope.row.quoteBizStatus) || 0;
				const buttons: any[] = ['edit', 'delete'];

				if (quoteBizStatus === 1 && !isQuoteRejected(scope.row) && getQuoteId(scope.row) > 0) {
					buttons.push(
						{
							label: t('接受'),
							type: 'primary',
							size: 'small',
							onClick: () => onAccept(getQuoteId(scope.row))
						},
						{
							label: t('拒绝'),
							type: 'danger',
							size: 'small',
							onClick: () => onReject(getQuoteId(scope.row))
						}
					);
				}

				if (quoteBizStatus === 2) {
					buttons.push(
						{
							label: t('成单'),
							type: 'success',
							size: 'small',
							onClick: () => onDealSuccess(scope.row)
						},
						{
							label: t('拒单'),
							type: 'danger',
							size: 'small',
							onClick: () => openLostDialog(scope.row)
						}
					);
				}

				return buttons;
			}
		}
	]
});

const Crud = useCrud(
	{
		service: service.company.inquiry
	},
	app => {
		app.refresh();
	}
);

function apiUrl(path: string) {
	return `${config.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

async function syncQuoteActionPerms() {
	try {
		await request({
			url: apiUrl('/admin/company/inquiry/syncQuotePerms'),
			method: 'post'
		} as any);
		const res: any = await service.base.comm.permmenu();
		menu.setPerms(res?.perms || []);
		permRenderKey.value += 1;
		refresh();
	} catch (e: any) {
		console.warn('[company] sync quote perms failed', e?.message || e);
	}
}

function getQuoteStatus(row: any) {
	const value = row?.quoteStatus ?? row?.a_quoteStatus;
	const status = Number(value);
	return Number.isFinite(status) ? status : 0;
}

function getQuoteId(row: any) {
	const value = row?.quoteId ?? row?.a_quoteId;
	const id = Number(value);
	return Number.isFinite(id) ? id : 0;
}

function isQuoteRejected(row: any) {
	const value = row?.quoteIsRejected ?? row?.b_isRejected;
	return Number(value) === 1;
}

function refreshAfterQuoteAction() {
	refresh();
	mitt.emit('company.business.refreshProgress');
}

async function onAccept(quoteId: number) {
	const idNum = Number(quoteId);
	if (!Number.isFinite(idNum) || idNum <= 0) {
		ElMessage.error(t('缺少/无效的 quoteId'));
		return;
	}

	try {
		await request({
			url: apiUrl('/admin/company/inquiry/accept'),
			method: 'post',
			data: { quoteId: idNum }
		} as any);

		ElMessage.success(t('报价已接受'));
		refreshAfterQuoteAction();
	} catch (e: any) {
		ElMessage.error(e?.message || t('操作失败'));
	}
}

async function onReject(quoteId: number) {
	const idNum = Number(quoteId);
	if (!Number.isFinite(idNum) || idNum <= 0) {
		ElMessage.error(t('缺少/无效的 quoteId'));
		return;
	}

	try {
		const { value: reason } = await ElMessageBox.prompt(t('请输入拒绝原因'), t('拒绝报价'), {
			confirmButtonText: t('确定'),
			cancelButtonText: t('取消'),
			inputPlaceholder: t('请输入拒绝原因'),
			inputValidator: (value: string) => {
				if (!value || value.trim() === '') {
					return t('拒绝原因不能为空');
				}
				return true;
			}
		});

		await request({
			url: apiUrl('/admin/company/inquiry/reject'),
			method: 'post',
			data: { quoteId: idNum, rejectReason: reason }
		} as any);

		ElMessage.success(t('已拒绝报价'));
		refreshAfterQuoteAction();
	} catch (e) {
		// 取消操作
	}
}

function goContract(row: any) {
	const contractName = row?.quoteNo || row?.inquiryNo || '';
	const customerName = row?.customer || '';
	const amount = row?.quoteTotalCost ?? row?.quotePriceInclTax ?? '';
	const contractDetails = [row?.deliverStandard, row?.afterSalesRequirement]
		.filter(Boolean)
		.join('\n');

	router.push({
		path: '/company/business/contract',
		query: {
			contractName,
			customerName,
			amount: amount === '' ? '' : String(amount),
			contractDetails
		}
	});
}

function refresh(params?: any) {
	Crud.value?.refresh(params);
}

async function onAcceptEdit(scope: any) {
	try {
		await service.company.inquiry.accept({ quoteId: scope.quoteId });
		ElMessage.success(t('报价已接受'));
		refreshAfterQuoteAction();
	} catch (e: any) {
		ElMessage.error(e?.message || t('操作失败'));
	}
}

async function showRejectDialog(scope: any) {
	try {
		const { value: reason } = await ElMessageBox.prompt(
			t('请输入拒绝原因'),
			t('拒绝报价'),
			{
				confirmButtonText: t('确定'),
				cancelButtonText: t('取消'),
				inputPlaceholder: t('请输入拒绝原因'),
				inputValidator: (value: string) => {
					if (!value || value.trim() === '') {
						return t('拒绝原因不能为空');
					}
					return true;
				}
			}
		);

		await service.company.inquiry.reject({ quoteId: scope.quoteId, rejectReason: reason });
		ElMessage.success(t('已拒绝报价'));
		refreshAfterQuoteAction();
	} catch (e) {
		// 取消操作
	}
}

async function onDealSuccess(scope: any) {
	try {
		const { value: salesQuote } = await ElMessageBox.prompt(
			t('请输入销售报价'),
			t('成单'),
			{
				confirmButtonText: t('确定'),
				cancelButtonText: t('取消'),
				inputPlaceholder: t('请输入销售报价'),
				inputValidator: (value: string) => {
					const num = Number(value);
					if (!value || value.trim() === '' || !Number.isFinite(num) || num < 0) {
						return t('请输入有效的销售报价');
					}
					return true;
				}
			}
		);

		await service.company.inquiry.convertToContractOrder({
			inquiryId: scope.id,
			salesQuote: Number(salesQuote)
		});
		ElMessage.success(t('已成单，已转换合同订单'));
		refresh();
	} catch (e: any) {
		if (e !== 'cancel' && e !== 'close') {
			ElMessage.error(e?.message || t('操作失败'));
		}
	}
}

onMounted(() => {
	syncQuoteActionPerms();
	(service as any).company.customer.list().then((res: any) => {
		options.customers.length = 0;
		res.forEach((e: any) => {
			options.customers.push({
				label: e.customerName,
				value: e.customerName
			});
		});
	});
});
</script>

<style lang="scss" scoped>
.quote-summary {
	line-height: 18px;

	&__top {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 6px;
	}

	&__no {
		font-weight: 600;
		margin-bottom: 4px;
	}

	&__actions {
		margin-top: 8px;
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	&__row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;

		.label {
			color: var(--el-text-color-secondary);
		}

		.value {
			color: var(--el-text-color-primary);
		}
	}
}

.quote-actions {
	display: flex;
	gap: 8px;
	margin-top: 8px;
}

.op-buttons-container {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.op-buttons-row {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 8px;
}

.op-buttons-row .el-button {
	width: 100%;
	height: 32px;
	line-height: 30px;
	margin: 0;
}

/* 覆盖框架操作列按钮样式，实现2x2网格布局 */
:deep(.cl-table__op) {
	width: 100%;
	display: grid !important;
	grid-template-columns: repeat(2, 1fr) !important;
	gap: 8px !important;
	flex-wrap: unset !important;
}

:deep(.cl-table__op .el-button) {
	width: 100% !important;
	height: 32px !important;
	line-height: 30px !important;
	margin: 0 !important;
}
</style>
