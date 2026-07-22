import { apiClient } from '../index';
import type { Warehouse } from '@bharatsales/shared-types';

export class WarehousesService {
  static async getWarehouses(): Promise<Warehouse[]> {
    const response = await apiClient.get<Warehouse[]>('/warehouses');
    return response.data;
  }
}
