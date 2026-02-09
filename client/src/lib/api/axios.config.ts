import axios from 'axios';
import { store } from '@/store';
import { getCsrfToken, fetchCsrfToken, clearCsrfToken } from './csrf';
import { refreshAccessToken } from '@/lib/utils/token-refresh';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

// Methods that require CSRF token
const STATE_CHANGING_METHODS = ['post', 'put', 'patch', 'delete'];

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true, // Important: include cookies for CSRF
});

// Request interceptor - Add auth token, CSRF token, and set Content-Type
apiClient.interceptors.request.use(async (config) => {
  const token = store.getState().auth.tokens?.accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add CSRF token for state-changing requests
  const method = config.method?.toLowerCase() || '';
  if (STATE_CHANGING_METHODS.includes(method)) {
    let csrf = getCsrfToken();
    // Fetch CSRF token if not available
    if (!csrf) {
      try {
        csrf = await fetchCsrfToken();
      } catch (error) {
        console.warn('Failed to fetch CSRF token:', error);
      }
    }
    if (csrf && config.headers) {
      config.headers['X-CSRF-Token'] = csrf;
    }
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

// Response interceptor - Handle token refresh and CSRF errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const errorCode = error.response?.data?.error?.code;

    // Handle email not verified (403 with EMAIL_NOT_VERIFIED)
    // Redirect to verify-email-pending page so user can verify their email
    if (
      error.response?.status === 403 &&
      errorCode === 'EMAIL_NOT_VERIFIED'
    ) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/verify-email')) {
        window.location.href = '/verify-email-pending';
      }
      return Promise.reject(error);
    }

    // Handle CSRF token errors (403 with INVALID_CSRF_TOKEN)
    if (
      error.response?.status === 403 &&
      errorCode === 'INVALID_CSRF_TOKEN' &&
      !originalRequest._csrfRetry
    ) {
      originalRequest._csrfRetry = true;

      try {
        // Clear old token and fetch a new one
        clearCsrfToken();
        const newCsrfToken = await fetchCsrfToken();

        // Update the request with new CSRF token
        originalRequest.headers['X-CSRF-Token'] = newCsrfToken;

        // Retry the request
        return apiClient(originalRequest);
      } catch (csrfError) {
        console.error('Failed to refresh CSRF token:', csrfError);
        // If CSRF refresh fails, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(csrfError);
      }
    }

    // Handle auth token expiration (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Use rate-limited refresh with backoff
      const refreshSuccess = await refreshAccessToken();

      if (refreshSuccess) {
        // Get the new access token and retry the request
        const newAccessToken = store.getState().auth.tokens?.accessToken;
        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      }

      // Refresh failed - refreshAccessToken already handles logout and redirect
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);
