import { apiClient } from '../index';
import type { Report, ReportStats } from '@bharatsales/shared-types';

export class ReportsService {
  static async getReports(): Promise<Report[]> {
    const response = await apiClient.get<Report[]>('/reports');
    return response.data;
  }

  static async getReportStats(): Promise<ReportStats> {
    const response = await apiClient.get<ReportStats>('/reports/stats');
    return response.data;
  }

  static async runReport(payload: any): Promise<{ jobId: string }> {
    const response = await apiClient.post<{ jobId: string }>('/reports/run', payload);
    return response.data;
  }

  static async getJobStatus(jobId: string): Promise<any> {
    const response = await apiClient.get<any>(`/reports/jobs/${jobId}`);
    return response.data;
  }

  static async getExport(jobId: string): Promise<{ downloadUrl: string, expiresAt: string }> {
    const response = await apiClient.get<{ downloadUrl: string, expiresAt: string }>(`/reports/exports/${jobId}`);
    return response.data;
  }
}
