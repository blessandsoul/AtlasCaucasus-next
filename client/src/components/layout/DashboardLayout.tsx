'use client';

import { useState, useEffect } from 'react';
import { Header } from './Header';
import { DashboardSidebar } from './DashboardSidebar';
import { Loader2, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const [hasMounted, setHasMounted] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            <div className="flex-1 container pt-4 lg:pt-28 pb-8 flex flex-col lg:flex-row gap-8">
                {/* Mobile Menu Trigger - Floating Action Button */}
                <div className="lg:hidden">
                    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="default"
                                size="icon"
                                className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-transform"
                            >
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] p-0 pt-10">
                            <div className="h-full overflow-y-auto px-6">
                                <DashboardSidebar
                                    className="block w-full"
                                    onItemClick={() => setIsMobileMenuOpen(false)}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Desktop Sidebar - hidden on mobile */}
                <DashboardSidebar className="hidden lg:block" />

                <main className="flex-1 min-w-0">
                    {children}
                </main>
            </div>
        </div>
    );
};
