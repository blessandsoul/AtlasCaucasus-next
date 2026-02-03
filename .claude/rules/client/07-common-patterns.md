---
trigger: glob: client/**
---

> **SCOPE**: These rules apply specifically to the **client** directory (Next.js App Router).

# Common Patterns & Utilities

## Custom Hooks

### useAuth Hook

```tsx
'use client';

// features/auth/hooks/useAuth.ts
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { setCredentials, logout as logoutAction } from '../store/authSlice';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, isAuthenticated, tokens } = useAppSelector((state) => state.auth);

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      dispatch(setCredentials(data));
      router.push('/dashboard');
    },
  });

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      dispatch(logoutAction());
      router.push('/login');
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
'use client';

// hooks/useDebounce.ts
import { useState, useEffect } from 'react';

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
'use client';

// hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch {
      // Ignore errors
    }
    setIsHydrated(true);
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue, isHydrated] as const;
};
```

### useMediaQuery Hook

```tsx
'use client';

// hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

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

// Common breakpoints
export const useIsMobile = () => useMediaQuery('(max-width: 768px)');
export const useIsTablet = () => useMediaQuery('(max-width: 1024px)');
```

## Common Components

### Pagination (Client Component)

```tsx
'use client';

// components/common/Pagination.tsx
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback } from 'react';

interface PaginationProps {
  page: number;
  totalPages: number;
}

export const Pagination = ({ page, totalPages }: PaginationProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageUrl = useCallback(
    (pageNumber: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', pageNumber.toString());
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams]
  );

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(createPageUrl(page - 1))}
        disabled={page === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(createPageUrl(page + 1))}
        disabled={page === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
```

### Empty State

```tsx
// components/common/EmptyState.tsx
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export const EmptyState = ({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) => (
  <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
    <FileQuestion className="mb-4 h-16 w-16 text-muted-foreground" />
    <h3 className="mb-2 text-xl font-semibold">{title}</h3>
    <p className="mb-4 text-muted-foreground">{description}</p>
    {actionLabel && actionHref && (
      <Button asChild>
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    )}
  </div>
);
```

### Confirm Dialog

```tsx
'use client';

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

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  isDestructive?: boolean;
}

export const ConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  isDestructive = false,
}: ConfirmDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className={isDestructive ? 'bg-destructive text-destructive-foreground' : ''}
        >
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
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

## Middleware for Auth Protection

```tsx
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/dashboard', '/profile', '/my-tours', '/admin'];
const authPaths = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for auth token in cookies or headers
  const token = request.cookies.get('accessToken')?.value;

  // Redirect to login if accessing protected route without token
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtectedPath && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing auth pages while logged in
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

  if (isAuthPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/my-tours/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
};
```

## Providers Setup

```tsx
'use client';

// app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as ReduxProvider } from 'react-redux';
import { Toaster } from 'sonner';
import { useState } from 'react';
import { store } from '@/store';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </ReduxProvider>
  );
}
```

## Search & Filter Pattern

```tsx
'use client';

// features/tours/components/TourFilters.tsx
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useCallback, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const TourFilters = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    city: searchParams.get('city') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
  });

  const updateUrl = useCallback(
    (newFilters: typeof filters) => {
      const params = new URLSearchParams();

      Object.entries(newFilters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      params.set('page', '1');

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router]
  );

  const handleChange = (field: string, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
  };

  const handleApply = () => {
    updateUrl(filters);
  };

  const handleReset = () => {
    const reset = { search: '', city: '', minPrice: '', maxPrice: '' };
    setFilters(reset);
    updateUrl(reset);
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
      <div className="flex gap-2">
        <Button onClick={handleApply} disabled={isPending}>
          {isPending ? 'Applying...' : 'Apply Filters'}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </div>
  );
};
```

## Table Pattern

```tsx
// features/tours/components/ToursTable.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Tour } from '../types/tour.types';

interface ToursTableProps {
  tours: Tour[];
}

export const ToursTable = ({ tours }: ToursTableProps) => (
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
          <TableCell className="text-right space-x-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/tours/${tour.id}/edit`}>Edit</Link>
            </Button>
            <DeleteTourButton tourId={tour.id} />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);
```

---

**Last Updated**: January 2025
