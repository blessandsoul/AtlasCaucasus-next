---
trigger: always_on
---

> **SCOPE**: These rules apply specifically to the **client** directory.

# API Integration & Error Handling

## Axios Configuration

```tsx
// lib/api/axios.config.ts
import axios from 'axios';
import { store } from '@/store';
import { logout, updateTokens } from '@/features/auth/store/authSlice';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use((config) => {
  const token = store.getState().auth.tokens?.accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
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
        
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        store.dispatch(updateTokens({ accessToken, refreshToken: newRefreshToken }));
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

## Service Pattern

```tsx
// features/tours/services/tour.service.ts
import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { Tour, CreateTourRequest, UpdateTourRequest } from '../types/tour.types';

class TourService {
  async getTours(params = {}) {
    const response = await apiClient.get(API_ENDPOINTS.TOURS.LIST, { params });
    return response.data.data;
  }
  
  async getTour(id: string) {
    const response = await apiClient.get(API_ENDPOINTS.TOURS.GET(id));
    return response.data.data;
  }
  
  async createTour(data: CreateTourRequest) {
    const response = await apiClient.post(API_ENDPOINTS.TOURS.CREATE, data);
    return response.data.data;
  }
  
  async updateTour(id: string, data: UpdateTourRequest) {
    const response = await apiClient.patch(API_ENDPOINTS.TOURS.UPDATE(id), data);
    return response.data.data;
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
import type { IUser, IAuthTokens, ILoginRequest, IRegisterRequest } from '../types/auth.types';

class AuthService {
  async register(data: IRegisterRequest) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, data);
    return response.data.data;
  }
  
  async login(data: ILoginRequest) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, data);
    return response.data.data;
  }
  
  async logout() {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  }
  
  async refreshToken(refreshToken: string) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken });
    return response.data.data;
  }
  
  async getMe() {
    const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);
    return response.data.data;
  }
  
  async verifyEmail(token: string) {
    await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
  }
  
  async requestPasswordReset(email: string) {
    await apiClient.post(API_ENDPOINTS.AUTH.REQUEST_PASSWORD_RESET, { email });
  }
  
  async resetPassword(token: string, newPassword: string) {
    await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { token, newPassword });
  }
}

export const authService = new AuthService();
```

## Error Handling

```tsx
// lib/utils/error.ts
import { AxiosError } from 'axios';
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

## Error Components

```tsx
// components/common/ErrorMessage.tsx
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getErrorMessage } from '@/lib/utils/error';

export const ErrorMessage = ({ error }) => (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>{getErrorMessage(error)}</AlertDescription>
  </Alert>
);
```

```tsx
// components/common/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <h2 className="mb-2 text-2xl font-bold">Something went wrong</h2>
          <p className="mb-4 text-muted-foreground">
            {this.state.error?.message}
          </p>
          <Button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </Button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

## Loading States

```tsx
// components/common/LoadingSpinner.tsx
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export const LoadingSpinner = ({ size = 'md' }) => {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return <Loader2 className={cn('animate-spin', sizes[size])} />;
};

export const LoadingPage = () => (
  <div className="flex min-h-[400px] items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);
```

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
```

## Toast Notifications

```tsx
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

## File Upload

```tsx
// features/tours/hooks/useUploadImages.ts
export const useUploadImages = () => {
  return useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append('images', file));
      
      const response = await apiClient.post('/tours/upload-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      return response.data.data;
    },
    onSuccess: () => toast.success('Images uploaded'),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
};
```

## Retry Logic

```tsx
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

## Debounced Search

```tsx
// features/tours/hooks/useSearchTours.ts
export const useSearchTours = (initialQuery = '') => {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);
  
  const { data, isLoading } = useQuery({
    queryKey: ['tours', 'search', debouncedQuery],
    queryFn: () => tourService.searchTours(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });
  
  return { query, setQuery, results: data || [], isLoading };
};
```

## Infinite Scroll

```tsx
// features/tours/hooks/useInfiniteTours.ts
export const useInfiniteTours = (filters = {}) => {
  return useInfiniteQuery({
    queryKey: ['tours', 'infinite', filters],
    queryFn: ({ pageParam = 1 }) =>
      tourService.getTours({ ...filters, page: pageParam, limit: 10 }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage ? lastPage.pagination.page + 1 : undefined,
  });
};

// Usage
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteTours();

{data?.pages.map((page) =>
  page.items.map((tour) => <TourCard key={tour.id} tour={tour} />)
)}

{hasNextPage && (
  <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
    Load More
  </Button>
)}
```

---

**Last Updated**: January 2, 2025
