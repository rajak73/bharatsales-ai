import { apiClient } from '../index';
import type { Dispatch } from '@bharatsales/shared-types';

export class DispatchService {
  static async getDispatches(): Promise<Dispatch[]> {
    const response = await apiClient.get<Dispatch[]>('/dispatch');
    return response.data;
  }

  static async createDispatch(data: Partial<Dispatch>): Promise<Dispatch> {
    const response = await apiClient.post<Dispatch>('/dispatch', data);
    return response.data;
  }

  static async updateDispatchStatus(id: string, status: string, deliveredItems?: any[], globalDamagedQty?: number, globalShortQty?: number): Promise<Dispatch> {
    const response = await apiClient.patch<Dispatch>(`/dispatch/${id}/status`, { status, deliveredItems, globalDamagedQty, globalShortQty });
    return response.data;
  }
}
