import { apiClient } from '../index';
import type { TaxRate } from '@bharatsales/shared-types';

export class TaxRatesService {
  static async getTaxRates(organizationId: string): Promise<TaxRate[]> {
    const response = await apiClient.get<TaxRate[]>('/tax-rates', {
      params: { organizationId },
    });
    return response.data;
  }
}
