'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { ROUTES } from '@/lib/constants/routes';
import { Building2, ChevronDown, User, LogOut, Map as MapIcon, Hotel, Users, Car, LayoutDashboard, MessageSquare, Bell, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavMenu } from './NavMenu';
import { MobileMenu } from './MobileMenu';
import { ChatDrawer } from '@/features/chat/components/ChatDrawer';
import { NotificationDrawer } from '@/features/notifications/components/NotificationDrawer';
import { useWebSocket } from '@/context/WebSocketContext';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useLoading } from '@/context/LoadingContext';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { colors } from '@/lib/colors';
import { getMediaUrl } from '@/lib/utils/media';
import { cn } from '@/lib/utils';
import { useAppDispatch } from '@/store/hooks';
import { openDrawer } from '@/features/chat/store/chatSlice';
import { useChats } from '@/features/chat/hooks/useChats';
import { useUnreadCount, notificationKeys } from '@/features/notifications/hooks/useNotifications';
import { MessageType } from '@/lib/websocket/websocket.types';
import { useCurrency } from '@/context/CurrencyContext';
import { SUPPORTED_CURRENCIES, CURRENCY_SYMBOLS } from '@/lib/utils/currency';
import type { Currency } from '@/lib/utils/currency';

const getFlagCode = (lang: string): string => {
    switch (lang) {
        case 'ka': return 'ge';
        case 'en': return 'gb';
        case 'ru': return 'ru';
        default: return 'ge';
    }
};

interface PreferencesPanelProps {
    currentLang: string;
    currentCurrency: string;
    onLanguageChange: (lang: string) => void;
    onCurrencyChange: (currency: Currency) => void;
}

const PreferencesPanel = ({ currentLang, currentCurrency, onLanguageChange, onCurrencyChange }: PreferencesPanelProps) => (
    <div className="space-y-3">
        <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5 px-0.5">Language</p>
            <div className="flex gap-1 p-0.5 bg-muted/50 rounded-lg">
                {(['ka', 'en', 'ru'] as const).map((lang) => (
                    <button
                        key={lang}
                        onClick={() => onLanguageChange(lang)}
                        className={cn(
                            'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all',
                            currentLang === lang
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
                        onClick={() => onCurrencyChange(c)}
                        className={cn(
                            'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all',
                            currentCurrency === c
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
);

export const Header = () => {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith(ROUTES.DASHBOARD);
    const useCompactHeader = isDashboard || /^\/explore\/tours\/[^/]+$/.test(pathname || '');
    const { t, i18n } = useTranslation();
    const { scrollY } = useScroll();
    const [hidden, setHidden] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isPrefsOpen, setIsPrefsOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const prefsRef = useRef<HTMLDivElement>(null);
    const { isAuthenticated, user, logout } = useAuth();
    const dispatch = useAppDispatch();
    const { currency, setCurrency } = useCurrency();

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const { subscribe } = useWebSocket();
    const queryClient = useQueryClient();

    const { data: chatsData } = useChats({}, { enabled: isAuthenticated && hasMounted });
    const totalUnread = chatsData?.items.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0) || 0;

    const { data: unreadCountData } = useUnreadCount({ enabled: isAuthenticated && hasMounted });
    const notificationCount = unreadCountData?.count || 0;

    useEffect(() => {
        const unsubscribe = subscribe(MessageType.NOTIFICATION, () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
        });
        return unsubscribe;
    }, [subscribe, queryClient]);

    useMotionValueEvent(scrollY, 'change', (latest) => {
        const previous = scrollY.getPrevious() || 0;
        if (latest > previous && latest > 150) {
            setHidden(true);
            setIsUserMenuOpen(false);
            setIsPrefsOpen(false);
        } else {
            setHidden(false);
        }
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent): void => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
            if (prefsRef.current && !prefsRef.current.contains(event.target as Node)) {
                setIsPrefsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const { startLoading, stopLoading } = useLoading();

    const handleLanguageChange = (lang: string): void => {
        if (i18n.language === lang) return;
        setIsUserMenuOpen(false);
        setIsPrefsOpen(false);
        startLoading();
        setTimeout(() => {
            i18n.changeLanguage(lang);
            setTimeout(() => {
                stopLoading();
            }, 300);
        }, 500);
    };

    const handleCurrencyChange = (c: Currency): void => {
        setCurrency(c);
    };

    const handleLogout = (): void => {
        setIsUserMenuOpen(false);
        logout();
    };

    return (
        <motion.header
            variants={{
                visible: { y: 0, opacity: 1 },
                hidden: { y: -100, opacity: 0 },
            }}
            animate={hidden ? 'hidden' : 'visible'}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className={`fixed top-0 z-50 w-full px-4 flex justify-center bg-transparent pointer-events-none ${useCompactHeader ? 'pt-1 lg:pt-6' : 'pt-6'}`}
        >
            <div className={`container mx-auto flex lg:grid lg:grid-cols-3 h-auto py-2 items-center pointer-events-auto px-0 lg:px-6 lg:rounded-2xl lg:border lg:bg-background lg:backdrop-blur-md lg:shadow-lg transition-all duration-300 ${useCompactHeader ? 'min-h-0 lg:min-h-16' : 'min-h-16'}`}>

                {/* Brand */}
                <Link
                    href={ROUTES.HOME}
                    className="hidden lg:flex lg:justify-self-start items-center gap-3 group bg-background/90 backdrop-blur-md border shadow-sm rounded-full p-2 pr-4 lg:bg-transparent lg:border-none lg:shadow-none lg:p-0 lg:rounded-none transition-all"
                >
                    <img src="/atlascaucasus.png" alt={t('header.brand.name')} className="h-8 w-8 object-contain group-hover:scale-105 transition-transform" />
                    <div className="flex flex-col justify-center">
                        <h1 className="text-sm font-bold leading-none text-foreground tracking-tight" style={{ fontFamily: "'Noto Sans', sans-serif" }}>
                            {t('header.brand.name')}
                        </h1>
                        <span className="text-[10px] text-muted-foreground font-medium max-w-[120px] leading-tight transition-all pt-[3px]">
                            {t('header.brand.slogan')}
                        </span>
                    </div>
                </Link>

                {/* Mobile Menu */}
                <MobileMenu
                    className="ml-auto lg:ml-0 bg-background/90 backdrop-blur-md border shadow-sm rounded-full p-1"
                    onOpenNotifications={() => setIsNotificationsOpen(true)}
                />

                {/* Desktop Nav — clean text links, no icons */}
                <nav className="hidden lg:flex lg:justify-self-center items-center gap-1">
                    <Link href={ROUTES.HOME}>
                        <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                            {t('header.nav.home')}
                        </Button>
                    </Link>

                    <NavMenu
                        trigger={
                            <Button variant="ghost" className="gap-1.5 text-muted-foreground hover:text-foreground">
                                <span>{t('header.nav.explore')}</span>
                                <ChevronDown className="h-3 w-3 opacity-50" />
                            </Button>
                        }
                        items={[
                            {
                                title: t('header.nav_menu.items.tour'),
                                description: t('header.nav_menu.explore.tour_desc'),
                                href: ROUTES.EXPLORE.TOURS,
                                icon: <MapIcon className="h-5 w-5" />,
                            },
                            {
                                title: t('header.nav_menu.items.companies'),
                                description: t('header.nav_menu.explore.companies_subtitle'),
                                href: ROUTES.EXPLORE.COMPANIES,
                                icon: <Building2 className="h-5 w-5" />,
                            },
                            {
                                title: t('header.nav_menu.items.hotels'),
                                description: t('header.nav_menu.explore.hotels_desc'),
                                href: ROUTES.EXPLORE.TOURS,
                                icon: <Hotel className="h-5 w-5" />,
                            },
                            {
                                title: t('header.nav_menu.items.guides'),
                                description: t('header.nav_menu.explore.guides_desc'),
                                href: ROUTES.EXPLORE.GUIDES,
                                icon: <Users className="h-5 w-5" />,
                            },
                            {
                                title: t('header.nav_menu.items.drivers'),
                                description: t('header.nav_menu.explore.drivers_desc'),
                                href: ROUTES.EXPLORE.DRIVERS,
                                icon: <Car className="h-5 w-5" />,
                            },
                        ]}
                    />

                    <Link href={ROUTES.BLOG.LIST}>
                        <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                            {t('header.nav.blog')}
                        </Button>
                    </Link>

                    <Link href="/about">
                        <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                            {t('header.nav.about')}
                        </Button>
                    </Link>

                    <Link href="/contact">
                        <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                            {t('header.nav.contact')}
                        </Button>
                    </Link>
                </nav>

                {/* Right Section */}
                <div className="hidden lg:flex lg:justify-self-end items-center gap-1">
                    {hasMounted && isAuthenticated ? (
                        <>
                            {/* Chat */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative text-muted-foreground hover:text-foreground"
                                onClick={() => dispatch(openDrawer())}
                            >
                                <MessageSquare className="h-5 w-5" />
                                {totalUnread > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white ring-2 ring-background">
                                        {totalUnread > 99 ? '99+' : totalUnread}
                                    </span>
                                )}
                            </Button>

                            {/* Notifications */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative text-muted-foreground hover:text-foreground"
                                onClick={() => setIsNotificationsOpen(true)}
                            >
                                <Bell className="h-5 w-5" />
                                {notificationCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white ring-2 ring-background">
                                        {notificationCount > 99 ? '99+' : notificationCount}
                                    </span>
                                )}
                            </Button>

                            {/* Avatar + Enhanced Dropdown */}
                            <div className="relative" ref={userMenuRef}>
                                <Button
                                    variant="ghost"
                                    className="h-9 w-9 p-0 rounded-full"
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                >
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden">
                                        {user?.avatarUrl ? (
                                            <img
                                                src={getMediaUrl(user.avatarUrl)}
                                                alt={`${user.firstName} ${user.lastName}`}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-sm font-semibold">
                                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                                            </span>
                                        )}
                                    </div>
                                </Button>

                                {isUserMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute top-full right-0 mt-2 w-64 bg-background rounded-xl shadow-lg border overflow-hidden z-50"
                                    >
                                        {/* User Info */}
                                        <div className="p-4 border-b">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden">
                                                    {user?.avatarUrl ? (
                                                        <img
                                                            src={getMediaUrl(user.avatarUrl)}
                                                            alt={`${user.firstName} ${user.lastName}`}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-semibold">
                                                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                                                        </span>
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
                                        <div className="p-1 border-b">
                                            <Link
                                                href={ROUTES.DASHBOARD}
                                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                                                <span>{t('auth.dashboard')}</span>
                                            </Link>
                                            <Link
                                                href={ROUTES.PROFILE}
                                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span>{t('auth.profile')}</span>
                                            </Link>
                                            <Link
                                                href="/chats"
                                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                                <span>{t('auth.messages')}</span>
                                            </Link>
                                        </div>

                                        {/* Preferences: Language + Currency */}
                                        <div className="p-3 border-b">
                                            <PreferencesPanel
                                                currentLang={i18n.language}
                                                currentCurrency={currency}
                                                onLanguageChange={handleLanguageChange}
                                                onCurrencyChange={handleCurrencyChange}
                                            />
                                        </div>

                                        {/* Logout */}
                                        <div className="p-1">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                <span>{t('auth.logout')}</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Globe: Language + Currency Popover */}
                            <div className="relative" ref={prefsRef}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-foreground"
                                    onClick={() => setIsPrefsOpen(!isPrefsOpen)}
                                    aria-label="Language & Currency"
                                >
                                    <Globe className="h-5 w-5" />
                                </Button>

                                {isPrefsOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute top-full right-0 mt-2 w-56 bg-background rounded-xl shadow-lg border overflow-hidden z-50"
                                    >
                                        <div className="p-3">
                                            <PreferencesPanel
                                                currentLang={i18n.language}
                                                currentCurrency={currency}
                                                onLanguageChange={handleLanguageChange}
                                                onCurrencyChange={handleCurrencyChange}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            <Link href={ROUTES.LOGIN}>
                                <Button variant="ghost" className="font-semibold">
                                    {t('auth.login')}
                                </Button>
                            </Link>
                            <Link href={ROUTES.REGISTER}>
                                <Button
                                    className="font-semibold shadow-sm text-white hover:opacity-90"
                                    style={{ backgroundColor: colors.secondary }}
                                >
                                    {t('auth.register')}
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
            <ChatDrawer />
            <NotificationDrawer isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
        </motion.header >
    );
};
