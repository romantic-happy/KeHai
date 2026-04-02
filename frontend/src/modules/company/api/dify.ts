/**
 * Dify 工作流调用封装
 * 使用 service.request，会自动携带认证 Token
 */
import { service } from '/@/cool/service';

export function useDifyApi() {
	async function queryMaterialPrice(params: { brand: string; name: string; dimension: string }) {
		return service.request({
			url: '/company/dify/intelligentPriceInquiry',
			method: 'POST',
			data: params,
		});
	}

	async function getCustomerInfo(params: { name: string }) {
		return service.request({
			url: '/company/dify/customerInfo',
			method: 'POST',
			data: params,
		});
	}

	async function getReceptionScript(params: { user_name: string }) {
		return service.request({
			url: '/company/dify/receptionScript',
			method: 'POST',
			data: params,
		});
	}

	async function getSupplierRecommend(params: { name: string; dimension: string }) {
		return service.request({
			url: '/company/dify/supplierRecommend',
			method: 'POST',
			data: params,
		});
	}

	return {
		queryMaterialPrice,
		getCustomerInfo,
		getReceptionScript,
		getSupplierRecommend,
	};
}
