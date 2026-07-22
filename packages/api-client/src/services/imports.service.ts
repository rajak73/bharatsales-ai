import { apiClient } from '../index';
import type { ImportHistoryItem, ImportTypeConfig } from '@bharatsales/shared-types';

export class ImportsService {
  static async getImportHistory(): Promise<ImportHistoryItem[]> {
    const response = await apiClient.get<ImportHistoryItem[]>('/imports/history');
    return response.data;
  }

  static async getImportTypes(): Promise<ImportTypeConfig[]> {
    const response = await apiClient.get<ImportTypeConfig[]>('/imports/types');
    return response.data;
  }

  static async uploadFile(type: string, fileBase64: string): Promise<{ success: boolean; recordsProcessed: number; errors: number; message: string }> {
    const response = await apiClient.post('/imports/upload', {
      type,
      fileBase64
    });
    return response.data;
  }
}
