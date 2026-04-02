<template>
	<ContractReviewAgent />
	<div class="company-contract">
		<el-card class="company-contract__form-card" shadow="never">
			<template #header>
				<span>{{ $t('生成合同') }}</span>
			</template>

			<el-form
				ref="FormRef"
				:model="form"
				:rules="rules"
				label-width="100px"
				class="company-contract__form"
			>
				<el-form-item :label="$t('合同名称')" prop="contractName">
					<el-input v-model="form.contractName" clearable :placeholder="$t('请输入合同名称')" />
				</el-form-item>
				<el-form-item :label="$t('客户名称')" prop="customerName">
					<el-input v-model="form.customerName" clearable :placeholder="$t('请输入客户名称')" />
				</el-form-item>
				<el-form-item :label="$t('合同金额')" prop="amount">
					<el-input-number
						v-model="form.amount"
						class="company-contract__amount"
						:min="0"
						:precision="2"
						:step="0.01"
						:placeholder="$t('请输入合同金额')"
						controls-position="right"
					/>
				</el-form-item>
				<el-form-item :label="$t('合同类型')" prop="contractType">
					<el-select
						v-model="form.contractType"
						class="w-full"
						clearable
						:placeholder="$t('请选择合同类型')"
					>
						<el-option
							v-for="item in contractTypeOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
				</el-form-item>
				<el-form-item :label="$t('合同细节')" prop="contractDetails">
					<el-input
						v-model="form.contractDetails"
						type="textarea"
						:rows="6"
						:placeholder="$t('补充说明、条款要点等')"
					/>
				</el-form-item>
				<el-form-item>
					<el-button type="primary" :loading="generating" @click="onGenerate">
						{{ $t('生成合同') }}
					</el-button>
				</el-form-item>
			</el-form>
		</el-card>

		<el-card v-if="lastFileUrl || previewLoading" class="company-contract__preview-card" shadow="never">
			<template #header>
				<div class="company-contract__preview-header">
					<span>{{ $t('预览') }}</span>
					<div>
						<el-button
							type="primary"
							link
							:disabled="!lastFileUrl"
							@click="onDownload"
						>
							{{ $t('下载 Word') }}
						</el-button>
					</div>
				</div>
			</template>
			<div v-loading="previewLoading" class="company-contract__preview-body">
				<div ref="previewRef" class="company-contract__preview-mount" />
			</div>
		</el-card>
	</div>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'company-contract'
});

import { ref, reactive } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { renderAsync } from 'docx-preview';
import { saveAs } from 'file-saver';
import { request } from '/@/cool/service/request';
import { config } from '/@/config';
import { useBase } from '/$/base';
import { useI18n } from 'vue-i18n';
import { useCool } from '/@/cool';
import ContractReviewAgent from './contract_review_agent.vue';

const { t } = useI18n();
const { user } = useBase();
const { route } = useCool();

const FormRef = ref<FormInstance>();
const previewRef = ref<HTMLElement | null>(null);

const contractTypeOptions = [
	// 给 Dify 的输入是“英文枚举码”，展示仍是中文
	{ label: t('本体'), value: 'core' },
	{ label: t('维保'), value: 'maintenance' },
	{ label: t('调试'), value: 'debug' }
];

const form = reactive({
	contractName: '',
	customerName: '',
	amount: undefined as number | undefined,
	contractType: '' as string,
	contractDetails: ''
});

// 从报价页“转合同”跳转过来时，回填关键信息（不自动带入 contractType）
const q = route.query as Record<string, any>;
if (q.contractName) {
	form.contractName = String(q.contractName);
}
if (q.customerName) {
	form.customerName = String(q.customerName);
}
if (q.amount !== undefined && q.amount !== null && q.amount !== '') {
	const n = Number(q.amount);
	form.amount = Number.isFinite(n) ? n : undefined;
}
if (q.contractDetails) {
	form.contractDetails = String(q.contractDetails);
}

const rules: FormRules = {
	contractName: [{ required: true, message: () => t('请输入合同名称'), trigger: 'blur' }],
	customerName: [{ required: true, message: () => t('请输入客户名称'), trigger: 'blur' }],
	amount: [
		{
			required: true,
			message: () => t('请输入合同金额'),
			trigger: 'change'
		},
		{
			type: 'number',
			min: 0,
			message: () => t('合同金额须为非负数字'),
			trigger: 'change'
		}
	],
	contractType: [{ required: true, message: () => t('请选择合同类型'), trigger: 'change' }],
	contractDetails: [{ required: true, message: () => t('请填写合同细节'), trigger: 'blur' }]
};

const generating = ref(false);
const previewLoading = ref(false);
const lastFileUrl = ref('');

function apiUrl(path: string) {
	return `${config.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

async function fetchDocxBuffer(fileUrl: string): Promise<ArrayBuffer> {
	const q = encodeURIComponent(fileUrl);
	const res = await fetch(apiUrl(`/admin/company/contract/download?path=${q}`), {
		headers: {
			Authorization: user.token || ''
		}
	});
	if (!res.ok) {
		const err = await res.text();
		throw new Error(err || res.statusText);
	}
	return res.arrayBuffer();
}

async function loadPreview(fileUrl: string) {
	previewLoading.value = true;
	try {
		const buf = await fetchDocxBuffer(fileUrl);
		const el = previewRef.value;
		if (el) {
			el.innerHTML = '';
			await renderAsync(buf, el);
		}
	} finally {
		previewLoading.value = false;
	}
}

async function pollTask(taskId: string): Promise<string> {
	const deadline = Date.now() + 120_000;
	while (Date.now() < deadline) {
		const res = (await request({
			url: apiUrl('/admin/company/contract/poll'),
			method: 'get',
			params: { taskId }
		} as any)) as {
			status: string;
			fileUrl?: string;
			message?: string;
		};

		if (res.status === 'ready' && res.fileUrl) {
			return res.fileUrl;
		}
		if (res.status === 'failed') {
			throw new Error(res.message || t('生成失败'));
		}
		if (res.status === 'unknown') {
			throw new Error(res.message || t('任务不存在'));
		}
		await new Promise(r => setTimeout(r, 1000));
	}
	throw new Error(t('生成超时，请稍后重试'));
}

async function onGenerate() {
	await FormRef.value?.validate().catch(() => Promise.reject());
	generating.value = true;
	lastFileUrl.value = '';
	if (previewRef.value) {
		previewRef.value.innerHTML = '';
	}
	try {
		const { taskId } = (await request({
			url: apiUrl('/admin/company/contract/generate'),
			method: 'post',
			data: { ...form },
			timeout: 130000
		})) as { taskId: string };

		ElMessage.info(t('已提交生成任务，请稍候…'));
		const fileUrl = await pollTask(taskId);
		lastFileUrl.value = fileUrl;
		await loadPreview(fileUrl);
		ElMessage.success(t('合同已生成'));
	} catch (e: any) {
		ElMessage.error(e?.message || t('操作失败'));
	} finally {
		generating.value = false;
	}
}

async function onDownload() {
	if (!lastFileUrl.value) {
		return;
	}
	try {
		const buf = await fetchDocxBuffer(lastFileUrl.value);
		const name =
			(form.contractName || 'contract').replace(/[/\\?%*:|"<>]/g, '_') + '.docx';
		saveAs(new Blob([buf]), name);
	} catch (e: any) {
		ElMessage.error(e?.message || t('下载失败'));
	}
}
</script>

<style scoped lang="scss">
.company-contract {
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 16px;
	box-sizing: border-box;
	height: 100%;
	min-height: 0;
	overflow-x: hidden;
	overflow-y: auto;

	&__form-card {
		width: 100%;
		flex-shrink: 0;
	}

	&__form {
		width: 100%;
	}

	&__amount {
		width: 100%;
	}

	&__preview-card {
		flex-shrink: 0;
		min-height: 320px;
	}

	&__preview-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	&__preview-body {
		min-height: 400px;
	}

	&__preview-mount {
		min-height: 360px;
		overflow: visible;
		padding: 8px;
		background: var(--el-fill-color-blank);
		border-radius: 4px;
	}
}
</style>
