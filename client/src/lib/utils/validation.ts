/**
 * Client-side validation utilities
 *
 * These provide quick validation before API calls to improve UX.
 * Server-side validation is still the source of truth.
 */

/**
 * UUID v4 regex pattern
 * Matches standard UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID v4 format
 * @param id - The string to validate
 * @returns true if valid UUID, false otherwise
 */
export function isValidUuid(id: string | null | undefined): boolean {
    if (!id || typeof id !== 'string') {
        return false;
    }
    return UUID_REGEX.test(id);
}

/**
 * Email validation regex
 * Basic email format validation
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates if a string is a valid email format
 * @param email - The string to validate
 * @returns true if valid email format, false otherwise
 */
export function isValidEmail(email: string | null | undefined): boolean {
    if (!email || typeof email !== 'string') {
        return false;
    }
    return EMAIL_REGEX.test(email);
}

/**
 * Phone number validation (Georgian format)
 * Accepts formats like: +995 555 00 00 00, 555000000, +995555000000
 */
const PHONE_REGEX = /^(\+?995)?[\s-]?[5][0-9]{2}[\s-]?[0-9]{2}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/;

/**
 * Validates if a string is a valid Georgian phone number format
 * @param phone - The string to validate
 * @returns true if valid phone format, false otherwise
 */
export function isValidGeorgianPhone(phone: string | null | undefined): boolean {
    if (!phone || typeof phone !== 'string') {
        return false;
    }
    // Remove all spaces and dashes for validation
    const cleaned = phone.replace(/[\s-]/g, '');
    return PHONE_REGEX.test(cleaned);
}

/**
 * URL validation
 * Validates http and https URLs
 */
export function isValidUrl(url: string | null | undefined): boolean {
    if (!url || typeof url !== 'string') {
        return false;
    }
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}

/**
 * Validates a string is not empty after trimming
 * @param value - The string to validate
 * @param minLength - Optional minimum length (default: 1)
 * @returns true if valid, false otherwise
 */
export function isNonEmptyString(value: string | null | undefined, minLength = 1): boolean {
    if (!value || typeof value !== 'string') {
        return false;
    }
    return value.trim().length >= minLength;
}

/**
 * Validates a number is within a range
 * @param value - The number to validate
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns true if valid, false otherwise
 */
export function isInRange(value: number | null | undefined, min: number, max: number): boolean {
    if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
        return false;
    }
    return value >= min && value <= max;
}
