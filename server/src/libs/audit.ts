import { prisma } from "./prisma.js";
import { logger } from "./logger.js";
import type { AuditAction } from "@prisma/client";

export interface AuditLogInput {
  action: AuditAction;
  userId?: string | null;
  targetType?: string;
  targetId?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
  status?: "SUCCESS" | "FAILED" | "BLOCKED";
  errorMessage?: string;
}

/**
 * Creates an audit log entry for sensitive operations.
 * This function is fire-and-forget to avoid blocking the main operation.
 */
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        userId: input.userId ?? null,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        status: input.status ?? "SUCCESS",
        errorMessage: input.errorMessage ?? null,
      },
    });
  } catch (error) {
    // Log but don't throw - audit logging should not break main operations
    logger.error({ error, input }, "Failed to create audit log entry");
  }
}

/**
 * Helper to extract client info from Fastify request for audit logging.
 */
export function getClientInfo(request: {
  ip?: string;
  headers?: { "user-agent"?: string; "x-forwarded-for"?: string };
}): { ipAddress: string | null; userAgent: string | null } {
  const ipAddress =
    request.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
    request.ip ||
    null;
  const userAgent = request.headers?.["user-agent"] || null;

  return { ipAddress, userAgent };
}

/**
 * Audit log helper for authentication events.
 */
export async function auditAuth(
  action: AuditAction,
  userId: string | null,
  request: { ip?: string; headers?: { "user-agent"?: string; "x-forwarded-for"?: string } },
  options?: {
    status?: "SUCCESS" | "FAILED" | "BLOCKED";
    errorMessage?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(request);

  await createAuditLog({
    action,
    userId,
    ipAddress,
    userAgent,
    status: options?.status ?? "SUCCESS",
    errorMessage: options?.errorMessage,
    metadata: options?.metadata,
  });
}

/**
 * Audit log helper for entity operations (CRUD).
 */
export async function auditEntity(
  action: AuditAction,
  userId: string | null,
  targetType: string,
  targetId: string,
  request?: { ip?: string; headers?: { "user-agent"?: string; "x-forwarded-for"?: string } },
  metadata?: Record<string, unknown>
): Promise<void> {
  const clientInfo = request ? getClientInfo(request) : { ipAddress: null, userAgent: null };

  await createAuditLog({
    action,
    userId,
    targetType,
    targetId,
    ipAddress: clientInfo.ipAddress,
    userAgent: clientInfo.userAgent,
    metadata,
  });
}

/**
 * Query audit logs with pagination.
 */
export async function getAuditLogs(options: {
  userId?: string;
  action?: AuditAction;
  targetType?: string;
  targetId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}): Promise<{
  items: Array<{
    id: string;
    action: AuditAction;
    userId: string | null;
    targetType: string | null;
    targetId: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    metadata: string | null;
    status: string;
    errorMessage: string | null;
    createdAt: Date;
  }>;
  totalItems: number;
}> {
  const page = options.page ?? 1;
  const limit = options.limit ?? 50;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (options.userId) where.userId = options.userId;
  if (options.action) where.action = options.action;
  if (options.targetType) where.targetType = options.targetType;
  if (options.targetId) where.targetId = options.targetId;
  if (options.status) where.status = options.status;

  if (options.startDate || options.endDate) {
    where.createdAt = {};
    if (options.startDate) (where.createdAt as Record<string, Date>).gte = options.startDate;
    if (options.endDate) (where.createdAt as Record<string, Date>).lte = options.endDate;
  }

  const [items, totalItems] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, totalItems };
}
