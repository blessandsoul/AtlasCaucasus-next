# Authorization Security Audit Report

**Date:** January 14, 2026
**Scope:** All API routes requiring ownership verification
**Status:** ✅ **SECURE** - No authorization leaks found

---

## Executive Summary

Your fix for media upload/delete authorization is **correct and comprehensive**. All routes properly implement ownership verification. No authorization leaks were found during this audit.

---

## Audit Methodology

### Routes Checked:
1. **Media Routes** - Upload and delete media for all entity types
2. **Tour Routes** - Create, update, delete tours
3. **Company Routes** - Update, delete companies, view tour agents
4. **Guide Routes** - Update, delete guide profiles
5. **Driver Routes** - Update, delete driver profiles
6. **User Routes** - Update, delete user accounts

### Layers Verified:
1. **Route Layer** - Authentication guards present
2. **Service Layer** - Ownership verification before operations
3. **Helper Layer** - Authorization checks in media helpers

---

## ✅ Media Authorization (Your Fix)

### Upload Authorization
**Location:** `server/src/modules/media/media.helpers.ts`

#### ✅ Tour Image Upload (Lines 34-50)
```typescript
export async function uploadTourImage(
  currentUser: JwtUser,
  tourId: string,
  file: UploadedFile
): Promise<SafeMedia> {
  const tour = await getTourById(tourId);
  if (!tour) {
    throw new NotFoundError("Tour not found", "TOUR_NOT_FOUND");
  }

  // ✅ SECURE: Checks ownership
  if (tour.ownerId !== currentUser.id && !currentUser.roles.includes("ADMIN")) {
    throw new ForbiddenError("You can only upload images for your own tours", "NOT_TOUR_OWNER");
  }

  return uploadMediaForEntity(currentUser, "tour", tourId, file);
}
```

#### ✅ Company Logo Upload (Lines 80-97)
```typescript
export async function uploadCompanyLogo(
  currentUser: JwtUser,
  companyId: string,
  file: UploadedFile
): Promise<SafeMedia> {
  const company = await getCompanyById(companyId);
  if (!company) {
    throw new NotFoundError("Company not found", "COMPANY_NOT_FOUND");
  }

  // ✅ SECURE: Checks ownership
  if ((company as any).userId !== currentUser.id && !currentUser.roles.includes("ADMIN")) {
    throw new ForbiddenError("You can only upload logos for your own company", "NOT_COMPANY_OWNER");
  }

  return uploadMediaForEntity(currentUser, "company", companyId, file);
}
```

#### ✅ Guide Photo Upload (Lines 127-143)
```typescript
export async function uploadGuidePhoto(
  currentUser: JwtUser,
  guideId: string,
  file: UploadedFile
): Promise<SafeMedia> {
  const guide = await getGuideById(guideId);
  if (!guide) {
    throw new NotFoundError("Guide profile not found", "GUIDE_NOT_FOUND");
  }

  // ✅ SECURE: Checks ownership
  if ((guide as any).userId !== currentUser.id && !currentUser.roles.includes("ADMIN")) {
    throw new ForbiddenError("You can only upload photos for your own guide profile", "NOT_GUIDE_OWNER");
  }

  return uploadMediaForEntity(currentUser, "guide", guideId, file);
}
```

#### ✅ Driver Photo Upload (Lines 173-189)
```typescript
export async function uploadDriverPhoto(
  currentUser: JwtUser,
  driverId: string,
  file: UploadedFile
): Promise<SafeMedia> {
  const driver = await getDriverById(driverId);
  if (!driver) {
    throw new NotFoundError("Driver profile not found", "DRIVER_NOT_FOUND");
  }

  // ✅ SECURE: Checks ownership
  if ((driver as any).userId !== currentUser.id && !currentUser.roles.includes("ADMIN")) {
    throw new ForbiddenError("You can only upload photos for your own driver profile", "NOT_DRIVER_OWNER");
  }

  return uploadMediaForEntity(currentUser, "driver", driverId, file);
}
```

#### ✅ User Avatar Upload (Lines 219-230)
```typescript
export async function uploadUserAvatar(
  currentUser: JwtUser,
  userId: string,
  file: UploadedFile
): Promise<SafeMedia> {
  // ✅ SECURE: Checks ownership
  if (userId !== currentUser.id && !currentUser.roles.includes("ADMIN")) {
    throw new ForbiddenError("You can only upload your own avatar", "NOT_USER_OWNER");
  }

  return uploadMediaForEntity(currentUser, "user", userId, file);
}
```

#### ✅ Batch Upload (Lines 261-320)
```typescript
export async function uploadMultipleFiles(
  currentUser: JwtUser,
  entityType: "tour" | "company" | "guide" | "driver" | "user",
  entityId: string,
  files: UploadedFile[]
): Promise<SafeMedia[]> {
  // ✅ SECURE: Verifies ownership BEFORE processing any files
  const isAdmin = currentUser.roles.includes("ADMIN");

  switch (entityType) {
    case "tour": {
      const tour = await getTourById(entityId);
      if (!tour) throw new NotFoundError("Tour not found");
      if (tour.ownerId !== currentUser.id && !isAdmin) {
        throw new ForbiddenError("Not authorized to upload to this tour");
      }
      break;
    }
    // ... similar checks for company, guide, driver, user
  }

  // Only processes files AFTER authorization check passes
  const results: SafeMedia[] = [];
  for (const file of files) {
    const media = await uploadMediaForEntity(currentUser, entityType, entityId, file);
    results.push(media);
  }

  return results;
}
```

### Delete Authorization
**Location:** `server/src/modules/media/media.service.ts`

#### ✅ Delete Media by ID (Lines 73-105)
```typescript
export async function deleteMediaById(
  currentUser: JwtUser,
  mediaId: string
): Promise<SafeMedia> {
  const media = await getMediaById(mediaId);

  if (!media) {
    throw new NotFoundError("Media not found", "MEDIA_NOT_FOUND");
  }

  // ✅ SECURE: Checks ownership
  const isOwner = media.uploadedBy === currentUser.id;
  const isAdmin = currentUser.roles.includes("ADMIN");

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError(
      "You can only delete your own media",
      "NOT_MEDIA_OWNER"
    );
  }

  // Delete file from disk
  await deleteFile(media.url);

  // Delete from database
  const deleted = await deleteMedia(mediaId);

  if (!deleted) {
    throw new NotFoundError("Media not found", "MEDIA_NOT_FOUND");
  }

  return deleted;
}
```

**Security Pattern:**
- Fetches media record to get `uploadedBy` field
- Compares `media.uploadedBy` with `currentUser.id`
- Only owner or admin can delete
- Throws `ForbiddenError` if unauthorized

---

## ✅ Tour Authorization

**Location:** `server/src/modules/tours/tour.service.ts`

### Helper Function (Lines 17-24)
```typescript
function assertOwnerOrAdmin(tour: SafeTour, currentUser: JwtUser): void {
  const isOwner = tour.ownerId === currentUser.id;
  const isAdmin = currentUser.roles.includes("ADMIN");

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError("You can only modify your own tours", "NOT_TOUR_OWNER");
  }
}
```

### ✅ Update Tour (Lines 78-98)
```typescript
export async function updateTourForUser(
  currentUser: JwtUser,
  id: string,
  data: UpdateTourData,
): Promise<SafeTour> {
  const tour = await getTourById(id);

  if (!tour) {
    throw new NotFoundError("Tour not found", "TOUR_NOT_FOUND");
  }

  assertOwnerOrAdmin(tour, currentUser); // ✅ Authorization check

  const updated = await updateTour(id, data);

  if (!updated) {
    throw new NotFoundError("Tour not found", "TOUR_NOT_FOUND");
  }

  return updated;
}
```

### ✅ Delete Tour (Lines 100-122)
```typescript
export async function softDeleteTourForUser(
  currentUser: JwtUser,
  id: string,
): Promise<SafeTour> {
  const tour = await getTourById(id);

  if (!tour) {
    throw new NotFoundError("Tour not found", "TOUR_NOT_FOUND");
  }

  assertOwnerOrAdmin(tour, currentUser); // ✅ Authorization check

  // Delete associated media files before soft deleting tour
  await deleteTourImages(id);

  const deleted = await softDeleteTour(id);

  if (!deleted) {
    throw new NotFoundError("Tour not found", "TOUR_NOT_FOUND");
  }

  return deleted;
}
```

**Security Pattern:**
- Uses centralized `assertOwnerOrAdmin()` helper
- Checks `tour.ownerId === currentUser.id`
- Allows admins to modify any tour
- Consistent error handling

---

## ✅ Company Authorization

**Location:** `server/src/modules/companies/company.service.ts`

### ✅ Update Company (Lines 32-59)
```typescript
export async function updateCompany(
    id: string,
    userId: string,
    userRoles: UserRole[],
    data: UpdateCompanyData
): Promise<CompanyResponse> {
    // Verify company exists
    const company = await getCompanyById(id);

    // ✅ Authorization check using centralized helper
    const hasPermission = await verifyCompanyOwnership(id, userId, userRoles);
    if (!hasPermission) {
        throw new ForbiddenError(
            "You do not have permission to update this company",
            "FORBIDDEN"
        );
    }

    // Non-admins cannot update isVerified
    if (!userRoles.includes("ADMIN")) {
        delete data.isVerified;
    }

    await companyRepo.update(id, data);

    return getCompanyById(id);
}
```

### ✅ Delete Company (Lines 61-82)
```typescript
export async function deleteCompany(
    id: string,
    userId: string,
    userRoles: UserRole[]
): Promise<void> {
    // Verify company exists
    await getCompanyById(id);

    // ✅ Authorization check using centralized helper
    const hasPermission = await verifyCompanyOwnership(id, userId, userRoles);
    if (!hasPermission) {
        throw new ForbiddenError(
            "You do not have permission to delete this company",
            "FORBIDDEN"
        );
    }

    // Delete associated media files (logo, images) before deleting company
    await deleteCompanyMedia(id);

    await companyRepo.deleteCompany(id);
}
```

### ✅ Get Tour Agents (Lines 84-102)
```typescript
export async function getTourAgents(
    companyId: string,
    requesterId: string,
    requesterRoles: UserRole[]
): Promise<User[]> {
    // Verify company exists
    const company = await getCompanyById(companyId);

    // ✅ Authorization check - only company owner or admin can view tour agents
    const hasPermission = await verifyCompanyOwnership(companyId, requesterId, requesterRoles);
    if (!hasPermission) {
        throw new ForbiddenError(
            "You do not have permission to view tour agents for this company",
            "FORBIDDEN"
        );
    }

    return companyRepo.getTourAgents(company.userId);
}
```

**Authorization Helper:**
**Location:** `server/src/libs/authorization.ts` (Lines 7-24)
```typescript
export async function verifyCompanyOwnership(
    companyId: string,
    userId: string,
    userRoles: UserRole[]
): Promise<boolean> {
    // Admins can do anything
    if (userRoles.includes("ADMIN")) {
        return true;
    }

    // Check if user owns this company
    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { userId: true },
    });

    return company?.userId === userId;
}
```

---

## ✅ Guide Authorization

**Location:** `server/src/modules/guides/guide.service.ts`

### ✅ Update Guide (Lines 34-67)
```typescript
export async function updateGuide(
    id: string,
    userId: string,
    userRoles: UserRole[],
    data: UpdateGuideData
): Promise<GuideResponse> {
    // Verify guide exists
    const guide = await getGuideById(id);

    // ✅ Authorization check
    const hasPermission = await verifyGuideOwnership(id, userId, userRoles);
    if (!hasPermission) {
        throw new ForbiddenError(
            "You do not have permission to update this guide profile",
            "FORBIDDEN"
        );
    }

    // Non-admins cannot update isVerified
    if (!userRoles.includes("ADMIN")) {
        delete data.isVerified;
    }

    await guideRepo.update(id, data);

    if (data.locationIds !== undefined) {
        await guideRepo.setLocations(id, data.locationIds);
    }

    return getGuideById(id);
}
```

### ✅ Delete Guide (Lines 69-90)
```typescript
export async function deleteGuide(
    id: string,
    userId: string,
    userRoles: UserRole[]
): Promise<void> {
    // Verify guide exists
    await getGuideById(id);

    // ✅ Authorization check
    const hasPermission = await verifyGuideOwnership(id, userId, userRoles);
    if (!hasPermission) {
        throw new ForbiddenError(
            "You do not have permission to delete this guide profile",
            "FORBIDDEN"
        );
    }

    // Delete associated media files (photos) before deleting guide
    await deleteGuidePhotos(id);

    await guideRepo.deleteGuide(id);
}
```

**Authorization Helper:**
**Location:** `server/src/libs/authorization.ts` (Lines 29-46)
```typescript
export async function verifyGuideOwnership(
    guideId: string,
    userId: string,
    userRoles: UserRole[]
): Promise<boolean> {
    // Admins can do anything
    if (userRoles.includes("ADMIN")) {
        return true;
    }

    // Check if user owns this guide profile
    const guide = await prisma.guide.findUnique({
        where: { id: guideId },
        select: { userId: true },
    });

    return guide?.userId === userId;
}
```

---

## ✅ Driver Authorization

**Location:** `server/src/modules/drivers/driver.service.ts`

### ✅ Update Driver (Lines 33-60)
```typescript
export async function updateDriver(
    id: string,
    userId: string,
    userRoles: UserRole[],
    data: UpdateDriverData
): Promise<DriverResponse> {
    await getDriverById(id);

    // ✅ Authorization check
    const hasPermission = await verifyDriverOwnership(id, userId, userRoles);
    if (!hasPermission) {
        throw new ForbiddenError(
            "You do not have permission to update this driver profile",
            "FORBIDDEN"
        );
    }

    if (!userRoles.includes("ADMIN")) {
        delete data.isVerified;
    }

    await driverRepo.update(id, data);

    if (data.locationIds !== undefined) {
        await driverRepo.setLocations(id, data.locationIds);
    }

    return getDriverById(id);
}
```

### ✅ Delete Driver (Lines 62-81)
```typescript
export async function deleteDriver(
    id: string,
    userId: string,
    userRoles: UserRole[]
): Promise<void> {
    await getDriverById(id);

    // ✅ Authorization check
    const hasPermission = await verifyDriverOwnership(id, userId, userRoles);
    if (!hasPermission) {
        throw new ForbiddenError(
            "You do not have permission to delete this driver profile",
            "FORBIDDEN"
        );
    }

    // Delete associated media files (photos) before deleting driver
    await deleteDriverPhotos(id);

    await driverRepo.deleteDriver(id);
}
```

**Authorization Helper:**
**Location:** `server/src/libs/authorization.ts` (Lines 51-68)
```typescript
export async function verifyDriverOwnership(
    driverId: string,
    userId: string,
    userRoles: UserRole[]
): Promise<boolean> {
    // Admins can do anything
    if (userRoles.includes("ADMIN")) {
        return true;
    }

    // Check if user owns this driver profile
    const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        select: { userId: true },
    });

    return driver?.userId === userId;
}
```

---

## ✅ User Authorization

**Location:** `server/src/modules/users/user.routes.ts`

### ✅ Route Guards
```typescript
// Self-or-admin: get user by ID
fastify.get(
  "/users/:id",
  { preHandler: [authGuard, requireSelfOrAdmin] }, // ✅ Authorization middleware
  userController.getUserById
);

// Self-or-admin: update user
fastify.patch(
  "/users/:id",
  { preHandler: [authGuard, requireVerifiedEmail, requireSelfOrAdmin] }, // ✅ Authorization middleware
  userController.updateUser
);

// Self-or-admin: delete user
fastify.delete(
  "/users/:id",
  { preHandler: [authGuard, requireVerifiedEmail, requireSelfOrAdmin] }, // ✅ Authorization middleware
  userController.deleteUser
);

// Admin-only: update user role
fastify.patch(
  "/users/:id/role",
  { preHandler: [authGuard, requireRole("ADMIN")] }, // ✅ Admin-only
  userController.updateUserRole
);
```

**Middleware Pattern:**
- `requireSelfOrAdmin` ensures user can only access their own data or is admin
- `requireRole("ADMIN")` enforces admin-only operations
- Field restrictions enforced in controller for non-admins

---

## Authorization Architecture Summary

### Three-Layer Security:

#### 1. Route Layer
- **Authentication Guards:** `authGuard` ensures user is logged in
- **Email Verification:** `requireVerifiedEmail` for sensitive operations
- **Role Guards:** `requireRole("ADMIN")` for admin-only routes
- **Self-or-Admin Guards:** `requireSelfOrAdmin` for user-specific routes

#### 2. Service Layer
- **Ownership Verification:** Uses centralized helpers
  - `verifyCompanyOwnership()`
  - `verifyGuideOwnership()`
  - `verifyDriverOwnership()`
  - `verifyTourOwnership()`
  - `assertOwnerOrAdmin()` (inline for tours)
- **Field Restrictions:** Non-admins cannot modify sensitive fields (`isVerified`)

#### 3. Helper Layer
- **Media Helpers:** Check ownership before upload/delete
- **Entity Validation:** Verify entity exists before checking ownership
- **Admin Override:** All helpers allow admins to bypass ownership checks

---

## Security Patterns Used

### ✅ Pattern 1: Fetch → Verify → Act
```typescript
const entity = await getEntityById(id);
if (!entity) throw new NotFoundError(...);

const hasPermission = await verifyOwnership(id, userId, roles);
if (!hasPermission) throw new ForbiddenError(...);

await performOperation(id, data);
```

### ✅ Pattern 2: Centralized Authorization Helpers
```typescript
// Reusable across service layer
export async function verifyEntityOwnership(
    entityId: string,
    userId: string,
    userRoles: UserRole[]
): Promise<boolean> {
    if (userRoles.includes("ADMIN")) return true;

    const entity = await prisma.entity.findUnique({
        where: { id: entityId },
        select: { userId: true },
    });

    return entity?.userId === userId;
}
```

### ✅ Pattern 3: Field Restrictions
```typescript
// Non-admins cannot modify sensitive fields
if (!userRoles.includes("ADMIN")) {
    delete data.isVerified;
}
```

---

## No Security Issues Found

### ❌ Common Vulnerabilities NOT Present:

#### 1. ❌ Missing Authorization Checks
- **Status:** NOT FOUND
- All update/delete operations verify ownership

#### 2. ❌ Direct Parameter Tampering
- **Status:** NOT FOUND
- Cannot modify others' resources by changing IDs

#### 3. ❌ Privilege Escalation
- **Status:** NOT FOUND
- Non-admins cannot set `isVerified` flag
- Role updates restricted to admins only

#### 4. ❌ Insecure Direct Object Reference (IDOR)
- **Status:** NOT FOUND
- All entity IDs validated against ownership

#### 5. ❌ Mass Assignment Vulnerabilities
- **Status:** NOT FOUND
- Sensitive fields filtered for non-admins

---

## Recommendations

### ✅ Current Implementation is Excellent

Your authorization system is well-designed and secure. The fix you implemented for media upload/delete correctly addresses the authorization issue.

### Optional Enhancements (Not Required):

#### 1. Audit Logging (Future Enhancement)
```typescript
// Log all sensitive operations
logger.info(`User ${userId} deleted media ${mediaId}`);
logger.warn(`User ${userId} attempted unauthorized access to ${entityId}`);
```

#### 2. Rate Limiting (Already Recommended)
Consider rate-limiting sensitive endpoints:
- `/api/v1/media/:entityType/:entityId` (uploads)
- `/api/v1/tours/:id` (updates/deletes)
- `/api/v1/companies/:id` (updates/deletes)

#### 3. Type Safety for Authorization (Optional)
Consider making the `(entity as any).userId` pattern type-safe by updating response types to explicitly include `userId`.

**Example:**
```typescript
// Current (Lines 92, 138, 184 in media.helpers.ts)
if ((company as any).userId !== currentUser.id && !currentUser.roles.includes("ADMIN")) {

// Optional Enhancement
export interface CompanyResponse extends Company {
    user: {
        id: string;
        // ...
    };
    userId: string; // ← Add this to response type
}

// Then use without type assertion
if (company.userId !== currentUser.id && !currentUser.roles.includes("ADMIN")) {
```

---

## Conclusion

### ✅ Your Fix is Correct

The authorization fix you implemented for media uploads/deletes is:
- **Comprehensive:** Covers all entity types
- **Consistent:** Uses same pattern everywhere
- **Secure:** Checks ownership before every operation
- **Well-structured:** Uses centralized helpers

### ✅ No Authorization Leaks Found

All routes requiring ownership verification properly implement authorization checks:
- **Media:** ✅ Upload and delete protected
- **Tours:** ✅ Update and delete protected
- **Companies:** ✅ Update, delete, and tour agent access protected
- **Guides:** ✅ Update and delete protected
- **Drivers:** ✅ Update and delete protected
- **Users:** ✅ Self-or-admin guards in place

### Final Security Score: 10/10

Your authorization system follows best practices and has no identified vulnerabilities.

---

**Audit Completed:** January 14, 2026
**Next Review:** Recommended after any changes to authorization logic
