import { apiClient } from '../index';
import type { ReturnOrder } from '@bharatsales/shared-types';

export class ReturnsService {
  static async getReturns(): Promise<ReturnOrder[]> {
    const response = await apiClient.get<ReturnOrder[]>('/returns');
    return response.data;
  }

  static async updateReturnStatus(id: string, status: string, restockClassification?: string): Promise<ReturnOrder> {
    const response = await apiClient.patch<ReturnOrder>(`/returns/${id}/status`, { status, restockClassification });
    return response.data;
  }

  static async createReturn(data: Partial<ReturnOrder>): Promise<ReturnOrder> {
    const response = await apiClient.post<ReturnOrder>('/returns', data);
    return response.data;
  }

  static async updateReturn(id: string, data: Partial<ReturnOrder>): Promise<ReturnOrder> {
    const response = await apiClient.put<ReturnOrder>(`/returns/${id}`, data);
    return response.data;
  }

  static async deleteReturn(id: string): Promise<{ deleted: boolean }> {
    const response = await apiClient.delete<{ deleted: boolean }>(`/returns/${id}`);
    return response.data;
  }

  static async approveReturn(id: string): Promise<ReturnOrder> {
    const response = await apiClient.post<ReturnOrder>(`/returns/${id}/approve`);
    return response.data;
  }

  static async rejectReturn(id: string): Promise<ReturnOrder> {
    const response = await apiClient.post<ReturnOrder>(`/returns/${id}/reject`);
    return response.data;
  }
}
