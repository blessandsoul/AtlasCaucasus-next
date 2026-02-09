import type { AiGenerationStatus, AiGenerationType } from "@prisma/client";
import { prisma } from "../../libs/prisma.js";
import type { SafeAiGeneration } from "./ai.types.js";

/**
 * Create a new AI generation record (initially PENDING).
 */
export async function createGeneration(data: {
  userId: string;
  type: AiGenerationType;
  templateId: string;
  prompt: string;
  userInputs: string;
  creditCost: number;
}): Promise<SafeAiGeneration> {
  return prisma.aiGeneration.create({
    data: {
      userId: data.userId,
      type: data.type,
      templateId: data.templateId,
      prompt: data.prompt,
      userInputs: data.userInputs,
      creditCost: data.creditCost,
      status: "PENDING",
    },
  });
}

/**
 * Update a generation record (e.g. on completion or failure).
 */
export async function updateGeneration(
  id: string,
  data: {
    status?: AiGenerationStatus;
    result?: string;
    errorMessage?: string;
    metadata?: string;
  },
): Promise<SafeAiGeneration> {
  return prisma.aiGeneration.update({
    where: { id },
    data,
  });
}

/**
 * Get a single generation by ID.
 */
export async function getGeneration(id: string): Promise<SafeAiGeneration | null> {
  return prisma.aiGeneration.findUnique({
    where: { id },
  });
}

/**
 * List generations for a user (paginated, newest first).
 */
export async function listGenerationsByUser(
  userId: string,
  skip: number,
  take: number,
): Promise<SafeAiGeneration[]> {
  return prisma.aiGeneration.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });
}

/**
 * Count total generations for a user.
 */
export async function countGenerationsByUser(userId: string): Promise<number> {
  return prisma.aiGeneration.count({
    where: { userId },
  });
}
