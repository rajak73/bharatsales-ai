import { apiClient } from '../index';
import type { Invoice } from '@bharatsales/shared-types';

// Collection/payment operations live in CollectionsService — the org/role-scoped
// implementation (see apps/api/src/collections). This module only covers the
// invoice/ledger endpoints that are genuinely distinct (apps/api/src/finance).
export class FinanceService {
  static async getInvoices(): Promise<Invoice[]> {
    const response = await apiClient.get<Invoice[]>('/api/v1/finance/invoices');
    return response.data;
  }

  static async generateInvoice(orderId: string): Promise<Invoice> {
    const response = await apiClient.post<Invoice>('/api/v1/finance/invoices', { orderId });
    return response.data;
  }

  static async getLedger(outletId: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/api/v1/finance/ledger/${outletId}`);
    return response.data;
  }
}
