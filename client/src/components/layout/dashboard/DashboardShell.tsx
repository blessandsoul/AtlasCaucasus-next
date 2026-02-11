'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebar } from './DashboardSidebar';
import { CommandPalette } from './CommandPalette';

interface DashboardShellProps {
    children: React.ReactNode;
}

export const DashboardShell = ({ children }: DashboardShellProps): React.ReactNode => {
    const [hasMounted, setHasMounted] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

    useRoleCheck();

    useEffect(() => {
        setHasMounted(true);
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('dashboard-sidebar-collapsed');
            if (saved === 'true') setIsCollapsed(true);
        }
    }, []);

    const handleToggleCollapse = (): void => {
        const next = !isCollapsed;
        setIsCollapsed(next);
        if (typeof window !== 'undefined') {
            localStorage.setItem('dashboard-sidebar-collapsed', String(next));
        }
    };

    if (!hasMounted) {
        return (
            <div className="h-dvh flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-dvh flex overflow-hidden bg-background">
            {/* Desktop Sidebar */}
            <DashboardSidebar
                isCollapsed={isCollapsed}
                onToggleCollapse={handleToggleCollapse}
                className="hidden lg:flex"
            />

            {/* Mobile Sidebar (Sheet) */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetContent side="left" className="w-[280px] p-0">
                    <DashboardSidebar
                        isCollapsed={false}
                        onToggleCollapse={() => {}}
                        onItemClick={() => setIsMobileOpen(false)}
                        isMobile
                    />
                </SheetContent>
            </Sheet>

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <DashboardHeader
                    onMobileMenuToggle={() => setIsMobileOpen(true)}
                    onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
                />
                <main className="flex-1 overflow-y-auto">
                    <div className="px-4 md:px-6 lg:px-8 py-6">
                        {children}
                    </div>
                </main>
            </div>

            {/* Command Palette */}
            <CommandPalette
                open={isCommandPaletteOpen}
                onOpenChange={setIsCommandPaletteOpen}
            />
        </div>
    );
};
