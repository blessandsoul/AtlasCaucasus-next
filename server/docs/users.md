# Users API

Base prefix: `/api/v1/users`

All endpoints require auth via:

- `Authorization: Bearer <accessToken>`

## RBAC Rules

- Admin-only:
  - `POST /users`
  - `GET /users`
  - `PATCH /users/:id/role`
- Self-or-admin:
  - `GET /users/:id`
  - `PATCH /users/:id`
  - `DELETE /users/:id`

## POST `/users` (ADMIN only)

Creates a user. Admin can optionally set role.

Body:

```json
{
  "email": "new@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "USER"
}
```

## GET `/users` (ADMIN only)

Lists all non-deleted users.

## GET `/users/:id` (SELF or ADMIN)

Returns the user if:

- requester is `ADMIN`, OR
- requester `id` matches `:id`

## PATCH `/users/:id` (SELF or ADMIN)

- If requester is `ADMIN`: can update `email`, `firstName`, `lastName`, `role`, `isActive`
- If requester is NOT admin: can update only `email`, `firstName`, `lastName`

## PATCH `/users/:id/role` (ADMIN only)

Body:

```json
{
  "role": "COMPANY"
}
```

## DELETE `/users/:id` (SELF or ADMIN)

Soft-deletes the user (sets `deletedAt`).
