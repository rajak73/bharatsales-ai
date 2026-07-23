import { apiClient } from '../index';

export class ExportsService {
  static async getExportJobs(): Promise<any[]> {
    const response = await apiClient.get<any[]>('/exports');
    return response.data;
  }

  static async requestExport(entityType: string, filters: any = {}): Promise<any> {
    const response = await apiClient.post<any>('/exports', { entityType, filters });
    return response.data;
  }
}
