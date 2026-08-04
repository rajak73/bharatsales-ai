import { apiClient } from '../index';
import { getTokenStorage } from '../token-storage';

export const AuthService = {
  login: async (credentials: { email: string; password?: string; otp?: string; deviceInfo?: string }) => {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.data.access_token) {
      const storage = getTokenStorage();
      await storage.setTokens(response.data.access_token, response.data.refresh_token);
      if (response.data.user) {
        await storage.setUser(response.data.user);
      }
    }
    return response.data;
  },
  register: async (details: any) => {
    const response = await apiClient.post('/auth/register', details);
    return response.data;
  },
  acceptInvitation: async (token: string, newPassword: string) => {
    const response = await apiClient.post('/auth/accept-invitation', { token, newPassword });
    return response.data;
  },
  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (token: string, newPassword: string) => {
    const response = await apiClient.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },
  verifyEmail: async (token: string) => {
    const response = await apiClient.post('/auth/verify-email', { token });
    return response.data;
  },
  logout: async () => {
    const storage = getTokenStorage();
    const refreshToken = await storage.getRefreshToken();
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refreshToken });
      } catch (e) {
        // ignore failures on logout
      }
    }
    await storage.clearTokens();
    storage.onUnauthenticated();
  },
  getActiveSessions: async () => {
    const response = await apiClient.get('/auth/sessions');
    return response.data;
  },
  revokeSession: async (sessionId: string) => {
    const response = await apiClient.delete(`/auth/sessions/${sessionId}`);
    return response.data;
  },
  registerPushToken: async (pushToken: string) => {
    const response = await apiClient.post('/auth/push-token', { pushToken });
    return response.data;
  }
};
