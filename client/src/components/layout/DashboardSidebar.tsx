'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Settings,
    User,
    LogOut,
    UserPlus,
    Briefcase,
    Map as MapIcon,
    Building2,
    MapPin,
    MessageSquare,
    Users,
    Star,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/lib/constants/routes';

interface SidebarItemProps {
    icon: React.ElementType;
    label: string;
    href: string;
    isActive: boolean;
    onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, href, isActive, onClick }: SidebarItemProps) => (
    <Link
        href={href}
        onClick={onClick}
        className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
            isActive
                ? "bg-muted text-primary"
                : "text-muted-foreground"
        )}
    >
        <Icon className="h-4 w-4" />
        {label}
    </Link>
);

interface SidebarButtonProps {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
}

const SidebarButton = ({ icon: Icon, label, onClick }: SidebarButtonProps) => (
    <button
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-primary hover:bg-muted/50"
    >
        <Icon className="h-4 w-4" />
        {label}
    </button>
);

interface DashboardSidebarProps {
    className?: string;
    onItemClick?: () => void;
}

export const DashboardSidebar = ({ className, onItemClick }: DashboardSidebarProps) => {
    const pathname = usePathname();
    const { t } = useTranslation();
    const { logout, user } = useAuth();

    return (
        <aside className={cn("w-64 shrink-0", className)}>
            <div className="sticky top-24 space-y-4">
                <div className="space-y-2">
                    {/* Overview Group */}
                    <div className="px-3 py-1">
                        <h2 className="mb-2 px-0 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                            {t('dashboard.overview', 'Overview')}
                        </h2>
                        <div className="space-y-1">
                            <SidebarItem
                                icon={Star}
                                label={t('dashboard.menu.reviews', 'My Reviews')}
                                href={ROUTES.REVIEWS}
                                isActive={pathname === ROUTES.REVIEWS}
                                onClick={onItemClick}
                            />
                            <SidebarItem
                                icon={MessageSquare}
                                label={t('dashboard.menu.inquiries', 'Inquiries')}
                                href={ROUTES.INQUIRIES.ROOT}
                                isActive={pathname.startsWith(ROUTES.INQUIRIES.ROOT)}
                                onClick={onItemClick}
                            />
                        </div>
                    </div>

                    {/* Management Group (Company, Driver, Guide) */}
                    {(user?.roles?.includes('COMPANY') ||
                        user?.roles?.includes('TOUR_AGENT') ||
                        user?.roles?.includes('ADMIN') ||
                        user?.roles?.includes('DRIVER') ||
                        user?.roles?.includes('GUIDE')) && (
                            <div className="px-3 py-1">
                                <h2 className="mb-2 px-0 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                                    {t('company.management.group_title', 'Management')}
                                </h2>
                                <div className="space-y-1">
                                    {user?.roles?.includes('COMPANY') && (
                                        <>
                                            <SidebarItem
                                                icon={LayoutDashboard}
                                                label={t('company.operations.title', 'Operations')}
                                                href={ROUTES.OPERATIONS.ROOT}
                                                isActive={pathname.startsWith(ROUTES.OPERATIONS.ROOT)}
                                                onClick={onItemClick}
                                            />
                                            <SidebarItem
                                                icon={Building2}
                                                label={t('company.management.title', 'My Company')}
                                                href={ROUTES.COMPANY_MANAGEMENT}
                                                isActive={pathname === ROUTES.COMPANY_MANAGEMENT}
                                                onClick={onItemClick}
                                            />
                                            <SidebarItem
                                                icon={UserPlus}
                                                label={t('auth.create_agent', 'Create Agent')}
                                                href={ROUTES.CREATE_AGENT}
                                                isActive={pathname === ROUTES.CREATE_AGENT}
                                                onClick={onItemClick}
                                            />
                                        </>
                                    )}

                                    {/* Company Tour Creation - Visible to Company/Agent */}
                                    {(user?.roles?.includes('COMPANY') || user?.roles?.includes('TOUR_AGENT')) && (
                                        <SidebarItem
                                            icon={MapIcon}
                                            label={t('auth.create_tour', 'Create Tour')}
                                            href={ROUTES.TOURS.CREATE}
                                            isActive={pathname === ROUTES.TOURS.CREATE}
                                            onClick={onItemClick}
                                        />
                                    )}

                                    {/* Driver Dashboard Item */}
                                    {user?.roles?.includes('DRIVER') && (
                                        <SidebarItem
                                            icon={LayoutDashboard}
                                            label={t('driver.dashboard.title', 'Driver Dashboard')}
                                            href="/dashboard/driver"
                                            isActive={pathname.startsWith('/dashboard/driver')}
                                            onClick={onItemClick}
                                        />
                                    )}

                                    {/* Guide Dashboard Item */}
                                    {user?.roles?.includes('GUIDE') && (
                                        <SidebarItem
                                            icon={LayoutDashboard}
                                            label={t('guide.dashboard.title', 'Guide Dashboard')}
                                            href="/dashboard/guide"
                                            isActive={pathname.startsWith('/dashboard/guide')}
                                            onClick={onItemClick}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                    {/* Admin Group */}
                    {user?.roles?.includes('ADMIN') && (
                        <div className="px-3 py-1">
                            <h2 className="mb-2 px-0 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                                {t('admin.title', 'Admin')}
                            </h2>
                            <div className="space-y-1">
                                <SidebarItem
                                    icon={Users}
                                    label={t('admin.tabs.users', 'Users')}
                                    href={ROUTES.ADMIN.USERS}
                                    isActive={pathname === ROUTES.ADMIN.USERS || pathname === ROUTES.ADMIN.ROOT}
                                    onClick={onItemClick}
                                />
                                <SidebarItem
                                    icon={MapPin}
                                    label={t('admin.tabs.locations', 'Locations')}
                                    href={ROUTES.ADMIN.LOCATIONS}
                                    isActive={pathname === ROUTES.ADMIN.LOCATIONS}
                                    onClick={onItemClick}
                                />
                            </div>
                        </div>
                    )}

                    {/* Account Group */}
                    <div className="px-3 py-1">
                        <h2 className="mb-2 px-0 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                            {t('dashboard.menu.account', 'Account')}
                        </h2>
                        <div className="space-y-1">
                            <SidebarItem
                                icon={User}
                                label={t('auth.profile', 'Profile')}
                                href={ROUTES.PROFILE}
                                isActive={pathname === ROUTES.PROFILE}
                                onClick={onItemClick}
                            />
                            <SidebarItem
                                icon={Briefcase}
                                label={t('partner.become_partner', 'Become Partner')}
                                href={ROUTES.BECOME_PARTNER}
                                isActive={pathname === ROUTES.BECOME_PARTNER}
                                onClick={onItemClick}
                            />
                            <SidebarItem
                                icon={Settings}
                                label={t('dashboard.menu.settings', 'Settings')}
                                href={ROUTES.SETTINGS}
                                isActive={pathname === ROUTES.SETTINGS}
                                onClick={onItemClick}
                            />
                            <SidebarButton
                                icon={LogOut}
                                label={t('auth.logout', 'Logout')}
                                onClick={() => {
                                    if (onItemClick) onItemClick();
                                    logout();
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};
