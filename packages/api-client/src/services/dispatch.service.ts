import { apiClient } from '../index';
import type { Dispatch } from '@bharatsales/shared-types';

export const DispatchService = {
  getDispatches: async (): Promise<Dispatch[]> => {
    const response = await apiClient.get('/dispatches');
    return response.data;
  },

  createDispatch: async (data: { orderId: string; vehicle: string; driver: string }): Promise<Dispatch> => {
    const response = await apiClient.post('/dispatches', data);
    return response.data;
  },

  confirmDelivery: async (
    dispatchId: string,
    items: { productId: string; deliveredQty: number; damagedQty?: number; reason?: string; evidence?: string[] }[]
  ): Promise<Dispatch> => {
    const response = await apiClient.post(`/dispatches/${dispatchId}/deliver`, { items });
    return response.data;
  },
};
