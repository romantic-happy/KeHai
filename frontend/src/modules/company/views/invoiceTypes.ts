/** 与后端 company_invoice / 明细 JSON 对齐的前端类型 */

export type InvoiceDetailRow = {
	orderId: number;
	customerName: string;
	orderNo: string;
	planRepayLabel: string;
	actualRepayLabel: string;
	invoiceAmount: number;
	currency: string;
};

export type InvoiceRecord = {
	id?: number;
	invoiceNo?: string;
	customerId: number;
	customerName?: string;
	contractOrderIds: number[];
	contractOrderLabels?: string;
	expectedPaybackDate: string;
	invoiceAmount?: number;
	invoiceType?: string;
	ownerUserId?: number;
	collaboratorUserIds?: number[];
	remark?: string;
	detailRows: InvoiceDetailRow[];
	taxNo?: string;
	bankName?: string;
	bankAccount?: string;
	bankBranchCode?: string;
	createTime?: string;
	updateTime?: string;
};

export function invoiceTypeLabel(v?: string) {
	if (v === 'vat_special') return '增值税专用发票';
	if (v === 'vat_normal') return '增值税普通发票';
	return '-';
}
