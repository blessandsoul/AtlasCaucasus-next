import type { FastifyInstance } from "fastify";
import * as locationController from "./location.controller.js";
import { authGuard, requireRole } from "../../middlewares/authGuard.js";

export async function locationRoutes(fastify: FastifyInstance): Promise<void> {
    // Public: List all locations (paginated, filterable)
    fastify.get("/locations", locationController.list);

    // Public: Get location by ID
    fastify.get("/locations/:id", locationController.getById);

    // Admin only: Create location
    fastify.post(
        "/locations",
        { preHandler: [authGuard, requireRole("ADMIN")] },
        locationController.create
    );

    // Admin only: Update location
    fastify.patch(
        "/locations/:id",
        { preHandler: [authGuard, requireRole("ADMIN")] },
        locationController.update
    );

    // Admin only: Delete location (soft delete)
    fastify.delete(
        "/locations/:id",
        { preHandler: [authGuard, requireRole("ADMIN")] },
        locationController.deleteLocation
    );
}
