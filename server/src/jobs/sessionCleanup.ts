import * as cron from "node-cron";
import { logger } from "../libs/logger.js";
import { cleanupSessions } from "../modules/auth/security.service.js";

/**
 * Session cleanup job
 * Runs daily at 2 AM to clean up expired/revoked sessions
 */

let cleanupJob: ReturnType<typeof cron.schedule> | null = null;

/**
 * Start the session cleanup cron job
 * @param schedule - Cron schedule expression (default: "0 2 * * *" = 2 AM daily)
 */
export function startSessionCleanup(schedule: string = "0 2 * * *"): void {
    if (cleanupJob) {
        logger.warn("Session cleanup job is already running");
        return;
    }

    cleanupJob = cron.schedule(schedule, async () => {
        logger.info("Starting scheduled session cleanup...");

        try {
            const deletedCount = await cleanupSessions();
            logger.info({ deletedCount }, "Scheduled session cleanup completed");
        } catch (error) {
            logger.error({ error }, "Scheduled session cleanup failed");
        }
    });

    logger.info({ schedule }, "Session cleanup job scheduled");
}

/**
 * Stop the session cleanup cron job
 */
export function stopSessionCleanup(): void {
    if (cleanupJob) {
        cleanupJob.stop();
        cleanupJob = null;
        logger.info("Session cleanup job stopped");
    }
}

/**
 * Run session cleanup manually (useful for testing)
 */
export async function runSessionCleanupNow(): Promise<number> {
    logger.info("Running manual session cleanup...");

    try {
        const deletedCount = await cleanupSessions();
        logger.info({ deletedCount }, "Manual session cleanup completed");
        return deletedCount;
    } catch (error) {
        logger.error({ error }, "Manual session cleanup failed");
        throw error;
    }
}
