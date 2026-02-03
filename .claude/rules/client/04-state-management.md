---
trigger: glob: client/**
---

> **SCOPE**: These rules apply specifically to the **client** directory (Next.js App Router).

# State Management Patterns

## State Strategy

### Decision Matrix

| State Type | Tool | Examples |
|------------|------|----------|
| **Server Data (SSR)** | Server Components | Initial page data, SEO-critical content |
| **Server Data (Client)** | React Query | Real-time updates, user-triggered fetches |
| **Global Client** | Redux | Auth tokens, current user, theme |
| **Local** | useState | Form inputs, modals, hover state |
| **URL** | useSearchParams | Filters, pagination, search query |

## Server-Side Data Fetching (Preferred)

### In Server Components
```tsx
// app/tours/page.tsx (Server Component)
import { tourService } from '@/features/tours/services/tour.service';

export default async function ToursPage() {
  // Data is fetched on the server
  const { items: tours, pagination } = await tourService.getTours();

  return (
    <div>
      <h1>Tours</h1>
      <TourList tours={tours} />
      <Pagination {...pagination} />
    </div>
  );
}
```

### With Search Params
```tsx
// app/tours/page.tsx
interface ToursPageProps {
  searchParams: {
    page?: string;
    city?: string;
    search?: string;
  };
}

export default async function ToursPage({ searchParams }: ToursPageProps) {
  const page = Number(searchParams.page) || 1;
  const city = searchParams.city || '';
  const search = searchParams.search || '';

  const { items: tours, pagination } = await tourService.getTours({
    page,
    city,
    search,
  });

  return (
    <div>
      <TourFilters initialCity={city} initialSearch={search} />
      <TourList tours={tours} />
      <Pagination {...pagination} />
    </div>
  );
}
```

## React Query (Client-Side Server State)

### Setup

```tsx
'use client';

// app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 min
            gcTime: 10 * 60 * 1000, // 10 min (formerly cacheTime)
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### Query Pattern

```tsx
'use client';

// features/tours/hooks/useTours.ts
import { useQuery } from '@tanstack/react-query';
import { tourService } from '../services/tour.service';

export const useTours = (filters = {}, page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['tours', filters, page, limit],
    queryFn: () => tourService.getTours({ ...filters, page, limit }),
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData, // Keep previous data during refetch
  });
};

// Single item
export const useTour = (id: string) => {
  return useQuery({
    queryKey: ['tour', id],
    queryFn: () => tourService.getTour(id),
    enabled: !!id,
  });
};
```

### Mutation Pattern

```tsx
'use client';

// features/tours/hooks/useCreateTour.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export const useCreateTour = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: tourService.createTour,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tours'] });
      toast.success('Tour created!');
      router.push(`/tours/${data.id}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

// Update
export const useUpdateTour = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tour> }) =>
      tourService.updateTour(id, data),
    onSuccess: (updatedTour) => {
      queryClient.setQueryData(['tour', updatedTour.id], updatedTour);
      queryClient.invalidateQueries({ queryKey: ['tours'] });
      toast.success('Tour updated!');
    },
  });
};

// Delete
export const useDeleteTour = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tourService.deleteTour,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: ['tour', deletedId] });
      queryClient.invalidateQueries({ queryKey: ['tours'] });
      toast.success('Tour deleted!');
    },
  });
};
```

### Query Keys

```tsx
// features/tours/utils/query-keys.ts
export const tourKeys = {
  all: ['tours'] as const,
  lists: () => [...tourKeys.all, 'list'] as const,
  list: (filters: TourFilters) => [...tourKeys.lists(), filters] as const,
  details: () => [...tourKeys.all, 'detail'] as const,
  detail: (id: string) => [...tourKeys.details(), id] as const,
};

// Usage
useQuery({
  queryKey: tourKeys.detail(id),
  queryFn: () => tourService.getTour(id),
});

// Invalidate all lists
queryClient.invalidateQueries({ queryKey: tourKeys.lists() });
```

## Redux (Global Client State)

### Store Setup

```tsx
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/store/authSlice';

// Load from localStorage (client-side only)
const loadAuthState = () => {
  if (typeof window === 'undefined') return undefined;
  try {
    const state = localStorage.getItem('auth');
    return state ? JSON.parse(state) : undefined;
  } catch {
    return undefined;
  }
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  preloadedState: {
    auth: loadAuthState(),
  },
});

// Save to localStorage (client-side only)
if (typeof window !== 'undefined') {
  store.subscribe(() => {
    try {
      localStorage.setItem('auth', JSON.stringify(store.getState().auth));
    } catch {}
  });
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Typed Hooks

```tsx
// store/hooks.ts
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### Slice Pattern

```tsx
// features/auth/store/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { IUser, IAuthTokens } from '../types/auth.types';

interface AuthState {
  user: IUser | null;
  tokens: IAuthTokens | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: IUser; tokens: IAuthTokens }>) => {
      state.user = action.payload.user;
      state.tokens = action.payload.tokens;
      state.isAuthenticated = true;
    },
    updateTokens: (state, action: PayloadAction<IAuthTokens>) => {
      state.tokens = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, updateTokens, logout } = authSlice.actions;
export default authSlice.reducer;
```

### Using Redux

```tsx
'use client';

// features/auth/hooks/useAuth.ts
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCredentials, logout as logoutAction } from '../store/authSlice';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, isAuthenticated, tokens } = useAppSelector((state) => state.auth);

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      dispatch(logoutAction());
      router.push('/login');
    }
  };

  return { user, isAuthenticated, tokens, logout };
};
```

## URL State

```tsx
'use client';

// Using Next.js useSearchParams for filters
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export const ToursFilters = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get('page')) || 1;
  const city = searchParams.get('city') || '';

  const updateFilters = useCallback((filters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change
    params.set('page', '1');

    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  return (
    <div>
      <input
        value={city}
        onChange={(e) => updateFilters({ city: e.target.value })}
        placeholder="Filter by city"
      />
    </div>
  );
};
```

## Local State

### useState

```tsx
'use client';

// Simple state
const [isOpen, setIsOpen] = useState(false);
const [count, setCount] = useState(0);

// Complex state object
const [formData, setFormData] = useState({
  title: '',
  price: 0,
});

const handleChange = (field: string, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};

// Functional updates
const increment = () => {
  setCount(c => c + 1); // ✅ GOOD
  // setCount(count + 1); // ❌ BAD - may be stale
};
```

### useReducer

```tsx
'use client';

// For complex state logic
interface FormState {
  values: { title: string; price: number };
  errors: Record<string, string>;
  isSubmitting: boolean;
}

type FormAction =
  | { type: 'SET_FIELD'; field: string; value: any }
  | { type: 'SET_ERROR'; field: string; error: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'RESET' };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
      };
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true };
    case 'SUBMIT_SUCCESS':
      return initialState;
    default:
      return state;
  }
}

const [state, dispatch] = useReducer(formReducer, initialState);
```

## Server Actions (Next.js)

```tsx
// features/tours/actions/tour.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createTour(formData: FormData) {
  const title = formData.get('title') as string;
  const price = Number(formData.get('price'));

  try {
    const tour = await tourService.createTour({ title, price });
    revalidatePath('/tours');
    redirect(`/tours/${tour.id}`);
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

// Usage in Client Component
'use client';

import { createTour } from '../actions/tour.actions';

export const CreateTourForm = () => {
  return (
    <form action={createTour}>
      <input name="title" required />
      <input name="price" type="number" required />
      <button type="submit">Create Tour</button>
    </form>
  );
};
```

## Common Patterns

### Derived State

```tsx
'use client';

// ❌ BAD - Redundant state
const [tours, setTours] = useState<Tour[]>([]);
const [activeTours, setActiveTours] = useState<Tour[]>([]);

useEffect(() => {
  setActiveTours(tours.filter(t => t.isActive));
}, [tours]);

// ✅ GOOD - Compute on render
const [tours, setTours] = useState<Tour[]>([]);
const activeTours = useMemo(
  () => tours.filter(t => t.isActive),
  [tours]
);
```

## Anti-Patterns

```tsx
// ❌ Server state in Redux
const toursSlice = { tours: [], isLoading: false };

// ✅ Use Server Components or React Query
const { items: tours } = await tourService.getTours(); // Server Component
const { data: tours, isLoading } = useTours(); // Client Component

// ❌ Modal state in Redux
const uiSlice = { isModalOpen: false };

// ✅ Local state
const [isModalOpen, setIsModalOpen] = useState(false);

// ❌ Fetching in Client Component when Server Component works
'use client';
const { data: tours } = useTours();

// ✅ Fetch in Server Component
export default async function ToursPage() {
  const tours = await tourService.getTours();
  return <TourList tours={tours} />;
}
```

## When to Use What

| Scenario | Solution |
|----------|----------|
| Page initial data | Server Component |
| User-triggered data | React Query |
| Auth state | Redux |
| Form input | useState |
| Complex form | useReducer + React Hook Form |
| Filters in URL | useSearchParams |
| Form submission | Server Action or useMutation |
| Real-time updates | React Query + refetch |

---

**Last Updated**: January 2025
