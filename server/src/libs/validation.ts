import { z } from "zod";

/**
 * Strong password validation schema
 * Requirements:
 * - Minimum 8 characters
 * - Maximum 128 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export const strongPasswordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must not exceed 128 characters")
    .refine(
        (password) => /[A-Z]/.test(password),
        "Password must contain at least one uppercase letter"
    )
    .refine(
        (password) => /[a-z]/.test(password),
        "Password must contain at least one lowercase letter"
    )
    .refine(
        (password) => /[0-9]/.test(password),
        "Password must contain at least one number"
    )
    .refine(
        (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
        "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;':\",./<>?)"
    );

/**
 * Email validation schema with proper format checking
 */
export const emailSchema = z
    .string()
    .email("Invalid email format")
    .max(255, "Email must not exceed 255 characters")
    .transform((email) => email.toLowerCase().trim());

/**
 * Name validation schema
 */
export const nameSchema = z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .trim();

/**
 * Verification token schema (for email verification and password reset)
 */
export const tokenSchema = z
    .string()
    .length(64, "Invalid token format");

/**
 * Helper to get all password requirement messages
 */
export const passwordRequirements = [
    "At least 8 characters",
    "At most 128 characters",
    "At least one uppercase letter (A-Z)",
    "At least one lowercase letter (a-z)",
    "At least one number (0-9)",
    "At least one special character (!@#$%^&*)",
];

export type StrongPassword = z.infer<typeof strongPasswordSchema>;
export type ValidEmail = z.infer<typeof emailSchema>;
export type ValidName = z.infer<typeof nameSchema>;
