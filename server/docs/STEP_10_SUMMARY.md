# Step 10 Summary: Media Cleanup on Entity Deletion

## What Was Implemented

Step 10 integrated media cleanup into existing entity deletion workflows. Now when a tour, company, guide, or driver is deleted, all associated media files are automatically cleaned up.

## Problem Solved

**Before Step 10:**
- Deleting an entity left orphaned files on disk
- Database media records remained but files were inaccessible
- Wasted disk space
- No automatic cleanup mechanism

**After Step 10:**
- Deleting an entity automatically deletes all its media
- Both database records AND physical files are removed
- Clean, automatic, no orphaned files
- Maintains data integrity

## Files Modified

### 1. Tour Service
**File:** `server/src/modules/tours/tour.service.ts`

**Changes:**
```typescript
// Added import
import { deleteTourImages } from "../media/media.helpers.js";

// Modified softDeleteTourForUser function
export async function softDeleteTourForUser(
  currentUser: JwtUser,
  id: string,
): Promise<SafeTour> {
  const tour = await getTourById(id);

  if (!tour) {
    throw new NotFoundError("Tour not found", "TOUR_NOT_FOUND");
  }

  assertOwnerOrAdmin(tour, currentUser);

  // Delete associated media files before soft deleting tour
  await deleteTourImages(id); // ← NEW

  const deleted = await softDeleteTour(id);

  if (!deleted) {
    throw new NotFoundError("Tour not found", "TOUR_NOT_FOUND");
  }

  return deleted;
}
```

### 2. Company Service
**File:** `server/src/modules/companies/company.service.ts`

**Changes:**
```typescript
// Added import
import { deleteCompanyMedia } from "../media/media.helpers.js";

// Modified deleteCompany function
export async function deleteCompany(
    id: string,
    userId: string,
    userRoles: UserRole[]
): Promise<void> {
    // Verify company exists
    await getCompanyById(id);

    // Verify ownership or admin
    const hasPermission = await verifyCompanyOwnership(id, userId, userRoles);
    if (!hasPermission) {
        throw new ForbiddenError(
            "You do not have permission to delete this company",
            "FORBIDDEN"
        );
    }

    // Delete associated media files (logo, images) before deleting company
    await deleteCompanyMedia(id); // ← NEW

    await companyRepo.deleteCompany(id);
}
```

### 3. Guide Service
**File:** `server/src/modules/guides/guide.service.ts`

**Changes:**
```typescript
// Added import
import { deleteGuidePhotos } from "../media/media.helpers.js";

// Modified deleteGuide function
export async function deleteGuide(
    id: string,
    userId: string,
    userRoles: UserRole[]
): Promise<void> {
    // Verify guide exists
    await getGuideById(id);

    // Verify ownership or admin
    const hasPermission = await verifyGuideOwnership(id, userId, userRoles);
    if (!hasPermission) {
        throw new ForbiddenError(
            "You do not have permission to delete this guide profile",
            "FORBIDDEN"
        );
    }

    // Delete associated media files (photos) before deleting guide
    await deleteGuidePhotos(id); // ← NEW

    await guideRepo.deleteGuide(id);
}
```

### 4. Driver Service
**File:** `server/src/modules/drivers/driver.service.ts`

**Changes:**
```typescript
// Added import
import { deleteDriverPhotos } from "../media/media.helpers.js";

// Modified deleteDriver function
export async function deleteDriver(
    id: string,
    userId: string,
    userRoles: UserRole[]
): Promise<void> {
    await getDriverById(id);

    const hasPermission = await verifyDriverOwnership(id, userId, userRoles);
    if (!hasPermission) {
        throw new ForbiddenError(
            "You do not have permission to delete this driver profile",
            "FORBIDDEN"
        );
    }

    // Delete associated media files (photos) before deleting driver
    await deleteDriverPhotos(id); // ← NEW

    await driverRepo.deleteDriver(id);
}
```

## How It Works

### Cleanup Flow

1. **User deletes entity** (tour, company, guide, driver)
2. **Verify permissions** (ownership or admin)
3. **Delete media files**:
   - Query database for all media records for this entity
   - Delete physical files from disk
   - Delete database records
4. **Delete entity** from database

### Helper Functions Used

Each entity type uses a specialized helper:

| Entity | Helper Function | What It Deletes |
|--------|----------------|-----------------|
| Tour | `deleteTourImages(tourId)` | All tour images |
| Company | `deleteCompanyMedia(companyId)` | Logo + company images |
| Guide | `deleteGuidePhotos(guideId)` | All guide photos |
| Driver | `deleteDriverPhotos(driverId)` | All driver photos |

### Error Handling

- If media deletion fails, the error is logged but doesn't block entity deletion
- Ensures entity can always be deleted even if media cleanup has issues
- Prevents orphaned entities

## Testing the Integration

### Test Tour Deletion
```bash
# 1. Create a tour
POST /api/v1/tours
{ "title": "Test Tour", "price": 100, ... }

# 2. Upload images
POST /api/v1/tours/{tourId}/images
[Upload 3 images]

# 3. Verify images exist
GET /api/v1/media/tour/{tourId}
# Should return 3 images

# 4. Delete tour
DELETE /api/v1/tours/{tourId}

# 5. Verify images are gone
GET /api/v1/media/tour/{tourId}
# Should return empty array []

# 6. Check disk
ls uploads/tours/
# Tour images should be deleted
```

### Test Company Deletion
```bash
# 1. Create company
POST /api/v1/companies
{ "name": "Test Company", ... }

# 2. Upload logo
POST /api/v1/companies/{companyId}/logo
[Upload logo]

# 3. Delete company
DELETE /api/v1/companies/{companyId}

# 4. Verify logo is gone
GET /api/v1/media/company/{companyId}
# Should return empty array
```

## Benefits

### 1. Data Integrity
✅ No orphaned files on disk
✅ Database and filesystem stay in sync
✅ Clean deletion flow

### 2. Disk Space Management
✅ Automatic cleanup prevents disk bloat
✅ No manual cleanup needed
✅ Efficient storage usage

### 3. Developer Experience
✅ Automatic - no extra code needed
✅ Consistent across all entity types
✅ Easy to understand and maintain

### 4. User Experience
✅ Fast deletion (no manual cleanup step)
✅ Complete removal of data
✅ Privacy-friendly

## Edge Cases Handled

### 1. Entity with No Media
- Helper functions handle empty results gracefully
- No errors thrown if no media exists
- Entity deletion proceeds normally

### 2. Media Deletion Fails
- Logged as warning
- Entity deletion still proceeds
- Prevents deletion deadlock

### 3. Partial Media Deletion
- Uses Promise.all for parallel deletion
- If some files fail, others still deleted
- All attempts logged

## Comparison: Before vs After

### Before (Without Cleanup)
```typescript
export async function deleteCompany(id: string, ...): Promise<void> {
    await verifyPermissions();
    await companyRepo.deleteCompany(id);
    // ❌ Media files left on disk
    // ❌ Media records left in database
}
```

### After (With Cleanup)
```typescript
export async function deleteCompany(id: string, ...): Promise<void> {
    await verifyPermissions();
    await deleteCompanyMedia(id); // ✅ Cleans everything
    await companyRepo.deleteCompany(id);
}
```

## Future Enhancements (Optional)

### Background Cleanup Job
For extra safety, could add a scheduled job to:
- Find orphaned media records (entity doesn't exist)
- Delete orphaned files
- Run daily/weekly

### Soft Delete Media
Instead of hard deleting media, could:
- Mark media as deleted
- Keep files for N days
- Allow recovery
- Permanent deletion after grace period

### Audit Log
Could log all media deletions:
- Who deleted
- When deleted
- What was deleted
- For compliance/debugging

## Status

✅ **Step 10 Complete**

**Integrated:**
- ✅ Tour service
- ✅ Company service
- ✅ Guide service
- ✅ Driver service

**Remaining (from original plan):**
- Step 11: Add media to API responses (include images in tour/company/etc. responses)
- Step 12: Background cleanup job (optional)
- Step 13: Environment variables
- Step 15: Seed data (optional)

---

**Last Updated**: January 14, 2026
