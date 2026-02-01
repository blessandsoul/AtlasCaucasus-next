// Types
export type {
  Media,
  MediaEntityType,
  BatchUploadResult,
  FileValidationResult,
} from './types/media.types';

// Services
export { mediaService } from './services/media.service';

// Hooks
export {
  useMedia,
  useUploadMedia,
  useBatchUpload,
  useDeleteMedia,
} from './hooks/useMedia';

// Utils
export {
  validateImageFile,
  validateBatchFiles,
  validateFileContent,
  validateImageFileSecure,
  validateBatchFilesSecure,
  getFileUploadErrorMessage,
  isFileValidationError,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  MAX_BATCH_FILES,
} from './utils/validation';
