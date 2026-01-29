import crypto from "crypto";
import * as argon2 from "argon2";
import { prisma } from "../../libs/prisma.js";
import { logger } from "../../libs/logger.js";
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
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token in database
    // Only set verificationTokenExpiresAt for resends (to enable rate limiting)
    // For initial registration, leave it null so there's no cooldown
    await userRepo.updateUser(user.id, {
        verificationToken: token,
        verificationTokenExpiresAt: isResend ? expiresAt : null,
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
 */
export async function verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    // Find user with matching token
    // For initial verification (verificationTokenExpiresAt is null), we accept the token
    // For resent verifications, we check expiration
    const user = await prisma.user.findFirst({
        where: {
            verificationToken: token,
            deletedAt: null,
            OR: [
                { verificationTokenExpiresAt: null }, // Initial verification (no expiry set)
                { verificationTokenExpiresAt: { gt: new Date() } }, // Resent verification (check expiry)
            ],
        },
    });

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

    // Rate limit: check if token was sent recently (within 2 minutes)
    // This only applies if verificationTokenExpiresAt is set (meaning a resend already happened)
    if (user.verificationTokenExpiresAt) {
        const tokenAge = 24 * 60 * 60 * 1000 - (user.verificationTokenExpiresAt.getTime() - Date.now());
        if (tokenAge < 2 * 60 * 1000) {
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
 */
export async function resetPassword(
    token: string,
    newPassword: string
): Promise<{ success: boolean; message: string }> {
    const user = await prisma.user.findFirst({
        where: {
            resetPasswordToken: token,
            resetPasswordTokenExpiresAt: { gt: new Date() },
            deletedAt: null,
        },
    });

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

const MAX_FAILED_ATTEMPTS = 10;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Check if account is locked
 */
export async function checkAccountLock(user: User): Promise<void> {
    if (user.lockedUntil && user.lockedUntil > new Date()) {
        const remainingMs = user.lockedUntil.getTime() - Date.now();
        const remainingMinutes = Math.ceil(remainingMs / 60000);

        throw new UnauthorizedError(
            `Account is temporarily locked. Try again in ${remainingMinutes} minutes.`,
            "ACCOUNT_LOCKED"
        );
    }
}

/**
 * Record failed login attempt
 */
export async function recordFailedLogin(user: User): Promise<void> {
    const newAttempts = user.failedLoginAttempts + 1;

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        // Lock account
        const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);

        await userRepo.updateUser(user.id, {
            failedLoginAttempts: newAttempts,
            lockedUntil,
        });

        logger.warn({ userId: user.id, attempts: newAttempts }, "Account locked due to failed login attempts");

        // Send security alert
        await sendSecurityAlertEmail(
            user.email,
            user.firstName,
            "account_locked",
            `Your account has been temporarily locked after ${newAttempts} failed login attempts. It will be unlocked in 30 minutes.`
        );
    } else {
        await userRepo.updateUser(user.id, {
            failedLoginAttempts: newAttempts,
        });

        logger.info({ userId: user.id, attempts: newAttempts }, "Failed login attempt recorded");
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

// ==========================================
// REFRESH TOKEN REUSE DETECTION
// ==========================================

const TOKEN_REUSE_THRESHOLD_MS = 60 * 1000; // 1 minute

/**
 * Detect potential token reuse (theft indicator)
 * If same session is used too quickly, it may indicate the token was stolen
 */
export async function detectTokenReuse(
    sessionId: string,
    userId: string
): Promise<boolean> {
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
 */
export async function cleanupSessions(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await prisma.userSession.deleteMany({
        where: {
            OR: [
                { expiresAt: { lt: new Date() } }, // Expired
                { revokedAt: { not: null } }, // Revoked
                { createdAt: { lt: thirtyDaysAgo } }, // Older than 30 days
            ],
        },
    });

    logger.info({ deletedCount: result.count }, "Session cleanup completed");

    return result.count;
}
