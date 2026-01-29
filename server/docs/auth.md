# Auth API

Base prefix: `/api/v1/auth`

## Session-Based Authentication

This API uses **per-device sessions** for refresh tokens. Each login creates a new session stored in the database, allowing:

- **Multi-device support**: Users can be logged in on multiple devices simultaneously.
- **Per-device logout**: Logging out only invalidates the current device's session.
- **Logout all devices**: A separate endpoint to revoke all sessions at once.
- **Refresh token rotation**: Each refresh request issues a new refresh token (old one becomes invalid).
- **Global revoke (tokenVersion)**: For emergencies (password reset, compromise), incrementing `tokenVersion` invalidates ALL refresh tokens instantly.

### How it works

1. **Login/Register** → creates a `UserSession` row in DB, issues `accessToken` + `refreshToken`
2. **Refresh** → verifies session is active + `tokenVersion` matches → rotates refresh token, updates session
3. **Logout** → revokes only the current session (marks `revokedAt`)
4. **Logout All** → increments `tokenVersion` + revokes all sessions for the user

### Token structure

- **Access token** (short-lived, e.g. 15m): `{ userId, role }`
- **Refresh token** (long-lived, e.g. 7d): `{ userId, sessionId, tokenVersion }`

---

## POST `/register`

Creates a new user and session. Role is always `USER`.

Body:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

Success `201`:

- `data.user` is a sanitized user (no password hash)
- `data.accessToken` is the short-lived JWT
- `data.refreshToken` is the long-lived JWT (tied to a new session)

Common errors:

- `VALIDATION_ERROR`
- `EMAIL_EXISTS`

---

## POST `/login`

Creates a new session for the user. Does **not** invalidate other sessions.

Body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Success `200`:

- `data.user`, `data.accessToken`, `data.refreshToken`

Common errors:

- `INVALID_CREDENTIALS` (generic; does not reveal whether email exists)
- `ACCOUNT_DISABLED`

---

## POST `/refresh`

Exchanges a valid refresh token for new tokens. **Rotates the refresh token** (old one becomes invalid).

Body:

```json
{
  "refreshToken": "<refreshToken>"
}
```

Success `200`:

- `data.accessToken` (new)
- `data.refreshToken` (new, rotated)

Common errors:

- `INVALID_REFRESH_TOKEN` – JWT signature invalid or expired
- `SESSION_REVOKED` – session was revoked or expired
- `TOKEN_REVOKED` – `tokenVersion` mismatch (global revoke happened)
- `USER_NOT_FOUND`

---

## POST `/logout`

Revokes **only the current session** (the one associated with the provided refresh token).

Body:

```json
{
  "refreshToken": "<refreshToken>"
}
```

Success `200`:

- `data: null`

Common errors:

- `INVALID_REFRESH_TOKEN`
- `SESSION_NOT_FOUND`

---

## POST `/logout-all`

Revokes **all sessions** for the authenticated user and increments `tokenVersion`.

Headers:

- `Authorization: Bearer <accessToken>`

Body: _(none required)_

Success `200`:

- `data.revokedCount` – number of sessions revoked

Notes:

- Requires authentication (access token).
- After this, **all** refresh tokens for the user become invalid.
- Use this for "log out from all devices" or after password change.

---

## GET `/me`

Returns the currently authenticated user.

Headers:

- `Authorization: Bearer <accessToken>`

Success `200`:

- `data.user` – sanitized user object

Common errors:

- `NO_AUTH_HEADER`
- `INVALID_AUTH_FORMAT`
- `TOKEN_EXPIRED`
- `INVALID_TOKEN`
