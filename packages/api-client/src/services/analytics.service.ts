import { apiClient } from '../index';

export class AnalyticsService {
  static async getDashboardData(organizationId: string): Promise<any> {
    const response = await apiClient.get<any>('/analytics/dashboard', {
      params: { organizationId },
    });
    return response.data;
  }
}
