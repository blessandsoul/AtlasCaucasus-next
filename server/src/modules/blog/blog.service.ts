import type { JwtUser } from "../auth/auth.types.js";
import type { SafeBlogPost, CreateBlogData, UpdateBlogData, BlogFilters } from "./blog.types.js";
import {
  createBlogPost,
  getBlogPostById,
  getBlogPostBySlug,
  listPublishedBlogPosts,
  countPublishedBlogPosts,
  listBlogPostsByAuthor,
  countBlogPostsByAuthor,
  updateBlogPost,
  hardDeleteBlogPost,
  incrementViewCount,
  listRelatedBlogPosts,
} from "./blog.repo.js";
import { NotFoundError, ForbiddenError } from "../../libs/errors.js";
import { deleteAllMediaForEntity } from "../media/media.service.js";
import { cacheGet, cacheSet, cacheDelete, cacheDeletePattern } from "../../libs/cache.js";

function assertAdminRole(currentUser: JwtUser): void {
  if (!currentUser.roles.includes("ADMIN")) {
    throw new ForbiddenError(
      "Only administrators can manage blog posts",
      "ADMIN_REQUIRED"
    );
  }
}

// ==========================================
// ADMIN OPERATIONS
// ==========================================

export async function createBlogForAdmin(
  currentUser: JwtUser,
  data: CreateBlogData
): Promise<SafeBlogPost> {
  assertAdminRole(currentUser);
  const post = await createBlogPost(currentUser.id, data);

  // Invalidate list caches
  cacheDeletePattern("blog:list:*").catch(() => {});

  return post;
}

export async function updateBlogForAdmin(
  currentUser: JwtUser,
  id: string,
  data: UpdateBlogData
): Promise<SafeBlogPost> {
  assertAdminRole(currentUser);

  const existing = await getBlogPostById(id);
  if (!existing) {
    throw new NotFoundError("Blog post not found", "BLOG_NOT_FOUND");
  }

  // If publishing for the first time, set publishedAt
  const shouldSetPublishedAt = data.isPublished && !existing.publishedAt;

  const updated = await updateBlogPost(id, data, shouldSetPublishedAt);
  if (!updated) {
    throw new NotFoundError("Blog post not found", "BLOG_NOT_FOUND");
  }

  // Invalidate caches
  cacheDelete(`blog:detail:${id}`).catch(() => {});
  if (existing.slug) cacheDelete(`blog:detail:${existing.slug}`).catch(() => {});
  cacheDeletePattern("blog:list:*").catch(() => {});

  return updated;
}

export async function deleteBlogForAdmin(
  currentUser: JwtUser,
  id: string
): Promise<SafeBlogPost> {
  assertAdminRole(currentUser);

  const existing = await getBlogPostById(id);
  if (!existing) {
    throw new NotFoundError("Blog post not found", "BLOG_NOT_FOUND");
  }

  // Clean up associated media
  await deleteAllMediaForEntity("blog", id);

  const deleted = await hardDeleteBlogPost(id);
  if (!deleted) {
    throw new NotFoundError("Blog post not found", "BLOG_NOT_FOUND");
  }

  // Invalidate caches
  cacheDelete(`blog:detail:${id}`).catch(() => {});
  if (existing.slug) cacheDelete(`blog:detail:${existing.slug}`).catch(() => {});
  cacheDeletePattern("blog:list:*").catch(() => {});

  return deleted;
}

// ==========================================
// ADMIN LISTING (includes drafts)
// ==========================================

export async function listMyBlogs(
  currentUser: JwtUser,
  page: number,
  limit: number
): Promise<{ items: SafeBlogPost[]; totalItems: number }> {
  assertAdminRole(currentUser);

  const offset = (page - 1) * limit;
  const items = await listBlogPostsByAuthor(currentUser.id, offset, limit);
  const totalItems = await countBlogPostsByAuthor(currentUser.id);

  return { items, totalItems };
}

// ==========================================
// PUBLIC OPERATIONS
// ==========================================

export async function getBlogByIdOrSlugPublic(
  idOrSlug: string
): Promise<SafeBlogPost | null> {
  const cacheKey = `blog:detail:${idOrSlug}`;

  // Try cache first
  const cached = await cacheGet<SafeBlogPost>(cacheKey);
  if (cached) {
    // Still increment view count even on cache hit
    incrementViewCount(cached.id);
    return cached;
  }

  // Try slug first (more common for public access)
  let post = await getBlogPostBySlug(idOrSlug);

  // Fall back to ID lookup
  if (!post) {
    post = await getBlogPostById(idOrSlug);
  }

  if (!post || !post.isPublished) {
    return null;
  }

  // Cache the result (10 min TTL — content rarely changes)
  await cacheSet(cacheKey, post, 600);

  // Increment view count (fire and forget)
  incrementViewCount(post.id);

  return post;
}

export async function listPublishedBlogs(
  page: number,
  limit: number,
  filters?: BlogFilters
): Promise<{ items: SafeBlogPost[]; totalItems: number }> {
  const cacheKey = `blog:list:${JSON.stringify(filters || {})}:p${page}:l${limit}`;

  // Try cache first
  const cached = await cacheGet<{ items: SafeBlogPost[]; totalItems: number }>(cacheKey);
  if (cached) {
    return cached;
  }

  const offset = (page - 1) * limit;
  const items = await listPublishedBlogPosts(offset, limit, filters);
  const totalItems = await countPublishedBlogPosts(filters);

  const result = { items, totalItems };

  // Cache the result
  await cacheSet(cacheKey, result, 300);

  return result;
}

export async function getRelatedBlogs(
  idOrSlug: string,
  limit: number
): Promise<SafeBlogPost[]> {
  // Find the post first
  let post = await getBlogPostBySlug(idOrSlug);
  if (!post) {
    post = await getBlogPostById(idOrSlug);
  }

  if (!post || !post.isPublished) {
    return [];
  }

  return listRelatedBlogPosts(post.id, post.tags, limit);
}
