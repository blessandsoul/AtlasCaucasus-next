import cron from "node-cron";
import { notificationRepo } from "../modules/notifications/notification.repo.js";
import { logger } from "../libs/logger.js";

let cleanupJob: cron.ScheduledTask | null = null;

/**
 * Start the notification cleanup job
 * Runs daily at 3:00 AM to clean up old read notifications
 */
export function startNotificationCleanup() {
    // Run daily at 3:00 AM
    cleanupJob = cron.schedule("0 3 * * *", async () => {
        try {
            const daysOld = 30; // Delete read notifications older than 30 days
            const result = await notificationRepo.deleteOldReadNotifications(daysOld);

            logger.info(
                { deletedCount: result.count },
                `Cleaned up old read notifications (${daysOld}+ days old)`
            );
        } catch (error) {
            logger.error({ error }, "Failed to cleanup notifications");
        }
    });

    logger.info("Notification cleanup job started (runs daily at 3:00 AM)");
}

/**
 * Stop the notification cleanup job
 */
export function stopNotificationCleanup() {
    if (cleanupJob) {
        cleanupJob.stop();
        cleanupJob = null;
        logger.info("Notification cleanup job stopped");
    }
}
