import type { Media as PrismaMedia } from "@prisma/client";

// Safe media type (what we return to clients)
export interface SafeMedia {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  entityType: string;
  entityId: string;
  uploadedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Base entity types for standard media uploads (tours, profiles, etc.)
export type BaseMediaEntityType = "tour" | "company" | "guide" | "driver" | "user";

// All entity types including avatar and cover variants (for separate storage)
export type MediaEntityType = BaseMediaEntityType
  | "guide-avatar" | "driver-avatar"
  | "company-cover" | "guide-cover" | "driver-cover";

// Upload data (what we need to create a media record)
export interface CreateMediaData {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  entityType: MediaEntityType;
  entityId: string;
  uploadedBy: string;
}

// File upload result
export interface UploadedFile {
  fieldname: string;
  filename: string;
  originalFilename: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
