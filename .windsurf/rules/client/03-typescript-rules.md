---
trigger: always_on
---

> **SCOPE**: These rules apply specifically to the **client** directory.

# TypeScript Rules & Types

## TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
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
type UserRole = 'USER' | 'COMPANY' | 'ADMIN';
type TourStatus = 'active' | 'inactive' | 'deleted';

// ✅ Type for intersections
type TourWithOwner = Tour & { owner: User };

// ✅ Type for utility types
type PartialTour = Partial<Tour>;
type TourKeys = keyof Tour;
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

// User type (matches backend User model)
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

export type UserRole = 'USER' | 'COMPANY' | 'ADMIN';

// Auth tokens
export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Request types
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

// State types
export interface IAuthState {
  user: IUser | null;
  tokens: IAuthTokens | null;
  isAuthenticated: boolean;
}
```

```tsx
// features/tours/types/tour.types.ts

// Tour type (matches backend Tour model)
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

// Request types
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

// Filter types
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

export type FormValues<T> = {
  [K in keyof T]: T[K];
};

// API types
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiConfig {
  method: ApiMethod;
  url: string;
  data?: any;
  params?: Record<string, any>;
}
```

## Function Type Signatures

```tsx
// Event handlers
type ClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => void;
type ChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => void;
type SubmitHandler = (event: React.FormEvent<HTMLFormElement>) => void;

// Async functions
type AsyncFunction<T> = () => Promise<T>;
type AsyncFunctionWithArgs<T, A> = (args: A) => Promise<T>;

// Callbacks
type Callback<T = void> = (data: T) => void;
type ErrorCallback = (error: Error) => void;

// Usage
const handleClick: ClickHandler = (event) => {
  event.preventDefault();
  // ...
};

const fetchData: AsyncFunction<Tour[]> = async () => {
  const response = await api.get('/tours');
  return response.data.data.items;
};
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

// With render props
interface RenderPropComponent<T> {
  data: T[];
  render: (item: T) => React.ReactNode;
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
// Type guard functions
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

if (isUser(data)) {
  console.log(data.email);
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
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Or simpler
export type UserRole = 'USER' | 'COMPANY' | 'ADMIN';
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

// Extract from union
type AdminRole = Extract<UserRole, 'ADMIN'>;

// Exclude from union
type NonAdminRoles = Exclude<UserRole, 'ADMIN'>;
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
  // TypeScript knows state.data exists
  console.log(state.data);
}

if (state.status === 'error') {
  // TypeScript knows state.error exists
  console.error(state.error);
}
```

## Type Inference

```tsx
// Let TypeScript infer when possible
const tours = []; // ❌ any[]
const tours: Tour[] = []; // ✅ Explicit

// Infer from return value
const fetchTours = async () => {
  return await api.get<Tour[]>('/tours');
}; // Return type inferred as Promise<Tour[]>

// Infer from Zod schema
const tourSchema = z.object({
  title: z.string(),
  price: z.number(),
});

type TourFormData = z.infer<typeof tourSchema>;
// No need to manually define type
```

## Global Type Declarations

```tsx
// types/index.ts

// Extend existing types
declare module 'react' {
  interface CSSProperties {
    '--custom-property'?: string;
  }
}

// Global utilities
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

// Augment module types
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError;
  }
}
```

## Type Safety Checklist

- [ ] Strict mode enabled
- [ ] No `any` types used
- [ ] All functions have return types
- [ ] Props interfaces defined
- [ ] API response types match backend
- [ ] Domain types match backend models
- [ ] Type guards for runtime checks
- [ ] Discriminated unions for state machines

---

**Last Updated**: January 2, 2025
