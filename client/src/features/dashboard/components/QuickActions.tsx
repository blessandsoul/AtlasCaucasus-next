'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
    MapIcon,
    BarChart3,
    Users,
    Compass,
    Building2,
    UserPlus,
    Sparkles,
    Briefcase,
    MessageSquare,
    FileText,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';

import type { UserRole } from '@/features/auth/types/auth.types';

interface QuickActionItem {
    icon: React.ElementType;
    label: string;
    href: string;
    description: string;
    color: string;
    roles?: UserRole[];
}

function useQuickActionItems(): QuickActionItem[] {
    const { t } = useTranslation();

    return [
        // Available to all users
        {
            icon: Compass,
            label: t('bookings.browse_tours', 'Browse Tours'),
            href: ROUTES.EXPLORE.TOURS,
            description: t('dashboard.overview.browse_tours_desc', 'Discover new tours'),
            color: 'bg-primary/10 text-primary',
        },
        {
            icon: MessageSquare,
            label: t('dashboard.overview.send_inquiry', 'Send Inquiry'),
            href: ROUTES.INQUIRIES.CREATE,
            description: t('dashboard.overview.send_inquiry_desc', 'Contact a provider'),
            color: 'bg-info/10 text-info',
        },
        // Company-specific
        {
            icon: MapIcon,
            label: t('auth.create_tour', 'Create Tour'),
            href: ROUTES.TOURS.CREATE,
            description: t('dashboard.overview.create_tour_desc', 'Add a new tour listing'),
            color: 'bg-success/10 text-success',
            roles: ['COMPANY', 'TOUR_AGENT'],
        },
        {
            icon: Building2,
            label: t('company.management.title', 'Company'),
            href: ROUTES.COMPANY_MANAGEMENT,
            description: t('dashboard.overview.company_desc', 'Manage your company'),
            color: 'bg-warning/10 text-warning',
            roles: ['COMPANY'],
        },
        {
            icon: UserPlus,
            label: t('auth.create_agent', 'Create Agent'),
            href: ROUTES.CREATE_AGENT,
            description: t('dashboard.overview.create_agent_desc', 'Add a team member'),
            color: 'bg-primary/10 text-primary',
            roles: ['COMPANY'],
        },
        {
            icon: BarChart3,
            label: t('analytics.title', 'Analytics'),
            href: ROUTES.ANALYTICS,
            description: t('dashboard.overview.analytics_desc', 'View your stats'),
            color: 'bg-info/10 text-info',
            roles: ['COMPANY', 'GUIDE', 'DRIVER'],
        },
        {
            icon: Sparkles,
            label: t('ai.studio_title', 'AI Studio'),
            href: ROUTES.AI_STUDIO,
            description: t('dashboard.overview.ai_desc', 'Generate content with AI'),
            color: 'bg-warning/10 text-warning',
            roles: ['COMPANY', 'GUIDE', 'DRIVER', 'ADMIN'],
        },
        // Admin
        {
            icon: Users,
            label: t('admin.tabs.users', 'Users'),
            href: ROUTES.ADMIN.USERS,
            description: t('dashboard.overview.manage_users_desc', 'Manage users'),
            color: 'bg-destructive/10 text-destructive',
            roles: ['ADMIN'],
        },
        {
            icon: FileText,
            label: t('dashboard.blog.title', 'Blog'),
            href: ROUTES.BLOG.DASHBOARD,
            description: t('dashboard.overview.manage_blog_desc', 'Manage posts'),
            color: 'bg-success/10 text-success',
            roles: ['ADMIN'],
        },
        // Become Partner (for regular users who aren't yet providers)
        {
            icon: Briefcase,
            label: t('partner.become_partner', 'Become Partner'),
            href: ROUTES.BECOME_PARTNER,
            description: t('dashboard.overview.become_partner_desc', 'Start your business'),
            color: 'bg-warning/10 text-warning',
        },
    ];
}

export const QuickActions = (): React.ReactNode => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const userRoles = user?.roles as UserRole[] | undefined;
    const actions = useQuickActionItems();

    const visibleActions = actions.filter((action) => {
        if (!action.roles) return true;
        if (!userRoles) return false;
        return action.roles.some((r) => userRoles.includes(r));
    }).slice(0, 6); // Max 6 quick actions

    return (
        <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
                {t('dashboard.overview.quick_actions', 'Quick Actions')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {visibleActions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <Link
                            key={action.href}
                            href={action.href}
                            className="group flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3 transition-all duration-200 hover:shadow-sm hover:border-border"
                        >
                            <div className={cn('p-2 rounded-lg shrink-0', action.color)}>
                                <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{action.label}</p>
                                <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};
