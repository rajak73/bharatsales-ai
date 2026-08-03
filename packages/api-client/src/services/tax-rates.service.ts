import type { TaxRate } from '@bharatsales/shared-types';
import { apiClient } from '../index';

export class TaxRatesService {
  static async getTaxRates(): Promise<TaxRate[]> {
    const response = await apiClient.get<TaxRate[]>('/tax-rates');
    return response.data;
  }

  static async createTaxRate(data: Omit<TaxRate, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<TaxRate> {
    const response = await apiClient.post<TaxRate>('/tax-rates', data);
    return response.data;
  }

  static async updateTaxRate(id: string, data: Partial<TaxRate>): Promise<TaxRate> {
    const response = await apiClient.put<TaxRate>(`/tax-rates/${id}`, data);
    return response.data;
  }

  static async deleteTaxRate(id: string): Promise<{ deleted: boolean }> {
    const response = await apiClient.delete<{ deleted: boolean }>(`/tax-rates/${id}`);
    return response.data;
  }
}
