'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import {
    Menu,
    Search,
    MessageSquare,
    Bell,
    LogOut,
    User,
    Globe,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAppDispatch } from '@/store/hooks';
import { openDrawer } from '@/features/chat/store/chatSlice';
import { useChats } from '@/features/chat/hooks/useChats';
import { useUnreadCount, notificationKeys } from '@/features/notifications/hooks/useNotifications';
import { useWebSocket } from '@/context/WebSocketContext';
import { MessageType } from '@/lib/websocket/websocket.types';
import { useCurrency } from '@/context/CurrencyContext';
import { SUPPORTED_CURRENCIES, CURRENCY_SYMBOLS } from '@/lib/utils/currency';
import { useLoading } from '@/context/LoadingContext';
import { getMediaUrl } from '@/lib/utils/media';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';
import { ChatDrawer } from '@/features/chat/components/ChatDrawer';
import { NotificationDrawer } from '@/features/notifications/components/NotificationDrawer';
import { DashboardBreadcrumbs } from './DashboardBreadcrumbs';

import type { Currency } from '@/lib/utils/currency';

const getFlagCode = (lang: string): string => {
    switch (lang) {
        case 'ka': return 'ge';
        case 'en': return 'gb';
        case 'ru': return 'ru';
        default: return 'ge';
    }
};

interface DashboardHeaderProps {
    onMobileMenuToggle: () => void;
    onOpenCommandPalette?: () => void;
}

export const DashboardHeader = ({ onMobileMenuToggle, onOpenCommandPalette }: DashboardHeaderProps): React.ReactNode => {
    const { t, i18n } = useTranslation();
    const { isAuthenticated, user, logout } = useAuth();
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();
    const { subscribe } = useWebSocket();
    const { currency, setCurrency } = useCurrency();
    const { startLoading, stopLoading } = useLoading();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const isVerifiedUser = isAuthenticated && hasMounted && !!user?.emailVerified;
    const { data: chatsData } = useChats({}, { enabled: isVerifiedUser });
    const totalUnread = chatsData?.items.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0) || 0;

    const { data: unreadCountData } = useUnreadCount({ enabled: isVerifiedUser });
    const notificationCount = unreadCountData?.count || 0;

    useEffect(() => {
        const unsubscribe = subscribe(MessageType.NOTIFICATION, () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
        });
        return unsubscribe;
    }, [subscribe, queryClient]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent): void => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLanguageChange = (lang: string): void => {
        if (i18n.language === lang) return;
        setIsUserMenuOpen(false);
        startLoading();
        setTimeout(() => {
            i18n.changeLanguage(lang);
            setTimeout(() => stopLoading(), 300);
        }, 500);
    };

    const handleCurrencyChange = (c: Currency): void => {
        setCurrency(c);
    };

    const handleLogout = (): void => {
        setIsUserMenuOpen(false);
        logout();
    };

    const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`;

    return (
        <>
            <header className="h-14 shrink-0 flex items-center justify-between gap-4 border-b border-border bg-background px-4 lg:px-6">
                {/* Left: Hamburger + Breadcrumbs */}
                <div className="flex items-center gap-3 min-w-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden shrink-0 h-8 w-8"
                        onClick={onMobileMenuToggle}
                        aria-label="Open menu"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <div className="hidden lg:block">
                        <DashboardBreadcrumbs />
                    </div>
                </div>

                {/* Center: Search trigger */}
                <button
                    onClick={onOpenCommandPalette}
                    className="hidden md:flex items-center gap-2 rounded-lg border border-input bg-muted/30 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 transition-colors w-64 shrink-0"
                >
                    <Search className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{t('dashboard.search.placeholder', 'Search...')}</span>
                    <kbd className="ml-auto text-[10px] bg-background px-1.5 py-0.5 rounded border border-border font-mono">
                        Ctrl+K
                    </kbd>
                </button>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 shrink-0">
                    {/* Mobile search */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={onOpenCommandPalette}
                        aria-label="Search"
                    >
                        <Search className="h-4 w-4" />
                    </Button>

                    {/* Chat */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => dispatch(openDrawer())}
                        aria-label="Messages"
                    >
                        <MessageSquare className="h-4 w-4" />
                        {totalUnread > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-medium text-white ring-2 ring-background">
                                {totalUnread > 99 ? '99+' : totalUnread}
                            </span>
                        )}
                    </Button>

                    {/* Notifications */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setIsNotificationsOpen(true)}
                        aria-label="Notifications"
                    >
                        <Bell className="h-4 w-4" />
                        {notificationCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-medium text-white ring-2 ring-background">
                                {notificationCount > 99 ? '99+' : notificationCount}
                            </span>
                        )}
                    </Button>

                    <Separator orientation="vertical" className="h-5 mx-1 hidden sm:block" />

                    {/* User Avatar + Dropdown */}
                    <div className="relative" ref={userMenuRef}>
                        <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-full"
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            aria-label="User menu"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden">
                                {user?.avatarUrl ? (
                                    <img
                                        src={getMediaUrl(user.avatarUrl)}
                                        alt={`${user.firstName} ${user.lastName}`}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="text-xs font-semibold">{initials}</span>
                                )}
                            </div>
                        </Button>

                        {isUserMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-full right-0 mt-2 w-64 bg-card rounded-xl shadow-lg border border-border overflow-hidden z-50"
                            >
                                {/* User Info */}
                                <div className="p-3 border-b border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden">
                                            {user?.avatarUrl ? (
                                                <img
                                                    src={getMediaUrl(user.avatarUrl)}
                                                    alt={`${user.firstName} ${user.lastName}`}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-sm font-semibold">{initials}</span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate">
                                                {user?.firstName} {user?.lastName}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {user?.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Links */}
                                <div className="p-1 border-b border-border">
                                    <Link
                                        href={ROUTES.PROFILE}
                                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    >
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span>{t('auth.profile', 'Profile')}</span>
                                    </Link>
                                    <Link
                                        href={ROUTES.HOME}
                                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    >
                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                        <span>{t('dashboard.back_to_site', 'Back to website')}</span>
                                    </Link>
                                </div>

                                {/* Language + Currency */}
                                <div className="p-3 border-b border-border space-y-3">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1.5 px-0.5">Language</p>
                                        <div className="flex gap-1 p-0.5 bg-muted/50 rounded-lg">
                                            {(['ka', 'en', 'ru'] as const).map((lang) => (
                                                <button
                                                    key={lang}
                                                    onClick={() => handleLanguageChange(lang)}
                                                    className={cn(
                                                        'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all',
                                                        i18n.language === lang
                                                            ? 'bg-background shadow-sm text-foreground'
                                                            : 'text-muted-foreground hover:text-foreground'
                                                    )}
                                                >
                                                    <span className={`fi fis fi-${getFlagCode(lang)} rounded-sm`} />
                                                    <span className="uppercase">{lang}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1.5 px-0.5">Currency</p>
                                        <div className="flex gap-1 p-0.5 bg-muted/50 rounded-lg">
                                            {SUPPORTED_CURRENCIES.map((c) => (
                                                <button
                                                    key={c}
                                                    onClick={() => handleCurrencyChange(c)}
                                                    className={cn(
                                                        'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all',
                                                        currency === c
                                                            ? 'bg-background shadow-sm text-foreground'
                                                            : 'text-muted-foreground hover:text-foreground'
                                                    )}
                                                >
                                                    <span className="font-semibold">{CURRENCY_SYMBOLS[c]}</span>
                                                    <span>{c}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Logout */}
                                <div className="p-1">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span>{t('auth.logout', 'Log out')}</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </header>

            {/* Drawers (rendered in portal) */}
            <ChatDrawer />
            <NotificationDrawer isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
        </>
    );
};
