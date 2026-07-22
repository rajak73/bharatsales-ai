import { apiClient } from '../index';
import type { ScheduledReport, RecentExport } from '@bharatsales/shared-types';

export class ScheduledReportsService {
  static async getScheduledReports(): Promise<ScheduledReport[]> {
    const response = await apiClient.get<ScheduledReport[]>('/scheduled-reports');
    return response.data;
  }

  static async getRecentExports(): Promise<RecentExport[]> {
    const response = await apiClient.get<RecentExport[]>('/scheduled-reports/exports');
    return response.data;
  }
}
