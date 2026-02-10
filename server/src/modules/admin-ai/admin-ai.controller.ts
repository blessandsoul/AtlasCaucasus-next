import type { FastifyRequest, FastifyReply } from "fastify";
import { successResponse } from "../../libs/response.js";
import { ValidationError } from "../../libs/errors.js";
import {
  listAllTemplates,
  getTemplate,
  updateTemplate,
  resetTemplate,
  toggleTemplateActive,
} from "./admin-ai.service.js";
import {
  updateTemplateSchema,
  toggleTemplateSchema,
  templateIdParamSchema,
} from "./admin-ai.schemas.js";

/**
 * GET /admin/ai/templates — List all AI templates (merged disk + DB).
 */
export async function listTemplatesHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const templates = await listAllTemplates();
  return reply.send(successResponse("AI templates retrieved successfully", templates));
}

/**
 * GET /admin/ai/templates/:templateId — Get a single AI template.
 */
export async function getTemplateHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const paramsParsed = templateIdParamSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    throw new ValidationError(paramsParsed.error.errors[0].message);
  }

  const template = await getTemplate(paramsParsed.data.templateId);
  return reply.send(successResponse("AI template retrieved successfully", template));
}

/**
 * PUT /admin/ai/templates/:templateId — Update (or create override for) a template.
 */
export async function updateTemplateHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const paramsParsed = templateIdParamSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    throw new ValidationError(paramsParsed.error.errors[0].message);
  }

  const bodyParsed = updateTemplateSchema.safeParse(request.body);
  if (!bodyParsed.success) {
    throw new ValidationError(bodyParsed.error.errors[0].message);
  }

  const template = await updateTemplate(
    paramsParsed.data.templateId,
    bodyParsed.data,
    request.user.id,
  );

  return reply.send(successResponse("AI template updated successfully", template));
}

/**
 * POST /admin/ai/templates/:templateId/reset — Reset template to disk defaults.
 */
export async function resetTemplateHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const paramsParsed = templateIdParamSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    throw new ValidationError(paramsParsed.error.errors[0].message);
  }

  const template = await resetTemplate(paramsParsed.data.templateId);
  return reply.send(successResponse("AI template reset to defaults successfully", template));
}

/**
 * PATCH /admin/ai/templates/:templateId/toggle — Toggle template active status.
 */
export async function toggleTemplateHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const paramsParsed = templateIdParamSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    throw new ValidationError(paramsParsed.error.errors[0].message);
  }

  const bodyParsed = toggleTemplateSchema.safeParse(request.body);
  if (!bodyParsed.success) {
    throw new ValidationError(bodyParsed.error.errors[0].message);
  }

  const template = await toggleTemplateActive(
    paramsParsed.data.templateId,
    bodyParsed.data.isActive,
    request.user.id,
  );

  return reply.send(successResponse("AI template status updated successfully", template));
}
