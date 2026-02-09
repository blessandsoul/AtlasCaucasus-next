import { prisma } from "../../libs/prisma.js";
import type { CreateFavoriteData, FavoriteFilters, FavoriteEntityType } from "./favorite.types.js";

export class FavoriteRepository {
    /**
     * Add a favorite
     */
    async create(data: CreateFavoriteData) {
        return prisma.favorite.create({
            data: {
                userId: data.userId,
                entityType: data.entityType,
                entityId: data.entityId,
            },
        });
    }

    /**
     * Remove a favorite by userId + entityType + entityId
     */
    async remove(userId: string, entityType: string, entityId: string) {
        return prisma.favorite.delete({
            where: {
                userId_entityType_entityId: {
                    userId,
                    entityType,
                    entityId,
                },
            },
        });
    }

    /**
     * Check if a specific entity is favorited by a user
     */
    async exists(userId: string, entityType: string, entityId: string): Promise<boolean> {
        const favorite = await prisma.favorite.findUnique({
            where: {
                userId_entityType_entityId: {
                    userId,
                    entityType,
                    entityId,
                },
            },
            select: { id: true },
        });
        return favorite !== null;
    }

    /**
     * Batch check which entity IDs are favorited by a user
     */
    async batchCheck(userId: string, entityType: string, entityIds: string[]): Promise<string[]> {
        const favorites = await prisma.favorite.findMany({
            where: {
                userId,
                entityType,
                entityId: { in: entityIds },
            },
            select: { entityId: true },
        });
        return favorites.map((f) => f.entityId);
    }

    /**
     * Get user's favorites with pagination
     */
    async findByUser(
        userId: string,
        page: number,
        limit: number,
        filters: FavoriteFilters
    ) {
        const skip = (page - 1) * limit;
        const whereClause: {
            userId: string;
            entityType?: FavoriteEntityType;
        } = { userId };

        if (filters.entityType) {
            whereClause.entityType = filters.entityType;
        }

        const [favorites, total] = await Promise.all([
            prisma.favorite.findMany({
                where: whereClause,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.favorite.count({ where: whereClause }),
        ]);

        return { favorites, total };
    }
}

export const favoriteRepo = new FavoriteRepository();
