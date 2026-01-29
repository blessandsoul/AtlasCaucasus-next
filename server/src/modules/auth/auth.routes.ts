import type { FastifyInstance } from "fastify";
import * as authController from "./auth.controller.js";
import { authGuard, requireRole } from "../../middlewares/authGuard.js";
import { requireVerifiedEmail } from "../../middlewares/requireVerifiedEmail.js";
import { createRateLimitConfig } from "../../config/rateLimit.js";

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // ==========================================
  // CORE AUTH ENDPOINTS
  // ==========================================

  // User Registration (default USER role)
  fastify.post(
    "/auth/register",
    { config: createRateLimitConfig("register") },
    authController.register
  );

  // Company Registration (COMPANY role + profile)
  fastify.post(
    "/auth/register-company",
    { config: createRateLimitConfig("register") },
    authController.registerCompany
  );

  // Login - strict limit (5 requests per 15 minutes per IP)
  fastify.post(
    "/auth/login",
    { config: createRateLimitConfig("login") },
    authController.login
  );

  // Token refresh - moderate limit
  fastify.post(
    "/auth/refresh",
    { config: createRateLimitConfig("refresh") },
    authController.refresh
  );

  // Logout - light limit
  fastify.post(
    "/auth/logout",
    { config: createRateLimitConfig("logout") },
    authController.logout
  );

  // Logout all - requires auth, light limit
  fastify.post(
    "/auth/logout-all",
    { preHandler: [authGuard], config: createRateLimitConfig("logout") },
    authController.logoutAll
  );

  // Get current user - no rate limit (protected by auth)
  fastify.get("/auth/me", { preHandler: [authGuard] }, authController.me);

  // ==========================================
  // ROLE MANAGEMENT
  // ==========================================

  // Claim GUIDE or DRIVER role (requires auth and verified email)
  fastify.post(
    "/auth/claim-role",
    {
      preHandler: [authGuard, requireVerifiedEmail],
      config: createRateLimitConfig("login") // Moderate limit
    },
    authController.claimRole
  );

  // ==========================================
  // TOUR AGENT MANAGEMENT (Companies only)
  // ==========================================

  // Create tour agent sub-account (requires COMPANY role and verified email)
  fastify.post(
    "/auth/tour-agents",
    {
      preHandler: [authGuard, requireVerifiedEmail, requireRole("COMPANY")],
      config: createRateLimitConfig("login")
    },
    authController.createTourAgent
  );

  // Get all tour agents for this company (requires COMPANY role and verified email)
  fastify.get(
    "/auth/tour-agents",
    {
      preHandler: [authGuard, requireVerifiedEmail, requireRole("COMPANY")]
    },
    authController.getTourAgents
  );

  // ==========================================
  // EMAIL VERIFICATION
  // ==========================================

  // Verify email with token
  fastify.post(
    "/auth/verify-email",
    { config: createRateLimitConfig("resendVerification") },
    authController.verifyEmail
  );

  // Resend verification email
  fastify.post(
    "/auth/resend-verification",
    { config: createRateLimitConfig("resendVerification") },
    authController.resendVerification
  );

  // ==========================================
  // PASSWORD RESET
  // ==========================================

  // Request password reset (forgot password)
  fastify.post(
    "/auth/forgot-password",
    { config: createRateLimitConfig("forgotPassword") },
    authController.forgotPassword
  );

  // Reset password with token
  fastify.post(
    "/auth/reset-password",
    { config: createRateLimitConfig("resetPassword") },
    authController.resetPassword
  );
}
