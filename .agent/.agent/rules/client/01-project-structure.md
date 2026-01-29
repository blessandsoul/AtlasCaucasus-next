---
trigger: always_on
---

> **SCOPE**: These rules apply specifically to the **client** directory.

# Project Structure & File Naming

## Folder Structure

```
src/
├── app/                    # App configuration
│   ├── App.tsx
│   ├── router.tsx
│   └── providers.tsx
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Header, Footer, MainLayout
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── MainLayout.tsx
│   └── common/            # Shared components
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       ├── ProtectedRoute.tsx
│       ├── Pagination.tsx
│       └── EmptyState.tsx
├── features/              # Feature modules (domain-driven)
│   ├── auth/
│   │   ├── components/    # LoginForm, RegisterForm
│   │   ├── hooks/         # useAuth, useLogin, useRegister
│   │   ├── pages/         # LoginPage, RegisterPage
│   │   ├── services/      # auth.service.ts
│   │   ├── store/         # authSlice.ts (Redux)
│   │   ├── types/         # auth.types.ts
│   │   └── utils/         # auth.utils.ts
│   ├── tours/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── users/
├── hooks/                 # Global custom hooks
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
│   └── cn.ts
├── store/                 # Redux store
│   ├── index.ts
│   └── hooks.ts
├── types/                 # Global types
│   ├── index.ts
│   └── api.types.ts
└── styles/
    └── globals.css
```

## File Naming Rules

### Components
- **PascalCase**: `TourCard.tsx`, `LoginForm.tsx`
- **Pattern**: `<ComponentName>.tsx`

### Pages
- **PascalCase + Page suffix**: `ToursPage.tsx`, `LoginPage.tsx`
- **Pattern**: `<FeatureName>Page.tsx`

### Hooks
- **camelCase + use prefix**: `useAuth.ts`, `useTours.ts`
- **Pattern**: `use<HookName>.ts`

### Services
- **camelCase + .service suffix**: `auth.service.ts`, `tour.service.ts`
- **Pattern**: `<domain>.service.ts`

### Types
- **camelCase + .types suffix**: `auth.types.ts`, `tour.types.ts`
- **Pattern**: `<domain>.types.ts`

### Store (Redux)
- **camelCase + Slice suffix**: `authSlice.ts`, `tourSlice.ts`
- **Pattern**: `<domain>Slice.ts`

### Utils
- **camelCase + .utils suffix**: `auth.utils.ts`, `date.utils.ts`
- **Pattern**: `<purpose>.utils.ts`

### Constants
- **camelCase**: `routes.ts`, `api-endpoints.ts`, `app.constants.ts`

## Module Structure Pattern

Every feature module follows this pattern:

```
features/<domain>/
├── components/         # Feature-specific components
├── hooks/             # Feature-specific hooks
├── pages/             # Feature pages (routes)
├── services/          # API service
├── store/             # Redux slice (if needed)
├── types/             # TypeScript types
└── utils/             # Feature utilities
```

## Import Path Aliases

```json
// tsconfig.json & vite.config.ts
{
  "paths": {
    "@/*": ["./src/*"],
    "@/components/*": ["./src/components/*"],
    "@/features/*": ["./src/features/*"],
    "@/lib/*": ["./src/lib/*"],
    "@/hooks/*": ["./src/hooks/*"],
    "@/store/*": ["./src/store/*"],
    "@/types/*": ["./src/types/*"]
  }
}
```

## Import Order

```tsx
// 1. React and framework
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/utils/format';
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
export const APP_NAME = 'Tourism Georgia';

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const USER_ROLES = {
  USER: 'USER',
  COMPANY: 'COMPANY',
  ADMIN: 'ADMIN',
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

### Named Exports (Preferred)
```tsx
// ✅ GOOD
export const TourCard = () => {};
export const TourList = () => {};

// Import
import { TourCard, TourList } from './components';
```

### Default Export (Only for app.ts)
```tsx
// ❌ AVOID for components
export default TourCard;

// ✅ OK for App
export default App;
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
# .env.development
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Tourism Georgia

# .env.production
VITE_API_BASE_URL=https://api.tourismgeorgia.com/api/v1
VITE_APP_NAME=Tourism Georgia
```

**Rules:**
- Prefix with `VITE_` to expose to client
- Never commit `.env` files
- Always provide `.env.example`

```tsx
// Accessing env variables
const apiUrl = import.meta.env.VITE_API_BASE_URL;
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;
```

---

**Last Updated**: January 2, 2025
