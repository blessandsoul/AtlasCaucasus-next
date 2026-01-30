'use client';

import { InquiriesHeader } from '@/features/inquiries/components/InquiriesHeader';

export default function InquiriesLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="space-y-6">
            <InquiriesHeader />
            <div className="mt-6">
                {children}
            </div>
        </div>
    );
}
