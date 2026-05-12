<template>
	<cl-crud ref="Crud">
		<cl-row>
			<cl-refresh-btn />
			<cl-flex1 />
			<cl-search-key :placeholder="$t('搜索客户名称/合同编号/项目名称')" :width="260" />
		</cl-row>

		<cl-row>
			<cl-table ref="Table" />
		</cl-row>

		<cl-row>
			<cl-flex1 />
			<cl-pagination />
		</cl-row>
	</cl-crud>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'company-customer-closedDeal'
});

import { useCrud, useTable } from '@cool-vue/crud';
import { useCool } from '/@/cool';
import { useI18n } from 'vue-i18n';

const { service } = useCool();
const { t } = useI18n();

const Table = useTable({
	columns: [
		{ type: 'selection', width: 60 },
		{ label: t('客户名称'), prop: 'customerName', minWidth: 160 },
		{ label: t('合同编号'), prop: 'contractNo', minWidth: 140 },
		{ label: t('项目名称'), prop: 'projectName', minWidth: 180 },
		{
			label: t('合同金额'),
			prop: 'contractAmount',
			minWidth: 120,
			formatter(row: any) {
				return row.contractAmount != null ? row.contractAmount : '-';
			}
		},
		{
			label: t('时间'),
			prop: 'dealTime',
			minWidth: 170,
			component: { name: 'cl-date-text' }
		},
		{ label: t('联系人'), prop: 'contactPerson', minWidth: 120 },
		{ label: t('成单关键'), prop: 'dealKey', minWidth: 200, showOverflowTooltip: true },
		{
			label: t('创建时间'),
			prop: 'createTime',
			minWidth: 170,
			sortable: 'custom',
			component: { name: 'cl-date-text' }
		}
	]
});

const Crud = useCrud(
	{
		service: {
			page(params: any) {
				return (service as any).company.customer.closedDealPage(params);
			}
		}
	},
	app => {
		app.refresh();
	}
);
</script>