import { apiClient } from '../index';
import type { Distributor } from '@bharatsales/shared-types';

export class DistributorsService {
  static async getDistributors(): Promise<Distributor[]> {
    const response = await apiClient.get<Distributor[]>('/distributors');
    return response.data;
  }

  static async createDistributor(data: Partial<Distributor>): Promise<Distributor> {
    const response = await apiClient.post<Distributor>('/distributors', data);
    return response.data;
  }

  static async updateDistributor(id: string, data: Partial<Distributor>): Promise<Distributor> {
    const response = await apiClient.patch<Distributor>(`/distributors/${id}`, data);
    return response.data;
  }

  static async deleteDistributor(id: string): Promise<boolean> {
    const response = await apiClient.delete<boolean>(`/distributors/${id}`);
    return response.data;
  }
}
