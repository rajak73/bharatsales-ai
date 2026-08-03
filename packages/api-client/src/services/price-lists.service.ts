import type { PriceList } from '@bharatsales/shared-types';
import { apiClient } from '../index';

export class PriceListsService {
  static async getPriceLists(): Promise<PriceList[]> {
    const response = await apiClient.get<PriceList[]>('/price-lists');
    return response.data;
  }

  static async createPriceList(data: Omit<PriceList, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<PriceList> {
    const response = await apiClient.post<PriceList>('/price-lists', data);
    return response.data;
  }

  static async updatePriceList(id: string, data: Partial<PriceList>): Promise<PriceList> {
    const response = await apiClient.put<PriceList>(`/price-lists/${id}`, data);
    return response.data;
  }

  static async deletePriceList(id: string): Promise<{ deleted: boolean }> {
    const response = await apiClient.delete<{ deleted: boolean }>(`/price-lists/${id}`);
    return response.data;
  }
}
