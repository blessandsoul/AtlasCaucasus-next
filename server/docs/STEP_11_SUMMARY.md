# Step 11 Summary: Add Media to API Responses

## What Was Implemented

Step 11 added media (images) to API responses for tours, so when you fetch tour data, you automatically get associated images included in the response.

## Problem Solved

**Before Step 11:**
```json
// GET /api/v1/tours/abc-123
{
  "id": "abc-123",
  "title": "Mountain Trek",
  "price": "150",
  // ...no images
}

// Need separate API call
// GET /api/v1/media/tour/abc-123
{
  "images": [...]
}
```

**After Step 11:**
```json
// GET /api/v1/tours/abc-123
{
  "id": "abc-123",
  "title": "Mountain Trek",
  "price": "150",
  "images": [
    {
      "id": "media-1",
      "url": "/uploads/tours/abc-mountain.jpg",
      "filename": "abc-mountain.jpg",
      "size": 245678,
      "mimeType": "image/jpeg"
    }
  ]
}
```

## Files Modified

### 1. Tour Types
**File:** `server/src/modules/tours/tour.types.ts`

**Changes:**
```typescript
// Added import
import type { SafeMedia } from "../media/media.types.js";

// Updated SafeTour interface
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
  images?: SafeMedia[]; // ← NEW: Media images associated with tour
}
```

### 2. Tour Repository
**File:** `server/src/modules/tours/tour.repo.ts`

**Changes:**
```typescript
// Added import
import { getMediaByEntity } from "../media/media.repo.js";

// Added new helper function
async function toSafeTourWithMedia(tour: PrismaTour): Promise<SafeTour> {
  const safeTour = toSafeTour(tour);
  const media = await getMediaByEntity("tour", tour.id);
  return {
    ...safeTour,
    images: media,
  };
}

// Updated getTourById
export async function getTourById(id: string): Promise<SafeTour | null> {
  const tour = await prisma.tour.findUnique({
    where: { id },
  });

  return tour ? await toSafeTourWithMedia(tour) : null; // ← Now includes media
}

// Updated listToursByOwner
export async function listToursByOwner(...): Promise<SafeTour[]> {
  const tours = await prisma.tour.findMany({...});

  return Promise.all(tours.map(toSafeTourWithMedia)); // ← Now includes media
}

// Updated listAllActiveTours
export async function listAllActiveTours(...): Promise<SafeTour[]> {
  const tours = await prisma.tour.findMany({...});

  return Promise.all(tours.map(toSafeTourWithMedia)); // ← Now includes media
}
```

## How It Works

### Data Flow

1. **Tour requested** via API
2. **Fetch tour** from database
3. **Fetch associated media** for that tour
4. **Combine data** into single response
5. **Return to client** with images included

### Helper Function

The new `toSafeTourWithMedia` helper:
```typescript
async function toSafeTourWithMedia(tour: PrismaTour): Promise<SafeTour> {
  const safeTour = toSafeTour(tour);                    // Convert to SafeTour
  const media = await getMediaByEntity("tour", tour.id); // Fetch media
  return {
    ...safeTour,
    images: media,                                       // Add media to response
  };
}
```

## API Response Examples

### Get Single Tour
```http
GET /api/v1/tours/abc-123-uuid
```

**Response:**
```json
{
  "success": true,
  "message": "Tour retrieved successfully",
  "data": {
    "id": "abc-123-uuid",
    "ownerId": "user-uuid",
    "companyId": null,
    "title": "Mountain Trek Adventure",
    "summary": "Experience the beauty of Georgian mountains",
    "description": "Full day hiking tour...",
    "price": "150",
    "currency": "GEL",
    "durationMinutes": 480,
    "maxPeople": 12,
    "difficulty": "moderate",
    "category": "hiking",
    "isActive": true,
    "isFeatured": false,
    "createdAt": "2026-01-14T10:00:00Z",
    "updatedAt": "2026-01-14T10:00:00Z",
    "images": [
      {
        "id": "media-uuid-1",
        "filename": "a1b2c3d4-mountain-view.jpg",
        "originalName": "mountain-view.jpg",
        "url": "/uploads/tours/a1b2c3d4-mountain-view.jpg",
        "size": 345678,
        "mimeType": "image/jpeg",
        "entityType": "tour",
        "entityId": "abc-123-uuid",
        "uploadedBy": "user-uuid",
        "createdAt": "2026-01-14T10:30:00Z",
        "updatedAt": "2026-01-14T10:30:00Z"
      },
      {
        "id": "media-uuid-2",
        "filename": "e5f6g7h8-trail.jpg",
        "originalName": "trail.jpg",
        "url": "/uploads/tours/e5f6g7h8-trail.jpg",
        "size": 234567,
        "mimeType": "image/jpeg",
        "entityType": "tour",
        "entityId": "abc-123-uuid",
        "uploadedBy": "user-uuid",
        "createdAt": "2026-01-14T10:35:00Z",
        "updatedAt": "2026-01-14T10:35:00Z"
      }
    ]
  }
}
```

### List All Tours
```http
GET /api/v1/tours?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "message": "Tours retrieved successfully",
  "data": {
    "items": [
      {
        "id": "tour-1",
        "title": "Mountain Trek",
        "price": "150",
        "images": [
          { "id": "img-1", "url": "/uploads/tours/..." },
          { "id": "img-2", "url": "/uploads/tours/..." }
        ]
      },
      {
        "id": "tour-2",
        "title": "Wine Tasting",
        "price": "80",
        "images": [
          { "id": "img-3", "url": "/uploads/tours/..." }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 25,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

### Tour Without Images
```json
{
  "id": "tour-without-images",
  "title": "New Tour",
  "images": [] // Empty array if no images
}
```

## Benefits

### 1. Single API Call
✅ **Before:** 2 API calls (tour + media)
✅ **After:** 1 API call (tour with media)

### 2. Performance
✅ Reduced network requests
✅ Faster page loads
✅ Better UX

### 3. Developer Experience
✅ Simpler frontend code
✅ No need to manage separate media state
✅ Consistent data structure

### 4. Data Consistency
✅ Tour and images always in sync
✅ No race conditions
✅ Atomic data fetching

## Frontend Impact

### Before Step 11
```typescript
// Needed 2 requests
const tour = await fetch(`/api/v1/tours/${tourId}`);
const media = await fetch(`/api/v1/media/tour/${tourId}`);

// Combine manually
const tourWithImages = {
  ...tour,
  images: media.data
};
```

### After Step 11
```typescript
// Single request
const tour = await fetch(`/api/v1/tours/${tourId}`);
// tour.images already included!

// Use images directly
tour.images.map(img => (
  <img src={img.url} alt={tour.title} />
))
```

## Performance Considerations

### Query Optimization

The implementation uses `Promise.all` for efficient parallel fetching:
```typescript
return Promise.all(tours.map(toSafeTourWithMedia));
```

This means:
- 1 query for tours
- 1 query per tour for media (in parallel)
- Total: O(n+1) queries where n = number of tours

### Potential Optimization (Future)

For even better performance, could use a single query with JOIN:
```typescript
const tours = await prisma.tour.findMany({
  include: {
    media: true // Prisma JOIN
  }
});
```

However, current approach is simpler and works with existing media module architecture.

## Testing

### Test Tour with Images
```bash
# 1. Create tour
POST /api/v1/tours
{ "title": "Test Tour", "price": 100 }

# 2. Upload images
POST /api/v1/tours/{tourId}/images
[Upload 3 images]

# 3. Get tour
GET /api/v1/tours/{tourId}

# Response should include images array with 3 items
```

### Test Tour without Images
```bash
# 1. Create tour
POST /api/v1/tours
{ "title": "New Tour", "price": 50 }

# 2. Get tour immediately
GET /api/v1/tours/{tourId}

# Response should include empty images array: []
```

### Test List Endpoint
```bash
# Get all tours
GET /api/v1/tours?page=1&limit=10

# Each tour in items array should have images property
```

## Next Steps

This pattern can be extended to other entities:

### Companies (Future)
```typescript
export interface CompanyResponse {
  id: string;
  name: string;
  // ...
  logo?: SafeMedia;      // Single logo
  images?: SafeMedia[];  // Gallery images
}
```

### Guides (Future)
```typescript
export interface GuideResponse {
  id: string;
  name: string;
  // ...
  photos?: SafeMedia[];  // Profile photos
}
```

### Drivers (Future)
```typescript
export interface DriverResponse {
  id: string;
  name: string;
  // ...
  photos?: SafeMedia[];  // Profile photos
}
```

## Status

✅ **Step 11 Complete (Tours Module)**

**Implemented:**
- ✅ Tour types updated
- ✅ Tour repository updated
- ✅ Media included in all tour endpoints

**Remaining (from original plan):**
- Step 12: Background cleanup job (optional)
- Step 13: Environment variables
- Step 15: Seed data (optional)
- Extend to other entities: Companies, Guides, Drivers (optional)

---

**Last Updated**: January 14, 2026
