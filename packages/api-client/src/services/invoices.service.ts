import { apiClient } from '../index';
import type { Invoice } from '@bharatsales/shared-types';

export class InvoicesService {
  static async getInvoices(organizationId: string): Promise<Invoice[]> {
    const response = await apiClient.get<Invoice[]>('/finance/invoices', {
      params: { organizationId },
    });
    return response.data;
  }

  static async generateInvoice(orderId: string): Promise<Invoice> {
    const response = await apiClient.post<Invoice>('/finance/invoices', { orderId });
    return response.data;
  }
}
