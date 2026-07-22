import { apiClient } from '../index';
import type { PaymentCollection, Invoice, LedgerEntry } from '@bharatsales/shared-types';

export class FinanceService {
  static async getInvoices(): Promise<Invoice[]> {
    const response = await apiClient.get<Invoice[]>('/finance/invoices');
    return response.data;
  }

  static async generateInvoice(orderId: string): Promise<Invoice> {
    const response = await apiClient.post<Invoice>('/finance/invoices', { orderId });
    return response.data;
  }

  static async getCollections(): Promise<PaymentCollection[]> {
    const response = await apiClient.get<PaymentCollection[]>('/finance/collections');
    return response.data;
  }

  static async recordCollection(data: Partial<PaymentCollection>): Promise<PaymentCollection> {
    const response = await apiClient.post<PaymentCollection>('/finance/collections', data);
    return response.data;
  }

  static async reverseCollection(collectionId: string): Promise<PaymentCollection> {
    const response = await apiClient.post<PaymentCollection>(`/finance/collections/${collectionId}/reverse`);
    return response.data;
  }

  static async getLedger(outletId: string): Promise<LedgerEntry[]> {
    const response = await apiClient.get<LedgerEntry[]>(`/finance/ledger/${outletId}`);
    return response.data;
  }
}
