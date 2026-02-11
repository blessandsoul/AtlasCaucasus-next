import * as cron from "node-cron";
import { logger } from "../libs/logger.js";
import { redisClient, isRedisConnected } from "../libs/redis.js";
import { prisma } from "../libs/prisma.js";

/**
 * View persistence job
 * Runs daily at 5 AM to flush Redis view counters to the database.
 *
 * Redis keys follow the pattern: views:<ENTITY_TYPE>:<ENTITY_ID>:total
 * Entity types: TOUR, GUIDE, DRIVER, COMPANY
 */

let persistenceJob: ReturnType<typeof cron.schedule> | null = null;

const ENTITY_TYPE_TO_TABLE = {
    TOUR: "tours",
    GUIDE: "guides",
    DRIVER: "drivers",
    COMPANY: "companies",
} as const;

type EntityType = keyof typeof ENTITY_TYPE_TO_TABLE;

/**
 * Persist all Redis view counters to the database.
 * Returns the number of entities updated.
 */
export async function persistViewCounts(): Promise<number> {
    if (!isRedisConnected()) {
        logger.warn("Redis not connected, skipping view persistence");
        return 0;
    }

    let updated = 0;
    let errors = 0;

    const keys: string[] = [];
    for await (const batch of redisClient.scanIterator({ MATCH: "views:*:*:total", COUNT: 200 })) {
        if (Array.isArray(batch)) {
            keys.push(...batch);
        } else {
            keys.push(batch as string);
        }
    }

    for (const key of keys) {
        try {
            // Parse key: views:<ENTITY_TYPE>:<ENTITY_ID>:total
            const parts = key.split(":");
            if (parts.length !== 4) continue;

            const entityType = parts[1] as EntityType;
            const entityId = parts[2];

            if (!ENTITY_TYPE_TO_TABLE[entityType]) continue;

            const countStr = await redisClient.get(key);
            if (!countStr) continue;

            const redisCount = parseInt(countStr, 10);
            if (isNaN(redisCount) || redisCount <= 0) continue;

            // Update the entity's viewCount in the database
            const tableName = ENTITY_TYPE_TO_TABLE[entityType];

            switch (tableName) {
                case "tours":
                    await prisma.tour.update({
                        where: { id: entityId },
                        data: { viewCount: redisCount },
                    });
                    break;
                case "guides":
                    await prisma.guide.update({
                        where: { id: entityId },
                        data: { viewCount: redisCount },
                    });
                    break;
                case "drivers":
                    await prisma.driver.update({
                        where: { id: entityId },
                        data: { viewCount: redisCount },
                    });
                    break;
                case "companies":
                    await prisma.company.update({
                        where: { id: entityId },
                        data: { viewCount: redisCount },
                    });
                    break;
            }

            updated++;
        } catch (error) {
            errors++;
            logger.warn({ error, key }, "Failed to persist view count for key");
        }
    }

    return updated;
}

/**
 * Start the view persistence cron job.
 * @param schedule - Cron schedule expression (default: "0 5 * * *" = 5 AM daily)
 */
export function startViewPersistence(schedule: string = "0 5 * * *"): void {
    if (persistenceJob) {
        logger.warn("View persistence job is already running");
        return;
    }

    persistenceJob = cron.schedule(schedule, async () => {
        logger.info("Starting scheduled view persistence...");

        try {
            const updatedCount = await persistViewCounts();
            logger.info({ updatedCount }, "Scheduled view persistence completed");
        } catch (error) {
            logger.error({ error }, "Scheduled view persistence failed");
        }
    });

    logger.info({ schedule }, "View persistence job scheduled");
}

/**
 * Stop the view persistence cron job.
 */
export function stopViewPersistence(): void {
    if (persistenceJob) {
        persistenceJob.stop();
        persistenceJob = null;
        logger.info("View persistence job stopped");
    }
}

/**
 * Run view persistence manually (useful for testing).
 */
export async function runViewPersistenceNow(): Promise<number> {
    logger.info("Running manual view persistence...");

    try {
        const updatedCount = await persistViewCounts();
        logger.info({ updatedCount }, "Manual view persistence completed");
        return updatedCount;
    } catch (error) {
        logger.error({ error }, "Manual view persistence failed");
        throw error;
    }
}
