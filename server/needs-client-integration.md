# Client Integration Plan - Post Server Security Fixes

## Executive Summary

After implementing the server fixes from `needs-fix.md`, the following client-side changes are required to maintain compatibility and utilize new security features.

**Total Changes**: 13 items across 3 priority levels
- **Critical**: 4 items (security breaking changes)
- **High**: 5 items (functionality improvements)
- **Medium/Low**: 4 items (nice-to-have)

---

## CRITICAL CHANGES (Breaking - Must Implement)

### 1. CSRF Token Handling
**Server Change**: Added `@fastify/csrf-protection` - all POST/PUT/PATCH/DELETE requests now require CSRF token.

**Client Files to Modify**:
- `client/src/lib/api/axios.config.ts`
- Create: `client/src/lib/api/csrf.ts`

**Implementation**:
```typescript
// csrf.ts
let csrfToken: string | null = null;

export async function fetchCsrfToken(): Promise<string> {
  const response = await fetch('/api/v1/auth/csrf-token', {
    credentials: 'include',
  });
  const data = await response.json();
  csrfToken = data.data.token;
  return csrfToken;
}

export function getCsrfToken(): string | null {
  return csrfToken;
}

// axios.config.ts - Add to request interceptor
apiClient.interceptors.request.use(async (config) => {
  // Existing auth token logic...

  // Add CSRF token for state-changing requests
  if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
    const csrf = getCsrfToken();
    if (csrf) {
      config.headers['X-CSRF-Token'] = csrf;
    }
  }
  return config;
});
```

**Error Handling**:
- On 403 with code `INVALID_CSRF_TOKEN`: Re-fetch token and retry once
- If retry fails: Redirect to login

---

### 2. Account Lockout UI
**Server Change**: Lockout threshold reduced from 10 to 5 attempts with exponential backoff.

**Client Files to Modify**:
- `client/src/features/auth/components/LoginForm.tsx`
- `client/src/features/auth/hooks/useLogin.ts`

**Implementation**:
```typescript
// In LoginForm.tsx error handling
const handleLoginError = (error: unknown) => {
  const code = getErrorCode(error);

  if (code === 'ACCOUNT_LOCKED') {
    // Server returns lockout duration in error.details.lockoutEndsAt
    const lockoutEndsAt = getErrorDetails(error)?.lockoutEndsAt;
    setLockoutUntil(new Date(lockoutEndsAt));
    setShowLockoutCountdown(true);
  } else if (code === 'INVALID_CREDENTIALS') {
    // Show remaining attempts if provided
    const remainingAttempts = getErrorDetails(error)?.remainingAttempts;
    if (remainingAttempts !== undefined) {
      toast.error(`Invalid password. ${remainingAttempts} attempts remaining.`);
    }
  }
};
```

**New Error Codes to Handle**:
| Code | Message |
|------|---------|
| `ACCOUNT_LOCKED` | "Account temporarily locked. Try again in X minutes." |
| `INVALID_CREDENTIALS` | With remaining attempts count |

---

### 3. Token Refresh Rate Limiting
**Server Change**: Refresh token limit reduced from 10 to 3 per 15 minutes.

**Client Files to Modify**:
- `client/src/lib/api/axios.config.ts` (lines 31-70)
- `client/src/lib/utils/token-refresh.ts`

**Implementation**:
```typescript
// token-refresh.ts
const REFRESH_ATTEMPTS: number[] = [];
const MAX_REFRESH_ATTEMPTS = 2; // Stay under server limit of 3
const REFRESH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function canAttemptRefresh(): boolean {
  const now = Date.now();
  // Clean old attempts
  while (REFRESH_ATTEMPTS.length > 0 && REFRESH_ATTEMPTS[0] < now - REFRESH_WINDOW_MS) {
    REFRESH_ATTEMPTS.shift();
  }
  return REFRESH_ATTEMPTS.length < MAX_REFRESH_ATTEMPTS;
}

export async function refreshAccessToken(): Promise<boolean> {
  if (!canAttemptRefresh()) {
    console.warn('Refresh rate limit reached, redirecting to login');
    store.dispatch(logout());
    window.location.href = '/login?reason=session_expired';
    return false;
  }

  REFRESH_ATTEMPTS.push(Date.now());

  try {
    // Existing refresh logic with exponential backoff
    const backoffMs = Math.pow(2, REFRESH_ATTEMPTS.length - 1) * 1000;
    await new Promise(resolve => setTimeout(resolve, backoffMs));
    // ... refresh API call
  } catch (error) {
    // Handle failure
  }
}
```

---

### 4. File Upload Magic Byte Validation Errors
**Server Change**: Files now validated by magic bytes, not just Content-Type header.

**Client Files to Modify**:
- `client/src/features/media/utils/validation.ts`
- All upload components error handling

**New Error Codes**:
| Code | User Message |
|------|--------------|
| `INVALID_FILE_TYPE` | "This file type is not allowed. Please upload JPEG, PNG, or WebP images." |
| `FILE_SIGNATURE_MISMATCH` | "The file appears to be corrupted or has an incorrect extension." |

**Implementation**:
```typescript
// In upload component error handlers
onError: (error) => {
  const code = getErrorCode(error);
  if (code === 'INVALID_FILE_TYPE' || code === 'FILE_SIGNATURE_MISMATCH') {
    toast.error('This file cannot be uploaded. Please ensure it is a valid JPEG, PNG, or WebP image.');
  } else {
    toast.error(getErrorMessage(error));
  }
}
```

---

## HIGH PRIORITY CHANGES

### 5. Email Verification Token Expiry
**Server Change**: Verification tokens now expire after 7 days.

**Client Files to Modify**:
- Email verification page/component
- `client/src/features/auth/services/auth.service.ts`

**New Error Code**: `VERIFICATION_TOKEN_EXPIRED`

**Implementation**:
- Show clear message: "Your verification link has expired."
- Add "Resend verification email" button
- Update registration success message to mention 7-day expiry

---

### 6. Temporary Password Removed from API Response
**Server Change**: Temp password now sent via email only, not in API response.

**Client Files to Check**:
- Search for `tempPassword` in codebase
- `client/src/features/auth/services/auth.service.ts`

**Action**:
- Remove any code displaying temporary passwords
- Update role claim success flow to direct users to check email
- Update messaging: "A temporary password has been sent to your email."

---

### 7. UUID Validation Errors
**Server Change**: All ID parameters validated as UUIDs, returns 400 on invalid format.

**New Error Code**: `INVALID_UUID`

**Client Implementation**:
```typescript
// lib/utils/validation.ts
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

// Before API calls (optional but improves UX)
if (!isValidUuid(tourId)) {
  router.push('/404');
  return;
}
```

---

### 8. New Error Codes Constant File
**Create**: `client/src/lib/constants/error-codes.ts`

```typescript
export const ERROR_CODES = {
  // Auth
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INVALID_CSRF_TOKEN: 'INVALID_CSRF_TOKEN',
  TOKEN_ALREADY_USED: 'TOKEN_ALREADY_USED',
  VERIFICATION_TOKEN_EXPIRED: 'VERIFICATION_TOKEN_EXPIRED',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Validation
  INVALID_UUID: 'INVALID_UUID',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // File Upload
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_SIGNATURE_MISMATCH: 'FILE_SIGNATURE_MISMATCH',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
} as const;

export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.ACCOUNT_LOCKED]: 'Your account is temporarily locked. Please try again later.',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment.',
  [ERROR_CODES.INVALID_FILE_TYPE]: 'This file type is not allowed.',
  [ERROR_CODES.VERIFICATION_TOKEN_EXPIRED]: 'Your verification link has expired.',
  // ... etc
};
```

---

### 9. Login Rate Limit Handling
**Server Change**: Login limited to 5 requests per 15 minutes.

**Client Files to Modify**:
- `client/src/features/auth/components/LoginForm.tsx`

**Implementation**:
```typescript
// Store rate limit info in localStorage
const RATE_LIMIT_KEY = 'login_rate_limit_until';

function handleRateLimitError(error: unknown) {
  const retryAfter = getErrorDetails(error)?.retryAfter; // seconds
  if (retryAfter) {
    const until = Date.now() + (retryAfter * 1000);
    localStorage.setItem(RATE_LIMIT_KEY, until.toString());
    setRateLimitedUntil(new Date(until));
  }
}

// On component mount, check for existing rate limit
useEffect(() => {
  const storedLimit = localStorage.getItem(RATE_LIMIT_KEY);
  if (storedLimit && parseInt(storedLimit) > Date.now()) {
    setRateLimitedUntil(new Date(parseInt(storedLimit)));
  }
}, []);
```

---

## MEDIUM/LOW PRIORITY CHANGES

### 10. Response Format Verification
**Server Change**: Standardized responses - data returned directly, not in nested wrappers.

**Action**: Audit all service files to ensure `response.data.data` extraction is correct.

**Files to Check**:
- `client/src/features/auth/services/auth.service.ts`
- `client/src/features/tours/services/tour.service.ts`
- `client/src/features/companies/services/company.service.ts`
- All other service files

---

### 11. Optional: Client-Side Magic Byte Validation
**Enhancement**: Validate files before upload for better UX.

```bash
npm install file-type
```

```typescript
// media/utils/validation.ts
import { fileTypeFromBuffer } from 'file-type';

export async function validateFileContent(file: File): Promise<boolean> {
  const buffer = await file.arrayBuffer();
  const type = await fileTypeFromBuffer(new Uint8Array(buffer));
  return type && ALLOWED_MIME_TYPES.includes(type.mime);
}
```

---

### 12. Admin: Audit Log Viewer
**Server Change**: Added audit logging for sensitive operations.

**Files to Create** (if admin UI needed):
- `client/src/features/admin/components/AuditLogViewer.tsx`
- `client/src/features/admin/hooks/useAuditLogs.ts`
- `client/src/features/admin/services/audit.service.ts`

---

### 13. Admin: User Restore
**Server Change**: Soft-deleted users can now be restored.

**Files to Create**:
- Add restore button to admin user management
- `restoreUser(userId)` in admin service

---

## Implementation Order

### Day 1: Critical Security
1. CSRF token handling (blocks all POST/PUT/PATCH/DELETE)
2. Token refresh rate limiting
3. Basic error code constants

### Day 2: Auth Flow
4. Account lockout UI
5. Login rate limit handling
6. Temp password removal check

### Day 3: Validation & Errors
7. UUID validation
8. File upload error handling
9. Email verification expiry

### Day 4: Testing & Polish
10. Response format audit
11. End-to-end testing
12. Fix any issues found

---

## Quick Reference: Files to Modify

| File | Priority | Changes |
|------|----------|---------|
| `lib/api/axios.config.ts` | CRITICAL | CSRF token, refresh backoff |
| `lib/api/csrf.ts` (NEW) | CRITICAL | CSRF management |
| `lib/constants/error-codes.ts` (NEW) | HIGH | Error code constants |
| `lib/utils/error.ts` | HIGH | Enhanced error handling |
| `lib/utils/token-refresh.ts` | CRITICAL | Rate limit aware refresh |
| `features/auth/components/LoginForm.tsx` | HIGH | Lockout UI, rate limit |
| `features/auth/hooks/useLogin.ts` | HIGH | Error code handling |
| `features/media/utils/validation.ts` | HIGH | File error handling |
| All upload components | MEDIUM | Error messages |
| All service files | MEDIUM | Response format check |

---

## Verification Checklist

After implementation:

- [ ] All API calls work with CSRF protection
- [ ] Login locks after 5 failed attempts
- [ ] Lockout countdown displays and works
- [ ] Token refresh doesn't exceed rate limit
- [ ] Invalid file uploads show clear error
- [ ] Expired verification tokens offer resend
- [ ] Invalid UUIDs handled gracefully
- [ ] Rate limits show user-friendly countdown
- [ ] No `tempPassword` in codebase
- [ ] All services extract responses correctly
