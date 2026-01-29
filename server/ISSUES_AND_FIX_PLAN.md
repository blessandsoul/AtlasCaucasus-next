# Server Issues and Fix Plan

## Summary

After a thorough review of the server codebase, I found **23 issues** across 4 categories:
- **Critical Bugs (6)** - Will cause runtime errors or incorrect behavior
- **Security Issues (4)** - Potential vulnerabilities
- **Logic Errors (5)** - Incorrect business logic
- **Code Quality Issues (8)** - Maintainability and consistency problems

---

## CRITICAL BUGS

### 1. `updateUserRole` function does nothing
**File:** `src/modules/users/user.service.ts:130-142`
**Problem:** The function ignores the `input` parameter and updates nothing.
```typescript
export async function updateUserRole(
  id: string,
  input: UpdateUserRoleInput  // <-- This is never used!
): Promise<SafeUser> {
  const existingUser = await userRepo.findUserById(id);
  if (!existingUser) {
    throw new NotFoundError("User not found", "USER_NOT_FOUND");
  }

  const user = await userRepo.updateUser(id, {}); // <-- Empty update!

  return await toSafeUser(user);
}
```
**Fix:** Actually use the input to update roles using `userRepo.addUserRole()` or `userRepo.removeUserRole()`.

---

### 2. Wrong property access: `request.user.role` instead of `request.user.roles`
**File:** `src/modules/users/user.controller.ts:77`
**Problem:** The code references `request.user.role` but the type is `request.user.roles` (array).
```typescript
const currentUserRole = request.user.role as UserRole;  // <-- WRONG
const isAdmin = currentUserRole === "ADMIN";
```
**Fix:** Change to:
```typescript
const isAdmin = request.user.roles.includes("ADMIN");
```

---

### 3. Console.log statements in production code
**Files:**
- `src/modules/tours/tour.repo.ts:54-55`
- `src/modules/media/media.controller.ts:186-218`
- `src/libs/file-upload.ts:249`

**Problem:** Debug `console.log` and `console.warn` statements that should use the logger.
```typescript
// tour.repo.ts
console.log('Creating tour with price:', priceValue, 'type:', typeof priceValue);
console.log('Original price:', originalPriceValue, 'type:', typeof originalPriceValue);

// media.controller.ts
console.log(`📸 Starting upload for tour: ${tourId}`);
console.log(`📎 Received file: ${part.filename}, type: ${part.mimetype}`);
// ...more console.logs

// file-upload.ts
console.warn(`Failed to delete file: ${urlPath}`, err);
```
**Fix:** Replace all with `logger.debug()` or `logger.warn()`.

---

### 4. N+1 Query problem in tour listing
**File:** `src/modules/tours/tour.repo.ts:114, 295, 369`
**Problem:** `toSafeTourWithMedia()` calls `getMediaByEntity()` for each tour individually.
```typescript
return Promise.all(tours.map(toSafeTourWithMedia));
// Each tour makes a separate DB query for media!
```
**Fix:** Batch fetch media for all tours at once:
```typescript
const tourIds = tours.map(t => t.id);
const allMedia = await getMediaByEntityIds("tour", tourIds);
// Then distribute to each tour
```

---

### 5. Generic media upload lacks authorization
**File:** `src/modules/media/media.controller.ts:40-82`
**Problem:** The generic `uploadMediaHandler` doesn't verify the user owns the entity.
```typescript
export async function uploadMediaHandler(...) {
  // No ownership check! Anyone can upload to any entity
  const media = await uploadMediaForEntity(
    request.user,
    entityType,
    entityId,
    uploadedFile
  );
}
```
**Fix:** Add ownership verification like in `uploadMultipleFiles` helper.

---

### 6. `claimRole` returns stale user data
**File:** `src/modules/auth/auth.service.ts:263`
**Problem:** Returns user fetched before role was added.
```typescript
export async function claimRole(userId: string, input: ClaimRoleInput): Promise<SafeUser> {
  const user = await userRepo.findUserById(userId);
  // ... role is added here ...
  await userRepo.addUserRole(userId, input.role);
  // ... profile is created here ...
  return toSafeUser(user);  // <-- Returns OLD user without new role!
}
```
**Fix:** Fetch user again after adding role:
```typescript
const updatedUser = await userRepo.findUserById(userId);
return toSafeUser(updatedUser!);
```

---

## SECURITY ISSUES

### 1. CORS allows all origins in production
**File:** `src/app.ts:43`
**Problem:** CORS is set to allow all origins.
```typescript
app.register(fastifyCors, {
  origin: true, // Allow all origins in development
```
**Fix:** Use environment-based configuration:
```typescript
origin: env.NODE_ENV === 'production' ? env.ALLOWED_ORIGINS.split(',') : true,
```

---

### 2. User avatar upload uses non-existent property
**File:** `src/modules/media/media.helpers.ts:256`
**Problem:** `currentUser.firstName` doesn't exist on `JwtUser` type.
```typescript
const userName = `user-${currentUser.firstName || ""}-${currentUser.lastName || ""}`;
// JwtUser only has: id, roles, emailVerified
```
**Fix:** Fetch user name from database or remove personalized slug for user avatars.

---

### 3. JSON parsing without validation
**File:** `src/modules/inquiries/inquiry.service.ts:299`
**Problem:** Parsing JSON without try-catch could throw.
```typescript
targetIds: JSON.parse(inquiry.targetIds) as string[],
// If targetIds is malformed, this throws
```
**Fix:** Wrap in try-catch or use Zod for parsing.

---

### 4. Tour creation doesn't validate companyId ownership
**File:** `src/modules/tours/tour.repo.ts:62-85`
**Problem:** When creating a tour with companyId, it doesn't verify the user owns that company.
```typescript
const tour = await prisma.tour.create({
  data: {
    companyId: data.companyId ?? null,  // <-- Not validated!
    // ...
  },
});
```
**Fix:** Add ownership check in service layer before creating tour.

---

## LOGIC ERRORS

### 1. Mutating input data
**Files:**
- `src/modules/companies/company.service.ts:64`
- `src/modules/guides/guide.service.ts:54`
- `src/modules/drivers/driver.service.ts:51`

**Problem:** `delete data.isVerified` mutates the input object.
```typescript
if (!userRoles.includes("ADMIN")) {
  delete data.isVerified;  // <-- Mutates input!
}
```
**Fix:** Create a new object without the property:
```typescript
const { isVerified, ...safeData } = data;
const updateData = userRoles.includes("ADMIN") ? data : safeData;
```

---

### 2. Unused company variable
**File:** `src/modules/companies/company.service.ts:101`
**Problem:** `company` is fetched but only `company.userId` is used for a different query.
```typescript
const company = await getCompanyById(companyId);
// ...
return companyRepo.getTourAgents(company.userId);
// company.userId should be available without the full fetch
```
**Fix:** Use a more targeted query or ensure it's intentional.

---

### 3. Inconsistent filter defaults
**File:** `src/modules/drivers/driver.service.ts:13-18`
**Problem:** Driver service defaults both `isVerified` AND `isAvailable` to true, but company service only defaults `isVerified`.
```typescript
// drivers - has both
if (filters.isVerified === undefined) filters.isVerified = true;
if (filters.isAvailable === undefined) filters.isAvailable = true;

// companies - only has one
if (filters.isVerified === undefined) filters.isVerified = true;
```
**Fix:** Ensure consistent behavior across all entity types.

---

### 4. Missing non-null assertion issue
**File:** `src/modules/inquiries/inquiry.service.ts:55`
**Problem:** Using `!` assertion without guarantee.
```typescript
const completeInquiry = await inquiryRepo.findById(inquiry.id);
return this.formatInquiry(completeInquiry!);  // <-- Could be null
```
**Fix:** Add null check:
```typescript
if (!completeInquiry) throw new InternalError("Failed to load inquiry");
```

---

### 5. Avatar upload doesn't delete old avatar
**File:** `src/modules/media/media.helpers.ts:245-259`
**Problem:** Uploading new avatar doesn't remove the old one.
```typescript
export async function uploadUserAvatar(...): Promise<SafeMedia> {
  // Doesn't check for or delete existing avatar!
  return uploadMediaForEntity(currentUser, "user", userId, file, entitySlug);
}
```
**Fix:** Delete existing avatar before uploading new one:
```typescript
await deleteAllMediaForEntity("user", userId);
return uploadMediaForEntity(...);
```

---

## CODE QUALITY ISSUES

### 1. Type casting to `any`
**File:** `src/modules/media/media.helpers.ts`
**Problem:** Multiple places use `(entity as any).userId` instead of proper typing.
```typescript
if ((company as any).userId !== currentUser.id && !isAdmin) {
```
**Fix:** Update return types to include `userId` or create proper interfaces.

---

### 2. Duplicate filter logic
**File:** `src/modules/tours/tour.repo.ts:259-330`
**Problem:** Same filter building logic duplicated in `listAllActiveTours` and `countAllActiveTours`.
**Fix:** Extract to a shared `buildTourFilters()` function.

---

### 3. Missing media count limits
**Problem:** No limit on how many images can be uploaded per entity.
**Fix:** Add configuration for max media per entity type.

---

### 4. Inconsistent error message patterns
**Problem:** Some errors use `throw new NotFoundError("Tour not found")` while others use `throw new NotFoundError("Tour not found", "TOUR_NOT_FOUND")`.
**Fix:** Standardize to always include error codes.

---

### 5. No soft delete recovery
**Problem:** Tours are soft-deleted but there's no way to restore them.
**Fix:** Add `restoreTour()` function in service.

---

### 6. Missing rate limiting on auth endpoints
**File:** `src/modules/auth/auth.routes.ts`
**Problem:** Auth endpoints don't have rate limiting (login, register, password reset).
**Fix:** Add rate limiting per route.

---

### 7. Price validation duplicated
**File:** `src/modules/tours/tour.repo.ts:50-60`
**Problem:** Price validation done in repo layer should be in service/schema layer.
**Fix:** Move to Zod schema validation.

---

### 8. Missing TypeScript strict null checks on query params
**File:** `src/modules/tours/tour.controller.ts:66-70`
**Problem:** Manual type checking for query params instead of schema validation.
```typescript
const includeInactive = request.query &&
  typeof request.query === 'object' &&
  'includeInactive' in request.query
  ? String(request.query.includeInactive) === 'true'
  : false;
```
**Fix:** Add to Zod schema and validate with schema.

---

## PRIORITY FIX ORDER

### Phase 1 - Critical (Must fix immediately)
1. Fix `updateUserRole` function (does nothing)
2. Fix `request.user.role` -> `request.user.roles`
3. Add authorization to generic media upload
4. Fix `claimRole` returning stale data

### Phase 2 - Security (Fix before production)
5. Configure CORS for production
6. Validate companyId ownership in tour creation
7. Add try-catch for JSON parsing in inquiry service
8. Fix user avatar property access

### Phase 3 - Performance
9. Fix N+1 query in tour listing
10. Extract duplicate filter logic

### Phase 4 - Code Quality
11. Replace console.log with logger
12. Fix input mutation with spread operator
13. Add error codes consistently
14. Fix type casting with proper interfaces
15. Add media count limits
16. Add rate limiting to auth routes

---

## Implementation Notes

- All fixes should include unit tests
- Run `npm run typecheck` after changes
- Test in development before production
- Consider database migration if schema changes needed
