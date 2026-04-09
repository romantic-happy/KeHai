<template>
	<div
		class="company-business"
		:class="{ 'company-business--no-main-slot': !hasMainSlot }"
	>
		<!-- 销售管理主页：漏斗 + 金额趋势（模拟数据，待对接接口） -->
		<div v-if="showSalesHome" class="company-business__dashboard">
			<el-card shadow="never" class="company-business__section">
				<template #header>
					<span class="company-business__section-title">销售漏斗</span>
				</template>
				<v-chart
					class="company-business__chart company-business__chart--funnel"
					:option="funnelOption"
					autoresize
				/>
				<div class="company-business__rates">
					<div
						v-for="(item, i) in funnelRates"
						:key="i"
						class="company-business__rate-row"
					>
						<span class="company-business__rate-label">{{ item.label }}</span>
						<span class="company-business__rate-value">{{ item.rate }}%</span>
					</div>
				</div>
			</el-card>

			<el-row :gutter="12">
				<el-col :xs="24" :lg="12">
					<el-card shadow="never" class="company-business__section">
						<template #header>
							<span class="company-business__section-title">订单金额</span>
						</template>
						<v-chart
							class="company-business__chart company-business__chart--line"
							:option="orderAmountOption"
							autoresize
						/>
					</el-card>
				</el-col>
				<el-col :xs="24" :lg="12">
					<el-card shadow="never" class="company-business__section">
						<template #header>
							<span class="company-business__section-title">汇款金额</span>
						</template>
						<v-chart
							class="company-business__chart company-business__chart--line"
							:option="remitAmountOption"
							autoresize
						/>
					</el-card>
				</el-col>
			</el-row>
		</div>

		<!-- 交付管理：原主页统计与进度表 -->
		<template v-else-if="showDeliveryProgress">
			<div class="company-business__stats">
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
							:type="
								row.quoteStatus === 0
									? 'danger'
									: row.quoteStatus === 1
										? 'warning'
										: 'success'
							"
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
			<template
				v-else-if="!showSalesHome && !showDeliveryProgress"
			>
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
	name: 'company-business'
});

import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import { computed, onMounted, onUnmounted, reactive, ref, useSlots, watch } from 'vue';
import { useCool } from '/@/cool';

import { useI18n } from 'vue-i18n';
import { request } from '/@/cool/service/request';
import { config } from '/@/config';

const { t } = useI18n();
const { service, mitt, route } = useCool();
const slots = useSlots();

/** 无子页插槽时勿让底部占位区参与 flex 撑满，便于整页滚动 */
const hasMainSlot = computed(() => !!slots.default?.());

const showSalesHome = computed(
	() => route.name === 'company-business' || route.path === '/company/business'
);

const showDeliveryProgress = computed(
	() =>
		route.name === 'company-business-delivery' || route.path === '/company/business/delivery'
);

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

/** 销售漏斗各阶段转化率展示（模拟数据，待对接接口） */
const funnelRates = reactive([
	{ label: '客户总量 → 建联客户（有效建联率）', rate: 72 },
	{ label: '建联客户 → 当月拜访（约访率）', rate: 68 },
	{ label: '约访客户 → 立项（立项率）', rate: 52 },
	{ label: '立项 → 合同（成交率）', rate: 41 },
	{ label: '成交客户 → 二次合作（二购率）', rate: 28 }
]);

const funnelOption = reactive({
	tooltip: {
		trigger: 'item',
		formatter: '{b}: {c}'
	},
	series: [
		{
			type: 'funnel',
			left: '8%',
			width: '84%',
			min: 0,
			max: 1000,
			sort: 'descending',
			gap: 4,
			label: {
				show: true,
				position: 'inside'
			},
			data: [
				{ value: 1000, name: '客户总量' },
				{ value: 720, name: '建联客户' },
				{ value: 490, name: '当月拜访' },
				{ value: 255, name: '立项' },
				{ value: 105, name: '合同' },
				{ value: 29, name: '二次合作' }
			]
		}
	]
});

function formatCurrency(n: number) {
	return n.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function buildLineOption(seriesName: string, data: number[], dates: string[], color: string) {
	return {
		grid: { left: 48, right: 24, top: 32, bottom: 48 },
		tooltip: {
			trigger: 'axis',
			formatter: (params: any) => {
				const p = Array.isArray(params) ? params[0] : params;
				const v = p?.value;
				return `${p?.axisValue}<br/>${seriesName}：${formatCurrency(Number(v))}`;
			}
		},
		xAxis: {
			type: 'category',
			boundaryGap: false,
			data: dates,
			axisLine: { lineStyle: { color: 'var(--el-border-color)' } },
			axisLabel: {
				color: 'var(--el-text-color-secondary)',
				rotate: 35,
				fontSize: 11,
				hideOverlap: true
			}
		},
		yAxis: {
			type: 'value',
			splitLine: { lineStyle: { type: 'dashed', color: 'var(--el-border-color-lighter)' } },
			axisLabel: {
				color: 'var(--el-text-color-secondary)',
				formatter: (v: number) => (v >= 10000 ? `${(v / 10000).toFixed(1)}万` : String(v))
			}
		},
		series: [
			{
				name: seriesName,
				type: 'line',
				smooth: true,
				symbol: 'circle',
				symbolSize: 6,
				data,
				itemStyle: { color },
				lineStyle: { width: 2 },
				areaStyle: {
					opacity: 0.08,
					color
				}
			}
		]
	};
}

/** 订单 / 汇款趋势（模拟数据，待对接接口） */
const orderAmountOption = reactive(
	buildLineOption('订单金额', [], [], 'var(--el-color-primary)')
);
const remitAmountOption = reactive(
	buildLineOption('汇款金额', [], [], 'var(--el-color-success)')
);

function initMockTrendCharts() {
	const dates: string[] = [];
	const orderData: number[] = [];
	const remitData: number[] = [];
	for (let i = 29; i >= 0; i--) {
		dates.push(dayjs().subtract(i, 'day').format('MM-DD'));
		orderData.push(Math.round(50000 + Math.random() * 150000));
		remitData.push(Math.round(40000 + Math.random() * 120000));
	}
	const o = buildLineOption('订单金额', orderData, dates, 'var(--el-color-primary)');
	const r = buildLineOption('汇款金额', remitData, dates, 'var(--el-color-success)');
	Object.assign(orderAmountOption, o);
	Object.assign(remitAmountOption, r);
}

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
	const res: any = await request({
		url: apiUrl('/admin/company/inquiry/progressPage'),
		method: 'post',
		data: payload
	} as any);
	return Number(res?.pagination?.total ?? 0);
}

async function loadProgressCounts() {
	if (!showDeliveryProgress.value) return;

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
	if (!showDeliveryProgress.value) return;
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
	if (!showDeliveryProgress.value) return;
	loadProgressCounts();
	loadProgress();
};

onMounted(() => {
	initMockTrendCharts();
	mitt.on('company.business.refreshProgress', onRefresh);
	if (showDeliveryProgress.value) {
		loadProgressCounts();
		loadProgress();
	}
});

onUnmounted(() => {
	mitt.off('company.business.refreshProgress', onRefresh);
});

watch(
	() => showDeliveryProgress.value,
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
	/* app-views 为 overflow:hidden，此处整页滚动以完整展示漏斗与图表日期轴 */
	overflow-x: hidden;
	overflow-y: auto;
}

.company-business--no-main-slot {
	.company-business__content {
		flex: 0 0 auto;
		min-height: 0;
		overflow: visible;
	}
}

.company-business__dashboard {
	display: flex;
	flex-direction: column;
	gap: 12px;
	flex-shrink: 0;
}

.company-business__section {
	:deep(.el-card__header) {
		padding: 12px 16px;
	}
}

.company-business__section-title {
	font-size: 15px;
	font-weight: 600;
}

.company-business__chart {
	width: 100%;
}

.company-business__chart--funnel {
	height: 320px;
}

.company-business__chart--line {
	height: 280px;
}

.company-business__rates {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-top: 12px;
	padding-top: 12px;
	border-top: 1px solid var(--el-border-color-lighter);
}

.company-business__rate-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: 13px;
	gap: 12px;
}

.company-business__rate-label {
	color: var(--el-text-color-regular);
	flex: 1;
	min-width: 0;
}

.company-business__rate-value {
	font-weight: 600;
	color: var(--el-color-primary);
	flex-shrink: 0;
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
