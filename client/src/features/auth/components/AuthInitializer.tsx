'use client';

import { useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { startTokenRefreshMonitoring, stopTokenRefreshMonitoring } from '@/lib/utils/token-refresh';

/**
 * Starts token refresh monitoring when the app loads with an existing session.
 * This handles the case where a user refreshes the page or opens a new tab —
 * tokens are rehydrated from localStorage but the proactive refresh timer
 * needs to be re-established.
 *
 * Render this once near the top of the component tree (inside Redux Provider).
 */
export function AuthInitializer(): null {
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

    useEffect(() => {
        if (isAuthenticated) {
            startTokenRefreshMonitoring();
        }

        return () => {
            stopTokenRefreshMonitoring();
        };
    }, [isAuthenticated]);

    return null;
}
