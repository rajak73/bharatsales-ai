import { apiClient } from '../index';
import type { ReturnOrder } from '@bharatsales/shared-types';

export class ReturnsService {
  static async getReturns(): Promise<ReturnOrder[]> {
    const response = await apiClient.get<ReturnOrder[]>('/returns');
    return response.data;
  }

  static async updateReturnStatus(id: string, status: string): Promise<ReturnOrder> {
    const response = await apiClient.patch<ReturnOrder>(`/returns/${id}/status`, { status });
    return response.data;
  }
}
