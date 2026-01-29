# File Upload Utilities - Usage Examples

This document demonstrates how the file upload utilities work.

## Import

```typescript
import {
  sanitizeFilename,
  generateUniqueFilename,
  validateFileType,
  validateFileSize,
  validateFileExtension,
  saveFile,
  deleteFile,
  fileExists,
  getFileSize,
  deleteMultipleFiles,
  listEntityFiles,
} from './file-upload';
```

## Filename Sanitization

```typescript
// Remove dangerous characters
sanitizeFilename("../../etc/passwd")
// Returns: "etcpasswd"

sanitizeFilename("my photo (2024).jpg")
// Returns: "my_photo__2024_.jpg"

sanitizeFilename("mountain_景观.png")
// Returns: "mountain__.png"

sanitizeFilename(".htaccess")
// Returns: "htaccess"

sanitizeFilename("a".repeat(300) + ".jpg")
// Returns: "aaa...aaa.jpg" (truncated to 200 chars max)
```

## Unique Filename Generation

```typescript
generateUniqueFilename("mountain.jpg")
// Returns: "a1b2c3d4-mountain.jpg"

generateUniqueFilename("tour_photo_2024.png")
// Returns: "e5f6g7h8-tour_photo_2024.png"
```

## File Validation

```typescript
// MIME type validation
validateFileType("image/jpeg", ["image/jpeg", "image/png"])
// Returns: true

validateFileType("application/pdf", ["image/jpeg", "image/png"])
// Returns: false

// File size validation (5MB max)
const maxSize = 5 * 1024 * 1024; // 5MB
validateFileSize(2048000, maxSize) // 2MB
// Returns: true

validateFileSize(6291456, maxSize) // 6MB
// Returns: false

validateFileSize(0, maxSize)
// Returns: false (empty files rejected)

// Extension validation
validateFileExtension("photo.jpg", ["jpg", "jpeg", "png"])
// Returns: true

validateFileExtension("document.pdf", ["jpg", "jpeg", "png"])
// Returns: false
```

## Saving Files

```typescript
// Example: Upload tour image
const buffer = Buffer.from(fileData);
const entityType = "tour";
const filename = "a1b2c3d4-mountain.jpg";

const urlPath = await saveFile(buffer, entityType, filename);
console.log(urlPath);
// Output: "/uploads/tours/a1b2c3d4-mountain.jpg"

// File saved to: server/uploads/tours/a1b2c3d4-mountain.jpg
```

## Deleting Files

```typescript
// Delete single file
await deleteFile("/uploads/tours/a1b2c3d4-mountain.jpg");

// Delete multiple files
await deleteMultipleFiles([
  "/uploads/tours/image1.jpg",
  "/uploads/tours/image2.jpg",
  "/uploads/tours/image3.jpg",
]);
```

## File Operations

```typescript
// Check if file exists
const exists = await fileExists("/uploads/tours/a1b2c3d4-mountain.jpg");
console.log(exists); // true or false

// Get file size
const size = await getFileSize("/uploads/tours/a1b2c3d4-mountain.jpg");
console.log(size); // 2048000 (bytes) or null if not found

// List all files in directory
const files = await listEntityFiles("tour");
console.log(files);
// Output: ["a1b2c3d4-mountain.jpg", "e5f6g7h8-valley.png", ...]
```

## Complete Upload Flow

```typescript
import { saveFile, sanitizeFilename, generateUniqueFilename } from './file-upload';

// 1. Receive file from request
const uploadedFile = {
  originalFilename: "my vacation (2024).jpg",
  mimetype: "image/jpeg",
  size: 2048000,
  buffer: Buffer.from(fileData),
};

// 2. Validate file
if (!validateFileType(uploadedFile.mimetype, ["image/jpeg", "image/png", "image/webp"])) {
  throw new Error("Invalid file type");
}

if (!validateFileSize(uploadedFile.size, 5 * 1024 * 1024)) {
  throw new Error("File too large");
}

// 3. Sanitize and generate unique filename
const sanitized = sanitizeFilename(uploadedFile.originalFilename);
// Result: "my_vacation__2024_.jpg"

const uniqueFilename = generateUniqueFilename(sanitized);
// Result: "a1b2c3d4-my_vacation__2024_.jpg"

// 4. Save to disk
const urlPath = await saveFile(uploadedFile.buffer, "tour", uniqueFilename);
// Result: "/uploads/tours/a1b2c3d4-my_vacation__2024_.jpg"

// 5. Store URL in database
await createMedia({
  filename: uniqueFilename,
  originalName: uploadedFile.originalFilename,
  url: urlPath,
  // ... other fields
});
```

## Directory Structure After Uploads

```
server/uploads/
├── tours/
│   ├── a1b2c3d4-mountain.jpg
│   ├── e5f6g7h8-valley.png
│   └── .gitkeep
├── companies/
│   ├── f9g0h1i2-logo.png
│   └── .gitkeep
├── guides/
│   ├── j3k4l5m6-profile.jpg
│   └── .gitkeep
└── ...
```

## Security Features

### 1. Filename Sanitization
- Removes directory traversal attempts (`../`)
- Removes path separators (`/`, `\`)
- Removes null bytes (`\0`)
- Replaces special characters with underscores

### 2. UUID Prefixing
- Prevents filename collisions
- Makes filenames unpredictable
- 8-character UUID prefix is sufficient for uniqueness

### 3. Directory Isolation
- Each entity type has its own directory
- Files cannot escape their designated directory

### 4. Validation Before Save
- MIME type checked before saving
- File size checked before saving
- Extension verified (optional)

## Error Handling

```typescript
try {
  await saveFile(buffer, "tour", filename);
} catch (error) {
  if (error.code === "ENOSPC") {
    // No space left on device
    throw new Error("Server storage full");
  } else if (error.code === "EACCES") {
    // Permission denied
    throw new Error("Cannot write to upload directory");
  }
  throw error;
}
```

## Cleanup Examples

```typescript
// When entity is deleted
const media = await getMediaByEntity("tour", tourId);
const urlPaths = media.map(m => m.url);
await deleteMultipleFiles(urlPaths);

// Or using the service function
await deleteAllMediaForEntity("tour", tourId);
```
