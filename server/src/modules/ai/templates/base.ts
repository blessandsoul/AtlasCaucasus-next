import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import type { TemplateField } from "../ai.types.js";

/**
 * Load a .md prompt file from the same directory as the calling module.
 * Uses import.meta.url of the caller to resolve the path.
 *
 * @param importMetaUrl - The import.meta.url of the calling file
 * @param filename - The .md file name (default: "prompt.md")
 */
export function loadPrompt(importMetaUrl: string, filename = "prompt.md"): string {
  const dir = dirname(fileURLToPath(importMetaUrl));
  const filePath = join(dir, filename);
  return readFileSync(filePath, "utf-8").trim();
}

/**
 * Default prompt builder: formats user inputs as "Label: Value" pairs.
 * Templates can override this with a custom PromptBuilder.
 */
export function defaultBuildPrompt(
  fields: TemplateField[],
  userInputs: Record<string, string>,
): string {
  const parts: string[] = [];

  for (const field of fields) {
    const value = userInputs[field.name];
    if (value && value.trim()) {
      parts.push(`${field.label}: ${value.trim()}`);
    }
  }

  return parts.join("\n");
}
