import { apiClient } from '../index';
import type { ReturnOrder } from '@bharatsales/shared-types';

export class ReturnsService {
  static async getReturns(organizationId: string): Promise<ReturnOrder[]> {
    const response = await apiClient.get<ReturnOrder[]>('/returns', {
      params: { organizationId },
    });
    return response.data;
  }

  static async updateReturnStatus(id: string, status: string): Promise<ReturnOrder> {
    const response = await apiClient.patch<ReturnOrder>(`/returns/${id}/status`, { status });
    return response.data;
  }
}
