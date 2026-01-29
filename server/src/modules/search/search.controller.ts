import { FastifyRequest, FastifyReply } from "fastify";
import { searchService } from "./search.service.js";
import { successResponse } from "../../libs/response.js";
import { SearchQuerySchema, LocationSearchSchema } from "./search.schemas.js";

export class SearchController {
    /**
     * GET /api/v1/search
     * Main search endpoint - aggregates tours, guides, drivers, companies
     */
    async search(request: FastifyRequest, reply: FastifyReply) {
        const query = SearchQuerySchema.parse(request.query);

        const results = await searchService.search(
            {
                locationId: query.locationId,
                category: query.category,
                query: query.query,
                minPrice: query.minPrice,
                maxPrice: query.maxPrice,
                minRating: query.minRating,
                verified: query.verified,
                available: query.available,
                sortBy: query.sortBy,
            },
            query.page,
            query.limit
        );

        return reply.send(successResponse("Search results retrieved successfully", results));
    }

    /**
     * GET /api/v1/search/locations
     * Location autocomplete for search input
     */
    async searchLocations(request: FastifyRequest, reply: FastifyReply) {
        const query = LocationSearchSchema.parse(request.query);

        const locations = await searchService.searchLocations(
            query.query,
            query.limit
        );

        return reply.send(successResponse("Locations retrieved successfully", locations));
    }

    /**
     * GET /api/v1/search/locations/:id/stats
     * Get aggregated counts for a location
     */
    async getLocationStats(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        const { id } = request.params;

        const stats = await searchService.getLocationStats(id);

        return reply.send(successResponse("Location stats retrieved successfully", stats));
    }
}

export const searchController = new SearchController();
