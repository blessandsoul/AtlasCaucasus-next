import { z } from "zod";
import { SearchCategory, SortBy } from "./search.types.js";

/**
 * Schema for main search query parameters
 */
export const SearchQuerySchema = z.object({
    locationId: z.string().uuid().optional(),
    category: z.nativeEnum(SearchCategory).default(SearchCategory.ALL),
    query: z.string().max(200).optional(), // Text search
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    verified: z
        .enum(["true", "false"])
        .transform((val) => val === "true")
        .optional(),
    available: z
        .enum(["true", "false"])
        .transform((val) => val === "true")
        .optional(),
    sortBy: z.nativeEnum(SortBy).default(SortBy.RELEVANCE),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type SearchQueryInput = z.infer<typeof SearchQuerySchema>;

/**
 * Schema for location autocomplete search
 */
export const LocationSearchSchema = z.object({
    query: z.string().min(1).max(100),
    limit: z.coerce.number().int().min(1).max(20).default(10),
});

export type LocationSearchInput = z.infer<typeof LocationSearchSchema>;
