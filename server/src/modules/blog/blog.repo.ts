import { prisma } from "../../libs/prisma.js";
import type { BlogPost as PrismaBlogPost } from "@prisma/client";
import type { CreateBlogData, UpdateBlogData, SafeBlogPost, BlogFilters } from "./blog.types.js";
import { getMediaByEntity } from "../media/media.repo.js";

// ==========================================
// HELPERS
// ==========================================

function toSafeBlogPost(
  post: PrismaBlogPost & { author?: { id: string; firstName: string; lastName: string } }
): SafeBlogPost {
  return {
    id: post.id,
    authorId: post.authorId,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    tags: post.tags ? JSON.parse(post.tags) : [],
    isPublished: post.isPublished,
    viewCount: post.viewCount,
    readingTime: post.readingTime,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: post.author
      ? { id: post.author.id, firstName: post.author.firstName, lastName: post.author.lastName }
      : undefined,
  };
}

async function attachCoverImage(post: SafeBlogPost): Promise<SafeBlogPost> {
  const media = await getMediaByEntity("blog", post.id);
  return {
    ...post,
    coverImage: media.length > 0 ? media[0] : null,
  };
}

function calculateReadingTime(content: string): number {
  // Strip HTML tags and count words
  const text = content.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ");
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 250);

  // Add random suffix for uniqueness
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}

// ==========================================
// CRUD OPERATIONS
// ==========================================

const authorSelect = {
  id: true,
  firstName: true,
  lastName: true,
};

export async function createBlogPost(
  authorId: string,
  data: CreateBlogData
): Promise<SafeBlogPost> {
  const slug = generateSlug(data.title);
  const readingTime = calculateReadingTime(data.content);

  const post = await prisma.blogPost.create({
    data: {
      authorId,
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt ?? null,
      tags: data.tags ? JSON.stringify(data.tags) : null,
      isPublished: data.isPublished ?? false,
      readingTime,
      publishedAt: data.isPublished ? new Date() : null,
    },
    include: { author: { select: authorSelect } },
  });

  return toSafeBlogPost(post);
}

export async function getBlogPostById(id: string): Promise<SafeBlogPost | null> {
  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: { author: { select: authorSelect } },
  });

  if (!post) return null;

  const safe = toSafeBlogPost(post);
  return attachCoverImage(safe);
}

export async function getBlogPostBySlug(slug: string): Promise<SafeBlogPost | null> {
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: { author: { select: authorSelect } },
  });

  if (!post) return null;

  const safe = toSafeBlogPost(post);
  return attachCoverImage(safe);
}

export async function updateBlogPost(
  id: string,
  data: UpdateBlogData,
  setPublishedAt: boolean = false
): Promise<SafeBlogPost | null> {
  try {
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) {
      updateData.content = data.content;
      updateData.readingTime = calculateReadingTime(data.content);
    }
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
    if (setPublishedAt) updateData.publishedAt = new Date();

    const post = await prisma.blogPost.update({
      where: { id },
      data: updateData,
      include: { author: { select: authorSelect } },
    });

    return toSafeBlogPost(post);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      return null;
    }
    throw err;
  }
}

export async function softDeleteBlogPost(id: string): Promise<SafeBlogPost | null> {
  try {
    const post = await prisma.blogPost.update({
      where: { id },
      data: { isPublished: false },
      include: { author: { select: authorSelect } },
    });

    return toSafeBlogPost(post);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      return null;
    }
    throw err;
  }
}

export async function hardDeleteBlogPost(id: string): Promise<SafeBlogPost | null> {
  try {
    const post = await prisma.blogPost.delete({
      where: { id },
      include: { author: { select: authorSelect } },
    });

    return toSafeBlogPost(post);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      return null;
    }
    throw err;
  }
}

export async function incrementViewCount(id: string): Promise<void> {
  await prisma.blogPost.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {
    // Silently ignore if post doesn't exist
  });
}

// ==========================================
// PUBLIC LISTING
// ==========================================

function buildBlogFilters(filters?: BlogFilters): Record<string, unknown> {
  const where: Record<string, unknown> = {
    isPublished: true,
  };

  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { excerpt: { contains: filters.search } },
      { content: { contains: filters.search } },
    ];
  }

  if (filters?.tag) {
    where.tags = { contains: filters.tag };
  }

  return where;
}

function getBlogSortOrder(sortBy?: string): Record<string, string>[] {
  switch (sortBy) {
    case "oldest":
      return [{ publishedAt: "asc" }];
    case "views":
      return [{ viewCount: "desc" }, { publishedAt: "desc" }];
    case "newest":
    default:
      return [{ publishedAt: "desc" }];
  }
}

export async function listPublishedBlogPosts(
  skip: number,
  take: number,
  filters?: BlogFilters
): Promise<SafeBlogPost[]> {
  const where = buildBlogFilters(filters);
  const orderBy = getBlogSortOrder(filters?.sortBy);

  const posts = await prisma.blogPost.findMany({
    where,
    orderBy,
    skip,
    take,
    include: { author: { select: authorSelect } },
  });

  // Attach cover images
  const safePosts = posts.map(toSafeBlogPost);
  return Promise.all(safePosts.map(attachCoverImage));
}

export async function countPublishedBlogPosts(filters?: BlogFilters): Promise<number> {
  const where = buildBlogFilters(filters);
  return prisma.blogPost.count({ where });
}

// ==========================================
// AUTHOR LISTING (includes drafts)
// ==========================================

export async function listBlogPostsByAuthor(
  authorId: string,
  skip: number,
  take: number
): Promise<SafeBlogPost[]> {
  const posts = await prisma.blogPost.findMany({
    where: { authorId },
    orderBy: { createdAt: "desc" },
    skip,
    take,
    include: { author: { select: authorSelect } },
  });

  const safePosts = posts.map(toSafeBlogPost);
  return Promise.all(safePosts.map(attachCoverImage));
}

export async function countBlogPostsByAuthor(authorId: string): Promise<number> {
  return prisma.blogPost.count({ where: { authorId } });
}

// ==========================================
// RELATED POSTS
// ==========================================

export async function listRelatedBlogPosts(
  postId: string,
  tags: string[],
  limit: number
): Promise<SafeBlogPost[]> {
  // Find posts that share at least one tag
  const tagConditions = tags.map((tag) => ({
    tags: { contains: tag },
  }));

  const where: Record<string, unknown> = {
    isPublished: true,
    id: { not: postId },
  };

  if (tagConditions.length > 0) {
    where.OR = tagConditions;
  }

  const posts = await prisma.blogPost.findMany({
    where,
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
    include: { author: { select: authorSelect } },
  });

  const safePosts = posts.map(toSafeBlogPost);
  return Promise.all(safePosts.map(attachCoverImage));
}
