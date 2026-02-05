// Media entity types (matches server)
export type MediaEntityType =
  | 'tour' | 'company' | 'guide' | 'driver' | 'user'
  | 'guide-avatar' | 'driver-avatar'
  | 'company-cover' | 'guide-cover' | 'driver-cover';

// Media item returned from API
export interface Media {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  entityType: MediaEntityType;
  entityId: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

// Batch upload result
export interface BatchUploadResult {
  uploaded: Media[];
  failed: { filename: string; error: string }[];
}

// File validation result
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedType?: string; // Detected MIME type from magic bytes
}
