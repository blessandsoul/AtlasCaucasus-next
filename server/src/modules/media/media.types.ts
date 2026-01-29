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
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Entity types that can have media
export type MediaEntityType = "tour" | "company" | "guide" | "driver" | "user";

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
