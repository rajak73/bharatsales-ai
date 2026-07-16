import { apiClient } from '../index';
import type { PaymentCollection } from '@bharatsales/shared-types';

export class CollectionsService {
  static async getCollections(organizationId: string): Promise<PaymentCollection[]> {
    const response = await apiClient.get<PaymentCollection[]>('/finance/collections', {
      params: { organizationId },
    });
    return response.data;
  }

  static async createCollection(data: Partial<PaymentCollection>): Promise<PaymentCollection> {
    const response = await apiClient.post<PaymentCollection>('/finance/collections', data);
    return response.data;
  }
}
