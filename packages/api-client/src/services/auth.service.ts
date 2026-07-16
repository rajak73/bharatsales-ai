import { apiClient } from '../index';

export const AuthService = {
  login: async (credentials: { firebaseToken: string; deviceInfo?: string }) => {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.data.access_token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('bharatsales_token', response.data.access_token);
        localStorage.setItem('bharatsales_refresh_token', response.data.refresh_token);
      }
    }
    return response.data;
  },
  register: async (details: any) => {
    const response = await apiClient.post('/auth/register', details);
    return response.data;
  },
  logout: async () => {
    if (typeof window !== 'undefined') {
      const refreshToken = localStorage.getItem('bharatsales_refresh_token');
      if (refreshToken) {
        try {
          await apiClient.post('/auth/logout', { refreshToken });
        } catch (e) {
          // ignore failures on logout
        }
      }
      localStorage.removeItem('bharatsales_token');
      localStorage.removeItem('bharatsales_refresh_token');
      window.location.href = '/login';
    }
  },
  getActiveSessions: async () => {
    const response = await apiClient.get('/auth/sessions');
    return response.data;
  },
  revokeSession: async (sessionId: string) => {
    const response = await apiClient.delete(`/auth/sessions/${sessionId}`);
    return response.data;
  }
};
