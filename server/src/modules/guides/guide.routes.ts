import type { FastifyInstance } from "fastify";
import * as guideController from "./guide.controller.js";
import { authGuard } from "../../middlewares/authGuard.js";
import { requireVerifiedEmail } from "../../middlewares/requireVerifiedEmail.js";

export async function guideRoutes(fastify: FastifyInstance): Promise<void> {
    // Public: List all guides (paginated, filterable)
    fastify.get("/guides", guideController.list);

    // Auth required: Get current user's guide profile
    fastify.get(
        "/guides/my",
        { preHandler: [authGuard] },
        guideController.getMyProfile
    );

    // Public: Get guide by ID
    fastify.get("/guides/:id", guideController.getById);

    // Auth required: Update guide (ownership checked in service)
    fastify.patch(
        "/guides/:id",
        { preHandler: [authGuard, requireVerifiedEmail] },
        guideController.update
    );

    // Auth required: Delete guide (ownership checked in service)
    fastify.delete(
        "/guides/:id",
        { preHandler: [authGuard, requireVerifiedEmail] },
        guideController.deleteGuide
    );

    // ==========================================
    // PHOTO MANAGEMENT
    // ==========================================

    // Public: Get all photos for a guide
    fastify.get("/guides/:id/photos", guideController.getPhotos);

    // Auth required: Upload photos for guide (ownership checked in helper)
    fastify.post(
        "/guides/:id/photos",
        { preHandler: [authGuard, requireVerifiedEmail] },
        guideController.uploadPhotos
    );

    // Auth required: Delete a specific photo (ownership checked in helper)
    fastify.delete(
        "/guides/:id/photos/:photoId",
        { preHandler: [authGuard, requireVerifiedEmail] },
        guideController.deletePhoto
    );
}
