# Media Module

Complete file upload system for handling user-uploaded media (images).

## Structure

```
media/
├── media.types.ts       # TypeScript types and interfaces
├── media.schemas.ts     # Zod validation schemas
├── media.repo.ts        # Database operations (Prisma)
├── media.service.ts     # Business logic
├── media.controller.ts  # HTTP request handlers
├── media.routes.ts      # Route definitions
├── media.helpers.ts     # Helper functions for easy integration
└── README.md           # This file
```

## API Endpoints

### Generic Endpoints

#### 1. Upload Single File
```
POST /api/v1/media/:entityType/:entityId
Authorization: Bearer <token>
Content-Type: multipart/form-data

Example:
POST /api/v1/media/tour/abc-123-uuid
```

#### 2. Upload Multiple Files (Batch)
```
POST /api/v1/media/:entityType/:entityId/batch
Authorization: Bearer <token>
Content-Type: multipart/form-data

Example:
POST /api/v1/media/tour/abc-123-uuid/batch
```

#### 3. Get Media for Entity (Public)
```
GET /api/v1/media/:entityType/:entityId

Example:
GET /api/v1/media/tour/abc-123-uuid
```

#### 4. Delete Media
```
DELETE /api/v1/media/:id
Authorization: Bearer <token>

Example:
DELETE /api/v1/media/media-uuid-here
```

### Entity-Specific Endpoints

Convenient semantic endpoints for specific entity types:

```
POST /api/v1/tours/:tourId/images          # Upload tour image
POST /api/v1/companies/:companyId/logo     # Upload company logo
POST /api/v1/guides/:guideId/photo         # Upload guide photo
POST /api/v1/drivers/:driverId/photo       # Upload driver photo
POST /api/v1/users/:userId/avatar          # Upload user avatar
```

## Supported Entity Types

- `tour` - Tour images
- `company` - Company logos
- `guide` - Guide photos
- `driver` - Driver photos
- `user` - User avatars

## File Validation

- **Max file size:** 5MB (5,242,880 bytes)
- **Max files per batch:** 10
- **Allowed types:** image/jpeg, image/png, image/webp
- **Allowed extensions:** .jpg, .jpeg, .png, .webp

## Storage

Files are stored in:
```
server/uploads/
├── tours/       ← tour images
├── companies/   ← company logos
├── guides/      ← guide photos
├── drivers/     ← driver photos
└── users/       ← user avatars
```

Files are served publicly at: `http://localhost:3000/uploads/{type}s/{filename}`

## Security

- Upload requires authentication (Bearer token)
- Email verification required for upload/delete
- Users can only delete their own media (or admins)
- File type validation enforced
- File size limits enforced
- Filename sanitization prevents directory traversal
- UUID-prefixed filenames prevent collisions

## Usage Examples

### Using Helper Functions (Recommended)

```typescript
import { uploadTourImage, getTourImages, deleteTourImages } from '@/modules/media/media.helpers';

// Upload tour image
const media = await uploadTourImage(currentUser, tourId, uploadedFile);

// Get all tour images
const images = await getTourImages(tourId);

// Delete all tour images (cleanup)
await deleteTourImages(tourId);
```

### Using Service Layer Directly

```typescript
import { uploadMediaForEntity } from '@/modules/media/media.service';

const media = await uploadMediaForEntity(
  currentUser,
  'tour',
  tour.id,
  uploadedFile
);
```

### Frontend Example (React)

```typescript
const formData = new FormData();
formData.append('file', file);

const response = await fetch(`/api/v1/tours/${tourId}/images`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});

const result = await response.json();
console.log('Uploaded:', result.data.url);
```

## Response Format

### Success Response
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

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds 5MB limit"
  }
}
```

## Integration Checklist

When integrating media into modules (tours, companies, etc.):

- [ ] Import helper functions from `media.helpers.ts`
- [ ] Add media cleanup to delete functions
- [ ] Update repository functions to include media in responses
- [ ] Update TypeScript types to include `images?: SafeMedia[]`
- [ ] Test upload → retrieve → delete flow

## Documentation

- [UPLOAD_API_REFERENCE.md](../../docs/UPLOAD_API_REFERENCE.md) - Complete API documentation
- [UPLOAD_SYSTEM.md](../../docs/UPLOAD_SYSTEM.md) - System architecture
- [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md) - Integration guide
- [UPLOAD_SYSTEM_QUICK_START.md](../../docs/UPLOAD_SYSTEM_QUICK_START.md) - Quick start guide

## Status

✅ **Production-ready** - All features implemented and tested

**Last Updated**: January 14, 2026
