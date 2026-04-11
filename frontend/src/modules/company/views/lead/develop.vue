<template>
	<cl-crud ref="Crud">
		<cl-row>
			<cl-refresh-btn />
			<cl-add-btn />
			<cl-multi-delete-btn />
			<cl-flex1 />
			<el-select
				v-model="searchStatus"
				:placeholder="$t('线索状态')"
				clearable
				style="width: 140px"
				@change="onSearchStatusChange"
			>
				<el-option :label="$t('全部')" :value="undefined" />
				<el-option :label="$t('进行中')" value="01" />
				<el-option :label="$t('结果态')" value="23" />
			</el-select>
			<cl-search-key :placeholder="$t('搜索线索编号/线索题目/线索详情')" :width="300" />
		</cl-row>

		<cl-row>
			<cl-table ref="Table">
				<template #column-leadDetail="{ scope }">
					<div class="lead-text">{{ scope.row.leadDetail || '-' }}</div>
				</template>

				<template #column-aiAnalysis="{ scope }">
					<div class="lead-text">{{ scope.row.aiAnalysis || '-' }}</div>
				</template>

				<template #column-leadAction="{ scope }">
					<div class="lead-actions">
						<el-button
							v-if="[0, 1].includes(Number(scope.row.leadStatus))"
							size="small"
							type="success"
							plain
							@click="onToSuccess(scope.row)"
						>
							{{ $t('转化成功') }}
						</el-button>
						<el-button
							v-if="[0, 1].includes(Number(scope.row.leadStatus))"
							size="small"
							type="warning"
							plain
							@click="onToDiscard(scope.row)"
						>
							{{ $t('已放弃') }}
						</el-button>
					</div>
				</template>
			</cl-table>
		</cl-row>

		<cl-row>
			<cl-flex1 />
			<cl-pagination />
		</cl-row>

		<cl-upsert ref="Upsert">
			<template #slot-ai-analyze>
				<div class="ai-analyze-wrapper">
					<el-button
						type="primary"
						size="small"
						:loading="loadingMap.isLoading('ai-analyze')"
						@click="onDifyAnalyze"
					>
						{{ $t('AI分析') }}
					</el-button>
				</div>
			</template>
		</cl-upsert>
	</cl-crud>

	<el-dialog v-model="analysisDialog.visible" :title="analysisDialog.title" width="760px">
		<el-input v-model="analysisDialog.content" type="textarea" :rows="16" readonly />
	</el-dialog>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'company-lead-develop'
});

import { useCrud, useTable, useUpsert } from '@cool-vue/crud';
import { ElMessage, ElMessageBox } from 'element-plus';
import { reactive, ref, defineComponent, h } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCool } from '/@/cool';
import { useAsyncLoading } from '/@/composables/useAsyncLoading';
import { useDifyApi } from '../../api/dify';

const { service } = useCool();
const { t } = useI18n();

const leadApi = (service as any).company?.lead;
const difyApi = useDifyApi();

const loadingMap = useAsyncLoading();

const searchStatus = ref<string | undefined>();

const statusOptions = [
	{ label: t('待跟进'), value: 0, type: 'info' },
	{ label: t('跟进中'), value: 1, type: 'warning' },
	{ label: t('转化成功'), value: 2, type: 'success' },
	{ label: t('已放弃'), value: 3, type: 'danger' }
];

const developStatusOptions = statusOptions.filter(e => [0, 1, 2, 3].includes(e.value));

const analysisDialog = reactive({
	visible: false,
	title: t('AI线索分析'),
	content: ''
});

function emptyPage(params?: any) {
	return {
		list: [],
		pagination: {
			total: 0,
			page: Number(params?.page || 1),
			size: Number(params?.size || 20)
		}
	};
}

function normalizeDevelopStatus(status: any) {
	const statusNum = Number(status);
	return [0, 1, 2, 3].includes(statusNum) ? statusNum : 0;
}

function normalizeLeadRow(row: any) {
	const source = row || {};
	return {
		...source,
		id: source.id ?? source.a_id,
		leadNo: source.leadNo ?? source.a_leadNo ?? '',
		leadTitle: source.leadTitle ?? source.a_leadTitle ?? '',
		leadDetail: source.leadDetail ?? source.a_leadDetail ?? '',
		leadStatus: Number(source.leadStatus ?? source.a_leadStatus ?? 0),
		aiAnalysis: source.aiAnalysis ?? source.a_aiAnalysis ?? '',
		ownerName: source.ownerName ?? source.a_ownerName ?? '',
		lastEditName: source.lastEditName ?? source.a_lastEditName ?? '',
		createTime: source.createTime ?? source.a_createTime,
		updateTime: source.updateTime ?? source.a_updateTime
	};
}

function normalizePageResult(res: any, params?: any) {
	const base = emptyPage(params);
	return {
		...base,
		...res,
		list: Array.isArray(res?.list) ? res.list.map((e: any) => normalizeLeadRow(e)) : [],
		pagination: res?.pagination || base.pagination
	};
}

function ensureLeadApi() {
	if (!leadApi) {
		ElMessage.error(t('线索服务未就绪，请刷新页面后重试'));
		return null;
	}
	return leadApi;
}

const developCrudService = {
	async page(params: any) {
		const api = ensureLeadApi();
		if (!api) return Promise.resolve(emptyPage(params));
		const res = await api.page(params);
		return normalizePageResult(res, params);
	},
	list(params: any) {
		const api = ensureLeadApi();
		return api ? api.list(params) : Promise.resolve([]);
	},
	info(params: any) {
		const api = ensureLeadApi();
		return api ? api.info(params) : Promise.resolve({});
	},
	add(params: any) {
		const api = ensureLeadApi();
		if (!api) return Promise.resolve();
		return api.add({
			...params,
			leadStatus: normalizeDevelopStatus(params?.leadStatus)
		});
	},
	update(params: any) {
		const api = ensureLeadApi();
		if (!api) return Promise.resolve();
		return api.update({
			...params,
			leadStatus: normalizeDevelopStatus(params?.leadStatus)
		});
	},
	delete(params: any) {
		const api = ensureLeadApi();
		return api ? api.delete(params) : Promise.resolve();
	}
};

const Upsert = useUpsert<any>({
	dialog: {
		width: '900px'
	},
	props: {
		labelWidth: '110px'
	},
	items: [
		{
			label: t('线索编号'),
			prop: 'leadNo',
			span: 12,
			required: true,
			component: {
				name: 'el-input',
				props: {
					clearable: true
				}
			}
		},
		{
			label: t('线索题目'),
			prop: 'leadTitle',
			span: 12,
			required: true,
			component: {
				name: 'el-input',
				props: {
					clearable: true
				}
			}
		},
		{
			label: t('线索状态'),
			prop: 'leadStatus',
			span: 12,
			required: true,
			component: {
				name: 'el-select',
				options: developStatusOptions,
				props: {
					clearable: false
				}
			}
		},
		{
			label: t('负责人'),
			prop: 'ownerName',
			span: 12,
			component: {
				name: 'el-input',
				props: {
					clearable: true
				}
			}
		},
		{
			label: t('线索详情'),
			prop: 'leadDetail',
			span: 24,
			required: true,
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
			label: t('AI线索分析'),
			prop: 'aiAnalysis',
			span: 24,
			component: {
				name: 'el-input',
				props: {
					type: 'textarea',
					rows: 8,
					clearable: true
				}
			}
		},
		{
			label: ' ',
			prop: 'aiAnalyzeAction',
			span: 24,
			component: {
				name: 'slot-ai-analyze'
			}
		}
	],
	onOpened(data) {
		if (data && (!data.id || Upsert.value?.mode === 'add')) {
			data.leadStatus = normalizeDevelopStatus(data?.leadStatus);
		}
	},
	onSubmit(data, { next }) {
		const payload = {
			...data,
			leadStatus: normalizeDevelopStatus(data?.leadStatus)
		};

		delete payload.createTime;
		delete payload.updateTime;
		delete payload.ownerUserId;
		delete payload.lastEditUserId;
		delete payload.lastEditName;

		next(payload);
	}
});

const Table = useTable<any>({
	columns: [
		{ type: 'selection', width: 60 },
		{ label: t('线索编号'), prop: 'leadNo', minWidth: 160 },
		{ label: t('线索题目'), prop: 'leadTitle', minWidth: 180 },
		{ label: t('线索详情'), prop: 'leadDetail', minWidth: 220 },
		{
			label: t('线索状态'),
			prop: 'leadStatus',
			minWidth: 120,
			dict: statusOptions
		},
		{ label: t('AI线索分析'), prop: 'aiAnalysis', minWidth: 260 },
		{ label: t('负责人'), prop: 'ownerName', minWidth: 120 },
		{ label: t('最后编辑人'), prop: 'lastEditName', minWidth: 120 },
		{
			label: t('建立时间'),
			prop: 'createTime',
			minWidth: 170,
			sortable: 'desc',
			component: { name: 'cl-date-text' }
		},
		{
			label: t('最后编辑时间'),
			prop: 'updateTime',
			minWidth: 170,
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
		service: developCrudService
	},
	app => {
		app.refresh();
	}
);

function refresh(params?: any) {
	Crud.value?.refresh(params);
}

function onSearchStatusChange(val: string | undefined) {
	const params: any = { page: 1 };

	if (val === '01') {
		params.leadStatuses = [0, 1];
	} else if (val === '23') {
		params.leadStatuses = [2, 3];
	}

	refresh(params);
}

async function onToSuccess(row: any) {
	const target = normalizeLeadRow(row);
	const idNum = Number(target.id);
	if (!Number.isFinite(idNum) || idNum <= 0) {
		ElMessage.error(t('缺少/无效的线索ID'));
		return;
	}

	const api = ensureLeadApi();
	if (!api) return;

	try {
		await ElMessageBox.confirm(t('确认将该线索标记为转化成功吗？'), t('提示'), {
			type: 'warning'
		});
		await api.toSuccess({ id: idNum });
		ElMessage.success(t('已更新为转化成功'));
		refresh();
	} catch (err: any) {
		if (err === 'cancel' || err === 'close') return;
		ElMessage.error(err?.message || t('操作失败'));
	}
}

async function onToDiscard(row: any) {
	const target = normalizeLeadRow(row);
	const idNum = Number(target.id);
	if (!Number.isFinite(idNum) || idNum <= 0) {
		ElMessage.error(t('缺少/无效的线索ID'));
		return;
	}

	const api = ensureLeadApi();
	if (!api) return;

	try {
		await ElMessageBox.confirm(t('确认将该线索标记为已放弃吗？'), t('提示'), {
			type: 'warning'
		});
		await api.toDiscard({ id: idNum });
		ElMessage.success(t('已更新为已放弃'));
		refresh();
	} catch (err: any) {
		if (err === 'cancel' || err === 'close') return;
		ElMessage.error(err?.message || t('操作失败'));
	}
}

async function onDifyAnalyze() {
	const form = Upsert.value?.form;
	if (!form) {
		ElMessage.error(t('表单数据不可用'));
		return;
	}

	const title = String(form.leadTitle || '').trim();
	const detail = String(form.leadDetail || '').trim();

	if (!title || !detail) {
		ElMessage.error(t('线索题目和详情均为必填项'));
		return;
	}

	if (!difyApi) {
		ElMessage.error(t('Dify服务未就绪，请刷新页面后重试'));
		return;
	}

	await loadingMap.runWithLoading(
		'ai-analyze',
		async () => {

			const res = await difyApi.analyzeLead({ title, detail });


			if (!res) {
				throw new Error('AI分析失败');
			}
			let analysisResult = '';
			analysisResult = res.text || JSON.stringify(res, null, 2);


			Upsert.value?.setForm('aiAnalysis', analysisResult);

			ElMessage.success('AI分析完成');

		},
		{
			loadingText: '正在调用AI分析，请稍候...',
			errorText: 'AI分析失败'
		}
	);
}
</script>

<style lang="scss" scoped>
.lead-text {
	line-height: 18px;
	white-space: pre-wrap;
	word-break: break-word;
}

.lead-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.ai-analyze-wrapper {
	display: flex;
	justify-content: flex-end;
	padding-top: 10px;
}
</style>
