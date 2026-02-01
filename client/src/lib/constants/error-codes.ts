/**
 * API Error Codes
 *
 * These codes match the server's error response codes.
 * Used for consistent error handling across the client.
 */

export const ERROR_CODES = {
  // Auth
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INVALID_CSRF_TOKEN: 'INVALID_CSRF_TOKEN',
  TOKEN_ALREADY_USED: 'TOKEN_ALREADY_USED',
  VERIFICATION_TOKEN_EXPIRED: 'VERIFICATION_TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Validation
  INVALID_UUID: 'INVALID_UUID',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // File Upload
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_SIGNATURE_MISMATCH: 'FILE_SIGNATURE_MISMATCH',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * User-friendly error messages for common error codes.
 * These can be overridden by i18n translations.
 */
export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.ACCOUNT_LOCKED]: 'Your account is temporarily locked. Please try again later.',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid email or password.',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment.',
  [ERROR_CODES.INVALID_FILE_TYPE]: 'This file type is not allowed.',
  [ERROR_CODES.FILE_SIGNATURE_MISMATCH]: 'The file appears to be corrupted or has an incorrect extension.',
  [ERROR_CODES.FILE_TOO_LARGE]: 'File size exceeds the maximum allowed limit.',
  [ERROR_CODES.VERIFICATION_TOKEN_EXPIRED]: 'Your verification link has expired. Please request a new one.',
  [ERROR_CODES.TOKEN_ALREADY_USED]: 'This token has already been used.',
  [ERROR_CODES.INVALID_UUID]: 'Invalid identifier format.',
  [ERROR_CODES.UNAUTHORIZED]: 'Please log in to continue.',
  [ERROR_CODES.FORBIDDEN]: 'You do not have permission to perform this action.',
  [ERROR_CODES.NOT_FOUND]: 'The requested resource was not found.',
  [ERROR_CODES.CONFLICT]: 'This resource already exists.',
};
