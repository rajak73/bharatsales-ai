import { apiClient } from '../index';
import type { PriceList, PriceListItem } from '@bharatsales/shared-types';

export class PriceListsService {
  static async getPriceLists(): Promise<PriceList[]> {
    const response = await apiClient.get<PriceList[]>('/price-lists');
    return response.data;
  }

  static async getPriceListItems(): Promise<PriceListItem[]> {
    const response = await apiClient.get<PriceListItem[]>('/price-lists/items');
    return response.data;
  }
}
