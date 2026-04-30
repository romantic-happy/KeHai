<template>
	<sales_agent />
	<cl-crud ref="Crud">
		<cl-row>
			<cl-refresh-btn />
			<cl-add-btn />
			<cl-multi-delete-btn />
			<cl-flex1 />
			<cl-search-key :placeholder="$t('搜索客户编码/客户名称')" :width="260" />
		</cl-row>

		<cl-row>
			<cl-table ref="Table" />
		</cl-row>

		<cl-row>
			<cl-flex1 />
			<cl-pagination />
		</cl-row>

		<cl-upsert ref="Upsert" />
	</cl-crud>
</template>

<script lang="ts" setup>
defineOptions({
	name: "company-customer",
});

import { useCrud, useTable, useUpsert } from "@cool-vue/crud";
import { useCool } from "/@/cool";
import { useI18n } from "vue-i18n";
import { reactive, onMounted, h, resolveComponent } from "vue";
import { useDifyApi } from "../../api/dify";
import { ElLoading, ElMessage } from "element-plus";
import { Search, User } from "@element-plus/icons-vue";

const { service } = useCool();
const { t } = useI18n();
const difyApi = useDifyApi();

const options = reactive({
	level: [
		{ label: t("基本关系"), value: t("基本关系") },
		{ label: t("核心客户"), value: t("核心客户") },
		{ label: t("一般客户"), value: t("一般客户") },
		{ label: t("潜在客户"), value: t("潜在客户") },
	],
	manageStatus: [
		{ label: t("潜在"), value: t("潜在") },
		{ label: t("意向"), value: t("意向") },
		{ label: t("成交"), value: t("成交") },
		{ label: t("复购"), value: t("复购") },
		{ label: t("流失预警"), value: t("流失预警") },
		{ label: t("无意向"), value: t("无意向") },
	],
	backgroundSource: [
		{ label: t("公司资源"), value: t("公司资源") },
		{ label: t("自由开拓"), value: t("自由开拓") },
		{ label: t("客户介绍"), value: t("客户介绍") },
		{ label: t("电话咨询"), value: t("电话咨询") },
	],
});

async function onAiAnalyze() {
	const form = Upsert.value?.form;
	if (!form?.customerName) {
		ElMessage.warning(t("请先填写客户名称"));
		return;
	}

	const loading = ElLoading.service({
		target: ".cl-upsert",
		text: t("AI 正在背调中..."),
	});

	try {
		const res = await difyApi.getCustomerInfo({ name: form.customerName });

		if (res?.structured_output) {
			// 处理 structured_output 中的字段
			const data = { ...res.structured_output };

			// 特殊处理 backgroundIsListed：去除空格并确保是 "是" 或 "否"
			if (data.backgroundIsListed) {
				const val = String(data.backgroundIsListed).trim();
				if (val.includes("是")) {
					data.backgroundIsListed = t("是");
				} else if (val.includes("否")) {
					data.backgroundIsListed = t("否");
				}
			}

			// 处理其他可能带空格的文本字段
			const textFields = [
				"backgroundCompanyProfile",
				"businessScope",
				"backgroundEnterpriseType",
			];
			textFields.forEach((field) => {
				if (data[field] && typeof data[field] === "string") {
					data[field] = data[field].trim();
				}
			});

			Object.assign(form, data);
			ElMessage.success(t("AI 背调数据已回填"));
		} else if (res) {
			Object.assign(form, res);
			ElMessage.success(t("AI 背调数据已回填"));
		}
	} catch (e) {
		console.error("AI 背调失败:", e);
		ElMessage.error(t("AI 背调失败"));
	} finally {
		loading.close();
	}
}

async function onAiPortrait() {
	const form = Upsert.value?.form;
	if (!form?.customerName) {
		ElMessage.warning(t("请先填写客户名称"));
		return;
	}

	const loading = ElLoading.service({
		target: ".cl-upsert",
		text: t("AI 正在生成画像..."),
	});

	try {
		const res = await difyApi.analyzePortrait({ name: form.customerName });
		if (res) {
			form.backgroundPortrait = res.backgroundPortrait || res.text || res;
			ElMessage.success(t("AI 客户画像已生成"));
		}
	} catch (e) {
		ElMessage.error(t("AI 画像生成失败"));
	} finally {
		loading.close();
	}
}

onMounted(async () => {
});

const Upsert = useUpsert<any>({
	dialog: {
		width: "1000px",
	},
	props: {
		labelWidth: "130px",
	},
	items: [
		// ===================== 分组一：新建客户填写 =====================
		{
			prop: "_divider_group1",
			span: 24,
			labelWidth: "0px",
			component: {
				name: "el-divider",
				props: { contentPosition: "center", class: "customer-section-divider" },
				slots: { default: () => t("新建客户填写") }
			},
		},
		{
			label: t("客户名称"),
			prop: "customerName",
			span: 12,
			required: true,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: t("来源"),
			prop: "backgroundSource",
			required: true,
			span: 12,
			component: {
				name: "el-select",
				options: options.backgroundSource,
				props: { clearable: true },
			},
		},
		{
			label: t("线索"),
			prop: "clue",
			span: 12,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: t("行业大分类"),
			prop: "industryCategoryMajor",
			span: 12,
			required: true,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: t("行业小分类"),
			prop: "industryCategoryMinor",
			span: 12,
			required: true,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: t("负责人"),
			prop: "backgroundOwner",
			span: 12,
			required: true,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: t("协作人列表"),
			prop: "backgroundCollaboratorUserIds",
			span: 12,
			component: { name: "el-input", props: { clearable: true, placeholder: t("多个用逗号隔开") } },
		},
		{
			label: t("备注"),
			prop: "backgroundRemark",
			span: 24,
			required: true,
			component: {
				name: "el-input",
				props: { type: "textarea", rows: 3, clearable: true },
			},
		},

		// ===================== 分组二：AI客户背调 =====================
		{
			prop: "_divider_group2",
			span: 24,
			labelWidth: "0px",
			component: {
				name: "el-divider",
				props: { contentPosition: "center", class: "customer-section-divider" },
				slots: { default: () => t("AI客户背调") }
			},
		},
		{
			label: "",
			span: 24,
			component: () => {
				return h("div", { style: { textAlign: "center", marginBottom: "5px" } }, [
					h(
						resolveComponent("el-button"),
						{
							type: "primary",
							icon: Search,
							round: true,
							onClick: onAiAnalyze,
						},
						{ default: () => t("一键 AI 背调") }
					),
				]);
			},
		},
		{
			label: t("公司背景"),
			prop: "backgroundCompanyProfile",
			span: 24,
			component: {
				name: "el-input",
				props: { type: "textarea", rows: 3, clearable: true },
			},
		},
		{
			label: t("经营范围"),
			prop: "businessScope",
			span: 24,
			component: {
				name: "el-input",
				props: { type: "textarea", rows: 3, clearable: true },
			},
		},
		{
			label: t("成立时间"),
			prop: "backgroundEstablishDate",
			span: 12,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: t("注册资金"),
			prop: "backgroundRegisteredCapital",
			span: 12,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: t("企业性质"),
			prop: "backgroundEnterpriseType",
			span: 12,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: t("是否上市"),
			prop: "backgroundIsListed",
			span: 12,
			component: {
				name: "el-radio-group",
				options: [
					{ label: t("是"), value: t("是") },
					{ label: t("否"), value: t("否") },
				],
				props: {
					type: "button",
				},
			},
		},
		{
			label: t("地址"),
			prop: "address",
			span: 12,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: t("当年营业额"),
			prop: "backgroundTurnoverCurrent",
			span: 8,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: t("上一年营业额"),
			prop: "backgroundTurnoverLast",
			span: 8,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: t("上上年营业额"),
			prop: "backgroundTurnoverPrev",
			span: 8,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: t("年产值"),
			prop: "annualOutputValue",
			span: 12,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: t("预算"),
			prop: "budget",
			span: 12,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: t("上级客户"),
			prop: "backgroundSuperiorCustomer",
			span: 12,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: t("下游客户"),
			prop: "backgroundDownstreamCustomer",
			span: 12,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: t("机器人工艺"),
			prop: "backgroundRobot",
			span: 24,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: t("公司网址"),
			prop: "backgroundWebsite",
			span: 12,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: t("电话"),
			prop: "backgroundPhone",
			span: 12,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: t("电子邮件"),
			prop: "backgroundEmail",
			span: 12,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: t("国家"),
			prop: "backgroundCountry",
			span: 12,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: t("省"),
			prop: "backgroundProvince",
			span: 8,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: t("市"),
			prop: "backgroundCity",
			span: 8,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: t("区"),
			prop: "backgroundDistrict",
			span: 8,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: t("竞争对手"),
			prop: "competitors",
			span: 24,
			component: {
				name: "el-input",
				props: { type: "textarea", rows: 3, clearable: true },
			},
		},

		// ===================== 分组三：客户管理 =====================
		{
			prop: "_divider_group3",
			span: 24,
			labelWidth: "0px",
			component: {
				name: "el-divider",
				props: { contentPosition: "center", class: "customer-section-divider" },
				slots: { default: () => t("客户管理") }
			},
		},
		{
			label: "",
			span: 24,
			component: () => {
				return h("div", { style: { textAlign: "center", marginBottom: "5px" } }, [
					h(
						resolveComponent("el-button"),
						{
							type: "success",
							icon: User,
							round: true,
							onClick: onAiPortrait,
						},
						{ default: () => t("生成 AI 画像") }
					),
				]);
			},
		},
		{
			label: t("客户编号"),
			prop: "customerNo",
			span: 12,
			component: { name: "el-input", props: { disabled: true, placeholder: t("系统自动生成") } },
		},
		{
			label: t("客户关系"),
			prop: "level",
			span: 12,
			required: true,
			value: t("基本关系"),
			component: {
				name: "el-select",
				options: options.level,
				props: { clearable: true },
			},
		},
		{
			label: t("合作阶段"),
			prop: "manageStatus",
			span: 12,
			required: true,
			value: t("潜在"),
			component: {
				name: "el-select",
				options: options.manageStatus,
				props: { clearable: true },
			},
		},
		{
			label: t("关键人"),
			prop: "keyContacts",
			span: 24,
			required: true,
			component: {
				name: "el-input",
				props: {
					type: "textarea",
					rows: 2,
					placeholder: t("请填写关键人及其联系方式、职位等信息"),
					clearable: true
				},
			},
		},
		{
			label: t("AI 客户画像"),
			prop: "backgroundPortrait",
			span: 24,
			required: true,
			component: {
				name: "el-input",
				props: { type: "textarea", rows: 4, clearable: true },
			},
		},
	],
});

const Table = useTable<any>({
	columns: [
		{ type: "selection", width: 60 },
		{ label: t("客户编号"), prop: "customerNo", minWidth: 120, sortable: "custom" },
		{ label: t("客户名称"), prop: "customerName", minWidth: 200 },
		{ label: t("来源"), prop: "backgroundSource", minWidth: 120, dict: options.backgroundSource },
		{ label: t("线索"), prop: "clue", minWidth: 120 },
		{ label: t("行业大分类"), prop: "industryCategoryMajor", minWidth: 120 },
		{ label: t("行业小分类"), prop: "industryCategoryMinor", minWidth: 120 },
		{ label: t("负责人"), prop: "backgroundOwner", minWidth: 120 },
		{
			label: t("协作人列表"),
			prop: "backgroundCollaboratorUserIds",
			minWidth: 150,
			formatter(row: any) {
				return Array.isArray(row.backgroundCollaboratorUserIds)
					? row.backgroundCollaboratorUserIds.join(",")
					: row.backgroundCollaboratorUserIds || "";
			},
		},
		{ label: t("客户关系"), prop: "level", minWidth: 120, dict: options.level },
		{ label: t("合作阶段"), prop: "manageStatus", minWidth: 120, dict: options.manageStatus },
		{ label: t("备注"), prop: "backgroundRemark", minWidth: 200, showOverflowTooltip: true },
		{ label: t("公司背景"), prop: "backgroundCompanyProfile", minWidth: 200, showOverflowTooltip: true },
		{ label: t("经营范围"), prop: "businessScope", minWidth: 200, showOverflowTooltip: true },
		{ label: t("成立时间"), prop: "backgroundEstablishDate", minWidth: 120 },
		{ label: t("注册资金"), prop: "backgroundRegisteredCapital", minWidth: 120 },
		{ label: t("企业性质"), prop: "backgroundEnterpriseType", minWidth: 120 },
		{ label: t("是否上市"), prop: "backgroundIsListed", minWidth: 100 },
		{ label: t("地址"), prop: "address", minWidth: 200, showOverflowTooltip: true },
		{ label: t("当年营业额"), prop: "backgroundTurnoverCurrent", minWidth: 120 },
		{ label: t("上一年营业额"), prop: "backgroundTurnoverLast", minWidth: 120 },
		{ label: t("上上年营业额"), prop: "backgroundTurnoverPrev", minWidth: 120 },
		{ label: t("年产值"), prop: "annualOutputValue", minWidth: 120 },
		{ label: t("预算"), prop: "budget", minWidth: 120 },
		{ label: t("上级客户"), prop: "backgroundSuperiorCustomer", minWidth: 150 },
		{ label: t("下游客户"), prop: "backgroundDownstreamCustomer", minWidth: 150 },
		{ label: t("机器人工艺"), prop: "backgroundRobot", minWidth: 200, showOverflowTooltip: true },
		{ label: t("公司网址"), prop: "backgroundWebsite", minWidth: 150 },
		{ label: t("电话"), prop: "backgroundPhone", minWidth: 120 },
		{ label: t("电子邮件"), prop: "backgroundEmail", minWidth: 150 },
		{ label: t("国家"), prop: "backgroundCountry", minWidth: 100 },
		{ label: t("省"), prop: "backgroundProvince", minWidth: 100 },
		{ label: t("市"), prop: "backgroundCity", minWidth: 100 },
		{ label: t("区"), prop: "backgroundDistrict", minWidth: 100 },
		{ label: t("详细地址(扩展)"), prop: "backgroundAddressDetail", minWidth: 200, showOverflowTooltip: true },
		{ label: t("竞争对手"), prop: "competitors", minWidth: 200, showOverflowTooltip: true },
		{
			label: t("关键人"),
			prop: "keyContacts",
			minWidth: 200,
			showOverflowTooltip: true,
			formatter(row: any) {
				if (!row.keyContacts) return "";
				if (typeof row.keyContacts === "string") return row.keyContacts;
				if (Array.isArray(row.keyContacts)) {
					return row.keyContacts
						.map((e: any) => (typeof e === "object" ? JSON.stringify(e) : e))
						.join(" | ");
				}
				return JSON.stringify(row.keyContacts);
			},
		},
		{ label: t("AI 客户画像"), prop: "backgroundPortrait", minWidth: 200, showOverflowTooltip: true },
		{
			label: t("创建时间"),
			prop: "createTime",
			minWidth: 170,
			sortable: "custom",
			component: { name: "cl-date-text" },
		},
		{
			label: t("更新时间"),
			prop: "updateTime",
			minWidth: 170,
			sortable: "custom",
			component: { name: "cl-date-text" },
		},
		{ type: "op", buttons: ["edit", "delete"], width: 160 },
	],
});

const Crud = useCrud(
	{
		service: (service as any).company?.customer,
	},
	(app) => {
		app.refresh({ sort: "customerNo", order: "asc" });
	},
);
</script>

<style lang="scss" scoped>
::v-deep(.customer-section-divider) {
	margin: 15px 0 5px;
	padding: 0;
	background-color: transparent;
	border: none;
}

::v-deep(.customer-section-divider .el-divider__text) {
	font-weight: bold;
	font-size: 18px;
	color: var(--el-text-color-primary);
	padding: 0 20px;
}

::v-deep(.cl-upsert__body .el-form-item) {
	margin-bottom: 12px;
}
</style>
