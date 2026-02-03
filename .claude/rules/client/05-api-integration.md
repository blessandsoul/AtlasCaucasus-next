---
trigger: glob: client/**
---

> **SCOPE**: These rules apply specifically to the **client** directory (Next.js App Router).

# API Integration & Error Handling

## Data Fetching Strategies

### Server-Side Fetching (Preferred)

In Next.js App Router, prefer fetching data in Server Components:

```tsx
// app/tours/page.tsx (Server Component)
import { tourService } from '@/features/tours/services/tour.service';

export default async function ToursPage() {
  const { items: tours, pagination } = await tourService.getTours();

  return (
    <div>
      <TourList tours={tours} />
      <Pagination {...pagination} />
    </div>
  );
}
```

### Client-Side Fetching (When Needed)

Use React Query for client-side fetching when:
- Data needs to be refetched on user action
- Real-time updates are needed
- Optimistic updates are required

## Axios Configuration

```tsx
// lib/api/axios.config.ts
import axios from 'axios';
import { store } from '@/store';
import { logout, updateTokens } from '@/features/auth/store/authSlice';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use((config) => {
  // Only add token on client-side
  if (typeof window !== 'undefined') {
    const token = store.getState().auth.tokens?.accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = store.getState().auth.tokens?.refreshToken;
        if (!refreshToken) {
          store.dispatch(logout());
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;

        store.dispatch(
          updateTokens({ accessToken, refreshToken: newRefreshToken })
        );

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        store.dispatch(logout());
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

## Server-Side Fetch Utility

For Server Components, create a fetch wrapper:

```tsx
// lib/api/server-fetch.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function serverFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    // Next.js specific caching options
    next: {
      revalidate: 60, // Revalidate every 60 seconds
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

// Usage in Server Component
const tours = await serverFetch<Tour[]>('/tours');
```

## Service Pattern

```tsx
// features/tours/services/tour.service.ts
import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type {
  Tour,
  CreateTourRequest,
  UpdateTourRequest,
  TourFilters,
} from '../types/tour.types';
import type { PaginatedApiResponse } from '@/lib/api/api.types';

class TourService {
  async getTours(params: TourFilters & { page?: number; limit?: number } = {}) {
    const response = await apiClient.get<PaginatedApiResponse<Tour>>(
      API_ENDPOINTS.TOURS.LIST,
      { params }
    );
    return response.data.data;
  }

  async getTour(id: string) {
    const response = await apiClient.get(API_ENDPOINTS.TOURS.GET(id));
    return response.data.data as Tour;
  }

  async createTour(data: CreateTourRequest) {
    const response = await apiClient.post(API_ENDPOINTS.TOURS.CREATE, data);
    return response.data.data as Tour;
  }

  async updateTour(id: string, data: UpdateTourRequest) {
    const response = await apiClient.patch(API_ENDPOINTS.TOURS.UPDATE(id), data);
    return response.data.data as Tour;
  }

  async deleteTour(id: string) {
    await apiClient.delete(API_ENDPOINTS.TOURS.DELETE(id));
  }
}

export const tourService = new TourService();
```

## Auth Service

```tsx
// features/auth/services/auth.service.ts
import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type {
  IUser,
  IAuthTokens,
  ILoginRequest,
  IRegisterRequest,
} from '../types/auth.types';

class AuthService {
  async register(data: IRegisterRequest) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, data);
    return response.data.data as { user: IUser; tokens: IAuthTokens };
  }

  async login(data: ILoginRequest) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, data);
    return response.data.data as { user: IUser; tokens: IAuthTokens };
  }

  async logout() {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  }

  async refreshToken(refreshToken: string) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, {
      refreshToken,
    });
    return response.data.data as IAuthTokens;
  }

  async getMe() {
    const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);
    return response.data.data as IUser;
  }

  async verifyEmail(token: string) {
    await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
  }

  async requestPasswordReset(email: string) {
    await apiClient.post(API_ENDPOINTS.AUTH.REQUEST_PASSWORD_RESET, { email });
  }

  async resetPassword(token: string, newPassword: string) {
    await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      token,
      newPassword,
    });
  }
}

export const authService = new AuthService();
```

## Error Handling

```tsx
// lib/utils/error.ts
import axios from 'axios';
import type { ApiError } from '@/lib/api/api.types';

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError;
    if (apiError?.error?.message) {
      return apiError.error.message;
    }
    if (error.code === 'ERR_NETWORK') {
      return 'Network error. Check your connection.';
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

export const getErrorCode = (error: unknown): string | undefined => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.code;
  }
  return undefined;
};

export const isErrorCode = (error: unknown, code: string): boolean => {
  return getErrorCode(error) === code;
};
```

## Next.js Error Handling

### Error Boundary (error.tsx)

```tsx
'use client';

// app/tours/error.tsx
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function ToursError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error('Tours error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
      <h2 className="mb-2 text-2xl font-bold">Something went wrong!</h2>
      <p className="mb-4 text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
```

### Not Found (not-found.tsx)

```tsx
// app/tours/[id]/not-found.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TourNotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
      <h2 className="mb-2 text-2xl font-bold">Tour Not Found</h2>
      <p className="mb-4 text-muted-foreground">
        The tour you're looking for doesn't exist.
      </p>
      <Button asChild>
        <Link href="/tours">Browse Tours</Link>
      </Button>
    </div>
  );
}
```

## Loading States

### Loading File (loading.tsx)

```tsx
// app/tours/loading.tsx
import { Loader2 } from 'lucide-react';

export default function ToursLoading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
```

### Skeleton Components

```tsx
// components/common/TourCardSkeleton.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const TourCardSkeleton = () => (
  <Card>
    <Skeleton className="h-48 w-full" />
    <CardHeader>
      <Skeleton className="h-6 w-3/4" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-20 w-full" />
    </CardContent>
  </Card>
);

export const TourListSkeleton = () => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <TourCardSkeleton key={i} />
    ))}
  </div>
);
```

## Toast Notifications

```tsx
'use client';

// Using sonner
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils/error';

// Success
toast.success('Tour created!');

// Error
toast.error(getErrorMessage(error));

// Loading
const toastId = toast.loading('Creating...');
toast.success('Created!', { id: toastId });

// With action
toast.error('Failed to delete', {
  action: {
    label: 'Retry',
    onClick: () => handleRetry(),
  },
});
```

## Server Actions for Mutations

```tsx
// features/tours/actions/tour.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { tourService } from '../services/tour.service';
import { getErrorMessage } from '@/lib/utils/error';

export async function createTour(formData: FormData) {
  try {
    const tour = await tourService.createTour({
      title: formData.get('title') as string,
      price: Number(formData.get('price')),
      city: formData.get('city') as string,
    });

    revalidatePath('/tours');
    redirect(`/tours/${tour.id}`);
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function deleteTour(id: string) {
  try {
    await tourService.deleteTour(id);
    revalidatePath('/tours');
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}
```

## Retry Logic (Client-Side)

```tsx
'use client';

export const useTourWithRetry = (id: string) => {
  return useQuery({
    queryKey: ['tour', id],
    queryFn: () => tourService.getTour(id),
    retry: (failureCount, error) => {
      // Don't retry on 404
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
```

## Caching Strategies

### Next.js Cache Options

```tsx
// Server Component with revalidation
async function getTours() {
  const res = await fetch(`${API_BASE_URL}/tours`, {
    next: { revalidate: 60 }, // Revalidate every 60 seconds
  });
  return res.json();
}

// No caching (always fresh)
async function getUserData() {
  const res = await fetch(`${API_BASE_URL}/users/me`, {
    cache: 'no-store',
  });
  return res.json();
}

// Force cache (static)
async function getLocations() {
  const res = await fetch(`${API_BASE_URL}/locations`, {
    cache: 'force-cache',
  });
  return res.json();
}
```

### On-Demand Revalidation

```tsx
// features/tours/actions/revalidate.ts
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

export async function revalidateTours() {
  revalidatePath('/tours');
}

export async function revalidateTour(id: string) {
  revalidatePath(`/tours/${id}`);
  revalidateTag(`tour-${id}`);
}
```

---

**Last Updated**: January 2025
