import { z } from "zod";

export const createBlogSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(255, "Title must be at most 255 characters"),
  content: z
    .string()
    .min(1, "Content is required"),
  excerpt: z
    .string()
    .max(500, "Excerpt must be at most 500 characters")
    .optional(),
  tags: z
    .array(z.string().max(50, "Tag must be at most 50 characters"))
    .max(10, "Maximum 10 tags")
    .optional(),
  isPublished: z.boolean().optional(),
});

export const updateBlogSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(255, "Title must be at most 255 characters")
    .optional(),
  content: z
    .string()
    .min(1, "Content is required")
    .optional(),
  excerpt: z
    .string()
    .max(500, "Excerpt must be at most 500 characters")
    .nullable()
    .optional(),
  tags: z
    .array(z.string().max(50, "Tag must be at most 50 characters"))
    .max(10, "Maximum 10 tags")
    .optional(),
  isPublished: z.boolean().optional(),
});

export const listBlogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().max(200).optional(),
  tag: z.string().max(50).optional(),
  sortBy: z.enum(["newest", "oldest", "views"]).optional(),
});

export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;
export type ListBlogsQuery = z.infer<typeof listBlogsQuerySchema>;
