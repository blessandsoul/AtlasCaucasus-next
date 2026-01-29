import type { JwtUser } from "../auth/auth.types.js";
import type { SafeMedia, UploadedFile } from "./media.types.js";
import {
  uploadMediaForEntity,
  getMediaForEntity,
  deleteMediaById,
  deleteAllMediaForEntity,
} from "./media.service.js";
import { slugify } from "../../libs/file-upload.js";

// ==========================================
// TOUR MEDIA HELPERS
// ==========================================

/**
 * Upload image for a tour
 * @param currentUser - Authenticated user
 * @param tourId - Tour ID
 * @param file - Uploaded file
 * @returns Created media record
 */
import { getTourById } from "../tours/tour.repo.js";
import { findById as getCompanyById } from "../companies/company.repo.js";
import { findById as getGuideById } from "../guides/guide.repo.js";
import { findById as getDriverById } from "../drivers/driver.repo.js";
import { NotFoundError, ForbiddenError } from "../../libs/errors.js";

/**
 * Generate SEO-friendly entity slug from title/name
 * @param text - Entity title or name
 * @param entityType - Type of entity
 * @returns SEO-optimized slug
 */
function generateEntitySlug(text: string, entityType: string): string {
  const slug = slugify(text, 40);
  return `${slug}-${entityType}`;
}

/**
 * Upload image for a tour
 * @param currentUser - Authenticated user
 * @param tourId - Tour ID
 * @param file - Uploaded file
 * @returns Created media record
 */
export async function uploadTourImage(
  currentUser: JwtUser,
  tourId: string,
  file: UploadedFile
): Promise<SafeMedia> {
  const tour = await getTourById(tourId);
  if (!tour) {
    throw new NotFoundError("Tour not found", "TOUR_NOT_FOUND");
  }

  // Check ownership
  if (tour.ownerId !== currentUser.id && !currentUser.roles.includes("ADMIN")) {
    throw new ForbiddenError("You can only upload images for your own tours", "NOT_TOUR_OWNER");
  }

  // Generate SEO-friendly slug from tour title
  const entitySlug = generateEntitySlug(tour.title, "tour");

  return uploadMediaForEntity(currentUser, "tour", tourId, file, entitySlug);
}

/**
 * Get all images for a tour
 * @param tourId - Tour ID
 * @returns Array of media records
 */
export async function getTourImages(tourId: string): Promise<SafeMedia[]> {
  return getMediaForEntity("tour", tourId);
}

/**
 * Delete all images for a tour
 * @param tourId - Tour ID
 */
export async function deleteTourImages(tourId: string): Promise<void> {
  return deleteAllMediaForEntity("tour", tourId);
}

// ==========================================
// COMPANY MEDIA HELPERS
// ==========================================

/**
 * Upload logo for a company
 * @param currentUser - Authenticated user
 * @param companyId - Company ID
 * @param file - Uploaded file
 * @returns Created media record
 */
export async function uploadCompanyLogo(
  currentUser: JwtUser,
  companyId: string,
  file: UploadedFile
): Promise<SafeMedia> {
  const company = await getCompanyById(companyId);
  if (!company) {
    throw new NotFoundError("Company not found", "COMPANY_NOT_FOUND");
  }

  // Check ownership (assuming company has userId)
  // Casting to any because CompanyResponse type might be loose, but database schema has userId
  if ((company as any).userId !== currentUser.id && !currentUser.roles.includes("ADMIN")) {
    throw new ForbiddenError("You can only upload logos for your own company", "NOT_COMPANY_OWNER");
  }

  // Generate SEO-friendly slug from company name
  const entitySlug = generateEntitySlug((company as any).companyName || "company", "company");

  return uploadMediaForEntity(currentUser, "company", companyId, file, entitySlug);
}

/**
 * Get company logo/images
 * @param companyId - Company ID
 * @returns Array of media records
 */
export async function getCompanyMedia(companyId: string): Promise<SafeMedia[]> {
  return getMediaForEntity("company", companyId);
}

/**
 * Delete all media for a company
 * @param companyId - Company ID
 */
export async function deleteCompanyMedia(companyId: string): Promise<void> {
  return deleteAllMediaForEntity("company", companyId);
}

// ==========================================
// GUIDE MEDIA HELPERS
// ==========================================

/**
 * Upload photo for a guide
 * @param currentUser - Authenticated user
 * @param guideId - Guide ID
 * @param file - Uploaded file
 * @returns Created media record
 */
export async function uploadGuidePhoto(
  currentUser: JwtUser,
  guideId: string,
  file: UploadedFile
): Promise<SafeMedia> {
  const guide = await getGuideById(guideId);
  if (!guide) {
    throw new NotFoundError("Guide profile not found", "GUIDE_NOT_FOUND");
  }

  // Check ownership
  if ((guide as any).userId !== currentUser.id && !currentUser.roles.includes("ADMIN")) {
    throw new ForbiddenError("You can only upload photos for your own guide profile", "NOT_GUIDE_OWNER");
  }

  // Generate SEO-friendly slug from guide name
  const guideName = `guide-${(guide as any).user?.firstName || ""}-${(guide as any).user?.lastName || ""}`.trim();
  const entitySlug = slugify(guideName || "guide", 40);

  return uploadMediaForEntity(currentUser, "guide", guideId, file, entitySlug);
}

/**
 * Get guide photos
 * @param guideId - Guide ID
 * @returns Array of media records
 */
export async function getGuidePhotos(guideId: string): Promise<SafeMedia[]> {
  return getMediaForEntity("guide", guideId);
}

/**
 * Delete all photos for a guide
 * @param guideId - Guide ID
 */
export async function deleteGuidePhotos(guideId: string): Promise<void> {
  return deleteAllMediaForEntity("guide", guideId);
}

// ==========================================
// DRIVER MEDIA HELPERS
// ==========================================

/**
 * Upload photo for a driver
 * @param currentUser - Authenticated user
 * @param driverId - Driver ID
 * @param file - Uploaded file
 * @returns Created media record
 */
export async function uploadDriverPhoto(
  currentUser: JwtUser,
  driverId: string,
  file: UploadedFile
): Promise<SafeMedia> {
  const driver = await getDriverById(driverId);
  if (!driver) {
    throw new NotFoundError("Driver profile not found", "DRIVER_NOT_FOUND");
  }

  // Check ownership
  if ((driver as any).userId !== currentUser.id && !currentUser.roles.includes("ADMIN")) {
    throw new ForbiddenError("You can only upload photos for your own driver profile", "NOT_DRIVER_OWNER");
  }

  // Generate SEO-friendly slug from driver name
  const driverName = `driver-${(driver as any).user?.firstName || ""}-${(driver as any).user?.lastName || ""}`.trim();
  const entitySlug = slugify(driverName || "driver", 40);

  return uploadMediaForEntity(currentUser, "driver", driverId, file, entitySlug);
}

/**
 * Get driver photos
 * @param driverId - Driver ID
 * @returns Array of media records
 */
export async function getDriverPhotos(driverId: string): Promise<SafeMedia[]> {
  return getMediaForEntity("driver", driverId);
}

/**
 * Delete all photos for a driver
 * @param driverId - Driver ID
 */
export async function deleteDriverPhotos(driverId: string): Promise<void> {
  return deleteAllMediaForEntity("driver", driverId);
}

// ==========================================
// USER MEDIA HELPERS (Avatars)
// ==========================================

/**
 * Upload avatar for a user
 * @param currentUser - Authenticated user
 * @param userId - User ID
 * @param file - Uploaded file
 * @returns Created media record
 */
export async function uploadUserAvatar(
  currentUser: JwtUser,
  userId: string,
  file: UploadedFile
): Promise<SafeMedia> {
  // Check ownership
  if (userId !== currentUser.id && !currentUser.roles.includes("ADMIN")) {
    throw new ForbiddenError("You can only upload your own avatar", "NOT_USER_OWNER");
  }

  // Use generic slug for user avatars (JwtUser doesn't have name fields)
  const entitySlug = "user-avatar";

  return uploadMediaForEntity(currentUser, "user", userId, file, entitySlug);
}

/**
 * Get user avatar
 * @param userId - User ID
 * @returns Array of media records (typically just one avatar)
 */
export async function getUserAvatar(userId: string): Promise<SafeMedia[]> {
  return getMediaForEntity("user", userId);
}

/**
 * Delete user avatar
 * @param userId - User ID
 */
export async function deleteUserAvatar(userId: string): Promise<void> {
  return deleteAllMediaForEntity("user", userId);
}

// ==========================================
// BATCH OPERATIONS
// ==========================================

/**
 * Upload multiple files for an entity
 * @param currentUser - Authenticated user
 * @param entityType - Entity type
 * @param entityId - Entity ID
 * @param files - Array of uploaded files
 * @returns Array of created media records
 */
export async function uploadMultipleFiles(
  currentUser: JwtUser,
  entityType: "tour" | "company" | "guide" | "driver" | "user",
  entityId: string,
  files: UploadedFile[]
): Promise<SafeMedia[]> {

  // Verify ownership before processing any files and generate entity slug
  const isAdmin = currentUser.roles.includes("ADMIN");
  let entitySlug: string;

  switch (entityType) {
    case "tour": {
      const tour = await getTourById(entityId);
      if (!tour) throw new NotFoundError("Tour not found");
      if (tour.ownerId !== currentUser.id && !isAdmin) {
        throw new ForbiddenError("Not authorized to upload to this tour");
      }
      entitySlug = generateEntitySlug(tour.title, "tour");
      break;
    }
    case "company": {
      const company = await getCompanyById(entityId);
      if (!company) throw new NotFoundError("Company not found");
      if ((company as any).userId !== currentUser.id && !isAdmin) {
        throw new ForbiddenError("Not authorized to upload to this company");
      }
      entitySlug = generateEntitySlug((company as any).companyName || "company", "company");
      break;
    }
    case "guide": {
      const guide = await getGuideById(entityId);
      if (!guide) throw new NotFoundError("Guide not found");
      if ((guide as any).userId !== currentUser.id && !isAdmin) {
        throw new ForbiddenError("Not authorized to upload to this guide profile");
      }
      const guideName = `guide-${(guide as any).user?.firstName || ""}-${(guide as any).user?.lastName || ""}`.trim();
      entitySlug = slugify(guideName || "guide", 40);
      break;
    }
    case "driver": {
      const driver = await getDriverById(entityId);
      if (!driver) throw new NotFoundError("Driver not found");
      if ((driver as any).userId !== currentUser.id && !isAdmin) {
        throw new ForbiddenError("Not authorized to upload to this driver profile");
      }
      const driverName = `driver-${(driver as any).user?.firstName || ""}-${(driver as any).user?.lastName || ""}`.trim();
      entitySlug = slugify(driverName || "driver", 40);
      break;
    }
    case "user": {
      if (entityId !== currentUser.id && !isAdmin) {
        throw new ForbiddenError("Not authorized to upload to this user");
      }
      // Use generic slug for user avatars (JwtUser doesn't have name fields)
      entitySlug = "user-avatar";
      break;
    }
  }

  const results: SafeMedia[] = [];

  for (const file of files) {
    const media = await uploadMediaForEntity(currentUser, entityType, entityId, file, entitySlug);
    results.push(media);
  }

  return results;
}

/**
 * Delete specific media by ID
 * @param currentUser - Authenticated user
 * @param mediaId - Media ID
 * @returns Deleted media record
 */
export async function deleteMediaHelper(
  currentUser: JwtUser,
  mediaId: string
): Promise<SafeMedia> {
  return deleteMediaById(currentUser, mediaId);
}
