# File Upload System Documentation

Complete guide to the file upload system implementation.

## 🎯 Overview

The system provides secure file uploads with automatic storage management, validation, and serving of uploaded files.

## 📁 Architecture

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
│           └── media.routes.ts
└── prisma/
    └── schema.prisma      # Media table definition
```

## 🔧 Configuration

### 1. Fastify Plugins (app.ts)

```typescript
// Multipart form data (file uploads)
app.register(fastifyMultipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10,
    fields: 10,
  },
});

// Serve uploaded files statically
app.register(fastifyStatic, {
  root: join(__dirname, "..", "uploads"),
  prefix: "/uploads/",
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
});
```

### 2. File Validation Rules (media.schemas.ts)

```typescript
{
  MAX_SIZE: 5MB,
  ALLOWED_MIME_TYPES: ["image/jpeg", "image/png", "image/webp"],
  ALLOWED_EXTENSIONS: ["jpg", "jpeg", "png", "webp"]
}
```

## 📡 API Endpoints

### Upload File
```http
POST /api/v1/media/:entityType/:entityId
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
  file: [binary data]

Example:
  POST /api/v1/media/tour/abc-123-uuid
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
    "createdAt": "2024-01-14T12:00:00Z",
    "updatedAt": "2024-01-14T12:00:00Z"
  }
}
```

### Get Media for Entity
```http
GET /api/v1/media/:entityType/:entityId

Example:
  GET /api/v1/media/tour/abc-123-uuid
```

**Response:**
```json
{
  "success": true,
  "message": "Media retrieved successfully",
  "data": [
    {
      "id": "media-uuid-1",
      "url": "/uploads/tours/a1b2c3d4-mountain.jpg",
      ...
    },
    {
      "id": "media-uuid-2",
      "url": "/uploads/tours/e5f6g7h8-valley.png",
      ...
    }
  ]
}
```

### Delete Media
```http
DELETE /api/v1/media/:id
Authorization: Bearer <token>

Example:
  DELETE /api/v1/media/media-uuid-here
```

## 🔒 Security Features

### 1. Filename Sanitization
- Removes directory traversal attempts (`../`)
- Strips dangerous characters (`/`, `\`, `:`, null bytes)
- UUID prefixing prevents collisions
- Limits filename length to 200 characters

### 2. File Validation
- MIME type whitelist (only images)
- File size limit (5MB max)
- Extension verification
- Buffer validation before save

### 3. Access Control
- Upload requires authentication + email verification
- Users can only delete their own uploads (or admins)
- Public read access for all media

### 4. Storage Isolation
- Each entity type in separate directory
- Files cannot escape designated directories
- Automatic cleanup on entity deletion

## 💾 Database Schema

```sql
CREATE TABLE `media` (
    `id` VARCHAR(191) PRIMARY KEY,
    `filename` VARCHAR(255) NOT NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `size` INTEGER NOT NULL,
    `url` VARCHAR(512) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` VARCHAR(255) NOT NULL,
    `uploaded_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3),
    INDEX `media_entity_type_entity_id_idx` (`entity_type`, `entity_id`),
    INDEX `media_uploaded_by_idx` (`uploaded_by`),
    INDEX `media_created_at_idx` (`created_at`)
);
```

## 🧪 Testing with cURL

### Upload Image
```bash
curl -X POST http://localhost:3000/api/v1/media/tour/abc-123-uuid \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

### Get Media
```bash
curl http://localhost:3000/api/v1/media/tour/abc-123-uuid
```

### Access Uploaded File
```bash
curl http://localhost:3000/uploads/tours/a1b2c3d4-mountain.jpg
```

### Delete Media
```bash
curl -X DELETE http://localhost:3000/api/v1/media/media-uuid-here \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🧩 Integration Examples

### Upload Tour Image
```typescript
import { uploadMediaForEntity } from '@/modules/media/media.service';

// After creating tour
const media = await uploadMediaForEntity(
  currentUser,
  'tour',
  tour.id,
  uploadedFile
);
```

### Get Tour Images
```typescript
import { getMediaForEntity } from '@/modules/media/media.service';

const images = await getMediaForEntity('tour', tourId);
```

### Delete Entity Media
```typescript
import { deleteAllMediaForEntity } from '@/modules/media/media.service';

// When deleting tour
await deleteAllMediaForEntity('tour', tourId);
```

## 🚀 Performance Considerations

### Caching
- Uploaded files cached for 1 year (immutable)
- UUID filenames ensure safe caching
- CDN-ready (future migration)

### File Serving
- Served directly by Fastify (dev/staging)
- Production: Use Nginx reverse proxy
- Future: Migrate to CDN/S3

### Database Queries
- Indexed on `(entityType, entityId)` for fast lookups
- Indexed on `uploadedBy` for user media queries
- Indexed on `createdAt` for chronological sorting

## 🔮 Future Enhancements

1. **Image Processing**
   - Thumbnail generation
   - Image optimization/compression
   - Multiple sizes (small, medium, large)

2. **Cloud Storage**
   - AWS S3 / Cloudflare R2 migration
   - CDN integration
   - Automatic backups

3. **Advanced Features**
   - Video upload support
   - PDF document uploads
   - Drag-and-drop UI

4. **Security**
   - Virus scanning
   - Image metadata stripping
   - Watermarking

## 📊 Monitoring

### Key Metrics to Track
- Upload success/failure rate
- Average file size
- Storage usage per entity type
- Upload endpoint response time
- Failed validation reasons

### Logs
All upload operations are logged with:
- User ID
- Entity type/ID
- File size
- Upload timestamp
- Success/failure status

## 🆘 Troubleshooting

### "File too large"
- Check FILE_VALIDATION.MAX_SIZE in schemas
- Verify Fastify multipart limits in app.ts
- Consider increasing limits if needed

### "Invalid file type"
- Check ALLOWED_MIME_TYPES array
- Verify browser sends correct MIME type
- Add new types if needed (images only recommended)

### "Permission denied" (file save)
- Check uploads/ directory permissions
- Ensure Node process has write access
- Run: `chmod 755 uploads/`

### "File not found" (serving)
- Verify file exists in uploads/ directory
- Check URL path matches database record
- Ensure static serving is configured

## 📝 Maintenance

### Cleanup Orphaned Files
```typescript
// Find media records with deleted entities
// Delete files from disk
// Remove database records
// (Future: Implement cron job for this)
```

### Database Backup
```bash
# Backup media table
mysqldump -u user -p tourism_db media > media_backup.sql

# Backup uploads directory
tar -czf uploads_backup.tar.gz uploads/
```
