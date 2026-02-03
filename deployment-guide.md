# Coolify Deployment Guide - Atlas Caucasus

Complete step-by-step guide for deploying the Atlas Caucasus tourism platform to Coolify.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Step 1: Create Project in Coolify](#step-1-create-project-in-coolify)
- [Step 2: Deploy MySQL Database](#step-2-deploy-mysql-database)
- [Step 3: Deploy Redis](#step-3-deploy-redis)
- [Step 4: Deploy Server (Fastify API)](#step-4-deploy-server-fastify-api)
- [Step 5: Deploy Client (Next.js)](#step-5-deploy-client-nextjs)
- [Step 6: Database Migrations & Seeding](#step-6-database-migrations--seeding)
- [Step 7: DNS Configuration](#step-7-dns-configuration)
- [Step 8: Post-Deployment Checklist](#step-8-post-deployment-checklist)
- [Troubleshooting](#troubleshooting)

---

## Overview

### Services to Deploy

| Service | Technology | Port | Purpose |
|---------|------------|------|---------|
| Database | MySQL 8.0 | 3306 | Primary data storage |
| Cache | Redis 7 | 6379 | Caching, sessions, rate limiting |
| Server | Fastify (Node.js) | 8000 | REST API backend |
| Client | Next.js | 3000 | Frontend application |

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Coolify                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   MySQL     │  │   Redis     │  │      Server         │  │
│  │   :3306     │◄─┤   :6379     │◄─┤   (Fastify)         │  │
│  │  (internal) │  │  (internal) │  │      :8000          │  │
│  └─────────────┘  └─────────────┘  └──────────┬──────────┘  │
│                                                │              │
│  ┌─────────────────────────────────────────────┴───────────┐ │
│  │                      Client (Next.js)                    │ │
│  │                          :3000                           │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    External Traffic (HTTPS)
         api.yourdomain.com  ←→  yourdomain.com
```

---

## Prerequisites

Before starting, ensure you have:

- [ ] Coolify instance running and accessible
- [ ] Domain name configured (e.g., `atlascaucasus.com`)
- [ ] GitHub/GitLab repository with your code
- [ ] Resend API key for emails (https://resend.com)
- [ ] Access to DNS management for your domain

---

## Step 1: Create Project in Coolify

1. Log into your Coolify dashboard
2. Click **"+ New Resource"** → **"Project"**
3. **Name**: `atlas-caucasus`
4. **Description**: Tourism platform for Georgia
5. Click **Create**

### Create Environment

1. Inside the project, create an environment:
   - **Production**: For live deployment
   - **Staging** (optional): For testing

---

## Step 2: Deploy MySQL Database

### 2.1 Add MySQL Service

1. In your project/environment, click **"+ New Resource"**
2. Select **"Database"** → **"MySQL"**
3. Configure:

| Setting | Value |
|---------|-------|
| Version | `8.0` or `8.4` |
| Database Name | `tourism_db` |
| Username | `tourism_user` |
| Password | *Generate strong password* |
| Root Password | *Generate separately* |

4. Click **Deploy**

### 2.2 Save Connection Details

After deployment, note the internal connection details:

```
Host: mysql-XXXXX (Coolify's internal hostname)
Port: 3306
Database: tourism_db
Username: tourism_user
Password: [your generated password]
```

**Connection String Format:**
```
mysql://tourism_user:PASSWORD@mysql-XXXXX:3306/tourism_db
```

> ⚠️ **Important**: The hostname (`mysql-XXXXX`) is Coolify's internal Docker network name. Find it in the service details.

### 2.3 MySQL Configuration (Optional)

For better performance, you can add custom MySQL configuration:

```ini
[mysqld]
max_connections=100
innodb_buffer_pool_size=256M
```

---

## Step 3: Deploy Redis

### 3.1 Add Redis Service

1. Click **"+ New Resource"** → **"Database"** → **"Redis"**
2. Configure:

| Setting | Value |
|---------|-------|
| Version | `7` (or latest) |
| Password | *Generate password (recommended)* |

3. Click **Deploy**

### 3.2 Save Connection Details

```
Host: redis-XXXXX (Coolify's internal hostname)
Port: 6379
Password: [your generated password, if set]
```

---

## Step 4: Deploy Server (Fastify API)

### 4.1 Create Server Dockerfile

Create the file `server/Dockerfile`:

```dockerfile
# ============================================
# Atlas Caucasus - Server Dockerfile
# ============================================

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ============================================
# Production stage
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy Prisma schema and generated client from builder
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built application
COPY --from=builder /app/dist ./dist

# Create necessary directories
RUN mkdir -p uploads logs
RUN chown -R fastify:nodejs /app

# Switch to non-root user
USER fastify

# Environment
ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/api/v1/health || exit 1

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
```

### 4.2 Add .dockerignore for Server

Create `server/.dockerignore`:

```
node_modules
dist
.env
.env.*
*.log
logs/
uploads/
.git
.gitignore
README.md
*.md
.vscode
.idea
coverage
.nyc_output
```

### 4.3 Add Server Application in Coolify

1. Click **"+ New Resource"** → **"Application"**
2. Select **"Git Repository"** (Public or Private)
3. Connect your GitHub/GitLab account if not already
4. Select your repository

### 4.4 Configure Build Settings

| Setting | Value |
|---------|-------|
| Branch | `main` |
| Build Pack | `Dockerfile` |
| Dockerfile Location | `server/Dockerfile` |
| Base Directory | `server` |
| Port Exposes | `8000` |

### 4.5 Configure Environment Variables

Add these environment variables in Coolify:

```env
# ===========================================
# Server Environment Variables
# ===========================================

NODE_ENV=production
PORT=8000

# Database (use Coolify's internal MySQL hostname)
DATABASE_URL=mysql://tourism_user:YOUR_DB_PASSWORD@mysql-XXXXX:3306/tourism_db

# Redis (use Coolify's internal Redis hostname)
REDIS_HOST=redis-XXXXX
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD

# JWT Secrets (MUST be unique, random, 64+ characters)
# Generate with: openssl rand -base64 64
ACCESS_TOKEN_SECRET=your-64-char-random-string-generate-with-openssl-rand-base64-64
REFRESH_TOKEN_SECRET=another-64-char-random-string-generate-with-openssl-rand-base64-64

# Token Expiration
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Email Configuration (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=Atlas Caucasus <noreply@yourdomain.com>

# Frontend URL (your deployed client URL - for email links)
FRONTEND_URL=https://atlascaucasus.yourdomain.com

# Media Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,image/gif
UPLOAD_DIR=uploads
STATIC_URL_PREFIX=/uploads
```

> 🔐 **Security Tip**: Generate secure JWT secrets:
> ```bash
> openssl rand -base64 64
> ```

### 4.6 Configure Domain

1. Go to **"Settings"** → **"Domains"**
2. Add domain: `api.atlascaucasus.yourdomain.com`
3. Enable **HTTPS** (Let's Encrypt will auto-provision)

### 4.7 Configure Persistent Storage

For file uploads to persist across deployments:

1. Go to **"Settings"** → **"Storages"**
2. Click **"+ Add"**
3. Configure:

| Setting | Value |
|---------|-------|
| Name | `server-uploads` |
| Mount Path | `/app/uploads` |

### 4.8 Deploy Server

Click **"Deploy"** and monitor the build logs.

---

## Step 5: Deploy Client (Next.js)

### 5.1 Update next.config.js

Ensure your `client/next.config.js` has standalone output:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // If you have images from external domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.atlascaucasus.yourdomain.com',
        pathname: '/uploads/**',
      },
    ],
  },
}

module.exports = nextConfig
```

### 5.2 Create Client Dockerfile

Create the file `client/Dockerfile`:

```dockerfile
# ============================================
# Atlas Caucasus - Client Dockerfile
# ============================================

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables (NEXT_PUBLIC_*)
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_WS_URL

# Set environment variables for build time
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

# Build Next.js application
RUN npm run build

# ============================================
# Production stage
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

CMD ["node", "server.js"]
```

### 5.3 Add .dockerignore for Client

Create `client/.dockerignore`:

```
node_modules
.next
.env
.env.*
*.log
.git
.gitignore
README.md
*.md
.vscode
.idea
coverage
```

### 5.4 Add Client Application in Coolify

1. Click **"+ New Resource"** → **"Application"**
2. Select **"Git Repository"**
3. Select the same repository

### 5.5 Configure Build Settings

| Setting | Value |
|---------|-------|
| Branch | `main` |
| Build Pack | `Dockerfile` |
| Dockerfile Location | `client/Dockerfile` |
| Base Directory | `client` |
| Port Exposes | `3000` |

### 5.6 Configure Build Arguments

In Coolify, add these as **Build Arguments** (not environment variables):

```env
NEXT_PUBLIC_API_BASE_URL=https://api.atlascaucasus.yourdomain.com/api/v1
NEXT_PUBLIC_APP_NAME=Atlas Caucasus
NEXT_PUBLIC_WS_URL=wss://api.atlascaucasus.yourdomain.com
```

> ⚠️ **Important**: Next.js `NEXT_PUBLIC_*` variables are embedded at **build time**, so they must be build arguments, not runtime environment variables.

### 5.7 Configure Domain

1. Go to **"Settings"** → **"Domains"**
2. Add domain: `atlascaucasus.yourdomain.com`
3. Enable **HTTPS**

### 5.8 Deploy Client

Click **"Deploy"** and monitor the build logs.

---

## Step 6: Database Migrations & Seeding

### 6.1 Automatic Migrations

The server Dockerfile includes automatic migration on startup:
```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
```

### 6.2 Manual Migration (First Time or Troubleshooting)

**Option A: Coolify Terminal**

1. Go to your Server application in Coolify
2. Click **"Terminal"** or **"Execute Command"**
3. Run:

```bash
# Apply migrations
npx prisma migrate deploy

# Seed database (optional - for initial data)
npx prisma db seed
```

**Option B: Local Connection**

If you need to run migrations from your local machine:

1. Temporarily expose MySQL port in Coolify (not recommended for production)
2. Or use SSH tunnel to Coolify server
3. Run with production DATABASE_URL:

```bash
DATABASE_URL="mysql://tourism_user:PASSWORD@coolify-server:3306/tourism_db" \
  npx prisma migrate deploy
```

### 6.3 Verify Database

Connect to check tables were created:

```bash
# In Coolify terminal for MySQL
mysql -u tourism_user -p tourism_db -e "SHOW TABLES;"
```

---

## Step 7: DNS Configuration

### 7.1 Required DNS Records

Add these DNS records pointing to your Coolify server IP:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `atlascaucasus` | `YOUR_COOLIFY_IP` | 3600 |
| A | `api.atlascaucasus` | `YOUR_COOLIFY_IP` | 3600 |

Or if using a subdomain:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `YOUR_COOLIFY_IP` | 3600 |
| A | `api` | `YOUR_COOLIFY_IP` | 3600 |

### 7.2 Using Cloudflare (Optional)

If using Cloudflare as DNS proxy:

1. Set records to **Proxied** (orange cloud)
2. In Coolify, the SSL will still work (Cloudflare handles external SSL)
3. Enable **Full (strict)** SSL mode in Cloudflare

### 7.3 Verify DNS Propagation

```bash
# Check DNS resolution
dig atlascaucasus.yourdomain.com
dig api.atlascaucasus.yourdomain.com

# Or use online tool
# https://dnschecker.org
```

---

## Step 8: Post-Deployment Checklist

### 8.1 Verify All Services Running

In Coolify dashboard, confirm all services show **"Running"**:

- [ ] MySQL - Running
- [ ] Redis - Running
- [ ] Server - Running
- [ ] Client - Running

### 8.2 Test API Health

```bash
# Health check endpoint
curl https://api.atlascaucasus.yourdomain.com/api/v1/health

# Expected response:
# {"success":true,"message":"OK","data":{"status":"healthy"}}
```

### 8.3 Test Client

1. Open `https://atlascaucasus.yourdomain.com` in browser
2. Verify page loads without errors
3. Check browser console for any API errors

### 8.4 Test Authentication Flow

1. Try registering a new account
2. Check email delivery (verification email)
3. Try logging in

### 8.5 Test File Uploads

1. Create a test tour with images
2. Verify images are uploaded and served correctly
3. Verify uploads persist after redeployment

### 8.6 Monitor Logs

In Coolify, check logs for each service:

```bash
# Server logs - look for:
# - Successful database connection
# - Successful Redis connection
# - Server listening on port 8000

# Client logs - look for:
# - Successful build
# - Server started on port 3000
```

---

## Troubleshooting

### Database Connection Failed

**Symptoms:**
- Server fails to start
- "Connection refused" or "ECONNREFUSED" errors

**Solutions:**

1. **Verify hostname**: Check Coolify's MySQL service for the correct internal hostname
2. **Check credentials**: Ensure DATABASE_URL password matches MySQL password
3. **Network**: Ensure both services are in the same Coolify project/network
4. **MySQL running**: Verify MySQL service is actually running in Coolify

```bash
# Test connection from server container
nc -zv mysql-XXXXX 3306
```

### Redis Connection Failed

**Symptoms:**
- Rate limiting not working
- Session errors

**Solutions:**

1. Verify Redis hostname in REDIS_HOST
2. Check if Redis password is required and set correctly
3. Ensure Redis service is running

### Prisma Migration Failed

**Symptoms:**
- Server container exits immediately
- "Migration failed" in logs

**Solutions:**

1. Check DATABASE_URL is correct
2. Run migrations manually via Coolify terminal
3. Check for pending migrations: `npx prisma migrate status`
4. If stuck, reset migrations (⚠️ data loss): `npx prisma migrate reset`

### Client Shows API Errors

**Symptoms:**
- Network errors in browser console
- "Failed to fetch" errors

**Solutions:**

1. **CORS**: Ensure server allows client domain in CORS config
2. **URL**: Verify NEXT_PUBLIC_API_BASE_URL is correct (with `/api/v1`)
3. **HTTPS**: Both client and API must use HTTPS in production
4. **Rebuild**: Client needs rebuild if NEXT_PUBLIC_* vars changed

### File Uploads Not Working

**Symptoms:**
- Upload fails
- Images not displaying
- Files disappear after redeploy

**Solutions:**

1. **Permissions**: Ensure upload directory is writable
2. **Persistent storage**: Verify volume is mounted at `/app/uploads`
3. **Static serving**: Check STATIC_URL_PREFIX configuration
4. **File size**: Check MAX_FILE_SIZE limit

### SSL Certificate Issues

**Symptoms:**
- Browser shows "Not Secure"
- Certificate errors

**Solutions:**

1. Wait for Let's Encrypt provisioning (can take a few minutes)
2. Verify domain points to Coolify server
3. Check Coolify logs for certificate errors
4. Try forcing certificate renewal in Coolify

### Container Keeps Restarting

**Symptoms:**
- Service status fluctuates
- "Restarting" status in Coolify

**Solutions:**

1. Check container logs for crash reason
2. Verify all required environment variables are set
3. Check memory limits (increase if OOM kills)
4. Verify health check endpoint is responding

---

## Environment Variables Reference

### Server (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `8000` |
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@host:3306/db` |
| `REDIS_HOST` | Redis hostname | `redis-xxxxx` |
| `REDIS_PORT` | Redis port | `6379` |
| `ACCESS_TOKEN_SECRET` | JWT access secret (64+ chars) | Random string |
| `REFRESH_TOKEN_SECRET` | JWT refresh secret (64+ chars) | Random string |
| `RESEND_API_KEY` | Resend email API key | `re_xxxxx` |
| `EMAIL_FROM` | Sender email | `Name <email@domain>` |
| `FRONTEND_URL` | Client URL for emails | `https://yourdomain.com` |

### Server (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_PASSWORD` | Redis password | Empty |
| `ACCESS_TOKEN_EXPIRES_IN` | Access token TTL | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token TTL | `7d` |
| `MAX_FILE_SIZE` | Upload size limit (bytes) | `5242880` |
| `ALLOWED_FILE_TYPES` | Allowed MIME types | `image/jpeg,image/png,image/webp,image/gif` |
| `UPLOAD_DIR` | Upload directory | `uploads` |

### Client (Build Arguments)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | API base URL | `https://api.domain.com/api/v1` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `Atlas Caucasus` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `wss://api.domain.com` |

---

## Maintenance

### Updating the Application

1. Push changes to your Git repository
2. In Coolify, click **"Redeploy"** for the service
3. Or enable **Auto Deploy** on push

### Database Backups

Set up automated backups in Coolify:

1. Go to MySQL service → **"Backups"**
2. Configure backup schedule
3. Set retention policy
4. Optionally configure S3/external storage

### Viewing Logs

```bash
# In Coolify dashboard, or via SSH:
docker logs <container-id> -f --tail 100
```

### Scaling (Future)

Coolify supports horizontal scaling:

1. Increase **"Instances"** for server
2. Add load balancer in front
3. Ensure session storage uses Redis (not memory)

---

## Security Recommendations

1. **Secrets**: Never commit `.env` files; use Coolify's secret management
2. **Database**: Keep MySQL internal-only (no external port exposure)
3. **Updates**: Regularly update base images and dependencies
4. **Backups**: Enable automated database backups
5. **Monitoring**: Set up alerts for service failures
6. **Rate Limiting**: Already configured in server; tune as needed
7. **HTTPS**: Always enforce HTTPS in production

---

## Support

- **Coolify Documentation**: https://coolify.io/docs
- **Prisma Documentation**: https://www.prisma.io/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment

---

*Last Updated: February 2025*
