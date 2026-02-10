import { prisma } from "../../libs/prisma.js";
import type { AiTemplateConfig, AiGenerationType } from "@prisma/client";

/** Fields needed to create/update a template config (without the `id`). */
export interface TemplateConfigData {
  name: string;
  description: string;
  type: AiGenerationType;
  creditCost: number;
  maxOutputTokens: number;
  temperature: number;
  topP: number | null;
  systemPrompt: string;
  fields: string;
  isActive: boolean;
  updatedBy: string;
}

/**
 * Find a single template config override by ID.
 */
export async function findTemplateConfigById(
  id: string,
): Promise<AiTemplateConfig | null> {
  return prisma.aiTemplateConfig.findUnique({ where: { id } });
}

/**
 * Find all template config overrides.
 */
export async function findAllTemplateConfigs(): Promise<AiTemplateConfig[]> {
  return prisma.aiTemplateConfig.findMany({
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Create or update a template config override.
 * Uses upsert so the admin can override a disk template (create) or update an existing override.
 */
export async function upsertTemplateConfig(
  id: string,
  data: TemplateConfigData,
): Promise<AiTemplateConfig> {
  return prisma.aiTemplateConfig.upsert({
    where: { id },
    create: { id, ...data },
    update: data,
  });
}

/**
 * Delete a template config override (reverts to disk defaults).
 */
export async function deleteTemplateConfig(id: string): Promise<void> {
  await prisma.aiTemplateConfig.delete({ where: { id } });
}
