'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { analyticsService } from '../services/analytics.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { AnalyticsEntityType } from '../types/analytics.types';

// Query key factory
export const analyticsKeys = {
    all: ['analytics'] as const,
    me: () => [...analyticsKeys.all, 'me'] as const,
};

/**
 * Hook to get provider analytics overview
 */
export const useProviderAnalytics = () => {
    const { isAuthenticated, user } = useAuth();

    const isProvider = isAuthenticated && user?.roles?.some(
        (r: string) => ['COMPANY', 'GUIDE', 'DRIVER'].includes(r)
    );

    return useQuery({
        queryKey: analyticsKeys.me(),
        queryFn: () => analyticsService.getMyAnalytics(),
        enabled: !!isProvider,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook to track a page view (fire-and-forget)
 */
export const useTrackView = () => {
    return useMutation({
        mutationFn: ({ entityType, entityId }: { entityType: AnalyticsEntityType; entityId: string }) =>
            analyticsService.trackView(entityType, entityId),
        // Silently ignore errors — view tracking is non-critical
    });
};
