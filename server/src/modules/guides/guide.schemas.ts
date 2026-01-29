import { z } from "zod";

// Update guide schema
export const updateGuideSchema = z.object({
    bio: z.string().max(2000).optional(),
    languages: z.array(z.string().min(2).max(10)).optional(),
    yearsOfExperience: z.number().int().min(0).max(70).optional(),
    photoUrl: z.string().url("Invalid photo URL").max(512).optional(),
    phoneNumber: z.string().max(20).optional(),
    isVerified: z.boolean().optional(), // Admin only
    isAvailable: z.boolean().optional(),
    locationIds: z.array(z.string().uuid()).optional(),
});

// Query/filter schema for listing guides
export const guideQuerySchema = z.object({
    locationId: z.string().uuid().optional(),
    language: z.string().optional(),
    isVerified: z.coerce.boolean().optional(),
    isAvailable: z.coerce.boolean().optional(),
    minExperience: z.coerce.number().int().min(0).optional(),
    search: z.string().max(200).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sortBy: z.enum(['newest', 'rating', 'experience', 'price', 'price_desc']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type UpdateGuideInput = z.infer<typeof updateGuideSchema>;
export type GuideQueryInput = z.infer<typeof guideQuerySchema>;
