<script lang="ts" setup>
defineOptions({
	name: 'company-business-contract'
});

import BusinessLayout from '../business.vue';
import ContractMgmtPage from '../contractMgmt.vue';
</script>

<template>
	<business-layout>
		<contract-mgmt-page />
	</business-layout>
</template>
