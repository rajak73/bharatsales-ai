import { apiClient } from '../index';

export class PerformanceService {
  static async getDSR(date: string): Promise<any> {
    const response = await apiClient.get<any>('/api/v1/performance/dsr', {
      params: { date },
    });
    return response.data;
  }

  static async getTeamDSR(date: string): Promise<any> {
    const response = await apiClient.get<any>('/api/v1/performance/team-dsr', {
      params: { date },
    });
    return response.data;
  }

  static async getTeamTargets(): Promise<any> {
    const response = await apiClient.get<any>('/api/v1/performance/team-targets');
    return response.data;
  }
}
