import { z } from "zod";
import { env } from "../../config/env.js";

// Base entity types for standard media uploads
export const baseEntityTypeSchema = z.enum([
  "tour",
  "company",
  "guide",
  "driver",
  "user",
]);

// All entity types (includes avatar variants for separate storage)
export const entityTypeSchema = z.enum([
  "tour",
  "company",
  "guide",
  "driver",
  "user",
  "driver-avatar",
  "guide-avatar",
]);

// Upload schema for generic multi-upload endpoint (base types only)
export const uploadMediaSchema = z.object({
  entityType: baseEntityTypeSchema,
  entityId: z.string().uuid("Invalid entity ID"),
});

// Upload schema with all entity types (for specialized endpoints)
export const uploadMediaAllTypesSchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.string().uuid("Invalid entity ID"),
});

// Get media query schema
export const getMediaQuerySchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.string().uuid("Invalid entity ID"),
});

// Delete media params schema
export const deleteMediaParamsSchema = z.object({
  id: z.string().uuid("Invalid media ID"),
});

// File validation constants (from environment)
export const FILE_VALIDATION = {
  MAX_SIZE: env.MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES: env.ALLOWED_FILE_TYPES,
  ALLOWED_EXTENSIONS: ["jpg", "jpeg", "png", "webp", "gif"],
} as const;

export type UploadMediaInput = z.infer<typeof uploadMediaSchema>;
export type GetMediaQuery = z.infer<typeof getMediaQuerySchema>;
export type DeleteMediaParams = z.infer<typeof deleteMediaParamsSchema>;
