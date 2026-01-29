import type { FastifyRequest, FastifyReply, preHandlerHookHandler } from "fastify";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { UnauthorizedError, ForbiddenError } from "../libs/errors.js";
import type { AccessTokenPayload, JwtUser } from "../modules/auth/auth.types.js";
import type { UserRole } from "../modules/users/user.types.js";
import { prisma } from "../libs/prisma.js";

declare module "fastify" {
  interface FastifyRequest {
    user: JwtUser;
  }
}

/**
 * Verifies JWT access token and attaches user to request.
 * Also checks tokenVersion against database to ensure immediate invalidation
 * after password reset or logout-all operations.
 * Use as preHandler for protected routes.
 */
export async function authGuard(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new UnauthorizedError("Authorization header missing", "NO_AUTH_HEADER");
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw new UnauthorizedError("Invalid authorization format", "INVALID_AUTH_FORMAT");
  }

  const token = parts[1];

  try {
    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as AccessTokenPayload;

    // Check tokenVersion against database to ensure token is still valid
    // This allows immediate invalidation after password reset or logout-all
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        tokenVersion: true,
        isActive: true,
        deletedAt: true,
        roles: { select: { role: true } }, // Fetch fresh roles
      },
    });

    if (!user || user.deletedAt !== null) {
      throw new UnauthorizedError("User not found", "USER_NOT_FOUND");
    }

    if (!user.isActive) {
      throw new UnauthorizedError("Account is deactivated", "ACCOUNT_DEACTIVATED");
    }

    // Verify tokenVersion matches - if not, the token was invalidated
    if (payload.tokenVersion !== undefined && user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedError("Session has been invalidated", "SESSION_INVALIDATED");
    }

    request.user = {
      id: payload.userId,
      roles: user.roles.map((r) => r.role), // Use fresh roles from DB
      emailVerified: payload.emailVerified || false,
    };
  } catch (error) {
    // Differentiate between expired and invalid tokens without leaking internal details
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError("Token has expired", "TOKEN_EXPIRED");
    }
    // Re-throw our custom errors
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError("Invalid token", "INVALID_TOKEN");
  }
}

/**
 * Check if user has ANY of the specified roles
 */
function hasAnyRole(userRoles: UserRole[], requiredRoles: UserRole[]): boolean {
  return requiredRoles.some(role => userRoles.includes(role));
}

/**
 * Check if user has ALL of the specified roles
 */
function hasAllRoles(userRoles: UserRole[], requiredRoles: UserRole[]): boolean {
  return requiredRoles.every(role => userRoles.includes(role));
}

/**
 * Factory function that returns a preHandler requiring specific role(s).
 * Must be used AFTER authGuard (request.user must exist).
 * User must have AT LEAST ONE of the specified roles.
 * 
 * Usage:
 *   { preHandler: [authGuard, requireRole("ADMIN")] }
 *   { preHandler: [authGuard, requireRole(["ADMIN", "COMPANY"])] }
 */
export function requireRole(
  allowedRoles: UserRole | UserRole[]
): preHandlerHookHandler {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authentication required", "AUTH_REQUIRED");
    }

    const userRoles = request.user.roles;

    if (!hasAnyRole(userRoles, roles)) {
      throw new ForbiddenError(
        "You do not have permission to perform this action",
        "INSUFFICIENT_PERMISSIONS"
      );
    }
  };
}

/**
 * Factory function that returns a preHandler requiring ALL specified roles.
 * Must be used AFTER authGuard (request.user must exist).
 * 
 * Usage:
 *   { preHandler: [authGuard, requireAllRoles(["COMPANY", "GUIDE"])] }
 */
export function requireAllRoles(
  requiredRoles: UserRole[]
): preHandlerHookHandler {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authentication required", "AUTH_REQUIRED");
    }

    const userRoles = request.user.roles;

    if (!hasAllRoles(userRoles, requiredRoles)) {
      throw new ForbiddenError(
        "You do not have all required permissions",
        "INSUFFICIENT_PERMISSIONS"
      );
    }
  };
}

/**
 * Allows access if user is ADMIN or if the :id param matches the logged-in user's ID.
 * Must be used AFTER authGuard (request.user must exist).
 * 
 * Usage for routes like PATCH /users/:id:
 *   { preHandler: [authGuard, requireSelfOrAdmin] }
 */
export async function requireSelfOrAdmin(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  if (!request.user) {
    throw new UnauthorizedError("Authentication required", "AUTH_REQUIRED");
  }

  const params = request.params as { id?: string };
  const targetUserId = params.id;

  if (!targetUserId) {
    throw new ForbiddenError("Resource ID is required", "MISSING_RESOURCE_ID");
  }

  const currentUserId = request.user.id;
  const userRoles = request.user.roles;

  const isAdmin = userRoles.includes("ADMIN");
  const isSelf = currentUserId === targetUserId;

  if (!isAdmin && !isSelf) {
    throw new ForbiddenError(
      "You can only access your own resources",
      "ACCESS_DENIED"
    );
  }
}
