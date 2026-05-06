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
					:placeholder="TEXT.customer"
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
					:placeholder="TEXT.role"
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
					:placeholder="TEXT.status"
					@change="onSearchChange"
				>
					<el-option
						v-for="item in relationStatusOptions"
						:key="item.value"
						:label="item.label"
						:value="item.value"
					/>
				</el-select>

				<cl-search-key :placeholder="TEXT.searchPlaceholder" :width="260" />
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
				<el-descriptions-item :label="TEXT.customer">
					{{ analysisDialog.row?.customerName || "-" }}
				</el-descriptions-item>
				<el-descriptions-item :label="TEXT.keyPerson">
					{{ analysisDialog.row?.name || "-" }}
				</el-descriptions-item>
				<el-descriptions-item :label="TEXT.position">
					{{ analysisDialog.row?.position || "-" }}
				</el-descriptions-item>
				<el-descriptions-item :label="TEXT.role">
					{{ analysisDialog.roleTypeLabel || "-" }}
				</el-descriptions-item>
			</el-descriptions>

			<el-table :data="analysisDialog.rows" border class="analysis-dialog__result">
				<el-table-column prop="label" :label="TEXT.analysisItem" width="160" />
				<el-table-column prop="content" :label="TEXT.aiSuggestion">
					<template #default="{ row }">
						<div class="analysis-dialog__text">{{ row.content || "-" }}</div>
					</template>
				</el-table-column>
			</el-table>
		</div>
	</el-dialog>
</template>

<script lang="ts" setup>
defineOptions({
	name: "company-key-person",
});

import { useCrud, useTable, useUpsert } from "@cool-vue/crud";
import { reactive } from "vue";
import { ElMessage } from "element-plus";
import { useDifyApi } from "../api/dify";

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
	birthday: string;
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

const TEXT = {
	customer: "\u5ba2\u6237\u540d\u79f0",
	role: "\u89d2\u8272\u7c7b\u578b",
	status: "\u5173\u7cfb\u72b6\u6001",
	searchPlaceholder:
		"\u641c\u7d22\u5173\u952e\u4eba\u7f16\u53f7 / \u59d3\u540d / \u624b\u673a\u53f7 / \u5fae\u4fe1 / \u5ba2\u6237\u540d\u79f0",
	keyPerson: "\u5173\u952e\u4eba",
	position: "\u804c\u4f4d",
	personality: "\u6027\u683c\u5206\u6790",
	salesSuggestion: "\u9500\u552e\u5efa\u8bae",
	talkingPoints: "\u8bdd\u672f\u5efa\u8bae",
	birthdayReminder: "\u751f\u65e5\u63d0\u9192",
	riskReminder: "\u98ce\u9669\u63d0\u9192",
	infoSupplement: "\u4fe1\u606f\u8865\u5145\u5efa\u8bae",
	analysisItem: "\u5206\u6790\u9879\u76ee",
	aiSuggestion: "AI\u5efa\u8bae\u5185\u5bb9",
	title: "AI\u9500\u552e\u6307\u5bfc",
	code: "\u5173\u952e\u4eba\u7f16\u53f7",
	codePlaceholder: "\u4fdd\u5b58\u540e\u81ea\u52a8\u751f\u6210",
	name: "\u59d3\u540d",
	phone: "\u624b\u673a\u53f7",
	wechat: "\u5fae\u4fe1",
	email: "\u90ae\u7bb1",
	birthday: "\u751f\u65e5",
	influence: "\u5f71\u54cd\u529b\u7b49\u7ea7",
	lastContact: "\u6700\u8fd1\u8054\u7cfb\u65f6\u95f4",
	nextFollow: "\u4e0b\u6b21\u8ddf\u8fdb\u65f6\u95f4",
	owner: "\u8d1f\u8d23\u4eba",
	lastContactContent: "\u6700\u8fd1\u8054\u7cfb\u5185\u5bb9",
	aiGuide: "AI\u9500\u552e\u6307\u5bfc",
	remark: "\u5907\u6ce8",
	createTime: "\u521b\u5efa\u65f6\u95f4",
	updateTime: "\u66f4\u65b0\u65f6\u95f4",
	dialogTitlePrefix: "AI\u9500\u552e\u6307\u5bfc - ",
	birthdayPromptPrefix: "\u5efa\u8bae\u5728 ",
	birthdayPromptSuffix:
		" \u524d\u540e\u786e\u8ba4\u662f\u5426\u9700\u8981\u751f\u65e5\u6216\u5173\u952e\u8282\u70b9\u5173\u6000\u3002",
	birthdayEmpty:
		"\u6682\u672a\u8bbe\u7f6e\u751f\u65e5\uff0c\u53ef\u540e\u7eed\u8865\u5145\u91cd\u8981\u65f6\u95f4\u8282\u70b9\u3002",
	personalityLineTemplate:
		"{name} \u76ee\u524d\u62c5\u4efb {position}\uff0c\u5f71\u54cd\u529b {influence}\uff0c\u5173\u7cfb\u72b6\u6001\u4e3a {status}\u3002",
	personalityFallback:
		"\u503e\u5411\u7406\u6027\u8c28\u614e\uff0c\u504f\u597d\u770b\u5230\u5177\u4f53\u8d44\u6599\u548c\u6210\u529f\u6848\u4f8b\u3002",
	salesGuide1:
		"\u5148\u4ece\u5ba2\u6237\u5f53\u524d\u4e1a\u52a1\u573a\u666f\u5207\u5165\uff0c\u7a81\u51fa\u4ea4\u4ed8\u6548\u7387\u3001\u6210\u672c\u548c\u98ce\u9669\u63a7\u5236\u3002",
	salesGuide2:
		"\u5efa\u8bae\u56f4\u7ed5\u6700\u8fd1\u4e00\u6b21\u6c9f\u901a\u5185\u5bb9\u505a\u9488\u5bf9\u6027\u8ddf\u8fdb\u3002",
	talk1:
		"\u53ef\u4ee5\u5148\u95ee\u5bf9\u65b9\u73b0\u9636\u6bb5\u6700\u5173\u6ce8\u7684\u6307\u6807\u662f\u4ec0\u4e48\u3002",
	talk2:
		"\u518d\u8865\u5145\u540c\u7c7b\u5ba2\u6237\u6210\u529f\u6848\u4f8b\uff0c\u5e76\u5f15\u5bfc\u5230\u4e0b\u4e00\u6b65\u8ddf\u8fdb\u5b89\u6392\u3002",
	buttonAiGuide: "AI\u9500\u552e\u6307\u5bfc",
};

const roleTypeOptions = [
	{ label: "\u51b3\u7b56\u4eba", value: "decision" },
	{ label: "\u4f7f\u7528\u4eba", value: "user" },
	{ label: "\u6280\u672f\u628a\u5173\u4eba", value: "tech" },
	{ label: "\u91c7\u8d2d", value: "purchase" },
	{ label: "\u5f71\u54cd\u8005", value: "influencer" },
];

const influenceLevelOptions = [
	{ label: "\u9ad8", value: "high" },
	{ label: "\u4e2d", value: "medium" },
	{ label: "\u4f4e", value: "low" },
];

const relationStatusOptions = [
	{ label: "\u672a\u63a5\u89e6", value: "new" },
	{ label: "\u5df2\u5efa\u7acb\u8054\u7cfb", value: "connected" },
	{ label: "\u6301\u7eed\u8ddf\u8fdb", value: "following" },
	{ label: "\u91cd\u70b9\u7ef4\u62a4", value: "vip" },
];

const mockRows = reactive<KeyPersonItem[]>([
	{
		id: 1,
		keyPersonNo: "KP-20260421-0001",
		customerName: "\u534e\u4e1c\u667a\u9020",
		name: "\u5f20\u5de5",
		position: "\u8bbe\u5907\u7ecf\u7406",
		roleType: "tech",
		phone: "13800138001",
		wechat: "zhanggong01",
		email: "zhang.gong@example.com",
		birthday: "1988-06-18",
		influenceLevel: "high",
		relationStatus: "following",
		lastContactDate: "2026-04-18",
		nextFollowDate: "2026-04-25",
		lastContactContent:
			"\u5173\u6ce8\u4ea7\u7ebf\u6539\u9020\u6392\u671f\uff0c\u5e0c\u671b\u5148\u770b\u6210\u529f\u6848\u4f8b\u3002",
		ownerUserName: "\u738b\u7433",
		remark: "\u6280\u672f\u5224\u65ad\u6743\u5f3a\uff0c\u56de\u590d\u901f\u5ea6\u5feb\u3002",
		aiGuide:
			"\u4f18\u5148\u4ece\u505c\u673a\u6210\u672c\u548c\u4ea4\u4ed8\u5468\u671f\u5207\u5165\uff0c\u51c6\u5907\u4e24\u4e2a\u884c\u4e1a\u6848\u4f8b\u3002",
		createTime: "2026-04-10 10:00:00",
		updateTime: "2026-04-20 16:30:00",
	},
	{
		id: 2,
		keyPersonNo: "KP-20260421-0002",
		customerName: "\u5357\u65b9\u7cbe\u5de5",
		name: "\u674e\u603b",
		position: "\u603b\u7ecf\u7406",
		roleType: "decision",
		phone: "13800138002",
		wechat: "lizong02",
		email: "li.zong@example.com",
		birthday: "1980-09-12",
		influenceLevel: "high",
		relationStatus: "vip",
		lastContactDate: "2026-04-16",
		nextFollowDate: "2026-04-23",
		lastContactContent:
			"\u5bf9\u5e74\u5ea6\u5408\u4f5c\u6846\u67b6\u611f\u5174\u8da3\uff0c\u5173\u6ce8\u56de\u6b3e\u548c\u552e\u540e\u54cd\u5e94\u3002",
		ownerUserName: "\u9648\u6d9b",
		remark: "\u51b3\u7b56\u5feb\uff0c\u4f46\u5bf9\u4ef7\u683c\u654f\u611f\u3002",
		aiGuide:
			"\u5148\u8bb2\u5408\u4f5c\u6536\u76ca\uff0c\u518d\u8865\u5145\u552e\u540e\u54cd\u5e94\u548c\u4ed8\u6b3e\u8282\u70b9\u65b9\u6848\u3002",
		createTime: "2026-04-09 09:20:00",
		updateTime: "2026-04-19 11:40:00",
	},
	{
		id: 3,
		keyPersonNo: "KP-20260421-0003",
		customerName: "\u5317\u666f\u81ea\u52a8\u5316",
		name: "\u5468\u5973\u58eb",
		position: "\u91c7\u8d2d\u4e3b\u7ba1",
		roleType: "purchase",
		phone: "13800138003",
		wechat: "zhoucaigou",
		email: "zhou.purchase@example.com",
		birthday: "1991-03-26",
		influenceLevel: "medium",
		relationStatus: "connected",
		lastContactDate: "2026-04-12",
		nextFollowDate: "2026-04-22",
		lastContactContent:
			"\u5df2\u5efa\u7acb\u5fae\u4fe1\u6c9f\u901a\uff0c\u7b49\u5f85\u5185\u90e8\u6280\u672f\u786e\u8ba4\u540e\u63a8\u8fdb\u3002",
		ownerUserName: "\u738b\u7433",
		remark: "\u504f\u6d41\u7a0b\u5bfc\u5411\uff0c\u8d44\u6599\u8981\u51c6\u5907\u5b8c\u6574\u3002",
		aiGuide:
			"\u63a8\u8fdb\u65f6\u540c\u6b65\u51c6\u5907\u62a5\u4ef7\u9644\u4ef6\u548c\u8d44\u8d28\u6587\u4ef6\uff0c\u51cf\u5c11\u5f80\u8fd4\u6c9f\u901a\u3002",
		createTime: "2026-04-08 14:10:00",
		updateTime: "2026-04-18 09:15:00",
	},
]);

const searchForm = reactive({
	customerName: "",
	roleType: "",
	relationStatus: "",
});

const difyApi = useDifyApi();
const analysisLabels = [
	TEXT.personality,
	TEXT.salesSuggestion,
	TEXT.talkingPoints,
	TEXT.birthdayReminder,
	TEXT.riskReminder,
	TEXT.infoSupplement,
];

const analysisDialog = reactive<{
	visible: boolean;
	title: string;
	rows: { label: string; content: string }[];
	roleTypeLabel: string;
	loading: boolean;
	row: KeyPersonItem | null;
}>({
	visible: false,
	title: TEXT.title,
	rows: analysisLabels.map(label => ({ label, content: "" })),
	roleTypeLabel: "",
	loading: false,
	row: null,
});

const customerOptions = Array.from(new Set(mockRows.map(e => e.customerName)));

function normalizeKeyword(value: any) {
	return String(value || "").trim().toLowerCase();
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
	analysisDialog.rows = analysisLabels.map(label => ({ label, content: "" }));
}

function extractDifyData(response: any) {
	return response?.data ?? response;
}

function getFieldValue(data: any, keys: string[]) {
	for (const key of keys) {
		if (data && typeof data === "object" && data[key]) {
			return String(data[key]);
		}
	}
	return "";
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeAiText(value: any) {
	return String(value || "")
		.replace(/\r\n/g, "\n")
		.replace(/\r/g, "\n")
		.trim();
}

function getAiText(data: any) {
	if (typeof data === "string") {
		return normalizeAiText(data);
	}

	if (!data || typeof data !== "object") {
		return "";
	}

	for (const key of ["rawText", "text", "result", "output", "answer"]) {
		if (typeof data[key] === "string") {
			return normalizeAiText(data[key]);
		}
	}

	return "";
}

function mergeRowContent(rows: { label: string; content: string }[], label: string, content: string) {
	const row = rows.find(e => e.label === label);
	const text = normalizeAiText(content);

	if (!row || !text) return;

	row.content = row.content ? `${row.content}\n${text}` : text;
}

function splitRiskAndInfo(content: string) {
	const text = normalizeAiText(content);
	const infoMatch = text.match(/(?:^|\n)\s*(?:信息补充建议|信息补充|补充建议)\s*[：:]\s*/);

	if (!infoMatch || infoMatch.index === undefined) {
		return {
			risk: "",
			info: text,
		};
	}

	const risk = text
		.slice(0, infoMatch.index)
		.replace(/^\s*(?:风险提醒)\s*[：:]\s*/, "")
		.trim();
	const info = text.slice(infoMatch.index + infoMatch[0].length).trim();

	return { risk, info };
}

function parseTextAiGuide(text: string) {
	const rows = analysisLabels.map(label => ({ label, content: "" }));
	const titleMap: Record<string, string> = {
		性格分析: TEXT.personality,
		销售建议: TEXT.salesSuggestion,
		话术建议: TEXT.talkingPoints,
		生日提醒: TEXT.birthdayReminder,
		风险提醒: TEXT.riskReminder,
		信息补充建议: TEXT.infoSupplement,
		关键人基本判断: TEXT.personality,
		性格与沟通风格分析: TEXT.personality,
		销售推进建议: TEXT.salesSuggestion,
		推荐沟通话术: TEXT.talkingPoints,
		生日与关系维护提醒: TEXT.birthdayReminder,
		风险提醒与信息补充建议: TEXT.infoSupplement,
	};
	const titles = Object.keys(titleMap).sort((a, b) => b.length - a.length);
	const titlePattern = titles.map(escapeRegExp).join("|");
	const headingReg = new RegExp(
		`(?:^|\\n)\\s*(?:#{1,6}\\s*)?(?:(?:[一二三四五六七八九十]|[1-9])\\s*[、.．)]\\s*)?(${titlePattern})\\s*[：:]?\\s*`,
		"g"
	);
	const matches = Array.from(text.matchAll(headingReg));

	if (!matches.length) {
		mergeRowContent(rows, TEXT.salesSuggestion, text);
		return rows;
	}

	matches.forEach((match, index) => {
		const title = match[1];
		const start = (match.index || 0) + match[0].length;
		const end = matches[index + 1]?.index ?? text.length;
		const content = text.slice(start, end).trim();

		if (!content) return;

		if (title === "风险提醒与信息补充建议") {
			const { risk, info } = splitRiskAndInfo(content);
			mergeRowContent(rows, TEXT.riskReminder, risk);
			mergeRowContent(rows, TEXT.infoSupplement, info || content);
			return;
		}

		mergeRowContent(rows, titleMap[title], content);
	});

	if (!rows.some(row => row.content)) {
		mergeRowContent(rows, TEXT.salesSuggestion, text);
	}

	return rows;
}

function parseAiGuideResult(result: any) {
	const data = extractDifyData(result);
	const rows = analysisLabels.map(label => ({ label, content: "" }));

	if (data && typeof data === "object") {
		const valueMap: Record<string, string[]> = {
			[TEXT.personality]: ["personalityAnalysis", "personality", "性格分析"],
			[TEXT.salesSuggestion]: ["salesSuggestion", "salesAdvice", "销售建议"],
			[TEXT.talkingPoints]: ["talkingPoints", "scriptSuggestion", "话术建议"],
			[TEXT.birthdayReminder]: ["birthdayReminder", "birthday", "生日提醒"],
			[TEXT.riskReminder]: ["riskReminder", "risk", "风险提醒"],
			[TEXT.infoSupplement]: ["infoSupplement", "informationSupplement", "信息补充建议"],
		};

		rows.forEach(row => {
			row.content = getFieldValue(data, valueMap[row.label]);
		});

		if (rows.some(row => row.content)) {
			return rows;
		}
	}

	const text = getAiText(data);

	if (!text) return rows;
	return parseTextAiGuide(text);
}

async function openAiGuide(row: KeyPersonItem) {
	analysisDialog.row = row;
	analysisDialog.title = `${TEXT.dialogTitlePrefix}${row.name}`;
	analysisDialog.roleTypeLabel = roleTypeLabel(row.roleType);
	analysisDialog.visible = true;
	resetAnalysisDialog();
	analysisDialog.loading = true;

	try {
		const result = await difyApi.getKeyPersonGuide({
			customerName: row.customerName,
			name: row.name,
			position: row.position,
			roleType: row.roleType,
			lastContactContent: row.lastContactContent,
			remark: row.remark,
			birthday: row.birthday,
		});
		analysisDialog.rows = parseAiGuideResult(result);
	} catch (error: any) {
		ElMessage.error(error?.message || "AI\u9500\u552e\u6307\u5bfc\u83b7\u53d6\u5931\u8d25");
	} finally {
		analysisDialog.loading = false;
	}
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
			birthday: String(data.birthday || ""),
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

		if (!item) return;

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
		() => ({
			label: TEXT.code,
			prop: "keyPersonNo",
			span: 12,
			hidden: Upsert.value?.mode == "add",
			component: {
				name: "el-input",
				props: {
					disabled: true,
					placeholder: TEXT.codePlaceholder,
				},
			},
		}),
		{
			label: TEXT.customer,
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
			label: TEXT.name,
			prop: "name",
			span: 12,
			required: true,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: TEXT.position,
			prop: "position",
			span: 12,
			required: true,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: TEXT.role,
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
			label: TEXT.phone,
			prop: "phone",
			span: 12,
			required: true,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: TEXT.wechat,
			prop: "wechat",
			span: 12,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: TEXT.email,
			prop: "email",
			span: 12,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: TEXT.birthday,
			prop: "birthday",
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
			label: TEXT.influence,
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
			label: TEXT.status,
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
			label: TEXT.lastContact,
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
			label: TEXT.nextFollow,
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
			label: TEXT.owner,
			prop: "ownerUserName",
			span: 12,
			required: true,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: TEXT.lastContactContent,
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
			label: TEXT.aiGuide,
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
			label: TEXT.remark,
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
			label: TEXT.createTime,
			prop: "createTime",
			span: 12,
			hidden: ({ scope }: any) => !scope?.id,
			component: {
				name: "cl-date-text",
				props: { format: "YYYY-MM-DD HH:mm" },
			},
		},
		{
			label: TEXT.updateTime,
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
		{ label: TEXT.code, prop: "keyPersonNo", minWidth: 160 },
		{ label: TEXT.customer, prop: "customerName", minWidth: 160 },
		{ label: TEXT.name, prop: "name", minWidth: 120 },
		{ label: TEXT.position, prop: "position", minWidth: 140 },
		{
			label: TEXT.role,
			prop: "roleType",
			minWidth: 120,
			formatter(row: KeyPersonItem) {
				return roleTypeLabel(row.roleType);
			},
		},
		{ label: TEXT.phone, prop: "phone", minWidth: 140 },
		{ label: TEXT.wechat, prop: "wechat", minWidth: 140 },
		{ label: TEXT.birthday, prop: "birthday", minWidth: 120 },
		{
			label: TEXT.influence,
			prop: "influenceLevel",
			minWidth: 120,
			formatter(row: KeyPersonItem) {
				return influenceLevelLabel(row.influenceLevel);
			},
		},
		{
			label: TEXT.status,
			prop: "relationStatus",
			minWidth: 120,
			formatter(row: KeyPersonItem) {
				return relationStatusLabel(row.relationStatus);
			},
		},
		{ label: TEXT.lastContact, prop: "lastContactDate", minWidth: 140 },
		{ label: TEXT.nextFollow, prop: "nextFollowDate", minWidth: 140 },
		{ label: TEXT.owner, prop: "ownerUserName", minWidth: 120 },
		{ label: TEXT.aiGuide, prop: "aiGuide", minWidth: 240 },
		{
			label: TEXT.createTime,
			prop: "createTime",
			minWidth: 170,
			sortable: "desc",
			component: { name: "cl-date-text" },
		},
		{
			label: TEXT.updateTime,
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
					label: TEXT.buttonAiGuide,
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
