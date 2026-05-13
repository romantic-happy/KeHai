<template>
	<cl-crud ref="Crud">
		<cl-row>
			<cl-refresh-btn />
			<cl-flex1 />
			<cl-search-key :placeholder="$t('搜索客户名称/报价单号/项目名称')" :width="260" />
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
	name: 'company-customer-lostDeal'
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
		{ label: t('报价单号'), prop: 'quoteNo', minWidth: 140 },
		{ label: t('项目名称'), prop: 'projectName', minWidth: 180 },
		{
			label: t('报价金额'),
			prop: 'quoteAmount',
			minWidth: 120,
			formatter(row: any) {
				return row.quoteAmount != null ? row.quoteAmount : '-';
			}
		},
		{
			label: t('时间'),
			prop: 'lostTime',
			minWidth: 170,
			component: { name: 'cl-date-text' }
		},
		{ label: t('联系人'), prop: 'contactPerson', minWidth: 120 },
		{ label: t('丢单原因'), prop: 'lostReason', minWidth: 200, showOverflowTooltip: true },
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
				return (service as any).company.customer.lostDealPage(params);
			}
		}
	},
	app => {
		app.refresh();
	}
);
</script>