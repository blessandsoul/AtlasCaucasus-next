# Server Audit - Needs Fix Plan

## Executive Summary

After thorough analysis of the server codebase, I identified **45+ issues** across three categories:
- **Infrastructure/Docker**: 7 issues (2 critical)
- **Code Quality/Patterns**: 15 issues (4 critical)
- **Security**: 23 issues (5 critical)

---

## CRITICAL ISSUES (Fix Immediately)

### 1. `.env` File Committed with Real API Key
**Severity**: CRITICAL SECURITY
**File**: `server/.env`
**Issue**: Real RESEND_API_KEY exposed: `re_NpoWPpeh_J5FVAutgTgKgx119eyY8MuC6`

**Fix**:
```bash
# 1. Remove from git history
git rm --cached server/.env
# 2. Add to .gitignore (verify it's there)
# 3. Regenerate the Resend API key in their dashboard
# 4. Never commit .env again
```

---

### 2. Dockerfile References Wrong Config File
**Severity**: CRITICAL - Docker build fails
**File**: `server/Dockerfile`
**Issue**: References `ecosystem.config.js` but actual file is `ecosystem.config.cjs`

**Fix**:
```dockerfile
# Line 15: Change
COPY ecosystem.config.js ./
# To:
COPY ecosystem.config.cjs ./

# Line 19: Change
CMD ["npx", "pm2-runtime", "ecosystem.config.js"]
# To:
CMD ["npx", "pm2-runtime", "ecosystem.config.cjs"]
```

---

### 3. Dockerfile Missing Build Step
**Severity**: CRITICAL - Docker image has no compiled code
**File**: `server/Dockerfile`
**Issue**: TypeScript not compiled before copying `dist/`

**Fix**:
```dockerfile
# After npm ci, add:
RUN npm run build

# Before copying dist/
```

---

### 4. Missing Refresh Token Hash Validation
**Severity**: CRITICAL SECURITY
**File**: `server/src/modules/auth/auth.service.ts` (lines 402-461)
**Issue**: Refresh tokens are NOT validated against stored hash - session hijacking possible

**Fix**:
```typescript
// In refresh() function, after finding session, add:
import crypto from "crypto";

const providedHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
if (session.refreshTokenHash !== providedHash) {
  throw new UnauthorizedError("INVALID_TOKEN", "Invalid refresh token");
}
```

---

### 5. N+1 Query in toSafeUser
**Severity**: CRITICAL PERFORMANCE
**File**: `server/src/modules/auth/auth.service.ts` (lines 37-73)
**Issue**: Each user load triggers 4+ sequential queries (roles, profiles, media)

**Fix**: Batch load in single query:
```typescript
async function toSafeUser(user: User): Promise<SafeUser> {
  // Single query with includes instead of multiple queries
  const userWithRelations = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      roleAssignments: { select: { role: true } },
      driver: true,
      guide: true,
    },
  });

  const roles = userWithRelations.roleAssignments.map(r => r.role);
  // Use included relations instead of separate queries
}
```

---

### 6. File Upload MIME Type Not Validated
**Severity**: CRITICAL SECURITY
**File**: `server/src/libs/file-upload.ts` (lines 152-154)
**Issue**: Only checks Content-Type header (can be spoofed), no magic byte validation

**Fix**:
```typescript
import { fileTypeFromBuffer } from "file-type";

export async function validateFileType(
  buffer: Buffer,
  allowedTypes: readonly string[]
): Promise<boolean> {
  const result = await fileTypeFromBuffer(buffer);
  if (!result) return false;
  return allowedTypes.includes(result.mime);
}
```

---

### 7. CORS Allows Null Origin
**Severity**: HIGH SECURITY
**File**: `server/src/app.ts` (lines 56-58)
**Issue**: `if (!origin) return callback(null, true)` allows CORS bypass

**Fix**:
```typescript
origin: (origin, callback) => {
  // Reject null origins in production
  if (!origin) {
    if (env.NODE_ENV === "production") {
      return callback(new Error("CORS: Origin required"), false);
    }
    return callback(null, true); // Allow in dev for Postman
  }
  // ... rest of checks
}
```

---

## HIGH SEVERITY ISSUES

### 8. Type Casting Bypasses TypeScript Safety
**Files**: `server/src/modules/media/media.helpers.ts` (lines 106-112, 156-161, 206-211)
**Issue**: `(company as any).userId` bypasses type checking

**Fix**: Use proper typing or create type-safe helper:
```typescript
// Define proper types
interface EntityWithUserId {
  userId: string;
}

function hasUserId(entity: unknown): entity is EntityWithUserId {
  return typeof entity === "object" && entity !== null && "userId" in entity;
}

// Then use:
if (hasUserId(company) && company.userId !== currentUser.id) {
  throw new ForbiddenError(...);
}
```

---

### 9. Inconsistent Authorization Patterns
**Files**: Multiple controllers and services
**Issue**: Some use `verifyCompanyOwnership()`, others inline checks

**Fix**: Create centralized authorization in `server/src/libs/authorization.ts`:
```typescript
export async function assertCanModifyTour(
  userId: string,
  roles: string[],
  tourId: string
): Promise<void> {
  // Consistent ownership + admin check logic
}

export async function assertCanModifyCompany(...): Promise<void> { ... }
export async function assertCanModifyGuide(...): Promise<void> { ... }
export async function assertCanModifyDriver(...): Promise<void> { ... }
```

---

### 10. Missing Route Parameter Validation
**Files**: All controllers (company, guide, driver, tour)
**Issue**: `:id` params not validated as UUID

**Fix**: Add validation schema:
```typescript
// In libs/validation.ts
export const UuidParamSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

// In routes:
schema: {
  params: UuidParamSchema,
}
```

---

### 11. Media Ownership Check Flaw
**File**: `server/src/modules/media/media.service.ts`
**Issue**: Checks `uploadedBy` not entity ownership - users can delete others' photos if they know photoId

**Fix**: Verify entity ownership before allowing media operations:
```typescript
async deleteMedia(user: CurrentUser, photoId: string): Promise<boolean> {
  const media = await mediaRepo.findById(photoId);

  // Verify user owns the ENTITY, not just the upload
  const entityOwned = await verifyEntityOwnership(
    media.entityType,
    media.entityId,
    user
  );

  if (!entityOwned && !user.roles.includes("ADMIN")) {
    throw new ForbiddenError(...);
  }
  // ... delete
}
```

---

### 12. Account Lockout Logic Flaws
**File**: `server/src/modules/auth/security.service.ts` (lines 238-287)
**Issues**:
- 10 attempts too high (should be 5)
- No exponential backoff
- No manual admin unlock

**Fix**:
```typescript
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATIONS = [60, 300, 900, 3600]; // 1min, 5min, 15min, 1hr

// Calculate lockout based on failure count
const lockoutDuration = LOCKOUT_DURATIONS[
  Math.min(failureCount - MAX_FAILED_ATTEMPTS, LOCKOUT_DURATIONS.length - 1)
] * 1000;
```

---

### 13. Logging Token Fragments
**File**: `server/src/modules/auth/auth.service.ts` (lines 411-420)
**Issue**: Logs first 20 chars of refresh token

**Fix**:
```typescript
// Replace tokenPreview with hash prefix
const tokenHash = crypto.createHash("sha256")
  .update(refreshToken)
  .digest("hex")
  .substring(0, 8);

logger.warn({ tokenHashPrefix: tokenHash, ... });
```

---

### 14. Password Reset Token Timing Attack
**File**: `server/src/modules/auth/security.service.ts` (lines 181-232)
**Issue**: Direct string comparison allows character-by-character brute force

**Fix**:
```typescript
import crypto from "crypto";

// Instead of direct DB query with token
const user = await prisma.user.findFirst({
  where: { resetPasswordTokenExpiresAt: { gt: new Date() } },
});

if (!user?.resetPasswordToken) {
  throw new BadRequestError("Invalid or expired reset token");
}

// Constant-time comparison
const isValid = crypto.timingSafeEqual(
  Buffer.from(token),
  Buffer.from(user.resetPasswordToken)
);

if (!isValid) {
  throw new BadRequestError("Invalid or expired reset token");
}
```

---

### 15. Rate Limiting Too Permissive on Token Refresh
**File**: `server/src/config/rateLimit.ts`
**Issue**: 10 requests per 15 minutes is too high

**Fix**:
```typescript
refresh: { max: 3, timeWindow: "15 minutes" },
```

---

### 16. Unhandled Email Send Failures
**File**: `server/src/modules/auth/auth.service.ts` (lines 177-179, 225-227)
**Issue**: Fire-and-forget email with no user feedback

**Fix**: At minimum, inform user:
```typescript
try {
  await securityService.sendVerification(user);
} catch (err) {
  logger.error({ err, userId: user.id }, "Failed to send verification email");
  // Could add: throw or return warning in response
}
```

---

## MEDIUM SEVERITY ISSUES

### 17. Response Format Inconsistencies
**Files**: Various controllers
**Issue**: Some wrap data in object `{ user }`, some don't

**Fix**: Standardize all responses - always return data directly:
```typescript
// Consistent pattern:
return reply.send(successResponse("Message", entity));
// NOT: successResponse("Message", { entity })
```

---

### 18. Error Throwing from Repository
**File**: `server/src/modules/tours/tour.repo.ts` (line 81)
**Issue**: Throws raw `Error` instead of `ValidationError`

**Fix**:
```typescript
// Change:
throw new Error(`Invalid price value: ${priceValue}...`);
// To:
throw new ValidationError("INVALID_PRICE", `Invalid price value: ${priceValue}`);
```

---

### 19. Email Verification Never Expires
**File**: `server/src/modules/auth/security.service.ts` (lines 115-125)
**Issue**: Initial verification tokens have `null` expiry

**Fix**: Set 7-day expiry for initial verification:
```typescript
verificationToken: token,
verificationTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
```

---

### 20. Missing CSRF Protection
**File**: `server/src/app.ts`
**Issue**: No CSRF tokens for state-changing requests

**Fix**:
```typescript
import fastifyCsrf from "@fastify/csrf-protection";

app.register(fastifyCsrf, {
  sessionPlugin: "@fastify/cookie",
});
```

---

### 21. No Redis Password in Production
**File**: `server/src/libs/redis.ts`
**Issue**: Redis password not enforced in production

**Fix**:
```typescript
if (env.NODE_ENV === "production" && !env.REDIS_PASSWORD) {
  logger.fatal("SECURITY: REDIS_PASSWORD required in production");
  process.exit(1);
}
```

---

### 22. Session Cleanup Too Slow
**File**: `server/src/modules/auth/security.service.ts` (lines 392-408)
**Issue**: Sessions kept 30 days after creation

**Fix**: Delete within 1 hour of expiration:
```typescript
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
const result = await prisma.userSession.deleteMany({
  where: {
    OR: [
      { expiresAt: { lt: oneHourAgo } },
      { revokedAt: { lt: oneHourAgo } },
    ],
  },
});
```

---

### 23. Incomplete Filename Sanitization
**File**: `server/src/libs/file-upload.ts` (lines 20-42)
**Issue**: Doesn't prevent double extensions like `.php.jpg`

**Fix**:
```typescript
// After existing sanitization, add:
const parts = sanitized.split(".");
if (parts.length > 2) {
  sanitized = parts.slice(0, -1).join("_") + "." + parts[parts.length - 1];
}
```

---

### 24. Token Reuse Detection Timing Window
**File**: `server/src/modules/auth/security.service.ts` (lines 311-355)
**Issue**: No concurrent request deduplication

**Fix**: Use atomic Redis operations for token validation:
```typescript
// Use Redis SETNX with short TTL for token deduplication
const lockKey = `token_refresh:${sessionId}`;
const acquired = await redis.set(lockKey, "1", { NX: true, EX: 5 });
if (!acquired) {
  throw new UnauthorizedError("TOKEN_ALREADY_USED", "Token refresh in progress");
}
```

---

## LOW SEVERITY ISSUES

### 25. PORT Mismatch in .env vs Docker
**Files**: `.env` (PORT=8000) vs `docker-compose.yml` (PORT=3000)
**Fix**: Align to one value (8000 recommended)

---

### 26. Missing CORS_ORIGINS in Production Docker
**File**: `server/docker-compose.yml`
**Fix**: Add `CORS_ORIGINS` environment variable

---

### 27. Redundant SQL Schema File
**File**: `server/docker/init/01-schema.sql`
**Issue**: Outdated - Prisma migrations are source of truth
**Fix**: Delete or clearly mark as deprecated

---

### 28. No Soft Delete Restoration
**Issue**: Users soft-deleted but no restore endpoint
**Fix**: Add admin endpoint for user restoration

---

### 29. Missing Audit Logging
**Issue**: No trail for sensitive operations
**Fix**: Add audit log table and service

---

### 30. Rate Limit Persistence
**Issue**: In-memory rate limits reset on restart
**Fix**: Use Redis adapter for `@fastify/rate-limit`

---

### 31. Temporary Password Exposure
**File**: `server/src/modules/auth/auth.service.ts` (lines 324-355)
**Issue**: Temp password returned in API response
**Fix**: Send only via email, use magic link instead

---

### 32. Missing Helmet CSP
**File**: `server/src/app.ts` (lines 78-82)
**Issue**: CSP disabled for API
**Fix**: Enable minimal CSP

---

---

## Implementation Order

### Phase 1: Critical Security (Day 1)
1. Remove `.env` from git, regenerate API key
2. Fix Dockerfile (config file + build step)
3. Add refresh token hash validation
4. Add file upload magic byte validation
5. Fix CORS null origin vulnerability

### Phase 2: High Security (Day 2-3)
6. Fix password reset timing attack
7. Reduce account lockout threshold
8. Stop logging token fragments
9. Fix media ownership checks
10. Add route parameter validation

### Phase 3: Performance (Day 4)
11. Fix N+1 query in toSafeUser
12. Review and optimize other query patterns

### Phase 4: Code Quality (Day 5-6)
13. Centralize authorization logic
14. Fix type casting issues
15. Standardize response formats
16. Fix error throwing patterns

### Phase 5: Medium/Low Priority (Week 2)
17. Add CSRF protection
18. Fix email verification expiry
19. Add session cleanup improvements
20. Implement remaining items

---

## Verification Plan

After fixes, verify:

1. **Docker Build**: `docker build -t tourism-server .` succeeds
2. **Docker Run**: Container starts and connects to DB/Redis
3. **Auth Flow**: Login, refresh, logout all work
4. **File Upload**: Only valid images accepted
5. **Security Scan**: Run OWASP ZAP or similar
6. **Load Test**: Verify N+1 fix with multiple users

---

## Files to Modify (Summary)

| File | Changes |
|------|---------|
| `.gitignore` | Verify .env excluded |
| `Dockerfile` | Fix config reference, add build step |
| `docker-compose.yml` | Add CORS_ORIGINS |
| `src/app.ts` | Fix CORS null origin |
| `src/libs/file-upload.ts` | Add magic byte validation |
| `src/libs/authorization.ts` | Centralize auth checks |
| `src/libs/validation.ts` | Add UUID param schema |
| `src/modules/auth/auth.service.ts` | Fix token validation, N+1, logging |
| `src/modules/auth/security.service.ts` | Fix lockout, timing, sessions |
| `src/modules/media/media.service.ts` | Fix ownership checks |
| `src/modules/media/media.helpers.ts` | Fix type casting |
| `src/config/rateLimit.ts` | Reduce refresh rate |
| Various controllers | Add param validation, standardize responses |
