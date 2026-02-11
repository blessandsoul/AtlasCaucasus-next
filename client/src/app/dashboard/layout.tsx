'use client';

import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute>
            <DashboardShell>{children}</DashboardShell>
        </ProtectedRoute>
    );
}
