<template>
	<div class="follow-up-record-container">
		<!-- 左侧提醒面板 -->
		<div class="reminder-panel" v-if="reminderVisible">
			<div class="reminder-header">
				<span class="reminder-title">{{ t("跟进提醒") }}</span>
				<div class="reminder-actions">
					<el-button text size="small" :loading="reminderLoading" @click="loadReminderRecords">
						<el-icon><Refresh /></el-icon>
					</el-button>
					<el-button text size="small" @click="hideReminderPanel">
						<el-icon><Close /></el-icon>
					</el-button>
				</div>
			</div>
			<div class="reminder-content" v-if="reminderRecords.length > 0">
				<div
					class="reminder-item"
					v-for="record in reminderRecords"
					:key="record.id"
				>
					<div class="reminder-customer">{{ record.customerName }}</div>
					<div class="reminder-info">
						<span>{{ t("关键人") }}: {{ record.keyPerson || '-' }}</span>
					</div>
					<div class="reminder-info">
						<span>{{ t("跟进人") }}: {{ record.ownerUserName || '-' }}</span>
					</div>
					<div class="reminder-info">
						<span>{{ t("下次跟进") }}: {{ formatDate(record.nextFollowTime) }}</span>
					</div>
					<div class="reminder-info reminder-details">
						<span>{{ t("跟进内容") }}: {{ record.details || '-' }}</span>
					</div>
				</div>
			</div>
			<div class="reminder-empty" v-else>
				<span>{{ t("暂无待跟进提醒") }}</span>
			</div>
		</div>

		<!-- 右侧主内容 -->
		<cl-crud ref="Crud" :class="{ 'crud-withReminder': reminderVisible }">
			<cl-row>
				<cl-refresh-btn />
				<cl-add-btn />
				<cl-multi-delete-btn />
				<cl-flex1 />
				<cl-search-key :placeholder="$t('搜索详情/关键人/客户/负责人')" :width="260" />
				<el-button type="primary" text @click="showReminderPanel">
					<el-icon><Bell /></el-icon>
					{{ t("跟进提醒") }}
					<el-badge :value="reminderRecords.length" :hidden="reminderRecords.length === 0" />
				</el-button>
			</cl-row>

			<cl-row>
				<cl-table ref="Table" />
			</cl-row>

			<cl-row>
				<cl-flex1 />
				<cl-pagination />
			</cl-row>

			<cl-upsert ref="Upsert">
				<template #slot-ai-btn>
					<div style="display: flex; justify-content: flex-end; width: 100%">
						<el-button
							type="primary"
							:loading="aiLoading"
							@click="onAiGuide"
							style="margin-bottom: 20px"
						>
							<template #icon>
								<el-icon><MagicStick /></el-icon>
							</template>
							{{ t("生成 AI 销售指导") }}
						</el-button>
					</div>
				</template>
			</cl-upsert>
		</cl-crud>
	</div>
</template>

<script lang="ts" setup>
import { useCrud, useTable, useUpsert } from "@cool-vue/crud";
import { useCool } from "/@/cool";
import { useI18n } from "vue-i18n";
import { reactive, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { MagicStick, Bell, Close, Refresh } from "@element-plus/icons-vue";
import { useDifyApi } from "../api/dify";
import { useFollowUpRecordApi } from "../api/followUpRecord";

defineOptions({
	name: "company-follow-up-record",
});

const { service } = useCool();
const { t } = useI18n();

const aiLoading = ref(false);
const customerLoading = ref(false);
let customerSearchSeq = 0;

// 提醒面板相关
const reminderVisible = ref(false);
const reminderRecords = ref<any[]>([]);
const reminderLoading = ref(false);
const { getReminderRecords } = useFollowUpRecordApi();

// 格式化日期
function formatDate(date: string | Date) {
	if (!date) return '-';
	const d = new Date(date);
	return d.toLocaleString();
}

// 显示提醒面板
function showReminderPanel() {
	reminderVisible.value = true;
}

// 关闭提醒面板
function hideReminderPanel() {
	reminderVisible.value = false;
}

// 刷新提醒记录（手动刷新）
async function loadReminderRecords() {
	reminderLoading.value = true;
	try {
		const res = await getReminderRecords();
		if (res?.data) {
			reminderRecords.value = res.data;
		} else if (Array.isArray(res)) {
			reminderRecords.value = res;
		} else {
			reminderRecords.value = [];
		}
		console.log('提醒记录已刷新，当前时间:', new Date().toLocaleString(), '条数:', reminderRecords.value.length);
	} catch (error) {
		console.error('加载提醒记录失败', error);
		reminderRecords.value = [];
	} finally {
		reminderLoading.value = false;
	}
}

// 生成 AI 销售指导
async function onAiGuide() {
	const form = Upsert.value?.form;
	if (!form?.customerName) {
		ElMessage.warning(t("请先填写客户名称"));
		return;
	}

	aiLoading.value = true;
	try {
		// 1. 先调用 getCustomerOrderData 获取该客户的所有数据
		const orderData = await service.request({
			url: "admin/company/followUpRecord/getCustomerOrderData",
			method: "POST",
			data: { customerName: form.customerName },
		});

		const data = orderData?.data || orderData;
		if (!data) {
			ElMessage.error(t("获取客户订单数据失败"));
			return;
		}

		// 2. 将表单数据（除 aiGuide 外）打包成字符串传入 Dify
		const docking_record = [
			`客户名称：${form.customerName || "无"}`,
			`关键人：${form.keyPerson || "无"}`,
			`跟进人：${form.ownerUserName || "无"}`,
			`跟进类型：${form.method || "无"}`,
			`跟进状态：${form.status || "无"}`,
			`跟进结果：${form.result || "无"}`,
			`跟进时间：${form.followUpTime || "无"}`,
			`下次跟进时间：${form.nextFollowTime || "无"}`,
			`日程提醒：${form.isReminder || "无"}`,
			`核算维度：${form.accountingDimension || "无"}`,
			`协作人：${form.collaborators || "无"}`,
			`跟进人所在部门：${form.followUpPersonDept || "无"}`,
			`联系详情：${form.details || "无"}`,
		].join("\n");

		const Order_Records =
			data.closedContracts?.length
				? data.closedContracts
						.map((c: any) => `[成单记录] ${c.contractName || ""} - ${c.contractAmount || ""}元`)
						.join("\n")
				: "无";
		const Unclosed_Order_Records =
			data.unclosedContracts?.length
				? data.unclosedContracts
						.map((c: any) => `[未成单记录] ${c.contractName || ""} - ${c.contractAmount || ""}元 (${c.contractStatus || ""})`)
						.join("\n")
				: "无";

		// 3. 调用 Dify 接口获取 AI 分析结果
		const { analyzeCustomerOrder } = useDifyApi();
		const difyRes = await analyzeCustomerOrder({
			name: form.customerName,
			docking_record,
			Order_Records,
			Unclosed_Order_Records,
		});

		if (difyRes) {
			const text = difyRes?.data?.text || difyRes?.text || difyRes;
			Upsert.value?.setForm("aiGuide", text);
			ElMessage.success(t("生成成功"));
		}
	} catch (error: any) {
		ElMessage.error(error.message || t("生成失败"));
	} finally {
		aiLoading.value = false;
	}
}

// 选项数据
const options = reactive({
	customers: [] as any[],
	keyPersons: [] as any[],
	users: [] as any[],
	methods: [
		{ label: t("电话"), value: "phone" },
		{ label: t("网络"), value: "online" },
		{ label: t("上门"), value: "visit" },
	],
	statuses: [
		{ label: t("已跟进"), value: "followed" },
		{ label: t("无法联系"), value: "unreachable" },
	],
	results: [
		{ label: t("促单"), value: "promote" },
		{ label: t("有需求跟进"), value: "requirement" },
		{ label: t("无意向"), value: "no_interest" },
		{ label: t("放弃"), value: "give_up" },
	],
});

function mapCustomerOption(customer: any) {
	return {
		label: customer.customerName,
		value: customer.customerName,
		keyContacts: customer.keyContacts || [],
	};
}

function setCustomerOptions(list: any[]) {
	options.customers.splice(0, options.customers.length, ...list);
	Upsert.value?.setOptions("customerName", list);
}

function setKeyPersonOptions(list: any[]) {
	options.keyPersons.splice(0, options.keyPersons.length, ...list);
	Upsert.value?.setOptions("keyPerson", list);
}

function updateKeyPersonsByCustomerName(customerName?: string) {
	const customer = options.customers.find((e) => e.value === customerName);
	const keyPersonList = (customer?.keyContacts || []).map((e: any) => ({
		label: e.name,
		value: e.name,
	}));
	setKeyPersonOptions(keyPersonList);
}

async function searchCustomers(keyword = "") {
	const currentSeq = ++customerSearchSeq;
	const normalizedKeyword = keyword.trim();

	if (!normalizedKeyword) {
		setCustomerOptions([]);
		customerLoading.value = false;
		return;
	}

	customerLoading.value = true;

	try {
		const res = await service.request({
			url: "admin/company/customer/page",
			method: "POST",
			data: {
				page: 1,
				size: 20,
				keyWord: normalizedKeyword,
			},
		});

		if (currentSeq !== customerSearchSeq) return;

		const customerList = (res.list || [])
			.filter((e: any) => e.customerName)
			.map((e: any) => mapCustomerOption(e));
		setCustomerOptions(customerList);
	} catch (error) {
		if (currentSeq === customerSearchSeq) {
			setCustomerOptions([]);
		}
		console.error("加载客户候选项失败", error);
	} finally {
		if (currentSeq === customerSearchSeq) {
			customerLoading.value = false;
		}
	}
}

async function ensureCustomerOption(customerName?: string) {
	if (!customerName) {
		setCustomerOptions([]);
		setKeyPersonOptions([]);
		return;
	}

	const existed = options.customers.find((e) => e.value === customerName);
	if (!existed) {
		await searchCustomers(customerName);
	}

	updateKeyPersonsByCustomerName(customerName);
}

// 初始化加载数据
onMounted(async () => {
	// 加载系统用户
	(service as any).base.sys.user.list().then((res: any) => {
		options.users = res.map((e: any) => ({
			label: e.name,
			value: e.name, // 使用名字作为值
		}));
	});

	// 加载提醒记录
	await loadReminderRecords();
});

const Upsert = useUpsert<any>({
	dialog: {
		width: "800px",
	},
	items: [
		{
			label: t("客户名称"),
			prop: "customerName",
			span: 12,
			required: true,
			component: {
				name: "el-select",
				props: {
					filterable: true,
					remote: true,
					clearable: true,
					reserveKeyword: true,
					loading: customerLoading,
					placeholder: t("请输入客户名称关键字"),
					remoteMethod: (query: string) => {
						searchCustomers(query);
					},
					onChange: (val: any) => {
						updateKeyPersonsByCustomerName(val);
						Upsert.value?.setForm("keyPerson", "");
					},
				},
				options: options.customers,
			},
		},
		{
			label: t("关键人"),
			prop: "keyPerson",
			span: 12,
			required: true,
			component: {
				name: "el-select",
				props: {
					filterable: true,
					clearable: true,
					placeholder: t("请先选择客户"),
				},
				options: options.keyPersons,
			},
		},
		{
			label: t("跟进人"),
			prop: "ownerUserName",
			span: 12,
			required: true,
			component: {
				name: "el-select",
				props: {
					filterable: true,
					clearable: true,
					placeholder: t("默认当前填报人"),
				},
				options: options.users,
			},
		},
		{
			label: t("跟进类型"),
			prop: "method",
			span: 12,
			required: true,
			component: {
				name: "el-select",
				options: options.methods,
			},
		},
		{
			label: t("跟进状态"),
			prop: "status",
			span: 12,
			required: true,
			component: {
				name: "el-select",
				props: {
					onChange: (val: any) => {
						// PRD: 无法联系默认放弃
						if (val === "unreachable") {
							Upsert.value?.setForm("result", "give_up");
						}
					},
				},
				options: options.statuses,
			},
		},
		{
			label: t("跟进结果"),
			prop: "result",
			span: 12,
			required: true,
			component: {
				name: "el-select",
				options: options.results,
			},
		},
		{
			label: t("跟进时间"),
			prop: "followUpTime",
			span: 12,
			required: true,
			component: {
				name: "el-date-picker",
				props: {
					type: "datetime",
					"value-format": "YYYY-MM-DD HH:mm:ss",
				},
			},
		},
		{
			label: t("下次跟进时间"),
			prop: "nextFollowTime",
			span: 12,
			component: {
				name: "el-date-picker",
				props: {
					type: "datetime",
					"value-format": "YYYY-MM-DD HH:mm:ss",
				},
			},
		},
		{
			label: t("日程提醒"),
			prop: "isReminder",
			span: 12,
			component: {
				name: "el-input",
				props: {
					clearable: true,
					placeholder: t("例如：提前5分钟 / 提前2天"),
				},
			},
		},
		{
			label: t("核算维度"),
			prop: "accountingDimension",
			span: 12,
			component: {
				name: "el-input",
			},
		},
		{
			label: t("协作人"),
			prop: "collaborators",
			span: 12,
			component: {
				name: "el-input",
			},
		},
		{
			label: t("跟进人所在部门"),
			prop: "followUpPersonDept",
			span: 12,
			component: {
				name: "el-input",
				props: {
					disabled: true,
					placeholder: t("自动填充"),
				},
			},
		},
		{
			label: t("创建人"),
			prop: "creator",
			span: 12,
			component: {
				name: "el-input",
				props: {
					placeholder: t("默认当前填报者"),
				},
			},
		},
		{
			label: t("最后修改人"),
			prop: "modifier",
			span: 12,
			component: {
				name: "el-input",
				props: {
					placeholder: t("默认当前填报者"),
				},
			},
		},
		{
			label: t("联系详情"),
			prop: "details",
			span: 24,
			required: true,
			component: {
				name: "el-input",
				props: {
					type: "textarea",
					rows: 4,
					placeholder: t("具体情况说明"),
				},
			},
		},
		{
			label: t("AI销售指导"),
			prop: "aiGuide",
			span: 24,
			required: true,
			component: {
				name: "el-input",
				props: {
					type: "textarea",
					rows: 4,
					placeholder: t("点击下方按钮生成 AI 销售方案"),
				},
			},
		},
		{
			label: "",
			prop: "aiBtn",
			span: 24,
			component: {
				name: "slot-ai-btn",
			},
		},
	],
	async onOpened(data) {
		await ensureCustomerOption(data.customerName);
	},
});

const Table = useTable<any>({
	columns: [
		{ type: "selection", width: 60 },
		{
			label: t("关联对象"),
			prop: "customerName",
			minWidth: 150,
		},
		{ label: t("关键人"), prop: "keyPerson", minWidth: 120 },
		{
			label: t("跟进内容"),
			prop: "details",
			minWidth: 250,
			showOverflowTooltip: true,
		},
		{
			label: t("跟进时间"),
			prop: "followUpTime",
			width: 170,
			component: { name: "cl-date-text" },
		},
		{
			label: t("下次跟进时间"),
			prop: "nextFollowTime",
			width: 170,
			component: { name: "cl-date-text" },
		},
		{
			label: t("跟进类型"),
			prop: "method",
			width: 120,
			dict: options.methods,
		},
		{
			label: t("跟进状态"),
			prop: "status",
			width: 120,
			dict: options.statuses,
		},
		{
			label: t("跟进结果"),
			prop: "result",
			width: 150,
			dict: options.results,
		},
		{
			label: t("跟进人"),
			prop: "ownerUserName",
			width: 120,
		},
		{
			label: t("跟进人所在部门"),
			prop: "followUpPersonDept",
			width: 150,
		},
		{
			label: t("创建人"),
			prop: "creator",
			width: 120,
		},
		{
			label: t("创建时间"),
			prop: "createTime",
			width: 170,
			sortable: "desc",
			component: { name: "cl-date-text" },
		},
		{
			label: t("最后修改人"),
			prop: "modifier",
			width: 120,
		},
		{
			label: t("最后修改时间"),
			prop: "updateTime",
			width: 170,
			component: { name: "cl-date-text" },
		},
		{
			label: t("核算维度"),
			prop: "accountingDimension",
			width: 150,
		},
		{
			label: t("协作人"),
			prop: "collaborators",
			width: 150,
		},
		{ type: "op", buttons: ["edit", "delete"] },
	],
});

const Crud = useCrud(
	{
		service: (service as any).company.followUpRecord,
	},
	(app) => {
		app.refresh();
	}
);
</script>

<style lang="scss" scoped>
.follow-up-record-container {
	display: flex;
	width: 100%;
	height: 100%;
	position: relative;
}

.reminder-panel {
	width: 300px;
	background: #fff;
	border-right: 1px solid #e8e8e8;
	padding: 16px;
	overflow-y: auto;
	flex-shrink: 0;

	.reminder-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
		padding-bottom: 12px;
		border-bottom: 1px solid #e8e8e8;

		.reminder-title {
			font-size: 16px;
			font-weight: 600;
			color: #303133;
		}
	}

	.reminder-content {
		.reminder-item {
			padding: 12px;
			background: #f5f7fa;
			border-radius: 4px;
			margin-bottom: 12px;
			border-left: 3px solid #409eff;

			.reminder-customer {
				font-size: 14px;
				font-weight: 600;
				color: #303133;
				margin-bottom: 8px;
			}

			.reminder-info {
				font-size: 12px;
				color: #606266;
				margin-bottom: 4px;
				line-height: 1.5;

				&.reminder-details {
					margin-top: 8px;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}
			}
		}
	}

	.reminder-empty {
		text-align: center;
		color: #909399;
		font-size: 14px;
		padding: 40px 0;
	}
}

:deep(.crud-withReminder) {
	flex: 1;
	margin-left: 0;
}
</style>
