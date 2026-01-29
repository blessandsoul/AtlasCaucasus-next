---
trigger: always_on
---

> **SCOPE**: These rules apply specifically to the **client** directory.

# State Management Patterns

## State Strategy

### Decision Matrix

| State Type | Tool | Examples |
|------------|------|----------|
| **Server Data** | React Query | Tours, bookings, user data from API |
| **Global Client** | Redux | Auth tokens, current user, theme |
| **Local** | useState | Form inputs, modals, hover state |
| **URL** | React Router | Filters, pagination, search query |

## React Query (Server State)

### Setup

```tsx
// app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min
      cacheTime: 10 * 60 * 1000, // 10 min
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const Providers = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);
```

### Query Pattern

```tsx
// features/tours/hooks/useTours.ts
import { useQuery } from '@tanstack/react-query';
import { tourService } from '../services/tour.service';

export const useTours = (filters = {}, page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['tours', filters, page, limit],
    queryFn: () => tourService.getTours({ ...filters, page, limit }),
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true, // Smooth pagination
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
// features/tours/hooks/useCreateTour.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const useCreateTour = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: tourService.createTour,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tours'] });
      toast.success('Tour created!');
      navigate(`/tours/${data.id}`);
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

### Optimistic Updates

```tsx
export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ tourId, isFavorite }) =>
      isFavorite ? tourService.removeFavorite(tourId) : tourService.addFavorite(tourId),
    
    onMutate: async ({ tourId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: ['tour', tourId] });
      
      const previousTour = queryClient.getQueryData(['tour', tourId]);
      
      queryClient.setQueryData(['tour', tourId], (old: any) => ({
        ...old,
        isFavorite: !isFavorite,
      }));
      
      return { previousTour, tourId };
    },
    
    onError: (error, variables, context) => {
      if (context?.previousTour) {
        queryClient.setQueryData(['tour', context.tourId], context.previousTour);
      }
      toast.error(getErrorMessage(error));
    },
  });
};
```

## Redux (Global Client State)

### Store Setup

```tsx
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/store/authSlice';
import uiReducer from './slices/uiSlice';

// Load from localStorage
const loadAuthState = () => {
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
    ui: uiReducer,
  },
  preloadedState: {
    auth: loadAuthState(),
  },
});

// Save to localStorage
store.subscribe(() => {
  try {
    localStorage.setItem('auth', JSON.stringify(store.getState().auth));
  } catch {}
});

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
// features/auth/hooks/useAuth.ts
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCredentials, logout as logoutAction } from '../store/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, tokens } = useAppSelector((state) => state.auth);
  
  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      dispatch(logoutAction());
    }
  };
  
  return { user, isAuthenticated, tokens, logout };
};
```

## Local State

### useState

```tsx
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

## URL State

```tsx
// Using searchParams for filters
import { useSearchParams } from 'react-router-dom';

export const ToursPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const page = parseInt(searchParams.get('page') || '1');
  const city = searchParams.get('city') || '';
  
  const handleFilterChange = (filters: TourFilters) => {
    const params = new URLSearchParams();
    if (filters.city) params.set('city', filters.city);
    params.set('page', '1');
    setSearchParams(params);
  };
  
  const { tours } = useTours({ city, page });
  
  return <div>{/* ... */}</div>;
};
```

## Common Patterns

### Derived State

```tsx
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

### State Lifting

```tsx
// Parent manages state
export const TourSearchPage = () => {
  const [filters, setFilters] = useState<TourFilters>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  return (
    <div>
      <TourFilters value={filters} onChange={setFilters} />
      <TourList
        filters={filters}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
    </div>
  );
};
```

## Anti-Patterns

```tsx
// ❌ Server state in Redux
const toursSlice = { tours: [], isLoading: false };

// ✅ Use React Query
const { tours, isLoading } = useTours();

// ❌ Modal state in Redux
const uiSlice = { isModalOpen: false };

// ✅ Local state
const [isModalOpen, setIsModalOpen] = useState(false);

// ❌ Storing derived data
const [tours, setTours] = useState([]);
const [tourCount, setTourCount] = useState(0);

// ✅ Compute on render
const tourCount = tours.length;
```

---

**Last Updated**: January 2, 2025
