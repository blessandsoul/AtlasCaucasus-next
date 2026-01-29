import type { FastifyInstance } from "fastify";
import * as driverController from "./driver.controller.js";
import { authGuard } from "../../middlewares/authGuard.js";
import { requireVerifiedEmail } from "../../middlewares/requireVerifiedEmail.js";

export async function driverRoutes(fastify: FastifyInstance): Promise<void> {
    // Public: List all drivers (paginated, filterable)
    fastify.get("/drivers", driverController.list);

    // Auth required: Get current user's driver profile
    fastify.get(
        "/drivers/my",
        { preHandler: [authGuard] },
        driverController.getMyProfile
    );

    // Public: Get driver by ID
    fastify.get("/drivers/:id", driverController.getById);

    // Auth required: Update driver (ownership checked in service)
    fastify.patch(
        "/drivers/:id",
        { preHandler: [authGuard, requireVerifiedEmail] },
        driverController.update
    );

    // Auth required: Delete driver (ownership checked in service)
    fastify.delete(
        "/drivers/:id",
        { preHandler: [authGuard, requireVerifiedEmail] },
        driverController.deleteDriver
    );

    // ==========================================
    // PHOTO MANAGEMENT
    // ==========================================

    // Public: Get all photos for a driver
    fastify.get("/drivers/:id/photos", driverController.getPhotos);

    // Auth required: Upload photos for driver (ownership checked in helper)
    fastify.post(
        "/drivers/:id/photos",
        { preHandler: [authGuard, requireVerifiedEmail] },
        driverController.uploadPhotos
    );

    // Auth required: Delete a specific photo (ownership checked in helper)
    fastify.delete(
        "/drivers/:id/photos/:photoId",
        { preHandler: [authGuard, requireVerifiedEmail] },
        driverController.deletePhoto
    );
}
