import type { FastifyInstance } from "fastify";
import { authGuard, requireRole } from "../../middlewares/authGuard.js";
import {
  getTemplatesHandler,
  generateHandler,
  generateStreamHandler,
  getGenerationsHandler,
  getGenerationHandler,
  applyToTourHandler,
} from "./ai.controller.js";

const PROVIDER_ROLES = ["COMPANY", "GUIDE", "DRIVER", "ADMIN"] as const;

export async function aiRoutes(fastify: FastifyInstance): Promise<void> {
  // Public: list available templates
  fastify.get("/ai/templates", getTemplatesHandler);

  // Provider+Verified: generate content (non-streaming)
  fastify.post(
    "/ai/generate",
    { preHandler: [authGuard, requireRole([...PROVIDER_ROLES])] },
    generateHandler,
  );

  // Provider+Verified: generate content (SSE streaming)
  fastify.post(
    "/ai/generate/stream",
    { preHandler: [authGuard, requireRole([...PROVIDER_ROLES])] },
    generateStreamHandler,
  );

  // Provider+Verified: list generation history
  fastify.get(
    "/ai/generations",
    { preHandler: [authGuard, requireRole([...PROVIDER_ROLES])] },
    getGenerationsHandler,
  );

  // Provider+Verified: get single generation
  fastify.get(
    "/ai/generations/:id",
    { preHandler: [authGuard, requireRole([...PROVIDER_ROLES])] },
    getGenerationHandler,
  );

  // Provider+Verified: apply generated content to a tour
  fastify.post(
    "/ai/apply-to-tour",
    { preHandler: [authGuard, requireRole([...PROVIDER_ROLES])] },
    applyToTourHandler,
  );
}
