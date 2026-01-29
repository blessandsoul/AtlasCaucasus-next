# Media Extension Summary: Companies, Guides, Drivers, Users

## What Was Implemented

Extended the media integration from tours to all other entities (companies, guides, drivers, users), so they now automatically include their associated images/photos/avatars in API responses.

## Problem Solved

**Before Extension:**
```json
// GET /api/v1/companies/abc-123
{
  "id": "abc-123",
  "companyName": "Mountain Adventures",
  // ...no images
}

// Need separate API call
// GET /api/v1/media/company/abc-123
```

**After Extension:**
```json
// GET /api/v1/companies/abc-123
{
  "id": "abc-123",
  "companyName": "Mountain Adventures",
  "images": [
    {
      "id": "media-1",
      "url": "/uploads/companies/logo.jpg",
      // ...
    }
  ]
}
```

## Files Modified

### 1. Company Types
**File:** `server/src/modules/companies/company.types.ts`

**Changes:**
```typescript
import type { SafeMedia } from "../media/media.types.js";

export interface CompanyResponse extends Company {
    user: { /* ... */ };
    images?: SafeMedia[]; // Media images/logo associated with company
}
```

### 2. Company Repository
**File:** `server/src/modules/companies/company.repo.ts`

**Changes:**
```typescript
import { getMediaByEntity } from "../media/media.repo.js";

async function toCompanyResponseWithMedia(company: any): Promise<CompanyResponse> {
    const media = await getMediaByEntity("company", company.id);
    return {
        ...company,
        images: media,
    };
}

export async function findById(id: string): Promise<CompanyResponse | null> {
    const company = await prisma.company.findUnique({ /* ... */ });
    return company ? await toCompanyResponseWithMedia(company) : null;
}

export async function findAll(...): Promise<{ companies: CompanyResponse[]; total: number }> {
    const [companies, total] = await Promise.all([/* ... */]);
    const companiesWithMedia = await Promise.all(
        companies.map(toCompanyResponseWithMedia)
    );
    return { companies: companiesWithMedia, total };
}
```

### 3. Guide Types
**File:** `server/src/modules/guides/guide.types.ts`

**Changes:**
```typescript
import type { SafeMedia } from "../media/media.types.js";

export interface GuideResponse extends Guide {
    user: { /* ... */ };
    locations: Location[];
    photos?: SafeMedia[]; // Media photos associated with guide
}
```

### 4. Guide Repository
**File:** `server/src/modules/guides/guide.repo.ts`

**Changes:**
```typescript
import { getMediaByEntity } from "../media/media.repo.js";

async function toGuideResponseWithMedia(guide: any): Promise<GuideResponse> {
    const media = await getMediaByEntity("guide", guide.id);
    return {
        ...guide,
        locations: guide.locations.map((gl: any) => gl.location),
        photos: media,
    };
}

export async function findById(id: string): Promise<GuideResponse | null> {
    const guide = await prisma.guide.findUnique({ /* ... */ });
    if (!guide) return null;
    return await toGuideResponseWithMedia(guide);
}

export async function findAll(...): Promise<{ guides: GuideResponse[]; total: number }> {
    const [guides, total] = await Promise.all([/* ... */]);
    const guidesWithMedia = await Promise.all(
        guides.map(toGuideResponseWithMedia)
    );
    return { guides: guidesWithMedia, total };
}
```

### 5. Driver Types
**File:** `server/src/modules/drivers/driver.types.ts`

**Changes:**
```typescript
import type { SafeMedia } from "../media/media.types.js";

export interface DriverResponse extends Driver {
    user: { /* ... */ };
    locations: Location[];
    photos?: SafeMedia[]; // Media photos associated with driver
}
```

### 6. Driver Repository
**File:** `server/src/modules/drivers/driver.repo.ts`

**Changes:**
```typescript
import { getMediaByEntity } from "../media/media.repo.js";

async function toDriverResponseWithMedia(driver: any): Promise<DriverResponse> {
    const media = await getMediaByEntity("driver", driver.id);
    return {
        ...driver,
        locations: driver.locations.map((dl: any) => dl.location),
        photos: media,
    };
}

export async function findById(id: string): Promise<DriverResponse | null> {
    const driver = await prisma.driver.findUnique({ /* ... */ });
    if (!driver) return null;
    return await toDriverResponseWithMedia(driver);
}

export async function findAll(...): Promise<{ drivers: DriverResponse[]; total: number }> {
    const [drivers, total] = await Promise.all([/* ... */]);
    const driversWithMedia = await Promise.all(
        drivers.map(toDriverResponseWithMedia)
    );
    return { drivers: driversWithMedia, total };
}
```

### 7. User Types
**File:** `server/src/modules/users/user.types.ts`

**Changes:**
```typescript
import type { SafeMedia } from "../media/media.types.js";

export interface SafeUser {
  id: string;
  email: string;
  // ...
  avatar?: SafeMedia; // User avatar (single image)
}
```

### 8. User Service
**File:** `server/src/modules/users/user.service.ts`

**Changes:**
```typescript
import { getMediaByEntity } from "../media/media.repo.js";

async function toSafeUser(user: User): Promise<SafeUser> {
  const media = await getMediaByEntity("user", user.id);
  return {
    id: user.id,
    email: user.email,
    // ...
    avatar: media.length > 0 ? media[0] : undefined, // First image as avatar
  };
}

// All functions now use: await toSafeUser(user)
export async function createUser(...): Promise<SafeUser> {
  const user = await userRepo.createUser({ /* ... */ });
  return await toSafeUser(user);
}

export async function getUserById(id: string): Promise<SafeUser> {
  const user = await userRepo.findUserById(id);
  if (!user) throw new NotFoundError("User not found", "USER_NOT_FOUND");
  return await toSafeUser(user);
}

export async function getAllUsers(...): Promise<{ items: SafeUser[]; totalItems: number }> {
  const users = await userRepo.findAllUsers(offset, limit);
  const safeUsers = await Promise.all(users.map(toSafeUser));
  return { items: safeUsers, totalItems };
}
```

## How It Works

### Common Pattern

All entities now follow the same pattern as tours (Step 11):

1. **Add media field to type definition**
   - Companies: `images?: SafeMedia[]`
   - Guides: `photos?: SafeMedia[]`
   - Drivers: `photos?: SafeMedia[]`
   - Users: `avatar?: SafeMedia` (single image)

2. **Create helper function in repository**
   ```typescript
   async function to[Entity]ResponseWithMedia(entity: any): Promise<EntityResponse> {
       const media = await getMediaByEntity("entityType", entity.id);
       return { ...entity, images/photos/avatar: media };
   }
   ```

3. **Update all fetch functions**
   - Single item: `return entity ? await toEntityResponseWithMedia(entity) : null`
   - Multiple items: `await Promise.all(entities.map(toEntityResponseWithMedia))`

## API Response Examples

### Companies

**Single Company:**
```http
GET /api/v1/companies/company-uuid
```

```json
{
  "success": true,
  "message": "Company retrieved successfully",
  "data": {
    "id": "company-uuid",
    "companyName": "Mountain Adventures",
    "description": "Professional tour operator",
    "user": {
      "id": "user-uuid",
      "email": "company@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "images": [
      {
        "id": "media-uuid-1",
        "url": "/uploads/companies/logo.jpg",
        "filename": "abc123-logo.jpg",
        "mimeType": "image/jpeg",
        "size": 125000
      }
    ]
  }
}
```

**List Companies:**
```http
GET /api/v1/companies?page=1&limit=10
```

```json
{
  "success": true,
  "message": "Companies retrieved successfully",
  "data": {
    "companies": [
      {
        "id": "company-1",
        "companyName": "Mountain Adventures",
        "images": [
          { "id": "img-1", "url": "/uploads/companies/logo.jpg" }
        ]
      },
      {
        "id": "company-2",
        "companyName": "Coastal Tours",
        "images": []
      }
    ],
    "total": 25
  }
}
```

### Guides

**Single Guide:**
```http
GET /api/v1/guides/guide-uuid
```

```json
{
  "success": true,
  "message": "Guide retrieved successfully",
  "data": {
    "id": "guide-uuid",
    "bio": "Experienced mountain guide",
    "languages": ["English", "Georgian", "Russian"],
    "yearsOfExperience": 10,
    "user": {
      "id": "user-uuid",
      "email": "guide@example.com",
      "firstName": "Alex",
      "lastName": "Smith"
    },
    "locations": [
      { "id": "loc-1", "name": "Tbilisi" },
      { "id": "loc-2", "name": "Kazbegi" }
    ],
    "photos": [
      {
        "id": "media-uuid-1",
        "url": "/uploads/guides/profile.jpg",
        "filename": "def456-profile.jpg"
      }
    ]
  }
}
```

### Drivers

**Single Driver:**
```http
GET /api/v1/drivers/driver-uuid
```

```json
{
  "success": true,
  "message": "Driver retrieved successfully",
  "data": {
    "id": "driver-uuid",
    "bio": "Professional driver with 15 years experience",
    "vehicleType": "SUV",
    "vehicleCapacity": 7,
    "vehicleMake": "Toyota",
    "vehicleModel": "Land Cruiser",
    "user": {
      "id": "user-uuid",
      "email": "driver@example.com",
      "firstName": "George",
      "lastName": "Brown"
    },
    "locations": [
      { "id": "loc-1", "name": "Tbilisi" }
    ],
    "photos": [
      {
        "id": "media-uuid-1",
        "url": "/uploads/drivers/vehicle.jpg"
      },
      {
        "id": "media-uuid-2",
        "url": "/uploads/drivers/profile.jpg"
      }
    ]
  }
}
```

### Users

**Current User:**
```http
GET /api/v1/users/me
```

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "roles": ["USER"],
    "isActive": true,
    "emailVerified": true,
    "avatar": {
      "id": "media-uuid-1",
      "url": "/uploads/users/avatar.jpg",
      "filename": "ghi789-avatar.jpg",
      "mimeType": "image/jpeg",
      "size": 85000
    }
  }
}
```

**Without Avatar:**
```json
{
  "id": "user-uuid-2",
  "email": "newuser@example.com",
  // ... other fields
  "avatar": null  // or undefined
}
```

## Key Differences

### Tours, Companies, Guides, Drivers
- **Field name:** `images` (companies/tours) or `photos` (guides/drivers)
- **Type:** `SafeMedia[]` (array)
- **Purpose:** Multiple images/photos per entity
- **Usage:** Logo + gallery images, profile photos, vehicle photos

### Users
- **Field name:** `avatar`
- **Type:** `SafeMedia | undefined` (single image)
- **Purpose:** Single profile picture
- **Logic:** Takes first image from media array
- **Usage:** User profile avatar

## Existing Infrastructure Used

All entities now benefit from:

1. **Upload Endpoints** (from Step 8):
   - `POST /api/v1/companies/:companyId/logo`
   - `POST /api/v1/guides/:guideId/photo`
   - `POST /api/v1/drivers/:driverId/photo`
   - `POST /api/v1/users/:userId/avatar`

2. **Media Cleanup** (from Step 10):
   - Company deletion → `deleteCompanyMedia()` already integrated
   - Guide deletion → `deleteGuidePhotos()` already integrated
   - Driver deletion → `deleteDriverPhotos()` already integrated
   - User deletion → Need to add `deleteUserAvatar()` call

3. **Generic Endpoints** (still available):
   - `GET /api/v1/media/:entityType/:entityId`
   - `DELETE /api/v1/media/:id`

4. **Background Cleanup** (from Step 12):
   - Orphaned company/guide/driver/user media automatically cleaned

5. **Environment Configuration** (from Step 13):
   - All settings apply to all entity types

## Benefits

### 1. Consistent API
✅ All entities follow same pattern
✅ Predictable response structure
✅ Easy for frontend developers

### 2. Performance
✅ Single API call per entity
✅ Parallel media fetching with `Promise.all`
✅ Reduced network requests

### 3. Developer Experience
✅ Same pattern across codebase
✅ Easy to add new entity types
✅ Minimal code duplication

### 4. Maintainability
✅ Centralized media logic
✅ Helper function pattern
✅ Type-safe with TypeScript

## Frontend Impact

### Before Extension
```typescript
// Multiple API calls needed
const company = await fetch(`/api/v1/companies/${id}`);
const media = await fetch(`/api/v1/media/company/${id}`);
const companyWithImages = { ...company, images: media.data };
```

### After Extension
```typescript
// Single API call
const company = await fetch(`/api/v1/companies/${id}`);
// company.images already included!
```

## Performance Considerations

### Query Pattern
```typescript
// 1 query for company/guide/driver
const entity = await prisma.entity.findUnique({ /* ... */ });

// 1 query for media
const media = await prisma.media.findMany({
  where: { entityType, entityId }
});

// Total: 2 queries per entity
// For lists: 1 + N queries (1 for entities, N parallel media queries)
```

### Optimization (Future)
Could use Prisma includes with virtual relations, but current approach:
- Simple to understand
- Works with existing media module
- Performs well with `Promise.all` parallelization

## Testing

### Test Company with Media
```bash
# 1. Create company (via registration or admin)
POST /api/v1/companies

# 2. Upload logo
POST /api/v1/companies/{companyId}/logo
[Upload image]

# 3. Get company
GET /api/v1/companies/{companyId}

# Response should include images array
```

### Test Guide with Photos
```bash
# 1. Create guide profile
POST /api/v1/guides

# 2. Upload photo
POST /api/v1/guides/{guideId}/photo
[Upload image]

# 3. Get guide
GET /api/v1/guides/{guideId}

# Response should include photos array
```

### Test User Avatar
```bash
# 1. Register user
POST /api/v1/auth/register

# 2. Upload avatar
POST /api/v1/users/{userId}/avatar
[Upload image]

# 3. Get current user
GET /api/v1/users/me

# Response should include avatar object (not array)
```

## Media Cleanup Integration

All entities already have cleanup integrated (from Step 10):

```typescript
// Companies
export async function deleteCompany(id: string, ...): Promise<void> {
    await deleteCompanyMedia(id); // ✅ Already integrated
    await companyRepo.deleteCompany(id);
}

// Guides
export async function deleteGuide(id: string, ...): Promise<void> {
    await deleteGuidePhotos(id); // ✅ Already integrated
    await guideRepo.deleteGuide(id);
}

// Drivers
export async function deleteDriver(id: string, ...): Promise<void> {
    await deleteDriverPhotos(id); // ✅ Already integrated
    await driverRepo.deleteDriver(id);
}

// Users - Need to add this
export async function deleteUser(id: string): Promise<void> {
    const existingUser = await userRepo.findUserById(id);
    if (!existingUser) {
        throw new NotFoundError("User not found", "USER_NOT_FOUND");
    }

    // TODO: Add media cleanup
    // await deleteUserAvatar(id);

    await userRepo.softDeleteUser(id);
}
```

## Status

✅ **Media Extension Complete**

**Implemented:**
- ✅ Companies - images field added
- ✅ Guides - photos field added
- ✅ Drivers - photos field added
- ✅ Users - avatar field added
- ✅ All repositories updated
- ✅ All services updated (user service)
- ✅ Helper functions created
- ✅ Media automatically included in responses

**Already Working (from previous steps):**
- ✅ Upload endpoints for all entities
- ✅ Cleanup on entity deletion (companies, guides, drivers)
- ✅ Background cleanup job
- ✅ Environment configuration

**Future Enhancements (Optional):**
- Add user avatar cleanup on user deletion
- Optimize with Prisma virtual relations
- Add media ordering/sorting
- Add featured image flag

---

**Last Updated**: January 14, 2026
