import { apiClient } from '../index';
import type { ScheduledReport, RecentExport } from '@bharatsales/shared-types';

export class ScheduledReportsService {
  static async getScheduledReports(): Promise<ScheduledReport[]> {
    return Promise.resolve([]);
  }

  static async getRecentExports(): Promise<RecentExport[]> {
    return Promise.resolve([]);
  }
}
