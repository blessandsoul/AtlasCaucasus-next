import type { AiGenerationType } from "@prisma/client";
import type { AdminAiTemplate, UpdateTemplateInput } from "./admin-ai.types.js";
import type { TemplateField } from "../ai/ai.types.js";
import {
  findTemplateConfigById,
  findAllTemplateConfigs,
  upsertTemplateConfig,
  deleteTemplateConfig,
} from "./admin-ai.repo.js";
import {
  getAllDiskTemplateDefinitions,
  getDiskTemplateDefinition,
  refreshFromDb,
} from "../ai/templates/index.js";
import { NotFoundError } from "../../libs/errors.js";
import { logger } from "../../libs/logger.js";

/**
 * Convert a disk template definition + optional DB override into an AdminAiTemplate.
 */
function buildAdminTemplate(
  diskDef: ReturnType<typeof getDiskTemplateDefinition>,
  dbOverride: Awaited<ReturnType<typeof findTemplateConfigById>>,
): AdminAiTemplate {
  if (dbOverride) {
    return {
      id: dbOverride.id,
      name: dbOverride.name,
      description: dbOverride.description,
      type: dbOverride.type,
      creditCost: dbOverride.creditCost,
      maxOutputTokens: dbOverride.maxOutputTokens,
      temperature: Number(dbOverride.temperature),
      topP: dbOverride.topP !== null ? Number(dbOverride.topP) : null,
      systemPrompt: dbOverride.systemPrompt,
      fields: JSON.parse(dbOverride.fields) as TemplateField[],
      isActive: dbOverride.isActive,
      source: "override",
      updatedBy: dbOverride.updatedBy,
      createdAt: dbOverride.createdAt,
      updatedAt: dbOverride.updatedAt,
    };
  }

  if (!diskDef) {
    throw new NotFoundError("Template not found", "TEMPLATE_NOT_FOUND");
  }

  return {
    id: diskDef.id,
    name: diskDef.name,
    description: diskDef.description,
    type: diskDef.type,
    creditCost: diskDef.creditCost,
    maxOutputTokens: diskDef.maxOutputTokens,
    temperature: diskDef.modelConfig?.temperature ?? 0.7,
    topP: diskDef.modelConfig?.topP ?? null,
    systemPrompt: diskDef.systemPrompt,
    fields: diskDef.fields,
    isActive: true,
    source: "disk",
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * List all AI templates (merged disk + DB overrides).
 */
export async function listAllTemplates(): Promise<AdminAiTemplate[]> {
  const diskDefs = getAllDiskTemplateDefinitions();
  const dbOverrides = await findAllTemplateConfigs();
  const overrideMap = new Map(dbOverrides.map((o) => [o.id, o]));

  return diskDefs.map((def) => buildAdminTemplate(def, overrideMap.get(def.id) ?? null));
}

/**
 * Get a single template by ID (merged).
 */
export async function getTemplate(id: string): Promise<AdminAiTemplate> {
  const diskDef = getDiskTemplateDefinition(id);
  if (!diskDef) {
    throw new NotFoundError("Template not found", "TEMPLATE_NOT_FOUND");
  }

  const dbOverride = await findTemplateConfigById(id);
  return buildAdminTemplate(diskDef, dbOverride);
}

/**
 * Update (or create override for) a template.
 * If no DB override exists yet, creates one with disk defaults merged with the update.
 */
export async function updateTemplate(
  id: string,
  data: UpdateTemplateInput,
  adminUserId: string,
): Promise<AdminAiTemplate> {
  const diskDef = getDiskTemplateDefinition(id);
  if (!diskDef) {
    throw new NotFoundError("Template not found", "TEMPLATE_NOT_FOUND");
  }

  // Get existing override or build from disk defaults
  const existing = await findTemplateConfigById(id);

  const merged = {
    name: data.name ?? existing?.name ?? diskDef.name,
    description: data.description ?? existing?.description ?? diskDef.description,
    type: (existing?.type ?? diskDef.type) as AiGenerationType,
    creditCost: data.creditCost ?? existing?.creditCost ?? diskDef.creditCost,
    maxOutputTokens: data.maxOutputTokens ?? existing?.maxOutputTokens ?? diskDef.maxOutputTokens,
    temperature: data.temperature ?? (existing ? Number(existing.temperature) : (diskDef.modelConfig?.temperature ?? 0.7)),
    topP: data.topP !== undefined ? data.topP : (existing?.topP !== undefined ? (existing.topP !== null ? Number(existing.topP) : null) : (diskDef.modelConfig?.topP ?? null)),
    systemPrompt: data.systemPrompt ?? existing?.systemPrompt ?? diskDef.systemPrompt,
    fields: JSON.stringify(data.fields ?? (existing ? JSON.parse(existing.fields) : diskDef.fields)),
    isActive: data.isActive ?? existing?.isActive ?? true,
    updatedBy: adminUserId,
  };

  const record = await upsertTemplateConfig(id, merged);

  // Refresh the runtime template cache
  await refreshFromDb();
  logger.info({ templateId: id, adminUserId }, "Admin updated AI template");

  return buildAdminTemplate(diskDef, record);
}

/**
 * Reset a template to its original disk defaults by removing the DB override.
 */
export async function resetTemplate(id: string): Promise<AdminAiTemplate> {
  const diskDef = getDiskTemplateDefinition(id);
  if (!diskDef) {
    throw new NotFoundError("Template not found", "TEMPLATE_NOT_FOUND");
  }

  const existing = await findTemplateConfigById(id);
  if (existing) {
    await deleteTemplateConfig(id);
    await refreshFromDb();
    logger.info({ templateId: id }, "Admin reset AI template to disk defaults");
  }

  return buildAdminTemplate(diskDef, null);
}

/**
 * Toggle a template's active status.
 */
export async function toggleTemplateActive(
  id: string,
  isActive: boolean,
  adminUserId: string,
): Promise<AdminAiTemplate> {
  const diskDef = getDiskTemplateDefinition(id);
  if (!diskDef) {
    throw new NotFoundError("Template not found", "TEMPLATE_NOT_FOUND");
  }

  // Get existing override or build from disk defaults to upsert
  const existing = await findTemplateConfigById(id);

  const merged = {
    name: existing?.name ?? diskDef.name,
    description: existing?.description ?? diskDef.description,
    type: (existing?.type ?? diskDef.type) as AiGenerationType,
    creditCost: existing?.creditCost ?? diskDef.creditCost,
    maxOutputTokens: existing?.maxOutputTokens ?? diskDef.maxOutputTokens,
    temperature: existing ? Number(existing.temperature) : (diskDef.modelConfig?.temperature ?? 0.7),
    topP: existing?.topP !== null && existing?.topP !== undefined ? Number(existing.topP) : (diskDef.modelConfig?.topP ?? null),
    systemPrompt: existing?.systemPrompt ?? diskDef.systemPrompt,
    fields: existing?.fields ?? JSON.stringify(diskDef.fields),
    isActive,
    updatedBy: adminUserId,
  };

  const record = await upsertTemplateConfig(id, merged);

  await refreshFromDb();
  logger.info({ templateId: id, isActive, adminUserId }, "Admin toggled AI template active status");

  return buildAdminTemplate(diskDef, record);
}
