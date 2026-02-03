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
        router.push('/verify-email-pending');
        return null;
    }

    if (allowedRoles && user) {
        const hasAllowedRole = user.roles.some((role) => allowedRoles.includes(role));
        if (!hasAllowedRole) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                    <h2 className="text-2xl font-bold text-destructive mb-2">Access Denied</h2>
                    <p className="text-muted-foreground">You do not have permission to access this page.</p>
                </div>
            );
        }
    }

    return <>{children}</>;
};
