import type { FastifyRequest, FastifyReply } from "fastify";
import { successResponse, paginatedResponse } from "../../libs/response.js";
import { PaginationSchema } from "../../libs/pagination.js";
import { ValidationError } from "../../libs/errors.js";
import { validateUuidParam } from "../../libs/validation.js";
import { getAllTemplates } from "./ai.templates.js";
import {
  generateContent,
  generateContentStream,
  getGenerationHistory,
  getGenerationById,
  applyToTour,
} from "./ai.service.js";
import {
  generateContentSchema,
  listGenerationsQuerySchema,
  applyToTourSchema,
} from "./ai.schemas.js";

/**
 * GET /ai/templates — List all available prompt templates (public).
 */
export async function getTemplatesHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const templates = getAllTemplates();

  // Strip systemPrompt from the public response
  const publicTemplates = templates.map(({ systemPrompt: _sp, ...rest }) => rest);

  return reply.send(successResponse("Templates retrieved successfully", publicTemplates));
}

/**
 * POST /ai/generate — Generate content (non-streaming).
 */
export async function generateHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = generateContentSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const { templateId, inputs } = parsed.data;
  const result = await generateContent(request.user, templateId, inputs);

  return reply.status(201).send(successResponse("Content generated successfully", result));
}

/**
 * POST /ai/generate/stream — Generate content with SSE streaming.
 */
export async function generateStreamHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = generateContentSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const { templateId, inputs } = parsed.data;

  // Hijack the response so Fastify doesn't try to manage it after we write raw SSE.
  // This also bypasses the CORS plugin, so we must set CORS headers manually.
  reply.hijack();

  const origin = request.headers.origin;
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
    ...(origin ? {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
    } : {}),
  });

  try {
    const stream = generateContentStream(request.user, templateId, inputs);

    for await (const event of stream) {
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Generation failed";
    reply.raw.write(`data: ${JSON.stringify({ type: "error", message: errorMessage })}\n\n`);
  }

  reply.raw.end();
}

/**
 * GET /ai/generations — List user's generation history (paginated).
 */
export async function getGenerationsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = listGenerationsQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const { page, limit } = parsed.data;
  const { items, totalItems } = await getGenerationHistory(request.user, page, limit);

  return reply.send(
    paginatedResponse("Generations retrieved successfully", items, page, limit, totalItems),
  );
}

/**
 * GET /ai/generations/:id — Get a single generation.
 */
export async function getGenerationHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { id } = request.params as { id: string };
  const validId = validateUuidParam(id);

  const generation = await getGenerationById(request.user, validId);

  return reply.send(successResponse("Generation retrieved successfully", generation));
}

/**
 * POST /ai/apply-to-tour — Apply generated content to a tour field.
 */
export async function applyToTourHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = applyToTourSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const { generationId, tourId, field } = parsed.data;
  await applyToTour(request.user, generationId, tourId, field);

  return reply.send(successResponse("Content applied to tour successfully", null));
}
