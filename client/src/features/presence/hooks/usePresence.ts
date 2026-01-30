'use client';

import { useQuery } from '@tanstack/react-query';
import { presenceService } from '../services/presence.service';

export const usePresence = (userId: string | null | undefined) => {
    return useQuery({
        queryKey: ['presence', userId],
        queryFn: () => presenceService.getUserPresence(userId!),
        enabled: !!userId,
        staleTime: 10 * 1000, // 10 seconds
    });
};

export const useMyPresence = () => {
    return useQuery({
        queryKey: ['presence', 'me'],
        queryFn: () => presenceService.getMyPresence(),
        staleTime: 10 * 1000,
    });
};

export const useMultiplePresence = (userIds: string[]) => {
    return useQuery({
        queryKey: ['presence', 'multiple', userIds],
        queryFn: () => presenceService.getMultiplePresence(userIds),
        enabled: userIds.length > 0,
        staleTime: 10 * 1000,
    });
};

export const useConnectionStats = () => {
    return useQuery({
        queryKey: ['presence', 'stats'],
        queryFn: () => presenceService.getConnectionStats(),
        staleTime: 30 * 1000,
    });
};
