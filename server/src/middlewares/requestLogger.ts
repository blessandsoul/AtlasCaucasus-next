import { FastifyRequest, FastifyReply } from "fastify";
import { logger } from "../libs/logger.js";

/**
 * Request logging middleware for production environments
 * Logs incoming requests and response details
 */
export async function requestLogger(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const startTime = Date.now();

    // Log incoming request
    logger.info(
        {
            type: "request",
            method: request.method,
            url: request.url,
            ip: request.ip,
            userAgent: request.headers["user-agent"],
            requestId: request.id,
        },
        `IN: ${request.method} ${request.url}`
    );

    // Log response on finish
    reply.raw.on("finish", () => {
        const duration = Date.now() - startTime;

        const logData = {
            type: "response",
            method: request.method,
            url: request.url,
            statusCode: reply.statusCode,
            duration: `${duration}ms`,
            requestId: request.id,
        };

        // Use different log levels based on status code
        if (reply.statusCode >= 500) {
            logger.error(logData, `OUT: ${request.method} ${request.url} ${reply.statusCode} (${duration}ms)`);
        } else if (reply.statusCode >= 400) {
            logger.warn(logData, `OUT: ${request.method} ${request.url} ${reply.statusCode} (${duration}ms)`);
        } else {
            logger.info(logData, `OUT: ${request.method} ${request.url} ${reply.statusCode} (${duration}ms)`);
        }
    });
}

/**
 * Slow request logger - logs requests that take too long
 */
export function createSlowRequestLogger(thresholdMs: number = 1000) {
    return async function slowRequestLogger(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<void> {
        const startTime = Date.now();

        reply.raw.on("finish", () => {
            const duration = Date.now() - startTime;

            if (duration > thresholdMs) {
                logger.warn(
                    {
                        type: "slow_request",
                        method: request.method,
                        url: request.url,
                        duration: `${duration}ms`,
                        threshold: `${thresholdMs}ms`,
                        requestId: request.id,
                    },
                    `SLOW REQUEST: ${request.method} ${request.url} took ${duration}ms`
                );
            }
        });
    };
}
