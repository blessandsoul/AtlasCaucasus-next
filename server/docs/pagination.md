# Global Pagination System

This document describes the unified pagination system used across all Tourism Server API endpoints.

## Overview

All paginated endpoints follow a consistent structure for input validation, service layer handling, and response formatting.

## Response Format

### Paginated Success Response

```json
{
  "success": true,
  "message": "Tours retrieved successfully",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 237,
      "totalPages": 24,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

### Pagination Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `page` | number | Current page number (1-indexed) |
| `limit` | number | Items per page (1-100) |
| `totalItems` | number | Total count across all pages |
| `totalPages` | number | Total number of pages |
| `hasNextPage` | boolean | Whether there's a next page |
| `hasPreviousPage` | boolean | Whether there's a previous page |

## Query Parameters

All paginated endpoints accept these query parameters:

| Parameter | Type | Default | Min | Max | Description |
|-----------|------|---------|-----|-----|-------------|
| `page` | number | 1 | 1 | ∞ | Page number to retrieve |
| `limit` | number | 10 | 1 | 100 | Items per page |

### Example Request

```
GET /api/v1/tours?page=2&limit=20
```

## Implementation Guide

### 1. Controller Layer

**Responsibilities:**
- Validate pagination parameters using `PaginationSchema`
- Extract `page` and `limit` from validated input
- Call service method with pagination params
- Use `paginatedResponse()` helper to format response

**Example:**

```typescript
import { PaginationSchema } from "../../libs/pagination.js";
import { paginatedResponse } from "../../libs/response.js";

export async function listToursHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Validate pagination params
  const paginationParsed = PaginationSchema.safeParse(request.query);
  if (!paginationParsed.success) {
    throw new ValidationError(paginationParsed.error.errors[0].message);
  }

  const { page, limit } = paginationParsed.data;

  // Call service
  const { items, totalItems } = await tourService.listTours(page, limit);

  // Return paginated response
  return reply.send(
    paginatedResponse("Tours retrieved successfully", items, page, limit, totalItems)
  );
}
```

### 2. Service Layer

**Responsibilities:**
- Accept `page` and `limit` as parameters
- Calculate offset using `calculateOffset(page, limit)`
- Execute main query with LIMIT and OFFSET
- Execute COUNT query with same filters
- Return `{ items, totalItems }`

**Example:**

```typescript
import { calculateOffset, ServicePaginatedResult } from "../../libs/pagination.js";

export async function listTours(
  page: number,
  limit: number
): Promise<ServicePaginatedResult<Tour>> {
  const offset = calculateOffset(page, limit);

  // Main query with pagination
  const items = await prisma.tour.findMany({
    where: { isActive: true },
    skip: offset,
    take: limit,
    orderBy: { createdAt: 'desc' }
  });

  // Count query with same filters
  const totalItems = await prisma.tour.count({
    where: { isActive: true }
  });

  return { items, totalItems };
}
```

### 3. Repository Layer (if using separate repos)

**Responsibilities:**
- Execute database queries
- Apply filters, sorting, LIMIT, and OFFSET
- Return raw results

**Example:**

```typescript
export async function findTours(
  filters: TourFilters,
  limit: number,
  offset: number
): Promise<Tour[]> {
  return prisma.tour.findMany({
    where: filters,
    skip: offset,
    take: limit,
    orderBy: { createdAt: 'desc' }
  });
}

export async function countTours(filters: TourFilters): Promise<number> {
  return prisma.tour.count({ where: filters });
}
```

## Important Rules

### ✅ DO

- Use `PaginationSchema` for validation in controllers
- Use `paginatedResponse()` helper for all paginated responses
- Calculate offset with `calculateOffset(page, limit)`
- Execute separate COUNT query for `totalItems`
- Apply filters/sorting BEFORE pagination
- Return `ServicePaginatedResult<T>` from services

### ❌ DON'T

- Create custom pagination formats
- Skip pagination metadata fields
- Build pagination metadata in services
- Forget the COUNT query
- Use different field names
- Allow `limit` > 100

## Combining with Filters and Sorting

When combining pagination with filters and sorting:

1. **Parse all query params** (filters, sorting, pagination)
2. **Apply filters** to both main query and COUNT query
3. **Apply sorting** to main query only
4. **Apply pagination** (LIMIT/OFFSET) to main query only

**Example:**

```typescript
export async function listToursHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Parse filters
  const filtersParsed = TourFiltersSchema.safeParse(request.query);
  if (!filtersParsed.success) {
    throw new ValidationError(filtersParsed.error.errors[0].message);
  }

  // Parse pagination
  const paginationParsed = PaginationSchema.safeParse(request.query);
  if (!paginationParsed.success) {
    throw new ValidationError(paginationParsed.error.errors[0].message);
  }

  const { page, limit } = paginationParsed.data;
  const filters = filtersParsed.data;

  // Call service with both
  const { items, totalItems } = await tourService.listTours(filters, page, limit);

  return reply.send(
    paginatedResponse("Tours retrieved successfully", items, page, limit, totalItems)
  );
}
```

## Files Reference

| File | Purpose |
|------|---------|
| `src/libs/pagination.ts` | Pagination schema, types, and utilities |
| `src/libs/response.ts` | Response helpers including `paginatedResponse()` |

## Migration Guide

To add pagination to an existing endpoint:

1. **Update Controller:**
   - Add `PaginationSchema` validation
   - Extract `page` and `limit`
   - Change response to use `paginatedResponse()`

2. **Update Service:**
   - Add `page` and `limit` parameters
   - Calculate offset
   - Add LIMIT/OFFSET to query
   - Add COUNT query
   - Return `{ items, totalItems }`

3. **Update Tests:**
   - Test pagination params validation
   - Test page boundaries
   - Test total count accuracy

## Example Endpoints

Current endpoints using pagination:

- `GET /api/v1/me/tours` - List current user's tours
- (More to be added)

---

**Last Updated:** 2025-12-29
