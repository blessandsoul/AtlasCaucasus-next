import { prisma } from "../libs/prisma.js";
import { logger } from "../libs/logger.js";
import { deleteFile, listEntityFiles } from "../libs/file-upload.js";
import type { MediaEntityType } from "../modules/media/media.types.js";

/**
 * Background job to clean up orphaned media files
 *
 * This job performs two types of cleanup:
 * 1. Database cleanup: Remove media records where the referenced entity no longer exists
 * 2. File system cleanup: Remove files on disk that don't have corresponding database records
 *
 * Run this job periodically (e.g., daily) via cron or scheduler
 */

interface CleanupStats {
  orphanedRecords: number;
  orphanedFiles: number;
  errors: string[];
}

/**
 * Clean up orphaned media records in database
 * A media record is orphaned if its referenced entity no longer exists
 */
async function cleanupOrphanedRecords(): Promise<number> {
  let deletedCount = 0;

  try {
    // Get all media records
    const allMedia = await prisma.media.findMany({
      select: {
        id: true,
        entityType: true,
        entityId: true,
        url: true,
      },
    });

    logger.info(`[MediaCleanup] Checking ${allMedia.length} media records for orphaned entities`);

    // Check each media record
    for (const media of allMedia) {
      let entityExists = false;

      // Check if entity exists based on type
      switch (media.entityType) {
        case "tour":
          entityExists = !!(await prisma.tour.findUnique({
            where: { id: media.entityId },
            select: { id: true },
          }));
          break;

        case "company":
          entityExists = !!(await prisma.company.findUnique({
            where: { id: media.entityId },
            select: { id: true },
          }));
          break;

        case "guide":
          entityExists = !!(await prisma.guide.findUnique({
            where: { id: media.entityId },
            select: { id: true },
          }));
          break;

        case "driver":
          entityExists = !!(await prisma.driver.findUnique({
            where: { id: media.entityId },
            select: { id: true },
          }));
          break;

        case "user":
          entityExists = !!(await prisma.user.findUnique({
            where: { id: media.entityId },
            select: { id: true },
          }));
          break;

        default:
          logger.warn(`[MediaCleanup] Unknown entity type: ${media.entityType}`);
          continue;
      }

      // If entity doesn't exist, delete media record and file
      if (!entityExists) {
        logger.info(
          `[MediaCleanup] Orphaned media found: ${media.id} (${media.entityType}:${media.entityId})`
        );

        try {
          // Delete file from disk
          await deleteFile(media.url);

          // Delete database record
          await prisma.media.delete({
            where: { id: media.id },
          });

          deletedCount++;
          logger.info(`[MediaCleanup] Deleted orphaned media: ${media.id}`);
        } catch (err) {
          logger.error({ err }, `[MediaCleanup] Failed to delete media ${media.id}:`);
        }
      }
    }
  } catch (err) {
    logger.error({ err }, "[MediaCleanup] Error in cleanupOrphanedRecords:");
    throw err;
  }

  return deletedCount;
}

/**
 * Clean up orphaned files on disk
 * A file is orphaned if it exists on disk but has no corresponding database record
 */
async function cleanupOrphanedFiles(): Promise<number> {
  let deletedCount = 0;
  const entityTypes: MediaEntityType[] = ["tour", "company", "guide", "driver", "user"];

  try {
    for (const entityType of entityTypes) {
      // Get all files on disk for this entity type
      const filesOnDisk = await listEntityFiles(entityType);

      logger.info(`[MediaCleanup] Checking ${filesOnDisk.length} files for ${entityType}s`);

      for (const filename of filesOnDisk) {
        // Check if file has corresponding database record
        const mediaRecord = await prisma.media.findFirst({
          where: {
            filename,
            entityType,
          },
        });

        // If no database record exists, delete the file
        if (!mediaRecord) {
          const url = `/uploads/${entityType}s/${filename}`;

          logger.info(`[MediaCleanup] Orphaned file found: ${url}`);

          try {
            await deleteFile(url);
            deletedCount++;
            logger.info(`[MediaCleanup] Deleted orphaned file: ${url}`);
          } catch (err) {
            logger.error({ err }, `[MediaCleanup] Failed to delete file ${url}:`);
          }
        }
      }
    }
  } catch (err) {
    logger.error({ err }, "[MediaCleanup] Error in cleanupOrphanedFiles:");
    throw err;
  }

  return deletedCount;
}

/**
 * Run complete media cleanup job
 * This is the main function to call from a scheduler
 */
export async function runMediaCleanupJob(): Promise<CleanupStats> {
  const stats: CleanupStats = {
    orphanedRecords: 0,
    orphanedFiles: 0,
    errors: [],
  };

  logger.info("[MediaCleanup] Starting media cleanup job...");

  try {
    // Step 1: Clean up orphaned database records
    logger.info("[MediaCleanup] Phase 1: Cleaning up orphaned database records...");
    stats.orphanedRecords = await cleanupOrphanedRecords();

    // Step 2: Clean up orphaned files on disk
    logger.info("[MediaCleanup] Phase 2: Cleaning up orphaned files on disk...");
    stats.orphanedFiles = await cleanupOrphanedFiles();

    logger.info(
      `[MediaCleanup] Job completed successfully. Deleted ${stats.orphanedRecords} records and ${stats.orphanedFiles} files.`
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    stats.errors.push(errorMessage);
    logger.error({ err }, "[MediaCleanup] Job failed:");
  }

  return stats;
}

/**
 * Run cleanup job and log results (for CLI execution)
 */
export async function runMediaCleanupJobCLI(): Promise<void> {
  console.log("Starting media cleanup job...\n");

  const stats = await runMediaCleanupJob();

  console.log("\n=== Media Cleanup Results ===");
  console.log(`Orphaned records deleted: ${stats.orphanedRecords}`);
  console.log(`Orphaned files deleted: ${stats.orphanedFiles}`);

  if (stats.errors.length > 0) {
    console.log(`\nErrors encountered: ${stats.errors.length}`);
    stats.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  } else {
    console.log("\nNo errors encountered.");
  }

  console.log("\nCleanup job completed.");
}
