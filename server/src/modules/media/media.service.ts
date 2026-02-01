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
  verifyMediaEntityOwnership,
  type MediaEntityType as AuthMediaEntityType,
} from "../../libs/authorization.js";
import {
  sanitizeFilename,
  generateUniqueFilename,
  generateSeoFriendlyFilename,
  validateFileType,
  validateFileTypeFromBuffer,
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
  // Quick validation of Content-Type header (can be spoofed, but fast rejection)
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

  // SECURITY: Validate actual file content by reading magic bytes
  // This prevents MIME type spoofing attacks (e.g., uploading .php disguised as .jpg)
  const magicByteValidation = await validateFileTypeFromBuffer(
    file.buffer,
    FILE_VALIDATION.ALLOWED_MIME_TYPES
  );

  if (!magicByteValidation.valid) {
    throw new ValidationError(
      magicByteValidation.error ||
        `Invalid file content. Detected type: ${magicByteValidation.detectedType || "unknown"}`
    );
  }

  // Use the detected MIME type from magic bytes (more reliable than header)
  const actualMimeType = magicByteValidation.detectedType || file.mimetype;

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

  // Create media record in database (use actual MIME type from magic bytes)
  const mediaData: CreateMediaData = {
    filename: uniqueFilename,
    originalName: file.originalFilename,
    mimeType: actualMimeType,
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

// Delete media (only entity owner or admin)
export async function deleteMediaById(
  currentUser: JwtUser,
  mediaId: string
): Promise<SafeMedia> {
  const media = await getMediaById(mediaId);

  if (!media) {
    throw new NotFoundError("Media not found", "MEDIA_NOT_FOUND");
  }

  // SECURITY FIX: Check ENTITY ownership, not just who uploaded the media
  // This ensures that if a tour/company/etc is transferred to a new owner,
  // the new owner can manage media and the old owner cannot
  const canDelete = await verifyMediaEntityOwnership(
    media.entityType as AuthMediaEntityType,
    media.entityId,
    currentUser.id,
    currentUser.roles
  );

  if (!canDelete) {
    throw new ForbiddenError(
      "You can only delete media for your own entities",
      "NOT_ENTITY_OWNER"
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
