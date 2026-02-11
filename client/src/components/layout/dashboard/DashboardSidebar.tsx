'use client';

import Link from 'next/link';
import { Settings, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';
import { DashboardSidebarUser } from './DashboardSidebarUser';
import { DashboardSidebarNav } from './DashboardSidebarNav';

interface DashboardSidebarProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onItemClick?: () => void;
    isMobile?: boolean;
    className?: string;
}

export const DashboardSidebar = ({
    isCollapsed,
    onToggleCollapse,
    onItemClick,
    isMobile = false,
    className,
}: DashboardSidebarProps): React.ReactNode => {
    const { logout } = useAuth();
    const { t } = useTranslation();
    const pathname = usePathname();

    const effectiveCollapsed = isMobile ? false : isCollapsed;

    return (
        <aside
            className={cn(
                'flex flex-col h-full bg-card border-r border-border transition-all duration-300 ease-out shrink-0',
                effectiveCollapsed ? 'w-[68px]' : 'w-[260px]',
                className
            )}
        >
            {/* Logo */}
            <div className={cn(
                'flex items-center h-14 shrink-0 border-b border-border',
                effectiveCollapsed ? 'justify-center px-3' : 'px-4 gap-3'
            )}>
                <Link href={ROUTES.HOME} className="flex items-center gap-2.5 group shrink-0">
                    <img
                        src="/atlascaucasus.png"
                        alt="AtlasCaucasus"
                        className="h-8 w-8 object-contain group-hover:scale-105 transition-transform"
                    />
                    {!effectiveCollapsed && (
                        <span className="text-sm font-bold text-foreground tracking-tight" style={{ fontFamily: "'Noto Sans', sans-serif" }}>
                            AtlasCaucasus
                        </span>
                    )}
                </Link>
            </div>

            {/* User Info */}
            <DashboardSidebarUser isCollapsed={effectiveCollapsed} />

            {/* Navigation */}
            <DashboardSidebarNav isCollapsed={effectiveCollapsed} onItemClick={onItemClick} />

            {/* Bottom Section */}
            <div className="shrink-0 border-t border-border">
                <TooltipProvider delayDuration={0}>
                    <div className={cn('px-3 py-2 space-y-0.5', effectiveCollapsed && 'px-2')}>
                        {/* Settings */}
                        {effectiveCollapsed ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={ROUTES.SETTINGS}
                                        onClick={onItemClick}
                                        className={cn(
                                            'flex items-center justify-center rounded-lg px-0 py-2 text-sm font-medium transition-all duration-150',
                                            pathname === ROUTES.SETTINGS
                                                ? 'bg-primary/10 text-primary'
                                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                        )}
                                    >
                                        <Settings className="h-4 w-4" />
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right">{t('dashboard.menu.settings', 'Settings')}</TooltipContent>
                            </Tooltip>
                        ) : (
                            <Link
                                href={ROUTES.SETTINGS}
                                onClick={onItemClick}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                                    pathname === ROUTES.SETTINGS
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                )}
                            >
                                <Settings className="h-4 w-4" />
                                <span>{t('dashboard.menu.settings', 'Settings')}</span>
                            </Link>
                        )}

                        {/* Logout */}
                        {effectiveCollapsed ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => {
                                            onItemClick?.();
                                            logout();
                                        }}
                                        className="flex w-full items-center justify-center rounded-lg px-0 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-150"
                                    >
                                        <LogOut className="h-4 w-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right">{t('auth.logout', 'Log out')}</TooltipContent>
                            </Tooltip>
                        ) : (
                            <button
                                onClick={() => {
                                    onItemClick?.();
                                    logout();
                                }}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-150"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>{t('auth.logout', 'Log out')}</span>
                            </button>
                        )}
                    </div>
                </TooltipProvider>

                {/* Collapse Toggle (desktop only) */}
                {!isMobile && (
                    <>
                        <Separator />
                        <div className={cn('px-3 py-2', effectiveCollapsed && 'px-2')}>
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={onToggleCollapse}
                                            className={cn(
                                                'w-full text-muted-foreground hover:text-foreground',
                                                effectiveCollapsed ? 'justify-center px-0' : 'justify-start gap-3'
                                            )}
                                        >
                                            {effectiveCollapsed ? (
                                                <PanelLeftOpen className="h-4 w-4" />
                                            ) : (
                                                <>
                                                    <PanelLeftClose className="h-4 w-4" />
                                                    <span className="text-xs">{t('dashboard.sidebar.collapse', 'Collapse')}</span>
                                                </>
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        {effectiveCollapsed
                                            ? t('dashboard.sidebar.expand', 'Expand sidebar')
                                            : t('dashboard.sidebar.collapse', 'Collapse sidebar')}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </>
                )}
            </div>
        </aside>
    );
};
