import type { FastifyInstance } from "fastify";
import { authGuard } from "../../middlewares/authGuard.js";
import {
  uploadMediaHandler,
  getMediaHandler,
  deleteMediaHandler,
  uploadMultipleMediaHandler,
  uploadTourImageHandler,
  uploadGuidePhotoHandler,
  uploadDriverPhotoHandler,
  uploadUserAvatarHandler,
  uploadDriverAvatarHandler,
  uploadGuideAvatarHandler,
  uploadCompanyCoverHandler,
  uploadGuideCoverHandler,
  uploadDriverCoverHandler,
  deleteCompanyCoverHandler,
  deleteGuideCoverHandler,
  deleteDriverCoverHandler,
} from "./media.controller.js";

interface MediaParams {
  entityType: string;
  entityId: string;
}

interface DeleteParams {
  id: string;
}

interface EntityIdParams {
  tourId?: string;
  companyId?: string;
  guideId?: string;
  driverId?: string;
  userId?: string;
}

export async function mediaRoutes(fastify: FastifyInstance): Promise<void> {
  // ==========================================
  // GENERIC MEDIA ENDPOINTS
  // ==========================================

  // Public: get media for an entity
  fastify.get<{ Params: MediaParams }>(
    "/media/:entityType/:entityId",
    getMediaHandler
  );

  // Auth required: upload single media file
  fastify.post<{ Params: MediaParams }>(
    "/media/:entityType/:entityId",
    { preHandler: [authGuard] },
    uploadMediaHandler
  );

  // Auth required: upload multiple media files (batch)
  fastify.post<{ Params: MediaParams }>(
    "/media/:entityType/:entityId/batch",
    { preHandler: [authGuard] },
    uploadMultipleMediaHandler
  );

  // Auth required: delete media (owner or admin)
  fastify.delete<{ Params: DeleteParams }>(
    "/media/:id",
    { preHandler: [authGuard] },
    deleteMediaHandler
  );

  // ==========================================
  // SPECIALIZED ENTITY-SPECIFIC ENDPOINTS
  // ==========================================

  // Tours: Upload tour image
  fastify.post<{ Params: { tourId: string } }>(
    "/tours/:tourId/images",
    { preHandler: [authGuard] },
    uploadTourImageHandler
  );

  // NOTE: Company logo upload is handled in company.routes.ts

  // Guides: Upload guide photo
  fastify.post<{ Params: { guideId: string } }>(
    "/guides/:guideId/photo",
    { preHandler: [authGuard] },
    uploadGuidePhotoHandler
  );

  // Drivers: Upload driver photo
  fastify.post<{ Params: { driverId: string } }>(
    "/drivers/:driverId/photo",
    { preHandler: [authGuard] },
    uploadDriverPhotoHandler
  );

  // Users: Upload user avatar
  fastify.post<{ Params: { userId: string } }>(
    "/users/:userId/avatar",
    { preHandler: [authGuard] },
    uploadUserAvatarHandler
  );

  // Drivers: Upload driver avatar (profile photo - replaces existing)
  fastify.post<{ Params: { driverId: string } }>(
    "/drivers/:driverId/avatar",
    { preHandler: [authGuard] },
    uploadDriverAvatarHandler
  );

  // Guides: Upload guide avatar (profile photo - replaces existing)
  fastify.post<{ Params: { guideId: string } }>(
    "/guides/:guideId/avatar",
    { preHandler: [authGuard] },
    uploadGuideAvatarHandler
  );

  // ==========================================
  // COVER IMAGE ENDPOINTS
  // ==========================================

  // Companies: Upload company cover image (replaces existing)
  fastify.post<{ Params: { companyId: string } }>(
    "/companies/:companyId/cover",
    { preHandler: [authGuard] },
    uploadCompanyCoverHandler
  );

  // Guides: Upload guide cover image (replaces existing)
  fastify.post<{ Params: { guideId: string } }>(
    "/guides/:guideId/cover",
    { preHandler: [authGuard] },
    uploadGuideCoverHandler
  );

  // Drivers: Upload driver cover image (replaces existing)
  fastify.post<{ Params: { driverId: string } }>(
    "/drivers/:driverId/cover",
    { preHandler: [authGuard] },
    uploadDriverCoverHandler
  );

  // Companies: Delete company cover image
  fastify.delete<{ Params: { companyId: string } }>(
    "/companies/:companyId/cover",
    { preHandler: [authGuard] },
    deleteCompanyCoverHandler
  );

  // Guides: Delete guide cover image
  fastify.delete<{ Params: { guideId: string } }>(
    "/guides/:guideId/cover",
    { preHandler: [authGuard] },
    deleteGuideCoverHandler
  );

  // Drivers: Delete driver cover image
  fastify.delete<{ Params: { driverId: string } }>(
    "/drivers/:driverId/cover",
    { preHandler: [authGuard] },
    deleteDriverCoverHandler
  );
}
