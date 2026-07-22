import { apiClient } from '../index';
import type { Tenant } from '@bharatsales/shared-types';

export class SuperadminService {
  static async getAllTenants(): Promise<(Tenant & { userCount: number })[]> {
    const response = await apiClient.get<(Tenant & { userCount: number })[]>('/superadmin/tenants');
    return response.data;
  }

  static async updateTenantStatus(id: string, status: string): Promise<Tenant> {
    const response = await apiClient.patch<Tenant>(`/superadmin/tenants/${id}/status`, { status });
    return response.data;
  }
}
