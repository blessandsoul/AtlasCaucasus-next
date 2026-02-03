# ============================================
# Atlas Caucasus - Server Dockerfile
# ============================================

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# CRITICAL: Unset NODE_ENV to ensure devDependencies are installed
# Coolify may set NODE_ENV=production which breaks the build
ENV NODE_ENV=

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

# Health check (force IPv4 with 127.0.0.1 instead of localhost, add Origin header for CORS)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider --header="Origin: http://localhost:8000" http://127.0.0.1:8000/api/v1/health || exit 1

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
