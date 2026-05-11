<template>
	<cl-crud ref="Crud">
		<cl-row>
			<cl-refresh-btn />
			<cl-add-btn />
			<cl-multi-delete-btn />
			<el-button
				type="primary"
				:disabled="!selectedRows.length"
				@click="openCreateOrderDialog"
			>
				合并采购
			</el-button>
			<el-button @click="resetSearch">重置筛选</el-button>
			<cl-flex1 />
			<div class="search-wrapper">
				<el-select
					v-model="search.searchField"
					clearable
					placeholder="选择字段"
					class="search-field-select"
				>
					<el-option label="全部" value="" />
					<el-option label="需求编号" value="requirementNo" />
					<el-option label="合同订单号" value="contractOrderNo" />
					<el-option label="来源类型" value="sourceType" />
					<el-option label="采购状态" value="purchaseStatus" />
					<el-option label="负责人" value="ownerName" />
					<el-option label="产品名称" value="productName" />
					<el-option label="品牌" value="productBrand" />
					<el-option label="型号" value="productModel" />
					<el-option label="报价单号" value="quoteNo" />
				</el-select>
				<el-input
					v-model="search.keyWord"
					clearable
					placeholder="搜索内容"
					class="search-input"
					@keyup.enter="refresh({ page: 1 })"
				/>
				<el-button
					class="search-btn"
					@click="refresh({ page: 1 })"
				>搜索</el-button>
			</div>
			<el-date-picker
				v-model="search.deliveryDateRange"
				type="daterange"
				value-format="YYYY-MM-DD"
				range-separator="至"
				start-placeholder="交付开始"
				end-placeholder="交付结束"
				clearable
				style="width: 260px"
				@change="refresh({ page: 1 })"
			/>
		</cl-row>

		<cl-row>
			<cl-table ref="Table">
				<template #column-requirementNo="{ scope }">
					<el-link type="primary" @click="openDetail(scope.row)">
						{{ scope.row.requirementNo || '-' }}
					</el-link>
				</template>

				<template #column-sourceType="{ scope }">
					<el-tag size="small" effect="plain" :type="sourceTypeTag(scope.row.sourceType)">
						{{ labelOf(options.sourceType, scope.row.sourceType) }}
					</el-tag>
				</template>

				<template #column-productSpec="{ scope }">
					<div class="spec-text">
						<span>{{ scope.row.productBrand || '-' }}</span>
						<span class="sep">/</span>
						<span>{{ scope.row.productModel || '-' }}</span>
					</div>
				</template>

				<template #column-inventoryQty="{ scope }">
				{{ formatQty(scope.row.inventoryQty) }}
				</template>

				<template #column-purchaseStatus="{ scope }">
					<el-tag size="small" effect="plain" :type="purchaseStatusTag(scope.row.purchaseStatus)">
						{{ labelOf(options.purchaseStatus, scope.row.purchaseStatus) }}
					</el-tag>
				</template>
			</cl-table>
		</cl-row>

		<cl-row>
			<el-text type="info">已选 {{ selectedRows.length }} 条</el-text>
			<cl-flex1 />
			<cl-pagination />
		</cl-row>

		<cl-upsert ref="Upsert" />
	</cl-crud>

	<el-drawer
		v-model="detail.visible"
		title="采购需求详情"
		size="720px"
		destroy-on-close
	>
		<el-skeleton :loading="detail.loading" animated :rows="10">
			<el-descriptions border :column="2">
				<el-descriptions-item label="采购需求编号">
					{{ detail.row.requirementNo || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="来源类型">
					{{ labelOf(options.sourceType, detail.row.sourceType) }}
				</el-descriptions-item>
				<el-descriptions-item label="合同订单号">
					{{ detail.row.contractOrderNo || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="负责人">
					{{ detail.row.ownerName || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="交付日期">
					{{ formatDate(detail.row.deliveryDate) }}
				</el-descriptions-item>
				<el-descriptions-item label="交付标准">
					{{ detail.row.deliveryStandard || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="采购状态">
					<el-tag
						size="small"
						effect="plain"
						:type="purchaseStatusTag(detail.row.purchaseStatus)"
					>
						{{ labelOf(options.purchaseStatus, detail.row.purchaseStatus) }}
					</el-tag>
				</el-descriptions-item>
				<el-descriptions-item label="产品名称">
					{{ detail.row.productName || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="品牌/型号">
					{{ `${detail.row.productBrand || '-'} / ${detail.row.productModel || '-'}` }}
				</el-descriptions-item>
				<el-descriptions-item label="库存数量">
					{{ formatQty(detail.row.inventoryQty) }}
				</el-descriptions-item>
				<el-descriptions-item label="报价单">
					{{ detail.row.quoteNo || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="创建时间">
					{{ formatDateTime(detail.row.createTime) }}
				</el-descriptions-item>
				<el-descriptions-item label="更新时间">
					{{ formatDateTime(detail.row.updateTime) }}
				</el-descriptions-item>
			</el-descriptions>
		</el-skeleton>
	</el-drawer>

	<el-dialog
		v-model="createOrder.visible"
		title="合并采购"
		width="min(960px, 92vw)"
		destroy-on-close
	>
		

		<div class="order-summary">
			已选 {{ selectedRows.length }} 条采购需求
		</div>

		<el-table :data="selectedRows" border size="small" max-height="360">
			<el-table-column prop="requirementNo" label="采购需求编号" min-width="160" />
			<el-table-column prop="productName" label="产品名称" min-width="160" />
			<el-table-column label="品牌/型号" min-width="180">
				<template #default="{ row }">
					{{ `${row.productBrand || '-'} / ${row.productModel || '-'}` }}
				</template>
			</el-table-column>
			<el-table-column prop="contractOrderNo" label="合同订单号" min-width="140" />
			<el-table-column prop="ownerName" label="负责人" min-width="110" />
			<el-table-column prop="deliveryDate" label="交付日期" min-width="120" />
		</el-table>

		<el-form label-width="90px" class="order-form">
			<el-form-item label="采购备注">
				<el-input
					v-model="createOrder.remark"
					type="textarea"
					:rows="3"
					maxlength="500"
					show-word-limit
					placeholder="可填写本次合并采购的备注"
				/>
			</el-form-item>
		</el-form>

		<template #footer>
			<el-button @click="closeCreateOrderDialog">取消</el-button>
			<el-button
				type="primary"
				:loading="createOrder.loading"
				@click="submitCreateOrder"
			>
				确认生成
			</el-button>
		</template>
	</el-dialog>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'company-purchase-requirement'
});

import { useCrud, useTable, useUpsert } from '@cool-vue/crud';
import { ElMessage } from 'element-plus';
import { computed, reactive } from 'vue';
import type { TagProps } from 'element-plus';
import { useCool } from '/@/cool';

const { service } = useCool();
const requirementService: any = service.company?.purchaseRequirement;

interface PurchaseRequirementRow {
	id: number;
	requirementNo: string;
	sourceType: number;
	contractOrderNo: string;
	ownerName: string;
	deliveryDate: string;
	deliveryStandard: string;
	purchaseStatus: number;
	productName: string;
	productBrand: string;
	productModel: string;
	inventoryQty: number;
	quoteNo: string;
	createTime: string;
	updateTime: string;
}

const mockRows = reactive<PurchaseRequirementRow[]>([
	{
		id: 1,
		requirementNo: 'PR-20260501-0001',
		sourceType: 0,
		contractOrderNo: 'CT-20260415-0088',
		ownerName: '王磊',
		deliveryDate: '2026-05-20',
		deliveryStandard: '按合同约定标准交付，需提供出厂检验报告',
		purchaseStatus: 0,
		productName: '工业机器人本体',
		productBrand: 'ABB',
		productModel: 'IRB 6700-235/2.65',
		inventoryQty: 0,
		quoteNo: 'QUO-20260428-0012',
		createTime: '2026-04-28 09:30:00',
		updateTime: '2026-05-02 14:20:00'
	},
	{
		id: 2,
		requirementNo: 'PR-20260502-0002',
		sourceType: 0,
		contractOrderNo: 'CT-20260418-0091',
		ownerName: '李娜',
		deliveryDate: '2026-05-25',
		deliveryStandard: '须满足图纸技术要求，表面无划痕',
		purchaseStatus: 0,
		productName: '伺服电机',
		productBrand: '西门子',
		productModel: 'SIMOTICS S-1FK7',
		inventoryQty: 5,
		quoteNo: 'QUO-20260430-0015',
		createTime: '2026-04-30 10:15:00',
		updateTime: '2026-05-03 16:45:00'
	},
	{
		id: 3,
		requirementNo: 'PR-20260503-0003',
		sourceType: 1,
		contractOrderNo: '',
		ownerName: '张强',
		deliveryDate: '2026-06-10',
		deliveryStandard: '库存备货，品质合格即可',
		purchaseStatus: 0,
		productName: 'PLC控制器',
		productBrand: '三菱',
		productModel: 'FX5U-32MT/ES',
		inventoryQty: 12,
		quoteNo: '',
		createTime: '2026-05-03 11:00:00',
		updateTime: '2026-05-03 11:00:00'
	},
	{
		id: 4,
		requirementNo: 'PR-20260504-0004',
		sourceType: 0,
		contractOrderNo: 'CT-20260422-0095',
		ownerName: '王磊',
		deliveryDate: '2026-05-18',
		deliveryStandard: '急单，优先处理',
		purchaseStatus: 1,
		productName: '减速机',
		productBrand: '纳博特斯克',
		productModel: 'RV-80E-215',
		inventoryQty: 0,
		quoteNo: 'QUO-20260501-0018',
		createTime: '2026-05-01 08:20:00',
		updateTime: '2026-05-06 10:30:00'
	},
	{
		id: 5,
		requirementNo: 'PR-20260505-0005',
		sourceType: 1,
		contractOrderNo: '',
		ownerName: '李娜',
		deliveryDate: '2026-06-15',
		deliveryStandard: '常规备货',
		purchaseStatus: 0,
		productName: '工业触摸屏',
		productBrand: '威纶通',
		productModel: 'MT8102IE',
		inventoryQty: 8,
		quoteNo: '',
		createTime: '2026-05-05 14:50:00',
		updateTime: '2026-05-05 14:50:00'
	},
	{
		id: 6,
		requirementNo: 'PR-20260601-0006',
		sourceType: 0,
		contractOrderNo: 'CT-20260520-0102',
		ownerName: '张强',
		deliveryDate: '2026-06-20',
		deliveryStandard: '按技术规格书要求，需提供质保书',
		purchaseStatus: 0,
		productName: '变频器',
		productBrand: '施耐德',
		productModel: 'ATV320U15N4C',
		inventoryQty: 3,
		quoteNo: 'QUO-20260525-0020',
		createTime: '2026-05-25 09:10:00',
		updateTime: '2026-05-28 11:30:00'
	},
	{
		id: 7,
		requirementNo: 'PR-20260602-0007',
		sourceType: 1,
		contractOrderNo: '',
		ownerName: '王磊',
		deliveryDate: '2026-07-01',
		deliveryStandard: '安全库存补货',
		purchaseStatus: 1,
		productName: '传感器模块',
		productBrand: '欧姆龙',
		productModel: 'E3Z-D62',
		inventoryQty: 25,
		quoteNo: 'QUO-20260528-0023',
		createTime: '2026-05-28 16:45:00',
		updateTime: '2026-06-02 10:15:00'
	},
	{
		id: 8,
		requirementNo: 'PR-20260603-0008',
		sourceType: 0,
		contractOrderNo: 'CT-20260525-0108',
		ownerName: '李娜',
		deliveryDate: '2026-06-18',
		deliveryStandard: '紧急采购，需加急处理',
		purchaseStatus: 0,
		productName: '气动元件套装',
		productBrand: 'SMC',
		productModel: 'CDQSB16-20DCM',
		inventoryQty: 0,
		quoteNo: 'QUO-20260601-0025',
		createTime: '2026-06-01 08:30:00',
		updateTime: '2026-06-03 14:50:00'
	},
	{
		id: 9,
		requirementNo: 'PR-20260604-0009',
		sourceType: 1,
		contractOrderNo: '',
		ownerName: '张强',
		deliveryDate: '2026-07-10',
		deliveryStandard: '季度备货计划',
		purchaseStatus: 0,
		productName: '工业交换机',
		productBrand: '赫斯曼',
		productModel: 'RSB20-0800S2S2SDAEHC',
		inventoryQty: 6,
		quoteNo: '',
		createTime: '2026-06-04 11:20:00',
		updateTime: '2026-06-04 11:20:00'
	},
	{
		id: 10,
		requirementNo: 'PR-20260605-0010',
		sourceType: 0,
		contractOrderNo: 'CT-20260601-0115',
		ownerName: '王磊',
		deliveryDate: '2026-06-25',
		deliveryStandard: '符合CE认证标准，需提供检测报告',
		purchaseStatus: 0,
		productName: '直线导轨',
		productBrand: 'THK',
		productModel: 'HSR35R',
		inventoryQty: 2,
		quoteNo: 'QUO-20260605-0028',
		createTime: '2026-06-05 13:40:00',
		updateTime: '2026-06-05 13:40:00'
	}
]);

function normalizeKeyword(value: any) {
	return String(value || '').trim().toLowerCase();
}

function filterMockRows(params: any = {}) {
	const page = Number(params?.page || 1);
	const size = Number(params?.size || 20);
	const keyword = normalizeKeyword(params?.keyWord);
	const searchField = params?.searchField || '';
	const sourceType = params?.sourceType;
	const purchaseStatus = params?.purchaseStatus;
	const ownerName = params?.ownerName;
	const deliveryStartDate = params?.deliveryStartDate;
	const deliveryEndDate = params?.deliveryEndDate;

	const orderBy = params?.orderBy || params?.sortField || params?.prop || 'createTime';
	const orderType = params?.orderType || params?.sortType || params?.order || 'desc';

	let list = [...mockRows];

	if (sourceType !== undefined && sourceType !== null) {
		list = list.filter(e => Number(e.sourceType) === Number(sourceType));
	}

	if (purchaseStatus !== undefined && purchaseStatus !== null) {
		list = list.filter(e => Number(e.purchaseStatus) === Number(purchaseStatus));
	}

	if (ownerName) {
		const kw = normalizeKeyword(ownerName);
		list = list.filter(e => normalizeKeyword(e.ownerName).includes(kw));
	}

	if (deliveryStartDate) {
		list = list.filter(e => e.deliveryDate >= deliveryStartDate);
	}

	if (deliveryEndDate) {
		list = list.filter(e => e.deliveryDate <= deliveryEndDate);
	}

	if (keyword && searchField) {
		const kw = normalizeKeyword(keyword);
		if (searchField === 'requirementNo') {
			list = list.filter(e => normalizeKeyword(e.requirementNo).includes(kw));
		} else if (searchField === 'contractOrderNo') {
			list = list.filter(e => normalizeKeyword(e.contractOrderNo).includes(kw));
		} else if (searchField === 'sourceType') {
			list = list.filter(e => String(e.sourceType).includes(kw));
		} else if (searchField === 'purchaseStatus') {
			list = list.filter(e => String(e.purchaseStatus).includes(kw));
		} else if (searchField === 'ownerName') {
			list = list.filter(e => normalizeKeyword(e.ownerName).includes(kw));
		} else if (searchField === 'productName') {
			list = list.filter(e => normalizeKeyword(e.productName).includes(kw));
		} else if (searchField === 'productBrand') {
			list = list.filter(e => normalizeKeyword(e.productBrand).includes(kw));
		} else if (searchField === 'productModel') {
			list = list.filter(e => normalizeKeyword(e.productModel).includes(kw));
		} else if (searchField === 'quoteNo') {
			list = list.filter(e => normalizeKeyword(e.quoteNo).includes(kw));
		}
	} else if (keyword) {
		const kw = normalizeKeyword(keyword);
		list = list.filter(
			e =>
				normalizeKeyword(e.requirementNo).includes(kw) ||
				normalizeKeyword(e.contractOrderNo).includes(kw) ||
				normalizeKeyword(e.ownerName).includes(kw) ||
				normalizeKeyword(e.productName).includes(kw) ||
				normalizeKeyword(e.productBrand).includes(kw) ||
				normalizeKeyword(e.productModel).includes(kw) ||
				normalizeKeyword(e.quoteNo).includes(kw)
		);
	}

	list.sort((a, b) => {
		const aVal = a[orderBy as keyof PurchaseRequirementRow];
		const bVal = b[orderBy as keyof PurchaseRequirementRow];
		if (aVal < bVal) return orderType === 'asc' ? -1 : 1;
		if (aVal > bVal) return orderType === 'asc' ? 1 : -1;
		return 0;
	});

	const total = list.length;
	const start = (page - 1) * size;
	const end = start + size;
	list = list.slice(start, end);

	return { list, total, page, size };
}

const mockService = {
	async page(params?: any) {
		return filterMockRows(params);
	},

	async info(params: any) {
		const id = Number(params?.id);
		return mockRows.find(e => e.id === id) || {};
	},

	async add(data: Partial<PurchaseRequirementRow>) {
		const nextId = mockRows.length ? Math.max(...mockRows.map(e => e.id)) + 1 : 1;
		const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

		mockRows.unshift({
			id: nextId,
			requirementNo: `PR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(nextId).padStart(4, '0')}`,
			sourceType: data.sourceType ?? 0,
			contractOrderNo: data.contractOrderNo || '',
			ownerName: data.ownerName || '',
			deliveryDate: data.deliveryDate || '',
			deliveryStandard: data.deliveryStandard || '',
			purchaseStatus: data.purchaseStatus ?? 0,
			productName: data.productName || '',
			productBrand: data.productBrand || '',
			productModel: data.productModel || '',
			inventoryQty: data.inventoryQty ?? 0,
			quoteNo: data.quoteNo || '',
			createTime: now,
			updateTime: now
		});

		return { id: nextId };
	},

	async update(data: Partial<PurchaseRequirementRow>) {
		const id = Number(data.id);
		const item = mockRows.find(e => e.id === id);

		if (!item) return;

		Object.assign(item, {
			...data,
			updateTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
		});
	},

	async delete(params: any) {
		const ids = Array.isArray(params?.ids)
			? params.ids.map((id: any) => Number(id))
			: [Number(params?.id)].filter(Boolean);

		ids.forEach(id => {
			const index = mockRows.findIndex(e => e.id === id);
			if (index >= 0) {
				mockRows.splice(index, 1);
			}
		});
	},

	async generatePurchaseOrder(_params: any) {
		return {
			purchaseOrderNo: `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
			requirementCount: 0
		};
	}
};

const effectiveService = mockService;

const options = {
	sourceType: [
		{ label: '合同订单', value: 0, type: 'primary' as TagProps['type'] },
		{ label: '储备采购', value: 1, type: 'warning' as TagProps['type'] }
	],
	purchaseStatus: [
		{ label: '未采购', value: 0, type: 'info' as TagProps['type'] },
		{ label: '已采购', value: 1, type: 'success' as TagProps['type'] }
	]
};

const search = reactive<{
	keyWord?: string;
	searchField?: string;
	sourceType?: number;
	purchaseStatus?: number;
	ownerName?: string;
	deliveryDateRange: string[];
}>({
	keyWord: '',
	searchField: '',
	sourceType: undefined,
	purchaseStatus: undefined,
	ownerName: '',
	deliveryDateRange: []
});

const detail = reactive<{
	visible: boolean;
	loading: boolean;
	row: any;
}>({
	visible: false,
	loading: false,
	row: {}
});

const createOrder = reactive<{
	visible: boolean;
	loading: boolean;
	remark: string;
}>({
	visible: false,
	loading: false,
	remark: ''
});

const Table = useTable({
	columns: [
		{ type: 'selection', width: 60 },
		{ label: '采购需求编号', prop: 'requirementNo', minWidth: 170, sortable: true },
		{ label: '来源类型', prop: 'sourceType', minWidth: 110, sortable: true },
		{ label: '合同订单号', prop: 'contractOrderNo', minWidth: 150, sortable: true },
		{ label: '负责人', prop: 'ownerName', minWidth: 120, sortable: true },
		{
			label: '交付日期',
			prop: 'deliveryDate',
			minWidth: 130,
			sortable: true,
			component: { name: 'cl-date-text', props: { format: 'YYYY-MM-DD' } }
		},
		{ label: '交付标准', prop: 'deliveryStandard', minWidth: 180 },
		{ label: '产品名称', prop: 'productName', minWidth: 160, sortable: true },
		{ label: '品牌/型号', prop: 'productSpec', minWidth: 180 },
		{ label: '库存数量', prop: 'inventoryQty', minWidth: 120, sortable: true },
		{ label: '报价单', prop: 'quoteNo', minWidth: 140, sortable: true },
		{ label: '采购状态', prop: 'purchaseStatus', minWidth: 120, sortable: true },
		{
			label: '创建时间',
			prop: 'createTime',
			minWidth: 170,
			sortable: 'desc',
			component: { name: 'cl-date-text' }
		},
		{
			type: 'op',
			width: 160,
			buttons: ['edit', 'delete']
		}
	]
});

const selectedRows = computed<any[]>(() => Table.value?.selection || []);

const Upsert = useUpsert<any>({
	dialog: {
		width: 'min(980px, 92vw)'
	},
	props: {
		labelWidth: '120px'
	},
	items: [
		() => {
			return () => ({
				label: '采购需求编号',
				prop: 'requirementNo',
				span: 12,
				hidden: Upsert.value?.mode === 'add',
				component: {
					name: 'el-input',
					props: {
						disabled: true,
						placeholder: '保存后自动生成'
					}
				}
			});
		},
		{
			label: '来源类型',
			prop: 'sourceType',
			span: 12,
			value: 0,
			required: true,
			component: {
				name: 'el-select',
				options: options.sourceType,
				props: {
					clearable: true
				}
			}
		},
		{
			label: '合同订单号',
			prop: 'contractOrderNo',
			span: 12,
			component: {
				name: 'el-input',
				props: {
					clearable: true,
					maxlength: 100
				}
			}
		},
		{
			label: '负责人',
			prop: 'ownerName',
			span: 12,
			component: {
				name: 'el-input',
				props: {
					clearable: true,
					maxlength: 100
				}
			}
		},
		{
			label: '交付日期',
			prop: 'deliveryDate',
			span: 12,
			component: {
				name: 'el-date-picker',
				props: {
					type: 'date',
					'value-format': 'YYYY-MM-DD',
					clearable: true
				}
			}
		},
		{
			label: '交付标准',
			prop: 'deliveryStandard',
			span: 24,
			component: {
				name: 'el-input',
				props: {
					type: 'textarea',
					rows: 3,
					clearable: true,
					maxlength: 500,
					'show-word-limit': true
				}
			}
		},
		{
			label: '采购状态',
			prop: 'purchaseStatus',
			span: 12,
			value: 0,
			required: true,
			component: {
				name: 'el-select',
				options: options.purchaseStatus,
				props: {
					clearable: true
				}
			}
		},
		{
			label: '产品名称',
			prop: 'productName',
			span: 12,
			required: true,
			component: {
				name: 'el-input',
				props: {
					clearable: true,
					maxlength: 200
				}
			}
		},
		{
			label: '品牌',
			prop: 'productBrand',
			span: 12,
			component: {
				name: 'el-input',
				props: {
					clearable: true,
					maxlength: 100
				}
			}
		},
		{
			label: '型号',
			prop: 'productModel',
			span: 12,
			component: {
				name: 'el-input',
				props: {
					clearable: true,
					maxlength: 100
				}
			}
		},
		{
			label: '库存数量',
			prop: 'inventoryQty',
			span: 12,
			value: 0,
			component: {
				name: 'el-input-number',
				props: {
					min: 0,
					precision: 0,
					controls: false
				}
			}
		},
		{
			label: '报价单号',
			prop: 'quoteNo',
			span: 12,
			component: {
				name: 'el-input',
				props: {
					clearable: true,
					maxlength: 50
				}
			}
		}
	]
});

const Crud = useCrud(
	{
		service: effectiveService
	},
	app => {
		app.refresh({ page: 1 });
	}
);

function buildFilterParams() {
	return {
		keyWord: search.keyWord || undefined,
		searchField: search.searchField || undefined,
		sourceType: search.sourceType,
		purchaseStatus: search.purchaseStatus,
		ownerName: search.ownerName?.trim() || undefined,
		deliveryStartDate: search.deliveryDateRange?.[0] || undefined,
		deliveryEndDate: search.deliveryDateRange?.[1] || undefined
	};
}

function refresh(params?: any) {
	Crud.value?.refresh({
		...buildFilterParams(),
		...params
	});
}

function resetSearch() {
	search.keyWord = '';
	search.searchField = '';
	search.sourceType = undefined;
	search.purchaseStatus = undefined;
	search.ownerName = '';
	search.deliveryDateRange = [];

	refresh({
		page: 1,
		keyWord: undefined,
		searchField: undefined,
		sourceType: undefined,
		purchaseStatus: undefined,
		ownerName: undefined,
		deliveryStartDate: undefined,
		deliveryEndDate: undefined
	});
}

function onKeywordSearch(_: any, { next }: { next: (params?: any) => Promise<any> }) {
	return next(buildFilterParams());
}

function labelOf(list: Array<{ label: string; value: number }>, value: any) {
	return list.find(e => e.value === Number(value))?.label || '-';
}

function sourceTypeTag(value: any): TagProps['type'] {
	return options.sourceType.find(e => e.value === Number(value))?.type || 'info';
}

function purchaseStatusTag(value: any): TagProps['type'] {
	return options.purchaseStatus.find(e => e.value === Number(value))?.type || 'info';
}

function formatDate(value?: string) {
	return value ? String(value).slice(0, 10) : '-';
}

function formatDateTime(value?: string) {
	return value ? String(value) : '-';
}

function formatQty(value: any) {
	if (value === null || value === undefined || value === '') {
		return '-';
	}
	const num = Number(value);
	const text = Number.isNaN(num)
		? String(value)
		: Math.round(num).toLocaleString('zh-CN');
	return text;
}

async function openDetail(row: any) {
	const id = Number(row?.id);
	if (!Number.isFinite(id) || id <= 0) {
		ElMessage.error('缺少采购需求ID');
		return;
	}

	detail.visible = true;
	detail.loading = true;

	try {
		detail.row = (await effectiveService.info({ id })) || {};
	} catch (err: any) {
		ElMessage.error(err?.message || '获取采购需求详情失败');
		detail.visible = false;
	} finally {
		detail.loading = false;
	}
}

function openCreateOrderDialog() {
	if (!selectedRows.value.length) {
		ElMessage.warning('请先选择采购需求');
		return;
	}

	const purchasedRow = selectedRows.value.find(
		row => Number(row?.purchaseStatus) === 1
	);
	if (purchasedRow) {
		ElMessage.error(
			`采购需求 ${purchasedRow.requirementNo || purchasedRow.id} 已采购，不能重复合并采购`
		);
		return;
	}

	createOrder.visible = true;
}

function closeCreateOrderDialog() {
	createOrder.visible = false;
	createOrder.loading = false;
	createOrder.remark = '';
}

async function submitCreateOrder() {
	const ids = selectedRows.value
		.map(row => Number(row?.id))
		.filter(id => Number.isFinite(id) && id > 0);
	if (!ids.length) {
		ElMessage.warning('请先选择采购需求');
		return;
	}

	createOrder.loading = true;

	try {
		const res = await effectiveService.generatePurchaseOrder({
			ids,
			remark: createOrder.remark?.trim() || undefined
		});
		ElMessage.success(
			`合并采购成功，已生成采购单 ${res?.purchaseOrderNo || ''}，共关联 ${res?.requirementCount || ids.length} 条需求`
		);
		closeCreateOrderDialog();
		Table.value?.clearSelection();
		refresh();
	} catch (err: any) {
		ElMessage.error(err?.message || '合并采购失败');
		createOrder.loading = false;
	}
}
</script>

<style scoped>
.order-form {
	margin-top: 16px;
}

.order-summary {
	margin: 16px 0 12px;
	color: var(--el-text-color-regular);
}

.spec-text {
	display: inline-flex;
	align-items: center;
	gap: 6px;
}

.sep {
	color: var(--el-text-color-secondary);
}

.search-wrapper {
	display: inline-flex;
	align-items: center;
	gap: 0;
}

.search-field-select {
	width: 120px;
}

.search-field-select :deep(.el-input__wrapper) {
	border-radius: 4px 0 0 4px !important;
	border-right: none !important;
}

.search-input {
	width: 160px;
}

.search-input :deep(.el-input__wrapper) {
	border-radius: 0 !important;
	border-left: none !important;
	border-right: none !important;
}

.search-btn {
	margin: 0;
	border-radius: 0 4px 4px 0 !important;
	border: none;
	background-color: var(--el-color-primary);
	color: #fff;
	padding: 0 20px;
}

:deep(.cool-crud-table .el-table__cell .op-btns) {
	display: flex;
	gap: 8px;
	justify-content: center;
}


</style>
