import type { Scheme } from '@bharatsales/shared-types';
import { apiClient } from '../index';

export class SchemesService {
  static async getSchemes(): Promise<Scheme[]> {
    const response = await apiClient.get<Scheme[]>('/schemes');
    return response.data;
  }

  static async createScheme(data: Omit<Scheme, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<Scheme> {
    const response = await apiClient.post<Scheme>('/schemes', data);
    return response.data;
  }

  static async updateScheme(id: string, data: Partial<Scheme>): Promise<Scheme> {
    const response = await apiClient.put<Scheme>(`/schemes/${id}`, data);
    return response.data;
  }

  static async deleteScheme(id: string): Promise<{ deleted: boolean }> {
    const response = await apiClient.delete<{ deleted: boolean }>(`/schemes/${id}`);
    return response.data;
  }
}
