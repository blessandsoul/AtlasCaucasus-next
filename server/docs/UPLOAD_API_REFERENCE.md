# Upload API Reference

Complete API documentation for file upload endpoints.

## Table of Contents

- [Generic Endpoints](#generic-endpoints)
- [Entity-Specific Endpoints](#entity-specific-endpoints)
- [Request Examples](#request-examples)
- [Response Formats](#response-formats)
- [Error Codes](#error-codes)

---

## Generic Endpoints

### 1. Upload Single File

Upload a single file for any entity type.

```http
POST /api/v1/media/:entityType/:entityId
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Parameters:**
- `entityType` (path) - Entity type: `tour`, `company`, `guide`, `driver`, `user`
- `entityId` (path) - UUID of the entity
- `file` (form-data) - The file to upload

**Example:**
```bash
curl -X POST http://localhost:3000/api/v1/media/tour/abc-123-uuid \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": "media-uuid",
    "filename": "a1b2c3d4-mountain.jpg",
    "originalName": "mountain.jpg",
    "url": "/uploads/tours/a1b2c3d4-mountain.jpg",
    "size": 245678,
    "mimeType": "image/jpeg",
    "entityType": "tour",
    "entityId": "abc-123-uuid",
    "uploadedBy": "user-uuid",
    "createdAt": "2026-01-14T12:00:00Z",
    "updatedAt": "2026-01-14T12:00:00Z"
  }
}
```

---

### 2. Upload Multiple Files (Batch)

Upload multiple files at once for an entity.

```http
POST /api/v1/media/:entityType/:entityId/batch
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Parameters:**
- `entityType` (path) - Entity type: `tour`, `company`, `guide`, `driver`, `user`
- `entityId` (path) - UUID of the entity
- `files` (form-data) - Multiple files (up to 10)

**Example:**
```bash
curl -X POST http://localhost:3000/api/v1/media/tour/abc-123-uuid/batch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@/path/to/image1.jpg" \
  -F "files=@/path/to/image2.jpg" \
  -F "files=@/path/to/image3.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "3 file(s) uploaded successfully",
  "data": [
    {
      "id": "media-uuid-1",
      "filename": "a1b2c3d4-image1.jpg",
      "url": "/uploads/tours/a1b2c3d4-image1.jpg",
      ...
    },
    {
      "id": "media-uuid-2",
      "filename": "e5f6g7h8-image2.jpg",
      "url": "/uploads/tours/e5f6g7h8-image2.jpg",
      ...
    },
    {
      "id": "media-uuid-3",
      "filename": "i9j0k1l2-image3.jpg",
      "url": "/uploads/tours/i9j0k1l2-image3.jpg",
      ...
    }
  ]
}
```

---

### 3. Get Media for Entity

Retrieve all media files for a specific entity (public endpoint).

```http
GET /api/v1/media/:entityType/:entityId
```

**Parameters:**
- `entityType` (path) - Entity type: `tour`, `company`, `guide`, `driver`, `user`
- `entityId` (path) - UUID of the entity

**Example:**
```bash
curl http://localhost:3000/api/v1/media/tour/abc-123-uuid
```

**Response:**
```json
{
  "success": true,
  "message": "Media retrieved successfully",
  "data": [
    {
      "id": "media-uuid-1",
      "filename": "a1b2c3d4-mountain.jpg",
      "originalName": "mountain.jpg",
      "url": "/uploads/tours/a1b2c3d4-mountain.jpg",
      "size": 245678,
      "mimeType": "image/jpeg",
      "entityType": "tour",
      "entityId": "abc-123-uuid",
      "uploadedBy": "user-uuid",
      "createdAt": "2026-01-14T12:00:00Z",
      "updatedAt": "2026-01-14T12:00:00Z"
    }
  ]
}
```

---

### 4. Delete Media

Delete a specific media file (owner or admin only).

```http
DELETE /api/v1/media/:id
Authorization: Bearer <token>
```

**Parameters:**
- `id` (path) - UUID of the media file

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/v1/media/media-uuid \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Media deleted successfully",
  "data": {
    "id": "media-uuid",
    "filename": "a1b2c3d4-mountain.jpg",
    ...
  }
}
```

---

## Entity-Specific Endpoints

Convenient endpoints for specific entity types with semantic URLs.

### 5. Upload Tour Image

```http
POST /api/v1/tours/:tourId/images
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/v1/tours/abc-123-uuid/images \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/tour-image.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "Tour image uploaded successfully",
  "data": { ... }
}
```

---

### 6. Upload Company Logo

```http
POST /api/v1/companies/:companyId/logo
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/v1/companies/company-uuid/logo \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/logo.png"
```

**Response:**
```json
{
  "success": true,
  "message": "Company logo uploaded successfully",
  "data": { ... }
}
```

---

### 7. Upload Guide Photo

```http
POST /api/v1/guides/:guideId/photo
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/v1/guides/guide-uuid/photo \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/guide-photo.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "Guide photo uploaded successfully",
  "data": { ... }
}
```

---

### 8. Upload Driver Photo

```http
POST /api/v1/drivers/:driverId/photo
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/v1/drivers/driver-uuid/photo \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/driver-photo.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "Driver photo uploaded successfully",
  "data": { ... }
}
```

---

### 9. Upload User Avatar

```http
POST /api/v1/users/:userId/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/v1/users/user-uuid/avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/avatar.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "User avatar uploaded successfully",
  "data": { ... }
}
```

---

## Request Examples

### JavaScript/TypeScript (Fetch API)

```typescript
// Single file upload
const formData = new FormData();
formData.append('file', file);

const response = await fetch(`/api/v1/media/tour/${tourId}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});

const result = await response.json();
console.log('Uploaded:', result.data);
```

### JavaScript - Multiple Files

```typescript
// Batch upload
const formData = new FormData();
files.forEach(file => {
  formData.append('files', file);
});

const response = await fetch(`/api/v1/media/tour/${tourId}/batch`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});

const result = await response.json();
console.log(`Uploaded ${result.data.length} files`);
```

### React Example

```tsx
import { useState } from 'react';

function TourImageUpload({ tourId, token }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/v1/tours/${tourId}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        alert('Image uploaded successfully!');
        console.log('Image URL:', result.data.url);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
    </div>
  );
}
```

### Node.js (Axios)

```typescript
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const formData = new FormData();
formData.append('file', fs.createReadStream('/path/to/image.jpg'));

const response = await axios.post(
  `http://localhost:3000/api/v1/media/tour/${tourId}`,
  formData,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      ...formData.getHeaders(),
    },
  }
);

console.log('Uploaded:', response.data.data);
```

---

## Response Formats

### Success Response

All successful uploads return:

```typescript
{
  success: true,
  message: string,
  data: SafeMedia | SafeMedia[]
}
```

### SafeMedia Object

```typescript
{
  id: string;              // UUID
  filename: string;        // Sanitized filename with UUID prefix
  originalName: string;    // Original filename from upload
  url: string;             // Public URL path
  size: number;            // File size in bytes
  mimeType: string;        // MIME type (e.g., "image/jpeg")
  entityType: string;      // Entity type (tour, company, etc.)
  entityId: string;        // Entity UUID
  uploadedBy: string;      // Uploader user UUID
  createdAt: string;       // ISO 8601 timestamp
  updatedAt: string;       // ISO 8601 timestamp
}
```

---

## Error Codes

### Validation Errors

| Code | Message | Status |
|------|---------|--------|
| `NO_FILE_PROVIDED` | No file provided | 400 |
| `NO_FILES_PROVIDED` | No files provided | 400 |
| `INVALID_ENTITY_TYPE` | Invalid entity type | 400 |
| `INVALID_FILE_TYPE` | Invalid file type. Only images allowed. | 400 |
| `FILE_TOO_LARGE` | File size exceeds 5MB limit | 400 |
| `INVALID_FILE_EXTENSION` | Invalid file extension | 400 |

### Authorization Errors

| Code | Message | Status |
|------|---------|--------|
| `UNAUTHORIZED` | Authentication required | 401 |
| `EMAIL_NOT_VERIFIED` | Email verification required | 403 |
| `FORBIDDEN` | Not authorized to delete this media | 403 |

### Not Found Errors

| Code | Message | Status |
|------|---------|--------|
| `MEDIA_NOT_FOUND` | Media not found | 404 |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds 5MB limit"
  }
}
```

---

## Validation Rules

### File Size
- **Maximum**: 5MB (5,242,880 bytes)
- Files larger than 5MB will be rejected with `FILE_TOO_LARGE`

### File Types
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`
- **Allowed extensions**: `.jpg`, `.jpeg`, `.png`, `.webp`
- Other file types will be rejected with `INVALID_FILE_TYPE`

### Batch Upload Limits
- **Maximum files per request**: 10
- **Each file**: Subject to same size and type validation

### Authentication
- All upload and delete endpoints require authentication
- Email verification required (enforced by `requireVerifiedEmail` middleware)
- Delete permission: Owner of the upload or ADMIN role

---

## File Access

Uploaded files are served statically and publicly accessible at:

```
http://localhost:3000/uploads/{entityType}s/{filename}
```

**Examples:**
```
http://localhost:3000/uploads/tours/a1b2c3d4-mountain.jpg
http://localhost:3000/uploads/companies/e5f6g7h8-logo.png
http://localhost:3000/uploads/guides/i9j0k1l2-profile.jpg
```

**Cache Headers:**
- Files are cached for 1 year (`max-age=31536000`)
- Marked as `immutable` (never changes)
- Safe to cache aggressively due to UUID-prefixed filenames

---

## Best Practices

### Client-Side

1. **Validate before upload**
   ```typescript
   const MAX_SIZE = 5 * 1024 * 1024; // 5MB
   const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

   if (file.size > MAX_SIZE) {
     alert('File too large. Maximum 5MB.');
     return;
   }

   if (!ALLOWED_TYPES.includes(file.type)) {
     alert('Invalid file type. Only JPG, PNG, WebP allowed.');
     return;
   }
   ```

2. **Show upload progress**
   ```typescript
   const xhr = new XMLHttpRequest();
   xhr.upload.addEventListener('progress', (e) => {
     const percentage = (e.loaded / e.total) * 100;
     console.log(`Upload progress: ${percentage.toFixed(2)}%`);
   });
   ```

3. **Handle errors gracefully**
   ```typescript
   try {
     const response = await uploadFile(file);
   } catch (error) {
     if (error.code === 'FILE_TOO_LARGE') {
       alert('File is too large. Please choose a smaller file.');
     } else {
       alert('Upload failed. Please try again.');
     }
   }
   ```

### Server-Side

1. **Use specialized endpoints** when possible
   - Prefer `/tours/:tourId/images` over `/media/tour/:tourId`
   - More semantic and easier to understand

2. **Batch uploads** for multiple files
   - Single request with multiple files is more efficient
   - Reduces API calls and improves performance

3. **Clean up orphaned files**
   - Delete media when deleting entities
   - Use helper functions: `deleteTourImages()`, etc.

---

## Postman Collection

Import this collection to test all endpoints:

```json
{
  "info": {
    "name": "Upload API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Upload Tour Image",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "file",
              "type": "file",
              "src": ""
            }
          ]
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/tours/{{tourId}}/images",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "tours", "{{tourId}}", "images"]
        }
      }
    }
  ]
}
```

---

**Last Updated**: January 14, 2026
