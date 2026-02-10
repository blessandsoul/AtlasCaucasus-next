import type { AiTemplate, AiTemplateDefinition, TemplateField } from "../ai.types.js";
import { prisma } from "../../../libs/prisma.js";
import { logger } from "../../../libs/logger.js";

import tourDescription from "./tour-description/index.js";
import tourItinerary from "./tour-itinerary/index.js";
import marketingSocial from "./marketing-social/index.js";
import blogPost from "./blog-post/index.js";

// ---------------------------------------------------------------------------
// Immutable disk-based definitions (seed / fallback)
// ---------------------------------------------------------------------------

/**
 * All registered disk template definitions.
 * To add a new AI function: import its index.ts and add it here.
 */
const DISK_DEFINITIONS: AiTemplateDefinition[] = [
  tourDescription,
  tourItinerary,
  marketingSocial,
  blogPost,
];

const diskMap = new Map<string, AiTemplateDefinition>(
  DISK_DEFINITIONS.map((d) => [d.id, d]),
);

// ---------------------------------------------------------------------------
// Mutable runtime cache (overlaid with DB overrides)
// ---------------------------------------------------------------------------

let activeMap = new Map<string, AiTemplateDefinition>(diskMap);

/**
 * Refresh the active template cache from the database.
 * Called at server startup and after admin writes.
 *
 * Merge logic:
 * - Start with all disk definitions
 * - For each DB override with isActive=true: override data fields but preserve
 *   disk code hooks (validateOutput, postProcessOutput, buildPrompt)
 * - For DB overrides with isActive=false: exclude template from activeMap
 */
export async function refreshFromDb(): Promise<void> {
  try {
    const dbConfigs = await prisma.aiTemplateConfig.findMany();
    const dbMap = new Map(dbConfigs.map((c) => [c.id, c]));

    const newActive = new Map<string, AiTemplateDefinition>();

    for (const diskDef of DISK_DEFINITIONS) {
      const dbOverride = dbMap.get(diskDef.id);

      if (!dbOverride) {
        // No override — use disk default
        newActive.set(diskDef.id, diskDef);
        continue;
      }

      if (!dbOverride.isActive) {
        // Template disabled by admin — skip it
        continue;
      }

      // Merge: DB data fields + disk code hooks
      const merged: AiTemplateDefinition = {
        id: diskDef.id,
        name: dbOverride.name,
        description: dbOverride.description,
        type: dbOverride.type,
        creditCost: dbOverride.creditCost,
        maxOutputTokens: dbOverride.maxOutputTokens,
        systemPrompt: dbOverride.systemPrompt,
        fields: JSON.parse(dbOverride.fields) as TemplateField[],
        modelConfig: {
          temperature: Number(dbOverride.temperature),
          topP: dbOverride.topP !== null ? Number(dbOverride.topP) : undefined,
        },
        // Preserve code hooks from disk
        validateOutput: diskDef.validateOutput,
        postProcessOutput: diskDef.postProcessOutput,
        buildPrompt: diskDef.buildPrompt,
      };

      newActive.set(diskDef.id, merged);
    }

    activeMap = newActive;
    logger.info(
      { totalDisk: DISK_DEFINITIONS.length, totalActive: newActive.size, dbOverrides: dbConfigs.length },
      "Template registry refreshed from DB",
    );
  } catch (error) {
    // On DB error, keep current cache intact
    logger.error({ err: error }, "Failed to refresh template registry from DB — using cached definitions");
  }
}

// ---------------------------------------------------------------------------
// Public API (synchronous — reads from in-memory cache)
// ---------------------------------------------------------------------------

/**
 * Get the full template definition (includes validators, post-processors, model config).
 * Used internally by the AI service layer.
 */
export function getTemplateDefinition(templateId: string): AiTemplateDefinition | undefined {
  return activeMap.get(templateId);
}

/**
 * Get all active template definitions.
 */
export function getAllTemplateDefinitions(): AiTemplateDefinition[] {
  return Array.from(activeMap.values());
}

// ---------------------------------------------------------------------------
// Disk-only access (for admin service to read original defaults)
// ---------------------------------------------------------------------------

/**
 * Get the original disk-based definition for a template.
 * Used by the admin service to show defaults and support reset.
 */
export function getDiskTemplateDefinition(templateId: string): AiTemplateDefinition | undefined {
  return diskMap.get(templateId);
}

/**
 * Get all original disk-based definitions.
 */
export function getAllDiskTemplateDefinitions(): AiTemplateDefinition[] {
  return DISK_DEFINITIONS;
}

// ---------------------------------------------------------------------------
// Public template conversion (strips internal config)
// ---------------------------------------------------------------------------

/**
 * Convert a full definition to the public AiTemplate shape (strips internal config).
 */
export function toPublicTemplate(def: AiTemplateDefinition): AiTemplate {
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    type: def.type,
    creditCost: def.creditCost,
    maxOutputTokens: def.maxOutputTokens,
    fields: def.fields,
    systemPrompt: def.systemPrompt,
  };
}
