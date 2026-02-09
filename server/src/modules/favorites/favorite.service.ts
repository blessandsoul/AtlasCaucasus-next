import { favoriteRepo } from "./favorite.repo.js";
import { ConflictError, NotFoundError } from "../../libs/errors.js";
import { logger } from "../../libs/logger.js";
import type { FavoriteEntityType, FavoriteFilters } from "./favorite.types.js";

export class FavoriteService {
    /**
     * Add a favorite for the user
     */
    async addFavorite(userId: string, entityType: FavoriteEntityType, entityId: string) {
        // Check if already favorited
        const exists = await favoriteRepo.exists(userId, entityType, entityId);
        if (exists) {
            throw new ConflictError("Already in favorites", "ALREADY_FAVORITED");
        }

        const favorite = await favoriteRepo.create({ userId, entityType, entityId });
        logger.info({ userId, entityType, entityId }, "Favorite added");
        return favorite;
    }

    /**
     * Remove a favorite for the user
     */
    async removeFavorite(userId: string, entityType: FavoriteEntityType, entityId: string) {
        const exists = await favoriteRepo.exists(userId, entityType, entityId);
        if (!exists) {
            throw new NotFoundError("Favorite not found", "FAVORITE_NOT_FOUND");
        }

        await favoriteRepo.remove(userId, entityType, entityId);
        logger.info({ userId, entityType, entityId }, "Favorite removed");
    }

    /**
     * Get user's favorites with pagination
     */
    async getUserFavorites(userId: string, page: number, limit: number, filters: FavoriteFilters) {
        const { favorites, total } = await favoriteRepo.findByUser(userId, page, limit, filters);
        return { favorites, total };
    }

    /**
     * Check if a specific entity is favorited
     */
    async checkFavorite(userId: string, entityType: FavoriteEntityType, entityId: string): Promise<boolean> {
        return favoriteRepo.exists(userId, entityType, entityId);
    }

    /**
     * Batch check which entities are favorited
     */
    async batchCheckFavorites(userId: string, entityType: FavoriteEntityType, entityIds: string[]): Promise<string[]> {
        return favoriteRepo.batchCheck(userId, entityType, entityIds);
    }
}

export const favoriteService = new FavoriteService();
