import type { JwtUser } from "../auth/auth.types.js";
import type { SafeMedia, CreateMediaData, MediaEntityType, UploadedFile } from "./media.types.js";
import {
  createMedia,
  getMediaById,
  getMediaByEntity,
  deleteMedia,
  deleteMediaByEntity,
} from "./media.repo.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../../libs/errors.js";
import {
  sanitizeFilename,
  generateUniqueFilename,
  generateSeoFriendlyFilename,
  validateFileType,
  validateFileSize,
  saveFile,
  deleteFile,
} from "../../libs/file-upload.js";
import { FILE_VALIDATION } from "./media.schemas.js";

// Upload file and create media record
export async function uploadMediaForEntity(
  currentUser: JwtUser,
  entityType: MediaEntityType,
  entityId: string,
  file: UploadedFile,
  entitySlug?: string // Optional: SEO-friendly slug of entity
): Promise<SafeMedia> {
  // Validate file type
  if (!validateFileType(file.mimetype, FILE_VALIDATION.ALLOWED_MIME_TYPES)) {
    throw new ValidationError(
      `Invalid file type. Allowed types: ${FILE_VALIDATION.ALLOWED_MIME_TYPES.join(", ")}`
    );
  }

  // Validate file size
  if (!validateFileSize(file.size, FILE_VALIDATION.MAX_SIZE)) {
    throw new ValidationError(
      `File too large. Maximum size: ${FILE_VALIDATION.MAX_SIZE / (1024 * 1024)}MB`
    );
  }

  // Generate filename
  const sanitizedName = sanitizeFilename(file.originalFilename);

  let uniqueFilename: string;
  if (entitySlug) {
    // Use SEO-friendly filename with entity context
    uniqueFilename = generateSeoFriendlyFilename(sanitizedName, entityType, entitySlug);
  } else {
    // Fallback to UUID-only filename (backward compatibility)
    uniqueFilename = generateUniqueFilename(sanitizedName);
  }

  // Save file to disk
  const filePath = await saveFile(file.buffer, entityType, uniqueFilename);

  // Create media record in database
  const mediaData: CreateMediaData = {
    filename: uniqueFilename,
    originalName: file.originalFilename,
    mimeType: file.mimetype,
    size: file.size,
    url: filePath,
    entityType,
    entityId,
    uploadedBy: currentUser.id,
  };

  return createMedia(mediaData);
}

// Get media for an entity (public)
export async function getMediaForEntity(
  entityType: MediaEntityType,
  entityId: string
): Promise<SafeMedia[]> {
  return getMediaByEntity(entityType, entityId);
}

// Delete media (only owner or admin)
export async function deleteMediaById(
  currentUser: JwtUser,
  mediaId: string
): Promise<SafeMedia> {
  const media = await getMediaById(mediaId);

  if (!media) {
    throw new NotFoundError("Media not found", "MEDIA_NOT_FOUND");
  }

  // Check ownership
  const isOwner = media.uploadedBy === currentUser.id;
  const isAdmin = currentUser.roles.includes("ADMIN");

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError(
      "You can only delete your own media",
      "NOT_MEDIA_OWNER"
    );
  }

  // Delete file from disk
  await deleteFile(media.url);

  // Delete from database
  const deleted = await deleteMedia(mediaId);

  if (!deleted) {
    throw new NotFoundError("Media not found", "MEDIA_NOT_FOUND");
  }

  return deleted;
}

// Delete all media for an entity (used when entity is deleted)
export async function deleteAllMediaForEntity(
  entityType: MediaEntityType,
  entityId: string
): Promise<void> {
  // Get all media records
  const mediaList = await getMediaByEntity(entityType, entityId);

  // Delete files from disk
  for (const media of mediaList) {
    await deleteFile(media.url);
  }

  // Delete from database
  await deleteMediaByEntity(entityType, entityId);
}
