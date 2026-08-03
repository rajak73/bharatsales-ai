import axios from 'axios';
import { getTokenStorage } from './token-storage';
export * from './token-storage';
declare var process: any;

// Safely get the base URL depending on the bundler (Next.js, Vite, or Expo/Metro)
const getBaseUrl = () => {
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    // @ts-ignore
    return import.meta.env.VITE_API_URL;
  }
  return 'http://127.0.0.1:6002'; // Fallback for local development
};

const baseURL = getBaseUrl();

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<any> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(async (config) => {
  const token = await getTokenStorage().getAccessToken();

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const storage = getTokenStorage();
      const refreshToken = await storage.getRefreshToken();

      if (!refreshToken) {
        await storage.clearTokens();
        storage.onUnauthenticated();
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });

        await storage.setTokens(res.data.access_token, res.data.refresh_token);

        apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + res.data.access_token;
        originalRequest.headers['Authorization'] = 'Bearer ' + res.data.access_token;

        processQueue(null, res.data.access_token);
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        await storage.clearTokens();
        storage.onUnauthenticated();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export * from './services/health.service';
export * from './services/auth.service';
export * from './services/hierarchy.service';
export * from './services/outlets.service';
export * from './services/orders.service';
export * from './services/products.service';
export * from './services/attendance.service';
export * from './services/visits.service';
export * from './services/inventory.service';
export * from './services/returns.service';
export * from './services/users.service';
export * from './services/beats.service';
export * from './services/tracking.service';
export * from './services/collections.service';
export * from './services/targets.service';
export * from './services/notifications.service';
export * from './services/roles.service';
export * from './services/settings.service';
export * from './services/incentives.service';
export * from './services/live-map.service';
export * from './services/outlet-360.service';
export * from './services/reports.service';
export * from './services/approvals.service';
export * from './services/performance.service';
export * from './services/finance.service';
export * from './services/superadmin.service';
export * from './services/support.service';
export * from './services/onboarding.service';
export * from './services/analytics.service';
export * from './services/distributors.service';
export * from './services/uploads.service';
export * from './services/dispatch.service';
export * from './services/schemes.service';
export * from './services/tax-rates.service';
export * from './services/price-lists.service';
