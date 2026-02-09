import { FastifyRequest, FastifyReply } from "fastify";
import { favoriteService } from "./favorite.service.js";
import { successResponse, paginatedResponse } from "../../libs/response.js";
import {
    AddFavoriteSchema,
    RemoveFavoriteParamsSchema,
    FavoriteQuerySchema,
    CheckFavoriteQuerySchema,
    BatchCheckFavoriteSchema,
} from "./favorite.schemas.js";

export class FavoriteController {
    /**
     * POST /api/v1/favorites
     * Add a favorite
     */
    async addFavorite(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const body = AddFavoriteSchema.parse(request.body);

        const favorite = await favoriteService.addFavorite(userId, body.entityType, body.entityId);

        return reply.status(201).send(successResponse("Added to favorites", favorite));
    }

    /**
     * DELETE /api/v1/favorites/:entityType/:entityId
     * Remove a favorite
     */
    async removeFavorite(
        request: FastifyRequest<{ Params: { entityType: string; entityId: string } }>,
        reply: FastifyReply
    ) {
        const userId = request.user.id;
        const params = RemoveFavoriteParamsSchema.parse(request.params);

        await favoriteService.removeFavorite(userId, params.entityType, params.entityId);

        return reply.send(successResponse("Removed from favorites", null));
    }

    /**
     * GET /api/v1/favorites
     * List user's favorites
     */
    async getFavorites(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const query = FavoriteQuerySchema.parse(request.query);

        const { favorites, total } = await favoriteService.getUserFavorites(
            userId,
            query.page,
            query.limit,
            { entityType: query.entityType }
        );

        return reply.send(
            paginatedResponse("Favorites retrieved successfully", favorites, query.page, query.limit, total)
        );
    }

    /**
     * GET /api/v1/favorites/check
     * Check if a specific entity is favorited
     */
    async checkFavorite(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const query = CheckFavoriteQuerySchema.parse(request.query);

        const isFavorited = await favoriteService.checkFavorite(userId, query.entityType, query.entityId);

        return reply.send(successResponse("Favorite check completed", { isFavorited }));
    }

    /**
     * POST /api/v1/favorites/check-batch
     * Batch check multiple entities
     */
    async batchCheckFavorites(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;
        const body = BatchCheckFavoriteSchema.parse(request.body);

        const favoritedIds = await favoriteService.batchCheckFavorites(userId, body.entityType, body.entityIds);

        return reply.send(successResponse("Batch check completed", { favoritedIds }));
    }
}

export const favoriteController = new FavoriteController();
