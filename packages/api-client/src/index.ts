import axios from 'axios';
declare var process: any;

const baseURL = process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL || 'http://localhost:6002';

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

apiClient.interceptors.request.use((config) => {
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('bharatsales_token');
  }

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
      
      let refreshToken = null;
      if (typeof window !== 'undefined') {
        refreshToken = localStorage.getItem('bharatsales_refresh_token');
      }

      if (!refreshToken) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('bharatsales_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('bharatsales_token', res.data.access_token);
          localStorage.setItem('bharatsales_refresh_token', res.data.refresh_token);
        }
        
        apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + res.data.access_token;
        originalRequest.headers['Authorization'] = 'Bearer ' + res.data.access_token;
        
        processQueue(null, res.data.access_token);
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('bharatsales_token');
          localStorage.removeItem('bharatsales_refresh_token');
          window.location.href = '/login';
        }
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
export * from './services/analytics.service';
export * from './services/outlets.service';
export * from './services/products.service';
export * from './services/orders.service';
export * from './services/attendance.service';
export * from './services/visits.service';
export * from './services/distributors.service';
export * from './services/inventory.service';
export * from './services/returns.service';
export * from './services/dispatch.service';
export * from './services/invoices.service';
export * from './services/users.service';
export * from './services/beats.service';
export * from './services/tracking.service';
export * from './services/collections.service';
export * from './services/targets.service';
export * from './services/schemes.service';
export * from './services/expenses.service';
export * from './services/warehouses.service';
export * from './services/notifications.service';
export * from './services/roles.service';
export * from './services/settings.service';
export * from './services/tax-rates.service';
export * from './services/subscription.service';
export * from './services/price-lists.service';
export * from './services/incentives.service';
export * from './services/imports.service';
export * from './services/live-map.service';
export * from './services/outlet-360.service';
export * from './services/reports.service';
export * from './services/scheduled-reports.service';
export * from './services/ai-features.service';
export * from './services/approvals.service';
export * from './services/devices.service';
export * from './services/integrations.service';
export * from './services/performance.service';
export * from './services/hierarchy.service';
