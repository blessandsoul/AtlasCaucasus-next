import { z } from "zod";

/**
 * Zod schema for validating pagination query parameters
 * Use this in all controllers that support pagination
 */
export const PaginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * Pagination metadata included in all paginated responses
 */
export interface PaginationMetadata {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

/**
 * Structure of paginated data in API responses
 */
export interface PaginatedData<T> {
    items: T[];
    pagination: PaginationMetadata;
}

/**
 * Return type for service layer methods that support pagination
 * Services return items + totalItems, controllers build the full response
 */
export interface ServicePaginatedResult<T> {
    items: T[];
    totalItems: number;
}

/**
 * Input type inferred from PaginationSchema
 */
export type PaginationInput = z.infer<typeof PaginationSchema>;

/**
 * Calculate database offset from page number and limit
 * @param page - Current page number (1-indexed)
 * @param limit - Number of items per page
 * @returns Offset for database query (0-indexed)
 */
export function calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
}

/**
 * Calculate total number of pages
 * @param totalItems - Total count of items
 * @param limit - Number of items per page
 * @returns Total number of pages
 */
export function calculateTotalPages(totalItems: number, limit: number): number {
    return Math.ceil(totalItems / limit);
}

/**
 * Build pagination metadata object
 * @param page - Current page number
 * @param limit - Items per page
 * @param totalItems - Total count of items
 * @returns Complete pagination metadata
 */
export function buildPaginationMetadata(
    page: number,
    limit: number,
    totalItems: number
): PaginationMetadata {
    const totalPages = calculateTotalPages(totalItems, limit);

    return {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    };
}
