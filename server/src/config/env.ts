import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(8000),

  // Prisma Database URL
  DATABASE_URL: z.string().min(1),

  // Individual DB variables (for backwards compatibility)
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_NAME: z.string().optional(),

  // JWT configuration
  ACCESS_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),

  // Email configuration (Resend)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Tourism Georgia <noreply@tourism-georgia.com>"),
  ADMIN_EMAIL: z.string().email().optional(), // Admin email for contact form submissions

  // Frontend URL for email links (used for verification, password reset, etc.)
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),

  // CORS configuration (comma-separated list of allowed origins for production)
  CORS_ORIGINS: z
    .string()
    .optional()
    .transform((val) => val ? val.split(",").map((origin) => origin.trim()) : undefined),

  // Redis
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // AI Provider Configuration
  AI_PROVIDER: z.enum(["gemini", "groq", "openrouter"]).default("gemini"),

  // Gemini AI Configuration (used when AI_PROVIDER=gemini)
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),

  // Groq AI Configuration (used when AI_PROVIDER=groq)
  GROQ_API_KEY: z.string().min(1).optional(),
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),

  // OpenRouter AI Configuration (used when AI_PROVIDER=openrouter)
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  OPENROUTER_MODEL: z.string().default("qwen/qwen3-235b-a22b:free"),

  // Shared AI Configuration
  AI_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(10),
  AI_INITIAL_CREDITS: z.coerce.number().int().min(0).default(10),

  // Media Upload Configuration
  MAX_FILE_SIZE: z.coerce.number().int().positive().default(5 * 1024 * 1024), // 5MB default
  ALLOWED_FILE_TYPES: z
    .string()
    .default("image/jpeg,image/png,image/webp,image/gif")
    .transform((val) => val.split(",").map((type) => type.trim())),
  UPLOAD_DIR: z.string().default("uploads"),
  STATIC_URL_PREFIX: z.string().default("/uploads"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.format();
  throw new Error(`Invalid environment variables: ${JSON.stringify(formatted)}`);
}

export const env = parsed.data;
