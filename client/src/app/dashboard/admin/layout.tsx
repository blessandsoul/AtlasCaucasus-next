'use client';

import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { AdminLayout } from '@/features/admin/pages/AdminLayout';

export default function AdminLayoutRoute({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout>{children}</AdminLayout>
        </ProtectedRoute>
    );
}
