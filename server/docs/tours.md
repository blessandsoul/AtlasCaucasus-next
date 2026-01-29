# Tours API

Base prefix: `/api/v1`

Auth header (for protected endpoints):

- `Authorization: Bearer <accessToken>`

## Data shape: SafeTour

Returned tour objects are in the `SafeTour` shape.

```json
{
  "id": "string",
  "ownerId": "string",
  "title": "string",
  "summary": "string|null",
  "price": "string",
  "currency": "GEL",
  "city": "string|null",
  "durationMinutes": 120,
  "maxPeople": 10,
  "isActive": true,
  "createdAt": "2025-12-12T00:00:00.000Z",
  "updatedAt": "2025-12-12T00:00:00.000Z"
}
```

Notes:

- `price` is returned as a string because Prisma `Decimal` is serialized via `.toString()`.

## POST `/tours` (auth required)

Creates a tour owned by the current user.

Body:

```json
{
  "title": "Kazbegi Day Trip",
  "price": 199.99,
  "summary": "Optional short description",
  "currency": "GEL",
  "city": "Tbilisi",
  "durationMinutes": 480,
  "maxPeople": 12
}
```

Rules:

- `title` and `price` are required.
- `isActive` is not accepted on create (defaults to `true`).

Success `201`:

- `data` is the created `SafeTour`.

Common errors:

- `NO_AUTH_HEADER`, `INVALID_AUTH_FORMAT`, `TOKEN_EXPIRED`, `INVALID_TOKEN`
- `VALIDATION_ERROR`

## GET `/tours/:id` (public)

Gets a single active tour by ID.

Rules:

- If the tour does not exist, returns `TOUR_NOT_FOUND`.
- If the tour exists but `isActive=false`, it is treated as not found for public.

Success `200`:

- `data` is the `SafeTour`.

Common errors:

- `TOUR_NOT_FOUND`

## GET `/me/tours` (auth required)

Lists tours owned by the current authenticated user.

Query params:

- `skip` (optional number, >= 0)
- `take` (optional number, 1..100)
- `includeInactive` (optional boolean)

Example:

`GET /api/v1/me/tours?skip=0&take=20&includeInactive=true`

Success `200`:

- `data` is an array of `SafeTour`.

Common errors:

- `NO_AUTH_HEADER`, `INVALID_AUTH_FORMAT`, `TOKEN_EXPIRED`, `INVALID_TOKEN`
- `VALIDATION_ERROR`

## PATCH `/tours/:id` (auth required; owner or ADMIN)

Updates a tour. Ownership is enforced in the service layer.

Body (all optional):

```json
{
  "title": "Updated title",
  "price": 250,
  "summary": "Updated summary",
  "currency": "GEL",
  "city": "Kutaisi",
  "durationMinutes": 300,
  "maxPeople": 8,
  "isActive": true
}
```

Success `200`:

- `data` is the updated `SafeTour`.

Common errors:

- `NO_AUTH_HEADER`, `INVALID_AUTH_FORMAT`, `TOKEN_EXPIRED`, `INVALID_TOKEN`
- `VALIDATION_ERROR`
- `TOUR_NOT_FOUND`
- `NOT_TOUR_OWNER`

## DELETE `/tours/:id` (auth required; owner or ADMIN)

Soft-deletes a tour by setting `isActive=false`.

Success `200`:

- `data` is the updated `SafeTour` (with `isActive=false`).

Common errors:

- `NO_AUTH_HEADER`, `INVALID_AUTH_FORMAT`, `TOKEN_EXPIRED`, `INVALID_TOKEN`
- `TOUR_NOT_FOUND`
- `NOT_TOUR_OWNER`
