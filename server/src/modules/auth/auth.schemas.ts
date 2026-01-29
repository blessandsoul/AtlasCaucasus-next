import { z } from "zod";
import {
  strongPasswordSchema,
  emailSchema,
  nameSchema,
  tokenSchema,
} from "../../libs/validation.js";

// ==========================================
// USER REGISTRATION (default USER role)
// ==========================================

export const registerSchema = z.object({
  email: emailSchema,
  password: strongPasswordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
});

// ==========================================
// COMPANY REGISTRATION
// ==========================================

export const companyRegisterSchema = z.object({
  // User account details
  email: emailSchema,
  password: strongPasswordSchema,
  firstName: nameSchema,
  lastName: nameSchema,

  // Company profile details
  companyName: z.string()
    .min(2, "Company name must be at least 2 characters")
    .max(255, "Company name is too long"),
  registrationNumber: z.string()
    .max(100, "Registration number is too long")
    .optional(),
  description: z.string()
    .max(2000, "Description is too long")
    .optional(),
  websiteUrl: z.string()
    .url("Invalid website URL")
    .max(512, "URL is too long")
    .optional(),
  phoneNumber: z.string()
    .max(20, "Phone number is too long")
    .optional(),
});

// ==========================================
// CLAIM ROLE (GUIDE or DRIVER)
// ==========================================

// Languages array schema
const languagesSchema = z.array(z.string().min(2).max(10)).default([]);

// Guide profile data when claiming GUIDE role
const guideProfileSchema = z.object({
  bio: z.string().max(2000, "Bio is too long").optional(),
  languages: languagesSchema,
  yearsOfExperience: z.number().int().min(0).max(70).optional(),
  phoneNumber: z.string().max(20, "Phone number is too long").optional(),
});

// Driver profile data when claiming DRIVER role
const driverProfileSchema = z.object({
  bio: z.string().max(2000, "Bio is too long").optional(),
  vehicleType: z.string().max(100, "Vehicle type is too long").optional(),
  vehicleCapacity: z.number().int().min(1).max(100).optional(),
  vehicleMake: z.string().max(100).optional(),
  vehicleModel: z.string().max(100).optional(),
  vehicleYear: z.number().int().min(1900).max(2100).optional(),
  licenseNumber: z.string().max(50, "License number is too long").optional(),
  phoneNumber: z.string().max(20, "Phone number is too long").optional(),
});

// Claim GUIDE role
export const claimGuideRoleSchema = z.object({
  role: z.literal("GUIDE"),
  profile: guideProfileSchema,
});

// Claim DRIVER role
export const claimDriverRoleSchema = z.object({
  role: z.literal("DRIVER"),
  profile: driverProfileSchema,
});

// Combined claim role schema (discriminated union)
export const claimRoleSchema = z.discriminatedUnion("role", [
  claimGuideRoleSchema,
  claimDriverRoleSchema,
]);

// ==========================================
// CREATE TOUR AGENT (by companies)
// ==========================================

export const createTourAgentSchema = z.object({
  email: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
});

// ==========================================
// EXISTING SCHEMAS
// ==========================================

// Login - only requires password presence (don't validate strength on login)
export const loginSchema = z.object({
  email: emailSchema,  // Use emailSchema for case-insensitive matching
  password: z.string().min(1, "Password is required"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// Email verification
export const verifyEmailSchema = z.object({
  token: tokenSchema,
});

// Resend verification email
export const resendVerificationSchema = z.object({
  email: emailSchema,
});

// Forgot password - request reset
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Reset password with token
export const resetPasswordSchema = z.object({
  token: tokenSchema,
  newPassword: strongPasswordSchema,
});

// Change password (when logged in)
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: strongPasswordSchema,
});

// ==========================================
// TYPE EXPORTS
// ==========================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type CompanyRegisterInput = z.infer<typeof companyRegisterSchema>;
export type ClaimRoleInput = z.infer<typeof claimRoleSchema>;
export type ClaimGuideRoleInput = z.infer<typeof claimGuideRoleSchema>;
export type ClaimDriverRoleInput = z.infer<typeof claimDriverRoleSchema>;
export type CreateTourAgentInput = z.infer<typeof createTourAgentSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export interface LoginMeta {
  userAgent?: string;
  ipAddress?: string;
}
