import { apiClient } from '../index';
// unused import removed

export class Outlet360Service {
  static async getOutlet360(outletCode: string): Promise<any> {
    const response = await apiClient.get(`/outlets/${outletCode}/360`);
    return response.data;
  }
}
