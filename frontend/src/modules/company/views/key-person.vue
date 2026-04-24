<template>
	<cl-crud ref="Crud">
		<cl-row class="toolbar-row">
			<cl-refresh-btn />
			<cl-add-btn />
			<cl-multi-delete-btn />
			<cl-flex1 />

			<div class="toolbar-row__right">
				<el-select
					v-model="searchForm.customerName"
					clearable
					filterable
					class="toolbar-row__select"
					placeholder="客户名称"
					@change="onSearchChange"
				>
					<el-option
						v-for="item in customerOptions"
						:key="item"
						:label="item"
						:value="item"
					/>
				</el-select>

				<el-select
					v-model="searchForm.roleType"
					clearable
					class="toolbar-row__select toolbar-row__select--sm"
					placeholder="角色类型"
					@change="onSearchChange"
				>
					<el-option
						v-for="item in roleTypeOptions"
						:key="item.value"
						:label="item.label"
						:value="item.value"
					/>
				</el-select>

				<el-select
					v-model="searchForm.relationStatus"
					clearable
					class="toolbar-row__select toolbar-row__select--sm"
					placeholder="关系状态"
					@change="onSearchChange"
				>
					<el-option
						v-for="item in relationStatusOptions"
						:key="item.value"
						:label="item.label"
						:value="item.value"
					/>
				</el-select>

				<cl-search-key placeholder="搜索关键人编号/姓名/手机号/微信/客户名称" :width="240" />
			</div>
		</cl-row>

		<cl-row>
			<cl-table ref="Table">
				<template #column-aiGuide="{ scope }">
					<div class="guide-text">{{ scope.row.aiGuide || "-" }}</div>
				</template>
			</cl-table>
		</cl-row>

		<cl-row>
			<cl-flex1 />
			<cl-pagination />
		</cl-row>

		<cl-upsert ref="Upsert" />
	</cl-crud>

	<el-dialog
		v-model="analysisDialog.visible"
		:title="analysisDialog.title"
		width="760px"
		@closed="closeAiGuide"
	>
		<div v-loading="analysisDialog.loading" class="analysis-dialog">
			<el-descriptions border :column="2" class="analysis-dialog__summary">
				<el-descriptions-item label="客户名称">
					{{ analysisDialog.row?.customerName || "-" }}
				</el-descriptions-item>
				<el-descriptions-item label="关键人">
					{{ analysisDialog.row?.name || "-" }}
				</el-descriptions-item>
				<el-descriptions-item label="职位">
					{{ analysisDialog.row?.position || "-" }}
				</el-descriptions-item>
				<el-descriptions-item label="角色类型">
					{{ analysisDialog.roleTypeLabel || "-" }}
				</el-descriptions-item>
			</el-descriptions>

			<el-descriptions border :column="1" class="analysis-dialog__result">
				<el-descriptions-item label="性格分析">
					<div class="analysis-dialog__text">
						{{ analysisDialog.personalityAnalysis || "-" }}
					</div>
				</el-descriptions-item>
				<el-descriptions-item label="销售建议">
					<div class="analysis-dialog__text">
						{{ analysisDialog.salesSuggestion || "-" }}
					</div>
				</el-descriptions-item>
				<el-descriptions-item label="话术建议">
					<div class="analysis-dialog__text">
						{{ analysisDialog.talkingPoints || "-" }}
					</div>
				</el-descriptions-item>
				<el-descriptions-item label="生日提醒">
					<div class="analysis-dialog__text">
						{{ analysisDialog.birthdayReminder || "-" }}
					</div>
				</el-descriptions-item>
			</el-descriptions>
		</div>
	</el-dialog>
</template>

<script lang="ts" setup>
defineOptions({
	name: "company-key-person",
});

import { useCrud, useTable, useUpsert } from "@cool-vue/crud";
import { reactive } from "vue";

type KeyPersonItem = {
	id: number;
	keyPersonNo: string;
	customerName: string;
	name: string;
	position: string;
	roleType: string;
	phone: string;
	wechat: string;
	email: string;
	influenceLevel: string;
	relationStatus: string;
	lastContactDate: string;
	nextFollowDate: string;
	lastContactContent: string;
	ownerUserName: string;
	remark: string;
	aiGuide: string;
	createTime: string;
	updateTime: string;
};

const roleTypeOptions = [
	{ label: "决策人", value: "decision" },
	{ label: "使用人", value: "user" },
	{ label: "技术把关人", value: "tech" },
	{ label: "采购", value: "purchase" },
	{ label: "影响者", value: "influencer" },
];

const influenceLevelOptions = [
	{ label: "高", value: "high" },
	{ label: "中", value: "medium" },
	{ label: "低", value: "low" },
];

const relationStatusOptions = [
	{ label: "未接触", value: "new" },
	{ label: "已建立联系", value: "connected" },
	{ label: "持续跟进", value: "following" },
	{ label: "重点维护", value: "vip" },
];

const mockRows = reactive<KeyPersonItem[]>([
	{
		id: 1,
		keyPersonNo: "KP-20260421-0001",
		customerName: "华东智造",
		name: "张工",
		position: "设备经理",
		roleType: "tech",
		phone: "13800138001",
		wechat: "zhanggong01",
		email: "zhang.gong@example.com",
		influenceLevel: "high",
		relationStatus: "following",
		lastContactDate: "2026-04-18",
		nextFollowDate: "2026-04-25",
		lastContactContent: "关注产线改造排期，希望先看成功案例。",
		ownerUserName: "王琳",
		remark: "技术判断权强，回复速度快。",
		aiGuide: "优先从停机成本和交付周期切入，准备两个行业案例。",
		createTime: "2026-04-10 10:00:00",
		updateTime: "2026-04-20 16:30:00",
	},
	{
		id: 2,
		keyPersonNo: "KP-20260421-0002",
		customerName: "南方精工",
		name: "李总",
		position: "总经理",
		roleType: "decision",
		phone: "13800138002",
		wechat: "lizong02",
		email: "li.zong@example.com",
		influenceLevel: "high",
		relationStatus: "vip",
		lastContactDate: "2026-04-16",
		nextFollowDate: "2026-04-23",
		lastContactContent: "对年度合作框架感兴趣，关注回款和售后响应。",
		ownerUserName: "陈涛",
		remark: "决策快，但对价格敏感。",
		aiGuide: "先讲合作收益，再补充售后响应和付款节点方案。",
		createTime: "2026-04-09 09:20:00",
		updateTime: "2026-04-19 11:40:00",
	},
	{
		id: 3,
		keyPersonNo: "KP-20260421-0003",
		customerName: "北景自动化",
		name: "周女士",
		position: "采购主管",
		roleType: "purchase",
		phone: "13800138003",
		wechat: "zhoucaigou",
		email: "zhou.purchase@example.com",
		influenceLevel: "medium",
		relationStatus: "connected",
		lastContactDate: "2026-04-12",
		nextFollowDate: "2026-04-22",
		lastContactContent: "已建立微信沟通，等待内部技术确认后推进。",
		ownerUserName: "王琳",
		remark: "偏流程导向，资料要准备完整。",
		aiGuide: "推进时同步准备报价附件和资质文件，减少往返沟通。",
		createTime: "2026-04-08 14:10:00",
		updateTime: "2026-04-18 09:15:00",
	},
]);

const searchForm = reactive({
	customerName: "",
	roleType: "",
	relationStatus: "",
});

const analysisDialog = reactive<{
	visible: boolean;
	title: string;
	personalityAnalysis: string;
	salesSuggestion: string;
	talkingPoints: string;
	birthdayReminder: string;
	roleTypeLabel: string;
	loading: boolean;
	row: KeyPersonItem | null;
}>({
	visible: false,
	title: "AI销售指导",
	personalityAnalysis: "",
	salesSuggestion: "",
	talkingPoints: "",
	birthdayReminder: "",
	roleTypeLabel: "",
	loading: false,
	row: null,
});

const customerOptions = Array.from(new Set(mockRows.map(e => e.customerName)));

function normalizeKeyword(value: any) {
	return String(value || "")
		.trim()
		.toLowerCase();
}

function roleTypeLabel(value: string) {
	return roleTypeOptions.find(e => e.value === value)?.label || value;
}

function influenceLevelLabel(value: string) {
	return influenceLevelOptions.find(e => e.value === value)?.label || value;
}

function relationStatusLabel(value: string) {
	return relationStatusOptions.find(e => e.value === value)?.label || value;
}

function resetAnalysisDialog() {
	analysisDialog.personalityAnalysis = "";
	analysisDialog.salesSuggestion = "";
	analysisDialog.talkingPoints = "";
	analysisDialog.birthdayReminder = "";
}

async function openAiGuide(row: KeyPersonItem) {
	analysisDialog.row = row;
	analysisDialog.title = `AI销售指导 - ${row.name}`;
	analysisDialog.roleTypeLabel = roleTypeLabel(row.roleType);
	analysisDialog.visible = true;
	resetAnalysisDialog();
	analysisDialog.loading = true;

	const influenceLabel = influenceLevelLabel(row.influenceLevel);
	const relationLabel = relationStatusLabel(row.relationStatus);
	const birthdayText = row.nextFollowDate
		? `建议在 ${row.nextFollowDate} 前后确认是否需要生日或关键节点关怀。`
		: "暂未设置生日，可后续补充重要时间节点。";

	setTimeout(() => {
		analysisDialog.personalityAnalysis = [
			`${row.name} 目前担任${row.position}，影响力 ${influenceLabel}，关系状态为${relationLabel}。`,
			row.remark || "倾向理性谨慎，偏好看到具体资料和成功案例。"
		].join("\n");
		analysisDialog.salesSuggestion = [
			"先从客户当前业务场景切入，突出交付效率、成本和风险控制。",
			row.lastContactContent || "建议围绕最近一次沟通内容做针对性跟进。"
		].join("\n");
		analysisDialog.talkingPoints = [
			"可以先问对方现阶段最关注的指标是什么。",
			"再补充同类客户成功案例，并引导到下一步跟进安排。"
		].join("\n");
		analysisDialog.birthdayReminder = birthdayText;
		analysisDialog.loading = false;
	}, 300);
}

function closeAiGuide() {
	analysisDialog.loading = false;
}

const keyPersonService = {
	async page(params: any) {
		const page = Number(params?.page || 1);
		const size = Number(params?.size || 20);
		const keyword = normalizeKeyword(params?.keyWord);

		let list = [...mockRows];

		if (searchForm.customerName) {
			list = list.filter(e => e.customerName === searchForm.customerName);
		}

		if (searchForm.roleType) {
			list = list.filter(e => e.roleType === searchForm.roleType);
		}

		if (searchForm.relationStatus) {
			list = list.filter(e => e.relationStatus === searchForm.relationStatus);
		}

		if (keyword) {
			list = list.filter(e =>
				[
					e.keyPersonNo,
					e.customerName,
					e.name,
					e.phone,
					e.wechat,
					e.email,
					e.position,
				]
					.join(" ")
					.toLowerCase()
					.includes(keyword)
			);
		}

		const start = (page - 1) * size;
		const end = start + size;

		return {
			list: list.slice(start, end),
			pagination: {
				page,
				size,
				total: list.length,
			},
		};
	},

	async list() {
		return [...mockRows];
	},

	async info(params: any) {
		const id = Number(params?.id);
		return mockRows.find(e => e.id === id) || {};
	},

	async add(data: Partial<KeyPersonItem>) {
		const nextId = mockRows.length ? Math.max(...mockRows.map(e => e.id)) + 1 : 1;
		const now = new Date().toISOString().slice(0, 19).replace("T", " ");

		mockRows.unshift({
			id: nextId,
			keyPersonNo: `KP-20260421-${String(nextId).padStart(4, "0")}`,
			customerName: String(data.customerName || ""),
			name: String(data.name || ""),
			position: String(data.position || ""),
			roleType: String(data.roleType || ""),
			phone: String(data.phone || ""),
			wechat: String(data.wechat || ""),
			email: String(data.email || ""),
			influenceLevel: String(data.influenceLevel || "medium"),
			relationStatus: String(data.relationStatus || "new"),
			lastContactDate: String(data.lastContactDate || ""),
			nextFollowDate: String(data.nextFollowDate || ""),
			lastContactContent: String(data.lastContactContent || ""),
			ownerUserName: String(data.ownerUserName || ""),
			remark: String(data.remark || ""),
			aiGuide: String(data.aiGuide || ""),
			createTime: now,
			updateTime: now,
		});

		return { id: nextId };
	},

	async update(data: Partial<KeyPersonItem>) {
		const id = Number(data.id);
		const item = mockRows.find(e => e.id === id);

		if (!item) {
			return;
		}

		Object.assign(item, data, {
			updateTime: new Date().toISOString().slice(0, 19).replace("T", " "),
		});
	},

	async delete(data: any) {
		const ids = Array.isArray(data?.ids)
			? data.ids.map((e: any) => Number(e))
			: [Number(data?.id)].filter(Boolean);

		ids.forEach(id => {
			const index = mockRows.findIndex(e => e.id === id);
			if (index >= 0) {
				mockRows.splice(index, 1);
			}
		});
	},
};

const Upsert = useUpsert<KeyPersonItem>({
	dialog: {
		width: "900px",
	},
	props: {
		labelWidth: "120px",
	},
	items: [
		() => {
			return () => ({
				label: "关键人编号",
				prop: "keyPersonNo",
				span: 12,
				hidden: Upsert.value?.mode == "add",
				component: {
					name: "el-input",
					props: {
						disabled: true,
						placeholder: "保存后自动生成",
					},
				},
			});
		},
		{
			label: "客户名称",
			prop: "customerName",
			span: 12,
			required: true,
			component: {
				name: "el-select",
				options: customerOptions.map(e => ({ label: e, value: e })),
				props: {
					filterable: true,
					clearable: true,
				},
			},
		},
		{
			label: "关键人姓名",
			prop: "name",
			span: 12,
			required: true,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: "职位",
			prop: "position",
			span: 12,
			required: true,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: "角色类型",
			prop: "roleType",
			span: 12,
			required: true,
			component: {
				name: "el-select",
				options: roleTypeOptions,
				props: { clearable: true },
			},
		},
		{
			label: "手机号",
			prop: "phone",
			span: 12,
			required: true,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: "微信",
			prop: "wechat",
			span: 12,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: "邮箱",
			prop: "email",
			span: 12,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: "影响力等级",
			prop: "influenceLevel",
			span: 12,
			required: true,
			component: {
				name: "el-select",
				options: influenceLevelOptions,
				props: { clearable: true },
			},
		},
		{
			label: "关系状态",
			prop: "relationStatus",
			span: 12,
			required: true,
			component: {
				name: "el-select",
				options: relationStatusOptions,
				props: { clearable: true },
			},
		},
		{
			label: "最近联系时间",
			prop: "lastContactDate",
			span: 12,
			component: {
				name: "el-date-picker",
				props: {
					type: "date",
					"value-format": "YYYY-MM-DD",
					clearable: true,
				},
			},
		},
		{
			label: "下次跟进时间",
			prop: "nextFollowDate",
			span: 12,
			component: {
				name: "el-date-picker",
				props: {
					type: "date",
					"value-format": "YYYY-MM-DD",
					clearable: true,
				},
			},
		},
		{
			label: "负责人",
			prop: "ownerUserName",
			span: 12,
			required: true,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: "最近联系内容",
			prop: "lastContactContent",
			span: 24,
			component: {
				name: "el-input",
				props: {
					type: "textarea",
					rows: 3,
					clearable: true,
				},
			},
		},
		{
			label: "AI销售指导",
			prop: "aiGuide",
			span: 24,
			component: {
				name: "el-input",
				props: {
					type: "textarea",
					rows: 3,
					clearable: true,
				},
			},
		},
		{
			label: "备注",
			prop: "remark",
			span: 24,
			component: {
				name: "el-input",
				props: {
					type: "textarea",
					rows: 3,
					clearable: true,
				},
			},
		},
		{
			label: "创建时间",
			prop: "createTime",
			span: 12,
			hidden: ({ scope }: any) => !scope?.id,
			component: {
				name: "cl-date-text",
				props: { format: "YYYY-MM-DD HH:mm" },
			},
		},
		{
			label: "更新时间",
			prop: "updateTime",
			span: 12,
			hidden: ({ scope }: any) => !scope?.id,
			component: {
				name: "cl-date-text",
				props: { format: "YYYY-MM-DD HH:mm" },
			},
		},
	],
});

const Table = useTable<KeyPersonItem>({
	columns: [
		{ type: "selection", width: 60 },
		{ label: "关键人编号", prop: "keyPersonNo", minWidth: 160 },
		{ label: "客户名称", prop: "customerName", minWidth: 160 },
		{ label: "关键人姓名", prop: "name", minWidth: 120 },
		{ label: "职位", prop: "position", minWidth: 140 },
		{
			label: "角色类型",
			prop: "roleType",
			minWidth: 120,
			formatter(row: KeyPersonItem) {
				return roleTypeLabel(row.roleType);
			},
		},
		{ label: "手机号", prop: "phone", minWidth: 140 },
		{ label: "微信", prop: "wechat", minWidth: 140 },
		{
			label: "影响力等级",
			prop: "influenceLevel",
			minWidth: 120,
			formatter(row: KeyPersonItem) {
				return influenceLevelLabel(row.influenceLevel);
			},
		},
		{
			label: "关系状态",
			prop: "relationStatus",
			minWidth: 120,
			formatter(row: KeyPersonItem) {
				return relationStatusLabel(row.relationStatus);
			},
		},
		{ label: "最近联系时间", prop: "lastContactDate", minWidth: 140 },
		{ label: "下次跟进时间", prop: "nextFollowDate", minWidth: 140 },
		{ label: "负责人", prop: "ownerUserName", minWidth: 120 },
		{ label: "AI销售指导", prop: "aiGuide", minWidth: 240 },
		{
			label: "创建时间",
			prop: "createTime",
			minWidth: 170,
			sortable: "desc",
			component: { name: "cl-date-text" },
		},
		{
			label: "更新时间",
			prop: "updateTime",
			minWidth: 170,
			sortable: "custom",
			component: { name: "cl-date-text" },
		},
		{
			type: "op",
			width: 230,
			buttons: [
				"edit",
				"delete",
				{
					label: "AI销售指导",
					type: "success",
					onClick({ scope }: any) {
						openAiGuide(scope.row);
					},
				},
			],
		},
	],
});

const Crud = useCrud(
	{
		service: keyPersonService,
	},
	app => {
		app.refresh();
	}
);

function onSearchChange() {
	Crud.value?.refresh({ page: 1 });
}
</script>

<style lang="scss" scoped>
.guide-text {
	line-height: 18px;
	white-space: pre-wrap;
	word-break: break-word;
}

.toolbar-row {
	flex-wrap: nowrap;

	&__right {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 10px;
		flex-wrap: nowrap;
	}

	&__select {
		width: 160px;
		flex-shrink: 0;
	}

	&__select--sm {
		width: 140px;
	}
}

.analysis-dialog {
	display: flex;
	flex-direction: column;
	gap: 16px;

	&__summary {
		flex-shrink: 0;
	}

	&__result {
		flex-shrink: 0;
	}

	&__text {
		line-height: 20px;
		white-space: pre-wrap;
		word-break: break-word;
	}
}
</style>
