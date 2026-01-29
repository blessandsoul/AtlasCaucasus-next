# Tourism Server - Authentication System Documentation

## 🔐 Overview

The Tourism Server uses a **dual-token JWT authentication system** with session management, providing secure, scalable, and production-ready authentication for a high-traffic tourism API.

---

## 🏗️ Architecture

### **Token Types**

| Token Type | Purpose | Lifespan | Storage | Payload |
|------------|---------|----------|---------|---------|
| **Access Token** | API authentication | 15 minutes | Client memory | `userId`, `role` |
| **Refresh Token** | Token renewal | 7 days | Client storage | `userId`, `sessionId`, `tokenVersion` |

### **Key Components**

```
┌─────────────────────────────────────────────────────────────┐
│                    Authentication Flow                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Client  ──────►  Controller  ──────►  Service  ──────►  DB │
│    │                  │                   │                  │
│    │              Validate            Business           Store│
│    │              Input               Logic            Session│
│    │                  │                   │                  │
│    ◄──────────────────┴───────────────────┴──────────────────┘
│              Return Tokens + User Data                        │
└───────────────────────────────────────────────────────────────┘
```

---

## 🔑 Token System Details

### **Access Token**
- **Algorithm:** HS256 (HMAC with SHA-256)
- **Secret:** `ACCESS_TOKEN_SECRET` (env variable)
- **Expiration:** `15m` (configurable via `ACCESS_TOKEN_EXPIRES_IN`)
- **Payload:**
  ```json
  {
    "userId": "uuid-string",
    "role": "USER | COMPANY | ADMIN"
  }
  ```
- **Purpose:** Authenticate API requests
- **Sent as:** `Authorization: Bearer <token>` header

### **Refresh Token**
- **Algorithm:** HS256 (HMAC with SHA-256)
- **Secret:** `REFRESH_TOKEN_SECRET` (env variable)
- **Expiration:** `7d` (configurable via `REFRESH_TOKEN_EXPIRES_IN`)
- **Payload:**
  ```json
  {
    "userId": "uuid-string",
    "sessionId": "uuid-string",
    "tokenVersion": 0
  }
  ```
- **Purpose:** Obtain new access tokens without re-login
- **Storage:** SHA-256 hash stored in `user_sessions` table
- **Sent as:** Request body `{ "refreshToken": "..." }`

---

## 📊 Database Schema

### **users Table**
```sql
users {
  id: UUID (PK)
  email: VARCHAR (UNIQUE)
  passwordHash: VARCHAR  -- Argon2 hashed
  firstName: VARCHAR
  lastName: VARCHAR
  role: ENUM('USER', 'COMPANY', 'ADMIN')
  isActive: BOOLEAN
  tokenVersion: INT  -- Incremented to invalidate all tokens
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
  deletedAt: TIMESTAMP (nullable)
}
```

### **user_sessions Table**
```sql
user_sessions {
  id: UUID (PK)
  userId: UUID (FK -> users.id)
  refreshTokenHash: VARCHAR  -- SHA-256 hash of refresh token
  expiresAt: TIMESTAMP
  revokedAt: TIMESTAMP (nullable)
  lastUsedAt: TIMESTAMP
  userAgent: VARCHAR (nullable)
  ipAddress: VARCHAR (nullable)
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
```

---

## 🔄 Authentication Flows

### **1. Registration Flow**

```
POST /api/v1/auth/register
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Process:**
1. ✅ Validate input (Zod schema)
2. ✅ Check if email already exists → `ConflictError` if yes
3. ✅ Hash password with **Argon2**
4. ✅ Create user in database (role defaults to `USER`)
5. ✅ Generate access token (15m expiry)
6. ✅ Generate temporary refresh token (random 32 bytes)
7. ✅ Hash refresh token with SHA-256
8. ✅ Create session in `user_sessions` table
9. ✅ Generate final refresh token (JWT with sessionId)
10. ✅ Update session with final token hash
11. ✅ Return user data + both tokens

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "isActive": true,
      "createdAt": "2025-12-29T...",
      "updatedAt": "2025-12-29T..."
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### **2. Login Flow**

```
POST /api/v1/auth/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Process:**
1. ✅ Validate input (Zod schema)
2. ✅ Find user by email → `UnauthorizedError` if not found
3. ✅ Check if user is active → `UnauthorizedError` if disabled
4. ✅ Verify password with **Argon2** → `UnauthorizedError` if invalid
5. ✅ Generate access token
6. ✅ Create new session (same process as registration)
7. ✅ Return user data + both tokens

**Response:** Same as registration

**Security Features:**
- ❌ **Never** reveals if email exists or password is wrong (generic "Invalid credentials")
- ✅ Tracks login metadata (IP address, user agent)
- ✅ Creates separate session for each login

---

### **3. Token Refresh Flow**

```
POST /api/v1/auth/refresh
```

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Process:**
1. ✅ Verify refresh token JWT → `UnauthorizedError` if invalid/expired
2. ✅ Extract `sessionId` and `tokenVersion` from payload
3. ✅ Find active session by ID → `UnauthorizedError` if not found/revoked/expired
4. ✅ Find user by ID → `UnauthorizedError` if not found
5. ✅ Check `tokenVersion` matches → `UnauthorizedError` if mismatched (token revoked)
6. ✅ Generate new access token
7. ✅ Generate new refresh token (with same sessionId)
8. ✅ Update session with new token hash
9. ✅ Return both new tokens

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Security Features:**
- ✅ Refresh token rotation (new token on each refresh)
- ✅ Session validation (checks if session is active and not expired)
- ✅ Token version check (allows global token revocation)

---

### **4. Logout Flow**

```
POST /api/v1/auth/logout
```

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Process:**
1. ✅ Verify refresh token JWT → `UnauthorizedError` if invalid
2. ✅ Extract `sessionId` from payload
3. ✅ Find session by ID → `UnauthorizedError` if not found
4. ✅ Revoke session (set `revokedAt` timestamp)
5. ✅ Return success

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

---

### **5. Logout All Sessions Flow**

```
POST /api/v1/auth/logout-all
Authorization: Bearer <accessToken>
```

**Process:**
1. ✅ Verify access token (via `authGuard` middleware)
2. ✅ Increment user's `tokenVersion` in database
3. ✅ Revoke all active sessions for user
4. ✅ Return count of revoked sessions

**Response:**
```json
{
  "success": true,
  "message": "Logged out from all devices",
  "data": {
    "revokedCount": 3
  }
}
```

**Effect:**
- ✅ All existing refresh tokens become invalid (tokenVersion mismatch)
- ✅ All existing access tokens remain valid until expiry (15m max)
- ✅ User must login again on all devices

---

### **6. Get Current User Flow**

```
GET /api/v1/auth/me
Authorization: Bearer <accessToken>
```

**Process:**
1. ✅ Verify access token (via `authGuard` middleware)
2. ✅ Extract `userId` from token payload
3. ✅ Fetch user from database
4. ✅ Return safe user data (no password hash)

**Response:**
```json
{
  "success": true,
  "message": "Current user retrieved",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "isActive": true,
      "createdAt": "2025-12-29T...",
      "updatedAt": "2025-12-29T..."
    }
  }
}
```

---

## 🛡️ Authorization Middleware

### **1. authGuard**

**Purpose:** Verify access token and attach user to request

**Usage:**
```typescript
fastify.get("/protected", { preHandler: [authGuard] }, handler);
```

**Process:**
1. ✅ Extract `Authorization` header
2. ✅ Validate format: `Bearer <token>`
3. ✅ Verify JWT signature and expiration
4. ✅ Attach user to `request.user` object
5. ✅ Throw `UnauthorizedError` if invalid

**Errors:**
- `NO_AUTH_HEADER` - Missing Authorization header
- `INVALID_AUTH_FORMAT` - Not "Bearer <token>" format
- `TOKEN_EXPIRED` - Token has expired
- `INVALID_TOKEN` - Invalid signature or malformed

---

### **2. requireRole(role)**

**Purpose:** Restrict access to specific roles

**Usage:**
```typescript
// Single role
fastify.get("/admin", 
  { preHandler: [authGuard, requireRole("ADMIN")] }, 
  handler
);

// Multiple roles
fastify.get("/dashboard", 
  { preHandler: [authGuard, requireRole(["ADMIN", "COMPANY"])] }, 
  handler
);
```

**Process:**
1. ✅ Check if `request.user` exists (must use after `authGuard`)
2. ✅ Check if user's role matches allowed roles
3. ✅ Throw `ForbiddenError` if not authorized

**Errors:**
- `AUTH_REQUIRED` - authGuard not applied first
- `INSUFFICIENT_PERMISSIONS` - User role not allowed

---

### **3. requireSelfOrAdmin**

**Purpose:** Allow access if user is admin OR accessing their own resource

**Usage:**
```typescript
fastify.patch("/users/:id", 
  { preHandler: [authGuard, requireSelfOrAdmin] }, 
  handler
);
```

**Process:**
1. ✅ Check if `request.user` exists
2. ✅ Extract `:id` from route params
3. ✅ Check if user is ADMIN OR if `:id` matches `request.user.id`
4. ✅ Throw `ForbiddenError` if neither condition is true

**Errors:**
- `AUTH_REQUIRED` - authGuard not applied first
- `MISSING_RESOURCE_ID` - No :id in route params
- `ACCESS_DENIED` - Not admin and not accessing own resource

---

## 🔒 Security Features

### **Password Security**
- ✅ **Argon2** hashing (industry-standard, memory-hard)
- ✅ Automatic salt generation
- ✅ Passwords never stored in plain text
- ✅ Passwords never returned in API responses

### **Token Security**
- ✅ **JWT** with HMAC-SHA256 signing
- ✅ Short-lived access tokens (15m)
- ✅ Refresh token rotation (new token on each refresh)
- ✅ Refresh token hashing (SHA-256) before storage
- ✅ Session-based refresh tokens (can be revoked)

### **Session Management**
- ✅ Each login creates a separate session
- ✅ Sessions track metadata (IP, user agent)
- ✅ Sessions can be individually revoked
- ✅ All sessions can be revoked at once
- ✅ Expired sessions can be cleaned up

### **Token Revocation**
- ✅ **Per-session revocation:** Logout single device
- ✅ **Global revocation:** Logout all devices (increment `tokenVersion`)
- ✅ **Automatic expiration:** Tokens expire after set time

### **Error Handling**
- ✅ Generic error messages (no information leakage)
- ✅ Consistent error codes for client handling
- ✅ Differentiated token errors (expired vs invalid)

---

## 🎯 User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **USER** | Regular traveler | View tours, create bookings, manage own profile |
| **COMPANY** | Tour operator/hotel/restaurant | Manage own listings, view bookings, respond to inquiries |
| **ADMIN** | System administrator | Full access to all resources, user management |

---

## 📝 Environment Variables

```env
# JWT Secrets (min 32 characters, use strong random strings)
ACCESS_TOKEN_SECRET="your-access-token-secret-min-32-chars"
REFRESH_TOKEN_SECRET="your-refresh-token-secret-min-32-chars"

# Token Expiration (s=seconds, m=minutes, h=hours, d=days)
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"
```

---

## 🔄 Client Implementation Guide

### **1. Initial Login**
```typescript
// Login
const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { data } = await response.json();
// Store tokens
localStorage.setItem('refreshToken', data.refreshToken);
// Keep accessToken in memory (more secure)
let accessToken = data.accessToken;
```

### **2. Making Authenticated Requests**
```typescript
const response = await fetch('/api/v1/protected-endpoint', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

### **3. Handling Token Expiration**
```typescript
// If request fails with TOKEN_EXPIRED
if (error.code === 'TOKEN_EXPIRED') {
  // Refresh token
  const refreshResponse = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      refreshToken: localStorage.getItem('refreshToken') 
    })
  });
  
  const { data } = await refreshResponse.json();
  accessToken = data.accessToken;
  localStorage.setItem('refreshToken', data.refreshToken);
  
  // Retry original request
  return retryRequest();
}
```

### **4. Logout**
```typescript
await fetch('/api/v1/auth/logout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    refreshToken: localStorage.getItem('refreshToken') 
  })
});

localStorage.removeItem('refreshToken');
accessToken = null;
```

---

## 🚨 Common Error Codes

| Code | HTTP Status | Description | Action |
|------|-------------|-------------|--------|
| `EMAIL_EXISTS` | 409 | Email already registered | Use different email |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password | Check credentials |
| `ACCOUNT_DISABLED` | 401 | User account is inactive | Contact support |
| `NO_AUTH_HEADER` | 401 | Missing Authorization header | Add Bearer token |
| `TOKEN_EXPIRED` | 401 | Access token expired | Refresh token |
| `INVALID_TOKEN` | 401 | Malformed or invalid token | Re-login |
| `SESSION_REVOKED` | 401 | Session was logged out | Re-login |
| `TOKEN_REVOKED` | 401 | Token version mismatch | Re-login |
| `INSUFFICIENT_PERMISSIONS` | 403 | User role not allowed | Check permissions |
| `ACCESS_DENIED` | 403 | Not authorized for resource | Check ownership |

---

## 📚 API Endpoints Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/auth/register` | POST | ❌ | Register new user |
| `/api/v1/auth/login` | POST | ❌ | Login with credentials |
| `/api/v1/auth/refresh` | POST | ❌ | Refresh access token |
| `/api/v1/auth/logout` | POST | ❌ | Logout single session |
| `/api/v1/auth/logout-all` | POST | ✅ | Logout all sessions |
| `/api/v1/auth/me` | GET | ✅ | Get current user |

---

## 🎓 Best Practices

### **For Developers**
1. ✅ Always use `authGuard` before role-based guards
2. ✅ Never log or expose JWT secrets
3. ✅ Use environment variables for secrets
4. ✅ Implement token refresh logic in client
5. ✅ Handle token expiration gracefully

### **For Security**
1. ✅ Use HTTPS in production (tokens sent in headers)
2. ✅ Rotate JWT secrets periodically
3. ✅ Implement rate limiting on auth endpoints
4. ✅ Monitor failed login attempts
5. ✅ Clean up expired sessions regularly

### **For Users**
1. ✅ Use strong passwords (min 8 characters)
2. ✅ Logout when done (especially on shared devices)
3. ✅ Use "Logout All" if account compromised
4. ✅ Don't share refresh tokens

---

**Last Updated:** 2025-12-29  
**Version:** 1.0  
**Status:** ✅ Production Ready
