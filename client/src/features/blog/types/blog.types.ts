export interface BlogPost {
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
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  coverImage?: BlogImage | null;
}

export interface BlogImage {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  entityType: string;
  entityId: string;
  uploadedBy: string | null;
  createdAt: string;
}

export interface CreateBlogInput {
  title: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  isPublished?: boolean;
}

export interface UpdateBlogInput {
  title?: string;
  content?: string;
  excerpt?: string | null;
  tags?: string[];
  isPublished?: boolean;
}

export interface BlogsResponse {
  items: BlogPost[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface BlogFilters {
  search?: string;
  tag?: string;
  sortBy?: 'newest' | 'oldest' | 'views';
  page?: number;
  limit?: number;
}

export interface MyBlogsParams {
  page?: number;
  limit?: number;
}
