import type { FastifyRequest, FastifyReply } from "fastify";
import { successResponse, paginatedResponse } from "../../libs/response.js";
import { PaginationSchema } from "../../libs/pagination.js";
import { ValidationError, NotFoundError } from "../../libs/errors.js";
import * as userService from "./user.service.js";
import { adminUnlockAccount } from "../auth/security.service.js";
import {
  createUserSchema,
  updateUserSelfSchema,
  updateUserAdminSchema,
  updateUserRoleSchema,
  userIdParamSchema,
} from "./user.schemas.js";

// Admin-only: create user with optional role
export async function createUser(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parsed = createUserSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const user = await userService.createUser(parsed.data);

  return reply.status(201).send(successResponse("User created successfully", user));
}

export async function getUserById(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const paramsParsed = userIdParamSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    throw new ValidationError(paramsParsed.error.errors[0].message);
  }

  const user = await userService.getUserById(paramsParsed.data.id);

  return reply.send(successResponse("User retrieved successfully", user));
}

// Admin-only: get all users
export async function getAllUsers(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Validate pagination params
  const paginationParsed = PaginationSchema.safeParse(request.query);
  if (!paginationParsed.success) {
    throw new ValidationError(paginationParsed.error.errors[0].message);
  }

  const { page, limit } = paginationParsed.data;

  const { items, totalItems } = await userService.getAllUsers(page, limit);

  return reply.send(
    paginatedResponse("Users retrieved successfully", items, page, limit, totalItems)
  );
}

// Self-or-admin: update user
// If user is admin, use admin schema (can update role, isActive)
// If user is self, use self schema (cannot update role, isActive)
export async function updateUser(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const paramsParsed = userIdParamSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    throw new ValidationError(paramsParsed.error.errors[0].message);
  }

  const targetUserId = paramsParsed.data.id;
  const isAdmin = request.user.roles.includes("ADMIN");

  if (isAdmin) {
    // Admin can update any field
    const bodyParsed = updateUserAdminSchema.safeParse(request.body);
    if (!bodyParsed.success) {
      throw new ValidationError(bodyParsed.error.errors[0].message);
    }
    const user = await userService.updateUserAdmin(targetUserId, bodyParsed.data);
    return reply.send(successResponse("User updated successfully", user));
  } else {
    // Non-admin can only update profile fields (no role, no isActive)
    const bodyParsed = updateUserSelfSchema.safeParse(request.body);
    if (!bodyParsed.success) {
      throw new ValidationError(bodyParsed.error.errors[0].message);
    }
    const user = await userService.updateUserSelf(targetUserId, bodyParsed.data);
    return reply.send(successResponse("User updated successfully", user));
  }
}

// Admin-only: update user role
export async function updateUserRole(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const paramsParsed = userIdParamSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    throw new ValidationError(paramsParsed.error.errors[0].message);
  }

  const bodyParsed = updateUserRoleSchema.safeParse(request.body);
  if (!bodyParsed.success) {
    throw new ValidationError(bodyParsed.error.errors[0].message);
  }

  const user = await userService.updateUserRole(paramsParsed.data.id, bodyParsed.data);

  return reply.send(successResponse("User role updated successfully", user));
}

// Admin-only: remove user role
export async function removeUserRole(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const paramsParsed = userIdParamSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    throw new ValidationError(paramsParsed.error.errors[0].message);
  }

  // Schema reuse: updateUserRoleSchema validates "role" body/param
  // Since we are passing role in params, we need to validate it
  const { role } = request.params as { role: string };
  const roleParsed = updateUserRoleSchema.safeParse({ role });

  if (!roleParsed.success) {
    throw new ValidationError(roleParsed.error.errors[0].message);
  }

  const user = await userService.removeUserRole(paramsParsed.data.id, roleParsed.data);

  return reply.send(successResponse("User role removed successfully", user));
}

// Self-or-admin: delete user
export async function deleteUser(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const paramsParsed = userIdParamSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    throw new ValidationError(paramsParsed.error.errors[0].message);
  }

  await userService.deleteUser(paramsParsed.data.id);

  return reply.send(successResponse("User deleted successfully", null));
}

// Admin-only: unlock user account
export async function unlockUserAccount(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const paramsParsed = userIdParamSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    throw new ValidationError(paramsParsed.error.errors[0].message);
  }

  const unlocked = await adminUnlockAccount(paramsParsed.data.id);

  if (!unlocked) {
    throw new NotFoundError("User not found or account was not locked", "USER_NOT_LOCKED");
  }

  return reply.send(successResponse("User account unlocked successfully", null));
}

// Admin-only: restore soft-deleted user
export async function restoreUser(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const paramsParsed = userIdParamSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    throw new ValidationError(paramsParsed.error.errors[0].message);
  }

  const user = await userService.restoreUser(paramsParsed.data.id);

  return reply.send(successResponse("User restored successfully", user));
}
