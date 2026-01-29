import type { FastifyRequest, FastifyReply } from "fastify";
import { successResponse } from "../../libs/response.js";
import { ValidationError } from "../../libs/errors.js";
import * as authService from "./auth.service.js";
import * as securityService from "./security.service.js";
import {
  registerSchema,
  companyRegisterSchema,
  claimRoleSchema,
  createTourAgentSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.schemas.js";

function getLoginMeta(request: FastifyRequest) {
  return {
    userAgent: request.headers["user-agent"],
    ipAddress: request.ip,
  };
}

// ==========================================
// USER REGISTRATION (default USER role)
// ==========================================

export async function register(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const result = await authService.register(parsed.data, getLoginMeta(request));

  return reply.status(201).send(
    successResponse("User registered successfully. Please check your email to verify your account.", result)
  );
}

// ==========================================
// COMPANY REGISTRATION
// ==========================================

export async function registerCompany(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parsed = companyRegisterSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const result = await authService.registerCompany(parsed.data, getLoginMeta(request));

  return reply.status(201).send(
    successResponse(
      "Company registered successfully. Please verify your email. Note: Company must be verified by admin before public listings.",
      result
    )
  );
}

// ==========================================
// CLAIM ROLE (GUIDE or DRIVER)
// ==========================================

export async function claimRole(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parsed = claimRoleSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const user = await authService.claimRole(request.user.id, parsed.data);

  return reply.send(
    successResponse(`Successfully claimed ${parsed.data.role} role`, { user })
  );
}

// ==========================================
// CREATE TOUR AGENT (by companies)
// ==========================================

export async function createTourAgent(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parsed = createTourAgentSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const result = await authService.createTourAgent(request.user.id, parsed.data);

  return reply.status(201).send(
    successResponse("Tour agent created successfully. Invitation email sent.", {
      user: result.user,
      temporaryPassword: result.temporaryPassword, // Only shown once
    })
  );
}

// ==========================================
// GET TOUR AGENTS (for companies)
// ==========================================

export async function getTourAgents(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const tourAgents = await authService.getTourAgents(request.user.id);

  return reply.send(
    successResponse("Tour agents retrieved", { tourAgents })
  );
}

// ==========================================
// LOGIN
// ==========================================

export async function login(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const result = await authService.login(parsed.data, getLoginMeta(request));

  return reply.send(successResponse("Logged in successfully", result));
}

// ==========================================
// TOKEN MANAGEMENT
// ==========================================

export async function refresh(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parsed = refreshSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const tokens = await authService.refresh(parsed.data.refreshToken);

  return reply.send(successResponse("Token refreshed", tokens));
}

export async function logout(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parsed = logoutSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  await authService.logout(parsed.data.refreshToken);

  return reply.send(successResponse("Logged out successfully", null));
}

export async function me(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const user = await authService.getCurrentUser(request.user.id);

  return reply.send(successResponse("Current user retrieved", { user }));
}

export async function logoutAll(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const result = await authService.logoutAll(request.user.id);

  return reply.send(
    successResponse("Logged out from all devices", result)
  );
}

// ==========================================
// EMAIL VERIFICATION
// ==========================================

export async function verifyEmail(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parsed = verifyEmailSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const result = await securityService.verifyEmail(parsed.data.token);

  return reply.send(successResponse(result.message, null));
}

export async function resendVerification(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parsed = resendVerificationSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const result = await securityService.resendVerification(parsed.data.email);

  return reply.send(successResponse(result.message, null));
}

// ==========================================
// PASSWORD RESET
// ==========================================

export async function forgotPassword(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parsed = forgotPasswordSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const result = await securityService.requestPasswordReset(parsed.data.email);

  return reply.send(successResponse(result.message, null));
}

export async function resetPassword(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parsed = resetPasswordSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const result = await securityService.resetPassword(
    parsed.data.token,
    parsed.data.newPassword
  );

  return reply.send(successResponse(result.message, null));
}
