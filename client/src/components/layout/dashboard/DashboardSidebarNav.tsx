'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import {
    LayoutDashboard,
    Heart,
    CalendarCheck,
    Star,
    MessageSquare,
    Building2,
    UserPlus,
    Map as MapIcon,
    BarChart3,
    Sparkles,
    Users,
    MapPin,
    FileText,
    User,
    Briefcase,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';

import type { UserRole } from '@/features/auth/types/auth.types';

interface NavItem {
    icon: React.ElementType;
    label: string;
    href: string;
    matchExact?: boolean;
    matchPrefix?: string;
    roles?: UserRole[];
}

interface NavGroup {
    title: string;
    items: NavItem[];
    roles?: UserRole[];
}

function useNavGroups(): NavGroup[] {
    const { t } = useTranslation();

    return [
        {
            title: t('dashboard.overview', 'Overview'),
            items: [
                {
                    icon: LayoutDashboard,
                    label: t('dashboard.overview', 'Overview'),
                    href: ROUTES.DASHBOARD,
                    matchExact: true,
                },
                {
                    icon: Heart,
                    label: t('dashboard.menu.favorites', 'Favorites'),
                    href: ROUTES.FAVORITES,
                    matchExact: true,
                },
                {
                    icon: CalendarCheck,
                    label: t('dashboard.menu.bookings', 'Bookings'),
                    href: ROUTES.BOOKINGS.ROOT,
                    matchExact: true,
                },
                {
                    icon: Star,
                    label: t('dashboard.menu.reviews', 'Reviews'),
                    href: ROUTES.REVIEWS,
                    matchExact: true,
                },
                {
                    icon: MessageSquare,
                    label: t('dashboard.menu.inquiries', 'Inquiries'),
                    href: ROUTES.INQUIRIES.ROOT,
                    matchPrefix: ROUTES.INQUIRIES.ROOT,
                },
            ],
        },
        {
            title: t('company.management.group_title', 'Management'),
            roles: ['COMPANY', 'TOUR_AGENT', 'ADMIN', 'DRIVER', 'GUIDE'],
            items: [
                {
                    icon: CalendarCheck,
                    label: t('bookings.received_title', 'Received Bookings'),
                    href: ROUTES.BOOKINGS.RECEIVED,
                    matchExact: true,
                    roles: ['COMPANY', 'GUIDE', 'DRIVER'],
                },
                {
                    icon: LayoutDashboard,
                    label: t('company.operations.title', 'Operations'),
                    href: ROUTES.OPERATIONS.ROOT,
                    matchPrefix: ROUTES.OPERATIONS.ROOT,
                    roles: ['COMPANY'],
                },
                {
                    icon: Building2,
                    label: t('company.management.title', 'Company'),
                    href: ROUTES.COMPANY_MANAGEMENT,
                    matchExact: true,
                    roles: ['COMPANY'],
                },
                {
                    icon: UserPlus,
                    label: t('auth.create_agent', 'Create Agent'),
                    href: ROUTES.CREATE_AGENT,
                    matchExact: true,
                    roles: ['COMPANY'],
                },
                {
                    icon: MapIcon,
                    label: t('auth.create_tour', 'Create Tour'),
                    href: ROUTES.TOURS.CREATE,
                    matchExact: true,
                    roles: ['COMPANY', 'TOUR_AGENT'],
                },
                {
                    icon: BarChart3,
                    label: t('analytics.title', 'Analytics'),
                    href: ROUTES.ANALYTICS,
                    matchExact: true,
                    roles: ['COMPANY', 'GUIDE', 'DRIVER'],
                },
                {
                    icon: Sparkles,
                    label: t('ai.studio_title', 'AI Studio'),
                    href: ROUTES.AI_STUDIO,
                    matchExact: true,
                    roles: ['COMPANY', 'GUIDE', 'DRIVER', 'ADMIN'],
                },
                {
                    icon: LayoutDashboard,
                    label: t('driver.dashboard.title', 'Driver Dashboard'),
                    href: '/dashboard/driver',
                    matchPrefix: '/dashboard/driver',
                    roles: ['DRIVER'],
                },
                {
                    icon: LayoutDashboard,
                    label: t('guide.dashboard.title', 'Guide Dashboard'),
                    href: '/dashboard/guide',
                    matchPrefix: '/dashboard/guide',
                    roles: ['GUIDE'],
                },
            ],
        },
        {
            title: t('admin.title', 'Admin'),
            roles: ['ADMIN'],
            items: [
                {
                    icon: Users,
                    label: t('admin.tabs.users', 'Users'),
                    href: ROUTES.ADMIN.USERS,
                    matchExact: true,
                },
                {
                    icon: MapPin,
                    label: t('admin.tabs.locations', 'Locations'),
                    href: ROUTES.ADMIN.LOCATIONS,
                    matchExact: true,
                },
                {
                    icon: FileText,
                    label: t('dashboard.blog.title', 'Blog'),
                    href: ROUTES.BLOG.DASHBOARD,
                    matchPrefix: ROUTES.BLOG.DASHBOARD,
                },
            ],
        },
        {
            title: t('dashboard.menu.account', 'Account'),
            items: [
                {
                    icon: User,
                    label: t('auth.profile', 'Profile'),
                    href: ROUTES.PROFILE,
                    matchExact: true,
                },
                {
                    icon: Briefcase,
                    label: t('partner.become_partner', 'Become Partner'),
                    href: ROUTES.BECOME_PARTNER,
                    matchExact: true,
                },
            ],
        },
    ];
}

function hasRoleAccess(userRoles: UserRole[] | undefined, requiredRoles?: UserRole[]): boolean {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    if (!userRoles || userRoles.length === 0) return false;
    return requiredRoles.some((r) => userRoles.includes(r));
}

interface SidebarNavItemProps {
    item: NavItem;
    isCollapsed: boolean;
    onClick?: () => void;
}

const SidebarNavItem = ({ item, isCollapsed, onClick }: SidebarNavItemProps): React.ReactNode => {
    const pathname = usePathname();
    const isActive = item.matchExact
        ? pathname === item.href
        : item.matchPrefix
            ? pathname?.startsWith(item.matchPrefix)
            : pathname === item.href;

    const Icon = item.icon;

    const link = (
        <Link
            href={item.href}
            onClick={onClick}
            className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                isCollapsed && 'justify-center px-0',
                isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
        >
            <Icon className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
        </Link>
    );

    if (isCollapsed) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                </TooltipContent>
            </Tooltip>
        );
    }

    return link;
};

interface DashboardSidebarNavProps {
    isCollapsed: boolean;
    onItemClick?: () => void;
}

export const DashboardSidebarNav = ({ isCollapsed, onItemClick }: DashboardSidebarNavProps): React.ReactNode => {
    const { user } = useAuth();
    const userRoles = user?.roles as UserRole[] | undefined;
    const navGroups = useNavGroups();
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        navGroups.forEach((g) => { initial[g.title] = true; });
        return initial;
    });

    const toggleGroup = (title: string): void => {
        setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
    };

    return (
        <TooltipProvider delayDuration={0}>
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                {navGroups.map((group) => {
                    if (!hasRoleAccess(userRoles, group.roles as UserRole[] | undefined)) return null;

                    const visibleItems = group.items.filter((item) =>
                        hasRoleAccess(userRoles, item.roles)
                    );

                    if (visibleItems.length === 0) return null;

                    if (isCollapsed) {
                        return (
                            <div key={group.title} className="space-y-1 pb-2">
                                {visibleItems.map((item) => (
                                    <SidebarNavItem
                                        key={item.href}
                                        item={item}
                                        isCollapsed
                                        onClick={onItemClick}
                                    />
                                ))}
                            </div>
                        );
                    }

                    return (
                        <Collapsible
                            key={group.title}
                            open={openGroups[group.title] !== false}
                            onOpenChange={() => toggleGroup(group.title)}
                        >
                            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 mb-1 hover:bg-muted/30 transition-colors group">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    {group.title}
                                </span>
                                <ChevronDown
                                    className={cn(
                                        'h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-200',
                                        openGroups[group.title] !== false ? 'rotate-0' : '-rotate-90'
                                    )}
                                />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-0.5">
                                {visibleItems.map((item) => (
                                    <SidebarNavItem
                                        key={item.href}
                                        item={item}
                                        isCollapsed={false}
                                        onClick={onItemClick}
                                    />
                                ))}
                            </CollapsibleContent>
                        </Collapsible>
                    );
                })}
            </nav>
        </TooltipProvider>
    );
};
