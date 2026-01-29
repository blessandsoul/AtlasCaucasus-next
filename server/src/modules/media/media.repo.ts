import { prisma } from "../../libs/prisma.js";
import type { Media as PrismaMedia } from "@prisma/client";
import type { SafeMedia, CreateMediaData, MediaEntityType } from "./media.types.js";

// Convert Prisma Media to SafeMedia
function toSafeMedia(media: PrismaMedia): SafeMedia {
  return {
    id: media.id,
    filename: media.filename,
    originalName: media.originalName,
    mimeType: media.mimeType,
    size: media.size,
    url: media.url,
    entityType: media.entityType,
    entityId: media.entityId,
    uploadedBy: media.uploadedBy,
    createdAt: media.createdAt,
    updatedAt: media.updatedAt,
  };
}

// Create media record
export async function createMedia(data: CreateMediaData): Promise<SafeMedia> {
  const media = await prisma.media.create({
    data: {
      filename: data.filename,
      originalName: data.originalName,
      mimeType: data.mimeType,
      size: data.size,
      url: data.url,
      entityType: data.entityType,
      entityId: data.entityId,
      uploadedBy: data.uploadedBy,
    },
  });

  return toSafeMedia(media);
}

// Get media by ID
export async function getMediaById(id: string): Promise<SafeMedia | null> {
  const media = await prisma.media.findUnique({
    where: { id },
  });

  return media ? toSafeMedia(media) : null;
}

// Get all media for an entity
export async function getMediaByEntity(
  entityType: MediaEntityType,
  entityId: string
): Promise<SafeMedia[]> {
  const media = await prisma.media.findMany({
    where: {
      entityType,
      entityId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return media.map(toSafeMedia);
}

// Delete media by ID
export async function deleteMedia(id: string): Promise<SafeMedia | null> {
  try {
    const media = await prisma.media.delete({
      where: { id },
    });

    return toSafeMedia(media);
  } catch (err: unknown) {
    // If not found, Prisma throws P2025
    if ((err as { code?: string }).code === "P2025") {
      return null;
    }
    throw err;
  }
}

// Delete all media for an entity (used when entity is deleted)
export async function deleteMediaByEntity(
  entityType: MediaEntityType,
  entityId: string
): Promise<number> {
  const result = await prisma.media.deleteMany({
    where: {
      entityType,
      entityId,
    },
  });

  return result.count;
}

// Get media uploaded by a specific user
export async function getMediaByUploader(userId: string): Promise<SafeMedia[]> {
  const media = await prisma.media.findMany({
    where: {
      uploadedBy: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return media.map(toSafeMedia);
}

// Batch fetch media for multiple entities (solves N+1 query problem)
export async function getMediaByEntityIds(
  entityType: MediaEntityType,
  entityIds: string[]
): Promise<Map<string, SafeMedia[]>> {
  if (entityIds.length === 0) {
    return new Map();
  }

  const media = await prisma.media.findMany({
    where: {
      entityType,
      entityId: { in: entityIds },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Group media by entityId
  const mediaMap = new Map<string, SafeMedia[]>();

  // Initialize all entity IDs with empty arrays
  for (const id of entityIds) {
    mediaMap.set(id, []);
  }

  // Populate with actual media
  for (const item of media) {
    const safeMedia = toSafeMedia(item);
    const existing = mediaMap.get(item.entityId) || [];
    existing.push(safeMedia);
    mediaMap.set(item.entityId, existing);
  }

  return mediaMap;
}
