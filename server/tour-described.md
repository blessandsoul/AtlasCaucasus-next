# Tourism Server - Complete System Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture & Design Principles](#architecture--design-principles)
4. [Getting Started](#getting-started)
5. [Database Management](#database-management)
6. [Database Schema](#database-schema)
7. [Project Structure](#project-structure)
8. [Core Systems](#core-systems)
9. [Implemented Features](#implemented-features)
10. [Multi-Role System](#multi-role-system)
11. [Security Implementation](#security-implementation)
12. [API Response Standards](#api-response-standards)
13. [Environment Configuration](#environment-configuration)

---

## 🎯 Project Overview

**Tourism Server** is a production-ready, high-performance RESTful API server designed for the Georgian tourism industry. The server provides a comprehensive backend platform for managing tours, users, companies, guides, drivers, and bookings with enterprise-grade security, scalability, and maintainability.

### Domain Context
- **Primary Market**: Tourism industry in Georgia (country)
- **Target Users**: Travelers, tour operators, guides, drivers, companies
- **Core Entities**: Users, Tours, Companies, Guides, Drivers, Locations
- **Business Goals**: Connect travelers with tourism service providers

---

## 🛠 Technology Stack

### Core Technologies
- **Runtime**: Node.js 20+ (LTS)
- **Framework**: Fastify 5.x (high-performance HTTP framework)
- **Language**: TypeScript (strict mode enabled)
- **Database**: MySQL 8.0 (via Docker)
- **ORM**: Prisma 6.x (type-safe database access)
- **Validation**: Zod (runtime validation and type inference)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: Argon2
- **Logging**: Pino
- **Email**: Nodemailer
- **Background Jobs**: node-cron

### Infrastructure
- **Database**: MySQL 8.0 (Docker container)
- **DB Management**: phpMyAdmin (Docker container) + Prisma Studio
- **Container**: Docker + Docker Compose

---

## 🏗 Architecture & Design Principles

### Layered Architecture
```
Routes → Controllers → Services → Repositories (Prisma) → Database (MySQL)
```

### Key Design Principles
1. **Separation of Concerns**: Controllers handle HTTP, services handle logic, repos handle DB
2. **Type Safety**: TypeScript strict mode, Zod validation, Prisma types
3. **Multi-Role System**: Users can have multiple roles (USER, COMPANY, GUIDE, DRIVER, etc.)
4. **Security First**: JWT auth, Argon2 hashing, rate limiting, email verification

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Docker Desktop
- npm

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start Docker containers (MySQL + phpMyAdmin)
npm run db:up

# 3. Generate Prisma client
npm run prisma:generate

# 4. Push schema to database (first time) or run migrations
npm run prisma:migrate

# 5. Seed the database with Georgian locations
npm run prisma:seed

# 6. Start development server
npm run dev
```

### Access Points
- **API Server**: http://localhost:3000
- **phpMyAdmin**: http://localhost:8080
  - Username: `root`
  - Password: `rootpassword`
- **Prisma Studio**: http://localhost:5555
  - Run: `npm run prisma:studio`

---

## 🔧 Database Management

### Two Ways to Manage Database

#### 1. Prisma (Recommended for Development)
```bash
# Generate Prisma client after schema changes
npm run prisma:generate

# Create and apply migrations (interactive)
npm run prisma:migrate

# Push schema to database (quick, no migration history)
npx prisma db push

# Open Prisma Studio (visual DB browser)
npm run prisma:studio

# Reset database (WARNING: deletes all data)
npm run prisma:reset

# Seed database with initial data
npm run prisma:seed
```

#### 2. phpMyAdmin (For Manual Queries & Data Editing)
- **URL**: http://localhost:8080
- **Server**: mysql (internal Docker network)
- **Username**: root
- **Password**: rootpassword
- **Database**: tourism_db

**phpMyAdmin is useful for:**
- Quick data edits without code changes
- Running ad-hoc SQL queries
- Importing/exporting data
- Viewing table relationships
- Database backups

### Common Commands
```bash
# Start Docker (MySQL + phpMyAdmin)
npm run db:up

# Stop Docker
npm run db:down

# Reset everything (delete all data, recreate)
npm run db:reset
```

---

## 💾 Database Schema

### Models

#### **User**
Main user table supporting travelers, companies, guides, and admins.

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| email | String | Unique email |
| passwordHash | String | Argon2 hash |
| firstName | String | First name |
| lastName | String | Last name |
| isActive | Boolean | Account status |
| tokenVersion | Int | For token invalidation |
| parentCompanyId | String? | Links tour agents to companies |
| emailVerified | Boolean | Email verification status |
| verificationToken | String? | Email verification token |
| resetPasswordToken | String? | Password reset token |
| failedLoginAttempts | Int | Lockout counter |
| lockedUntil | DateTime? | Account lockout time |
| roles | UserRoleAssignment[] | Multi-role support |

#### **UserRoleAssignment** (Junction Table)
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| userId | String | FK to User |
| role | UserRole | USER, COMPANY, TOUR_AGENT, GUIDE, DRIVER, ADMIN |

#### **Company**
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| userId | String (unique) | FK to User |
| companyName | String | Company name |
| registrationNumber | String? | Unique registration |
| isVerified | Boolean | Verification status |

#### **Guide**
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| userId | String (unique) | FK to User |
| bio | String? | Guide biography |
| languages | Json | Language codes array |
| yearsOfExperience | Int? | Experience |
| isVerified | Boolean | Verification status |
| isAvailable | Boolean | Availability |

#### **Driver**
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| userId | String (unique) | FK to User |
| vehicleType | String? | Vehicle type |
| vehicleCapacity | Int? | Passenger capacity |
| licenseNumber | String? | License |
| isVerified | Boolean | Verification status |
| isAvailable | Boolean | Availability |

#### **Location**
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| name | String | Location name |
| region | String? | Georgian region |
| country | String | Default: Georgia |
| latitude | Decimal? | Coordinates |
| longitude | Decimal? | Coordinates |
| isActive | Boolean | Status |

#### **Tour**
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| ownerId | String | FK to User |
| companyId | String? | FK to Company |
| title | String | Tour title |
| price | Decimal | Price |
| currency | String | Default: GEL |
| difficulty | TourDifficulty? | easy, moderate, challenging |
| category | String? | Tour category |
| isActive | Boolean | Status |
| isFeatured | Boolean | Featured flag |

#### **Junction Tables**
- `TourLocation` - Tour to Location (many-to-many)
- `GuideLocation` - Guide to Location (many-to-many)
- `DriverLocation` - Driver to Location (many-to-many)

---

## 📁 Project Structure

```
tourism-server/
├── docker-compose.yml       # MySQL + phpMyAdmin
├── docker/
│   └── init/                # SQL reference files (not used, Prisma manages schema)
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── seed.ts              # Database seeding script
│   └── migrations/          # Migration history
├── package.json
├── src/
│   ├── app.ts               # Fastify app setup
│   ├── server.ts            # Server entry point
│   ├── config/
│   │   └── env.ts           # Environment validation
│   ├── jobs/
│   │   └── sessionCleanup.ts
│   ├── libs/
│   │   ├── prisma.ts        # Prisma client singleton
│   │   ├── email.ts         # Email service
│   │   ├── errors.ts        # Error classes
│   │   ├── logger.ts        # Pino logger
│   │   ├── pagination.ts    # Pagination helpers
│   │   ├── response.ts      # Response helpers
│   │   └── validation.ts    # Validation utils
│   ├── middlewares/
│   │   ├── authGuard.ts     # JWT auth + role checks
│   │   └── requireVerifiedEmail.ts
│   └── modules/
│       ├── auth/            # Authentication
│       ├── health/          # Health checks
│       ├── tours/           # Tour management
│       └── users/           # User management
└── tsconfig.json
```

---

## ⚙️ Core Systems

### Prisma Client (`libs/prisma.ts`)

```typescript
import { prisma } from "../../libs/prisma.js";

// Example usage in repository
const user = await prisma.user.findUnique({
  where: { email },
  include: { roles: true }
});

const tour = await prisma.tour.create({
  data: {
    title: "Tbilisi Walking Tour",
    price: 50,
    ownerId: userId,
  }
});
```

### Response Helpers (`libs/response.ts`)

```typescript
successResponse(message, data)           // Standard success
paginatedResponse(message, items, page, limit, total)  // Paginated
errorResponse(code, message)             // Error response
```

---

## ✅ Implemented Features

### Authentication
- User registration with email verification
- Login with account lockout protection
- JWT access + refresh tokens
- Token rotation
- Logout / Logout all devices
- Password reset via email
- Refresh token reuse detection

### Users
- Profile retrieval
- Profile updates
- Soft delete

### Tours
- CRUD operations
- Owner/admin authorization
- Pagination
- Location associations

### Security
- Rate limiting
- Account lockout (10 failed attempts)
- Email verification
- Password reset
- Security alert emails
- Session tracking (IP, user agent)

---

## 👥 Multi-Role System

### Available Roles

| Role | Description |
|------|-------------|
| USER | Default role for travelers |
| COMPANY | Tour companies (separate dashboard) |
| TOUR_AGENT | Sub-accounts created by companies |
| GUIDE | Tour guides with profiles |
| DRIVER | Drivers with vehicle info |
| ADMIN | Platform administrators |

### Key Features
- Users can have **multiple roles**
- Roles stored in `user_roles` junction table
- Role-specific profiles (Company, Guide, Driver)
- Company hierarchy (TOUR_AGENTs link to parent company)

### Role Checking

```typescript
// In auth middleware
requireRole("ADMIN")                      // Require single role
requireRole(["ADMIN", "COMPANY"])         // Require any of roles
requireAllRoles(["COMPANY", "GUIDE"])     // Require all roles
requireSelfOrAdmin                        // Owner or admin access
```

---

## 🔒 Security Implementation

### Password Security
- Argon2 hashing
- Minimum 8 characters
- Brute force protection (10 attempts = 30min lockout)

### JWT Tokens
- **Access Token**: 15min (configurable), contains userId + roles
- **Refresh Token**: 7 days (configurable), contains userId + sessionId + tokenVersion
- Token version for global invalidation

### Rate Limiting
- Registration: 5 req/15min
- Login: 10 req/15min
- Token refresh: 20 req/15min
- Password reset: 3 req/15min

---

## 📡 API Response Standards

### Success Response
```json
{
  "success": true,
  "message": "Tour created successfully",
  "data": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Tours retrieved",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 50,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required"
  }
}
```

---

## 🔧 Environment Configuration

```env
NODE_ENV=development
PORT=3000

# Prisma Database URL (required)
DATABASE_URL="mysql://tourism_user:tourism_password@localhost:3306/tourism_db"

# JWT (min 32 characters)
ACCESS_TOKEN_SECRET=your-secret-key-here
REFRESH_TOKEN_SECRET=your-refresh-secret-here
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Email (optional in dev)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@tourismgeorgia.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3001
```

---

## 📊 Implementation Status

### ✅ Completed
- [x] Prisma ORM setup with MySQL
- [x] phpMyAdmin + Prisma Studio for DB management
- [x] Multi-role user system
- [x] User authentication (register, login, tokens)
- [x] Email verification & password reset
- [x] Account lockout & security
- [x] Session management
- [x] Tour CRUD
- [x] Company, Guide, Driver profile schemas
- [x] Location entity with 24 Georgian cities
- [x] Junction tables for many-to-many

### 🚧 Next Steps
- [ ] Company module (CRUD, verification)
- [ ] Guide module (CRUD, locations)
- [ ] Driver module (CRUD, locations)
- [ ] Public tour search with filters
- [ ] Tour availability & booking
- [ ] Reviews & ratings
- [ ] File uploads (images)
- [ ] Admin panel endpoints

---

**Last Updated**: December 30, 2024  
**ORM**: Prisma 6.x  
**Database**: MySQL 8.0  
**DB Tools**: phpMyAdmin (localhost:8080) + Prisma Studio (localhost:5555)  
**Status**: Active Development
