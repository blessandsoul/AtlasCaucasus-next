'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/context/WebSocketContext';
import { MessageType } from '@/lib/websocket/websocket.types';
import { notificationKeys } from './useNotifications';
import type { INotification, INotificationsResponse, IUnreadCountResponse } from '../types/notification.types';

interface NotificationPayload {
    notification: INotification;
}

/**
 * Hook to handle real-time notification updates via WebSocket.
 * This hook should be used once at a high level (e.g., in a layout or provider)
 * to listen for notification events and update the React Query cache.
 */
export const useNotificationWebSocket = () => {
    const { subscribe, status } = useWebSocket();
    const queryClient = useQueryClient();

    useEffect(() => {
        // Subscribe to notification events
        const unsubscribe = subscribe(MessageType.NOTIFICATION, (wsMessage) => {
            const payload = wsMessage.payload as NotificationPayload;
            const notification = payload.notification;

            // Update the notifications list cache
            queryClient.setQueriesData<INotificationsResponse>(
                { queryKey: notificationKeys.lists() },
                (oldData) => {
                    if (!oldData) return oldData;

                    // Check if notification already exists
                    const exists = oldData.items.some((n) => n.id === notification.id);
                    if (exists) return oldData;

                    // Add new notification to the beginning of the list
                    return {
                        ...oldData,
                        items: [notification, ...oldData.items],
                        pagination: {
                            ...oldData.pagination,
                            totalItems: oldData.pagination.totalItems + 1,
                        },
                    };
                }
            );

            // Increment the unread count cache
            queryClient.setQueryData<IUnreadCountResponse>(
                notificationKeys.unreadCount(),
                (oldData) => {
                    const newCount = (oldData?.count || 0) + 1;
                    return { count: newCount };
                }
            );

            // Optionally invalidate to refetch for consistency
            // This ensures we get fresh data on next focus
            queryClient.invalidateQueries({
                queryKey: notificationKeys.all,
                refetchType: 'none', // Don't refetch immediately, just mark as stale
            });
        });

        return unsubscribe;
    }, [subscribe, queryClient, status]);

    return {
        isConnected: status === 'connected',
    };
};
