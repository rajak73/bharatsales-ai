import { apiClient } from '../index';

export const HealthService = {
  getLive: async () => {
    const response = await apiClient.get('/health/live');
    return response.data;
  },
  getReady: async () => {
    const response = await apiClient.get('/health/ready');
    return response.data;
  },
};
