# Tourism Server - Quick Reference for AI Assistants

**Read this first, then dive into specific rule files as needed.**

---

## 🎯 Project Overview

**Tourism API server for Georgia** - High-traffic, production-ready backend for tour operators, hotels, and restaurants.

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Runtime | Node.js 20+ |
| Framework | Fastify |
| Language | TypeScript (strict mode) |
| Database | MySQL |
| ORM | Prisma |
| Cache | Redis |
| Validation | Zod |
| Testing | Jest/Vitest |
| Production | PM2 + Nginx |

---

## 📂 Project Structure

```
src/
├── app.ts                      # Fastify instance + plugins
├── server.ts                   # Server startup (listen)
├── config/                     # Environment, constants
├── libs/                       # Shared utilities (db, logger, auth)
├── middlewares/                # Auth guards, etc.
└── modules/<domain>/           # Domain modules
    ├── <domain>.routes.ts      # Route definitions
    ├── <domain>.controller.ts  # HTTP handlers (no business logic)
    ├── <domain>.service.ts     # Business logic
    ├── <domain>.repo.ts        # Database queries
    ├── <domain>.schemas.ts     # Zod validation schemas
    └── <domain>.types.ts       # TypeScript types (optional)
```

---

## 🚨 CRITICAL: API Response Format

### ✅ Success Response (MANDATORY)
```json
{
  "success": true,
  "message": "Tour created successfully",
  "data": { ... }
}
```

**Rules:**
- Use `successResponse(message, data)` helper
- NEVER return raw data or custom formats

### ❌ Error Response (MANDATORY)
```json
{
  "success": false,
  "error": {
    "code": "TOUR_NOT_FOUND",
    "message": "Tour not found"
  }
}
```

**Rules:**
- Throw typed errors (AppError subclasses)
- NEVER throw raw `Error` or strings
- Global error handler formats all errors

### Allowed Error Types
- `ValidationError` - Invalid input
- `UnauthorizedError` - Not authenticated
- `ForbiddenError` - Not authorized
- `NotFoundError` - Resource not found
- `ConflictError` - Duplicate/conflict
- `BadRequestError` - Bad request
- `InternalError` - Server error

---

## 🏗️ Architecture Layers

```
Request → Routes → Controller → Service → Repository → Database
                      ↓            ↓
                   Validate    Business Logic
```

### Controller Responsibilities
- ✅ Validate input (Zod schemas)
- ✅ Call service methods
- ✅ Return `successResponse()`
- ✅ Throw typed errors
- ❌ NO business logic
- ❌ NO direct DB access
- ❌ NO manual error responses

### Service Responsibilities
- ✅ All business logic
- ✅ Call repositories for DB operations
- ✅ Throw typed AppError instances
- ✅ Return data or throw
- ❌ NO Fastify dependencies (request/reply)
- ❌ NO HTTP concepts
- ❌ NO response formatting

---

## 🔐 Authentication & Authorization

- **JWT tokens**: Access (15m) + Refresh (7d)
- **Roles**: `USER`, `COMPANY`, `ADMIN`
- **Middleware**: `authGuard`, `requireRole()`, `requireSelfOrAdmin`
- **Token storage**: Minimal payload (id, role)

---

## 🗄️ Database Standards

### Naming Conventions
- **Tables**: `snake_case` plural (`users`, `tours`, `tour_availability`)
- **Columns**: `snake_case` (`created_at`, `user_id`, `is_active`)
- **Foreign keys**: `<table_singular>_id` (`user_id`, `company_id`)

### Required Columns (all main tables)
```typescript
id: string (uuid) or bigint
created_at: timestamp (default now)
updated_at: timestamp (auto-update)
```

### Soft Delete
- Use `deleted_at` column (nullable timestamp)
- NEVER physically delete important records

### Migrations
- ALL schema changes via Prisma migrations
- NEVER manual SQL edits
- Document breaking changes

---

## 🛣️ API Routing

### Prefix
- All routes: `/api/v1`

### Domain Routes
```
/api/v1/health          # Health check
/api/v1/auth/*          # Authentication
/api/v1/users/*         # User management
/api/v1/companies/*     # Companies
/api/v1/tours/*         # Tours
/api/v1/hotels/*        # Hotels
/api/v1/restaurants/*   # Restaurants
/api/v1/bookings/*      # Bookings
/api/v1/payments/*      # Payments
```

---

## 🔒 Safe Editing Rules

### DO
- ✅ Keep changes **small and focused**
- ✅ Preserve existing function signatures
- ✅ Preserve existing exports/imports
- ✅ Add TODO comments for ambiguities
- ✅ Extend modules, don't rewrite

### DON'T
- ❌ Delete or restructure large parts of codebase
- ❌ Break existing behavior (auth, bookings, payments)
- ❌ Change function signatures without explicit request
- ❌ Leave half-implemented features
- ❌ Add noisy debug logs

---

## 📝 Code Style

### TypeScript
- Strict mode ON
- Type all function parameters and returns
- Prefer `async/await` over `.then()`

### Exports
- Prefer **named exports**
- Exception: `app.ts` uses default export

### Imports
- Relative imports within module: `./user.service`
- Cross-module: Use configured aliases (if any)

### Logging
- Use `logger` from `src/libs/logger`
- NEVER `console.log` in production code
- Log in error handler, not controllers

---

## 🧪 Testing

- Use Jest or Vitest
- Test core logic: pricing, availability, bookings, payments
- Mock external APIs
- Deterministic tests only

---

## 📦 Package Manager

Detect from lockfile:
- `pnpm-lock.yaml` → use `pnpm`
- `yarn.lock` → use `yarn`
- Otherwise → use `npm`

---

## 🚀 When Implementing Features

1. **Summarize** what needs to be done
2. **List** files to create/modify
3. **Provide** complete code for each file
4. **Mention** migrations or env variables needed
5. **State assumptions** if unsure

---

## 📚 Full Documentation

For detailed rules, see:
- `general-rules.md` - Complete architecture guide
- `project-conventions.md` - Detailed conventions
- `db-and-migrations.md` - Database deep dive
- `response-handling.md` - Complete response contract
- `ai-edit-safety.md` - Safety guidelines

---

**Last Updated**: 2025-12-29
