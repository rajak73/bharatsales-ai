import { apiClient } from '../index';
import type { Visit } from '@bharatsales/shared-types';

export const VisitsService = {
  checkIn: async (data: { outletId: string; lat: number; lng: number; accuracy: number }): Promise<Visit> => {
    const response = await apiClient.post('/visits/check-in', data);
    return response.data;
  },

  checkOut: async (visitId: string): Promise<Visit> => {
    const response = await apiClient.post(`/visits/${visitId}/check-out`);
    return response.data;
  },
};
