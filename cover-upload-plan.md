# Cover Image Upload Feature - Implementation Plan

## Current State

All entity detail pages already display cover/hero images but with **hardcoded Unsplash URLs**:
- **Company** (`client/src/app/explore/companies/[id]/page.tsx:104-105`): `https://images.unsplash.com/photo-1565008447742-97f6f38c985c`
- **Driver** (`client/src/app/explore/drivers/[id]/page.tsx:58`): `https://images.unsplash.com/photo-1449965408869-eaa3f722e40d`
- **Guide** (`client/src/app/explore/guides/[id]/page.tsx:57`): `https://images.unsplash.com/photo-1565008447742-97f6f38c985c`

The existing **avatar upload pattern** (`guide-avatar`, `driver-avatar`) is the ideal template - covers work identically: single image per entity, replace existing on re-upload, returned as a URL field in the entity response.

## Architecture Decision

Use the **media entity type approach** (same as avatars) - **no schema migration needed**. Cover images stored in the `media` table with entity types: `company-cover`, `guide-cover`, `driver-cover`.

**Scope**: Companies, Guides, and Drivers only (no users - no public profile page yet).

---

## Step 1: Server - Add Cover Entity Types

**File**: `server/src/modules/media/media.types.ts`

Add cover variants to the union type:

```typescript
// Current
export type MediaEntityType = BaseMediaEntityType | "guide-avatar" | "driver-avatar";

// Updated
export type MediaEntityType = BaseMediaEntityType
  | "guide-avatar" | "driver-avatar"
  | "company-cover" | "guide-cover" | "driver-cover";
```

---

## Step 2: Server - Add Cover Helper Functions

**File**: `server/src/modules/media/media.helpers.ts`

Follow the exact pattern of `uploadDriverAvatar` / `uploadGuideAvatar`. For each entity add 3 functions:

**Company Cover** (reuse `isCompanyOwner`, `generateEntitySlug`):
- `uploadCompanyCover(currentUser, companyId, file)` - Delete existing `company-cover`, upload new
- `getCompanyCover(companyId)` - `getMediaForEntity("company-cover", companyId)`
- `deleteCompanyCover(companyId)` - `deleteAllMediaForEntity("company-cover", companyId)`

**Guide Cover** (reuse `isGuideOwner`, `getGuideDisplayName`):
- `uploadGuideCover(currentUser, guideId, file)` - Delete existing `guide-cover`, upload new
- `getGuideCover(guideId)` - `getMediaForEntity("guide-cover", guideId)`
- `deleteGuideCover(guideId)` - `deleteAllMediaForEntity("guide-cover", guideId)`

**Driver Cover** (reuse `isDriverOwner`, `getDriverDisplayName`):
- `uploadDriverCover(currentUser, driverId, file)` - Delete existing `driver-cover`, upload new
- `getDriverCover(driverId)` - `getMediaForEntity("driver-cover", driverId)`
- `deleteDriverCover(driverId)` - `deleteAllMediaForEntity("driver-cover", driverId)`

**Existing functions to reuse** (already in `media.helpers.ts` and `media.service.ts`):
- `uploadMediaForEntity()`, `deleteAllMediaForEntity()`, `getMediaForEntity()`
- Ownership helpers: `isCompanyOwner()`, `isGuideOwner()`, `isDriverOwner()`
- Name helpers: `generateEntitySlug()`, `getGuideDisplayName()`, `getDriverDisplayName()`
- Entity lookups: `getCompanyById()`, `getGuideById()`, `getDriverById()`

---

## Step 3: Server - Add Cover Upload Controller Handlers

**File**: `server/src/modules/media/media.controller.ts`

Add 3 new handlers following the exact pattern of `uploadDriverAvatarHandler`:

- `uploadCompanyCoverHandler` - calls `uploadCompanyCover()`
- `uploadGuideCoverHandler` - calls `uploadGuideCover()`
- `uploadDriverCoverHandler` - calls `uploadDriverCover()`

Each: extract file from multipart -> convert to `UploadedFile` -> call helper -> return `201` with `successResponse`.

---

## Step 4: Server - Add Cover Upload Routes

**File**: `server/src/modules/media/media.routes.ts`

```
POST /companies/:companyId/cover  -> uploadCompanyCoverHandler  [authGuard, requireVerifiedEmail]
POST /guides/:guideId/cover       -> uploadGuideCoverHandler    [authGuard, requireVerifiedEmail]
POST /drivers/:driverId/cover     -> uploadDriverCoverHandler   [authGuard, requireVerifiedEmail]
```

---

## Step 5: Server - Return `coverUrl` in Entity Responses

### 5.1 `server/src/modules/drivers/driver.repo.ts` - `toDriverResponseWithMedia()`

Add (after existing avatar fetch at line 10):
```typescript
const coverMedia = await getMediaByEntity("driver-cover", driver.id);
const cover = coverMedia.length > 0 ? coverMedia[0] : null;
```
Add to return object: `coverUrl: cover?.url ?? null`

### 5.2 `server/src/modules/guides/guide.repo.ts` - `toGuideResponseWithMedia()`

Same pattern - fetch `guide-cover`, add `coverUrl`.

### 5.3 `server/src/modules/companies/company.repo.ts` - `toCompanyResponseWithMedia()`

Same pattern - fetch `company-cover`, add `coverUrl`.

### 5.4 Update server-side response types

Add `coverUrl: string | null` to:
- `server/src/modules/drivers/driver.types.ts` - `DriverResponse`
- `server/src/modules/guides/guide.types.ts` - `GuideResponse`
- `server/src/modules/companies/company.types.ts` - `CompanyResponse`

---

## Step 6: Client - Update Types

Add `coverUrl: string | null` to:
- `client/src/features/drivers/types/driver.types.ts` - `Driver` interface
- `client/src/features/guides/types/guide.types.ts` - `Guide` interface
- `client/src/features/companies/types/company.types.ts` - `Company` interface

---

## Step 7: Client - Add Cover Upload Services & Hooks

### 7.1 Service methods

Add `uploadCover(entityId, file)` to each service (same pattern as existing `uploadAvatar`):

- `client/src/features/drivers/services/driver.service.ts`
- `client/src/features/guides/services/guide.service.ts`
- `client/src/features/companies/services/company.service.ts`

### 7.2 React Query mutation hooks

Create following the pattern of existing `useUploadDriverAvatar`:

- `client/src/features/drivers/hooks/useUploadDriverCover.ts` (new file)
- `client/src/features/guides/hooks/useUploadGuideCover.ts` (new file)
- `client/src/features/companies/hooks/useUploadCompanyCover.ts` (new file)

Each invalidates the entity query cache on success + shows toast.

---

## Step 8: Client - Display Cover Images from API

### 8.1 Replace hardcoded URLs with `coverUrl` from API

**Company** (`client/src/app/explore/companies/[id]/page.tsx:104-105`):
```typescript
// Replace: const coverImage = 'https://images.unsplash.com/...';
const coverImage = company.coverUrl
  ? getMediaUrl(company.coverUrl)
  : '/default-covers/company-cover.jpg';
```

**Driver** (`client/src/app/explore/drivers/[id]/page.tsx:55-62`):
```typescript
const coverImage = driver.coverUrl
  ? getMediaUrl(driver.coverUrl)
  : '/default-covers/driver-cover.jpg';
```

**Guide** (`client/src/app/explore/guides/[id]/page.tsx:54-62`):
```typescript
const coverImage = guide.coverUrl
  ? getMediaUrl(guide.coverUrl)
  : '/default-covers/guide-cover.jpg';
```

### 8.2 Add default cover images

Save the current Unsplash images as local defaults in `client/public/default-covers/`:
- `company-cover.jpg`
- `driver-cover.jpg`
- `guide-cover.jpg`

This ensures pages still look good when no custom cover is uploaded.

---

## Step 9: Client - Cover Upload UI Component

### 9.1 Create reusable `CoverImageUpload` component

**New file**: `client/src/components/common/CoverImageUpload.tsx`

For use on entity edit/dashboard pages. Features:
- Shows current cover (or default)
- Camera/upload icon overlay on hover
- File validation (reuse `validateImageFile` from `client/src/features/media/utils/validation.ts`)
- Preview before upload
- Upload with loading state
- Delete/reset option

```typescript
interface CoverImageUploadProps {
  currentCoverUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  defaultCoverUrl?: string;
  className?: string;
}
```

---

## Files Summary

### Server (10 files)
| File | Change |
|------|--------|
| `server/src/modules/media/media.types.ts` | Add 3 cover entity types to union |
| `server/src/modules/media/media.helpers.ts` | Add 9 cover helper functions (3 per entity) |
| `server/src/modules/media/media.controller.ts` | Add 3 cover upload handlers |
| `server/src/modules/media/media.routes.ts` | Add 3 cover upload routes |
| `server/src/modules/drivers/driver.repo.ts` | Fetch & return `coverUrl` |
| `server/src/modules/guides/guide.repo.ts` | Fetch & return `coverUrl` |
| `server/src/modules/companies/company.repo.ts` | Fetch & return `coverUrl` |
| `server/src/modules/drivers/driver.types.ts` | Add `coverUrl` to `DriverResponse` |
| `server/src/modules/guides/guide.types.ts` | Add `coverUrl` to `GuideResponse` |
| `server/src/modules/companies/company.types.ts` | Add `coverUrl` to `CompanyResponse` |

### Client (13 files, 4 new)
| File | Change |
|------|--------|
| `client/src/features/drivers/types/driver.types.ts` | Add `coverUrl` field |
| `client/src/features/guides/types/guide.types.ts` | Add `coverUrl` field |
| `client/src/features/companies/types/company.types.ts` | Add `coverUrl` field |
| `client/src/features/drivers/services/driver.service.ts` | Add `uploadCover()` method |
| `client/src/features/guides/services/guide.service.ts` | Add `uploadCover()` method |
| `client/src/features/companies/services/company.service.ts` | Add `uploadCover()` method |
| `client/src/features/drivers/hooks/useUploadDriverCover.ts` | **New** - mutation hook |
| `client/src/features/guides/hooks/useUploadGuideCover.ts` | **New** - mutation hook |
| `client/src/features/companies/hooks/useUploadCompanyCover.ts` | **New** - mutation hook |
| `client/src/app/explore/companies/[id]/page.tsx` | Use `coverUrl` from API |
| `client/src/app/explore/drivers/[id]/page.tsx` | Use `coverUrl` from API |
| `client/src/app/explore/guides/[id]/page.tsx` | Use `coverUrl` from API |
| `client/src/components/common/CoverImageUpload.tsx` | **New** - reusable upload component |
| `client/public/default-covers/` | Default fallback images (3 files) |

### No Migration Needed
Cover images stored in existing `media` table using new `entityType` values. No Prisma schema changes required.

---

## Verification

1. **Server API tests** (Postman/curl):
   - `POST /api/v1/companies/:id/cover` with multipart file -> 201, returns media with `entityType: "company-cover"`
   - `GET /api/v1/companies/:id` -> response includes `coverUrl` field with URL
   - Re-upload cover -> old file deleted from disk + DB, new one stored
   - Same for guides and drivers
   - Unauthorized user -> 403

2. **Client display**:
   - Navigate to `/explore/companies/:id` -> shows default cover when no custom upload
   - After uploading via API -> page shows uploaded cover
   - Same for guide and driver detail pages

3. **Cover upload component**:
   - File validation works (reject non-images, files > 5MB)
   - Preview shows before upload
   - Upload replaces existing cover
   - Loading state during upload

4. **Edge cases**:
   - Entity with no cover -> shows fallback default image (not broken `<img>`)
   - Delete entity -> cover media cleaned up (if entity deletion already calls `deleteAllMediaForEntity`)
