import { apiClient } from '../index';
import type { Order } from '@bharatsales/shared-types';

export const OrdersService = {
  getOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get('/orders');
    return response.data;
  },

  createOrder: async (data: Partial<Order>): Promise<Order> => {
    const response = await apiClient.post('/orders', data);
    return response.data;
  },

  approveOrder: async (orderId: string): Promise<Order> => {
    const response = await apiClient.post(`/orders/${orderId}/approve`);
    return response.data;
  },

  dispatchOrder: async (orderId: string): Promise<Order> => {
    const response = await apiClient.post(`/orders/${orderId}/dispatch`);
    return response.data;
  },
};
