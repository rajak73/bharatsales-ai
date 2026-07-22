import { apiClient } from '../index';
import type { Inventory } from '@bharatsales/shared-types';

export class InventoryService {
  static async getInventory(): Promise<Inventory[]> {
    const response = await apiClient.get<Inventory[]>('/inventory');
    return response.data;
  }

  static async addInventory(data: Partial<Inventory>): Promise<Inventory> {
    const response = await apiClient.post<Inventory>('/inventory', data);
    return response.data;
  }

  static async adjustStock(adjustment: any): Promise<Inventory> {
    const response = await apiClient.post<Inventory>('/inventory/adjust', adjustment);
    return response.data;
  }
}
