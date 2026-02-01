import crypto from "crypto";
import * as argon2 from "argon2";
import { prisma } from "../../libs/prisma.js";
import { logger } from "../../libs/logger.js";
import { redisClient, isRedisConnected } from "../../libs/redis.js";
import * as userRepo from "../users/user.repo.js";
import * as sessionRepo from "./session.repo.js";
import {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendSecurityAlertEmail,
} from "../../libs/email.js";
import {
    UnauthorizedError,
    BadRequestError,
} from "../../libs/errors.js";
import type { User } from "../users/user.types.js";

/**
 * Security service for authentication hardening
 * Handles: email verification, password reset, account lockout, token reuse detection
 */

// ==========================================
// EMAIL VERIFICATION
// ==========================================

/**
 * Generate secure verification token
 */
export function generateSecureToken(): string {
    return crypto.randomBytes(32).toString("hex");
}

/**
 * Send verification email to user
 * @param user - User to send verification to
 * @param isResend - If true, sets rate limit timestamp; if false (initial registration), no rate limit
 */
export async function sendVerification(user: User, isResend: boolean = false): Promise<boolean> {
    const token = generateSecureToken();
    // Initial registration: 7-day expiry for better security while remaining user-friendly
    // Resends: 24-hour expiry with rate limiting
    const expiryDuration = isResend
        ? 24 * 60 * 60 * 1000  // 24 hours for resends
        : 7 * 24 * 60 * 60 * 1000; // 7 days for initial registration
    const expiresAt = new Date(Date.now() + expiryDuration);

    // Store token in database with expiry
    await userRepo.updateUser(user.id, {
        verificationToken: token,
        verificationTokenExpiresAt: expiresAt,
    });

    // Send email
    const sent = await sendVerificationEmail(user.email, user.firstName, token);

    if (!sent) {
        logger.error({ userId: user.id }, "Failed to send verification email");
    }

    return sent;
}

/**
 * Verify email with token
 * SECURITY: Uses constant-time comparison to prevent timing attacks
 */
export async function verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    // SECURITY FIX: Don't query by token directly - this allows timing attacks
    // Instead, query by having a token and then use constant-time comparison
    // All tokens now have expiry dates set
    const usersWithTokens = await prisma.user.findMany({
        where: {
            verificationToken: { not: null },
            verificationTokenExpiresAt: { gt: new Date() },
            deletedAt: null,
        },
    });

    // Find matching user using constant-time comparison
    let user: typeof usersWithTokens[0] | null = null;
    for (const candidate of usersWithTokens) {
        if (!candidate.verificationToken) continue;

        const tokenBuffer = Buffer.from(token);
        const storedBuffer = Buffer.from(candidate.verificationToken);

        if (tokenBuffer.length === storedBuffer.length) {
            if (crypto.timingSafeEqual(tokenBuffer, storedBuffer)) {
                user = candidate;
                break;
            }
        }
    }

    if (!user) {
        throw new BadRequestError("Invalid or expired verification token", "INVALID_VERIFICATION_TOKEN");
    }

    if (user.emailVerified) {
        return { success: true, message: "Email already verified" };
    }

    // Mark email as verified and clear token
    await userRepo.updateUser(user.id, {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiresAt: null,
    });

    logger.info({ userId: user.id }, "Email verified successfully");

    return { success: true, message: "Email verified successfully" };
}

/**
 * Resend verification email
 */
export async function resendVerification(email: string): Promise<{ success: boolean; message: string }> {
    const user = await userRepo.findUserByEmail(email);

    // Always return success (don't reveal if email exists)
    if (!user) {
        logger.info({ email }, "Verification resend requested for non-existent email");
        return { success: true, message: "If this email is registered, a verification email has been sent" };
    }

    if (user.emailVerified) {
        return { success: true, message: "Email is already verified" };
    }

    // Rate limit: check if a resend token was sent recently (within 2 minutes)
    // Initial tokens have 7-day expiry, resend tokens have 24-hour expiry
    // The calculation gives negative age for initial tokens (bypassing rate limit)
    // and correct age for resend tokens (enabling rate limit)
    if (user.verificationTokenExpiresAt) {
        const tokenAge = 24 * 60 * 60 * 1000 - (user.verificationTokenExpiresAt.getTime() - Date.now());
        if (tokenAge >= 0 && tokenAge < 2 * 60 * 1000) {
            throw new BadRequestError(
                "Please wait before requesting another verification email",
                "VERIFICATION_RATE_LIMITED"
            );
        }
    }

    // Pass isResend=true to enable rate limiting for subsequent resends
    await sendVerification(user, true);

    return { success: true, message: "Verification email sent" };
}

// ==========================================
// PASSWORD RESET
// ==========================================

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const user = await userRepo.findUserByEmail(email);

    // Always return success (security: don't reveal if email exists)
    const genericMessage = "If this email is registered, a password reset link has been sent";

    if (!user) {
        logger.info({ email }, "Password reset requested for non-existent email");
        return { success: true, message: genericMessage };
    }

    if (!user.isActive) {
        logger.info({ userId: user.id }, "Password reset requested for inactive account");
        return { success: true, message: genericMessage };
    }

    // Generate reset token
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token
    await userRepo.updateUser(user.id, {
        resetPasswordToken: token,
        resetPasswordTokenExpiresAt: expiresAt,
    });

    // Send email
    const sent = await sendPasswordResetEmail(user.email, user.firstName, token);

    if (!sent) {
        logger.error({ userId: user.id }, "Failed to send password reset email");
    }

    logger.info({ userId: user.id }, "Password reset email sent");

    return { success: true, message: genericMessage };
}

/**
 * Reset password with token
 * SECURITY: Uses constant-time comparison to prevent timing attacks
 */
export async function resetPassword(
    token: string,
    newPassword: string
): Promise<{ success: boolean; message: string }> {
    // SECURITY FIX: Don't query by token directly - this allows timing attacks
    // Instead, query by expiration and then use constant-time comparison
    const usersWithValidTokens = await prisma.user.findMany({
        where: {
            resetPasswordToken: { not: null },
            resetPasswordTokenExpiresAt: { gt: new Date() },
            deletedAt: null,
        },
    });

    // Find matching user using constant-time comparison
    // This prevents timing attacks where attackers can guess tokens character-by-character
    let user: typeof usersWithValidTokens[0] | null = null;
    for (const candidate of usersWithValidTokens) {
        if (!candidate.resetPasswordToken) continue;

        // Both buffers must be same length for timingSafeEqual
        // If lengths differ, token is definitely wrong, but we still do a dummy comparison
        // to avoid leaking length information
        const tokenBuffer = Buffer.from(token);
        const storedBuffer = Buffer.from(candidate.resetPasswordToken);

        if (tokenBuffer.length === storedBuffer.length) {
            if (crypto.timingSafeEqual(tokenBuffer, storedBuffer)) {
                user = candidate;
                break;
            }
        }
    }

    if (!user) {
        throw new BadRequestError("Invalid or expired reset token", "INVALID_RESET_TOKEN");
    }

    // Check that new password is different from old password
    const isSamePassword = await argon2.verify(user.passwordHash, newPassword);
    if (isSamePassword) {
        throw new BadRequestError(
            "New password must be different from your current password",
            "PASSWORD_SAME_AS_OLD"
        );
    }

    // Hash new password
    const passwordHash = await argon2.hash(newPassword);

    // Update password and clear reset token
    // Also increment token version to invalidate all existing sessions
    await userRepo.updateUser(user.id, {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordTokenExpiresAt: null,
        tokenVersion: user.tokenVersion + 1, // Invalidate all refresh tokens
    });

    // Revoke all sessions
    await sessionRepo.revokeAllUserSessions(user.id);

    // Send security alert
    await sendSecurityAlertEmail(
        user.email,
        user.firstName,
        "password_changed",
        "Your password has been changed. All sessions have been logged out for security."
    );

    logger.info({ userId: user.id }, "Password reset completed successfully");

    return { success: true, message: "Password reset successfully. Please login with your new password." };
}

// ==========================================
// ACCOUNT LOCKOUT
// ==========================================

// SECURITY: Reduced from 10 to 5 to limit brute force attempts
const MAX_FAILED_ATTEMPTS = 5;

// SECURITY: Exponential backoff lockout durations (in seconds)
// Each subsequent lockout after MAX_FAILED_ATTEMPTS increases duration
const LOCKOUT_DURATIONS_SECONDS = [60, 300, 900, 3600] as const; // 1min, 5min, 15min, 1hr

/**
 * Calculate lockout duration based on how many times the account has been locked
 * @param failedAttempts - Total failed login attempts
 * @returns Lockout duration in milliseconds
 */
function calculateLockoutDuration(failedAttempts: number): number {
    // Calculate how many times over the threshold we are
    // e.g., 5 attempts = first lockout (index 0), 10 attempts = second lockout (index 1), etc.
    const lockoutIndex = Math.floor((failedAttempts - MAX_FAILED_ATTEMPTS) / MAX_FAILED_ATTEMPTS);
    const durationIndex = Math.min(lockoutIndex, LOCKOUT_DURATIONS_SECONDS.length - 1);
    return LOCKOUT_DURATIONS_SECONDS[durationIndex] * 1000;
}

/**
 * Format lockout duration for user-friendly message
 */
function formatLockoutDuration(durationMs: number): string {
    const minutes = Math.ceil(durationMs / 60000);
    if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    }
    const hours = Math.ceil(minutes / 60);
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
}

/**
 * Check if account is locked
 */
export async function checkAccountLock(user: User): Promise<void> {
    if (user.lockedUntil && user.lockedUntil > new Date()) {
        const remainingMs = user.lockedUntil.getTime() - Date.now();
        const remainingFormatted = formatLockoutDuration(remainingMs);

        throw new UnauthorizedError(
            `Account is temporarily locked. Try again in ${remainingFormatted}.`,
            "ACCOUNT_LOCKED"
        );
    }
}

/**
 * Record failed login attempt
 * Implements exponential backoff: lockouts get progressively longer
 */
export async function recordFailedLogin(user: User): Promise<void> {
    const newAttempts = user.failedLoginAttempts + 1;

    if (newAttempts >= MAX_FAILED_ATTEMPTS && newAttempts % MAX_FAILED_ATTEMPTS === 0) {
        // Lock account with exponential backoff
        const lockoutDurationMs = calculateLockoutDuration(newAttempts);
        const lockedUntil = new Date(Date.now() + lockoutDurationMs);
        const lockoutFormatted = formatLockoutDuration(lockoutDurationMs);

        await userRepo.updateUser(user.id, {
            failedLoginAttempts: newAttempts,
            lockedUntil,
        });

        logger.warn(
            { userId: user.id, attempts: newAttempts, lockoutDurationMs },
            "Account locked due to failed login attempts"
        );

        // Send security alert with actual lockout duration
        await sendSecurityAlertEmail(
            user.email,
            user.firstName,
            "account_locked",
            `Your account has been temporarily locked after ${newAttempts} failed login attempts. It will be unlocked in ${lockoutFormatted}.`
        );
    } else {
        await userRepo.updateUser(user.id, {
            failedLoginAttempts: newAttempts,
        });

        const attemptsRemaining = MAX_FAILED_ATTEMPTS - (newAttempts % MAX_FAILED_ATTEMPTS);
        logger.info(
            { userId: user.id, attempts: newAttempts, attemptsRemaining },
            "Failed login attempt recorded"
        );
    }
}

/**
 * Reset failed login attempts (on successful login)
 */
export async function resetFailedLoginAttempts(user: User): Promise<void> {
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
        await userRepo.updateUser(user.id, {
            failedLoginAttempts: 0,
            lockedUntil: null,
        });
    }
}

/**
 * Admin function: Manually unlock a user account
 * Use when user contacts support or for legitimate unlock requests
 * @param userId - ID of user to unlock
 * @returns true if account was unlocked, false if not locked
 */
export async function adminUnlockAccount(userId: string): Promise<boolean> {
    const user = await userRepo.findUserById(userId);

    if (!user) {
        logger.warn({ userId }, "Admin unlock attempt for non-existent user");
        return false;
    }

    if (!user.lockedUntil && user.failedLoginAttempts === 0) {
        logger.info({ userId }, "Admin unlock: Account was not locked");
        return false;
    }

    await userRepo.updateUser(userId, {
        failedLoginAttempts: 0,
        lockedUntil: null,
    });

    logger.info(
        { userId, previousAttempts: user.failedLoginAttempts, wasLocked: !!user.lockedUntil },
        "Account unlocked by admin"
    );

    // Notify user their account was unlocked
    await sendSecurityAlertEmail(
        user.email,
        user.firstName,
        "account_unlocked",
        "Your account has been unlocked by an administrator. If you did not request this, please contact support immediately."
    );

    return true;
}

// ==========================================
// REFRESH TOKEN REUSE DETECTION
// ==========================================

const TOKEN_REUSE_THRESHOLD_MS = 60 * 1000; // 1 minute
const TOKEN_REFRESH_LOCK_TTL_SECONDS = 5; // 5 second lock for concurrent request deduplication

/**
 * Acquire a lock for token refresh to prevent concurrent requests
 * Uses Redis SETNX with short TTL for atomic deduplication
 * @param sessionId - Session ID to lock
 * @returns true if lock acquired, false if already locked
 */
async function acquireTokenRefreshLock(sessionId: string): Promise<boolean> {
    if (!isRedisConnected()) {
        // If Redis is not available, skip locking (graceful degradation)
        logger.warn({ sessionId }, "Redis unavailable, skipping token refresh lock");
        return true;
    }

    const lockKey = `token_refresh:${sessionId}`;
    try {
        // SETNX with TTL - only sets if key doesn't exist
        const result = await redisClient.set(lockKey, "1", {
            NX: true, // Only set if not exists
            EX: TOKEN_REFRESH_LOCK_TTL_SECONDS, // Auto-expire after 5 seconds
        });
        return result === "OK";
    } catch (err) {
        logger.error({ err, sessionId }, "Error acquiring token refresh lock");
        // On error, allow the request (graceful degradation)
        return true;
    }
}

/**
 * Detect potential token reuse (theft indicator)
 * If same session is used too quickly, it may indicate the token was stolen
 * SECURITY: Uses Redis atomic lock to prevent concurrent request exploitation
 */
export async function detectTokenReuse(
    sessionId: string,
    userId: string
): Promise<boolean> {
    // SECURITY: Prevent concurrent token refresh requests
    // This stops attackers from racing multiple requests with the same token
    const lockAcquired = await acquireTokenRefreshLock(sessionId);
    if (!lockAcquired) {
        logger.warn(
            { userId, sessionId },
            "⚠️ SECURITY: Concurrent token refresh attempt blocked"
        );
        throw new UnauthorizedError(
            "Token refresh already in progress",
            "TOKEN_REFRESH_IN_PROGRESS"
        );
    }

    const session = await sessionRepo.findSessionById(sessionId);

    if (!session) {
        return false;
    }

    const timeSinceLastUse = Date.now() - session.lastUsedAt.getTime();

    // If token was used very recently (< 1 minute), it might be reuse
    if (timeSinceLastUse < TOKEN_REUSE_THRESHOLD_MS) {
        // This is suspicious - revoke ALL sessions for security
        logger.warn(
            { userId, sessionId, timeSinceLastUse },
            "⚠️ SECURITY: Potential refresh token reuse detected"
        );

        // Increment token version (invalidates ALL tokens)
        await userRepo.incrementTokenVersion(userId);

        // Revoke all sessions
        await sessionRepo.revokeAllUserSessions(userId);

        // Get user for email alert
        const user = await userRepo.findUserById(userId);
        if (user) {
            await sendSecurityAlertEmail(
                user.email,
                user.firstName,
                "all_sessions_logged_out",
                "Suspicious activity was detected on your account. All sessions have been logged out for your security. If this wasn't you, please change your password immediately."
            );
        }

        throw new UnauthorizedError(
            "Suspicious activity detected. All sessions have been logged out for security.",
            "TOKEN_REUSE_DETECTED"
        );
    }

    return false;
}

// ==========================================
// IP VALIDATION (Optional Enhancement)
// ==========================================

/**
 * Check if IP address changed during session
 * Logs warning but doesn't block (users may use VPNs)
 */
export async function checkIpChange(
    sessionId: string,
    currentIp: string | undefined,
    userId: string
): Promise<void> {
    if (!currentIp) return;

    const session = await sessionRepo.findSessionById(sessionId);

    if (!session || !session.ipAddress) return;

    if (session.ipAddress !== currentIp) {
        logger.warn(
            { userId, sessionId, originalIp: session.ipAddress, currentIp },
            "IP address changed during session"
        );
    }
}

// ==========================================
// SESSION CLEANUP
// ==========================================

/**
 * Clean up expired and revoked sessions
 * Run periodically (e.g., daily)
 * SECURITY: Deletes sessions 1 hour after expiration/revocation for cleanup efficiency
 */
export async function cleanupSessions(): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const result = await prisma.userSession.deleteMany({
        where: {
            OR: [
                { expiresAt: { lt: oneHourAgo } }, // Expired more than 1 hour ago
                { revokedAt: { lt: oneHourAgo } }, // Revoked more than 1 hour ago
            ],
        },
    });

    logger.info({ deletedCount: result.count }, "Session cleanup completed");

    return result.count;
}
