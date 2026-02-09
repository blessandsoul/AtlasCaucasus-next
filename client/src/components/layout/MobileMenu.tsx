'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Compass, Building2, Headset, Map as MapIcon, Hotel, Users, Car, ChevronRight, LogOut, LayoutDashboard, MessageSquare, Bell, User, Home, Info, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { colors } from '@/lib/colors';
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

interface NavSection {
    key: string;
    icon: React.ReactNode;
    label: string;
    items: {
        title: string;
        href: string;
        icon: React.ReactNode;
    }[];
}

export const MobileMenu = ({ className, onOpenNotifications }: MobileMenuProps) => {
    const { t, i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    const { isAuthenticated, user, logout } = useAuth();
    const { startLoading, stopLoading } = useLoading();
    const dispatch = useAppDispatch();
    const { currency: selectedCurrency, setCurrency: setSelectedCurrency } = useCurrency();

    // Fetch unread counts
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

    const navSections: NavSection[] = [
        {
            key: 'explore',
            icon: <Compass className="h-5 w-5" />,
            label: t('header.nav.explore'),
            items: [
                { title: t('header.nav_menu.items.tour'), href: ROUTES.EXPLORE.TOURS, icon: <MapIcon className="h-4 w-4" /> },
                { title: t('header.nav_menu.items.companies'), href: ROUTES.EXPLORE.COMPANIES, icon: <Building2 className="h-4 w-4" /> },
                { title: t('header.nav_menu.items.hotels'), href: ROUTES.EXPLORE.TOURS, icon: <Hotel className="h-4 w-4" /> },
                { title: t('header.nav_menu.items.guides'), href: ROUTES.EXPLORE.GUIDES, icon: <Users className="h-4 w-4" /> },
                { title: t('header.nav_menu.items.drivers'), href: ROUTES.EXPLORE.DRIVERS, icon: <Car className="h-4 w-4" /> }
            ]
        }
    ];

    const toggleSection = (key: string) => {
        setExpandedSection(expandedSection === key ? null : key);
    };

    const closeMenu = () => {
        setIsOpen(false);
        setExpandedSection(null);
    };

    const handleLanguageChange = (lang: string) => {
        const currentLang = i18n.language;
        if (currentLang === lang) return;

        closeMenu();
        startLoading();
        setTimeout(() => {
            i18n.changeLanguage(lang);
            setTimeout(() => {
                stopLoading();
            }, 300);
        }, 500);
    };

    const getFlagCode = (lang: string) => {
        switch (lang) {
            case 'ka': return 'ge';
            case 'en': return 'gb';
            case 'ru': return 'ru';
            default: return 'ge';
        }
    };

    return (
        <div className={cn("lg:hidden", className)}>
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

                                {/* Scrollable Navigation */}
                                <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
                                    {/* Link: Home */}
                                    <Link
                                        href={ROUTES.HOME}
                                        onClick={closeMenu}
                                        className="flex items-center gap-3 p-3 rounded-xl border bg-card/50 hover:bg-muted/50 transition-colors mb-2"
                                    >
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                                            <Home className="h-5 w-5" />
                                        </div>
                                        <span className="font-semibold text-sm">{t('header.nav.home')}</span>
                                    </Link>

                                    {navSections.map((section) => (
                                        <div key={section.key} className="overflow-hidden rounded-xl border bg-card/50 mb-2">
                                            <button
                                                onClick={() => toggleSection(section.key)}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-3 transition-all",
                                                    expandedSection === section.key ? "bg-muted/50" : "hover:bg-muted/30"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "flex items-center justify-center w-8 h-8 rounded-lg",
                                                        expandedSection === section.key ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                                                    )}>
                                                        {section.icon}
                                                    </div>
                                                    <span className="font-semibold text-sm">{section.label}</span>
                                                </div>
                                                <ChevronRight className={cn(
                                                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                                                    expandedSection === section.key && "rotate-90"
                                                )} />
                                            </button>

                                            <AnimatePresence>
                                                {expandedSection === section.key && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <div className="px-3 pb-3 pt-1 space-y-1">
                                                            {section.items.map((item, idx) => (
                                                                <Link
                                                                    key={idx}
                                                                    href={item.href}
                                                                    onClick={closeMenu}
                                                                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors group"
                                                                >
                                                                    <div className="text-muted-foreground group-hover:text-primary transition-colors">
                                                                        {item.icon}
                                                                    </div>
                                                                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                                                        {item.title}
                                                                    </span>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}

                                    <Link
                                        href={ROUTES.BLOG.LIST}
                                        onClick={closeMenu}
                                        className="flex items-center gap-3 p-3 rounded-xl border bg-card/50 hover:bg-muted/50 transition-colors mt-2"
                                    >
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                                            <BookOpen className="h-5 w-5" />
                                        </div>
                                        <span className="font-semibold text-sm">{t('header.nav.blog')}</span>
                                    </Link>

                                    <Link
                                        href="/about"
                                        onClick={closeMenu}
                                        className="flex items-center gap-3 p-3 rounded-xl border bg-card/50 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                                            <Info className="h-5 w-5" />
                                        </div>
                                        <span className="font-semibold text-sm">{t('header.nav.about')}</span>
                                    </Link>

                                    <Link
                                        href="/contact"
                                        onClick={closeMenu}
                                        className="flex items-center gap-3 p-3 rounded-xl border bg-card/50 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                                            <Headset className="h-5 w-5" />
                                        </div>
                                        <span className="font-semibold text-sm">{t('header.nav.contact')}</span>
                                    </Link>
                                </div>

                                {/* Footer Area */}
                                <div className="p-4 border-t bg-muted/10 space-y-4">
                                    {/* Language Switcher - Compact Row */}
                                    <div className="flex items-center justify-center gap-2 p-1 bg-muted/50 rounded-lg">
                                        {['ka', 'en', 'ru'].map((lang) => (
                                            <button
                                                key={lang}
                                                onClick={() => handleLanguageChange(lang)}
                                                className={cn(
                                                    "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all",
                                                    i18n.language === lang
                                                        ? "bg-background shadow-sm text-primary"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <span className={`fi fis fi-${getFlagCode(lang)} rounded-sm`} />
                                                <span className="uppercase">{lang}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Currency Switcher - Compact Row */}
                                    <div className="flex items-center justify-center gap-2 p-1 bg-muted/50 rounded-lg">
                                        {SUPPORTED_CURRENCIES.map((c) => (
                                            <button
                                                key={c}
                                                onClick={() => setSelectedCurrency(c)}
                                                className={cn(
                                                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all",
                                                    selectedCurrency === c
                                                        ? "bg-background shadow-sm text-primary"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <span className="font-semibold">{CURRENCY_SYMBOLS[c]}</span>
                                                <span>{c}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Auth Section */}
                                    {isAuthenticated && user ? (
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
                                                    onClick={() => {
                                                        dispatch(openDrawer());
                                                        closeMenu();
                                                    }}
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
                                                    onClick={() => {
                                                        onOpenNotifications();
                                                        closeMenu();
                                                    }}
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
                                                onClick={() => {
                                                    logout();
                                                    closeMenu();
                                                }}
                                            >
                                                <LogOut className="mr-2 h-3.5 w-3.5" />
                                                {t('auth.logout')}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            <Link href={ROUTES.LOGIN} onClick={closeMenu}>
                                                <Button variant="outline" className="w-full">
                                                    {t('auth.login')}
                                                </Button>
                                            </Link>
                                            <Link href={ROUTES.REGISTER} onClick={closeMenu}>
                                                <Button className="w-full text-white" style={{ backgroundColor: colors.secondary }}>
                                                    {t('auth.register')}
                                                </Button>
                                            </Link>
                                        </div>
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
