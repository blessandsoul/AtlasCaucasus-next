import type { FastifyRequest, FastifyReply } from "fastify";
import { successResponse } from "../../libs/response.js";
import { prisma } from "../../libs/prisma.js";
import { redisClient } from "../../libs/redis.js";
import { wsManager } from "../websocket/websocket.manager.js";

export class HealthController {
  /**
   * Basic health check (for load balancers)
   */
  async healthCheck(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(
      successResponse("Server is healthy", {
        status: "healthy",
        timestamp: new Date().toISOString(),
      })
    );
  }

  /**
   * Detailed health check with all dependencies
   */
  async detailedHealthCheck(_request: FastifyRequest, reply: FastifyReply) {
    const checks = {
      server: {
        status: "healthy" as const,
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        nodeVersion: process.version,
      },
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      websocket: this.checkWebSocket(),
    };

    const overallHealthy = Object.values(checks).every(
      (check) => check.status === "healthy"
    );

    const statusCode = overallHealthy ? 200 : 503;

    return reply.status(statusCode).send(
      successResponse("Health check completed", {
        overall: overallHealthy ? "healthy" : "unhealthy",
        checks,
      })
    );
  }

  /**
   * Get server metrics (for monitoring dashboards)
   */
  async getMetrics(_request: FastifyRequest, reply: FastifyReply) {
    const memoryUsage = process.memoryUsage();
    const metrics = {
      uptime: {
        seconds: Math.floor(process.uptime()),
        formatted: this.formatUptime(process.uptime()),
      },
      memory: {
        heapUsed: this.formatBytes(memoryUsage.heapUsed),
        heapTotal: this.formatBytes(memoryUsage.heapTotal),
        external: this.formatBytes(memoryUsage.external),
        rss: this.formatBytes(memoryUsage.rss),
      },
      websocket: {
        connections: wsManager.getConnectionCount(),
        onlineUsers: wsManager.getOnlineUserCount(),
      },
      timestamp: new Date().toISOString(),
    };

    return reply.send(successResponse("Metrics retrieved", metrics));
  }

  /**
   * Readiness check for Kubernetes/Docker
   */
  async readinessCheck(_request: FastifyRequest, reply: FastifyReply) {
    const dbHealthy = (await this.checkDatabase()).status === "healthy";
    const redisHealthy = (await this.checkRedis()).status === "healthy";

    if (dbHealthy && redisHealthy) {
      return reply.send(
        successResponse("Ready", { ready: true })
      );
    }

    return reply.status(503).send(
      successResponse("Not ready", { ready: false })
    );
  }

  /**
   * Liveness check for Kubernetes/Docker
   */
  async livenessCheck(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(
      successResponse("Alive", { alive: true })
    );
  }

  /**
   * Check database connectivity
   */
  private async checkDatabase(): Promise<{ status: "healthy" | "unhealthy"; message: string; latency?: string }> {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      return {
        status: "healthy",
        message: "Database connected",
        latency: `${latency}ms`,
      };
    } catch (error: any) {
      return {
        status: "unhealthy",
        message: error.message || "Database connection failed",
      };
    }
  }

  /**
   * Check Redis connectivity
   */
  private async checkRedis(): Promise<{ status: "healthy" | "unhealthy"; message: string; latency?: string }> {
    try {
      if (!redisClient.isOpen) {
        return {
          status: "unhealthy",
          message: "Redis client not connected",
        };
      }
      const start = Date.now();
      await redisClient.ping();
      const latency = Date.now() - start;
      return {
        status: "healthy",
        message: "Redis connected",
        latency: `${latency}ms`,
      };
    } catch (error: any) {
      return {
        status: "unhealthy",
        message: error.message || "Redis connection failed",
      };
    }
  }

  /**
   * Check WebSocket status
   */
  private checkWebSocket(): { status: "healthy"; connections: number; onlineUsers: number } {
    return {
      status: "healthy",
      connections: wsManager.getConnectionCount(),
      onlineUsers: wsManager.getOnlineUserCount(),
    };
  }

  /**
   * Format bytes to human readable
   */
  private formatBytes(bytes: number): string {
    const units = ["B", "KB", "MB", "GB"];
    let unitIndex = 0;
    let value = bytes;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Format uptime to human readable
   */
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(" ");
  }
}

export const healthController = new HealthController();

// Legacy export for backwards compatibility
export async function getHealth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  return healthController.healthCheck(request, reply);
}
