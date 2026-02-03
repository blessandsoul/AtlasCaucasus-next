---
trigger: glob: client/**
---

> **SCOPE**: These rules apply specifically to the **client** directory (Next.js App Router).

# Project Structure & File Naming

## Folder Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── providers.tsx       # Client providers (Redux, React Query)
│   ├── globals.css         # Global styles
│   ├── (auth)/             # Auth route group (no layout prefix in URL)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx      # Auth-specific layout
│   ├── (main)/             # Main route group
│   │   ├── layout.tsx      # Main layout with Header/Footer
│   │   ├── tours/
│   │   │   ├── page.tsx    # /tours
│   │   │   └── [id]/
│   │   │       └── page.tsx # /tours/:id
│   │   ├── companies/
│   │   ├── guides/
│   │   └── drivers/
│   ├── dashboard/          # Protected routes
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── admin/              # Admin routes
│       ├── layout.tsx
│       └── page.tsx
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Header, Footer, Sidebar
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── MainLayout.tsx
│   └── common/             # Shared components
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       ├── Pagination.tsx
│       └── EmptyState.tsx
├── features/               # Feature modules (domain-driven)
│   ├── auth/
│   │   ├── components/     # LoginForm, RegisterForm
│   │   ├── hooks/          # useAuth, useLogin
│   │   ├── services/       # auth.service.ts
│   │   ├── store/          # authSlice.ts (Redux)
│   │   ├── types/          # auth.types.ts
│   │   └── actions/        # Server Actions (if used)
│   ├── tours/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── actions/
│   └── users/
├── hooks/                  # Global custom hooks
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   └── useMediaQuery.ts
├── lib/
│   ├── api/
│   │   ├── axios.config.ts
│   │   └── api.types.ts
│   ├── constants/
│   │   ├── routes.ts
│   │   ├── api-endpoints.ts
│   │   └── app.constants.ts
│   ├── utils/
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── error.ts
│   └── utils.ts            # cn() helper for shadcn/ui
├── store/                  # Redux store
│   ├── index.ts
│   └── hooks.ts
├── types/                  # Global types
│   ├── index.ts
│   └── api.types.ts
└── middleware.ts           # Next.js middleware (auth protection)
```

## Next.js App Router Conventions

### Route Files
- **page.tsx**: The UI for a route (required for route to be accessible)
- **layout.tsx**: Shared UI for a segment and its children
- **loading.tsx**: Loading UI (Suspense boundary)
- **error.tsx**: Error UI (Error boundary)
- **not-found.tsx**: Not found UI
- **route.ts**: API endpoint (Route Handler)

### Special Files
```
app/
├── page.tsx           # / route
├── layout.tsx         # Root layout (required)
├── loading.tsx        # Global loading state
├── error.tsx          # Global error boundary
├── not-found.tsx      # 404 page
└── tours/
    ├── page.tsx       # /tours
    ├── loading.tsx    # Loading for /tours
    ├── error.tsx      # Error boundary for /tours
    └── [id]/
        └── page.tsx   # /tours/:id (dynamic route)
```

## File Naming Rules

### Components
- **PascalCase**: `TourCard.tsx`, `LoginForm.tsx`
- **Pattern**: `<ComponentName>.tsx`

### Pages (App Router)
- **lowercase folder + page.tsx**: `tours/page.tsx`, `login/page.tsx`
- Dynamic routes: `[id]/page.tsx`, `[slug]/page.tsx`
- Catch-all: `[...slug]/page.tsx`
- Optional catch-all: `[[...slug]]/page.tsx`

### Server Components vs Client Components
```tsx
// Server Component (default in App Router)
// No directive needed
export default async function ToursList() {
  // Can fetch data directly
  const tours = await fetchTours();
  return <div>{/* ... */}</div>;
}

// Client Component
'use client';
export const TourCard = ({ tour }: TourCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  return <div>{/* ... */}</div>;
};
```

### Hooks
- **camelCase + use prefix**: `useAuth.ts`, `useTours.ts`
- **Pattern**: `use<HookName>.ts`
- **Must be used in Client Components**

### Services
- **camelCase + .service suffix**: `auth.service.ts`, `tour.service.ts`
- **Pattern**: `<domain>.service.ts`

### Types
- **camelCase + .types suffix**: `auth.types.ts`, `tour.types.ts`
- **Pattern**: `<domain>.types.ts`

### Store (Redux)
- **camelCase + Slice suffix**: `authSlice.ts`, `tourSlice.ts`
- **Pattern**: `<domain>Slice.ts`

### Server Actions
- **camelCase + .actions suffix**: `auth.actions.ts`, `tour.actions.ts`
- **Pattern**: `<domain>.actions.ts`

## Module Structure Pattern

Every feature module follows this pattern:

```
features/<domain>/
├── components/         # Feature-specific components
├── hooks/             # Feature-specific hooks
├── services/          # API service (client-side)
├── store/             # Redux slice (if needed)
├── types/             # TypeScript types
├── actions/           # Server Actions (optional)
└── utils/             # Feature utilities
```

## Import Path Aliases

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/features/*": ["./src/features/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/store/*": ["./src/store/*"],
      "@/types/*": ["./src/types/*"],
      "@/app/*": ["./src/app/*"]
    }
  }
}
```

## Import Order

```tsx
// 1. React and Next.js
import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

// 3. UI components (shadcn/ui)
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 4. Local components
import { TourCard } from '../components/TourCard';

// 5. Hooks
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTours } from '../hooks/useTours';

// 6. Services
import { tourService } from '../services/tour.service';

// 7. Types (always use 'type' keyword)
import type { Tour } from '../types/tour.types';

// 8. Utils
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/format';
```

## Route Groups

Use route groups to organize routes without affecting the URL:

```
app/
├── (auth)/                 # Auth route group
│   ├── layout.tsx          # Auth layout (centered, no header)
│   ├── login/page.tsx      # /login
│   └── register/page.tsx   # /register
├── (main)/                 # Main route group
│   ├── layout.tsx          # Main layout (with header/footer)
│   ├── tours/page.tsx      # /tours
│   └── companies/page.tsx  # /companies
└── (dashboard)/            # Dashboard route group
    ├── layout.tsx          # Dashboard layout (sidebar)
    └── dashboard/page.tsx  # /dashboard
```

## Parallel Routes

For complex layouts with multiple slots:

```
app/
└── dashboard/
    ├── layout.tsx
    ├── page.tsx
    ├── @stats/
    │   └── page.tsx
    └── @notifications/
        └── page.tsx
```

## Intercepting Routes

For modals that can also be accessed directly:

```
app/
├── tours/
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx
└── @modal/
    └── (.)tours/
        └── [id]/
            └── page.tsx    # Modal version of tour details
```

## Constants Structure

### API Endpoints

```tsx
// lib/constants/api-endpoints.ts
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    REQUEST_PASSWORD_RESET: '/auth/request-password-reset',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USERS: {
    ME: '/users/me',
    UPDATE_ME: '/users/me',
    DELETE_ME: '/users/me',
  },
  TOURS: {
    LIST: '/tours',
    MY_TOURS: '/tours/my',
    CREATE: '/tours',
    GET: (id: string) => `/tours/${id}`,
    UPDATE: (id: string) => `/tours/${id}`,
    DELETE: (id: string) => `/tours/${id}`,
  },
} as const;
```

### Routes

```tsx
// lib/constants/routes.ts
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  TOURS: {
    LIST: '/tours',
    DETAILS: (id: string) => `/tours/${id}`,
    MY_TOURS: '/my-tours',
    CREATE: '/tours/create',
    EDIT: (id: string) => `/tours/${id}/edit`,
  },
} as const;
```

### App Constants

```tsx
// lib/constants/app.constants.ts
export const APP_NAME = 'Atlas Caucasus';

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const USER_ROLES = {
  USER: 'USER',
  COMPANY: 'COMPANY',
  ADMIN: 'ADMIN',
  GUIDE: 'GUIDE',
  DRIVER: 'DRIVER',
} as const;

export const CURRENCIES = {
  GEL: 'GEL',
  USD: 'USD',
  EUR: 'EUR',
} as const;
```

## Naming Conventions

### Variables
- **camelCase**: `userName`, `tourList`, `isLoading`

### Functions
- **camelCase**: `getUserData()`, `handleSubmit()`, `formatPrice()`

### Constants
- **UPPER_SNAKE_CASE**: `API_BASE_URL`, `MAX_FILE_SIZE`

### Types/Interfaces
- **PascalCase**: `User`, `Tour`, `TourFilters`
- **Interface prefix**: `IUser`, `ITour` (optional, be consistent)

### Enums/Type Unions
- **PascalCase**: `UserRole`, `TourStatus`

## Export Patterns

### Named Exports (Preferred for components)
```tsx
// ✅ GOOD
export const TourCard = () => {};
export const TourList = () => {};

// Import
import { TourCard, TourList } from './components';
```

### Default Export (Required for pages)
```tsx
// app/tours/page.tsx - MUST be default export
export default function ToursPage() {
  return <div>Tours</div>;
}

// app/tours/layout.tsx - MUST be default export
export default function ToursLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
```

### Barrel Exports
```tsx
// features/tours/index.ts
export { TourCard } from './components/TourCard';
export { TourList } from './components/TourList';
export { useTours } from './hooks/useTours';
export { tourService } from './services/tour.service';
export type * from './types/tour.types';

// Usage
import { TourCard, useTours, tourService } from '@/features/tours';
```

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_APP_NAME=Atlas Caucasus

# Server-only (no NEXT_PUBLIC_ prefix)
DATABASE_URL=mysql://...
JWT_SECRET=...
```

**Rules:**
- Prefix with `NEXT_PUBLIC_` to expose to browser
- Server-only variables have no prefix
- Never commit `.env.local` files
- Always provide `.env.local.example`

```tsx
// Accessing env variables
// Client-side (browser)
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

// Server-side only (in Server Components, Route Handlers, Server Actions)
const dbUrl = process.env.DATABASE_URL;
```

---

**Last Updated**: January 2025
