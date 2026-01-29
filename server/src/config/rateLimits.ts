/**
 * Rate limit configurations for different endpoint types
 * Used throughout the application for consistent rate limiting
 */

export const rateLimits = {
    // Authentication endpoints (strict to prevent brute force)
    auth: {
        register: { max: 5, timeWindow: "15 minutes" },
        login: { max: 10, timeWindow: "15 minutes" },
        refresh: { max: 20, timeWindow: "15 minutes" },
        passwordReset: { max: 3, timeWindow: "15 minutes" },
        verifyEmail: { max: 10, timeWindow: "15 minutes" },
    },

    // Read operations (generous for user experience)
    read: {
        max: 100,
        timeWindow: "1 minute",
    },

    // Write operations (moderate to prevent spam)
    write: {
        max: 30,
        timeWindow: "1 minute",
    },

    // Chat operations (high volume, real-time needs)
    chat: {
        sendMessage: { max: 60, timeWindow: "1 minute" },
        typing: { max: 100, timeWindow: "1 minute" },
        createChat: { max: 10, timeWindow: "1 minute" },
    },

    // Search operations (consider caching)
    search: {
        max: 100,
        timeWindow: "1 minute",
    },

    // Review operations (prevent review spam)
    reviews: {
        create: { max: 10, timeWindow: "1 minute" },
        update: { max: 20, timeWindow: "1 minute" },
    },

    // Inquiry operations
    inquiries: {
        create: { max: 10, timeWindow: "15 minutes" },
        respond: { max: 30, timeWindow: "15 minutes" },
    },

    // Health checks (allow frequent monitoring)
    health: {
        max: 200,
        timeWindow: "1 minute",
    },

    // Default fallback
    default: {
        max: 100,
        timeWindow: "1 minute",
    },
} as const;

export type RateLimitConfig = {
    max: number;
    timeWindow: string;
};
