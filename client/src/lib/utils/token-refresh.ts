'use client';

import { jwtDecode } from 'jwt-decode';
import { store } from '@/store';
import { updateTokens } from '@/features/auth/store/authSlice';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

// Refresh token 5 minutes before expiration
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let isRefreshing = false;

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
 * Refresh the access token using refresh token
 */
const refreshAccessToken = async (): Promise<boolean> => {
    if (isRefreshing) {
        return false;
    }

    isRefreshing = true;

    try {
        const state = store.getState();
        const refreshToken = state.auth.tokens?.refreshToken;

        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
        });

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
    } catch (error) {
        console.error('Failed to refresh token:', error);
        // Don't clear auth here - let the 401 interceptor handle it
        return false;
    } finally {
        isRefreshing = false;
    }
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
