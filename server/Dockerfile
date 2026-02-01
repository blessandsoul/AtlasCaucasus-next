# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev for TypeScript)
RUN npm ci

# Copy source code and config files
COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma

# Generate Prisma client and build TypeScript
RUN npx prisma generate
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy Prisma schema for client
COPY prisma ./prisma

# Regenerate Prisma client in production image
RUN npx prisma generate

# Copy built code from builder stage
COPY --from=builder /app/dist ./dist

# Copy PM2 config
COPY ecosystem.config.cjs ./

# Create logs directory for PM2
RUN mkdir -p logs

EXPOSE 3000

# Use pm2-runtime (designed for Docker containers)
CMD ["npx", "pm2-runtime", "ecosystem.config.cjs"]
