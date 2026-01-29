import "dotenv/config";
import { env } from "./config/env.js";
import { logger } from "./libs/logger.js";
import { connectRedis, disconnectRedis, isRedisConnected } from "./libs/redis.js";
import { testDatabaseConnection } from "./libs/prisma.js";
import buildApp from "./app.js";
import { startSessionCleanup, stopSessionCleanup } from "./jobs/sessionCleanup.js";
import { startTypingCleanup, stopTypingCleanup } from "./jobs/typingCleanup.js";
import { startNotificationCleanup, stopNotificationCleanup } from "./jobs/notificationCleanup.js";
import { startInquiryExpiration, stopInquiryExpiration } from "./jobs/inquiryExpiration.js";
import { startWebSocketKeepalive } from "./modules/websocket/websocket.handler.js";

const app = buildApp();

// Store cleanup function for WebSocket keepalive
let stopKeepalive: (() => void) | null = null;

// Track service availability
let redisAvailable = false;
let databaseAvailable = false;

async function start(): Promise<void> {
  try {
    // Test database connection (non-fatal)
    databaseAvailable = await testDatabaseConnection();
    if (!databaseAvailable) {
      logger.warn("Database unavailable - API endpoints may not work properly");
    }

    // Connect to Redis (non-fatal)
    redisAvailable = await connectRedis();
    if (!redisAvailable) {
      logger.warn("Redis unavailable - caching, rate limiting, and real-time features disabled");
    }

    // Start Fastify server (this should always succeed if port is available)
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    logger.info(`Server started on port ${env.PORT}`);

    // Log service status
    logger.info({
      database: databaseAvailable ? "Connected" : "Unavailable",
      redis: redisAvailable ? "Connected" : "Unavailable",
    }, "Service Status:");

    // Start background jobs (only if Redis is available)
    if (redisAvailable) {
      startSessionCleanup(); // Runs daily at 2 AM
      startTypingCleanup(); // Typing indicator cleanup every minute
      startNotificationCleanup(); // Notification cleanup daily at 3 AM
      startInquiryExpiration(); // Inquiry expiration daily at 4 AM
      stopKeepalive = startWebSocketKeepalive(); // WebSocket keepalive every 30s
      logger.info("All background jobs started");
    } else {
      logger.warn("Background jobs disabled (Redis unavailable)");
    }
  } catch (err) {
    logger.fatal(err, "Failed to start server");
    process.exit(1);
  }
}

async function shutdown(): Promise<void> {
  logger.info("Shutting down server...");
  try {
    // Stop background jobs (only if they were started)
    if (redisAvailable) {
      stopSessionCleanup();
      stopTypingCleanup();
      stopNotificationCleanup();
      stopInquiryExpiration();
      if (stopKeepalive) {
        stopKeepalive();
      }
    }

    // Disconnect Redis (only if connected)
    if (redisAvailable && isRedisConnected()) {
      await disconnectRedis();
    }

    // Close Fastify (will close WebSocket connections)
    await app.close();

    logger.info("Server shut down gracefully");
    process.exit(0);
  } catch (err) {
    logger.error(err, "Error during shutdown");
    process.exit(1);
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start();
