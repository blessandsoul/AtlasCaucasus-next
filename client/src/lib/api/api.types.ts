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

// Pagination metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
