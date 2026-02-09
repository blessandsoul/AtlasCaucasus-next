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
  return createBlogPost(currentUser.id, data);
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
  // Try slug first (more common for public access)
  let post = await getBlogPostBySlug(idOrSlug);

  // Fall back to ID lookup
  if (!post) {
    post = await getBlogPostById(idOrSlug);
  }

  if (!post || !post.isPublished) {
    return null;
  }

  // Increment view count (fire and forget)
  incrementViewCount(post.id);

  return post;
}

export async function listPublishedBlogs(
  page: number,
  limit: number,
  filters?: BlogFilters
): Promise<{ items: SafeBlogPost[]; totalItems: number }> {
  const offset = (page - 1) * limit;
  const items = await listPublishedBlogPosts(offset, limit, filters);
  const totalItems = await countPublishedBlogPosts(filters);

  return { items, totalItems };
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
