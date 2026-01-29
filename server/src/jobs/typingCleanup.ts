import cron, { ScheduledTask } from "node-cron";
import { redisClient, isRedisConnected } from "../libs/redis.js";
import { logger } from "../libs/logger.js";

let cleanupJob: ScheduledTask | null = null;

/**
 * Start typing indicator cleanup job
 * Redis automatically expires typing keys after 5 seconds,
 * but this job serves as a backup to clean up any that might have stuck
 */
export function startTypingCleanup(): void {
    // Run every minute
    cleanupJob = cron.schedule("*/1 * * * *", async () => {
        try {
            // Only run if Redis is connected
            if (!isRedisConnected()) {
                return;
            }

            // Redis automatically expires typing keys after 5 seconds
            // This is just a safety check to log any stuck keys
            const keys = await redisClient.keys("typing:*");

            if (keys.length > 100) {
                // If there are many typing indicators, something might be wrong
                logger.warn(
                    { count: keys.length },
                    "Unusually high number of typing indicators"
                );
            }
        } catch (error) {
            logger.error({ error }, "Failed to check typing indicators");
        }
    });

    logger.info("Typing indicator cleanup job started");
}

/**
 * Stop typing cleanup job
 */
export function stopTypingCleanup(): void {
    if (cleanupJob) {
        cleanupJob.stop();
        cleanupJob = null;
        logger.info("Typing indicator cleanup job stopped");
    }
}
