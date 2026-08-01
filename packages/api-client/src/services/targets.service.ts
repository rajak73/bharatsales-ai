import { apiClient } from '../index';
import type { SalesTarget } from '@bharatsales/shared-types';

export class TargetsService {
  static async getTargets(): Promise<SalesTarget[]> {
    const response = await apiClient.get<SalesTarget[]>('/targets');
    return response.data;
  }

  static async createTarget(data: Partial<SalesTarget>): Promise<SalesTarget> {
    const response = await apiClient.post<SalesTarget>('/targets', data);
    return response.data;
  }

  static async updateTarget(id: string, data: Partial<SalesTarget>): Promise<SalesTarget> {
    const response = await apiClient.put<SalesTarget>(`/targets/${id}`, data);
    return response.data;
  }

  static async deleteTarget(id: string): Promise<{ deleted: boolean }> {
    const response = await apiClient.delete<{ deleted: boolean }>(`/targets/${id}`);
    return response.data;
  }
}
