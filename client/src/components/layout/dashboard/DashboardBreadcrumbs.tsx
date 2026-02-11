'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SEGMENT_LABELS: Record<string, string> = {
    dashboard: 'Dashboard',
    reviews: 'Reviews',
    bookings: 'Bookings',
    favorites: 'Favorites',
    inquiries: 'Inquiries',
    sent: 'Sent',
    received: 'Received',
    create: 'Create',
    company: 'Company',
    analytics: 'Analytics',
    'ai-studio': 'AI Studio',
    operations: 'Operations',
    agents: 'Agents',
    tours: 'Tours',
    profile: 'Profile',
    'become-partner': 'Become Partner',
    settings: 'Settings',
    blog: 'Blog',
    admin: 'Admin',
    users: 'Users',
    locations: 'Locations',
    'ai-templates': 'AI Templates',
    'create-agent': 'Create Agent',
    driver: 'Driver',
    guide: 'Guide',
    edit: 'Edit',
};

function getSegmentLabel(segment: string): string {
    return SEGMENT_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
}

export const DashboardBreadcrumbs = (): React.ReactNode => {
    const pathname = usePathname();
    const { t } = useTranslation();

    if (!pathname) return null;

    const segments = pathname.split('/').filter(Boolean);
    // Remove 'dashboard' from display but keep path building
    const displaySegments = segments.slice(1); // skip 'dashboard'

    if (displaySegments.length === 0) {
        return (
            <span className="text-sm font-medium text-foreground">
                {t('dashboard.overview.title', 'Overview')}
            </span>
        );
    }

    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
            <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground transition-colors"
            >
                {t('auth.dashboard', 'Dashboard')}
            </Link>
            {displaySegments.map((segment, index) => {
                // Skip UUID-like segments in display but show a generic label
                const isUuid = /^[0-9a-f]{8}-/.test(segment);
                const label = isUuid ? 'Details' : getSegmentLabel(segment);
                const href = '/' + segments.slice(0, index + 2).join('/');
                const isLast = index === displaySegments.length - 1;

                return (
                    <span key={href} className="flex items-center gap-1">
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                        {isLast ? (
                            <span className="font-medium text-foreground">{label}</span>
                        ) : (
                            <Link
                                href={href}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {label}
                            </Link>
                        )}
                    </span>
                );
            })}
        </nav>
    );
};
