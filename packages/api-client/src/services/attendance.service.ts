import { apiClient } from '../index';
import type { AttendanceSession } from '@bharatsales/shared-types';

export const AttendanceService = {
  startDay: async (data: { lat: number; lng: number; accuracy: number; deviceTimestamp: string }): Promise<AttendanceSession> => {
    const response = await apiClient.post('/attendance/start', data);
    return response.data;
  },

  endDay: async (data: { lat: number; lng: number; accuracy: number }): Promise<AttendanceSession> => {
    const response = await apiClient.post('/attendance/end', data);
    return response.data;
  },

  getCurrentSession: async (): Promise<AttendanceSession | null> => {
    const response = await apiClient.get('/attendance/me');
    return response.data;
  },
};
