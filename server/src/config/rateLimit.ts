import type { FastifyInstance, FastifyRequest } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { RateLimitError } from "../libs/errors.js";

/**
 * Rate limiting configuration for authentication endpoints
 * Protects against brute force attacks
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

    // Moderate: token refresh
    refresh: { max: 10, timeWindow: "15 minutes" },

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
 * Throws RateLimitError when rate limit is exceeded
 * This ensures proper error handling through global error handler
 * Note: onExceeded callback receives (request, key), not the context with ttl
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
 * Register global rate limiting plugin with default settings
 * Individual routes can override with their own limits
 */
export async function registerRateLimit(app: FastifyInstance): Promise<void> {
    await app.register(rateLimit, {
        global: false, // Don't apply globally, we'll configure per-route
        max: 100, // Default fallback: 100 requests per minute
        timeWindow: "1 minute",
        onExceeded: throwRateLimitError,
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
