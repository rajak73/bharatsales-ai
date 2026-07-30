import { apiClient } from '../index';

export const SupportService = {
  createTicket: async (data: { subject: string; message: string; priority?: string }): Promise<any> => {
    const response = await apiClient.post('/support/tickets', data);
    return response.data;
  },

  getMyOrgTickets: async (): Promise<any[]> => {
    const response = await apiClient.get('/support/tickets');
    return response.data;
  },
};
