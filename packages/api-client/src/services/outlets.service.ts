import type { Outlet } from '@bharatsales/shared-types';
import { apiClient } from '../index';

export class OutletsService {
  static async getOutlets(): Promise<Outlet[]> {
    const response = await apiClient.get<Outlet[]>('/outlets');
    return response.data;
  }

  static async createOutlet(data: Omit<Outlet, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<Outlet> {
    const response = await apiClient.post<Outlet>('/outlets', data);
    return response.data;
  }

  static async updateOutlet(id: string, data: Partial<Outlet>): Promise<Outlet> {
    const response = await apiClient.patch<Outlet>(`/outlets/${id}`, data);
    return response.data;
  }
}
