/**
 * 客户跟进记录 API
 */
import { service } from '/@/cool/service';

export function useFollowUpRecordApi() {
	/**
	 * 根据客户名称模糊搜索未成单记录、成单记录、跟进记录
	 */
	async function getCustomerOrderData(customerName: string) {
		return service.request({
			url: 'admin/company/followUpRecord/getCustomerOrderData',
			method: 'POST',
			data: { customerName }
		});
	}

	/**
	 * 获取需要提醒的跟进记录
	 */
	async function getReminderRecords() {
		return service.request({
			url: 'admin/company/followUpRecord/getReminderRecords',
			method: 'POST'
		});
	}

	return {
		getCustomerOrderData,
		getReminderRecords
	};
}
