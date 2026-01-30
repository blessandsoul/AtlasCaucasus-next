import axios from 'axios';
import { store } from '@/store';
import { logout, updateTokens } from '@/features/auth/store/authSlice';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor - Add auth token and set Content-Type
apiClient.interceptors.request.use((config) => {
  const token = store.getState().auth.tokens?.accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Set Content-Type to application/json only if not already set and not FormData
  // For FormData, let axios set the Content-Type automatically with the boundary
  if (config.headers && !config.headers['Content-Type']) {
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
  }

  return config;
});

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = store.getState().auth.tokens?.refreshToken;
        if (!refreshToken) {
          store.dispatch(logout());
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;

        store.dispatch(
          updateTokens({ accessToken, refreshToken: newRefreshToken })
        );

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        store.dispatch(logout());
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
