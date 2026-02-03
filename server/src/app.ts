import Fastify, { FastifyError, FastifyRequest, FastifyReply } from "fastify";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import fastifyWebSocket from "@fastify/websocket";
import fastifyStatic from "@fastify/static";
import fastifyCors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import fastifyCsrf from "@fastify/csrf-protection";
import fastifyMultipart from "@fastify/multipart";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { logger } from "./libs/logger.js";
import { AppError, RateLimitError } from "./libs/errors.js";
import { errorResponse } from "./libs/response.js";
import { env } from "./config/env.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { userRoutes } from "./modules/users/user.routes.js";
import { tourRoutes } from "./modules/tours/tour.routes.js";
import { locationRoutes } from "./modules/locations/location.routes.js";
import { companyRoutes } from "./modules/companies/company.routes.js";
import { guideRoutes } from "./modules/guides/guide.routes.js";
import { driverRoutes } from "./modules/drivers/driver.routes.js";
import { mediaRoutes } from "./modules/media/media.routes.js";
import { websocketRoutes } from "./modules/websocket/websocket.routes.js";
import { presenceRoutes } from "./modules/presence/presence.routes.js";
import { chatRoutes } from "./modules/chat/chat.routes.js";
import { notificationRoutes } from "./modules/notifications/notification.routes.js";
import { inquiryRoutes } from "./modules/inquiries/inquiry.routes.js";
import { searchRoutes } from "./modules/search/search.routes.js";
import { reviewRoutes } from "./modules/reviews/review.routes.js";
import { docsRoutes } from "./modules/docs/docs.routes.js";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function buildApp() {
  const app = Fastify({
    loggerInstance: logger,
  });

  // CORS support
  // In production: use CORS_ORIGINS env var (comma-separated list)
  // In development: allow common dev ports
  const allowedOrigins = env.NODE_ENV === "production" && env.CORS_ORIGINS
    ? env.CORS_ORIGINS
    : [
        "http://localhost:3000",  // Next.js default
        "http://localhost:3001",  // Alternative port
        "http://localhost:5173",  // Vite default
        "http://localhost:8000",  // Server port (for same-origin testing)
      ];

  app.register(fastifyCors, {
    origin: (origin, callback) => {
      // Handle requests with no origin header
      if (!origin) {
        // Allow requests without origin header in all environments
        // This includes: direct browser navigation, curl, Postman, health checks
        // Safe because we protect state-changing operations with CSRF tokens
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In development, log rejected origins for debugging
      if (env.NODE_ENV !== "production") {
        logger.warn({ origin }, "CORS: Origin not allowed");
      }

      return callback(new Error("CORS: Origin not allowed"), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-CSRF-Token'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
  });

  // Cookie support (required for CSRF protection)
  app.register(fastifyCookie, {
    secret: env.ACCESS_TOKEN_SECRET, // Use access token secret for cookie signing
    parseOptions: {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
    },
  });

  // CSRF protection for state-changing requests
  // Client must send X-CSRF-Token header with value from /api/v1/auth/csrf-token endpoint
  app.register(fastifyCsrf, {
    sessionPlugin: "@fastify/cookie",
    cookieOpts: {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    },
    getToken: (request: FastifyRequest) => {
      // Accept CSRF token from X-CSRF-Token header
      return request.headers["x-csrf-token"] as string;
    },
  });

  // Security headers with Helmet
  app.register(helmet, {
    // Minimal CSP for API server
    // Even though APIs primarily return JSON, CSP provides defense-in-depth
    // against XSS if any endpoint accidentally returns HTML
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],          // Block everything by default
        frameAncestors: ["'none'"],      // Prevent clickjacking (X-Frame-Options replacement)
        baseUri: ["'none'"],             // Prevent base tag injection
        formAction: ["'none'"],          // Prevent form submissions (API doesn't serve forms)
        // For static file serving (test.html, uploads)
        scriptSrc: ["'self'"],           // Allow scripts only from same origin
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow styles for test.html
        imgSrc: ["'self'", "data:", "blob:"],    // Allow images from self, data URIs, blobs
        connectSrc: ["'self'"],          // Allow fetch/XHR to same origin
      },
    },
    crossOriginEmbedderPolicy: false, // API doesn't need this
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resource loading for uploaded images
  });

  // Serve static files from public directory
  app.register(fastifyStatic, {
    root: join(__dirname, "..", "public"),
    prefix: "/", // Serve at root level
    setHeaders: (res, path) => {
      // Disable caching for test.html to ensure changes are always visible
      if (path.endsWith('test.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  });

  // Serve uploaded media files from uploads directory
  app.register(fastifyStatic, {
    root: join(__dirname, "..", env.UPLOAD_DIR),
    prefix: env.STATIC_URL_PREFIX,
    decorateReply: false, // Don't decorate reply (already decorated by public static)
    setHeaders: (res) => {
      // Cache uploaded images for 1 year (immutable files with UUID names)
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  });

  // Multipart form data support (for file uploads)
  app.register(fastifyMultipart, {
    limits: {
      fileSize: env.MAX_FILE_SIZE,
      files: 10, // Max 10 files per request
      fields: 10, // Max 10 non-file fields
    },
    attachFieldsToBody: false, // Don't auto-parse fields to body
  });

  // Rate limiting plugin (configure per-route limits in route files)
  app.register(rateLimit, {
    global: false, // We apply limits per-route
    max: 100, // Default fallback
    timeWindow: "1 minute",
    onExceeded: function (_request, _key) {
      throw new RateLimitError(
        "Too many requests. Please try again later."
      );
    },
  });

  // WebSocket support
  app.register(fastifyWebSocket);

  // Global error handler
  app.setErrorHandler((error: FastifyError | AppError, request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof AppError) {
      logger.warn({ err: error, requestId: request.id }, error.message);
      return reply.status(error.statusCode).send(errorResponse(error.code, error.message));
    }

    // Handle Fastify built-in errors with user-friendly messages
    if ('code' in error && typeof error.code === 'string') {
      const fastifyErrorMap: Record<string, { statusCode: number; message: string }> = {
        FST_REQ_FILE_TOO_LARGE: {
          statusCode: 413,
          message: `File too large. Maximum size is ${Math.round(env.MAX_FILE_SIZE / 1024 / 1024)}MB`
        },
        FST_PARTS_LIMIT: {
          statusCode: 400,
          message: 'Too many parts in multipart request'
        },
        FST_FILES_LIMIT: {
          statusCode: 400,
          message: 'Too many files uploaded. Maximum is 10 files'
        },
        FST_FIELDS_LIMIT: {
          statusCode: 400,
          message: 'Too many form fields'
        },
        FST_PROTO_VIOLATION: {
          statusCode: 400,
          message: 'Invalid request format'
        },
        FST_INVALID_MULTIPART_CONTENT_TYPE: {
          statusCode: 400,
          message: 'Invalid content type for file upload'
        },
      };

      const mappedError = fastifyErrorMap[error.code];
      if (mappedError) {
        logger.warn({ err: error, requestId: request.id }, mappedError.message);
        return reply.status(mappedError.statusCode).send(errorResponse(error.code, mappedError.message));
      }
    }

    // Unexpected errors - log full details, return generic message
    logger.error({ err: error, requestId: request.id }, "Unhandled error");
    return reply.status(500).send(errorResponse("INTERNAL_ERROR", "An unexpected error occurred"));
  });

  // Register REST API routes
  app.register(healthRoutes, { prefix: "/api/v1" });
  app.register(docsRoutes, { prefix: "/api/v1" });
  app.register(authRoutes, { prefix: "/api/v1" });
  app.register(userRoutes, { prefix: "/api/v1" });
  app.register(tourRoutes, { prefix: "/api/v1" });
  app.register(locationRoutes, { prefix: "/api/v1" });
  app.register(companyRoutes, { prefix: "/api/v1" });
  app.register(guideRoutes, { prefix: "/api/v1" });
  app.register(driverRoutes, { prefix: "/api/v1" });
  app.register(mediaRoutes, { prefix: "/api/v1" });
  app.register(presenceRoutes, { prefix: "/api/v1" });
  app.register(chatRoutes, { prefix: "/api/v1" });
  app.register(notificationRoutes, { prefix: "/api/v1" });
  app.register(inquiryRoutes, { prefix: "/api/v1" });
  app.register(searchRoutes, { prefix: "/api/v1" });
  app.register(reviewRoutes, { prefix: "/api/v1" });

  // Register WebSocket routes (no prefix - available at /ws)
  app.register(websocketRoutes);

  return app;
}

export default buildApp;
