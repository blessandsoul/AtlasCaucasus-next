import type { FastifyInstance } from "fastify";
import { authGuard } from "../../middlewares/authGuard.js";
import { requireVerifiedEmail } from "../../middlewares/requireVerifiedEmail.js";
import {
  uploadMediaHandler,
  getMediaHandler,
  deleteMediaHandler,
  uploadMultipleMediaHandler,
  uploadTourImageHandler,
  uploadCompanyLogoHandler,
  uploadGuidePhotoHandler,
  uploadDriverPhotoHandler,
  uploadUserAvatarHandler,
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
    { preHandler: [authGuard, requireVerifiedEmail] },
    uploadMediaHandler
  );

  // Auth required: upload multiple media files (batch)
  fastify.post<{ Params: MediaParams }>(
    "/media/:entityType/:entityId/batch",
    { preHandler: [authGuard, requireVerifiedEmail] },
    uploadMultipleMediaHandler
  );

  // Auth required: delete media (owner or admin)
  fastify.delete<{ Params: DeleteParams }>(
    "/media/:id",
    { preHandler: [authGuard, requireVerifiedEmail] },
    deleteMediaHandler
  );

  // ==========================================
  // SPECIALIZED ENTITY-SPECIFIC ENDPOINTS
  // ==========================================

  // Tours: Upload tour image
  fastify.post<{ Params: { tourId: string } }>(
    "/tours/:tourId/images",
    { preHandler: [authGuard, requireVerifiedEmail] },
    uploadTourImageHandler
  );

  // Companies: Upload company logo
  fastify.post<{ Params: { companyId: string } }>(
    "/companies/:companyId/logo",
    { preHandler: [authGuard, requireVerifiedEmail] },
    uploadCompanyLogoHandler
  );

  // Guides: Upload guide photo
  fastify.post<{ Params: { guideId: string } }>(
    "/guides/:guideId/photo",
    { preHandler: [authGuard, requireVerifiedEmail] },
    uploadGuidePhotoHandler
  );

  // Drivers: Upload driver photo
  fastify.post<{ Params: { driverId: string } }>(
    "/drivers/:driverId/photo",
    { preHandler: [authGuard, requireVerifiedEmail] },
    uploadDriverPhotoHandler
  );

  // Users: Upload user avatar
  fastify.post<{ Params: { userId: string } }>(
    "/users/:userId/avatar",
    { preHandler: [authGuard, requireVerifiedEmail] },
    uploadUserAvatarHandler
  );
}
