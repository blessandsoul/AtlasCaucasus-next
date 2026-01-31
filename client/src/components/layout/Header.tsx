'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { ROUTES } from '@/lib/constants/routes';
import { Compass, Building2, Headset, ChevronDown, User, LogOut, Map as MapIcon, Hotel, Users, Car, LayoutDashboard, MessageSquare, Bell, Home } from 'lucide-react';
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
import { useAppDispatch } from '@/store/hooks';
import { openDrawer } from '@/features/chat/store/chatSlice';
import { useChats } from '@/features/chat/hooks/useChats';
import { useUnreadCount, notificationKeys } from '@/features/notifications/hooks/useNotifications';
import { MessageType } from '@/lib/websocket/websocket.types';

export const Header = () => {
    const { t, i18n } = useTranslation();
    const { scrollY } = useScroll();
    const [hidden, setHidden] = useState(false);
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);
    const langRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const { isAuthenticated, user, logout } = useAuth();
    const dispatch = useAppDispatch();

    // Prevent hydration mismatch by only rendering auth-dependent content after mount
    useEffect(() => {
        setHasMounted(true);
    }, []);
    const { subscribe } = useWebSocket();
    const queryClient = useQueryClient();

    // Get chat unread count
    const { data: chatsData } = useChats({}, { enabled: isAuthenticated && hasMounted });
    const totalUnread = chatsData?.items.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0) || 0;

    // Get notification unread count
    const { data: unreadCountData } = useUnreadCount();
    const notificationCount = unreadCountData?.count || 0;

    // Subscribe to real-time notifications
    useEffect(() => {
        const unsubscribe = subscribe(MessageType.NOTIFICATION, () => {
            // Invalidate and refetch notification count when new notification arrives
            queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
        });
        return unsubscribe;
    }, [subscribe, queryClient]);

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious() || 0;
        if (latest > previous && latest > 150) {
            setHidden(true);
            setIsLangOpen(false);
            setIsUserMenuOpen(false);
        } else {
            setHidden(false);
        }
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(event.target as Node)) {
                setIsLangOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const getFlagCode = (lang: string) => {
        switch (lang) {
            case 'ka': return 'ge';
            case 'en': return 'gb';
            case 'ru': return 'ru';
            default: return 'ge';
        }
    };

    const { startLoading, stopLoading } = useLoading();

    const handleLanguageChange = (lang: string) => {
        setIsLangOpen(false);
        startLoading();
        setTimeout(() => {
            i18n.changeLanguage(lang);
            setTimeout(() => {
                stopLoading();
            }, 300);
        }, 500);
    };

    const handleLogout = () => {
        setIsUserMenuOpen(false);
        logout();
    };

    return (
        <motion.header
            variants={{
                visible: { y: 0, opacity: 1 },
                hidden: { y: -100, opacity: 0 },
            }}
            animate={hidden ? "hidden" : "visible"}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="fixed top-0 z-50 w-full pt-6 px-4 flex justify-center bg-transparent pointer-events-none"
        >
            <div className="container mx-auto flex min-h-16 h-auto py-2 items-center justify-between pointer-events-auto px-0 lg:px-6 lg:rounded-2xl lg:border lg:bg-background lg:backdrop-blur-md lg:shadow-lg transition-all duration-300">

                {/* Brand Section */}
                <Link
                    href={ROUTES.HOME}
                    className="hidden lg:flex items-center gap-3 group bg-background/90 backdrop-blur-md border shadow-sm rounded-full p-2 pr-4 lg:bg-transparent lg:border-none lg:shadow-none lg:p-0 lg:rounded-none transition-all"
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

                {/* Mobile Menu - Below 1024px */}
                <MobileMenu
                    className="ml-auto lg:ml-0 bg-background/90 backdrop-blur-md border shadow-sm rounded-full p-1"
                    onOpenNotifications={() => setIsNotificationsOpen(true)}
                />

                {/* Navigation - Full mode (1024px+) */}
                <nav className="hidden lg:flex items-center gap-1">
                    <Link href={ROUTES.HOME}>
                        <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                            <Home className="h-4 w-4" />
                            <span>{t('header.nav.home', 'მთავარი')}</span>
                        </Button>
                    </Link>

                    <NavMenu
                        trigger={
                            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                                <Compass className="h-4 w-4" />
                                <span>{t('header.nav.explore')}</span>
                                <ChevronDown className="h-3 w-3 ml-0.5 opacity-50" />
                            </Button>
                        }
                        items={[
                            {
                                title: t('header.nav_menu.items.tour'),
                                description: t('header.nav_menu.explore.tour_desc'),
                                href: ROUTES.EXPLORE.TOURS,
                                icon: <MapIcon className="h-5 w-5" />
                            },
                            {
                                title: t('header.nav_menu.items.companies'),
                                description: t('header.nav_menu.explore.companies_subtitle'),
                                href: ROUTES.EXPLORE.COMPANIES,
                                icon: <Building2 className="h-5 w-5" />
                            },
                            {
                                title: t('header.nav_menu.items.hotels'),
                                description: t('header.nav_menu.explore.hotels_desc'),
                                href: ROUTES.EXPLORE.TOURS,
                                icon: <Hotel className="h-5 w-5" />
                            },
                            {
                                title: t('header.nav_menu.items.guides'),
                                description: t('header.nav_menu.explore.guides_desc'),
                                href: ROUTES.EXPLORE.GUIDES,
                                icon: <Users className="h-5 w-5" />
                            },
                            {
                                title: t('header.nav_menu.items.drivers'),
                                description: t('header.nav_menu.explore.drivers_desc'),
                                href: ROUTES.EXPLORE.DRIVERS,
                                icon: <Car className="h-5 w-5" />
                            }
                        ]}
                    />

                    <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                        <Headset className="h-4 w-4" />
                        <span>{t('header.nav.support')}</span>
                    </Button>
                </nav>

                {/* Auth Section */}
                <div className="hidden lg:flex items-center gap-2">
                    {/* Language Selector */}
                    <div className="relative" ref={langRef}>
                        <Button
                            variant="ghost"
                            className="h-9 w-9 p-0 rounded-md"
                            onClick={() => setIsLangOpen(!isLangOpen)}
                        >
                            <span className={`fi fis fi-${getFlagCode(i18n.language)} text-xl`} />
                        </Button>

                        {isLangOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-12 bg-background rounded-md shadow-lg border overflow-hidden z-50 flex flex-col p-1 gap-1"
                            >
                                <button
                                    onClick={() => handleLanguageChange('ka')}
                                    className="w-full h-8 flex items-center justify-center hover:bg-muted rounded-sm transition-colors"
                                    aria-label="Georgian"
                                >
                                    <span className="fi fis fi-ge text-lg" />
                                </button>
                                <button
                                    onClick={() => handleLanguageChange('en')}
                                    className="w-full h-8 flex items-center justify-center hover:bg-muted rounded-sm transition-colors"
                                    aria-label="English"
                                >
                                    <span className="fi fis fi-gb text-lg" />
                                </button>
                                <button
                                    onClick={() => handleLanguageChange('ru')}
                                    className="w-full h-8 flex items-center justify-center hover:bg-muted rounded-sm transition-colors"
                                    aria-label="Russian"
                                >
                                    <span className="fi fis fi-ru text-lg" />
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {/* Auth Buttons or User Menu */}
                    {hasMounted && isAuthenticated ? (
                        <>
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

                            <div className="relative" ref={userMenuRef}>
                                <Button
                                    variant="ghost"
                                    className="h-9 w-9 p-0 rounded-full"
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                >
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#22d3ee] text-white">
                                        <User className="h-5 w-5" />
                                    </div>
                                </Button>

                                {isUserMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute top-full right-0 mt-2 w-48 bg-background rounded-md shadow-lg border overflow-hidden z-50"
                                    >
                                        <div className="px-4 py-3 border-b">
                                            <p className="text-sm font-medium text-foreground">
                                                {user?.firstName} {user?.lastName}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {user?.email}
                                            </p>
                                        </div>
                                        <div className="p-1">
                                            <Link
                                                href={ROUTES.DASHBOARD}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-sm transition-colors"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <LayoutDashboard className="h-4 w-4" />
                                                <span>{t('auth.dashboard')}</span>
                                            </Link>
                                            <Link
                                                href={ROUTES.PROFILE}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-sm transition-colors"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <User className="h-4 w-4" />
                                                <span>{t('auth.profile')}</span>
                                            </Link>
                                            <Link
                                                href="/chats"
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-sm transition-colors"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                                <span>{t('auth.messages', 'Messages')}</span>
                                            </Link>

                                            {user?.roles?.includes('COMPANY') && (
                                                <>
                                                </>
                                            )}
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-sm transition-colors"
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

