import { promises as fs, constants as fsConstants } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileTypeFromBuffer } from "file-type";
import { env } from "../config/env.js";
import type { MediaEntityType } from "../modules/media/media.types.js";
import { logger } from "./logger.js";
import { InternalError } from "./errors.js";

// Base upload directory (from environment or default)
const UPLOAD_BASE_DIR = path.join(process.cwd(), env.UPLOAD_DIR);

// ==========================================
// FILENAME UTILITIES
// ==========================================

/**
 * Sanitize filename to prevent directory traversal and remove dangerous characters
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and null bytes
  let sanitized = filename.replace(/[\/\\:\0]/g, "");

  // Remove leading dots (hidden files)
  sanitized = sanitized.replace(/^\.+/, "");

  // Replace spaces and special characters with underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Limit length to 200 characters
  if (sanitized.length > 200) {
    const ext = path.extname(sanitized);
    const name = sanitized.slice(0, 200 - ext.length);
    sanitized = name + ext;
  }

  // SECURITY: Prevent double extensions (e.g., "malicious.php.jpg" -> "malicious_php.jpg")
  // This prevents attackers from hiding executable extensions
  const parts = sanitized.split(".");
  if (parts.length > 2) {
    sanitized = parts.slice(0, -1).join("_") + "." + parts[parts.length - 1];
  }

  // Ensure filename is not empty
  if (!sanitized || sanitized === ".") {
    sanitized = "file";
  }

  return sanitized;
}

/**
 * Generate unique filename using UUID prefix
 * @param originalFilename - Sanitized original filename
 * @returns Unique filename (e.g., "abc123-mountain.jpg")
 */
export function generateUniqueFilename(originalFilename: string): string {
  const uuid = uuidv4().split("-")[0]; // Use first segment of UUID (8 chars)
  const ext = path.extname(originalFilename);
  const nameWithoutExt = path.basename(originalFilename, ext);

  // Format: {uuid}-{name}.{ext}
  return `${uuid}-${nameWithoutExt}${ext}`;
}

/**
 * Slugify text for SEO-friendly URLs (lowercase, hyphens, remove special chars)
 * @param text - Text to slugify
 * @param maxLength - Maximum length of slug (default: 50)
 * @returns Slugified text
 */
export function slugify(text: string, maxLength: number = 50): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, "")     // Remove leading/trailing hyphens
    .replace(/-{2,}/g, "-")      // Replace multiple hyphens with single
    .slice(0, maxLength);        // Limit length
}

/**
 * Check if filename is descriptive (not camera auto-generated)
 * @param name - Filename without extension
 * @returns True if descriptive, false if generic
 */
function isDescriptiveFilename(name: string): boolean {
  // Camera patterns: DSC_0123, IMG_5678, P1234567, etc.
  const cameraPatterns = /^(dsc|img|p|photo|image|pic)[-_]?\d+$/i;

  // Generic patterns: image1, photo, untitled, etc.
  const genericPatterns = /^(image|photo|picture|img|pic|untitled|new|file)[-_]?\d*$/i;

  // If name matches camera/generic pattern, it's NOT descriptive
  if (cameraPatterns.test(name) || genericPatterns.test(name)) {
    return false;
  }

  // If name has at least 3 chars and looks meaningful, it's descriptive
  return name.length >= 3;
}

/**
 * Get default descriptive name for entity type
 * @param entityType - Type of entity
 * @returns Default descriptive name
 */
function getDefaultNameForEntity(entityType: MediaEntityType): string {
  const defaults: Record<MediaEntityType, string> = {
    tour: "tour-image",
    company: "company-logo",
    guide: "guide-photo",
    driver: "driver-photo",
    user: "user-avatar",
    "guide-avatar": "guide-avatar",
    "driver-avatar": "driver-avatar",
    blog: "blog-cover",
    "company-cover": "company-cover",
    "guide-cover": "guide-cover",
    "driver-cover": "driver-cover",
  };
  return defaults[entityType] || "image";
}

/**
 * Generate SEO-friendly filename with entity context
 * @param originalFilename - Original uploaded filename
 * @param entityType - Type of entity (tour, company, guide, driver, user)
 * @param entitySlug - URL-friendly slug of entity (e.g., "kazbegi-tour", "mountain-adventures")
 * @returns SEO-optimized unique filename
 */
export function generateSeoFriendlyFilename(
  originalFilename: string,
  entityType: MediaEntityType,
  entitySlug: string
): string {
  const uuid = uuidv4().split("-")[0]; // 8 chars for uniqueness
  const ext = path.extname(originalFilename).toLowerCase();
  let nameWithoutExt = path.basename(originalFilename, ext);

  // Slugify original filename
  nameWithoutExt = slugify(nameWithoutExt, 40);

  // If original name is not descriptive (e.g., "DSC_0123"), use generic name
  if (!isDescriptiveFilename(nameWithoutExt)) {
    nameWithoutExt = getDefaultNameForEntity(entityType);
  }

  // Format: {entity-slug}-{uuid}-{descriptive-name}.{ext}
  return `${entitySlug}-${uuid}-${nameWithoutExt}${ext}`;
}

// ==========================================
// FILE VALIDATION
// ==========================================

/**
 * Validate file MIME type from Content-Type header (basic check, can be spoofed)
 * @param mimeType - File MIME type from header
 * @param allowedTypes - Array of allowed MIME types
 * @returns True if valid, false otherwise
 * @deprecated Use validateFileTypeFromBuffer for secure validation
 */
export function validateFileType(mimeType: string, allowedTypes: readonly string[]): boolean {
  return allowedTypes.includes(mimeType);
}

/**
 * Validate file type by reading magic bytes from buffer (secure validation)
 * This prevents MIME type spoofing by checking actual file content
 * @param buffer - File buffer to analyze
 * @param allowedTypes - Array of allowed MIME types
 * @returns Object with validation result and detected MIME type
 */
export async function validateFileTypeFromBuffer(
  buffer: Buffer,
  allowedTypes: readonly string[]
): Promise<{ valid: boolean; detectedType: string | null; error?: string }> {
  try {
    const result = await fileTypeFromBuffer(buffer);

    if (!result) {
      return {
        valid: false,
        detectedType: null,
        error: "Could not determine file type from content",
      };
    }

    const isValid = allowedTypes.includes(result.mime);

    if (!isValid) {
      return {
        valid: false,
        detectedType: result.mime,
        error: `File type ${result.mime} is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
      };
    }

    return {
      valid: true,
      detectedType: result.mime,
    };
  } catch (err) {
    logger.error({ err }, "Error validating file type from buffer");
    return {
      valid: false,
      detectedType: null,
      error: "Error analyzing file content",
    };
  }
}

/**
 * Common allowed image MIME types for uploads
 */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

/**
 * Validate that buffer contains a valid image by checking magic bytes
 * Convenience wrapper around validateFileTypeFromBuffer for images
 * @param buffer - File buffer to analyze
 * @returns Object with validation result
 */
export async function validateImageBuffer(
  buffer: Buffer
): Promise<{ valid: boolean; detectedType: string | null; error?: string }> {
  return validateFileTypeFromBuffer(buffer, ALLOWED_IMAGE_TYPES);
}

/**
 * Validate file size
 * @param size - File size in bytes
 * @param maxSize - Maximum allowed size in bytes
 * @returns True if valid, false otherwise
 */
export function validateFileSize(size: number, maxSize: number): boolean {
  return size > 0 && size <= maxSize;
}

/**
 * Validate file extension
 * @param filename - Filename with extension
 * @param allowedExtensions - Array of allowed extensions (without dots)
 * @returns True if valid, false otherwise
 */
export function validateFileExtension(
  filename: string,
  allowedExtensions: readonly string[]
): boolean {
  const ext = path.extname(filename).toLowerCase().slice(1); // Remove leading dot
  return allowedExtensions.includes(ext);
}

// ==========================================
// FILE OPERATIONS
// ==========================================

/**
 * Get directory path for entity type
 * @param entityType - Type of entity (tour, company, guide, driver, user)
 * @returns Full directory path
 */
function getEntityDirectory(entityType: MediaEntityType): string {
  return path.join(UPLOAD_BASE_DIR, entityType + "s"); // e.g., "tours", "companies"
}

/**
 * Ensure directory exists and is writable, create if not
 * @param dirPath - Directory path
 */
async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath, fsConstants.W_OK);
  } catch (err: unknown) {
    const fsError = err as NodeJS.ErrnoException;
    if (fsError.code === "ENOENT") {
      // Directory doesn't exist — create it
      await fs.mkdir(dirPath, { recursive: true });
    } else if (fsError.code === "EACCES") {
      // Directory exists but is not writable
      logger.error({ dirPath }, "Upload directory is not writable");
      throw new InternalError(
        "File upload failed: storage directory is not writable. Check Docker volume permissions."
      );
    } else {
      throw fsError;
    }
  }
}

/**
 * Save file to disk
 * @param buffer - File buffer
 * @param entityType - Entity type for directory
 * @param filename - Unique filename
 * @returns Public URL path (e.g., "/uploads/tours/abc123-mountain.jpg")
 */
export async function saveFile(
  buffer: Buffer,
  entityType: MediaEntityType,
  filename: string
): Promise<string> {
  // Get directory path
  const dirPath = getEntityDirectory(entityType);

  // Ensure directory exists and is writable
  await ensureDirectory(dirPath);

  // Full file path
  const filePath = path.join(dirPath, filename);

  // Write file to disk
  try {
    await fs.writeFile(filePath, buffer);
  } catch (err: unknown) {
    const fsError = err as NodeJS.ErrnoException;
    logger.error(
      { err: fsError, filePath, entityType, code: fsError.code },
      "Failed to save uploaded file"
    );

    if (fsError.code === "EACCES") {
      throw new InternalError(
        "File upload failed: permission denied. Check server file permissions."
      );
    }
    if (fsError.code === "ENOSPC") {
      throw new InternalError(
        "File upload failed: disk full. Please contact the administrator."
      );
    }
    throw new InternalError("File upload failed due to a server storage error.");
  }

  // Return public URL path (using environment variable)
  return `${env.STATIC_URL_PREFIX}/${entityType}s/${filename}`;
}

/**
 * Delete file from disk
 * @param urlPath - Public URL path (e.g., "/uploads/tours/abc123-mountain.jpg")
 */
export async function deleteFile(urlPath: string): Promise<void> {
  try {
    // Convert URL path to file system path
    // Remove URL prefix and replace with base directory
    const urlPrefix = env.STATIC_URL_PREFIX.replace(/^\//, ""); // Remove leading slash
    const relativePath = urlPath.replace(new RegExp(`^/${urlPrefix}/`), "");
    const filePath = path.join(UPLOAD_BASE_DIR, relativePath);

    // Check if file exists
    await fs.access(filePath);

    // Delete file
    await fs.unlink(filePath);
  } catch (err) {
    // Silently fail if file doesn't exist (already deleted or never existed)
    logger.warn({ urlPath, error: err }, "Failed to delete file");
  }
}

/**
 * Check if file exists
 * @param urlPath - Public URL path
 * @returns True if file exists, false otherwise
 */
export async function fileExists(urlPath: string): Promise<boolean> {
  try {
    const urlPrefix = env.STATIC_URL_PREFIX.replace(/^\//, "");
    const relativePath = urlPath.replace(new RegExp(`^/${urlPrefix}/`), "");
    const filePath = path.join(UPLOAD_BASE_DIR, relativePath);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file size
 * @param urlPath - Public URL path
 * @returns File size in bytes, or null if file doesn't exist
 */
export async function getFileSize(urlPath: string): Promise<number | null> {
  try {
    const urlPrefix = env.STATIC_URL_PREFIX.replace(/^\//, "");
    const relativePath = urlPath.replace(new RegExp(`^/${urlPrefix}/`), "");
    const filePath = path.join(UPLOAD_BASE_DIR, relativePath);
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return null;
  }
}

// ==========================================
// CLEANUP UTILITIES
// ==========================================

/**
 * Delete multiple files
 * @param urlPaths - Array of public URL paths
 */
export async function deleteMultipleFiles(urlPaths: string[]): Promise<void> {
  await Promise.all(urlPaths.map((urlPath) => deleteFile(urlPath)));
}

/**
 * Get all files in an entity directory
 * @param entityType - Entity type
 * @returns Array of filenames
 */
export async function listEntityFiles(entityType: MediaEntityType): Promise<string[]> {
  try {
    const dirPath = getEntityDirectory(entityType);
    const files = await fs.readdir(dirPath);
    // Filter out .gitkeep and other non-image files
    return files.filter((file) => !file.startsWith("."));
  } catch {
    return [];
  }
}
