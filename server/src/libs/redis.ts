import { createClient, RedisClientType } from "redis";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

// SECURITY: Require Redis password in production
if (env.NODE_ENV === "production" && !env.REDIS_PASSWORD) {
    logger.fatal("SECURITY: REDIS_PASSWORD required in production");
    process.exit(1);
}

// Main Redis client for general operations
const redisClient: RedisClientType = createClient({
    socket: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        reconnectStrategy: false, // Disable automatic reconnection
        connectTimeout: 5000, // 5 second timeout
    },
    password: env.REDIS_PASSWORD || undefined,
});

// Pub/Sub client (duplicate of main client)
// Needed because a client in pub/sub mode can't run other commands
const redisPubSubClient: RedisClientType = redisClient.duplicate();

// Silent error handlers - errors are handled in connectRedis()
redisClient.on("error", () => {
    // Silently ignore - handled in connectRedis()
});

redisPubSubClient.on("error", () => {
    // Silently ignore - handled in connectRedis()
});

// Connection handlers
redisClient.on("connect", () => {
    logger.info("Redis client connected");
});

redisPubSubClient.on("connect", () => {
    logger.info("Redis pub/sub client connected");
});

/**
 * Connect both Redis clients
 * Call this on server startup
 * Returns true if connected, false otherwise (non-fatal)
 */
export async function connectRedis(): Promise<boolean> {
    try {
        await redisClient.connect();
        await redisPubSubClient.connect();
        logger.info("Redis clients initialized successfully");
        return true;
    } catch (error) {
        logger.error({ error }, "Redis connection failed");
        return false;
    }
}

/**
 * Disconnect both Redis clients
 * Call this on server shutdown
 */
export async function disconnectRedis(): Promise<void> {
    try {
        if (redisClient.isOpen) {
            await redisClient.quit();
        }
        if (redisPubSubClient.isOpen) {
            await redisPubSubClient.quit();
        }
        logger.info("Redis clients disconnected");
    } catch (error) {
        logger.error({ error }, "Failed to disconnect from Redis");
    }
}

/**
 * Check if Redis is connected
 */
export function isRedisConnected(): boolean {
    return redisClient.isOpen;
}

export { redisClient, redisPubSubClient };
