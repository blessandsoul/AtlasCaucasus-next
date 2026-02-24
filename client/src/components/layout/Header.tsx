'use client';

import { useState, useRef, useEffect, useCallback, type FocusEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { ROUTES } from '@/lib/constants/routes';
import {
    Search, User, LogOut, LayoutDashboard, MessageSquare, Bell, Globe,
    Building2, Map as MapIcon, Hotel, Users, Car, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavMenu } from './NavMenu';
import { MobileMenu } from './MobileMenu';
import { ChatDrawer } from '@/features/chat/components/ChatDrawer';
import { NotificationDrawer } from '@/features/notifications/components/NotificationDrawer';
import { useWebSocket } from '@/context/WebSocketContext';
import { useLoading } from '@/context/LoadingContext';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getMediaUrl } from '@/lib/utils/media';
import { cn } from '@/lib/utils';
import { SearchSuggestions } from '@/components/common/SearchSuggestions';
import { useAppDispatch } from '@/store/hooks';
import { openDrawer } from '@/features/chat/store/chatSlice';
import { useChats } from '@/features/chat/hooks/useChats';
import { useUnreadCount, notificationKeys } from '@/features/notifications/hooks/useNotifications';
import { MessageType } from '@/lib/websocket/websocket.types';
import { useCurrency } from '@/context/CurrencyContext';
import { SUPPORTED_CURRENCIES, CURRENCY_SYMBOLS } from '@/lib/utils/currency';
import type { Currency } from '@/lib/utils/currency';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';

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
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isPrefsOpen, setIsPrefsOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const prefsRef = useRef<HTMLDivElement>(null);
    const { isAuthenticated, user, logout } = useAuth();
    const dispatch = useAppDispatch();
    const { currency, setCurrency } = useCurrency();

    // Scroll hide/show
    const { scrollY } = useScroll();
    useMotionValueEvent(scrollY, 'change', (latest) => {
        const previous = scrollY.getPrevious() ?? 0;
        if (latest < 80) {
            setIsHeaderVisible(true);
            return;
        }
        setIsHeaderVisible(latest < previous);
    });

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const { subscribe } = useWebSocket();
    const queryClient = useQueryClient();

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
            setTimeout(() => { stopLoading(); }, 300);
        }, 500);
    };

    const handleCurrencyChange = (c: Currency): void => {
        setCurrency(c);
    };

    const handleLogout = (): void => {
        setIsUserMenuOpen(false);
        logout();
    };

    const handleSearch = useCallback((): void => {
        const trimmed = searchQuery.trim();
        if (!trimmed) return;
        router.push(`${ROUTES.EXPLORE.TOURS}?search=${encodeURIComponent(trimmed)}`);
        setSearchQuery('');
        setIsSuggestionsOpen(false);
    }, [searchQuery, router]);

    const handleSearchBlur = useCallback((e: FocusEvent<HTMLDivElement>): void => {
        if (searchContainerRef.current?.contains(e.relatedTarget as Node)) return;
        setIsSuggestionsOpen(false);
    }, []);

    const handleSuggestionSelect = useCallback((): void => {
        setSearchQuery('');
        setIsSuggestionsOpen(false);
    }, []);

    const exploreItems = [
        { title: t('header.nav_menu.items.tour'), description: t('header.nav_menu.explore.tour_desc', ''), href: ROUTES.EXPLORE.TOURS, icon: <MapIcon className="h-5 w-5" /> },
        { title: t('header.nav_menu.items.companies'), description: t('header.nav_menu.explore.companies_subtitle', ''), href: ROUTES.EXPLORE.COMPANIES, icon: <Building2 className="h-5 w-5" /> },
        { title: t('header.nav_menu.items.hotels'), description: t('header.nav_menu.explore.hotels_desc', ''), href: ROUTES.EXPLORE.TOURS, icon: <Hotel className="h-5 w-5" /> },
        { title: t('header.nav_menu.items.guides'), description: t('header.nav_menu.explore.guides_desc', ''), href: ROUTES.EXPLORE.GUIDES, icon: <Users className="h-5 w-5" /> },
        { title: t('header.nav_menu.items.drivers'), description: t('header.nav_menu.explore.drivers_desc', ''), href: ROUTES.EXPLORE.DRIVERS, icon: <Car className="h-5 w-5" /> },
    ];

    return (
        <>
            <motion.header
                animate={{ y: isHeaderVisible ? 0 : '-100%' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="fixed top-0 z-50 w-full bg-background border-b border-border"
            >
                {/* Mobile */}
                <div className="flex lg:hidden items-center justify-between h-14 px-4">
                    <Link
                        href={ROUTES.HOME}
                        className="flex items-center gap-2.5 group transition-all active:scale-[0.98]"
                    >
                        <img src="/atlascaucasus.png" alt={t('header.brand.name')} className="h-7 w-7 object-contain group-hover:scale-105 transition-transform" />
                        <div className="flex flex-col justify-center">
                            <span className="text-[13px] font-bold leading-none text-foreground tracking-tight" style={{ fontFamily: "'Noto Sans', sans-serif" }}>
                                {t('header.brand.name')}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-medium leading-tight pt-[2px]">
                                {t('header.brand.slogan')}
                            </span>
                        </div>
                    </Link>
                    <MobileMenu
                        className="p-1"
                        onOpenNotifications={() => setIsNotificationsOpen(true)}
                    />
                </div>

                {/* Desktop */}
                <div className="hidden lg:flex items-center h-14 container mx-auto px-8">
                    {/* Logo */}
                    <Link
                        href={ROUTES.HOME}
                        className="flex items-center gap-2.5 group transition-all shrink-0"
                    >
                        <img src="/atlascaucasus.png" alt={t('header.brand.name')} className="h-8 w-8 object-contain group-hover:scale-105 transition-transform" />
                        <div className="flex flex-col justify-center">
                            <h1 className="text-sm font-bold leading-none text-foreground tracking-tight" style={{ fontFamily: "'Noto Sans', sans-serif" }}>
                                {t('header.brand.name')}
                            </h1>
                            <span className="text-[10px] text-muted-foreground font-medium max-w-[120px] leading-tight pt-[3px]">
                                {t('header.brand.slogan')}
                            </span>
                        </div>
                    </Link>

                    {/* Spacer — pushes everything after logo to the right */}
                    <div className="flex-1" />

                    {/* Search Bar */}
                    <div
                        ref={searchContainerRef}
                        className="relative w-[340px] shrink-0"
                        onBlur={handleSearchBlur}
                    >
                        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setIsSuggestionsOpen(true); }}
                                    onFocus={() => setIsSuggestionsOpen(true)}
                                    className={cn(
                                        'w-full h-9 pl-10 pr-4 rounded-full border border-border bg-muted/30 text-sm',
                                        'placeholder:text-muted-foreground',
                                        'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40',
                                        'transition-all'
                                    )}
                                    placeholder={t('header.search_placeholder', 'Search')}
                                />
                            </div>
                        </form>
                        <SearchSuggestions
                            query={searchQuery}
                            isOpen={isSuggestionsOpen}
                            onSelect={handleSuggestionSelect}
                        />
                    </div>

                    {/* Nav Links */}
                    <nav className="flex items-center shrink-0 h-full ml-1">
                        <Link
                            href={ROUTES.HOME}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
                        >
                            {t('header.nav.home', 'Home')}
                        </Link>
                        <NavMenu
                            trigger={
                                <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">
                                    {t('header.nav_menu.title', 'Explore')}
                                    <ChevronDown className="h-3.5 w-3.5" />
                                </span>
                            }
                            items={exploreItems}
                        />
                        <Link
                            href={ROUTES.BLOG.LIST}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
                        >
                            {t('header.nav.blog')}
                        </Link>
                    </nav>

                    {/* Separator */}
                    <div className="h-5 w-px bg-border mx-3 shrink-0" />

                    {/* Right Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        {!hasMounted ? (
                            <div className="flex items-center gap-2">
                                <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                            </div>
                        ) : isAuthenticated ? (
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

                                {/* Avatar + Dropdown */}
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
                                                            <img src={getMediaUrl(user.avatarUrl)} alt={`${user.firstName} ${user.lastName}`} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <span className="text-sm font-semibold">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-foreground truncate">{user?.firstName} {user?.lastName}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Quick Links */}
                                            <div className="p-1 border-b">
                                                <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                                                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                                                    <span>{t('auth.dashboard')}</span>
                                                </Link>
                                                <Link href={ROUTES.PROFILE} className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <span>{t('auth.profile')}</span>
                                                </Link>
                                                <Link href="/chats" className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                                    <span>{t('auth.messages')}</span>
                                                </Link>
                                            </div>

                                            {/* Preferences */}
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
                                {/* Globe: Language & Currency Popover */}
                                <div className="relative" ref={prefsRef}>
                                    <button
                                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5"
                                        onClick={() => setIsPrefsOpen(!isPrefsOpen)}
                                        aria-label="Language & Currency"
                                    >
                                        <Globe className="h-4.5 w-4.5" />
                                        <span className="text-sm font-medium">{CURRENCY_SYMBOLS[currency]} {currency}</span>
                                    </button>

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

                                {/* Sign In pill */}
                                <Link href={ROUTES.LOGIN}>
                                    <Button className="rounded-full bg-foreground text-background font-semibold px-5 h-9 hover:bg-foreground/90 transition-colors text-sm">
                                        {t('auth.login')}
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </motion.header>

            <ChatDrawer />
            <NotificationDrawer isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
        </>
    );
};
