'use client';

import { useNotificationWebSocket } from '@/features/notifications/hooks/useNotificationWebSocket';

/**
 * Component that initializes real-time notification updates.
 * Should be placed inside WebSocketProvider and QueryClientProvider.
 */
export const NotificationInitializer = () => {
    // This hook sets up WebSocket subscription for notifications
    useNotificationWebSocket();

    // This component doesn't render anything
    return null;
};
