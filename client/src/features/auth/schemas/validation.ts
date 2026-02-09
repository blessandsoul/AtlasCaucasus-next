import { z } from 'zod';
import type { TFunction } from 'i18next';

/**
 * Strong password validation schema matching backend requirements
 */
export const createStrongPasswordSchema = (t: TFunction) => z
    .string()
    .min(8, t('validation.password_length_min'))
    .max(128, t('validation.password_length_max'))
    .refine(
        (password) => /[A-Z]/.test(password),
        t('validation.password_uppercase')
    )
    .refine(
        (password) => /[a-z]/.test(password),
        t('validation.password_lowercase')
    )
    .refine(
        (password) => /[0-9]/.test(password),
        t('validation.password_number')
    )
    .refine(
        (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
        t('validation.password_special')
    );

/**
 * Email validation schema with proper format checking
 */
export const createEmailSchema = (t: TFunction) => z
    .string()
    .min(1, t('validation.email_required'))
    .email(t('validation.email_invalid'))
    .max(255, t('validation.email_max'));

/**
 * Name validation schema
 */
export const createNameSchema = (t: TFunction) => z
    .string()
    .min(2, t('validation.name_min'))
    .max(100, t('validation.name_max'))
    .trim();

/**
 * Registration schema creator
 */
export const createRegisterSchema = (t: TFunction) => z.object({
    email: createEmailSchema(t),
    password: createStrongPasswordSchema(t),
    firstName: createNameSchema(t),
    lastName: createNameSchema(t),
    agreeToTerms: z.literal(true, {
        errorMap: () => ({ message: t('validation.agree_to_terms') }),
    }),
});

/**
 * Company Registration schema creator
 */
export const createCompanyRegisterSchema = (t: TFunction) => z.object({
    email: createEmailSchema(t),
    password: createStrongPasswordSchema(t),
    firstName: createNameSchema(t),
    lastName: createNameSchema(t),
    companyName: z.string().min(2, 'Company name must be at least 2 characters').max(255, 'Company name is too long'),
    description: z.string().max(2000, 'Description is too long').optional().or(z.literal('')),
    registrationNumber: z.string().max(100, 'Registration number is too long').optional().or(z.literal('')),
    websiteUrl: z.string().url('Invalid website URL').max(512, 'URL is too long').optional().or(z.literal('')),
    phoneNumber: z.string().max(20, 'Phone number is too long').optional().or(z.literal('')),
    agreeToTerms: z.literal(true, {
        errorMap: () => ({ message: t('validation.agree_to_terms') }),
    }),
});

/**
 * Login schema creator - only requires password presence (no strength validation on login)
 */
export const createLoginSchema = (t: TFunction) => z.object({
    email: createEmailSchema(t),
    password: z.string().min(1, t('validation.password_required')),
});

/**
 * Forgot Password schema creator
 */
export const createForgotPasswordSchema = (t: TFunction) => z.object({
    email: createEmailSchema(t),
});

/**
 * Reset Password schema creator
 */
export const createResetPasswordSchema = (t: TFunction) => z.object({
    newPassword: createStrongPasswordSchema(t),
    confirmPassword: z.string().min(1, t('validation.password_required')),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: t('validation.passwords_must_match'),
    path: ['confirmPassword'],
});

// Helper for type inference
const dummyLoginSchema = z.object({
    email: z.string(),
    password: z.string(),
});
export type LoginFormData = z.infer<typeof dummyLoginSchema>;

// RegisterFormData type
export type RegisterFormData = {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    agreeToTerms: true;
};

// CompanyRegisterFormData type
export type CompanyRegisterFormData = {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName: string;
    description?: string;
    registrationNumber?: string;
    websiteUrl?: string;
    phoneNumber?: string;
    agreeToTerms: true;
};

// ForgotPasswordFormData type
export type ForgotPasswordFormData = {
    email: string;
};

// ResetPasswordFormData type
export type ResetPasswordFormData = {
    newPassword: string;
    confirmPassword: string;
};

/**
 * Helper to check password strength for PasswordStrengthIndicator
 */
export const checkPasswordStrength = (password: string) => {
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    const passed = Object.values(checks).filter(Boolean).length;
    const strength = passed <= 2 ? 'weak' : passed <= 4 ? 'medium' : 'strong';

    return {
        checks,
        strength,
        score: passed,
    };
};
