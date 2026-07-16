import { apiClient } from '../index';
// unused import removed

export class Outlet360Service {
  static async getOutlet360(organizationId: string, outletCode: string): Promise<any> {
    const response = await apiClient.get(`/outlets/${outletCode}/360?orgId=${organizationId}`);
    return response.data;
  }
}
