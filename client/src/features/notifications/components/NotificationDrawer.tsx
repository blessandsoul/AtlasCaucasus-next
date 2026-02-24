'use client';

import { useEffect, useCallback, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationItem } from './NotificationItem';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
    useNotifications,
    useMarkAsRead,
    useMarkAllAsRead,
    useDeleteNotification,
} from '../hooks/useNotifications';
import { groupNotifications } from '../utils/notification.utils';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { selectChat } from '@/features/chat/store/chatSlice';
import { ROUTES } from '@/lib/constants/routes';

interface NotificationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NotificationDrawer = ({ isOpen, onClose }: NotificationDrawerProps) => {
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [page, setPage] = useState(1);
    const [mounted, setMounted] = useState(false);

    // Handle client-side mounting for portal
    useEffect(() => {
        setMounted(true);
    }, []);

    const { data, isLoading, isFetching } = useNotifications(
        { page, limit: 20 },
        { enabled: isAuthenticated && isOpen && mounted }
    );

    const groupedNotifications = useMemo(() => {
        if (!data?.items) return [];
        return groupNotifications(data.items);
    }, [data?.items]);

    const markAsRead = useMarkAsRead();
    const markAllAsRead = useMarkAllAsRead();
    const deleteNotification = useDeleteNotification();

    // Close if not authenticated
    useEffect(() => {
        if (!isAuthenticated && isOpen) {
            onClose();
        }
    }, [isAuthenticated, isOpen, onClose]);

    const handleMarkAsRead = useCallback(
        (ids: string[]) => {
            ids.forEach(id => markAsRead.mutate(id));
        },
        [markAsRead]
    );

    const handleMarkAllAsRead = useCallback(() => {
        markAllAsRead.mutate();
    }, [markAllAsRead]);

    const handleDelete = useCallback(
        (ids: string[]) => {
            ids.forEach(id => deleteNotification.mutate(id));
        },
        [deleteNotification]
    );

    const handleNotificationClick = useCallback((notification: typeof groupedNotifications[0]) => {
        // Mark as read first
        handleMarkAsRead(notification.childIds);

        // Handle redirection for CHAT_MESSAGE
        if (notification.type === 'CHAT_MESSAGE' && notification.data?.chatId) {
            onClose();
            dispatch(selectChat(notification.data.chatId as string));
        }

        // Handle redirection for INQUIRY notifications
        if ((notification.type === 'INQUIRY_RECEIVED' || notification.type === 'INQUIRY_RESPONSE') && notification.data?.inquiryId) {
            onClose();
            router.push(ROUTES.INQUIRIES.DETAILS(notification.data.inquiryId as string));
        }

        // Handle redirection for BOOKING notifications
        if (notification.data?.bookingId) {
            const bookingId = notification.data.bookingId as string;
            onClose();
            router.push(ROUTES.BOOKINGS.DETAIL(bookingId));
        }
    }, [handleMarkAsRead, onClose, dispatch, router]);

    const hasNotifications = groupedNotifications.length > 0;
    const hasUnread = groupedNotifications.some((n) => !n.isRead);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm pointer-events-auto"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
                        className="fixed inset-y-0 right-0 z-[101] w-full sm:w-[420px] bg-background shadow-xl border-l border-border flex flex-col pointer-events-auto"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <div className="flex items-center gap-2">
                                <Bell className="h-5 w-5 text-muted-foreground" />
                                <h2 className="font-semibold text-lg">{t('notifications.title', 'Notifications')}</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                {hasUnread && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleMarkAllAsRead}
                                        disabled={markAllAsRead.isPending}
                                        className="text-xs gap-1"
                                    >
                                        {markAllAsRead.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <CheckCheck className="h-4 w-4" />
                                        )}
                                        {t('notifications.mark_all_read', 'Mark all as read')}
                                    </Button>
                                )}
                                <Button variant="ghost" size="icon" onClick={onClose}>
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {isLoading ? (
                                // Loading skeleton
                                <div className="p-4 space-y-4">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-3/4" />
                                                <Skeleton className="h-3 w-full" />
                                                <Skeleton className="h-3 w-16" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : !hasNotifications ? (
                                // Empty state
                                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
                                        <Bell className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium mb-1">{t('notifications.empty_title', 'No notifications')}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {t('notifications.empty_desc', "You're all caught up! Check back later for updates.")}
                                    </p>
                                </div>
                            ) : (
                                // Notifications list
                                <div className="divide-y divide-border">
                                    {groupedNotifications.map((notification) => (
                                        <NotificationItem
                                            key={notification.id}
                                            notification={notification}
                                            onMarkRead={() => handleNotificationClick(notification)}
                                            onDelete={handleDelete}
                                            isMarkingRead={
                                                markAsRead.isPending &&
                                                notification.childIds.includes(markAsRead.variables as string)
                                            }
                                            isDeleting={
                                                deleteNotification.isPending &&
                                                notification.childIds.includes(deleteNotification.variables as string)
                                            }
                                        />
                                    ))}

                                    {/* Load more */}
                                    {data?.pagination.hasNextPage && (
                                        <div className="p-4 text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setPage((p) => p + 1)}
                                                disabled={isFetching}
                                            >
                                                {isFetching ? (
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                ) : null}
                                                {t('notifications.load_more', 'Load more')}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )
            }
        </AnimatePresence >,
        document.body
    );
};
