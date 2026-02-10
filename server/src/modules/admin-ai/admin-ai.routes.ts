import type { FastifyInstance } from "fastify";
import { authGuard, requireRole } from "../../middlewares/authGuard.js";
import {
  listTemplatesHandler,
  getTemplateHandler,
  updateTemplateHandler,
  resetTemplateHandler,
  toggleTemplateHandler,
} from "./admin-ai.controller.js";

export async function adminAiRoutes(fastify: FastifyInstance): Promise<void> {
  const adminOnly = { preHandler: [authGuard, requireRole("ADMIN")] };

  // List all AI templates (merged disk + DB overrides)
  fastify.get("/admin/ai/templates", adminOnly, listTemplatesHandler);

  // Get a single AI template
  fastify.get("/admin/ai/templates/:templateId", adminOnly, getTemplateHandler);

  // Update (override) an AI template
  fastify.put("/admin/ai/templates/:templateId", adminOnly, updateTemplateHandler);

  // Reset template to disk defaults
  fastify.post("/admin/ai/templates/:templateId/reset", adminOnly, resetTemplateHandler);

  // Toggle template active/inactive
  fastify.patch("/admin/ai/templates/:templateId/toggle", adminOnly, toggleTemplateHandler);
}
