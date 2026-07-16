import { apiClient } from '../index';
import type { Warehouse } from '@bharatsales/shared-types';

export class WarehousesService {
  static async getWarehouses(organizationId: string): Promise<Warehouse[]> {
    const response = await apiClient.get<Warehouse[]>('/warehouses', {
      params: { organizationId },
    });
    return response.data;
  }
}
