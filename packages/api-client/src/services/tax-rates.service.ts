import { apiClient } from '../index';
import type { TaxRate } from '@bharatsales/shared-types';

export class TaxRatesService {
  static async getTaxRates(): Promise<TaxRate[]> {
    const response = await apiClient.get<TaxRate[]>('/tax-rates');
    return response.data;
  }
}
