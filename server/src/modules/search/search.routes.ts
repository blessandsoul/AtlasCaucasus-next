import { FastifyInstance } from "fastify";
import { searchController } from "./search.controller.js";

export async function searchRoutes(app: FastifyInstance) {
    // Main search endpoint (public)
    app.get(
        "/search",
        {
            config: {
                rateLimit: {
                    max: 100,
                    timeWindow: "1 minute",
                },
            },
        },
        searchController.search.bind(searchController)
    );

    // Location autocomplete (public)
    app.get(
        "/search/locations",
        {
            config: {
                rateLimit: {
                    max: 100,
                    timeWindow: "1 minute",
                },
            },
        },
        searchController.searchLocations.bind(searchController)
    );

    // Location stats (public)
    app.get(
        "/search/locations/:id/stats",
        {
            config: {
                rateLimit: {
                    max: 100,
                    timeWindow: "1 minute",
                },
            },
        },
        searchController.getLocationStats.bind(searchController)
    );
}
