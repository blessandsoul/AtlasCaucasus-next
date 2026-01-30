'use client';

import { OperationsHeader } from '@/features/company/components/operations/OperationsHeader';

export default function OperationsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="space-y-6">
            <OperationsHeader />
            <div className="mt-6">
                {children}
            </div>
        </div>
    );
}
