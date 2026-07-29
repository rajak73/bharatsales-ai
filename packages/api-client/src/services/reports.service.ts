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

  static async getExport(jobId: string): Promise<{ data: string, filename: string, contentType: string }> {
    const response = await apiClient.get<{ data: string, filename: string, contentType: string }>(`/reports/exports/${jobId}`);
    return response.data;
  }

  static async scheduleReport(payload: any): Promise<any> {
    const response = await apiClient.post<any>('/reports/schedule', payload);
    return response.data;
  }

  static async getSchedules(): Promise<any[]> {
    const response = await apiClient.get<any[]>('/reports/schedules');
    return response.data;
  }
}

