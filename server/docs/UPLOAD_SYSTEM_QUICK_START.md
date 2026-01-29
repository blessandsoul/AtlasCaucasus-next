# File Upload System - Quick Start Guide

## Overview

The Tourism Server now has a complete, production-ready file upload system for handling user media (tour images, company logos, guide photos, driver photos, and user avatars).

## What's Implemented

✅ **Complete Media Module** (`src/modules/media/`)
- REST API endpoints for upload, retrieve, and delete
- Authentication & authorization
- File validation (type, size, extension)
- Database metadata tracking

✅ **File Storage System** (`src/libs/file-upload.ts`)
- Disk-based storage in `uploads/` directory
- UUID-prefixed filenames for security
- Filename sanitization
- Organized by entity type

✅ **Helper Functions** (`src/modules/media/media.helpers.ts`)
- Entity-specific wrappers for easy integration
- Batch upload support
- Cleanup utilities

✅ **Database Schema**
- Media table with proper indexes
- Tracks metadata (filename, size, MIME type, URL)
- Links to entities via polymorphic relationship

## Quick Usage Examples

### Upload Tour Image (Backend)

```typescript
import { uploadTourImage } from '@/modules/media/media.helpers';

// In tour.controller.ts or similar
const file = await request.file(); // Fastify multipart
const uploadedFile: UploadedFile = {
  fieldname: file.fieldname,
  filename: file.filename,
  originalFilename: file.filename,
  encoding: file.encoding,
  mimetype: file.mimetype,
  size: buffer.length,
  buffer,
};

const media = await uploadTourImage(request.user, tourId, uploadedFile);
// Returns: { id, url, filename, size, mimeType, ... }
```

### Get Tour Images

```typescript
import { getTourImages } from '@/modules/media/media.helpers';

const images = await getTourImages(tourId);
// Returns array of media objects
```

### Delete Tour Images (Cleanup)

```typescript
import { deleteTourImages } from '@/modules/media/media.helpers';

// Call when deleting a tour
await deleteTourImages(tourId);
```

### Frontend Upload (React)

```typescript
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
console.log('Uploaded:', result.data.url);
```

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/media/:entityType/:entityId` | GET | No | Get all media for entity |
| `/api/v1/media/:entityType/:entityId` | POST | Yes | Upload media |
| `/api/v1/media/:id` | DELETE | Yes | Delete media |

**Entity Types**: `tour`, `company`, `guide`, `driver`, `user`

## File Access

Uploaded files are served statically at:
```
http://localhost:3000/uploads/{entityType}s/{filename}
```

Example:
```
http://localhost:3000/uploads/tours/a1b2c3d4-mountain.jpg
```

## Validation Rules

- **Max file size**: 5MB
- **Allowed types**: image/jpeg, image/png, image/webp
- **Allowed extensions**: .jpg, .jpeg, .png, .webp
- **Authentication**: Required for upload/delete
- **Email verification**: Required for upload/delete

## Security Features

✅ Filename sanitization (removes `../`, `/`, `\`, null bytes)
✅ UUID prefixing prevents collisions
✅ MIME type validation
✅ File size limits
✅ Directory isolation
✅ Authorization checks (users can only delete their own uploads)

## Integration Checklist

When integrating media into existing modules (tours, companies, etc.):

- [ ] Import helper functions from `media.helpers.ts`
- [ ] Add media cleanup to delete/soft-delete functions
- [ ] Update repository functions to include media in responses
- [ ] Update TypeScript types to include `images?: SafeMedia[]`
- [ ] Test upload → retrieve → delete flow

## Next Steps

1. **Integrate with Tour Module** (see [INTEGRATION_EXAMPLES.md](../src/modules/media/INTEGRATION_EXAMPLES.md))
   - Add cleanup to tour deletion
   - Include images in tour responses
   - Update tour types

2. **Integrate with Company Module**
   - Handle logo uploads
   - Add cleanup on company deletion

3. **Integrate with Guide/Driver Modules**
   - Handle photo uploads
   - Add cleanup on profile deletion

4. **Optional Enhancements**
   - Image processing (thumbnails, optimization)
   - Cloud storage migration (S3/R2)
   - Video upload support
   - Background cleanup job for orphaned files

## Documentation

- [UPLOAD_SYSTEM.md](./UPLOAD_SYSTEM.md) - Complete system documentation
- [INTEGRATION_EXAMPLES.md](../src/modules/media/INTEGRATION_EXAMPLES.md) - Integration guide
- [file-upload.test-examples.md](../src/libs/file-upload.test-examples.md) - Utility usage examples

## Testing

Upload an image:
```bash
curl -X POST http://localhost:3000/api/v1/media/tour/abc-123-uuid \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

Access uploaded file:
```bash
curl http://localhost:3000/uploads/tours/a1b2c3d4-mountain.jpg
```

## Directory Structure

```
server/
├── uploads/              # Physical file storage (gitignored)
│   ├── tours/
│   ├── companies/
│   ├── guides/
│   ├── drivers/
│   └── users/
├── src/
│   ├── libs/
│   │   └── file-upload.ts        # Utility functions
│   └── modules/
│       └── media/
│           ├── media.types.ts
│           ├── media.schemas.ts
│           ├── media.repo.ts
│           ├── media.service.ts
│           ├── media.controller.ts
│           ├── media.routes.ts
│           └── media.helpers.ts  # Easy integration
└── docs/
    ├── UPLOAD_SYSTEM.md
    └── UPLOAD_SYSTEM_QUICK_START.md (this file)
```

---

**System Status**: ✅ Production-ready
**Last Updated**: January 14, 2026
