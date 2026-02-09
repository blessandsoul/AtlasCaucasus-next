import type { JwtUser } from "../auth/auth.types.js";
import type { SafeAiGeneration, GenerateResult } from "./ai.types.js";
import type { ServicePaginatedResult } from "../../libs/pagination.js";
import { getAiProvider, isAiConfigured } from "../../libs/ai-provider.js";
import { logger } from "../../libs/logger.js";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  InternalError,
} from "../../libs/errors.js";
import { getTemplate, buildPrompt } from "./ai.templates.js";
import {
  createGeneration,
  updateGeneration,
  getGeneration,
  listGenerationsByUser,
  countGenerationsByUser,
} from "./ai.repo.js";
import { reserveCredits, refundCredits } from "../credits/credit.service.js";
import { getTourById, updateTour } from "../tours/tour.repo.js";

/**
 * Generate content (non-streaming).
 * 1. Validate template + fields
 * 2. Reserve credits
 * 3. Create PENDING generation record
 * 4. Call AI provider
 * 5. On success: update record to COMPLETED
 * 6. On failure: refund credits, update record to FAILED
 */
export async function generateContent(
  user: JwtUser,
  templateId: string,
  inputs: Record<string, string>,
): Promise<GenerateResult> {
  const template = getTemplate(templateId);
  if (!template) {
    throw new NotFoundError("Template not found", "TEMPLATE_NOT_FOUND");
  }

  // Validate required fields
  for (const field of template.fields) {
    if (field.required && (!inputs[field.name] || !inputs[field.name].trim())) {
      throw new BadRequestError(
        `Field '${field.label}' is required`,
        "MISSING_REQUIRED_FIELD",
      );
    }
  }

  if (!isAiConfigured()) {
    throw new InternalError("AI service is not configured", "AI_NOT_CONFIGURED");
  }

  // Reserve credits (deducted atomically — refunded on ANY failure below)
  await reserveCredits(
    user.id,
    template.creditCost,
    `AI generation: ${template.name}`,
    JSON.stringify({ templateId }),
  );

  let generationId: string | null = null;

  try {
    // Create PENDING generation record
    const userPrompt = buildPrompt(template, inputs);
    const generation = await createGeneration({
      userId: user.id,
      type: template.type,
      templateId: template.id,
      prompt: userPrompt,
      userInputs: JSON.stringify(inputs),
      creditCost: template.creditCost,
    });
    generationId = generation.id;

    const provider = getAiProvider();
    const text = await provider.generateContent({
      systemPrompt: template.systemPrompt,
      userPrompt,
      maxOutputTokens: template.maxOutputTokens,
      temperature: 0.7,
    });

    const updated = await updateGeneration(generation.id, {
      status: "COMPLETED",
      result: text,
    });

    return { generation: updated, text };
  } catch (error) {
    logger.error({ err: error, generationId }, "AI generation failed");

    // Refund credits
    await refundCredits(
      user.id,
      template.creditCost,
      `Refund: failed generation ${generationId ?? "unknown"}`,
      JSON.stringify({ generationId }),
    ).catch((refundErr) => {
      logger.error({ err: refundErr, generationId }, "Failed to refund credits");
    });

    // Update record to FAILED (if it was created)
    if (generationId) {
      await updateGeneration(generationId, {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      }).catch((updateErr) => {
        logger.error({ err: updateErr, generationId }, "Failed to update generation status");
      });
    }

    throw new InternalError("AI generation failed. Credits have been refunded.", "GENERATION_FAILED");
  }
}

/**
 * Generate content with SSE streaming.
 * Returns an AsyncGenerator that yields text chunks.
 * Credits are reserved before streaming begins and refunded on failure.
 */
export async function* generateContentStream(
  user: JwtUser,
  templateId: string,
  inputs: Record<string, string>,
): AsyncGenerator<{ type: "chunk"; text: string } | { type: "done"; generationId: string }> {
  const template = getTemplate(templateId);
  if (!template) {
    throw new NotFoundError("Template not found", "TEMPLATE_NOT_FOUND");
  }

  // Validate required fields
  for (const field of template.fields) {
    if (field.required && (!inputs[field.name] || !inputs[field.name].trim())) {
      throw new BadRequestError(
        `Field '${field.label}' is required`,
        "MISSING_REQUIRED_FIELD",
      );
    }
  }

  if (!isAiConfigured()) {
    throw new InternalError("AI service is not configured", "AI_NOT_CONFIGURED");
  }

  // Reserve credits (deducted atomically — refunded on ANY failure below)
  await reserveCredits(
    user.id,
    template.creditCost,
    `AI generation (stream): ${template.name}`,
    JSON.stringify({ templateId }),
  );

  let generationId: string | null = null;
  let fullText = "";

  try {
    // Create PENDING generation record
    const userPrompt = buildPrompt(template, inputs);
    const generation = await createGeneration({
      userId: user.id,
      type: template.type,
      templateId: template.id,
      prompt: userPrompt,
      userInputs: JSON.stringify(inputs),
      creditCost: template.creditCost,
    });
    generationId = generation.id;

    const provider = getAiProvider();
    const stream = provider.generateContentStream({
      systemPrompt: template.systemPrompt,
      userPrompt,
      maxOutputTokens: template.maxOutputTokens,
      temperature: 0.7,
    });

    for await (const chunkText of stream) {
      fullText += chunkText;
      yield { type: "chunk", text: chunkText };
    }

    // Update generation record with full result
    await updateGeneration(generation.id, {
      status: "COMPLETED",
      result: fullText,
    });

    yield { type: "done", generationId: generation.id };
  } catch (error) {
    logger.error({ err: error, generationId }, "AI streaming generation failed");

    // Refund credits
    await refundCredits(
      user.id,
      template.creditCost,
      `Refund: failed streaming generation ${generationId ?? "unknown"}`,
      JSON.stringify({ generationId }),
    ).catch((refundErr) => {
      logger.error({ err: refundErr, generationId }, "Failed to refund credits");
    });

    // Update record to FAILED (if it was created)
    if (generationId) {
      await updateGeneration(generationId, {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      }).catch((updateErr) => {
        logger.error({ err: updateErr, generationId }, "Failed to update generation status");
      });
    }

    throw new InternalError("AI generation failed. Credits have been refunded.", "GENERATION_FAILED");
  }
}

/**
 * Get paginated generation history for the authenticated user.
 */
export async function getGenerationHistory(
  user: JwtUser,
  page: number,
  limit: number,
): Promise<ServicePaginatedResult<SafeAiGeneration>> {
  const skip = (page - 1) * limit;

  const [items, totalItems] = await Promise.all([
    listGenerationsByUser(user.id, skip, limit),
    countGenerationsByUser(user.id),
  ]);

  return { items, totalItems };
}

/**
 * Get a single generation by ID. Only the owner can access it.
 */
export async function getGenerationById(
  user: JwtUser,
  generationId: string,
): Promise<SafeAiGeneration> {
  const generation = await getGeneration(generationId);

  if (!generation) {
    throw new NotFoundError("Generation not found", "GENERATION_NOT_FOUND");
  }

  if (generation.userId !== user.id && !user.roles.includes("ADMIN")) {
    throw new ForbiddenError(
      "You can only view your own generations",
      "NOT_GENERATION_OWNER",
    );
  }

  return generation;
}

/**
 * Apply generated content to a tour field (description, summary, or itinerary).
 */
export async function applyToTour(
  user: JwtUser,
  generationId: string,
  tourId: string,
  field: "description" | "summary" | "itinerary",
): Promise<void> {
  // Verify generation exists and belongs to user
  const generation = await getGeneration(generationId);
  if (!generation) {
    throw new NotFoundError("Generation not found", "GENERATION_NOT_FOUND");
  }
  if (generation.userId !== user.id && !user.roles.includes("ADMIN")) {
    throw new ForbiddenError("You can only use your own generations", "NOT_GENERATION_OWNER");
  }
  if (generation.status !== "COMPLETED" || !generation.result) {
    throw new BadRequestError("Generation is not completed or has no result", "GENERATION_NOT_COMPLETED");
  }

  // Verify tour exists and belongs to user
  const tour = await getTourById(tourId);
  if (!tour) {
    throw new NotFoundError("Tour not found", "TOUR_NOT_FOUND");
  }
  if (tour.ownerId !== user.id && !user.roles.includes("ADMIN")) {
    throw new ForbiddenError("You can only modify your own tours", "NOT_TOUR_OWNER");
  }

  // Build update data based on field
  if (field === "itinerary") {
    // Parse itinerary JSON from the generation result
    let itinerary: { title: string; description: string }[];
    try {
      itinerary = JSON.parse(generation.result);
      if (!Array.isArray(itinerary)) {
        throw new Error("Not an array");
      }
    } catch {
      throw new BadRequestError(
        "Generated content is not valid itinerary JSON",
        "INVALID_ITINERARY_FORMAT",
      );
    }
    await updateTour(tourId, { itinerary });
  } else {
    await updateTour(tourId, { [field]: generation.result });
  }
}
