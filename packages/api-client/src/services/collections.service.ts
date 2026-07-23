import { apiClient } from '../index';
import type { PaymentCollection } from '@bharatsales/shared-types';

export class CollectionsService {
  static async getCollections(): Promise<PaymentCollection[]> {
    const response = await apiClient.get<PaymentCollection[]>('/finance/collections');
    return response.data;
  }

  static async createCollection(data: Partial<PaymentCollection>): Promise<PaymentCollection> {
    const response = await apiClient.post<PaymentCollection>('/finance/collections', data);
    return response.data;
  }

  static async updateCollectionStatus(id: string, status: string): Promise<PaymentCollection> {
    const response = await apiClient.patch<PaymentCollection>(`/finance/collections/${id}/status`, { status });
    return response.data;
  }
}
