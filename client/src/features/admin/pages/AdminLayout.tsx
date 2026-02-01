'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Users, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants/routes';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
    const { t } = useTranslation();
    const pathname = usePathname();

    const tabs = [
        {
            label: t('admin.tabs.users', 'Users'),
            href: ROUTES.ADMIN.USERS,
            icon: Users,
        },
        {
            label: t('admin.tabs.locations', 'Locations'),
            href: ROUTES.ADMIN.LOCATIONS,
            icon: MapPin,
        },
    ];

    return (
        <div className="space-y-6">
            <div className="border-b">
                <nav className="flex space-x-4 overflow-x-auto pb-1" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.href;
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={cn(
                                    'flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                                    isActive
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground'
                                )}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            {children}
        </div>
    );
};
