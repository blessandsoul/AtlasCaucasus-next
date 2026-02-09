'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { favoriteService } from '../services/favorite.service';
import { getErrorMessage } from '@/lib/utils/error';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { FavoriteEntityType } from '../types/favorite.types';

// Query key factory
export const favoriteKeys = {
    all: ['favorites'] as const,
    lists: () => [...favoriteKeys.all, 'list'] as const,
    list: (entityType?: FavoriteEntityType) => [...favoriteKeys.lists(), entityType] as const,
    checks: () => [...favoriteKeys.all, 'check'] as const,
    check: (entityType: FavoriteEntityType, entityIds: string[]) =>
        [...favoriteKeys.checks(), entityType, entityIds] as const,
};

/**
 * Hook to list user's favorites
 */
export const useFavorites = (params: {
    page?: number;
    limit?: number;
    entityType?: FavoriteEntityType;
} = {}) => {
    const { isAuthenticated } = useAuth();

    return useQuery({
        queryKey: favoriteKeys.list(params.entityType),
        queryFn: () => favoriteService.getFavorites(params),
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook to batch check which entity IDs are favorited
 * Returns a Set<string> of favorited IDs for easy lookup
 */
export const useFavoriteCheck = (entityType: FavoriteEntityType, entityIds: string[]) => {
    const { isAuthenticated } = useAuth();

    return useQuery({
        queryKey: favoriteKeys.check(entityType, entityIds),
        queryFn: async () => {
            if (entityIds.length === 0) return new Set<string>();
            const favoritedIds = await favoriteService.batchCheckFavorites(entityType, entityIds);
            return new Set(favoritedIds);
        },
        enabled: isAuthenticated && entityIds.length > 0,
        staleTime: 2 * 60 * 1000,
    });
};

/**
 * Hook to toggle a favorite (add or remove) with optimistic UI
 */
export const useToggleFavorite = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            entityType,
            entityId,
            isFavorited,
        }: {
            entityType: FavoriteEntityType;
            entityId: string;
            isFavorited: boolean;
        }) => {
            if (isFavorited) {
                await favoriteService.removeFavorite(entityType, entityId);
            } else {
                await favoriteService.addFavorite(entityType, entityId);
            }
            return { entityType, entityId, isFavorited };
        },
        onMutate: async ({ entityId, isFavorited }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: favoriteKeys.checks() });

            // Snapshot previous check queries that contain this entityId
            const previousQueries = queryClient.getQueriesData<Set<string>>({
                queryKey: favoriteKeys.checks(),
            });

            // Optimistically update all relevant check queries
            queryClient.setQueriesData<Set<string>>(
                { queryKey: favoriteKeys.checks() },
                (old) => {
                    if (!old) return old;
                    const updated = new Set(old);
                    if (isFavorited) {
                        updated.delete(entityId);
                    } else {
                        updated.add(entityId);
                    }
                    return updated;
                }
            );

            return { previousQueries };
        },
        onError: (error, _variables, context) => {
            // Revert optimistic updates
            if (context?.previousQueries) {
                for (const [queryKey, data] of context.previousQueries) {
                    queryClient.setQueryData(queryKey, data);
                }
            }
            toast.error(getErrorMessage(error));
        },
        onSuccess: (_data, variables) => {
            if (variables.isFavorited) {
                toast.success(t('favorites.remove_success', 'Removed from favorites'));
            } else {
                toast.success(t('favorites.add_success', 'Added to favorites'));
            }
        },
        onSettled: () => {
            // Invalidate to refetch
            queryClient.invalidateQueries({ queryKey: favoriteKeys.checks() });
            queryClient.invalidateQueries({ queryKey: favoriteKeys.lists() });
        },
    });
};
