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
});

/**
 * Login schema creator - only requires password presence (no strength validation on login)
 */
export const createLoginSchema = (t: TFunction) => z.object({
    email: createEmailSchema(t),
    password: z.string().min(1, t('validation.password_required')),
});

// Helper for type inference
const dummyLoginSchema = z.object({
    email: z.string(),
    password: z.string(),
});
export type LoginFormData = z.infer<typeof dummyLoginSchema>;
