<template>
	<cl-crud ref="Crud">
		<cl-row>
			<cl-refresh-btn />
			<cl-add-btn />
			<cl-multi-delete-btn />
			<cl-flex1 />
			<cl-search-key :placeholder="$t('搜索详情/关键人/客户/负责人')" :width="260" />
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
</template>

<script lang="ts" setup>
import { useCrud, useTable, useUpsert } from "@cool-vue/crud";
import { useCool } from "/@/cool";
import { useI18n } from "vue-i18n";
import { reactive, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { MagicStick } from "@element-plus/icons-vue";

defineOptions({
	name: "company-follow-up-record",
});

const { service } = useCool();
const { t } = useI18n();

const aiLoading = ref(false);

// 生成 AI 销售指导
async function onAiGuide() {
	const form = Upsert.value?.form;
	if (!form?.customerName || !form?.details) {
		ElMessage.warning(t("请先填写客户名称和联系详情"));
		return;
	}

	aiLoading.value = true;
	try {
		const res = await (service as any).company.dify.analyzeFollowUp({
			customerName: form.customerName,
			details: form.details,
		});
		if (res) {
			Upsert.value?.setForm("aiGuide", res.text || res);
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

// 初始化加载数据
onMounted(async () => {
	// 加载客户列表
	(service as any).company.customer.list().then((res: any) => {
		options.customers = res.map((e: any) => ({
			label: e.customerName,
			value: e.customerName, // 使用名字作为值
			keyContacts: e.keyContacts || [],
		}));
	});

	// 加载系统用户
	(service as any).base.sys.user.list().then((res: any) => {
		options.users = res.map((e: any) => ({
			label: e.name,
			value: e.name, // 使用名字作为值
		}));
	});
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
					clearable: true,
					onChange: (val: any) => {
						const customer = options.customers.find((e) => e.value === val);
						options.keyPersons = (customer?.keyContacts || []).map((e: any) => ({
							label: e.name,
							value: e.name,
						}));
						// 重置关键人
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
				name: "el-switch",
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
	onOpened(data) {
		if (data.customerName) {
			const customer = options.customers.find((e) => e.value === data.customerName);
			options.keyPersons = (customer?.keyContacts || []).map((e: any) => ({
				label: e.name,
				value: e.name,
			}));
		}
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

<style lang="scss" scoped></style>
