import type { FileValidationResult } from '../types/media.types';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_BATCH_FILES = 10;

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
