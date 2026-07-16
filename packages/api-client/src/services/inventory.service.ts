import { apiClient } from '../index';
import type { Inventory } from '@bharatsales/shared-types';

export class InventoryService {
  static async getInventory(organizationId: string): Promise<Inventory[]> {
    const response = await apiClient.get<Inventory[]>('/inventory', {
      params: { organizationId },
    });
    return response.data;
  }

  static async addInventory(data: Partial<Inventory>): Promise<Inventory> {
    const response = await apiClient.post<Inventory>('/inventory', data);
    return response.data;
  }

  static async adjustStock(organizationId: string, adjustment: any): Promise<Inventory> {
    const response = await apiClient.post<Inventory>('/inventory/adjust', adjustment, {
      params: { organizationId },
    });
    return response.data;
  }
}
