---
trigger: always_on
---

> **SCOPE**: These rules apply specifically to the **client** directory.

# Frontend Security Rules

## Core Security Principles

1. **Never trust user input**
2. **Never expose secrets**
3. **Always validate and sanitize**
4. **Defense in depth**

---

## XSS Prevention

### React's Built-in Protection

```tsx
// ✅ SAFE - React escapes by default
<div>{userInput}</div>
<div>{tour.title}</div>

// ❌ DANGEROUS
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ SAFE - Sanitize with DOMPurify
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

// Usage
<a href={isSafeUrl(url) ? url : '#'} rel="noopener noreferrer">
  Link
</a>
```

---

## Authentication Token Security

### Token Storage

```tsx
// ❌ AVOID localStorage for sensitive tokens (XSS vulnerable)
localStorage.setItem('accessToken', token);

// ✅ BETTER - Redux + localStorage with encryption
// Access tokens: Redux (cleared on tab close)
// Refresh tokens: httpOnly cookies (backend) OR encrypted localStorage

const authSlice = createSlice({
  name: 'auth',
  initialState: { tokens: null },
  reducers: {
    setTokens: (state, action) => {
      state.tokens = action.payload;
    },
    clearTokens: (state) => {
      state.tokens = null;
    },
  },
});

// Persist on change
store.subscribe(() => {
  const state = store.getState().auth;
  if (state.tokens) {
    localStorage.setItem('auth', JSON.stringify(state));
  } else {
    localStorage.removeItem('auth');
  }
});
```

### Token Transmission

```tsx
// ✅ ALWAYS use HTTPS in production
// ✅ Send in Authorization header
axios.interceptors.request.use((config) => {
  const token = store.getState().auth.tokens?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ❌ NEVER in URL
fetch(`/api/data?token=${token}`);

// ❌ NEVER log tokens
console.log('Token:', token);
```

### Auto Logout

```tsx
// hooks/useAutoLogout.ts
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
// Client validation (UX)
const tourSchema = z.object({
  title: z.string()
    .min(1).max(200)
    .regex(/^[a-zA-Z0-9\s\-.,!?]+$/, 'Invalid characters'),
  price: z.coerce.number().min(0).max(1000000),
  email: z.string().email(),
});

// ⚠️ Backend MUST validate again
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

## Environment Variables

### Never Expose Secrets

```env
# ❌ DANGEROUS
VITE_STRIPE_SECRET_KEY=sk_live_xxxxx
VITE_DATABASE_URL=postgres://...

# ✅ SAFE - Only public keys
VITE_API_BASE_URL=https://api.example.com
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxx
```

### .gitignore

```gitignore
.env
.env.local
.env.*.local
dist/
*.log
node_modules/
```

### Environment Validation

```tsx
// lib/utils/env.ts
const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  VITE_STRIPE_PUBLIC_KEY: z.string().startsWith('pk_'),
});

export const env = envSchema.parse({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_STRIPE_PUBLIC_KEY: import.meta.env.VITE_STRIPE_PUBLIC_KEY,
});
```

---

## Sensitive Data Handling

### Never Log Sensitive Data

```tsx
// ❌ DANGEROUS
console.log('User:', user);
console.log('Form:', formData);

// ✅ SAFE - Dev only, no data
if (import.meta.env.DEV) {
  console.log('User ID:', user.id);
}
```

### Clear on Logout

```tsx
const logout = async () => {
  try {
    await authService.logout();
  } finally {
    dispatch(logoutAction());
    localStorage.removeItem('auth');
    sessionStorage.clear();
    navigate('/login');
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

### Sanitize File Names

```tsx
export const sanitizeFileName = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .slice(0, 255);
};
```

---

## Third-Party Dependencies

### Audit Regularly

```bash
npm audit
npm audit fix
npm outdated
```

### Use Trusted Packages

- Weekly downloads > 100k
- Last update < 6 months
- GitHub stars > 1k
- Active maintainers
- No known vulnerabilities

### Lock Versions

```json
{
  "dependencies": {
    "react": "18.2.0",  // ✅ Exact version
  }
}
```

---

## Content Security Policy

```html
<!-- index.html -->
<meta 
  http-equiv="Content-Security-Policy" 
  content="
    default-src 'self';
    script-src 'self' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self' https://api.example.com;
  "
/>
```

---

## Secure Communication

### HTTPS Only

```tsx
// lib/api/axios.config.ts
const API_BASE_URL = import.meta.env.PROD
  ? 'https://api.example.com/api/v1'  // ✅ HTTPS
  : 'http://localhost:3000/api/v1';

if (import.meta.env.PROD && !API_BASE_URL.startsWith('https://')) {
  throw new Error('Production must use HTTPS');
}
```

### External Links

```tsx
// Always use rel="noopener noreferrer"
<a href={url} target="_blank" rel="noopener noreferrer">
  Link
</a>
```

---

## Security Checklist

### Pre-Deployment

- [ ] HTTPS only in production
- [ ] No hardcoded secrets
- [ ] Environment variables validated
- [ ] No console.logs with data
- [ ] Dependencies audited
- [ ] File uploads validated
- [ ] No dangerouslySetInnerHTML without DOMPurify
- [ ] Auto-logout configured
- [ ] External links secured
- [ ] Input validation on all forms
- [ ] Sensitive data cleared on logout

### Development

- [ ] Code reviews for security
- [ ] Monthly dependency updates
- [ ] Security testing (OWASP)
- [ ] Team security training

---

## AI Agent Security Rules

### Rule 1: Never Trust User Input
```tsx
// ❌ NEVER
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ ALWAYS
<div>{userInput}</div>
// OR
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### Rule 2: Never Expose Secrets
```tsx
// ❌ NEVER
const apiKey = 'sk_live_xxxxx';
console.log(user.password);

// ✅ ALWAYS
const apiKey = import.meta.env.VITE_PUBLIC_KEY;
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
// ❌ Avoid plain localStorage
localStorage.setItem('token', token);

// ✅ Redux + localStorage (encrypted) OR httpOnly cookies
```

---

**Last Updated**: January 2, 2025
