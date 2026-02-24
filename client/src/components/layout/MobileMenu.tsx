'use client';

import { useState, useEffect, useCallback, useRef, type FocusEvent } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Building2, Map as MapIcon, Hotel, Users, Car, LogOut, LayoutDashboard, MessageSquare, Bell, User, BookOpen, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';
import { SearchSuggestions } from '@/components/common/SearchSuggestions';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getMediaUrl } from '@/lib/utils/media';
import { useLoading } from '@/context/LoadingContext';
import { useAppDispatch } from '@/store/hooks';
import { openDrawer } from '@/features/chat/store/chatSlice';
import { useChats } from '@/features/chat/hooks/useChats';
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications';
import { useCurrency } from '@/context/CurrencyContext';
import { SUPPORTED_CURRENCIES, CURRENCY_SYMBOLS } from '@/lib/utils/currency';

interface MobileMenuProps {
    className?: string;
    onOpenNotifications: () => void;
}

interface CategoryLink {
    title: string;
    href: string;
    icon: React.ReactNode;
}

export const MobileMenu = ({ className, onOpenNotifications }: MobileMenuProps) => {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const mobileSearchRef = useRef<HTMLDivElement>(null);

    const { isAuthenticated, user, logout } = useAuth();
    const { startLoading, stopLoading } = useLoading();
    const dispatch = useAppDispatch();
    const { currency: selectedCurrency, setCurrency: setSelectedCurrency } = useCurrency();

    const { data: chatsData } = useChats({}, { enabled: isAuthenticated && mounted });
    const totalUnreadChats = chatsData?.items.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0) || 0;

    const { data: notificationData } = useUnreadCount({ enabled: isAuthenticated && mounted });
    const notificationCount = notificationData?.count || 0;

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const categoryLinks: CategoryLink[] = [
        { title: t('header.nav_menu.items.tour'), href: ROUTES.EXPLORE.TOURS, icon: <MapIcon className="h-4.5 w-4.5" /> },
        { title: t('header.nav_menu.items.companies'), href: ROUTES.EXPLORE.COMPANIES, icon: <Building2 className="h-4.5 w-4.5" /> },
        { title: t('header.nav_menu.items.hotels'), href: ROUTES.EXPLORE.TOURS, icon: <Hotel className="h-4.5 w-4.5" /> },
        { title: t('header.nav_menu.items.guides'), href: ROUTES.EXPLORE.GUIDES, icon: <Users className="h-4.5 w-4.5" /> },
        { title: t('header.nav_menu.items.drivers'), href: ROUTES.EXPLORE.DRIVERS, icon: <Car className="h-4.5 w-4.5" /> },
    ];

    const closeMenu = (): void => {
        setIsOpen(false);
    };

    const handleLanguageChange = (lang: string): void => {
        const currentLang = i18n.language;
        if (currentLang === lang) return;

        closeMenu();
        startLoading();
        setTimeout(() => {
            i18n.changeLanguage(lang);
            setTimeout(() => { stopLoading(); }, 300);
        }, 500);
    };

    const handleSearch = useCallback((): void => {
        const trimmed = searchQuery.trim();
        if (!trimmed) return;
        router.push(`${ROUTES.EXPLORE.TOURS}?search=${encodeURIComponent(trimmed)}`);
        setSearchQuery('');
        setIsSuggestionsOpen(false);
        closeMenu();
    }, [searchQuery, router]);

    const handleSearchBlur = useCallback((e: FocusEvent<HTMLDivElement>): void => {
        if (mobileSearchRef.current?.contains(e.relatedTarget as Node)) return;
        setIsSuggestionsOpen(false);
    }, []);

    const handleSuggestionSelect = useCallback((): void => {
        setSearchQuery('');
        setIsSuggestionsOpen(false);
        closeMenu();
    }, []);

    const getFlagCode = (lang: string): string => {
        switch (lang) {
            case 'ka': return 'ge';
            case 'en': return 'gb';
            case 'ru': return 'ru';
            default: return 'ge';
        }
    };

    return (
        <div className={cn('lg:hidden', className)}>
            <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setIsOpen(true)}
                aria-label="Open menu"
            >
                <Menu className="h-5 w-5" />
            </Button>

            {mounted && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]"
                                onClick={closeMenu}
                            />

                            {/* Drawer Panel */}
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed inset-y-0 right-0 w-full max-w-[320px] bg-background border-l shadow-2xl z-[100] flex flex-col h-full"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between p-4 border-b">
                                    <div className="flex items-center gap-3">
                                        <img src="/atlascaucasus.png" alt="Logo" className="h-8 w-8 object-contain" />
                                        <span className="text-sm font-bold tracking-tight" style={{ fontFamily: "'Noto Sans', sans-serif" }}>
                                            {t('header.brand.name')}
                                        </span>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={closeMenu} className="hover:bg-muted/50 rounded-full h-8 w-8">
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>

                                {/* Search Bar */}
                                <div
                                    ref={mobileSearchRef}
                                    className="relative px-4 py-3 border-b"
                                    onBlur={handleSearchBlur}
                                >
                                    <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => { setSearchQuery(e.target.value); setIsSuggestionsOpen(true); }}
                                                onFocus={() => setIsSuggestionsOpen(true)}
                                                className={cn(
                                                    'w-full h-10 pl-9 pr-4 rounded-full border border-border bg-muted/30 text-sm',
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

                                {/* Scrollable Navigation */}
                                <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
                                    {/* Category Links — flat list */}
                                    {categoryLinks.map((link, idx) => (
                                        <Link
                                            key={idx}
                                            href={link.href}
                                            onClick={closeMenu}
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                                                {link.icon}
                                            </div>
                                            <span className="font-medium text-sm">{link.title}</span>
                                        </Link>
                                    ))}

                                    <div className="h-px bg-border mx-2 my-2" />

                                    {/* Blog */}
                                    <Link
                                        href={ROUTES.BLOG.LIST}
                                        onClick={closeMenu}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                                            <BookOpen className="h-4.5 w-4.5" />
                                        </div>
                                        <span className="font-medium text-sm">{t('header.nav.blog')}</span>
                                    </Link>
                                </div>

                                {/* Footer Area */}
                                <div className="p-4 border-t bg-muted/10 space-y-4">
                                    {/* Language Switcher */}
                                    <div className="flex items-center justify-center gap-2 p-1 bg-muted/50 rounded-lg">
                                        {['ka', 'en', 'ru'].map((lang) => (
                                            <button
                                                key={lang}
                                                onClick={() => handleLanguageChange(lang)}
                                                className={cn(
                                                    'flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all',
                                                    i18n.language === lang
                                                        ? 'bg-background shadow-sm text-primary'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                )}
                                            >
                                                <span className={`fi fis fi-${getFlagCode(lang)} rounded-sm`} />
                                                <span className="uppercase">{lang}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Currency Switcher */}
                                    <div className="flex items-center justify-center gap-2 p-1 bg-muted/50 rounded-lg">
                                        {SUPPORTED_CURRENCIES.map((c) => (
                                            <button
                                                key={c}
                                                onClick={() => setSelectedCurrency(c)}
                                                className={cn(
                                                    'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all',
                                                    selectedCurrency === c
                                                        ? 'bg-background shadow-sm text-primary'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                )}
                                            >
                                                <span className="font-semibold">{CURRENCY_SYMBOLS[c]}</span>
                                                <span>{c}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Auth Section */}
                                    {!mounted ? (
                                        <div className="flex items-center gap-3 px-1">
                                            <div className="h-10 w-10 rounded-full bg-muted animate-pulse flex-shrink-0" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                                                <div className="h-2.5 w-32 bg-muted animate-pulse rounded" />
                                            </div>
                                        </div>
                                    ) : isAuthenticated && user ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 px-1">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold overflow-hidden flex-shrink-0">
                                                    {user.avatarUrl ? (
                                                        <img
                                                            src={getMediaUrl(user.avatarUrl)}
                                                            alt={`${user.firstName} ${user.lastName}`}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <span>{user.firstName[0]}{user.lastName?.[0]}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold truncate">{user.firstName} {user.lastName}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Link href={ROUTES.DASHBOARD} onClick={closeMenu}>
                                                    <Button variant="outline" className="w-full justify-start h-9 text-xs" size="sm">
                                                        <LayoutDashboard className="mr-2 h-3.5 w-3.5" />
                                                        {t('auth.dashboard')}
                                                    </Button>
                                                </Link>
                                                <Link href={ROUTES.PROFILE} onClick={closeMenu}>
                                                    <Button variant="outline" className="w-full justify-start h-9 text-xs" size="sm">
                                                        <User className="mr-2 h-3.5 w-3.5" />
                                                        {t('auth.profile')}
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start h-9 text-xs relative"
                                                    size="sm"
                                                    onClick={() => { dispatch(openDrawer()); closeMenu(); }}
                                                >
                                                    <MessageSquare className="mr-2 h-3.5 w-3.5" />
                                                    {t('auth.messages')}
                                                    {totalUnreadChats > 0 && (
                                                        <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-destructive ring-1 ring-background" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start h-9 text-xs relative"
                                                    size="sm"
                                                    onClick={() => { onOpenNotifications(); closeMenu(); }}
                                                >
                                                    <Bell className="mr-2 h-3.5 w-3.5" />
                                                    {t('header.nav.notifications')}
                                                    {notificationCount > 0 && (
                                                        <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-destructive ring-1 ring-background" />
                                                    )}
                                                </Button>
                                            </div>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start h-9 text-xs hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                                                size="sm"
                                                onClick={() => { logout(); closeMenu(); }}
                                            >
                                                <LogOut className="mr-2 h-3.5 w-3.5" />
                                                {t('auth.logout')}
                                            </Button>
                                        </div>
                                    ) : (
                                        <Link href={ROUTES.LOGIN} onClick={closeMenu} className="block">
                                            <Button className="w-full rounded-full bg-foreground text-background font-semibold hover:bg-foreground/90 transition-colors">
                                                {t('auth.login')}
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};
