# AI Prompt Template - Tourism Server Authentication

Use this template when asking AI to work with the Tourism Server authentication system.

---

## 📋 Quick Reference Prompt

```
I'm working on the Tourism Server API (Node.js + Fastify + TypeScript + MySQL + Prisma).

### Authentication System:
- **Dual-token JWT**: Access token (15m) + Refresh token (7d)
- **Password hashing**: Argon2
- **Token storage**: Refresh tokens hashed (SHA-256) in `user_sessions` table
- **Roles**: USER, COMPANY, ADMIN
- **Session management**: Each login creates a session, can be revoked individually or globally

### Key Components:
1. **Access Token Payload**: `{ userId, role }`
2. **Refresh Token Payload**: `{ userId, sessionId, tokenVersion }`
3. **Middleware**: `authGuard`, `requireRole(role)`, `requireSelfOrAdmin`

### Endpoints:
- POST `/api/v1/auth/register` - Register (returns user + tokens)
- POST `/api/v1/auth/login` - Login (returns user + tokens)
- POST `/api/v1/auth/refresh` - Refresh tokens (requires refreshToken)
- POST `/api/v1/auth/logout` - Logout single session
- POST `/api/v1/auth/logout-all` - Logout all sessions (requires auth)
- GET `/api/v1/auth/me` - Get current user (requires auth)

### Response Format (MANDATORY):
Success:
{
  "success": true,
  "message": "...",
  "data": { ... }
}

Error:
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}

### Architecture:
Routes → Controllers → Services → Repositories → DB

[YOUR SPECIFIC REQUEST HERE]
```

---

## 🎯 Example Prompts

### Example 1: Add Password Reset
```
I'm working on the Tourism Server API (Node.js + Fastify + TypeScript + MySQL + Prisma).

[Include Quick Reference above]

Task: Implement password reset functionality

Requirements:
1. POST /api/v1/auth/forgot-password - Send reset email
2. POST /api/v1/auth/reset-password - Reset with token
3. Use same response format as existing auth endpoints
4. Generate secure reset token (expires in 1 hour)
5. Store token hash in database
6. Follow existing architecture (routes → controller → service → repo)

Please provide:
- Database migration for reset tokens
- Service layer logic
- Controller handlers
- Route definitions
- Zod schemas for validation
```

### Example 2: Add OAuth (Google)
```
I'm working on the Tourism Server API (Node.js + Fastify + TypeScript + MySQL + Prisma).

[Include Quick Reference above]

Task: Add Google OAuth authentication

Requirements:
1. GET /api/v1/auth/google - Redirect to Google
2. GET /api/v1/auth/google/callback - Handle callback
3. Create user if doesn't exist, login if exists
4. Return same tokens as regular login
5. Store OAuth provider info in database

Please provide:
- Database schema changes
- OAuth service implementation
- Integration with existing session system
- Environment variables needed
```

### Example 3: Add Two-Factor Authentication
```
I'm working on the Tourism Server API (Node.js + Fastify + TypeScript + MySQL + Prisma).

[Include Quick Reference above]

Task: Add optional 2FA (TOTP) for users

Requirements:
1. POST /api/v1/auth/2fa/enable - Enable 2FA (requires auth)
2. POST /api/v1/auth/2fa/verify - Verify TOTP code
3. POST /api/v1/auth/2fa/disable - Disable 2FA (requires auth)
4. Modify login flow to require 2FA code if enabled
5. Store 2FA secret encrypted in database

Please provide:
- Database schema for 2FA
- Service layer with TOTP generation/verification
- Updated login flow
- QR code generation for setup
```

### Example 4: Add API Keys
```
I'm working on the Tourism Server API (Node.js + Fastify + TypeScript + MySQL + Prisma).

[Include Quick Reference above]

Task: Add API key authentication for third-party integrations

Requirements:
1. POST /api/v1/api-keys - Create API key (requires auth, COMPANY/ADMIN only)
2. GET /api/v1/api-keys - List user's API keys
3. DELETE /api/v1/api-keys/:id - Revoke API key
4. Add middleware to authenticate via API key (X-API-Key header)
5. API keys should have scopes/permissions

Please provide:
- Database schema for API keys
- API key generation (secure random)
- Middleware for API key authentication
- Service layer for CRUD operations
```

### Example 5: Add Email Verification
```
I'm working on the Tourism Server API (Node.js + Fastify + TypeScript + MySQL + Prisma).

[Include Quick Reference above]

Task: Add email verification for new registrations

Requirements:
1. Modify registration to send verification email
2. POST /api/v1/auth/verify-email - Verify email with token
3. POST /api/v1/auth/resend-verification - Resend verification email
4. Block certain actions until email is verified
5. Verification token expires in 24 hours

Please provide:
- Database schema changes (emailVerified, verificationToken)
- Email sending service integration
- Verification logic
- Middleware to check email verification
```

---

## 🔧 Customization Tips

### When asking for new features:
1. ✅ **Always include** the Quick Reference section
2. ✅ **Specify** which endpoints to create
3. ✅ **Mention** database changes needed
4. ✅ **Request** all layers (routes, controller, service, repo)
5. ✅ **Emphasize** following existing patterns

### When asking for modifications:
1. ✅ **Reference** existing files/functions
2. ✅ **Specify** what to preserve
3. ✅ **Mention** backward compatibility needs
4. ✅ **Request** migration scripts if needed

### When asking for debugging:
1. ✅ **Include** error messages
2. ✅ **Mention** which endpoint/flow
3. ✅ **Describe** expected vs actual behavior
4. ✅ **Reference** relevant code sections

---

## 📚 Key Files Reference

For AI to understand the codebase structure:

```
src/
├── modules/
│   └── auth/
│       ├── auth.routes.ts       # Route definitions
│       ├── auth.controller.ts   # HTTP handlers
│       ├── auth.service.ts      # Business logic
│       ├── auth.schemas.ts      # Zod validation
│       ├── auth.types.ts        # TypeScript types
│       └── session.repo.ts      # Session DB operations
├── middlewares/
│   └── authGuard.ts             # Auth middleware
├── libs/
│   ├── errors.ts                # Custom error classes
│   ├── response.ts              # Response helpers
│   └── prisma.ts                # Prisma client
└── config/
    └── env.ts                   # Environment config
```

---

## 🎓 Best Practices for AI Prompts

1. ✅ **Be specific** about what you want
2. ✅ **Include context** (tech stack, existing patterns)
3. ✅ **Request examples** if needed
4. ✅ **Ask for tests** for critical features
5. ✅ **Mention security** considerations
6. ✅ **Request documentation** updates
7. ✅ **Specify error handling** requirements

---

**Last Updated:** 2025-12-29
