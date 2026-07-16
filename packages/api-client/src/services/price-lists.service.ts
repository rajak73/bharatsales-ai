import { apiClient } from '../index';
import type { PriceList, PriceListItem } from '@bharatsales/shared-types';

export class PriceListsService {
  static async getPriceLists(organizationId: string): Promise<PriceList[]> {
    const response = await apiClient.get<PriceList[]>('/price-lists', {
      params: { organizationId },
    });
    return response.data;
  }

  static async getPriceListItems(organizationId: string): Promise<PriceListItem[]> {
    const response = await apiClient.get<PriceListItem[]>('/price-lists/items', {
      params: { organizationId },
    });
    return response.data;
  }
}
