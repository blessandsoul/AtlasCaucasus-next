'use client';

import { jwtDecode } from 'jwt-decode';
import { store } from '@/store';
import { logout, updateTokens } from '@/features/auth/store/authSlice';
import { clearCsrfToken, ensureCsrfToken } from '@/lib/api/csrf';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

// Refresh token 5 minutes before expiration
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

// Rate limiting configuration
// Server allows 3 refresh requests per 15 minutes, we stay under that with 2
const MAX_REFRESH_ATTEMPTS = 2;
const REFRESH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Track refresh attempts with timestamps
const refreshAttempts: number[] = [];

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

interface TokenPayload {
    exp: number;
    userId: string;
    iat: number;
}

/**
 * Get token expiration time in milliseconds
 */
const getTokenExpiration = (token: string): number | null => {
    try {
        const decoded = jwtDecode<TokenPayload>(token);
        return decoded.exp * 1000; // Convert to milliseconds
    } catch (error) {
        console.error('Failed to decode token:', error);
        return null;
    }
};

/**
 * Calculate time until token should be refreshed
 */
const getTimeUntilRefresh = (token: string): number => {
    const expirationTime = getTokenExpiration(token);
    if (!expirationTime) return 0;

    const now = Date.now();
    const timeUntilExpiration = expirationTime - now;
    const timeUntilRefresh = timeUntilExpiration - REFRESH_THRESHOLD_MS;

    return Math.max(0, timeUntilRefresh);
};

/**
 * Clean up old refresh attempts outside the time window
 */
const cleanupOldAttempts = (): void => {
    const now = Date.now();
    const cutoff = now - REFRESH_WINDOW_MS;

    // Remove attempts older than the window
    while (refreshAttempts.length > 0 && refreshAttempts[0] < cutoff) {
        refreshAttempts.shift();
    }
};

/**
 * Check if we can attempt a token refresh (within rate limits)
 */
const canAttemptRefresh = (): boolean => {
    cleanupOldAttempts();
    return refreshAttempts.length < MAX_REFRESH_ATTEMPTS;
};

/**
 * Get the number of refresh attempts in the current window
 */
export const getRefreshAttemptCount = (): number => {
    cleanupOldAttempts();
    return refreshAttempts.length;
};

/**
 * Calculate exponential backoff delay based on attempt count
 */
const getBackoffDelay = (attemptCount: number): number => {
    // Exponential backoff: 1s, 2s, 4s, 8s... capped at 30s
    const baseDelay = 1000;
    const delay = Math.min(baseDelay * Math.pow(2, attemptCount), 30000);
    return delay;
};

/**
 * Handle logout due to refresh failure
 */
const handleRefreshFailure = (reason: string): void => {
    console.warn(`Token refresh failed: ${reason}`);
    store.dispatch(logout());
    clearCsrfToken();

    if (typeof window !== 'undefined') {
        // Explicitly clear localStorage to prevent rehydration loop
        try {
            localStorage.removeItem('auth');
        } catch {
            // Ignore localStorage errors
        }

        // Add reason to URL for user feedback
        const encodedReason = encodeURIComponent(reason);
        window.location.href = `/login?reason=${encodedReason}`;
    }
};

/**
 * Reset refresh attempts (call on successful login)
 */
export const resetRefreshAttempts = (): void => {
    refreshAttempts.length = 0;
};

/**
 * Refresh the access token using refresh token
 * Implements rate limiting and exponential backoff
 */
export const refreshAccessToken = async (): Promise<boolean> => {
    // If a refresh is already in progress, wait for it
    if (isRefreshing && refreshPromise) {
        return refreshPromise;
    }

    // Check rate limit before attempting
    if (!canAttemptRefresh()) {
        handleRefreshFailure('session_expired');
        return false;
    }

    isRefreshing = true;

    refreshPromise = (async (): Promise<boolean> => {
        try {
            const state = store.getState();
            const refreshToken = state.auth.tokens?.refreshToken;

            if (!refreshToken) {
                handleRefreshFailure('no_refresh_token');
                return false;
            }

            // Record this attempt
            const attemptCount = refreshAttempts.length;
            refreshAttempts.push(Date.now());

            // Apply exponential backoff if this isn't the first attempt
            if (attemptCount > 0) {
                const backoffDelay = getBackoffDelay(attemptCount);
                await new Promise(resolve => setTimeout(resolve, backoffDelay));
            }

            // Fetch CSRF token before refresh request (raw axios bypasses apiClient interceptors)
            let csrfToken: string | undefined;
            try {
                csrfToken = await ensureCsrfToken();
            } catch {
                // Continue without CSRF if fetch fails
            }

            const response = await axios.post(
                `${API_BASE_URL}/auth/refresh`,
                { refreshToken },
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json',
                        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
                    },
                }
            );

            const { accessToken, refreshToken: newRefreshToken } = response.data.data;

            // Update Redux store (this will also update localStorage)
            store.dispatch(
                updateTokens({
                    accessToken,
                    refreshToken: newRefreshToken,
                })
            );

            // Schedule next refresh
            scheduleTokenRefresh(accessToken);

            return true;
        } catch (error: unknown) {
            console.error('Failed to refresh token:', error);

            // Check error details from server
            const axiosError = error as { response?: { status?: number; data?: { error?: { code?: string } } } };
            const errorCode = axiosError?.response?.data?.error?.code;
            const statusCode = axiosError?.response?.status;

            // Handle specific error cases that require immediate logout
            if (errorCode === 'RATE_LIMIT_EXCEEDED') {
                handleRefreshFailure('rate_limited');
                return false;
            }

            // 401/403 from refresh endpoint means token is invalid or user doesn't exist
            // These are unrecoverable - logout immediately
            if (statusCode === 401 || statusCode === 403) {
                handleRefreshFailure('session_expired');
                return false;
            }

            // For other errors (network issues, etc.), check if we've exhausted attempts
            if (!canAttemptRefresh()) {
                handleRefreshFailure('session_expired');
            }

            return false;
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
};

/**
 * Schedule automatic token refresh
 */
export const scheduleTokenRefresh = (accessToken: string): void => {
    // Clear existing timer
    if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
    }

    const timeUntilRefresh = getTimeUntilRefresh(accessToken);

    if (timeUntilRefresh <= 0) {
        // Token is already expired or about to expire, refresh immediately
        refreshAccessToken();
        return;
    }

    // Schedule refresh
    refreshTimer = setTimeout(() => {
        refreshAccessToken();
    }, timeUntilRefresh);
};

/**
 * Start automatic token refresh monitoring
 * Should be called when user logs in or app initializes with existing tokens
 */
export const startTokenRefreshMonitoring = (): void => {
    const state = store.getState();
    const accessToken = state.auth.tokens?.accessToken;

    if (!accessToken) {
        return;
    }

    // Check if token is valid
    const expirationTime = getTokenExpiration(accessToken);
    if (!expirationTime) {
        return;
    }

    const now = Date.now();
    if (expirationTime <= now) {
        // Token is already expired, try to refresh immediately
        refreshAccessToken();
        return;
    }

    // Schedule refresh
    scheduleTokenRefresh(accessToken);
};

/**
 * Stop automatic token refresh monitoring
 * Should be called when user logs out
 */
export const stopTokenRefreshMonitoring = (): void => {
    if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
    }
    isRefreshing = false;
};
