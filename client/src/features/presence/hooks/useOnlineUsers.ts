'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { presenceService } from '../services/presence.service';
import { useWebSocket } from '@/context/WebSocketContext';

export const useOnlineUsers = () => {
    const { status } = useWebSocket();

    const query = useQuery({
        queryKey: ['presence', 'online'],
        queryFn: () => presenceService.getOnlineUsers(),
        staleTime: 30 * 1000, // 30 seconds
        refetchInterval: 60 * 1000, // Refetch every minute as fallback
        enabled: status === 'connected',
    });

    // Derive a Set for O(1) lookup performance
    const onlineUserIds = useMemo(
        () => new Set(query.data?.userIds || []),
        [query.data?.userIds]
    );

    const isUserOnline = (userId: string): boolean => onlineUserIds.has(userId);

    return {
        ...query,
        onlineUserIds,
        onlineCount: query.data?.count || 0,
        isUserOnline,
    };
};
