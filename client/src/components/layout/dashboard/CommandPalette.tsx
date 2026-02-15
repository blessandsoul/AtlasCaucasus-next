'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
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
    Settings,
    Search,
    Home,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';

import type { UserRole } from '@/features/auth/types/auth.types';

interface CommandItem {
    icon: React.ElementType;
    label: string;
    href: string;
    group: string;
    roles?: UserRole[];
}

function useCommandItems(): CommandItem[] {
    const { t } = useTranslation();

    return useMemo(() => [
        // Navigation
        { icon: LayoutDashboard, label: t('dashboard.overview.title', 'Overview'), href: ROUTES.DASHBOARD, group: 'Navigation' },
        { icon: Heart, label: t('dashboard.menu.favorites', 'Favorites'), href: ROUTES.FAVORITES, group: 'Navigation' },
        { icon: CalendarCheck, label: t('dashboard.menu.bookings', 'Bookings'), href: ROUTES.BOOKINGS.ROOT, group: 'Navigation' },
        { icon: Star, label: t('dashboard.menu.reviews', 'Reviews'), href: ROUTES.REVIEWS, group: 'Navigation' },
        { icon: MessageSquare, label: t('dashboard.menu.inquiries', 'Inquiries'), href: ROUTES.INQUIRIES.ROOT, group: 'Navigation' },
        { icon: User, label: t('auth.profile', 'Profile'), href: ROUTES.PROFILE, group: 'Navigation' },
        { icon: Settings, label: t('dashboard.menu.settings', 'Settings'), href: ROUTES.SETTINGS, group: 'Navigation' },

        // Management
        { icon: Building2, label: t('company.management.title', 'Company'), href: ROUTES.COMPANY_MANAGEMENT, group: 'Management', roles: ['COMPANY'] },
        { icon: LayoutDashboard, label: t('company.operations.title', 'Operations'), href: ROUTES.OPERATIONS.ROOT, group: 'Management', roles: ['COMPANY'] },
        { icon: UserPlus, label: t('auth.create_agent', 'Create Agent'), href: ROUTES.CREATE_AGENT, group: 'Management', roles: ['COMPANY'] },
        { icon: MapIcon, label: t('auth.create_tour', 'Create Tour'), href: ROUTES.TOURS.CREATE, group: 'Management', roles: ['COMPANY', 'TOUR_AGENT'] },
        { icon: BarChart3, label: t('analytics.title', 'Analytics'), href: ROUTES.ANALYTICS, group: 'Management', roles: ['COMPANY', 'GUIDE', 'DRIVER'] },
        { icon: Sparkles, label: t('ai.studio_title', 'AI Studio'), href: ROUTES.AI_STUDIO, group: 'Management', roles: ['COMPANY', 'GUIDE', 'DRIVER', 'ADMIN'] },

        // Admin
        { icon: Users, label: t('admin.tabs.users', 'Users'), href: ROUTES.ADMIN.USERS, group: 'Admin', roles: ['ADMIN'] },
        { icon: MapPin, label: t('admin.tabs.locations', 'Locations'), href: ROUTES.ADMIN.LOCATIONS, group: 'Admin', roles: ['ADMIN'] },
        { icon: FileText, label: t('dashboard.blog.title', 'Blog'), href: ROUTES.BLOG.DASHBOARD, group: 'Admin', roles: ['ADMIN'] },

        // Quick Actions
        { icon: Home, label: t('dashboard.back_to_site', 'Back to website'), href: ROUTES.HOME, group: 'Quick Actions' },
        { icon: Briefcase, label: t('partner.become_partner', 'Become Partner'), href: ROUTES.BECOME_PARTNER, group: 'Quick Actions' },
    ], [t]);
}

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const CommandPalette = ({ open, onOpenChange }: CommandPaletteProps): React.ReactNode => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();
    const { user } = useAuth();
    const userRoles = user?.roles as UserRole[] | undefined;
    const allItems = useCommandItems();

    const filteredItems = useMemo(() => {
        const accessible = allItems.filter((item) => {
            if (!item.roles) return true;
            if (!userRoles) return false;
            return item.roles.some((r) => userRoles.includes(r));
        });

        if (!query.trim()) return accessible;

        const lower = query.toLowerCase();
        return accessible.filter((item) =>
            item.label.toLowerCase().includes(lower) ||
            item.group.toLowerCase().includes(lower)
        );
    }, [allItems, userRoles, query]);

    const groups = useMemo(() => {
        const map = new Map<string, CommandItem[]>();
        filteredItems.forEach((item) => {
            const existing = map.get(item.group) || [];
            existing.push(item);
            map.set(item.group, existing);
        });
        return map;
    }, [filteredItems]);

    const flatItems = useMemo(() => filteredItems, [filteredItems]);

    const navigate = useCallback((href: string): void => {
        onOpenChange(false);
        setQuery('');
        router.push(href);
    }, [onOpenChange, router]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    useEffect(() => {
        if (!open) {
            setQuery('');
            setSelectedIndex(0);
        }
    }, [open]);

    const handleKeyDown = (e: React.KeyboardEvent): void => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % flatItems.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (flatItems[selectedIndex]) {
                navigate(flatItems[selectedIndex].href);
            }
        }
    };

    // Global keyboard shortcut
    useEffect(() => {
        const handleGlobalKey = (e: KeyboardEvent): void => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                onOpenChange(!open);
            }
        };
        document.addEventListener('keydown', handleGlobalKey);
        return () => document.removeEventListener('keydown', handleGlobalKey);
    }, [open, onOpenChange]);

    let flatIndex = 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent hideClose className="sm:max-w-lg p-0 gap-0 overflow-hidden">
                <DialogTitle className="sr-only">Command Palette</DialogTitle>
                <DialogDescription className="sr-only">Search and navigate to pages</DialogDescription>
                {/* Search Input */}
                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type to search..."
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        autoFocus
                    />
                    <kbd className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border font-mono text-muted-foreground">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div className="max-h-80 overflow-y-auto p-2">
                    {flatItems.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            No results found.
                        </div>
                    ) : (
                        Array.from(groups.entries()).map(([groupName, items]) => (
                            <div key={groupName} className="mb-2 last:mb-0">
                                <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    {groupName}
                                </p>
                                {items.map((item) => {
                                    const Icon = item.icon;
                                    const currentFlatIndex = flatIndex++;
                                    const isSelected = currentFlatIndex === selectedIndex;

                                    return (
                                        <button
                                            key={item.href}
                                            onClick={() => navigate(item.href)}
                                            onMouseEnter={() => setSelectedIndex(currentFlatIndex)}
                                            className={cn(
                                                'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                                                isSelected
                                                    ? 'bg-muted text-foreground'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            )}
                                        >
                                            <Icon className="h-4 w-4 shrink-0" />
                                            <span>{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
