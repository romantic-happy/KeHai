<template>
	<cl-crud ref="Crud">
		<cl-row>
			<cl-refresh-btn />
			<cl-add-btn />
			<cl-multi-delete-btn />
			<cl-flex1 />
			<el-select
				v-model="search.supplierType"
				placeholder="供应商类型"
				clearable
				style="width: 130px"
				@change="refresh({ page: 1 })"
			>
				<el-option v-for="item in options.supplierType" :key="item.value" :label="item.label" :value="item.value" />
			</el-select>
			<el-select
				v-model="search.supplierSource"
				placeholder="供应商来源"
				clearable
				style="width: 150px"
				@change="refresh({ page: 1 })"
			>
				<el-option v-for="item in options.supplierSource" :key="item.value" :label="item.label" :value="item.value" />
			</el-select>
			<el-select
				v-model="search.infoStatus"
				placeholder="信息状态"
				clearable
				style="width: 120px"
				@change="refresh({ page: 1 })"
			>
				<el-option v-for="item in options.infoStatus" :key="item.value" :label="item.label" :value="item.value" />
			</el-select>
			<el-select
				v-model="search.manageStatus"
				placeholder="管理状态"
				clearable
				style="width: 120px"
				@change="refresh({ page: 1 })"
			>
				<el-option v-for="item in options.manageStatus" :key="item.value" :label="item.label" :value="item.value" />
			</el-select>
			<el-select
				v-model="search.businessCategory"
				placeholder="业务类别"
				clearable
				style="width: 150px"
				@change="refresh({ page: 1 })"
			>
				<el-option v-for="item in options.businessCategory" :key="item.value" :label="item.label" :value="item.value" />
			</el-select>
			<el-select
				v-model="search.cooperationRelation"
				placeholder="合作关系"
				clearable
				style="width: 120px"
				@change="refresh({ page: 1 })"
			>
				<el-option v-for="item in options.cooperationRelation" :key="item.value" :label="item.label" :value="item.value" />
			</el-select>
			<cl-search-key placeholder="搜索供应商名称/联系人/联系方式" :width="280" />
		</cl-row>

		<cl-row>
			<cl-table ref="Table">
				<template #column-supplierName="{ scope }">
					<el-link type="primary" @click="openDetail(scope.row)">
						{{ scope.row.supplierName || "-" }}
					</el-link>
				</template>

				<template #column-businessCategory="{ scope }">
					<div class="tag-list">
						<el-tag
							v-for="item in normalizeArray(scope.row.businessCategory)"
							:key="item"
							size="small"
							effect="plain"
						>
							{{ labelOf(options.businessCategory, item) }}
						</el-tag>
						<span v-if="!normalizeArray(scope.row.businessCategory).length">-</span>
					</div>
				</template>

				<template #column-supplierActions="{ scope }">
					<div class="supplier-actions">
						<el-button size="small" plain @click="openDetail(scope.row)">详情</el-button>
						<el-button
							v-if="scope.row.supplierType === 'temporary'"
							size="small"
							type="success"
							plain
							@click="openTransfer(scope.row)"
						>
							转正
						</el-button>
						<el-button size="small" type="primary" plain @click="openAiBackground(scope.row)">
							AI背调
						</el-button>
						<el-button size="small" type="warning" plain @click="openAiProfile(scope.row)">
							AI画像
						</el-button>
						<el-button size="small" plain @click="openQuoteRecords(scope.row)">报价记录</el-button>
					</div>
				</template>
			</cl-table>
		</cl-row>

		<cl-row>
			<cl-flex1 />
			<cl-pagination />
		</cl-row>

		<cl-upsert ref="Upsert" />
	</cl-crud>

	<el-dialog v-model="detail.visible" title="供应商详情" width="920px">
		<el-descriptions border :column="2">
			<el-descriptions-item label="供应商名称">{{ detail.row.supplierName || "-" }}</el-descriptions-item>
			<el-descriptions-item label="供应商类型">{{ labelOf(options.supplierType, detail.row.supplierType) }}</el-descriptions-item>
			<el-descriptions-item label="供应商来源">{{ labelOf(options.supplierSource, detail.row.supplierSource) }}</el-descriptions-item>
			<el-descriptions-item label="信息状态">{{ labelOf(options.infoStatus, detail.row.infoStatus) }}</el-descriptions-item>
			<el-descriptions-item label="管理状态">{{ labelOf(options.manageStatus, detail.row.manageStatus) }}</el-descriptions-item>
			<el-descriptions-item label="联系人">{{ detail.row.contactName || "-" }}</el-descriptions-item>
			<el-descriptions-item label="联系方式">{{ detail.row.contactInfo || "-" }}</el-descriptions-item>
			<el-descriptions-item label="备注" :span="2">{{ detail.row.remark || "-" }}</el-descriptions-item>
			<template v-if="detail.row.supplierType === 'formal'">
				<el-descriptions-item label="供应商性质">{{ labelOf(options.supplierNature, detail.row.supplierNature) }}</el-descriptions-item>
				<el-descriptions-item label="账期">{{ detail.row.paymentTerm ? `${detail.row.paymentTerm}天` : "-" }}</el-descriptions-item>
				<el-descriptions-item label="合作关系">{{ labelOf(options.cooperationRelation, detail.row.cooperationRelation) }}</el-descriptions-item>
				<el-descriptions-item label="业务类别">
					<div class="tag-list">
						<el-tag v-for="item in normalizeArray(detail.row.businessCategory)" :key="item" size="small" effect="plain">
							{{ labelOf(options.businessCategory, item) }}
						</el-tag>
					</div>
				</el-descriptions-item>
				<el-descriptions-item label="AI背调" :span="2">
					<div class="pre-line">{{ detail.row.aiBackgroundCheck || "-" }}</div>
				</el-descriptions-item>
				<el-descriptions-item label="AI供应商画像" :span="2">
					<div class="pre-line">{{ detail.row.aiSupplierProfile || "-" }}</div>
				</el-descriptions-item>
			</template>
			<el-descriptions-item v-if="detail.row.manageStatus === 'invalid'" label="失效原因" :span="2">
				{{ detail.row.invalidReason || "-" }}
			</el-descriptions-item>
		</el-descriptions>
		<template #footer>
			<el-button @click="openQuoteRecords(detail.row)">报价记录</el-button>
			<el-button type="primary" @click="detail.visible = false">关闭</el-button>
		</template>
	</el-dialog>

	<el-dialog v-model="transfer.visible" title="临时供应商转正" width="900px">
		<el-form ref="TransferFormRef" :model="transfer.form" label-width="130px">
			<el-row :gutter="12">
				<el-col :span="12">
					<el-form-item label="供应商名称" required><el-input v-model="transfer.form.supplierName" clearable /></el-form-item>
				</el-col>
				<el-col :span="12">
					<el-form-item label="供应商来源" required>
						<el-select v-model="transfer.form.supplierSource" clearable class="w-full">
							<el-option v-for="item in options.supplierSource" :key="item.value" :label="item.label" :value="item.value" />
						</el-select>
					</el-form-item>
				</el-col>
				<el-col :span="12">
					<el-form-item label="联系人" required><el-input v-model="transfer.form.contactName" clearable /></el-form-item>
				</el-col>
				<el-col :span="12">
					<el-form-item label="联系方式" required><el-input v-model="transfer.form.contactInfo" clearable /></el-form-item>
				</el-col>
				<el-col :span="12">
					<el-form-item label="供应商性质" required>
						<el-select v-model="transfer.form.supplierNature" clearable class="w-full">
							<el-option v-for="item in options.supplierNature" :key="item.value" :label="item.label" :value="item.value" />
						</el-select>
					</el-form-item>
				</el-col>
				<el-col :span="12">
					<el-form-item label="业务类别" required>
						<el-select v-model="transfer.form.businessCategory" multiple clearable class="w-full">
							<el-option v-for="item in options.businessCategory" :key="item.value" :label="item.label" :value="item.value" />
						</el-select>
					</el-form-item>
				</el-col>
				<el-col :span="12">
					<el-form-item label="账期(天)"><el-input-number v-model="transfer.form.paymentTerm" :min="0" :controls="false" /></el-form-item>
				</el-col>
				<el-col :span="12">
					<el-form-item label="合作关系" required>
						<el-select v-model="transfer.form.cooperationRelation" clearable class="w-full">
							<el-option v-for="item in options.cooperationRelation" :key="item.value" :label="item.label" :value="item.value" />
						</el-select>
					</el-form-item>
				</el-col>
				<el-col :span="24">
					<el-form-item label="AI背调"><el-input v-model="transfer.form.aiBackgroundCheck" type="textarea" :rows="5" clearable /></el-form-item>
				</el-col>
				<el-col :span="24">
					<el-form-item label="备注"><el-input v-model="transfer.form.remark" type="textarea" :rows="3" clearable /></el-form-item>
				</el-col>
			</el-row>
		</el-form>
		<template #footer>
			<el-button @click="transfer.visible = false">取消</el-button>
			<el-button type="primary" :loading="transfer.loading" @click="submitTransfer">提交转正</el-button>
		</template>
	</el-dialog>

	<el-dialog v-model="ai.visible" :title="ai.title" width="960px">
		<div class="ai-result-dialog">
			<el-alert :title="ai.message" type="success" show-icon :closable="false" class="mb-3" />

			<el-descriptions border :column="2" class="ai-result-dialog__table">
				<el-descriptions-item v-for="item in ai.baseRows" :key="item.label" :label="item.label">
					<div class="ai-result-dialog__text">{{ item.value || "-" }}</div>
				</el-descriptions-item>
			</el-descriptions>

			<div class="ai-result-table">
				<template v-for="section in ai.sections" :key="section.title">
					<div class="ai-result-table__section">{{ section.title }}</div>
					<div
						v-for="(item, index) in section.rows"
						:key="`${section.title}-${index}`"
						class="ai-result-table__row"
					>
						<div class="ai-result-table__label">{{ item.label || "说明" }}</div>
						<div class="ai-result-table__value">{{ item.value || "-" }}</div>
					</div>
				</template>
			</div>
		</div>
	</el-dialog>

	<el-dialog v-model="quote.visible" title="报价记录" width="900px">
		<el-alert
			v-if="quote.placeholder"
			title="暂无已联动报价记录，已预留后续报价单关联入口。"
			type="info"
			show-icon
			:closable="false"
			class="mb-3"
		/>
		<el-input v-model="quote.profile" type="textarea" :rows="4" placeholder="AI供应商画像预留区域" class="mb-3" />
		<el-table :data="quote.list" border>
			<el-table-column prop="quoteNo" label="报价单号" min-width="150" />
			<el-table-column prop="supplier" label="供应商名称" min-width="160" />
			<el-table-column prop="priceExclTax" label="未税单价" min-width="120" />
			<el-table-column prop="priceInclTax" label="含税报价" min-width="120" />
			<el-table-column prop="createTime" label="报价时间" min-width="170" />
		</el-table>
	</el-dialog>
</template>

<script lang="ts" setup>
defineOptions({
	name: "company-supplier",
});

import { useCrud, useTable, useUpsert } from "@cool-vue/crud";
import { ElMessage } from "element-plus";
import { reactive, ref } from "vue";
import { useCool } from "/@/cool";
import { BaseService } from "/@/cool/service";

const { service } = useCool();
const fallback = new BaseService("admin/company/supplier") as any;

const options = {
	supplierType: [
		{ label: "临时", value: "temporary", type: "warning" },
		{ label: "正式", value: "formal", type: "success" },
	],
	supplierSource: [
		{ label: "线上-淘宝", value: "online_taobao" },
		{ label: "线上-闲鱼", value: "online_xianyu" },
		{ label: "线上-1688", value: "online_1688" },
		{ label: "线下-公司资源", value: "offline_company" },
		{ label: "线下-个人拓展", value: "offline_personal" },
	],
	infoStatus: [
		{ label: "激活", value: "active", type: "success" },
		{ label: "待激活", value: "pending", type: "warning" },
		{ label: "休眠", value: "dormant", type: "info" },
	],
	manageStatus: [
		{ label: "有效", value: "valid", type: "success" },
		{ label: "失效", value: "invalid", type: "danger" },
	],
	supplierNature: [
		{ label: "集团", value: "group" },
		{ label: "中小型企业", value: "sme" },
		{ label: "个体户", value: "individual" },
	],
	businessCategory: [
		{ label: "项目类", value: "project" },
		{ label: "机械类-保养", value: "mechanical_maintenance" },
		{ label: "机械类-维修", value: "mechanical_repair" },
		{ label: "机械类", value: "mechanical" },
		{ label: "电气类", value: "electrical" },
		{ label: "备品备件", value: "spare_parts" },
	],
	cooperationRelation: [
		{ label: "优质", value: "good", type: "success" },
		{ label: "一般", value: "normal", type: "warning" },
		{ label: "差", value: "bad", type: "danger" },
	],
};

const search = reactive({
	supplierType: undefined as string | undefined,
	supplierSource: undefined as string | undefined,
	infoStatus: undefined as string | undefined,
	manageStatus: undefined as string | undefined,
	businessCategory: undefined as string | undefined,
	cooperationRelation: undefined as string | undefined,
});

const detail = reactive({
	visible: false,
	row: {} as any,
});

const transfer = reactive({
	visible: false,
	loading: false,
	form: {} as any,
});

const ai = reactive({
	visible: false,
	title: "",
	message: "",
	prompt: "",
	baseRows: [] as Array<{ label: string; value: string }>,
	sections: [] as Array<{ title: string; rows: Array<{ label: string; value: string }> }>,
});

const quote = reactive({
	visible: false,
	profile: "",
	list: [] as any[],
	placeholder: true,
});

function supplierApi() {
	return (service as any).company?.supplier || fallback;
}

function postAction(method: string, data: any) {
	const api = supplierApi();
	if (api?.[method]) {
		return api[method](data);
	}
	return api.request({
		url: `/${method}`,
		method: "POST",
		data,
	});
}

function cleanSearch() {
	const params: any = {};
	Object.entries(search).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== "") {
			params[key] = value;
		}
	});
	return params;
}

function normalizeArray(value: any) {
	if (Array.isArray(value)) return value;
	if (!value) return [];
	if (typeof value === "string") {
		try {
			const parsed = JSON.parse(value);
			return Array.isArray(parsed) ? parsed : value.split(",").filter(Boolean);
		} catch {
			return value.split(",").filter(Boolean);
		}
	}
	return [];
}

function labelOf(list: any[], value: any) {
	return list.find(e => e.value === value)?.label || value || "-";
}

function normalizeSupplierRow(row: any) {
	const source = row || {};
	return {
		...source,
		id: source.id ?? source.a_id,
		supplierName: source.supplierName ?? source.a_supplierName ?? "",
		supplierType: source.supplierType ?? source.a_supplierType ?? "temporary",
		supplierSource: source.supplierSource ?? source.a_supplierSource ?? "",
		remark: source.remark ?? source.a_remark ?? "",
		contactName: source.contactName ?? source.a_contactName ?? "",
		contactInfo: source.contactInfo ?? source.a_contactInfo ?? "",
		infoStatus: source.infoStatus ?? source.a_infoStatus ?? "active",
		manageStatus: source.manageStatus ?? source.a_manageStatus ?? "valid",
		supplierNature: source.supplierNature ?? source.a_supplierNature,
		businessCategory: normalizeArray(source.businessCategory ?? source.a_businessCategory),
		paymentTerm: source.paymentTerm ?? source.a_paymentTerm,
		cooperationRelation: source.cooperationRelation ?? source.a_cooperationRelation,
		aiBackgroundCheck: source.aiBackgroundCheck ?? source.a_aiBackgroundCheck,
		aiSupplierProfile: source.aiSupplierProfile ?? source.a_aiSupplierProfile,
		invalidReason: source.invalidReason ?? source.a_invalidReason,
		quoteStartTime: source.quoteStartTime ?? source.a_quoteStartTime,
		lastQuoteTime: source.lastQuoteTime ?? source.a_lastQuoteTime,
		createTime: source.createTime ?? source.a_createTime,
		updateTime: source.updateTime ?? source.a_updateTime,
		createUserId: source.createUserId ?? source.a_createUserId,
		lastEditUserId: source.lastEditUserId ?? source.a_lastEditUserId,
	};
}

function normalizePageResult(res: any) {
	return {
		...res,
		list: Array.isArray(res?.list) ? res.list.map((e: any) => normalizeSupplierRow(e)) : [],
	};
}

function isFormal(scope: any) {
	return scope?.supplierType === "formal";
}

function validateSupplier(data: any) {
	const requiredBase = [
		["supplierName", "供应商名称"],
		["supplierType", "供应商类型"],
		["supplierSource", "供应商来源"],
		["contactName", "联系人"],
		["contactInfo", "联系方式"],
		["manageStatus", "管理状态"],
	];

	for (const [key, label] of requiredBase) {
		if (!data[key]) {
			ElMessage.error(`请填写${label}`);
			return false;
		}
	}

	if (data.manageStatus === "invalid" && !data.invalidReason) {
		ElMessage.error("管理状态为失效时必须填写失效原因");
		return false;
	}

	if (data.supplierType === "formal") {
		if (!data.supplierNature) {
			ElMessage.error("正式供应商必须填写供应商性质");
			return false;
		}
		if (!Array.isArray(data.businessCategory) || data.businessCategory.length === 0) {
			ElMessage.error("正式供应商必须选择业务类别");
			return false;
		}
		if (!data.cooperationRelation) {
			ElMessage.error("正式供应商必须填写合作关系");
			return false;
		}
	}

	return true;
}

const Upsert = useUpsert<any>({
	dialog: {
		width: "1000px",
	},
	props: {
		labelWidth: "130px",
	},
	items: [
		{
			label: "供应商名称",
			prop: "supplierName",
			span: 12,
			required: true,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: "供应商类型",
			prop: "supplierType",
			span: 12,
			required: true,
			value: "temporary",
			component: {
				name: "el-radio-group",
				options: options.supplierType,
			},
		},
		{
			label: "供应商来源",
			prop: "supplierSource",
			span: 12,
			required: true,
			component: {
				name: "el-select",
				options: options.supplierSource,
				props: { clearable: true },
			},
		},
		{
			label: "信息状态",
			prop: "infoStatus",
			span: 12,
			required: true,
			value: "active",
			component: {
				name: "el-select",
				options: options.infoStatus,
				props: { clearable: false },
			},
		},
		{
			label: "联系人",
			prop: "contactName",
			span: 12,
			required: true,
			component: { name: "el-input", props: { clearable: true } },
		},
		{
			label: "联系方式",
			prop: "contactInfo",
			span: 12,
			required: true,
			component: { name: "el-input", props: { clearable: true, placeholder: "电话、微信优先" } },
		},
		{
			label: "管理状态",
			prop: "manageStatus",
			span: 12,
			required: true,
			value: "valid",
			component: {
				name: "el-select",
				options: options.manageStatus,
				props: { clearable: false },
			},
		},
		{
			label: "失效原因",
			prop: "invalidReason",
			span: 12,
			component: { name: "el-input", props: { clearable: true } },
			hidden: ({ scope }: any) => scope.manageStatus !== "invalid",
		},
		{
			label: "备注",
			prop: "remark",
			span: 24,
			component: { name: "el-input", props: { type: "textarea", rows: 3, clearable: true } },
		},
		{
			label: "供应商性质",
			prop: "supplierNature",
			span: 12,
			required: true,
			component: {
				name: "el-select",
				options: options.supplierNature,
				props: { clearable: true },
			},
			hidden: ({ scope }: any) => !isFormal(scope),
		},
		{
			label: "业务类别",
			prop: "businessCategory",
			span: 12,
			required: true,
			component: {
				name: "el-select",
				options: options.businessCategory,
				props: { multiple: true, clearable: true },
			},
			hidden: ({ scope }: any) => !isFormal(scope),
		},
		{
			label: "账期(天)",
			prop: "paymentTerm",
			span: 12,
			component: { name: "el-input-number", props: { min: 0, controls: false } },
			hidden: ({ scope }: any) => !isFormal(scope),
		},
		{
			label: "合作关系",
			prop: "cooperationRelation",
			span: 12,
			required: true,
			value: "normal",
			component: {
				name: "el-select",
				options: options.cooperationRelation,
				props: { clearable: false },
			},
			hidden: ({ scope }: any) => !isFormal(scope),
		},
		{
			label: "AI背调",
			prop: "aiBackgroundCheck",
			span: 24,
			component: { name: "el-input", props: { type: "textarea", rows: 5, clearable: true } },
			hidden: ({ scope }: any) => !isFormal(scope),
		},
		{
			label: "AI供应商画像",
			prop: "aiSupplierProfile",
			span: 24,
			component: { name: "el-input", props: { type: "textarea", rows: 4, clearable: true } },
			hidden: ({ scope }: any) => !isFormal(scope),
		},
	],
	onOpened(data) {
		if (Upsert.value?.mode === "add") {
			data.supplierType = data.supplierType || "temporary";
			data.infoStatus = data.infoStatus || "active";
			data.manageStatus = data.manageStatus || "valid";
			data.cooperationRelation = data.cooperationRelation || "normal";
		}
		data.businessCategory = normalizeArray(data.businessCategory);
	},
	onSubmit(data, { next, done }) {
		if (!validateSupplier(data)) {
			done();
			return;
		}
		const payload = { ...data };
		delete payload.createTime;
		delete payload.updateTime;
		delete payload.createUserId;
		delete payload.lastEditUserId;
		next(payload);
	},
});

const Table = useTable<any>({
	columns: [
		{ type: "selection", width: 60 },
		{ label: "供应商名称", prop: "supplierName", minWidth: 180 },
		{ label: "供应商类型", prop: "supplierType", minWidth: 110, dict: options.supplierType },
		{ label: "供应商来源", prop: "supplierSource", minWidth: 140, dict: options.supplierSource },
		{ label: "信息状态", prop: "infoStatus", minWidth: 110, dict: options.infoStatus },
		{ label: "管理状态", prop: "manageStatus", minWidth: 110, dict: options.manageStatus },
		{ label: "联系人", prop: "contactName", minWidth: 120 },
		{ label: "联系方式", prop: "contactInfo", minWidth: 150 },
		{ label: "业务类别", prop: "businessCategory", minWidth: 220 },
		{ label: "合作关系", prop: "cooperationRelation", minWidth: 110, dict: options.cooperationRelation },
		{ label: "账期(天)", prop: "paymentTerm", minWidth: 100 },
		{ label: "最近报价时间", prop: "lastQuoteTime", minWidth: 170, component: { name: "cl-date-text" } },
		{ label: "创建时间", prop: "createTime", minWidth: 170, sortable: "desc", component: { name: "cl-date-text" } },
		{ label: "更新时间", prop: "updateTime", minWidth: 170, sortable: "custom", component: { name: "cl-date-text" } },
		{ label: "供应商操作", prop: "supplierActions", minWidth: 360, fixed: "right" },
		{ type: "op", buttons: ["edit", "delete"], width: 170, fixed: "right" },
	],
});

const supplierCrudService = {
	page(params: any) {
		return supplierApi()
			.page({ ...params, ...cleanSearch() })
			.then((res: any) => normalizePageResult(res));
	},
	list(params: any) {
		return supplierApi()
			.list(params)
			.then((res: any) => (Array.isArray(res) ? res.map(e => normalizeSupplierRow(e)) : res));
	},
	info(params: any) {
		return supplierApi()
			.info(params)
			.then((res: any) => normalizeSupplierRow(res));
	},
	add(params: any) {
		return supplierApi().add(params);
	},
	update(params: any) {
		return supplierApi().update(params);
	},
	delete(params: any) {
		return supplierApi().delete(params);
	},
};

const Crud = useCrud(
	{
		service: supplierCrudService,
	},
	app => {
		app.refresh();
	}
);

function refresh(params?: any) {
	Crud.value?.refresh(params);
}

function openDetail(row: any) {
	detail.row = normalizeSupplierRow(row);
	detail.visible = true;
}

function openTransfer(row: any) {
	const target = normalizeSupplierRow(row);
	transfer.form = {
		...target,
		supplierType: "formal",
		businessCategory: normalizeArray(target.businessCategory),
		cooperationRelation: target.cooperationRelation || "normal",
	};
	transfer.visible = true;
}

async function submitTransfer() {
	if (!validateSupplier({ ...transfer.form, supplierType: "formal" })) return;
	transfer.loading = true;
	try {
		await postAction("transfer", transfer.form);
		ElMessage.success("转正成功");
		transfer.visible = false;
		refresh();
	} catch (err: any) {
		ElMessage.error(err?.message || "转正失败");
	} finally {
		transfer.loading = false;
	}
}

function cleanAiText(text: any) {
	if (text === undefined || text === null) return "";
	if (typeof text === "object") {
		text = Object.entries(text)
			.map(([key, value]) => `${key}：${typeof value === "object" ? cleanAiText(value) : value}`)
			.join("\n");
	}

	return String(text)
		.replace(/\\n/g, "\n")
		.replace(/\\r/g, "\n")
		.replace(/\\"/g, '"')
		.replace(/```json/gi, "")
		.replace(/```/g, "")
		.replace(/`/g, "")
		.replace(/\*\*/g, "")
		.replace(/#/g, "")
		.replace(/\[object Object\]/g, "")
		.replace(/[{}\[\]]/g, "")
		.replace(/"/g, "")
		.split("\n")
		.map(line =>
			line
				.replace(/^\s*[-*•·]\s*/, "")
				.replace(/^\s*([^：:\n]+)\s*:\s*/, "$1：")
				.replace(/,$/, "")
				.trim()
		)
		.filter(Boolean)
		.join("\n")
		.replace(/\n{2,}/g, "\n")
		.trim();
}

function parseMaybeJson(value: any) {
	if (typeof value !== "string") return value;
	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
}

function normalizeAiResponse(res: any) {
	const prompt = parseMaybeJson(res?.prompt);
	const data = parseMaybeJson(res?.data) || (typeof prompt === "object" ? prompt : undefined);
	const result = parseMaybeJson(data?.result ?? data ?? prompt);

	if (result?.rawText) {
		return {
			snapshot: data?.supplierSnapshot || {},
			quoteRecordNote: data?.quoteRecordNote || "",
			result: { rawText: cleanAiText(result.rawText) },
		};
	}

	if (typeof result === "string") {
		return {
			snapshot: data?.supplierSnapshot || {},
			quoteRecordNote: data?.quoteRecordNote || "",
			result: { rawText: cleanAiText(result) },
		};
	}

	return {
		snapshot: data?.supplierSnapshot || {},
		quoteRecordNote: data?.quoteRecordNote || "",
		result: result && typeof result === "object" ? result : { rawText: cleanAiText(res) },
	};
}

function formatAiValue(key: string, value: any) {
	if (key === "supplierType") return labelOf(options.supplierType, value);
	if (key === "supplierSource") return labelOf(options.supplierSource, value);
	if (key === "supplierNature") return labelOf(options.supplierNature, value);
	if (key === "cooperationRelation") return labelOf(options.cooperationRelation, value);
	if (key === "managementStatus" || key === "manageStatus") return labelOf(options.manageStatus, value);
	if (key === "businessCategory") {
		const values = Array.isArray(value) ? value : String(value || "").split(",").filter(Boolean);
		return values.map(item => labelOf(options.businessCategory, item)).join("、");
	}
	if (key === "paymentTerm" && value !== undefined && value !== null && value !== "") return `${value}天`;
	return cleanAiText(value) || "-";
}

function buildAiRows(source: any, fields: Array<[string, string]>) {
	return fields.map(([label, key]) => ({
		label,
		value: formatAiValue(key, source?.[key]),
	}));
}

function splitLabelValue(line: string) {
	const indexList = [line.indexOf("："), line.indexOf(":")].filter(index => index >= 0);
	const splitIndex = indexList.length ? Math.min(...indexList) : -1;
	if (splitIndex < 0) return null;

	const label = cleanAiText(line.slice(0, splitIndex));
	const value = cleanAiText(line.slice(splitIndex + 1));
	if (!label || !value) return null;
	return { label, value };
}

function parseAiTextToSections(text: string) {
	const cleaned = cleanAiText(text);
	const lines = cleaned
		.split("\n")
		.map(line => line.trim())
		.filter(Boolean);
	const sections: Array<{ title: string; rows: Array<{ label: string; value: string }> }> = [];
	let current: { title: string; rows: Array<{ label: string; value: string }> } | null = null;
	const titlePattern = /^[一二三四五六七八九十]+[、.．]\s*.+$/;

	const ensureCurrent = () => {
		if (!current) {
			current = { title: "AI分析结果", rows: [] };
			sections.push(current);
		}
		return current;
	};

	for (const line of lines) {
		if (titlePattern.test(line)) {
			const titleRow = splitLabelValue(line);
			current = {
				title: titleRow ? cleanAiText(line.slice(0, line.indexOf("：") >= 0 ? line.indexOf("：") : line.indexOf(":"))) : cleanAiText(line),
				rows: [],
			};
			sections.push(current);
			if (titleRow) {
				current.rows.push({ label: "说明", value: titleRow.value });
			}
			continue;
		}

		const section = ensureCurrent();
		const row = splitLabelValue(line);
		if (row) {
			section.rows.push(row);
			continue;
		}

		const last = section.rows[section.rows.length - 1];
		if (last) {
			last.value = cleanAiText(`${last.value}\n${line}`);
		} else {
			section.rows.push({ label: "说明", value: cleanAiText(line) });
		}
	}

	if (!sections.length) {
		return [{ title: "AI分析结果", rows: [{ label: "说明", value: cleaned || "-" }] }];
	}

	sections.forEach(section => {
		if (!section.rows.length) {
			section.rows.push({ label: "说明", value: "-" });
		}
	});
	return sections;
}

function buildAiResultSections(result: any, fields: Array<[string, string]>, title: string) {
	if (result?.rawText || typeof result === "string") {
		return parseAiTextToSections(result?.rawText || result);
	}

	const rows = fields
		.filter(([, key]) => result?.[key] !== undefined && result?.[key] !== null && result?.[key] !== "")
		.map(([label, key]) => ({ label, value: cleanAiText(result[key]) }));

	return rows.length
		? [{ title, rows }]
		: parseAiTextToSections(cleanAiText(result));
}

async function openAiBackground(row: any) {
	try {
		const target = normalizeSupplierRow(row);
		const res = await postAction("aiBackgroundCheck", { id: target.id });
		const normalized = normalizeAiResponse(res);
		const snapshot = { ...target, ...normalized.snapshot };
		ai.title = `AI背调 - ${snapshot.supplierName || target.supplierName || "-"}`;
		ai.message = res?.message || "AI接口暂未配置";
		ai.prompt = cleanAiText(normalized.result?.rawText || normalized.result);
		ai.baseRows = buildAiRows(snapshot, [
			["供应商名称", "supplierName"],
			["供应商类型", "supplierType"],
			["供应商来源", "supplierSource"],
			["联系人", "contactName"],
			["联系方式", "contactInfo"],
			["供应商性质", "supplierNature"],
			["业务类别", "businessCategory"],
			["账期", "paymentTerm"],
			["合作关系", "cooperationRelation"],
			["管理状态", "managementStatus"],
		]);
		ai.sections = buildAiResultSections(
			normalized.result,
			[
				["经营范围", "businessScope"],
				["成立时间", "establishTime"],
				["注册资金", "registeredCapital"],
				["注册地址", "address"],
				["风险提示", "riskWarning"],
				["历史项目", "historicalProjects"],
				["社保人数", "socialSecurityCount"],
				["主体合法性", "legitimacyCheck"],
				["经营状况", "operationCheck"],
				["履约能力", "deliveryAbilityCheck"],
				["综合结论", "conclusion"],
			],
			"AI背调结果"
		);
		ai.visible = true;
	} catch (err: any) {
		ElMessage.error(err?.message || "AI背调占位接口调用失败");
	}
}

async function openAiProfile(row: any) {
	try {
		const target = normalizeSupplierRow(row);
		const res = await postAction("aiSupplierProfile", { id: target.id });
		const normalized = normalizeAiResponse(res);
		const snapshot = { ...target, ...normalized.snapshot };
		ai.title = `AI供应商画像 - ${snapshot.supplierName || target.supplierName || "-"}`;
		ai.message = res?.message || "AI接口暂未配置";
		ai.prompt = cleanAiText(normalized.result?.rawText || normalized.result);
		ai.baseRows = buildAiRows(
			{
				...snapshot,
				quoteRecordNote: normalized.quoteRecordNote,
			},
			[
				["供应商名称", "supplierName"],
				["供应商类型", "supplierType"],
				["供应商来源", "supplierSource"],
				["供应商性质", "supplierNature"],
				["业务类别", "businessCategory"],
				["账期", "paymentTerm"],
				["合作关系", "cooperationRelation"],
				["管理状态", "managementStatus"],
				["报价记录说明", "quoteRecordNote"],
			]
		);
		ai.sections = buildAiResultSections(
			normalized.result,
			[
				["主营品类", "mainCategories"],
				["报价特点", "priceFeature"],
				["质量表现", "qualityFeature"],
				["质保特点", "warrantyFeature"],
				["合作建议", "cooperationAdvice"],
				["风险提示", "riskWarning"],
				["供应商画像", "supplierPortrait"],
			],
			"AI供应商画像结果"
		);
		ai.visible = true;
	} catch (err: any) {
		ElMessage.error(err?.message || "AI画像占位接口调用失败");
	}
}

async function openQuoteRecords(row: any) {
	try {
		const target = normalizeSupplierRow(row);
		const res = await postAction("quoteRecords", { id: target.id });
		quote.profile = res?.aiSupplierProfile || "";
		quote.list = res?.list || [];
		quote.placeholder = Boolean(res?.placeholder);
		quote.visible = true;
	} catch (err: any) {
		ElMessage.error(err?.message || "报价记录加载失败");
	}
}
</script>

<style lang="scss" scoped>
.tag-list,
.supplier-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.pre-line {
	white-space: pre-wrap;
	word-break: break-word;
}

.ai-result-dialog {
	display: flex;
	flex-direction: column;
	gap: 14px;
}

.ai-result-dialog__table {
	flex-shrink: 0;
}

.ai-result-dialog__text {
	line-height: 20px;
	white-space: pre-wrap;
	word-break: break-word;
	text-align: left;
}

.ai-result-dialog :deep(.el-descriptions__label) {
	font-weight: 600;
}

.ai-result-table {
	border: 1px solid var(--el-border-color);
	border-bottom: 0;
}

.ai-result-table__section {
	padding: 10px 12px;
	background: var(--el-fill-color-light);
	border-bottom: 1px solid var(--el-border-color);
	font-weight: 600;
	line-height: 20px;
}

.ai-result-table__row {
	display: grid;
	grid-template-columns: 170px minmax(0, 1fr);
	border-bottom: 1px solid var(--el-border-color);
}

.ai-result-table__label {
	padding: 10px 12px;
	background: var(--el-fill-color-lighter);
	border-right: 1px solid var(--el-border-color);
	font-weight: 600;
	line-height: 20px;
	word-break: break-word;
}

.ai-result-table__value {
	padding: 10px 12px;
	background: #fff;
	line-height: 20px;
	white-space: pre-wrap;
	word-break: break-word;
}

.mb-3 {
	margin-bottom: 12px;
}

.w-full {
	width: 100%;
}
</style>
