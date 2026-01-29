'use client';

import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingPage } from '@/components/common/LoadingSpinner';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireVerified?: boolean;
    allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, requireVerified = false, allowedRoles }: ProtectedRouteProps) => {
    const router = useRouter();
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);

    // Note: IsAuthenticated check might need to wait for hydration (redux persist).
    // Assuming 'isAuthenticated' is correctly loaded from localStorage in store/index.ts initialization.

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    if (!isAuthenticated) {
        return null; // Or return null while redirecting
    }

    if (requireVerified && !user?.emailVerified) {
        // router.push('/verify-email'); // Uncomment when route exists
        // return null;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.roles[0])) { // Checking first role for now if singular access logic
        // router.push('/unauthorized');
        // return null;
    }

    return <>{children}</>;
};
