import type { SafeMedia } from "../media/media.types.js";

export interface CreateBlogData {
  title: string;
  content: string;
  excerpt?: string | null;
  tags?: string[];
  isPublished?: boolean;
}

export interface UpdateBlogData {
  title?: string;
  content?: string;
  excerpt?: string | null;
  tags?: string[];
  isPublished?: boolean;
}

export interface SafeBlogPost {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  tags: string[];
  isPublished: boolean;
  viewCount: number;
  readingTime: number | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  coverImage?: SafeMedia | null;
}

export interface BlogFilters {
  search?: string;
  tag?: string;
  sortBy?: "newest" | "oldest" | "views";
}
