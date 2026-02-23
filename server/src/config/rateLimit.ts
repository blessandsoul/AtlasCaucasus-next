import type { FastifyInstance, FastifyRequest } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { RateLimitError } from "../libs/errors.js";
import { redisClient, isRedisConnected } from "../libs/redis.js";
import { logger } from "../libs/logger.js";

/**
 * Rate limiting configuration for authentication endpoints
 * Protects against brute force attacks
 *
 * Uses Redis for persistence when available, falls back to in-memory otherwise.
 * Redis persistence ensures rate limits survive server restarts.
 */

interface RateLimitConfig {
    max: number;
    timeWindow: string;
}

// Rate limit configurations per endpoint pattern
export const rateLimitConfigs: Record<string, RateLimitConfig> = {
    // Very strict: registration (prevent mass account creation)
    register: { max: 3, timeWindow: "15 minutes" },

    // Strict: login (prevent brute force)
    login: { max: 5, timeWindow: "15 minutes" },

    // Strict: token refresh (reduced from 10 to prevent token brute-forcing)
    refresh: { max: 3, timeWindow: "15 minutes" },

    // Strict: password reset request (prevent email flooding)
    forgotPassword: { max: 3, timeWindow: "1 hour" },

    // Strict: password reset action
    resetPassword: { max: 3, timeWindow: "1 hour" },

    // Strict: verification email resend
    resendVerification: { max: 3, timeWindow: "1 hour" },

    // Logout doesn't need strict limiting
    logout: { max: 20, timeWindow: "15 minutes" },
};

/**
 * Throws RateLimitError when rate limit is exceeded.
 * RateLimitError extends AppError, so the global error handler
 * recognizes it and returns a proper 429 response.
 */
function throwRateLimitError(
    _request: FastifyRequest,
    _key: string
): void {
    throw new RateLimitError(
        "Too many requests. Please try again later."
    );
}

/**
 * Get Redis store configuration if Redis is connected.
 * Returns undefined if Redis is not available (falls back to in-memory).
 */
function getRedisStore(): { redis: typeof redisClient } | undefined {
    if (isRedisConnected()) {
        logger.info("Rate limiting: Using Redis store for persistence");
        return { redis: redisClient };
    }
    logger.warn("Rate limiting: Redis not connected, using in-memory store (limits will reset on restart)");
    return undefined;
}

/**
 * Register global rate limiting plugin with default settings
 * Individual routes can override with their own limits
 *
 * Uses Redis for persistence when available, falls back to in-memory otherwise.
 */
export async function registerRateLimit(app: FastifyInstance): Promise<void> {
    const redisStore = getRedisStore();

    await app.register(rateLimit, {
        global: false, // Don't apply globally, we'll configure per-route
        max: 100, // Default fallback: 100 requests per minute
        timeWindow: "1 minute",
        onExceeded: throwRateLimitError,
        ...redisStore,
    });
}

/**
 * Create rate limit config object for route options
 * Use this when defining routes that need rate limiting
 */
export function createRateLimitConfig(configKey: keyof typeof rateLimitConfigs) {
    const config = rateLimitConfigs[configKey];

    return {
        rateLimit: {
            max: config.max,
            timeWindow: config.timeWindow,
            onExceeded: throwRateLimitError,
        },
    };
}
