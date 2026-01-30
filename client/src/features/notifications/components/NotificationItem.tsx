'use client';

import { useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    MessageSquare,
    AtSign,
    Mail,
    MessageCircle,
    Calendar,
    CheckCircle,
    Bell,
    Trash2
} from 'lucide-react';
import type { IGroupedNotification, NotificationType } from '../types/notification.types';

interface NotificationItemProps {
    notification: IGroupedNotification;
    onMarkRead?: (ids: string[]) => void;
    onDelete?: (ids: string[]) => void;
    isMarkingRead?: boolean;
    isDeleting?: boolean;
}

const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
        case 'CHAT_MESSAGE':
            return <MessageSquare className="h-5 w-5" />;
        case 'CHAT_MENTION':
            return <AtSign className="h-5 w-5" />;
        case 'INQUIRY_RECEIVED':
            return <Mail className="h-5 w-5" />;
        case 'INQUIRY_RESPONSE':
            return <MessageCircle className="h-5 w-5" />;
        case 'BOOKING_REQUEST':
            return <Calendar className="h-5 w-5" />;
        case 'PROFILE_VERIFIED':
            return <CheckCircle className="h-5 w-5" />;
        case 'SYSTEM':
        default:
            return <Bell className="h-5 w-5" />;
    }
};

const getNotificationIconColor = (type: NotificationType): string => {
    switch (type) {
        case 'CHAT_MESSAGE':
        case 'CHAT_MENTION':
            return 'text-blue-500';
        case 'INQUIRY_RECEIVED':
        case 'INQUIRY_RESPONSE':
            return 'text-amber-500';
        case 'BOOKING_REQUEST':
            return 'text-green-500';
        case 'PROFILE_VERIFIED':
            return 'text-emerald-500';
        case 'SYSTEM':
        default:
            return 'text-muted-foreground';
    }
};

const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    }
    if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m ago`;
    }
    if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h ago`;
    }
    if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d ago`;
    }
    return date.toLocaleDateString();
};

export const NotificationItem = ({
    notification,
    onMarkRead,
    onDelete,
    isMarkingRead = false,
    isDeleting = false,
}: NotificationItemProps) => {
    const timeAgo = useMemo(
        () => formatTimeAgo(notification.createdAt),
        [notification.createdAt]
    );

    const handleClick = useCallback(() => {
        if (onMarkRead) {
            onMarkRead(notification.childIds);
        }
    }, [notification.childIds, onMarkRead]);

    const handleDelete = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            onDelete?.(notification.childIds);
        },
        [notification.childIds, onDelete]
    );

    const icon = useMemo(
        () => getNotificationIcon(notification.type),
        [notification.type]
    );
    const iconColor = useMemo(
        () => getNotificationIconColor(notification.type),
        [notification.type]
    );

    return (
        <div
            onClick={handleClick}
            className={cn(
                'group relative flex items-start gap-3 p-4 transition-colors cursor-pointer',
                'hover:bg-muted/50',
                !notification.isRead && 'bg-primary/5',
                (isMarkingRead || isDeleting) && 'opacity-50 pointer-events-none'
            )}
        >
            {/* Unread indicator */}
            {!notification.isRead && (
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
            )}

            {/* Icon */}
            <div
                className={cn(
                    'flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-muted relative',
                    iconColor
                )}
            >
                {icon}
                {notification.count > 1 && (
                    <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
                        {notification.count > 99 ? '99+' : notification.count}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className={cn(
                    'text-sm leading-snug',
                    !notification.isRead ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}>
                    {notification.title}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                    {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    {timeAgo}
                </p>
            </div>

            {/* Delete button */}
            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    'opacity-0 group-hover:opacity-100 transition-opacity',
                    'h-8 w-8 text-muted-foreground hover:text-destructive'
                )}
                onClick={handleDelete}
                disabled={isDeleting}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
};
