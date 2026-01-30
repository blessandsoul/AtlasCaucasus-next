'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { ROUTES } from '@/lib/constants/routes';

interface RequireUnverifiedProps {
    children: React.ReactNode;
}

/**
 * Wrapper component that ensures only unverified users can access a route
 * Redirects verified users to home page
 * Redirects unauthenticated users to login page
 */
export const RequireUnverified = ({ children }: RequireUnverifiedProps) => {
    const router = useRouter();
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);

    useEffect(() => {
        // If not authenticated, redirect to login
        if (!isAuthenticated) {
            router.replace(ROUTES.LOGIN);
            return;
        }

        // If email is already verified, redirect to home
        if (user?.emailVerified) {
            router.replace(ROUTES.HOME);
        }
    }, [isAuthenticated, user?.emailVerified, router]);

    // Show nothing while redirecting
    if (!isAuthenticated || user?.emailVerified) {
        return null;
    }

    // User is authenticated but not verified - allow access
    return <>{children}</>;
};
