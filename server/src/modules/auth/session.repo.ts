import { prisma } from "../../libs/prisma.js";
import type { UserSession as PrismaUserSession } from "@prisma/client";

export interface UserSession {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  lastUsedAt: Date;
}

export interface CreateSessionData {
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

// Convert Prisma UserSession to our type
function toSession(session: PrismaUserSession): UserSession {
  return {
    id: session.id,
    userId: session.userId,
    refreshTokenHash: session.refreshTokenHash,
    expiresAt: session.expiresAt,
    revokedAt: session.revokedAt,
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    createdAt: session.createdAt,
    lastUsedAt: session.lastUsedAt,
  };
}

export async function createSession(data: CreateSessionData): Promise<UserSession> {
  const session = await prisma.userSession.create({
    data: {
      userId: data.userId,
      refreshTokenHash: data.refreshTokenHash,
      expiresAt: data.expiresAt,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
    },
  });

  return toSession(session);
}

export async function findSessionById(id: string): Promise<UserSession | null> {
  const session = await prisma.userSession.findUnique({
    where: { id },
  });

  return session ? toSession(session) : null;
}

export async function findActiveSessionById(id: string): Promise<UserSession | null> {
  const session = await prisma.userSession.findFirst({
    where: {
      id,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  return session ? toSession(session) : null;
}

export async function updateSessionTokenHash(
  id: string,
  refreshTokenHash: string,
  expiresAt: Date
): Promise<UserSession> {
  const session = await prisma.userSession.update({
    where: { id },
    data: {
      refreshTokenHash,
      expiresAt,
      lastUsedAt: new Date(),
    },
  });

  return toSession(session);
}

export async function revokeSession(id: string): Promise<UserSession> {
  const session = await prisma.userSession.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

  return toSession(session);
}

export async function revokeAllUserSessions(userId: string): Promise<number> {
  const result = await prisma.userSession.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });

  return result.count;
}

export async function findActiveSessionsByUserId(userId: string): Promise<UserSession[]> {
  const sessions = await prisma.userSession.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastUsedAt: "desc" },
  });

  return sessions.map(toSession);
}

export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.userSession.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revokedAt: { not: null } },
      ],
    },
  });

  return result.count;
}
