'use client';

import { jwtDecode } from 'jwt-decode';
import { store } from '@/store';
import { logout, updateTokens } from '@/features/auth/store/authSlice';
import { clearCsrfToken, ensureCsrfToken, fetchCsrfToken } from '@/lib/api/csrf';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

// Refresh token 5 minutes before expiration
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

// Retry delay when proactive refresh fails due to a transient error
const RETRY_DELAY_MS = 30 * 1000; // 30 seconds

// Rate limiting configuration
// Server allows 3 refresh requests per 15 minutes, we stay under that
const MAX_REFRESH_ATTEMPTS = 3;
const REFRESH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Track refresh attempts with timestamps
const refreshAttempts: number[] = [];

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;
let visibilityListenerAttached = false;

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
 * Make the refresh POST request with CSRF handling.
 * If the server returns INVALID_CSRF_TOKEN, fetches a fresh CSRF token and retries once.
 */
const postRefreshWithCsrfRetry = async (
    refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string }> => {
    const makeRequest = async (csrfToken?: string): Promise<{ accessToken: string; refreshToken: string }> => {
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
        return response.data.data;
    };

    // First attempt: use cached or freshly fetched CSRF token
    let csrfToken: string | undefined;
    try {
        csrfToken = await ensureCsrfToken();
    } catch {
        // Continue without CSRF if fetch fails
    }

    try {
        return await makeRequest(csrfToken);
    } catch (error: unknown) {
        const axiosError = error as { response?: { status?: number; data?: { error?: { code?: string } } } };
        const errorCode = axiosError?.response?.data?.error?.code;

        // If the failure is specifically a CSRF token error, get a fresh one and retry once
        if (axiosError?.response?.status === 403 && errorCode === 'INVALID_CSRF_TOKEN') {
            clearCsrfToken();
            const freshCsrfToken = await fetchCsrfToken();
            return await makeRequest(freshCsrfToken);
        }

        throw error;
    }
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

            const { accessToken, refreshToken: newRefreshToken } =
                await postRefreshWithCsrfRetry(refreshToken);

            // Clear the CSRF token so the next apiClient request fetches a fresh one
            // (this raw axios call bypasses apiClient's interceptor that normally does this)
            clearCsrfToken();

            // Update Redux store (this will also update localStorage)
            store.dispatch(
                updateTokens({
                    accessToken,
                    refreshToken: newRefreshToken,
                })
            );

            // Reset attempt counter on success — the session is healthy
            refreshAttempts.length = 0;

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

            // 401/403 from refresh endpoint means token is invalid or session revoked
            // (CSRF 403 was already retried inside postRefreshWithCsrfRetry, so a 403
            // here is a real auth failure)
            if (statusCode === 401 || statusCode === 403) {
                handleRefreshFailure('session_expired');
                return false;
            }

            // For transient errors (network issues, 5xx), schedule a retry if we
            // haven't exhausted attempts — don't leave the user without a timer
            if (canAttemptRefresh()) {
                if (refreshTimer) clearTimeout(refreshTimer);
                refreshTimer = setTimeout(() => {
                    refreshAccessToken();
                }, RETRY_DELAY_MS);
            } else {
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
 * Handle visibility change — when the user returns to the tab, check if the
 * access token is expired or about to expire and refresh proactively.
 * Browsers throttle setTimeout in background tabs, so the scheduled timer
 * may not fire on time.
 */
const handleVisibilityChange = (): void => {
    if (document.visibilityState !== 'visible') return;

    const state = store.getState();
    const accessToken = state.auth.tokens?.accessToken;
    if (!accessToken) return;

    const expirationTime = getTokenExpiration(accessToken);
    if (!expirationTime) return;

    const now = Date.now();
    const timeUntilExpiration = expirationTime - now;

    if (timeUntilExpiration <= 0) {
        // Token already expired — refresh immediately
        refreshAccessToken();
    } else if (timeUntilExpiration <= REFRESH_THRESHOLD_MS) {
        // Token about to expire — refresh now
        refreshAccessToken();
    } else {
        // Token is still valid — re-schedule in case the timer was throttled
        scheduleTokenRefresh(accessToken);
    }
};

/**
 * Start automatic token refresh monitoring.
 * Should be called when user logs in or app initializes with existing tokens.
 * Safe to call multiple times — it replaces the previous timer and listener.
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

    // Attach visibility listener so we catch token expiry when returning to the tab
    if (typeof document !== 'undefined' && !visibilityListenerAttached) {
        document.addEventListener('visibilitychange', handleVisibilityChange);
        visibilityListenerAttached = true;
    }
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

    if (typeof document !== 'undefined' && visibilityListenerAttached) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        visibilityListenerAttached = false;
    }
};
