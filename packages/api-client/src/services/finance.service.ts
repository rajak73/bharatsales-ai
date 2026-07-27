import { apiClient } from '../index';
import type { PaymentCollection } from '@bharatsales/shared-types';

export class FinanceService {

  static async getCollections(): Promise<PaymentCollection[]> {
    const response = await apiClient.get<PaymentCollection[]>('/api/v1/finance/collections');
    return response.data;
  }

  static async recordCollection(data: Partial<PaymentCollection>): Promise<PaymentCollection> {
    const response = await apiClient.post<PaymentCollection>('/api/v1/finance/collections', data);
    return response.data;
  }

  static async reverseCollection(collectionId: string): Promise<PaymentCollection> {
    const response = await apiClient.post<PaymentCollection>(`/api/v1/finance/collections/${collectionId}/reverse`);
    return response.data;
  }


}
