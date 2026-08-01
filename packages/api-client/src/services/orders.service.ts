import { apiClient } from '../index';
import type { Order } from '@bharatsales/shared-types';

export const OrdersService = {
  getOrders: async (params?: { mine?: boolean }): Promise<Order[]> => {
    const response = await apiClient.get('/orders', { params });
    return response.data;
  },

  createOrder: async (data: Partial<Order>): Promise<Order> => {
    const response = await apiClient.post('/orders', data);
    return response.data;
  },

  getOrderById: async (orderId: string): Promise<Order> => {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data;
  },

  updateOrderStatus: async (orderId: string, status: Order['status'], reason?: string): Promise<Order> => {
    const response = await apiClient.put(`/orders/${orderId}/status`, { status, reason });
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

  rejectOrder: async (orderId: string, reason?: string): Promise<Order> => {
    const response = await apiClient.post(`/orders/${orderId}/reject`, { reason });
    return response.data;
  },

  cancelOrder: async (orderId: string, reason?: string): Promise<Order> => {
    const response = await apiClient.post(`/orders/${orderId}/cancel`, { reason });
    return response.data;
  },
};
