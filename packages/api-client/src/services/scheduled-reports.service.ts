import { apiClient } from '../index';
import type { ScheduledReport, RecentExport } from '@bharatsales/shared-types';

export class ScheduledReportsService {
  static async getScheduledReports(organizationId: string): Promise<ScheduledReport[]> {
    const response = await apiClient.get<ScheduledReport[]>('/scheduled-reports', {
      params: { organizationId },
    });
    return response.data;
  }

  static async getRecentExports(organizationId: string): Promise<RecentExport[]> {
    const response = await apiClient.get<RecentExport[]>('/scheduled-reports/exports', {
      params: { organizationId },
    });
    return response.data;
  }
}
