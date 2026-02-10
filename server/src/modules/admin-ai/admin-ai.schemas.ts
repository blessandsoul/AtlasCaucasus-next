import { z } from "zod";

/** Validates a single template field option (for select-type fields). */
const templateFieldOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});

/** Validates a single TemplateField object. */
const templateFieldSchema = z.object({
  name: z.string().min(1).max(100),
  label: z.string().min(1).max(255),
  type: z.enum(["text", "textarea", "number", "select"]),
  required: z.boolean(),
  placeholder: z.string().max(500).optional(),
  options: z.array(templateFieldOptionSchema).optional(),
  defaultValue: z.string().max(255).optional(),
});

/** Body schema for PUT /admin/ai/templates/:id — all fields optional. */
export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().min(1).max(5000).optional(),
  creditCost: z.number().int().min(0).max(1000).optional(),
  maxOutputTokens: z.number().int().min(100).max(10000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).nullable().optional(),
  systemPrompt: z.string().min(1).max(50000).optional(),
  fields: z.array(templateFieldSchema).min(1).optional(),
  isActive: z.boolean().optional(),
});

/** Body schema for PATCH /admin/ai/templates/:id/toggle */
export const toggleTemplateSchema = z.object({
  isActive: z.boolean(),
});

/** Validates :templateId route param. */
export const templateIdParamSchema = z.object({
  templateId: z.string().min(1).max(100),
});
