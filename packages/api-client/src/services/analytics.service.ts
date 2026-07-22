import { apiClient } from '../index';

export class AnalyticsService {
  static async getDashboardData(): Promise<any> {
    const response = await apiClient.get<any>('/analytics/dashboard');
    return response.data;
  }
}
