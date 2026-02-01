import type { FastifyInstance } from "fastify";
import * as userController from "./user.controller.js";
import { authGuard, requireRole, requireSelfOrAdmin } from "../../middlewares/authGuard.js";
import { requireVerifiedEmail } from "../../middlewares/requireVerifiedEmail.js";

export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  // Admin-only: create user with optional role
  fastify.post(
    "/users",
    { preHandler: [authGuard, requireRole("ADMIN")] },
    userController.createUser
  );

  // Admin-only: list all users
  fastify.get(
    "/users",
    { preHandler: [authGuard, requireRole("ADMIN")] },
    userController.getAllUsers
  );

  // Self-or-admin: get user by ID
  fastify.get(
    "/users/:id",
    { preHandler: [authGuard, requireSelfOrAdmin] },
    userController.getUserById
  );

  // Self-or-admin: update user (controller enforces field restrictions for non-admins)
  fastify.patch(
    "/users/:id",
    { preHandler: [authGuard, requireVerifiedEmail, requireSelfOrAdmin] },
    userController.updateUser
  );

  // Admin-only: update user role
  fastify.patch(
    "/users/:id/role",
    { preHandler: [authGuard, requireRole("ADMIN")] },
    userController.updateUserRole
  );

  // Admin-only: remove user role
  fastify.delete(
    "/users/:id/roles/:role",
    { preHandler: [authGuard, requireRole("ADMIN")] },
    userController.removeUserRole
  );

  // Self-or-admin: delete user
  fastify.delete(
    "/users/:id",
    { preHandler: [authGuard, requireVerifiedEmail, requireSelfOrAdmin] },
    userController.deleteUser
  );

  // Admin-only: unlock user account (removes lockout and resets failed attempts)
  fastify.post(
    "/users/:id/unlock",
    { preHandler: [authGuard, requireRole("ADMIN")] },
    userController.unlockUserAccount
  );

  // Admin-only: restore soft-deleted user
  fastify.post(
    "/users/:id/restore",
    { preHandler: [authGuard, requireRole("ADMIN")] },
    userController.restoreUser
  );
}
