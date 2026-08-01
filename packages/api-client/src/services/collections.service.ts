import { apiClient } from '../index';
import type { PaymentCollection } from '@bharatsales/shared-types';

export class CollectionsService {
  static async getCollections(): Promise<PaymentCollection[]> {
    const response = await apiClient.get<PaymentCollection[]>('/collections');
    return response.data;
  }

  static async createCollection(data: Partial<PaymentCollection>): Promise<PaymentCollection> {
    const response = await apiClient.post<PaymentCollection>('/collections', data);
    return response.data;
  }

  static async updateCollectionStatus(id: string, status: 'Pending' | 'Cleared' | 'Bounced'): Promise<PaymentCollection> {
    const response = await apiClient.patch<PaymentCollection>(`/collections/${id}/status`, { status });
    return response.data;
  }

  static async updateCollection(id: string, data: Partial<PaymentCollection>): Promise<PaymentCollection> {
    const response = await apiClient.put<PaymentCollection>(`/collections/${id}`, data);
    return response.data;
  }

  static async deleteCollection(id: string): Promise<{ deleted: boolean }> {
    const response = await apiClient.delete<{ deleted: boolean }>(`/collections/${id}`);
    return response.data;
  }

  static async reverseCollection(id: string): Promise<PaymentCollection> {
    const response = await apiClient.post<PaymentCollection>(`/collections/${id}/reverse`);
    return response.data;
  }
}
