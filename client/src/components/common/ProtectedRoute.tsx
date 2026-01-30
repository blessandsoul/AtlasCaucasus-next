'use client';

import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireVerified?: boolean;
    allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, requireVerified = false, allowedRoles }: ProtectedRouteProps) => {
    const router = useRouter();
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);
    const [hasMounted, setHasMounted] = useState(false);

    // Wait for client-side hydration to complete before checking auth
    useEffect(() => {
        setHasMounted(true);
    }, []);

    // Redirect to login if not authenticated (only after mount to avoid hydration issues)
    useEffect(() => {
        if (hasMounted && !isAuthenticated) {
            router.push('/login');
        }
    }, [hasMounted, isAuthenticated, router]);

    // Always render children during SSR and initial hydration to prevent mismatch
    // After mount, check authentication
    if (!hasMounted) {
        return <>{children}</>;
    }

    if (!isAuthenticated) {
        return null; // Redirecting to login
    }

    if (requireVerified && !user?.emailVerified) {
        // router.push('/verify-email'); // Uncomment when route exists
        // return null;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.roles[0])) {
        // router.push('/unauthorized');
        // return null;
    }

    return <>{children}</>;
};
