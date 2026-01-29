import { PaginatedData, buildPaginationMetadata } from "./pagination.js";

export interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface PaginatedSuccessResponse<T> {
  success: true;
  message: string;
  data: PaginatedData<T>;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export function successResponse<T>(message: string, data: T): SuccessResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

/**
 * Create a paginated success response
 * Use this helper in all controllers that return paginated data
 * 
 * @param message - Human-readable success message
 * @param items - Array of items for current page
 * @param page - Current page number (1-indexed)
 * @param limit - Number of items per page
 * @param totalItems - Total count of items across all pages
 * @returns Formatted paginated response with metadata
 */
export function paginatedResponse<T>(
  message: string,
  items: T[],
  page: number,
  limit: number,
  totalItems: number
): PaginatedSuccessResponse<T> {
  const pagination = buildPaginationMetadata(page, limit, totalItems);

  return {
    success: true,
    message,
    data: {
      items,
      pagination,
    },
  };
}

export function errorResponse(code: string, message: string): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}
