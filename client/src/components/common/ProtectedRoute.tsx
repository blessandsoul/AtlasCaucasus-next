'use client';

import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireVerified?: boolean;
    allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, requireVerified = true, allowedRoles }: ProtectedRouteProps) => {
    const router = useRouter();
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);
    const [hasMounted, setHasMounted] = useState(false);

    // Wait for client-side hydration to complete before checking auth
    useEffect(() => {
        setHasMounted(true);
    }, []);

    // Redirect to login if not authenticated (only after mount to avoid hydration issues)
    // Also clear the has_session cookie so middleware stays in sync
    useEffect(() => {
        if (hasMounted && !isAuthenticated) {
            document.cookie = 'has_session=; path=/; max-age=0';
            router.push('/login');
        }
    }, [hasMounted, isAuthenticated, router]);

    // Show a loading spinner during SSR/hydration to prevent flash of content
    if (!hasMounted) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        // Show loading while redirect is in progress
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
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
