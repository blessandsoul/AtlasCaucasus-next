import type { FileValidationResult } from '../types/media.types';
import { getErrorCode, getErrorMessage } from '@/lib/utils/error';
import { ERROR_CODES } from '@/lib/constants/error-codes';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_BATCH_FILES = 10;

/**
 * Magic byte signatures for supported image formats.
 * These are the first few bytes that identify the file type.
 */
const MAGIC_BYTES = {
  // JPEG: FF D8 FF
  jpeg: [0xFF, 0xD8, 0xFF],
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  // WebP: 52 49 46 46 ... 57 45 42 50 (RIFF....WEBP)
  webp: {
    start: [0x52, 0x49, 0x46, 0x46], // "RIFF"
    webpMarker: [0x57, 0x45, 0x42, 0x50], // "WEBP" at offset 8
  },
} as const;

/**
 * Read the first N bytes of a file as a Uint8Array.
 */
const readFileHeader = async (file: File, bytes: number): Promise<Uint8Array> => {
  const slice = file.slice(0, bytes);
  const buffer = await slice.arrayBuffer();
  return new Uint8Array(buffer);
};

/**
 * Check if bytes match a signature starting at a given offset.
 */
const matchesSignature = (header: Uint8Array, signature: readonly number[], offset = 0): boolean => {
  if (header.length < offset + signature.length) return false;
  return signature.every((byte, index) => header[offset + index] === byte);
};

/**
 * Detect the actual file type by reading magic bytes.
 * Returns the detected MIME type or null if unknown.
 */
const detectFileType = async (file: File): Promise<string | null> => {
  try {
    const header = await readFileHeader(file, 12); // Need 12 bytes for WebP

    // Check JPEG
    if (matchesSignature(header, MAGIC_BYTES.jpeg)) {
      return 'image/jpeg';
    }

    // Check PNG
    if (matchesSignature(header, MAGIC_BYTES.png)) {
      return 'image/png';
    }

    // Check WebP (RIFF at start, WEBP at offset 8)
    if (
      matchesSignature(header, MAGIC_BYTES.webp.start) &&
      matchesSignature(header, MAGIC_BYTES.webp.webpMarker, 8)
    ) {
      return 'image/webp';
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Validate file content by checking magic bytes.
 * This provides an additional layer of security beyond MIME type checking.
 * Useful for catching files with spoofed extensions.
 */
export const validateFileContent = async (file: File): Promise<FileValidationResult> => {
  const detectedType = await detectFileType(file);

  if (!detectedType) {
    return {
      valid: false,
      error: 'The file content does not match any allowed image format (JPEG, PNG, or WebP).',
    };
  }

  // Check if detected type matches the declared MIME type
  if (file.type && file.type !== detectedType) {
    return {
      valid: false,
      error: `File extension does not match content. Expected ${detectedType} but file claims to be ${file.type}.`,
    };
  }

  // Check if the detected type is allowed
  if (!ALLOWED_IMAGE_TYPES.includes(detectedType)) {
    return {
      valid: false,
      error: 'This file type is not allowed. Please upload a JPEG, PNG, or WebP image.',
    };
  }

  return { valid: true, detectedType };
};

/**
 * Validate file with both MIME type and magic byte checking.
 * This is the recommended function for secure file validation.
 */
export const validateImageFileSecure = async (file: File): Promise<FileValidationResult> => {
  // First, basic validation (size and MIME type)
  const basicResult = validateImageFile(file);
  if (!basicResult.valid) {
    return basicResult;
  }

  // Then, magic byte validation
  const contentResult = await validateFileContent(file);
  return contentResult;
};

/**
 * Validate batch files with magic byte checking.
 */
export const validateBatchFilesSecure = async (files: File[]): Promise<FileValidationResult> => {
  if (files.length > MAX_BATCH_FILES) {
    return {
      valid: false,
      error: `Maximum ${MAX_BATCH_FILES} files allowed at once`,
    };
  }

  for (const file of files) {
    const result = await validateImageFileSecure(file);
    if (!result.valid) {
      return { valid: false, error: `${file.name}: ${result.error}` };
    }
  }

  return { valid: true };
};

/**
 * File upload error codes that indicate file validation issues
 */
const FILE_UPLOAD_ERROR_CODES = [
  ERROR_CODES.INVALID_FILE_TYPE,
  ERROR_CODES.FILE_SIGNATURE_MISMATCH,
  ERROR_CODES.FILE_TOO_LARGE,
] as const;

/**
 * User-friendly messages for file upload errors
 */
const FILE_UPLOAD_ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.INVALID_FILE_TYPE]: 'This file type is not allowed. Please upload a JPEG, PNG, or WebP image.',
  [ERROR_CODES.FILE_SIGNATURE_MISMATCH]: 'The file appears to be corrupted or has an incorrect extension. Please try a different file.',
  [ERROR_CODES.FILE_TOO_LARGE]: 'File size exceeds the maximum allowed limit of 5MB.',
};

/**
 * Get a user-friendly error message for file upload errors.
 * Falls back to the default error message for non-file-upload errors.
 */
export const getFileUploadErrorMessage = (error: unknown): string => {
  const errorCode = getErrorCode(error);

  if (errorCode && FILE_UPLOAD_ERROR_CODES.includes(errorCode as typeof FILE_UPLOAD_ERROR_CODES[number])) {
    return FILE_UPLOAD_ERROR_MESSAGES[errorCode] || getErrorMessage(error);
  }

  return getErrorMessage(error);
};

/**
 * Check if an error is a file validation error (invalid type, signature mismatch, or too large)
 */
export const isFileValidationError = (error: unknown): boolean => {
  const errorCode = getErrorCode(error);
  return errorCode !== undefined && FILE_UPLOAD_ERROR_CODES.includes(errorCode as typeof FILE_UPLOAD_ERROR_CODES[number]);
};

export const validateImageFile = (file: File): FileValidationResult => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Only JPEG, PNG, and WebP images are allowed',
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size must be less than 5MB',
    };
  }

  return { valid: true };
};

export const validateBatchFiles = (files: File[]): FileValidationResult => {
  if (files.length > MAX_BATCH_FILES) {
    return {
      valid: false,
      error: `Maximum ${MAX_BATCH_FILES} files allowed at once`,
    };
  }

  for (const file of files) {
    const result = validateImageFile(file);
    if (!result.valid) {
      return { valid: false, error: `${file.name}: ${result.error}` };
    }
  }

  return { valid: true };
};
