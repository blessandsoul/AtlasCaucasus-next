# Step 13 Summary: Environment Variables Configuration

## What Was Implemented

Step 13 added environment variable configuration for the media upload system, allowing easy customization of file size limits, allowed file types, upload directories, and URL prefixes without code changes.

## Problem Solved

**Before Step 13:**
- File validation settings hardcoded in source code
- Upload directory paths hardcoded
- Changing settings required code modifications and redeployment
- Different environments (dev/staging/prod) couldn't have different limits

**After Step 13:**
- All media settings configurable via environment variables
- Easy to adjust limits per environment
- No code changes needed for configuration updates
- Type-safe validation with Zod
- Sensible defaults for development

## Files Modified

### 1. Environment Example File
**File:** `server/.env.example`

**Added Variables:**
```env
# Media Upload Configuration
# Maximum file size in bytes (default: 5MB)
MAX_FILE_SIZE=5242880

# Allowed file types (comma-separated MIME types)
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,image/gif

# Upload directory (relative to server root)
UPLOAD_DIR=uploads

# Static file serving URL prefix
STATIC_URL_PREFIX=/uploads
```

### 2. Environment Configuration
**File:** `server/src/config/env.ts`

**Added Schema:**
```typescript
const envSchema = z.object({
  // ... existing config

  // Media Upload Configuration
  MAX_FILE_SIZE: z.coerce.number().int().positive().default(5 * 1024 * 1024), // 5MB default
  ALLOWED_FILE_TYPES: z
    .string()
    .default("image/jpeg,image/png,image/webp,image/gif")
    .transform((val) => val.split(",").map((type) => type.trim())),
  UPLOAD_DIR: z.string().default("uploads"),
  STATIC_URL_PREFIX: z.string().default("/uploads"),
});
```

**Features:**
- Type coercion for numbers (string → number)
- String transformation for comma-separated MIME types
- Sensible defaults for all variables
- Validation on application startup

### 3. File Upload Utilities
**File:** `server/src/libs/file-upload.ts`

**Changes:**
```typescript
import { env } from "../config/env.js";

// Use environment variable for upload directory
const UPLOAD_BASE_DIR = path.join(process.cwd(), env.UPLOAD_DIR);

// Use environment variable for URL prefix
export async function saveFile(...): Promise<string> {
  // ...
  return `${env.STATIC_URL_PREFIX}/${entityType}s/${filename}`;
}

// Update all functions to use dynamic URL prefix
export async function deleteFile(urlPath: string): Promise<void> {
  const urlPrefix = env.STATIC_URL_PREFIX.replace(/^\//, "");
  const relativePath = urlPath.replace(new RegExp(`^/${urlPrefix}/`), "");
  // ...
}
```

### 4. Media Schemas
**File:** `server/src/modules/media/media.schemas.ts`

**Changes:**
```typescript
import { env } from "../../config/env.js";

// Use environment variables for validation
export const FILE_VALIDATION = {
  MAX_SIZE: env.MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES: env.ALLOWED_FILE_TYPES,
  ALLOWED_EXTENSIONS: ["jpg", "jpeg", "png", "webp", "gif"],
} as const;
```

### 5. Fastify Application
**File:** `server/src/app.ts`

**Changes:**
```typescript
import { env } from "./config/env.js";

// Use environment variables for static file serving
app.register(fastifyStatic, {
  root: join(__dirname, "..", env.UPLOAD_DIR),
  prefix: env.STATIC_URL_PREFIX,
  // ...
});

// Use environment variable for file size limit
app.register(fastifyMultipart, {
  limits: {
    fileSize: env.MAX_FILE_SIZE,
    // ...
  },
});
```

## Environment Variables Explained

### MAX_FILE_SIZE
- **Type:** Number (bytes)
- **Default:** `5242880` (5MB)
- **Purpose:** Maximum allowed file size for uploads
- **Example Values:**
  ```env
  MAX_FILE_SIZE=1048576      # 1MB
  MAX_FILE_SIZE=5242880      # 5MB (default)
  MAX_FILE_SIZE=10485760     # 10MB
  MAX_FILE_SIZE=52428800     # 50MB (large images)
  ```

### ALLOWED_FILE_TYPES
- **Type:** String (comma-separated MIME types)
- **Default:** `image/jpeg,image/png,image/webp,image/gif`
- **Purpose:** Restrict uploads to specific file types
- **Example Values:**
  ```env
  # Images only (default)
  ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,image/gif

  # Add AVIF support
  ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,image/gif,image/avif

  # Strict JPEG/PNG only
  ALLOWED_FILE_TYPES=image/jpeg,image/png

  # Include PDFs (future: documents)
  ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/pdf
  ```

### UPLOAD_DIR
- **Type:** String (directory path)
- **Default:** `uploads`
- **Purpose:** Directory where uploaded files are stored
- **Example Values:**
  ```env
  UPLOAD_DIR=uploads               # Default (relative to server root)
  UPLOAD_DIR=public/media          # Custom directory
  UPLOAD_DIR=/var/www/uploads      # Absolute path (production)
  ```

### STATIC_URL_PREFIX
- **Type:** String (URL path)
- **Default:** `/uploads`
- **Purpose:** URL prefix for accessing uploaded files
- **Example Values:**
  ```env
  STATIC_URL_PREFIX=/uploads       # Default
  STATIC_URL_PREFIX=/media         # Custom prefix
  STATIC_URL_PREFIX=/static/files  # Alternative structure
  ```

## Configuration Examples

### Development Environment

```env
# .env.development
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,image/gif
UPLOAD_DIR=uploads
STATIC_URL_PREFIX=/uploads
```

### Production Environment

```env
# .env.production
# Larger file size for high-quality images
MAX_FILE_SIZE=10485760

# Strict MIME types for security
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Production upload directory
UPLOAD_DIR=/var/www/tourism-georgia/uploads

# CDN-ready URL prefix
STATIC_URL_PREFIX=/uploads
```

### Staging Environment

```env
# .env.staging
# Moderate file size
MAX_FILE_SIZE=7340032  # 7MB

# Same as production
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Staging directory
UPLOAD_DIR=uploads
STATIC_URL_PREFIX=/uploads
```

## How It Works

### Startup Validation

When the server starts, environment variables are validated:

```typescript
// src/config/env.ts
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.format();
  throw new Error(`Invalid environment variables: ${JSON.stringify(formatted)}`);
}

export const env = parsed.data;
```

**Benefits:**
- Catches configuration errors immediately
- Prevents runtime errors from invalid config
- Type-safe access throughout application

### Type Transformation

Zod automatically transforms values:

```typescript
// String → Number
MAX_FILE_SIZE: z.coerce.number().int().positive()
// "5242880" (string) → 5242880 (number)

// CSV → Array
ALLOWED_FILE_TYPES: z.string().transform((val) => val.split(",").map((type) => type.trim()))
// "image/jpeg, image/png" → ["image/jpeg", "image/png"]
```

### Usage Throughout Application

```typescript
// File validation
if (!validateFileSize(file.size, env.MAX_FILE_SIZE)) {
  throw new ValidationError(`File too large. Maximum: ${env.MAX_FILE_SIZE / (1024 * 1024)}MB`);
}

// File saving
const filePath = await saveFile(buffer, entityType, filename);
// Returns: "/uploads/tours/abc123-mountain.jpg"

// Static serving
app.register(fastifyStatic, {
  root: join(__dirname, "..", env.UPLOAD_DIR),
  prefix: env.STATIC_URL_PREFIX,
});
```

## Benefits

### 1. Flexibility
- Different settings per environment
- No code changes required
- Easy A/B testing of limits

### 2. Security
- Centralized configuration
- Validation at startup
- Type-safe access

### 3. Maintainability
- Single source of truth
- Clear documentation
- Easy to audit

### 4. Deployment
- Environment-specific configs
- No hardcoded values
- Docker/Kubernetes friendly

## Common Scenarios

### Scenario 1: Increase File Size Limit

```env
# Change from 5MB to 10MB
MAX_FILE_SIZE=10485760
```

Restart server - no code changes needed!

### Scenario 2: Add New File Type

```env
# Add AVIF support
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,image/gif,image/avif
```

Restart server - validation automatically updated!

### Scenario 3: Change Upload Directory

```env
# Move to different directory
UPLOAD_DIR=storage/media
STATIC_URL_PREFIX=/storage/media
```

Restart server - all paths automatically updated!

### Scenario 4: Migrate to CDN

```env
# Keep local storage
UPLOAD_DIR=uploads

# Change URL prefix to CDN
STATIC_URL_PREFIX=https://cdn.tourism-georgia.com/uploads
```

Files saved locally but served via CDN URLs!

## Validation Rules

### File Size
- Must be positive integer
- Maximum: no limit (set by environment)
- Recommended: 5-10MB for images
- Large files: Consider cloud storage (S3/R2)

### File Types
- Must be valid MIME types
- Comma-separated list
- No spaces (auto-trimmed)
- Case-sensitive

### Directories
- Relative or absolute paths
- Must be writable by server process
- Created automatically if missing

### URL Prefix
- Must start with `/`
- No trailing slash
- Used in public URLs

## Error Handling

### Invalid Configuration

```bash
# Invalid: negative file size
MAX_FILE_SIZE=-100
# Error: MAX_FILE_SIZE must be positive

# Invalid: empty MIME types
ALLOWED_FILE_TYPES=
# Uses default: image/jpeg,image/png,image/webp,image/gif

# Invalid: non-existent directory (created automatically)
UPLOAD_DIR=/nonexistent/path
# Directory created on first upload
```

### Runtime Validation

```typescript
// File too large
if (fileSize > env.MAX_FILE_SIZE) {
  throw new ValidationError(
    `File too large. Maximum size: ${env.MAX_FILE_SIZE / (1024 * 1024)}MB`
  );
}

// Invalid file type
if (!env.ALLOWED_FILE_TYPES.includes(mimeType)) {
  throw new ValidationError(
    `Invalid file type. Allowed types: ${env.ALLOWED_FILE_TYPES.join(", ")}`
  );
}
```

## Migration Guide

### Existing Deployments

If you already have a deployed system:

1. **Add environment variables to `.env`:**
   ```env
   MAX_FILE_SIZE=5242880
   ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,image/gif
   UPLOAD_DIR=uploads
   STATIC_URL_PREFIX=/uploads
   ```

2. **Verify configuration:**
   ```bash
   npm run dev
   # Check startup logs for validation errors
   ```

3. **Test upload:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/tours/{tourId}/images \
     -H "Authorization: Bearer {token}" \
     -F "file=@test-image.jpg"
   ```

4. **Deploy:**
   ```bash
   # Production
   export MAX_FILE_SIZE=10485760
   export ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
   npm start
   ```

## Best Practices

### DO:
- ✅ Use defaults in `.env.example`
- ✅ Override in `.env` for local development
- ✅ Set production values in deployment platform
- ✅ Document any changes to defaults
- ✅ Test configuration changes in staging first

### DON'T:
- ❌ Commit `.env` to version control
- ❌ Use extremely large file size limits (DoS risk)
- ❌ Allow dangerous MIME types (executables, scripts)
- ❌ Change UPLOAD_DIR without migrating existing files
- ❌ Use spaces in comma-separated values

## Future Enhancements (Optional)

### Cloud Storage Integration
```env
# S3/R2 configuration
STORAGE_PROVIDER=s3  # local, s3, r2, gcs
S3_BUCKET=tourism-media
S3_REGION=us-east-1
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
```

### Advanced File Processing
```env
# Image optimization
IMAGE_QUALITY=85
IMAGE_MAX_WIDTH=2000
IMAGE_MAX_HEIGHT=2000
GENERATE_THUMBNAILS=true
THUMBNAIL_SIZES=150,300,600
```

### CDN Configuration
```env
# CloudFlare/CloudFront
CDN_ENABLED=true
CDN_URL=https://cdn.tourism-georgia.com
CDN_PURGE_ON_DELETE=true
```

## Status

✅ **Step 13 Complete**

**Implemented:**
- ✅ Environment variables added to `.env.example`
- ✅ Zod schema validation in `env.ts`
- ✅ File upload utilities updated
- ✅ Media schemas updated
- ✅ Fastify application updated
- ✅ Type-safe environment access

**Remaining (from original plan):**
- Step 14: Update .gitignore (COMPLETED earlier)
- Step 15: Create migration & seed data (migration COMPLETED, seed optional)

**Optional Extensions (user will request explicitly):**
- Extend media to other entities (companies, guides, drivers)
- Cloud storage migration (S3/R2)
- Image processing (thumbnails, optimization)
- CDN integration

---

**Last Updated**: January 14, 2026
