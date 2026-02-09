import type { FastifyInstance } from "fastify";
import * as authController from "./auth.controller.js";
import { authGuard, authGuardNoEmailCheck, requireRole } from "../../middlewares/authGuard.js";
import { createRateLimitConfig } from "../../config/rateLimit.js";

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // ==========================================
  // CSRF TOKEN ENDPOINT
  // ==========================================

  // Get CSRF token for state-changing requests
  // Client should call this and include the token in X-CSRF-Token header
  fastify.get("/auth/csrf-token", authController.getCsrfToken);

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

  // Logout all - requires auth (no email check — unverified users can still logout)
  fastify.post(
    "/auth/logout-all",
    { preHandler: [authGuardNoEmailCheck], config: createRateLimitConfig("logout") },
    authController.logoutAll
  );

  // Get current user - no email check (client needs user data to show verify-email page)
  fastify.get("/auth/me", { preHandler: [authGuardNoEmailCheck] }, authController.me);

  // ==========================================
  // ROLE MANAGEMENT
  // ==========================================

  // Claim GUIDE or DRIVER role (authGuard enforces verified email)
  fastify.post(
    "/auth/claim-role",
    {
      preHandler: [authGuard],
      config: createRateLimitConfig("login") // Moderate limit
    },
    authController.claimRole
  );

  // ==========================================
  // TOUR AGENT MANAGEMENT (Companies only)
  // ==========================================

  // Create tour agent sub-account (authGuard enforces verified email)
  fastify.post(
    "/auth/tour-agents",
    {
      preHandler: [authGuard, requireRole("COMPANY")],
      config: createRateLimitConfig("login")
    },
    authController.createTourAgent
  );

  // Get all tour agents for this company (authGuard enforces verified email)
  fastify.get(
    "/auth/tour-agents",
    {
      preHandler: [authGuard, requireRole("COMPANY")]
    },
    authController.getTourAgents
  );

  // Accept tour agent invitation and set password (public - no auth required)
  fastify.post(
    "/auth/accept-invitation",
    { config: createRateLimitConfig("resetPassword") }, // Same limit as password reset
    authController.acceptInvitation
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
