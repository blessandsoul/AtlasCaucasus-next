import type { JwtUser } from "../auth/auth.types.js";
import type { MediaEntityType } from "./media.types.js";
import { getTourById } from "../tours/tour.repo.js";
import { findById as getCompanyById } from "../companies/company.repo.js";
import { findById as getGuideById } from "../guides/guide.repo.js";
import { findById as getDriverById } from "../drivers/driver.repo.js";
import { NotFoundError, ForbiddenError } from "../../libs/errors.js";

/**
 * Verify that the current user has permission to upload media for the specified entity.
 * Throws ForbiddenError if not authorized, NotFoundError if entity doesn't exist.
 *
 * @param currentUser - The authenticated user
 * @param entityType - Type of entity (tour, company, guide, driver, user)
 * @param entityId - ID of the entity
 */
export async function verifyEntityOwnership(
  currentUser: JwtUser,
  entityType: MediaEntityType,
  entityId: string
): Promise<void> {
  const isAdmin = currentUser.roles.includes("ADMIN");

  switch (entityType) {
    case "tour": {
      const tour = await getTourById(entityId);
      if (!tour) {
        throw new NotFoundError("Tour not found", "TOUR_NOT_FOUND");
      }
      if (tour.ownerId !== currentUser.id && !isAdmin) {
        throw new ForbiddenError(
          "You can only upload media for your own tours",
          "NOT_TOUR_OWNER"
        );
      }
      break;
    }

    case "company": {
      const company = await getCompanyById(entityId);
      if (!company) {
        throw new NotFoundError("Company not found", "COMPANY_NOT_FOUND");
      }
      if ((company as any).userId !== currentUser.id && !isAdmin) {
        throw new ForbiddenError(
          "You can only upload media for your own company",
          "NOT_COMPANY_OWNER"
        );
      }
      break;
    }

    case "guide": {
      const guide = await getGuideById(entityId);
      if (!guide) {
        throw new NotFoundError("Guide profile not found", "GUIDE_NOT_FOUND");
      }
      if ((guide as any).userId !== currentUser.id && !isAdmin) {
        throw new ForbiddenError(
          "You can only upload media for your own guide profile",
          "NOT_GUIDE_OWNER"
        );
      }
      break;
    }

    case "driver": {
      const driver = await getDriverById(entityId);
      if (!driver) {
        throw new NotFoundError("Driver profile not found", "DRIVER_NOT_FOUND");
      }
      if ((driver as any).userId !== currentUser.id && !isAdmin) {
        throw new ForbiddenError(
          "You can only upload media for your own driver profile",
          "NOT_DRIVER_OWNER"
        );
      }
      break;
    }

    case "user": {
      if (entityId !== currentUser.id && !isAdmin) {
        throw new ForbiddenError(
          "You can only upload your own avatar",
          "NOT_USER_OWNER"
        );
      }
      break;
    }

    default:
      throw new ForbiddenError(
        "Invalid entity type for media upload",
        "INVALID_ENTITY_TYPE"
      );
  }
}
