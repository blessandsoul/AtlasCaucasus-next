import type { FastifyInstance } from "fastify";
import { healthController } from "./health.controller.js";

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  // Basic health check (for load balancers)
  fastify.get("/health", healthController.healthCheck.bind(healthController));

  // Detailed health check with all dependencies
  fastify.get(
    "/health/detailed",
    healthController.detailedHealthCheck.bind(healthController)
  );

  // Metrics endpoint (for monitoring dashboards)
  fastify.get(
    "/health/metrics",
    healthController.getMetrics.bind(healthController)
  );

  // Kubernetes-style probes
  fastify.get(
    "/health/ready",
    healthController.readinessCheck.bind(healthController)
  );

  fastify.get(
    "/health/live",
    healthController.livenessCheck.bind(healthController)
  );
}
