import * as argon2 from "argon2";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../../libs/errors.js";
import { logger } from "../../libs/logger.js";
import * as userRepo from "../users/user.repo.js";
import * as sessionRepo from "./session.repo.js";
import * as securityService from "./security.service.js";
import { sendTourAgentInvitation } from "../../libs/email.js";
import type { SafeUser, User, UserRole } from "../users/user.types.js";
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
  AuthTokens,
  AuthResponse,
} from "./auth.types.js";
import type {
  RegisterInput,
  CompanyRegisterInput,
  ClaimRoleInput,
  CreateTourAgentInput,
  LoginInput,
  LoginMeta,
} from "./auth.schemas.js";

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function toSafeUser(user: User): Promise<SafeUser> {
  const roles = await userRepo.getUserRoles(user.id);

  let driverProfileId: string | undefined;
  let guideProfileId: string | undefined;

  if (roles.includes("DRIVER")) {
    const driver = await userRepo.getDriverProfile(user.id);
    driverProfileId = driver?.id;
  }

  if (roles.includes("GUIDE")) {
    const guide = await userRepo.getGuideProfile(user.id);
    guideProfileId = guide?.id;
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    driverProfileId,
    guideProfileId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function generateAccessToken(userId: string, roles: UserRole[], tokenVersion: number, emailVerified: boolean): string {
  const payload: AccessTokenPayload = { userId, roles, tokenVersion, emailVerified };
  return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

function generateRefreshToken(
  userId: string,
  sessionId: string,
  tokenVersion: number
): string {
  const payload: RefreshTokenPayload = { userId, sessionId, tokenVersion };
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getRefreshTokenExpiresAt(): Date {
  const expiresIn = env.REFRESH_TOKEN_EXPIRES_IN;
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return new Date(Date.now() + value * multipliers[unit]);
}

function generateSecurePassword(): string {
  // Generate a secure random password for tour agents
  return crypto.randomBytes(12).toString("base64").slice(0, 16);
}

async function createSessionAndTokens(
  user: User,
  meta?: LoginMeta
): Promise<AuthTokens> {
  const roles = await userRepo.getUserRoles(user.id);
  const accessToken = generateAccessToken(user.id, roles, user.tokenVersion, user.emailVerified);
  const tempRefreshToken = crypto.randomBytes(32).toString("hex");
  const refreshTokenHash = hashToken(tempRefreshToken);
  const expiresAt = getRefreshTokenExpiresAt();

  const session = await sessionRepo.createSession({
    userId: user.id,
    refreshTokenHash,
    expiresAt,
    userAgent: meta?.userAgent,
    ipAddress: meta?.ipAddress,
  });

  const refreshToken = generateRefreshToken(
    user.id,
    session.id,
    user.tokenVersion
  );

  await sessionRepo.updateSessionTokenHash(
    session.id,
    hashToken(refreshToken),
    expiresAt
  );

  return { accessToken, refreshToken };
}

// ==========================================
// USER REGISTRATION (default USER role)
// ==========================================

export async function register(
  input: RegisterInput,
  meta?: LoginMeta
): Promise<AuthResponse> {
  const existingUser = await userRepo.findUserByEmail(input.email);
  if (existingUser) {
    throw new ConflictError("Email already registered", "EMAIL_EXISTS");
  }

  const passwordHash = await argon2.hash(input.password);

  const user = await userRepo.createUser({
    email: input.email,
    passwordHash,
    firstName: input.firstName,
    lastName: input.lastName,
    role: "USER",
  });

  // Send verification email (async, don't block registration)
  securityService.sendVerification(user).catch((err) => {
    logger.error({ err, userId: user.id }, "Failed to send verification email");
  });

  const tokens = await createSessionAndTokens(user, meta);

  logger.info({ userId: user.id }, "User registered successfully");

  return {
    user: await toSafeUser(user),
    ...tokens,
  };
}

// ==========================================
// COMPANY REGISTRATION
// ==========================================

export async function registerCompany(
  input: CompanyRegisterInput,
  meta?: LoginMeta
): Promise<AuthResponse> {
  const existingUser = await userRepo.findUserByEmail(input.email);
  if (existingUser) {
    throw new ConflictError("Email already registered", "EMAIL_EXISTS");
  }

  const passwordHash = await argon2.hash(input.password);

  // Create user with COMPANY role
  const user = await userRepo.createUser({
    email: input.email,
    passwordHash,
    firstName: input.firstName,
    lastName: input.lastName,
    role: "COMPANY",
  });

  // Create company profile
  await userRepo.createCompanyProfile(user.id, {
    companyName: input.companyName,
    description: input.description,
    registrationNumber: input.registrationNumber,
    websiteUrl: input.websiteUrl,
    phoneNumber: input.phoneNumber,
  });

  // Send verification email
  securityService.sendVerification(user).catch((err) => {
    logger.error({ err, userId: user.id }, "Failed to send verification email");
  });

  const tokens = await createSessionAndTokens(user, meta);

  logger.info({ userId: user.id, companyName: input.companyName }, "Company registered successfully");

  return {
    user: await toSafeUser(user),
    ...tokens,
  };
}

// ==========================================
// CLAIM ROLE (GUIDE or DRIVER)
// ==========================================

export async function claimRole(
  userId: string,
  input: ClaimRoleInput
): Promise<SafeUser> {
  const user = await userRepo.findUserById(userId);
  if (!user) {
    throw new NotFoundError("User not found", "USER_NOT_FOUND");
  }

  // Check if user already has this role
  const hasRoleAlready = await userRepo.hasRole(userId, input.role);
  if (hasRoleAlready) {
    throw new BadRequestError(
      `You already have the ${input.role} role`,
      "ROLE_ALREADY_CLAIMED"
    );
  }

  // Add the role
  await userRepo.addUserRole(userId, input.role);

  // Create the corresponding profile
  if (input.role === "GUIDE") {
    await userRepo.createGuideProfile(userId, {
      bio: input.profile.bio,
      languages: input.profile.languages,
      yearsOfExperience: input.profile.yearsOfExperience,
      phoneNumber: input.profile.phoneNumber,
    });
    logger.info({ userId }, "User claimed GUIDE role");
  } else if (input.role === "DRIVER") {
    await userRepo.createDriverProfile(userId, {
      bio: input.profile.bio,
      vehicleType: input.profile.vehicleType,
      vehicleCapacity: input.profile.vehicleCapacity,
      vehicleMake: input.profile.vehicleMake,
      vehicleModel: input.profile.vehicleModel,
      vehicleYear: input.profile.vehicleYear,
      licenseNumber: input.profile.licenseNumber,
      phoneNumber: input.profile.phoneNumber,
    });
    logger.info({ userId }, "User claimed DRIVER role");
  }

  // Fetch updated user with new role
  const updatedUser = await userRepo.findUserById(userId);
  if (!updatedUser) {
    throw new NotFoundError("User not found", "USER_NOT_FOUND");
  }

  return toSafeUser(updatedUser);
}

// ==========================================
// CREATE TOUR AGENT (by companies)
// ==========================================

export interface TourAgentResult {
  user: SafeUser;
  temporaryPassword: string;
}

export async function createTourAgent(
  companyUserId: string,
  input: CreateTourAgentInput
): Promise<TourAgentResult> {
  // Verify the requester is a COMPANY
  const isCompany = await userRepo.hasRole(companyUserId, "COMPANY");
  if (!isCompany) {
    throw new ForbiddenError(
      "Only companies can create tour agent accounts",
      "NOT_A_COMPANY"
    );
  }

  // Check if email already exists
  const existingUser = await userRepo.findUserByEmail(input.email);
  if (existingUser) {
    throw new ConflictError("Email already registered", "EMAIL_EXISTS");
  }

  // Generate a temporary password
  const temporaryPassword = generateSecurePassword();
  const passwordHash = await argon2.hash(temporaryPassword);

  // Create tour agent account
  const tourAgent = await userRepo.createTourAgent({
    email: input.email,
    passwordHash,
    firstName: input.firstName,
    lastName: input.lastName,
    parentCompanyId: companyUserId,
  });

  // Send invitation email with temporary password
  sendTourAgentInvitation(
    input.email,
    input.firstName,
    temporaryPassword
  ).catch((err) => {
    logger.error({ err, tourAgentId: tourAgent.id }, "Failed to send tour agent invitation");
  });

  logger.info(
    { companyUserId, tourAgentId: tourAgent.id },
    "Tour agent created successfully"
  );

  return {
    user: await toSafeUser(tourAgent),
    temporaryPassword, // Return to company so they can share if email fails
  };
}

// ==========================================
// LOGIN
// ==========================================

export async function login(
  input: LoginInput,
  meta?: LoginMeta
): Promise<AuthResponse> {
  const user = await userRepo.findUserByEmail(input.email);
  if (!user) {
    throw new UnauthorizedError("Invalid credentials", "INVALID_CREDENTIALS");
  }

  // Check if account is locked
  await securityService.checkAccountLock(user);

  if (!user.isActive) {
    throw new UnauthorizedError("Account is disabled", "ACCOUNT_DISABLED");
  }

  const isPasswordValid = await argon2.verify(user.passwordHash, input.password);
  if (!isPasswordValid) {
    // Record failed login attempt
    await securityService.recordFailedLogin(user);
    throw new UnauthorizedError("Invalid credentials", "INVALID_CREDENTIALS");
  }

  // Reset failed login attempts on successful login
  await securityService.resetFailedLoginAttempts(user);

  const tokens = await createSessionAndTokens(user, meta);

  logger.info({ userId: user.id }, "User logged in successfully");

  return {
    user: await toSafeUser(user),
    ...tokens,
  };
}

// ==========================================
// TOKEN REFRESH
// ==========================================

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  let payload: RefreshTokenPayload;

  try {
    payload = jwt.verify(
      refreshToken,
      env.REFRESH_TOKEN_SECRET
    ) as RefreshTokenPayload;
  } catch (err) {
    // Log the actual JWT error for debugging
    const jwtError = err as Error & { name?: string };
    logger.warn(
      {
        err,
        errorName: jwtError.name,
        tokenPreview: refreshToken ? `${refreshToken.substring(0, 20)}...` : 'empty'
      },
      "Invalid refresh token"
    );

    // Provide specific error codes for different JWT failures
    if (jwtError.name === 'TokenExpiredError') {
      throw new UnauthorizedError("Refresh token has expired", "REFRESH_TOKEN_EXPIRED");
    }
    if (jwtError.name === 'JsonWebTokenError') {
      throw new UnauthorizedError("Malformed refresh token", "MALFORMED_REFRESH_TOKEN");
    }
    throw new UnauthorizedError("Invalid refresh token", "INVALID_REFRESH_TOKEN");
  }

  const session = await sessionRepo.findActiveSessionById(payload.sessionId);
  if (!session) {
    throw new UnauthorizedError("Session not found or revoked", "SESSION_REVOKED");
  }

  const user = await userRepo.findUserById(payload.userId);
  if (!user) {
    throw new UnauthorizedError("User not found", "USER_NOT_FOUND");
  }

  if (user.tokenVersion !== payload.tokenVersion) {
    throw new UnauthorizedError("Token has been revoked", "TOKEN_REVOKED");
  }

  const roles = await userRepo.getUserRoles(user.id);
  const accessToken = generateAccessToken(user.id, roles, user.tokenVersion, user.emailVerified);
  const newRefreshToken = generateRefreshToken(
    user.id,
    session.id,
    user.tokenVersion
  );

  await sessionRepo.updateSessionTokenHash(
    session.id,
    hashToken(newRefreshToken),
    getRefreshTokenExpiresAt()
  );

  return { accessToken, refreshToken: newRefreshToken };
}

// ==========================================
// LOGOUT
// ==========================================

export async function logout(refreshToken: string): Promise<void> {
  let payload: RefreshTokenPayload;

  try {
    payload = jwt.verify(
      refreshToken,
      env.REFRESH_TOKEN_SECRET
    ) as RefreshTokenPayload;
  } catch {
    throw new UnauthorizedError("Invalid refresh token", "INVALID_REFRESH_TOKEN");
  }

  const session = await sessionRepo.findSessionById(payload.sessionId);
  if (!session) {
    throw new UnauthorizedError("Session not found", "SESSION_NOT_FOUND");
  }

  await sessionRepo.revokeSession(session.id);
}

export async function logoutAll(userId: string): Promise<{ revokedCount: number }> {
  await userRepo.incrementTokenVersion(userId);
  const revokedCount = await sessionRepo.revokeAllUserSessions(userId);
  return { revokedCount };
}

// ==========================================
// GET CURRENT USER
// ==========================================

export async function getCurrentUser(userId: string): Promise<SafeUser> {
  const user = await userRepo.findUserById(userId);
  if (!user) {
    throw new NotFoundError("User not found", "USER_NOT_FOUND");
  }

  return toSafeUser(user);
}

// ==========================================
// GET TOUR AGENTS (for companies)
// ==========================================

export async function getTourAgents(companyUserId: string): Promise<SafeUser[]> {
  // Verify the requester is a COMPANY
  const isCompany = await userRepo.hasRole(companyUserId, "COMPANY");
  if (!isCompany) {
    throw new ForbiddenError(
      "Only companies can view tour agents",
      "NOT_A_COMPANY"
    );
  }

  const tourAgents = await userRepo.getTourAgentsByCompany(companyUserId);

  return Promise.all(tourAgents.map(toSafeUser));
}
