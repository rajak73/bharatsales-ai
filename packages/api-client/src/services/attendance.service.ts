import { apiClient } from '../index';
import type { AttendanceSession } from '@bharatsales/shared-types';

export const AttendanceService = {
  startDay: async (data: { lat: number; lng: number; accuracy: number; deviceTimestamp: string; photoUrl?: string }): Promise<AttendanceSession> => {
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

  getHistory: async (): Promise<AttendanceSession[]> => {
    const response = await apiClient.get('/attendance/history');
    return response.data;
  },

  requestRegularization: async (sessionId: string, reason: string): Promise<AttendanceSession> => {
    const response = await apiClient.post(`/attendance/${sessionId}/regularize`, { reason });
    return response.data;
  },

  getPendingRegularizations: async (): Promise<AttendanceSession[]> => {
    const response = await apiClient.get('/attendance/regularizations/pending');
    return response.data;
  },

  approveRegularization: async (sessionId: string, status: 'APPROVED' | 'REJECTED'): Promise<AttendanceSession> => {
    const response = await apiClient.post(`/attendance/regularizations/${sessionId}/approve`, { status });
    return response.data;
  },
};
