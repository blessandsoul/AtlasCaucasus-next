import type { OutputValidator } from "../../ai.types.js";

/**
 * Validates that the AI output is a JSON array of { title, description } objects.
 * Strips markdown code fences if the model wrapped them.
 */
export const validateItineraryOutput: OutputValidator = (rawOutput: string): string => {
  let cleaned = rawOutput.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }

  const parsed: unknown = JSON.parse(cleaned);

  if (!Array.isArray(parsed)) {
    throw new Error("Expected a JSON array");
  }

  for (const item of parsed) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as Record<string, unknown>).title !== "string" ||
      typeof (item as Record<string, unknown>).description !== "string"
    ) {
      throw new Error("Each item must have 'title' and 'description' strings");
    }
  }

  return cleaned;
};
