import { redisClient, isRedisConnected } from "./redis.js";
import { logger } from "./logger.js";

/**
 * Get a cached value from Redis.
 * Returns null if Redis is unavailable or key doesn't exist.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
    try {
        if (!isRedisConnected()) return null;
        const cached = await redisClient.get(key);
        if (cached) {
            return JSON.parse(cached) as T;
        }
    } catch (error) {
        logger.warn({ error, key }, "Cache read failed");
    }
    return null;
}

/**
 * Set a value in Redis cache with TTL.
 */
export async function cacheSet(key: string, data: unknown, ttlSeconds: number): Promise<void> {
    try {
        if (!isRedisConnected()) return;
        await redisClient.setEx(key, ttlSeconds, JSON.stringify(data));
    } catch (error) {
        logger.warn({ error, key }, "Cache write failed");
    }
}

/**
 * Delete a single cache key.
 */
export async function cacheDelete(key: string): Promise<void> {
    try {
        if (!isRedisConnected()) return;
        await redisClient.del(key);
    } catch (error) {
        logger.warn({ error, key }, "Cache delete failed");
    }
}

/**
 * Delete all keys matching a glob pattern using SCAN (safe for production).
 * Example: cacheDeletePattern("tours:list:*")
 */
export async function cacheDeletePattern(pattern: string): Promise<void> {
    try {
        if (!isRedisConnected()) return;

        const keysToDelete: string[] = [];
        for await (const batch of redisClient.scanIterator({ MATCH: pattern, COUNT: 100 })) {
            if (Array.isArray(batch)) {
                keysToDelete.push(...batch);
            } else {
                keysToDelete.push(batch as string);
            }
        }
        for (const key of keysToDelete) {
            await redisClient.del(key);
        }
    } catch (error) {
        logger.warn({ error, pattern }, "Cache pattern delete failed");
    }
}
