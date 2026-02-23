import { z } from "zod";

// Safe URL schema: only allow http:// and https:// protocols
const safeUrlSchema = (label: string) =>
    z.string()
        .url(`Invalid ${label}`)
        .max(512, `${label} is too long`)
        .refine(
            (url) => /^https?:\/\//i.test(url),
            `${label} must start with http:// or https://`
        );

// Update company schema
export const updateCompanySchema = z.object({
    companyName: z.string().min(2, "Company name must be at least 2 characters").max(255).optional(),
    description: z.string().max(2000).optional(),
    registrationNumber: z.string().max(100).optional(),
    logoUrl: safeUrlSchema("logo URL").optional(),
    websiteUrl: safeUrlSchema("website URL").optional(),
    phoneNumber: z.string().max(20).optional(),
    isVerified: z.boolean().optional(), // Admin only
});

// Query/filter schema for listing companies (public endpoint)
// Note: isVerified is NOT exposed — public users always see only verified companies
export const companyQuerySchema = z.object({
    search: z.string().max(200).optional(),
    locationId: z.string().uuid().optional(),
    hasActiveTours: z.coerce.boolean().optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    sortBy: z.enum(['newest', 'rating', 'name']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CompanyQueryInput = z.infer<typeof companyQuerySchema>;
