import { apiClient } from '../index';

export const HealthService = {
  getLive: async () => {
    const response = await apiClient.get('/api/v1/health/live');
    return response.data;
  },
  getReady: async () => {
    const response = await apiClient.get('/api/v1/health/ready');
    return response.data;
  },
};
