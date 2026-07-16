import { apiClient } from '../index';
import type { Report, ReportStats } from '@bharatsales/shared-types';

export class ReportsService {
  static async getReports(organizationId: string): Promise<Report[]> {
    const response = await apiClient.get<Report[]>('/reports', {
      params: { organizationId },
    });
    return response.data;
  }

  static async getReportStats(organizationId: string): Promise<ReportStats> {
    const response = await apiClient.get<ReportStats>('/reports/stats', {
      params: { organizationId },
    });
    return response.data;
  }
}
