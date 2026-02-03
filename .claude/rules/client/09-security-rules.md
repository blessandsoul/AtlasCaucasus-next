---
trigger: glob: client/**
---

> **SCOPE**: These rules apply specifically to the **client** directory (Next.js App Router).

# Frontend Security Rules

## Core Security Principles

1. **Never trust user input**
2. **Never expose secrets**
3. **Always validate and sanitize**
4. **Defense in depth**

---

## XSS Prevention

### React/Next.js Built-in Protection

```tsx
// ✅ SAFE - React escapes by default
<div>{userInput}</div>
<div>{tour.title}</div>

// ❌ DANGEROUS
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ SAFE - Sanitize with DOMPurify (Client Component only)
'use client';
import DOMPurify from 'dompurify';

<div
  dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'strong', 'a', 'p'],
      ALLOWED_ATTR: ['href'],
    })
  }}
/>
```

### URL Sanitization

```tsx
// lib/utils/security.ts
export const isSafeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

// Usage with Next.js Link
import Link from 'next/link';

{isSafeUrl(url) ? (
  <Link href={url}>{label}</Link>
) : (
  <span>{label}</span>
)}
```

---

## Authentication Token Security

### Token Storage in Next.js

```tsx
// ❌ AVOID localStorage for sensitive tokens (XSS vulnerable)
localStorage.setItem('accessToken', token);

// ✅ BETTER - Redux + localStorage with SSR check
// store/index.ts
const loadAuthState = () => {
  if (typeof window === 'undefined') return undefined;
  try {
    const state = localStorage.getItem('auth');
    return state ? JSON.parse(state) : undefined;
  } catch {
    return undefined;
  }
};

// ✅ BEST - httpOnly cookies via Server Actions or API routes
// Server Action
'use server';
import { cookies } from 'next/headers';

export async function setAuthCookie(token: string) {
  cookies().set('accessToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}
```

### Token Transmission

```tsx
// ✅ ALWAYS use HTTPS in production
// ✅ Send in Authorization header (client-side)
axios.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = store.getState().auth.tokens?.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ❌ NEVER in URL
fetch(`/api/data?token=${token}`);

// ❌ NEVER log tokens
console.log('Token:', token);
```

### Auto Logout Hook

```tsx
'use client';

// hooks/useAutoLogout.ts
import { useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const useAutoLogout = (timeoutMinutes = 30) => {
  const { logout } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(logout, timeoutMinutes * 60 * 1000);
    };

    events.forEach(e => document.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      events.forEach(e => document.removeEventListener(e, resetTimer));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [logout, timeoutMinutes]);
};
```

---

## Input Validation

### Always Validate Client + Server

```tsx
// Client validation (UX) - in Client Component
const tourSchema = z.object({
  title: z.string()
    .min(1).max(200)
    .regex(/^[a-zA-Z0-9\s\-.,!?]+$/, 'Invalid characters'),
  price: z.coerce.number().min(0).max(1000000),
  email: z.string().email(),
});

// Server validation - in Server Action
'use server';
export async function createTour(formData: FormData) {
  const validatedFields = tourSchema.safeParse({
    title: formData.get('title'),
    price: formData.get('price'),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  // Proceed with validated data
}
```

### Sanitize Input

```tsx
// lib/utils/sanitize.ts
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '').slice(0, 1000);
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim().slice(0, 255);
};

export const sanitizeFileName = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 255);
};
```

---

## Environment Variables in Next.js

### Client vs Server Variables

```env
# .env.local

# ✅ SAFE - Public (exposed to browser)
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
NEXT_PUBLIC_APP_NAME=Atlas Caucasus

# ✅ SAFE - Server only (NOT exposed to browser)
DATABASE_URL=mysql://...
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_live_xxxxx

# ❌ DANGEROUS - Never prefix secrets with NEXT_PUBLIC_
# NEXT_PUBLIC_DATABASE_URL=...
# NEXT_PUBLIC_JWT_SECRET=...
```

### .gitignore

```gitignore
.env
.env.local
.env*.local
.next/
out/
*.log
node_modules/
```

### Environment Validation

```tsx
// lib/utils/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
});
```

---

## Sensitive Data Handling

### Never Log Sensitive Data

```tsx
// ❌ DANGEROUS
console.log('User:', user);
console.log('Form:', formData);

// ✅ SAFE - Dev only, no sensitive data
if (process.env.NODE_ENV === 'development') {
  console.log('User ID:', user.id);
}
```

### Clear on Logout

```tsx
'use client';

const logout = async () => {
  try {
    await authService.logout();
  } finally {
    dispatch(logoutAction());
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth');
      sessionStorage.clear();
    }
    router.push('/login');
  }
};
```

### Mask Sensitive Info

```tsx
// lib/utils/mask.ts
export const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
};

export const maskPhone = (phone: string): string => {
  return phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
};

// Usage
<div>Email: {maskEmail(user.email)}</div>
```

---

## File Upload Security

### Validate Files

```tsx
// lib/utils/file-validation.ts
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const validateImageFile = (file: File) => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, WebP allowed' };
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'Max 5MB' };
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
    return { valid: false, error: 'Invalid extension' };
  }

  return { valid: true };
};
```

---

## Security Headers in Next.js

### next.config.js Headers

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### Content Security Policy

```js
// next.config.js
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  connect-src 'self' ${process.env.NEXT_PUBLIC_API_BASE_URL};
`;

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ''),
          },
        ],
      },
    ];
  },
};
```

---

## Middleware for Auth Protection

```tsx
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/dashboard', '/profile', '/my-tours', '/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for auth token
  const token = request.cookies.get('accessToken')?.value;

  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtectedPath && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/my-tours/:path*', '/admin/:path*'],
};
```

---

## External Links

```tsx
// Always use rel="noopener noreferrer" for external links
import Link from 'next/link';

// Internal link (safe)
<Link href="/tours">Tours</Link>

// External link
<a href={externalUrl} target="_blank" rel="noopener noreferrer">
  External Link
</a>
```

---

## Security Checklist

### Pre-Deployment

- [ ] HTTPS only in production
- [ ] No hardcoded secrets
- [ ] No NEXT_PUBLIC_ prefix on secrets
- [ ] Environment variables validated
- [ ] No console.logs with sensitive data
- [ ] Dependencies audited (`npm audit`)
- [ ] File uploads validated
- [ ] No dangerouslySetInnerHTML without DOMPurify
- [ ] Auto-logout configured
- [ ] External links secured
- [ ] Input validation on all forms
- [ ] Sensitive data cleared on logout
- [ ] Security headers configured
- [ ] Middleware protecting routes

### Development

- [ ] Code reviews for security
- [ ] Monthly dependency updates
- [ ] Security testing (OWASP)

---

## AI Agent Security Rules

### Rule 1: Never Trust User Input
```tsx
// ❌ NEVER
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ ALWAYS
<div>{userInput}</div>
// OR with sanitization
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### Rule 2: Never Expose Secrets
```tsx
// ❌ NEVER prefix secrets with NEXT_PUBLIC_
NEXT_PUBLIC_DATABASE_URL=...

// ✅ Server-only (no prefix)
DATABASE_URL=...

// Access in Server Component or Server Action only
const dbUrl = process.env.DATABASE_URL;
```

### Rule 3: Always Validate Files
```tsx
// ❌ NEVER
<input type="file" onChange={e => upload(e.target.files)} />

// ✅ ALWAYS
const validation = validateImageFile(file);
if (!validation.valid) return toast.error(validation.error);
```

### Rule 4: Secure Tokens
```tsx
// ❌ Avoid plain localStorage in SSR context
if (typeof window !== 'undefined') {
  localStorage.setItem('token', token);
}

// ✅ Use httpOnly cookies for sensitive tokens
// Set via Server Action or API route
```

---

**Last Updated**: January 2025
