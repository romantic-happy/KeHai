<script lang="ts" setup>
defineOptions({
	name: 'company-business-invoice'
});

import BusinessLayout from '../business.vue';
import InvoicePage from '../invoice.vue';
</script>

<template>
	<BusinessLayout>
		<InvoicePage />
	</BusinessLayout>
</template>
