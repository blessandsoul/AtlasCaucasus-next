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

  // Frontend URL for email links
  FRONTEND_URL: z.string().url().optional(),

  // CORS configuration (comma-separated list of allowed origins for production)
  CORS_ORIGINS: z
    .string()
    .optional()
    .transform((val) => val ? val.split(",").map((origin) => origin.trim()) : undefined),

  // Redis
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),

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
