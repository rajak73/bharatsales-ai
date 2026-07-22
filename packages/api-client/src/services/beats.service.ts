import { apiClient } from '../index';
import type { Beat, BeatSchedule } from '@bharatsales/shared-types';

export class BeatsService {
  static async getTodayBeat(): Promise<BeatSchedule | null> {
    try {
      const response = await apiClient.get<BeatSchedule>('/beats/today');
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  }
  static async getBeats(): Promise<Beat[]> {
    const response = await apiClient.get<Beat[]>('/beats');
    return response.data;
  }

  static async createBeat(data: Partial<Beat>): Promise<Beat> {
    const response = await apiClient.post<Beat>('/beats', data);
    return response.data;
  }
}
