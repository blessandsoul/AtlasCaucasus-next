import { z } from "zod";
import { ValidationError } from "./errors.js";

/**
 * Strong password validation schema
 * Requirements:
 * - Minimum 8 characters
 * - Maximum 128 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export const strongPasswordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must not exceed 128 characters")
    .refine(
        (password) => /[A-Z]/.test(password),
        "Password must contain at least one uppercase letter"
    )
    .refine(
        (password) => /[a-z]/.test(password),
        "Password must contain at least one lowercase letter"
    )
    .refine(
        (password) => /[0-9]/.test(password),
        "Password must contain at least one number"
    )
    .refine(
        (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
        "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;':\",./<>?)"
    );

/**
 * Email validation schema with proper format checking
 */
export const emailSchema = z
    .string()
    .email("Invalid email format")
    .max(255, "Email must not exceed 255 characters")
    .transform((email) => email.toLowerCase().trim());

/**
 * Name validation schema
 */
export const nameSchema = z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .trim();

/**
 * Verification token schema (for email verification and password reset)
 */
export const tokenSchema = z
    .string()
    .length(64, "Invalid token format");

/**
 * Helper to get all password requirement messages
 */
export const passwordRequirements = [
    "At least 8 characters",
    "At most 128 characters",
    "At least one uppercase letter (A-Z)",
    "At least one lowercase letter (a-z)",
    "At least one number (0-9)",
    "At least one special character (!@#$%^&*)",
];

/**
 * UUID validation schema for route parameters
 * Used to validate :id params across all routes
 */
export const uuidSchema = z
    .string()
    .uuid("Invalid ID format - must be a valid UUID");

/**
 * Common route parameter schemas
 */
export const UuidParamSchema = z.object({
    id: uuidSchema,
});

/**
 * Optional UUID schema (for optional params)
 */
export const optionalUuidSchema = z
    .string()
    .uuid("Invalid ID format - must be a valid UUID")
    .optional();

/**
 * Pagination query schema
 */
export const PaginationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type StrongPassword = z.infer<typeof strongPasswordSchema>;
export type ValidEmail = z.infer<typeof emailSchema>;
export type ValidName = z.infer<typeof nameSchema>;
export type UuidParam = z.infer<typeof UuidParamSchema>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

// ==========================================
// VALIDATION HELPER FUNCTIONS
// ==========================================

/**
 * Validate and return a UUID from route params
 * @throws ValidationError if the ID is not a valid UUID
 */
export function validateUuidParam(id: string): string {
    const result = uuidSchema.safeParse(id);
    if (!result.success) {
        throw new ValidationError("Invalid ID format - must be a valid UUID", "INVALID_UUID");
    }
    return result.data;
}

/**
 * Validate route params containing an ID
 * @throws ValidationError if the ID is not a valid UUID
 */
export function validateIdParams(params: { id: string }): { id: string } {
    const result = UuidParamSchema.safeParse(params);
    if (!result.success) {
        throw new ValidationError(
            result.error.errors[0]?.message || "Invalid ID format",
            "INVALID_UUID"
        );
    }
    return result.data;
}

/**
 * Create a Fastify preValidation hook that validates a part of the request
 * against a Zod schema
 * @param schema - Zod schema to validate against
 * @param source - Which part of the request to validate ("body", "params", "query")
 * @returns Fastify preValidation hook function
 * @throws ValidationError if validation fails
 */
export function validateRequest<T extends z.ZodTypeAny>(
    schema: T,
    source: "body" | "params" | "query" = "body"
) {
    return async (request: any) => {
        const result = schema.safeParse(request[source]);
        if (!result.success) {
            const errorMessage = result.error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join(", ");
            throw new ValidationError(errorMessage, "VALIDATION_FAILED");
        }
        // Replace the request part with validated data
        request[source] = result.data;
    };
}
