---
trigger: glob: client/**
---

> **SCOPE**: These rules apply specifically to the **client** directory (Next.js App Router).

# TypeScript Rules & Types

## TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    },
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Strict Mode Rules

- **Always use strict mode**
- **NO `any` type** (use `unknown` if needed)
- **Explicit return types** for functions
- **No implicit any**

```tsx
// ❌ BAD
const fetchTour = async (id) => {
  const response = await api.get(`/tours/${id}`);
  return response.data;
};

// ✅ GOOD
const fetchTour = async (id: string): Promise<Tour> => {
  const response = await api.get<ApiResponse<Tour>>(`/tours/${id}`);
  return response.data.data;
};
```

## Type vs Interface

### Use `interface` for:
- Component props
- Object shapes
- Extendable structures

### Use `type` for:
- Unions
- Intersections
- Utility types
- Type aliases

```tsx
// ✅ Interface for props
interface TourCardProps {
  tour: Tour;
  onClick?: () => void;
}

// ✅ Type for unions
type UserRole = 'USER' | 'COMPANY' | 'ADMIN' | 'GUIDE' | 'DRIVER';
type TourStatus = 'active' | 'inactive' | 'deleted';

// ✅ Type for intersections
type TourWithOwner = Tour & { owner: User };

// ✅ Type for utility types
type PartialTour = Partial<Tour>;
type TourKeys = keyof Tour;
```

## Next.js Specific Types

### Page Props
```tsx
// app/tours/[id]/page.tsx
interface TourPageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function TourPage({ params, searchParams }: TourPageProps) {
  const tour = await tourService.getTour(params.id);
  return <TourDetails tour={tour} />;
}
```

### Layout Props
```tsx
// app/(main)/layout.tsx
interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return <div>{children}</div>;
}
```

### generateMetadata
```tsx
import type { Metadata, ResolvingMetadata } from 'next';

interface Props {
  params: { id: string };
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const tour = await tourService.getTour(params.id);

  return {
    title: tour.title,
    description: tour.summary,
  };
}
```

### generateStaticParams
```tsx
export async function generateStaticParams(): Promise<{ id: string }[]> {
  const tours = await tourService.getTours();

  return tours.items.map((tour) => ({
    id: tour.id,
  }));
}
```

## API Response Types

Match backend response structure:

```tsx
// lib/api/api.types.ts

// Base response
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Paginated response
export interface PaginatedApiResponse<T> {
  success: boolean;
  message: string;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

// Error response
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// Pagination params
export interface PaginationParams {
  page?: number;
  limit?: number;
}
```

## Domain Types

Create types matching backend entities:

```tsx
// features/auth/types/auth.types.ts

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'USER' | 'COMPANY' | 'ADMIN' | 'GUIDE' | 'DRIVER';

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface IAuthState {
  user: IUser | null;
  tokens: IAuthTokens | null;
  isAuthenticated: boolean;
}
```

```tsx
// features/tours/types/tour.types.ts

export interface Tour {
  id: string;
  ownerId: string;
  title: string;
  summary: string | null;
  price: number;
  currency: string;
  city: string | null;
  durationMinutes: number | null;
  maxPeople: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTourRequest {
  title: string;
  summary?: string;
  price: number;
  currency?: string;
  city?: string;
  durationMinutes?: number;
  maxPeople?: number;
}

export interface UpdateTourRequest {
  title?: string;
  summary?: string;
  price?: number;
  city?: string;
  durationMinutes?: number;
  maxPeople?: number;
}

export interface TourFilters {
  search?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'createdAt' | 'price' | '-price' | 'title';
}
```

## Generic Types

```tsx
// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResult<T> = Promise<T>;

// Form types
export type FormErrors<T> = {
  [K in keyof T]?: string;
};

// API types
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
```

## Server Actions Types

```tsx
// features/tours/actions/tour.actions.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function createTour(
  formData: FormData
): Promise<{ success: boolean; error?: string; data?: Tour }> {
  try {
    const tour = await tourService.createTour({
      title: formData.get('title') as string,
      price: Number(formData.get('price')),
    });

    revalidatePath('/tours');
    return { success: true, data: tour };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}
```

## Component Prop Types

```tsx
// Base component props
interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// With generic data
interface DataComponentProps<T> extends BaseComponentProps {
  data: T;
  onSelect?: (item: T) => void;
}

// Usage
interface TourListProps extends BaseComponentProps {
  tours: Tour[];
  onTourClick: (id: string) => void;
}

export const TourList = ({ tours, onTourClick, className }: TourListProps) => {
  // ...
};
```

## Type Guards

```tsx
export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'success' in error &&
    error.success === false
  );
};

export const isUser = (value: unknown): value is IUser => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value &&
    'role' in value
  );
};

// Usage
if (isApiError(error)) {
  console.error(error.error.message);
}
```

## Enum Alternatives (String Unions)

```tsx
// ❌ Avoid enums
enum UserRole {
  USER = 'USER',
  COMPANY = 'COMPANY',
  ADMIN = 'ADMIN',
}

// ✅ Use string unions + const object
export const USER_ROLES = {
  USER: 'USER',
  COMPANY: 'COMPANY',
  ADMIN: 'ADMIN',
  GUIDE: 'GUIDE',
  DRIVER: 'DRIVER',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Or simpler
export type UserRole = 'USER' | 'COMPANY' | 'ADMIN' | 'GUIDE' | 'DRIVER';
```

## Utility Type Patterns

```tsx
// Pick specific properties
type TourPreview = Pick<Tour, 'id' | 'title' | 'price' | 'city'>;

// Omit specific properties
type TourWithoutDates = Omit<Tour, 'createdAt' | 'updatedAt'>;

// Partial (all optional)
type PartialTour = Partial<Tour>;

// Required (all required)
type RequiredTour = Required<Tour>;

// Readonly
type ReadonlyTour = Readonly<Tour>;

// Record
type TourById = Record<string, Tour>;
```

## Discriminated Unions

```tsx
// State machine pattern
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// Usage
const [state, setState] = useState<RequestState<Tour[]>>({ status: 'idle' });

if (state.status === 'success') {
  console.log(state.data);
}
```

## Type Inference with Zod

```tsx
import { z } from 'zod';

const tourSchema = z.object({
  title: z.string().min(1).max(200),
  price: z.coerce.number().min(0),
  city: z.string().optional(),
});

// Infer type from schema
type TourFormData = z.infer<typeof tourSchema>;
// No need to manually define type
```

## Type Safety Checklist

- [ ] Strict mode enabled
- [ ] No `any` types used
- [ ] All functions have return types
- [ ] Props interfaces defined
- [ ] API response types match backend
- [ ] Domain types match backend models
- [ ] Type guards for runtime checks
- [ ] Next.js specific types used (Page, Layout, Metadata)

---

**Last Updated**: January 2025
