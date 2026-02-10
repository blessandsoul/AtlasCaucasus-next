import type { AiTemplate } from "./ai.types.js";
import {
  getAllTemplateDefinitions,
  getTemplateDefinition,
  toPublicTemplate,
} from "./templates/index.js";
import { defaultBuildPrompt } from "./templates/base.js";

/**
 * Get all available templates (for the public listing endpoint).
 */
export function getAllTemplates(): AiTemplate[] {
  return getAllTemplateDefinitions().map(toPublicTemplate);
}

/**
 * Get a specific template by ID. Returns undefined if not found.
 */
export function getTemplate(templateId: string): AiTemplate | undefined {
  const def = getTemplateDefinition(templateId);
  return def ? toPublicTemplate(def) : undefined;
}

/**
 * Build a user prompt from template + user inputs.
 * Uses the template's custom buildPrompt if defined, otherwise falls back to default.
 */
export function buildPrompt(template: AiTemplate, userInputs: Record<string, string>): string {
  const def = getTemplateDefinition(template.id);

  if (def?.buildPrompt) {
    return def.buildPrompt(def.fields, userInputs);
  }

  return defaultBuildPrompt(template.fields, userInputs);
}
