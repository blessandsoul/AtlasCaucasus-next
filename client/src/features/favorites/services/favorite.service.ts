import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type {
    FavoriteEntityType,
    Favorite,
    FavoritesResponse,
    BatchCheckResponse,
    CheckResponse,
} from '../types/favorite.types';

class FavoriteService {
    async addFavorite(entityType: FavoriteEntityType, entityId: string): Promise<Favorite> {
        const response = await apiClient.post<{
            success: boolean;
            message: string;
            data: Favorite;
        }>(API_ENDPOINTS.FAVORITES.ADD, { entityType, entityId });

        return response.data.data;
    }

    async removeFavorite(entityType: FavoriteEntityType, entityId: string): Promise<void> {
        await apiClient.delete(API_ENDPOINTS.FAVORITES.REMOVE(entityType, entityId));
    }

    async getFavorites(params: {
        page?: number;
        limit?: number;
        entityType?: FavoriteEntityType;
    } = {}): Promise<FavoritesResponse> {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: FavoritesResponse;
        }>(API_ENDPOINTS.FAVORITES.LIST, { params });

        return response.data.data;
    }

    async checkFavorite(entityType: FavoriteEntityType, entityId: string): Promise<boolean> {
        const response = await apiClient.get<{
            success: boolean;
            message: string;
            data: CheckResponse;
        }>(API_ENDPOINTS.FAVORITES.CHECK, {
            params: { entityType, entityId },
        });

        return response.data.data.isFavorited;
    }

    async batchCheckFavorites(entityType: FavoriteEntityType, entityIds: string[]): Promise<string[]> {
        const response = await apiClient.post<{
            success: boolean;
            message: string;
            data: BatchCheckResponse;
        }>(API_ENDPOINTS.FAVORITES.BATCH_CHECK, { entityType, entityIds });

        return response.data.data.favoritedIds;
    }
}

export const favoriteService = new FavoriteService();
