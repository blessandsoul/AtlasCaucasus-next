'use client';

import { useState, useEffect } from 'react';
import { Header } from './Header';
import { DashboardSidebar } from './DashboardSidebar';
import { Loader2 } from 'lucide-react';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    // Show loading state during SSR/hydration to prevent mismatch
    if (!hasMounted) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <div className="flex-1 container pt-28 pb-8 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <div className="flex-1 container pt-28 pb-8 flex gap-8">
                <DashboardSidebar />
                <main className="flex-1 min-w-0">
                    {children}
                </main>
            </div>
        </div>
    );
};
