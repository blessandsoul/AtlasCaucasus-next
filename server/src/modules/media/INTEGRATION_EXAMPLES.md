# Media Upload Integration Examples

How to integrate media uploads into existing entity services.

## 📦 Import Helpers

```typescript
import {
  uploadTourImage,
  getTourImages,
  deleteTourImages,
  uploadCompanyLogo,
  getCompanyMedia,
  uploadGuidePhoto,
  uploadDriverPhoto,
  uploadUserAvatar,
  uploadMultipleFiles,
} from '@/modules/media/media.helpers';
```

## 🎯 Integration Patterns

### 1. Tour Module Integration

#### A. Update Tour Service (tour.service.ts)

```typescript
import { deleteTourImages } from '../media/media.helpers.js';

// Existing delete function
export async function softDeleteTourForUser(
  currentUser: JwtUser,
  id: string,
): Promise<SafeTour> {
  const tour = await getTourById(id);

  if (!tour) {
    throw new NotFoundError("Tour not found", "TOUR_NOT_FOUND");
  }

  assertOwnerOrAdmin(tour, currentUser);

  // Delete associated media files
  await deleteTourImages(id);

  const deleted = await softDeleteTour(id);

  if (!deleted) {
    throw new NotFoundError("Tour not found", "TOUR_NOT_FOUND");
  }

  return deleted;
}
```

#### B. Update Tour Repository (tour.repo.ts)

```typescript
import { getMediaByEntity } from '../media/media.repo.js';

export async function getTourById(id: string): Promise<SafeTour | null> {
  const tour = await prisma.tour.findUnique({
    where: { id },
  });

  if (!tour) return null;

  // Include media in response
  const media = await getMediaByEntity('tour', id);

  return {
    ...toSafeTour(tour),
    images: media, // Add images array
  };
}
```

#### C. Update Tour Types (tour.types.ts)

```typescript
import type { SafeMedia } from '../media/media.types';

export interface SafeTour {
  id: string;
  ownerId: string;
  companyId: string | null;
  title: string;
  summary: string | null;
  description: string | null;
  price: string;
  currency: string;
  durationMinutes: number | null;
  maxPeople: number | null;
  difficulty: string | null;
  category: string | null;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  images?: SafeMedia[]; // Add optional images array
}
```

### 2. Company Module Integration

#### Update Company Service (company.service.ts)

```typescript
import { deleteCompanyMedia } from '../media/media.helpers.js';

export async function deleteCompany(
  currentUser: JwtUser,
  companyId: string
): Promise<void> {
  // Verify ownership/admin
  const company = await getCompanyById(companyId);
  if (!company) {
    throw new NotFoundError("Company not found");
  }

  // Delete company logo and images
  await deleteCompanyMedia(companyId);

  // Delete company
  await prisma.company.delete({ where: { id: companyId } });
}
```

### 3. Guide Module Integration

#### Update Guide Service (guide.service.ts)

```typescript
import { deleteGuidePhotos } from '../media/media.helpers.js';

export async function deleteGuideProfile(
  currentUser: JwtUser,
  guideId: string
): Promise<void> {
  // Delete guide photos
  await deleteGuidePhotos(guideId);

  // Delete guide profile
  await prisma.guide.delete({ where: { id: guideId } });
}
```

### 4. Driver Module Integration

#### Update Driver Service (driver.service.ts)

```typescript
import { deleteDriverPhotos } from '../media/media.helpers.js';

export async function deleteDriverProfile(
  currentUser: JwtUser,
  driverId: string
): Promise<void> {
  // Delete driver photos
  await deleteDriverPhotos(driverId);

  // Delete driver profile
  await prisma.driver.delete({ where: { id: driverId } });
}
```

## 🚀 Frontend Integration Examples

### Upload Tour Image (React/Vue/Vanilla JS)

```typescript
async function uploadTourImage(tourId: string, file: File, token: string) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`/api/v1/media/tour/${tourId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData, // Don't set Content-Type, browser will set it with boundary
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return await response.json();
}

// Usage
const file = document.getElementById('fileInput').files[0];
const result = await uploadTourImage(tourId, file, userToken);
console.log('Uploaded:', result.data.url);
```

### Get Tour with Images

```typescript
async function getTourWithImages(tourId: string) {
  const response = await fetch(`/api/v1/tours/${tourId}`);
  const tour = await response.json();

  // Tour now includes images array
  console.log('Tour images:', tour.data.images);

  return tour.data;
}
```

### Upload Multiple Images

```typescript
async function uploadMultipleTourImages(tourId: string, files: FileList, token: string) {
  const uploads = [];

  for (let i = 0; i < files.length; i++) {
    const formData = new FormData();
    formData.append('file', files[i]);

    const upload = fetch(`/api/v1/media/tour/${tourId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });

    uploads.push(upload);
  }

  // Upload all files in parallel
  const responses = await Promise.all(uploads);
  const results = await Promise.all(responses.map(r => r.json()));

  return results.map(r => r.data);
}
```

### Delete Image

```typescript
async function deleteImage(mediaId: string, token: string) {
  const response = await fetch(`/api/v1/media/${mediaId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Delete failed');
  }

  return await response.json();
}
```

### Display Image

```html
<!-- Direct image URL -->
<img src="/uploads/tours/abc123-mountain.jpg" alt="Tour image" />

<!-- Or from API response -->
<img :src="tour.images[0].url" alt="Tour image" />
```

## 🔧 Advanced Usage

### Upload with Progress Tracking

```typescript
async function uploadWithProgress(tourId: string, file: File, token: string) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentage = (e.loaded / e.total) * 100;
        console.log(`Upload progress: ${percentage.toFixed(2)}%`);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 201) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error('Upload failed'));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload error')));

    xhr.open('POST', `/api/v1/media/tour/${tourId}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
}
```

### Image Preview Before Upload

```typescript
function previewImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Usage
const file = input.files[0];
const preview = await previewImage(file);
imageElement.src = preview; // Show preview
await uploadTourImage(tourId, file, token); // Then upload
```

### Validate Before Upload

```typescript
function validateImage(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPG, PNG, WEBP allowed.' };
  }

  // Check file size (5MB max)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Maximum size is 5MB.' };
  }

  return { valid: true };
}

// Usage
const validation = validateImage(file);
if (!validation.valid) {
  alert(validation.error);
  return;
}
await uploadTourImage(tourId, file, token);
```

## 📝 Complete Integration Example

### Tour Creation with Images

```typescript
// Backend: tour.controller.ts
export async function createTourWithImagesHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // 1. Create tour
  const tourData = createTourSchema.safeParse(request.body);
  if (!tourData.success) {
    throw new ValidationError(tourData.error.errors[0].message);
  }

  const tour = await createTourForUser(request.user, tourData.data);

  // 2. Handle file uploads (if any)
  const files = await request.saveRequestFiles();
  const uploadedMedia = [];

  for (const file of files) {
    const buffer = await fs.readFile(file.filepath);
    const uploadedFile: UploadedFile = {
      fieldname: file.fieldname,
      filename: file.filename,
      originalFilename: file.filename,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: buffer.length,
      buffer,
    };

    const media = await uploadTourImage(request.user, tour.id, uploadedFile);
    uploadedMedia.push(media);
  }

  // 3. Return tour with uploaded images
  return reply.status(201).send(
    successResponse("Tour created successfully", {
      tour,
      images: uploadedMedia,
    })
  );
}
```

### Frontend: Complete Form with Images

```html
<form id="createTourForm" enctype="multipart/form-data">
  <input type="text" name="title" required />
  <input type="number" name="price" required />
  <input type="file" name="images" multiple accept="image/*" />
  <button type="submit">Create Tour</button>
</form>

<script>
document.getElementById('createTourForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);

  // 1. Create tour first
  const tourData = {
    title: formData.get('title'),
    price: Number(formData.get('price')),
  };

  const tourResponse = await fetch('/api/v1/tours', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tourData),
  });

  const tour = await tourResponse.json();

  // 2. Upload images
  const images = formData.getAll('images');
  for (const image of images) {
    await uploadTourImage(tour.data.id, image, token);
  }

  alert('Tour created with images!');
});
</script>
```

## 🎯 Best Practices

### 1. Always Delete Media When Entity is Deleted
```typescript
// Good
await deleteTourImages(tourId);
await deleteTour(tourId);

// Bad
await deleteTour(tourId); // Orphaned files remain
```

### 2. Include Media in Entity Responses
```typescript
// Good - users get media URLs immediately
{
  "tour": { ... },
  "images": [{ "url": "/uploads/tours/..." }]
}

// Bad - requires separate API call
{
  "tour": { ... }
}
```

### 3. Validate on Both Client and Server
```typescript
// Client-side (UX)
if (!validateImage(file).valid) {
  alert('Invalid file');
  return;
}

// Server-side (Security)
// Validation happens automatically in media.service.ts
```

### 4. Handle Upload Errors Gracefully
```typescript
try {
  await uploadTourImage(tourId, file, token);
} catch (error) {
  console.error('Upload failed:', error);
  alert('Failed to upload image. Please try again.');
}
```
