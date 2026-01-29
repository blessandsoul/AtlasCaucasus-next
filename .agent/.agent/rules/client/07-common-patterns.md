---
trigger: always_on
---

> **SCOPE**: These rules apply specifically to the **client** directory.

# Common Patterns & Utilities

## Custom Hooks

### useAuth Hook

```tsx
// features/auth/hooks/useAuth.ts
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { setCredentials, logout as logoutAction } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, tokens } = useAppSelector((state) => state.auth);
  
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      dispatch(setCredentials(data));
      navigate('/dashboard');
    },
  });
  
  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      dispatch(logoutAction());
      navigate('/login');
    }
  };
  
  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    logout,
    isLoggingIn: loginMutation.isPending,
  };
};
```

### useDebounce Hook

```tsx
// hooks/useDebounce.ts
export const useDebounce = <T,>(value: T, delay = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
};
```

### useLocalStorage Hook

```tsx
// hooks/useLocalStorage.ts
export const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });
  
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };
  
  return [storedValue, setValue] as const;
};
```

### useMediaQuery Hook

```tsx
// hooks/useMediaQuery.ts
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);
  
  return matches;
};
```

## Common Components

### Pagination

```tsx
// components/common/Pagination.tsx
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ page, totalPages, onChange }) => (
  <div className="flex items-center justify-center gap-2">
    <Button
      variant="outline"
      size="sm"
      onClick={() => onChange(page - 1)}
      disabled={page === 1}
    >
      <ChevronLeft className="h-4 w-4" />
    </Button>
    <span className="text-sm">Page {page} of {totalPages}</span>
    <Button
      variant="outline"
      size="sm"
      onClick={() => onChange(page + 1)}
      disabled={page === totalPages}
    >
      <ChevronRight className="h-4 w-4" />
    </Button>
  </div>
);
```

### Empty State

```tsx
// components/common/EmptyState.tsx
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const EmptyState = ({ title, description, actionLabel, onAction }) => (
  <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
    <FileQuestion className="mb-4 h-16 w-16 text-muted-foreground" />
    <h3 className="mb-2 text-xl font-semibold">{title}</h3>
    <p className="mb-4 text-muted-foreground">{description}</p>
    {actionLabel && onAction && (
      <Button onClick={onAction}>{actionLabel}</Button>
    )}
  </div>
);
```

### Confirm Dialog

```tsx
// components/common/ConfirmDialog.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const ConfirmDialog = ({ open, onOpenChange, onConfirm, title, description }) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
```

### Protected Route

```tsx
// components/common/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';

export const ProtectedRoute = ({ children, requireVerified = false, allowedRoles }) => {
  const location = useLocation();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (requireVerified && !user?.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};
```

## Utility Functions

### Format Utils

```tsx
// lib/utils/format.ts

export const formatCurrency = (amount: number, currency = 'GEL') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatRelativeTime = (date: string | Date) => {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = (then.getTime() - now.getTime()) / 1000;
  
  const units: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
  ];
  
  for (const { unit, seconds } of units) {
    if (Math.abs(diffInSeconds) >= seconds) {
      return rtf.format(Math.round(diffInSeconds / seconds), unit);
    }
  }
  return rtf.format(Math.round(diffInSeconds), 'second');
};

export const truncate = (str: string, length: number) => {
  return str.length > length ? `${str.substring(0, length)}...` : str;
};
```

## Router & App Setup

### Router Configuration

```tsx
// app/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'tours', element: <ToursPage /> },
      { path: 'tours/:id', element: <TourDetailsPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      {
        path: 'dashboard',
        element: <ProtectedRoute requireVerified><DashboardPage /></ProtectedRoute>,
      },
    ],
  },
]);
```

### Providers Setup

```tsx
// app/providers.tsx
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { store } from '@/store';
import { queryClient } from '@/lib/api/query-client';

export const Providers = ({ children }) => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" />
    </QueryClientProvider>
  </Provider>
);
```

### Main Entry Point

```tsx
// main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Providers } from './app/providers';
import { router } from './app/router';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>
);
```

## Search & Filter Pattern

```tsx
// features/tours/components/TourFilters.tsx
export const TourFilters = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    search: '',
    city: '',
    minPrice: '',
    maxPrice: '',
  });
  
  const handleChange = (field: string, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  const handleReset = () => {
    const reset = { search: '', city: '', minPrice: '', maxPrice: '' };
    setFilters(reset);
    onFilterChange(reset);
  };
  
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Input
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => handleChange('search', e.target.value)}
        />
        <Input
          placeholder="City"
          value={filters.city}
          onChange={(e) => handleChange('city', e.target.value)}
        />
        <Input
          type="number"
          placeholder="Min Price"
          value={filters.minPrice}
          onChange={(e) => handleChange('minPrice', e.target.value)}
        />
        <Input
          type="number"
          placeholder="Max Price"
          value={filters.maxPrice}
          onChange={(e) => handleChange('maxPrice', e.target.value)}
        />
      </div>
      <Button variant="outline" onClick={handleReset}>Reset</Button>
    </div>
  );
};
```

## Table Pattern

```tsx
// features/tours/components/ToursTable.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const ToursTable = ({ tours, onEdit, onDelete }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Title</TableHead>
        <TableHead>City</TableHead>
        <TableHead>Price</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {tours.map((tour) => (
        <TableRow key={tour.id}>
          <TableCell className="font-medium">{tour.title}</TableCell>
          <TableCell>{tour.city || '-'}</TableCell>
          <TableCell>{tour.price} GEL</TableCell>
          <TableCell className="text-right">
            <Button size="sm" variant="outline" onClick={() => onEdit(tour.id)}>
              Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onDelete(tour.id)}>
              Delete
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);
```

---

**Last Updated**: January 2, 2025
