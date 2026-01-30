import { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';

/**
 * Hook to ensure user roles are up to date.
 * Calls refreshUser on mount to sync client state with server.
 * Useful for pages where role-based access or UI is critical.
 */
export const useRoleCheck = () => {
    const { refreshUser, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            refreshUser();
        }
    }, [isAuthenticated, refreshUser]);
};
