import { z } from "zod";

/**
 * Schema for the POST /ai/generate and POST /ai/generate/stream endpoints.
 */
export const generateContentSchema = z.object({
  templateId: z.string().min(1, "Template ID is required"),
  inputs: z.record(z.string(), z.string()).refine(
    (inputs) => Object.keys(inputs).length > 0,
    "At least one input field is required",
  ),
});

export type GenerateContentInput = z.infer<typeof generateContentSchema>;

/**
 * Schema for GET /ai/generations query params (pagination + optional type filter).
 */
export const listGenerationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  type: z.enum(["TOUR_DESCRIPTION", "TOUR_ITINERARY", "MARKETING_COPY", "BLOG_CONTENT"]).optional(),
});

export type ListGenerationsQuery = z.infer<typeof listGenerationsQuerySchema>;

/**
 * Schema for POST /ai/apply-to-tour — apply generated content to a tour field.
 */
export const applyToTourSchema = z.object({
  generationId: z.string().uuid("Invalid generation ID"),
  tourId: z.string().uuid("Invalid tour ID"),
  field: z.enum(["description", "summary", "itinerary"], {
    errorMap: () => ({ message: "Field must be 'description', 'summary', or 'itinerary'" }),
  }),
});

export type ApplyToTourInput = z.infer<typeof applyToTourSchema>;
