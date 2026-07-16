import { apiClient } from '../index';

export class PerformanceService {
  static async getDSR(date: string): Promise<any> {
    const response = await apiClient.get<any>('/performance/dsr', {
      params: { date },
    });
    return response.data;
  }
}
