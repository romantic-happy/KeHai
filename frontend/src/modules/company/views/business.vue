<template>
	<div class="company-business">
		

		<div v-if="showProgress" class="company-business__stats">
			<div class="company-business__stats-grid">
				<el-card shadow="hover">
					<div class="company-business__card-title">{{ $t('待报价') }}</div>
					<div class="company-business__card-value">{{ pendingCount }}</div>
				</el-card>
				<el-card shadow="hover">
					<div class="company-business__card-title">{{ $t('报价中') }}</div>
					<div class="company-business__card-value">{{ inProgressCount }}</div>
				</el-card>
				<el-card shadow="hover">
					<div class="company-business__card-title">{{ $t('报价已定') }}</div>
					<div class="company-business__card-value">{{ acceptedCount }}</div>
				</el-card>
			</div>
		</div>

		<template v-if="showProgress">
			<el-table
				:data="rows"
				class="company-business__table"
				size="small"
				border
				:header-cell-style="{ padding: '8px 12px' }"
			>
				<el-table-column prop="inquiryNo" :label="$t('询价单号')" min-width="160" />
				<el-table-column prop="quoteNo" :label="$t('报价单号')" min-width="160">
					<template #default="{ row }">
						<span v-if="row.quoteNo">{{ row.quoteNo }}</span>
						<span v-else>-</span>
					</template>
				</el-table-column>
				<el-table-column prop="customer" :label="$t('客户')" min-width="180" />
				<el-table-column prop="projectName" :label="$t('项目名称')" min-width="200" />
				<el-table-column prop="createUserName" :label="$t('负责人')" min-width="120">
					<template #default="{ row }">
						<span v-if="row.createUserName">{{ row.createUserName }}</span>
						<span v-else>-</span>
					</template>
				</el-table-column>
				<el-table-column prop="quoteStatus" :label="$t('进度状态')" min-width="120">
					<template #default="{ row }">
						<el-tag
							disable-transitions
							effect="plain"
							:type="row.quoteStatus === 0 ? 'danger' : row.quoteStatus === 1 ? 'warning' : 'success'"
						>
							{{ statusLabel(row.quoteStatus) }}
						</el-tag>
					</template>
				</el-table-column>
			</el-table>

			<div class="company-business__pagination">
				<el-pagination
					small
					background
					layout="prev, pager, next"
					:page-size="pageSize"
					:current-page="page"
					:total="total"
					@current-change="p => loadProgress({ page: p })"
				/>
			</div>
		</template>

		<div class="company-business__content">
			<template v-if="$slots.default">
				<slot />
			</template>
			<template v-else-if="!showProgress">
				<el-empty
					class="company-business__empty"
					:description="$t('请选择下方菜单进入报价单或合同管理')"
				/>
			</template>
		</div>
	</div>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'company-business',
});

import { ElMessage } from 'element-plus';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useCool } from '/@/cool';

import { useI18n } from 'vue-i18n';
import { request } from '/@/cool/service/request';
import { config } from '/@/config';

const { t } = useI18n();
const { service, mitt, route } = useCool();

// 更稳：优先使用路由 name，避免 path 变体导致统计卡不显示
const showProgress = computed(() => route.name === 'company-business' || route.path === '/company/business');

type Row = {
	inquiryNo: string;
	quoteNo?: string | null;
	customer: string;
	projectName: string;
	createUserName?: string | null;
	quoteStatus: number;
};

const pendingCount = ref(0);
const inProgressCount = ref(0);
const acceptedCount = ref(0);
const rows = ref<Row[]>([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

function apiUrl(path: string) {
	return `${config.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

async function getProgressTotal(quoteStatus: 0 | 1 | 2) {
	const payload = {
		quoteStatus,
		page: 1,
		size: 1
	};
	const api: any = service.company.inquiry as any;
	if (api?.progressPage) {
		const res = await api.progressPage(payload);
		return Number(res?.pagination?.total ?? 0);
	}
	// eps/service 尚未包含 progressPage 时兜底：直接请求接口
	const res: any = await request({
		url: apiUrl('/admin/company/inquiry/progressPage'),
		method: 'post',
		data: payload
	} as any);
	return Number(res?.pagination?.total ?? 0);
}

async function loadProgressCounts() {
	if (!showProgress.value) return;

	try {
		const [pending, inProgress, accepted] = await Promise.all([
			getProgressTotal(0),
			getProgressTotal(1),
			getProgressTotal(2)
		]);
		pendingCount.value = pending;
		inProgressCount.value = inProgress;
		acceptedCount.value = accepted;
	} catch (e: any) {
		ElMessage.error(e?.message || '加载报价进度统计失败');
	}
}

function statusLabel(status: number) {
	switch (Number(status)) {
		case 0:
			return t('待报价');
		case 1:
			return t('报价中');
		case 2:
			return t('报价已定');
		default:
			return '-';
	}
}

async function loadProgress(params?: { page?: number }) {
	if (!showProgress.value) return;
	const nextPage = Number(params?.page ?? page.value);
	if (!Number.isFinite(nextPage) || nextPage <= 0) return;
	page.value = nextPage;
	try {
		const api: any = service.company.inquiry as any;
		let res: any = null;
		if (api?.progressPage) {
			res = await api.progressPage({
				page: page.value,
				size: pageSize.value
			});
		} else {
			res = await request({
				url: apiUrl('/admin/company/inquiry/progressPage'),
				method: 'post',
				data: {
					page: page.value,
					size: pageSize.value
				}
			} as any);
		}
		if (!res) {
			rows.value = [];
			total.value = 0;
			return;
		}
		const list = res?.list || [];
		rows.value = list.map((e: any) => ({
			inquiryNo: e?.a_inquiryNo ?? e?.inquiryNo ?? '',
			quoteNo: e?.quoteNo ?? null,
			customer: e?.a_customer ?? e?.customer ?? '',
			projectName: e?.a_projectName ?? e?.projectName ?? '',
			createUserName: e?.createUserName ?? null,
			quoteStatus: Number(e?.a_quoteStatus ?? e?.quoteStatus ?? 0)
		}));
		total.value = Number(res?.pagination?.total ?? 0);
	} catch (e: any) {
		ElMessage.error(e?.message || '加载报价进度失败');
	}
}

const onRefresh = () => {
	loadProgressCounts();
	loadProgress();
};

onMounted(() => {
	loadProgressCounts();
	loadProgress();
	mitt.on('company.business.refreshProgress', onRefresh);
});

onUnmounted(() => {
	mitt.off('company.business.refreshProgress', onRefresh);
});

watch(
	() => showProgress.value,
	visible => {
		if (visible) {
			loadProgressCounts();
			loadProgress({ page: 1 });
		}
	}
);
</script>

<style lang="scss" scoped>
.company-business {
	display: flex;
	flex-direction: column;
	gap: 12px;
	height: 100%;
	min-height: 0;
}

.company-business__header {
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 4px 2px;
	flex-shrink: 0;
}

.company-business__title {
	font-size: 16px;
	font-weight: 600;
}

.company-business__subtitle {
	color: var(--el-text-color-secondary);
	font-size: 12px;
}

.company-business__stats {
	width: 100%;
}

.company-business__table {
	width: 100%;
}

.company-business__pagination {
	display: flex;
	justify-content: flex-end;
	margin-top: 12px;
}

.company-business__stats-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 12px;
}

.company-business__card-title {
	font-size: 13px;
	color: var(--el-text-color-secondary);
}

.company-business__card-value {
	margin-top: 8px;
	font-size: 28px;
	font-weight: 600;
	line-height: 1;
}

.company-business__content {
	flex: 1;
	min-height: 0;
	overflow: auto;
}

.company-business__empty {
	margin-top: 12px;
}
</style>

