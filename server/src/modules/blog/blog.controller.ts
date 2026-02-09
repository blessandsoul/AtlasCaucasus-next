import type { FastifyRequest, FastifyReply } from "fastify";
import { successResponse, paginatedResponse } from "../../libs/response.js";
import { ValidationError, NotFoundError } from "../../libs/errors.js";
import { validateUuidParam } from "../../libs/validation.js";
import {
  createBlogForAdmin,
  updateBlogForAdmin,
  deleteBlogForAdmin,
  listMyBlogs,
  getBlogByIdOrSlugPublic,
  listPublishedBlogs,
  getRelatedBlogs,
} from "./blog.service.js";
import {
  createBlogSchema,
  updateBlogSchema,
  listBlogsQuerySchema,
} from "./blog.schemas.js";
import {
  uploadBlogCover,
  deleteBlogCoverAuthed,
} from "./blog.media.js";

interface IdParams {
  id: string;
}

interface IdOrSlugParams {
  idOrSlug: string;
}

// ==========================================
// ADMIN HANDLERS
// ==========================================

export async function createBlogHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parsed = createBlogSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const post = await createBlogForAdmin(request.user, parsed.data);

  return reply.status(201).send(successResponse("Blog post created successfully", post));
}

export async function updateBlogHandler(
  request: FastifyRequest<{ Params: IdParams }>,
  reply: FastifyReply
): Promise<void> {
  const id = validateUuidParam(request.params.id);

  const parsed = updateBlogSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const post = await updateBlogForAdmin(request.user, id, parsed.data);

  return reply.send(successResponse("Blog post updated successfully", post));
}

export async function deleteBlogHandler(
  request: FastifyRequest<{ Params: IdParams }>,
  reply: FastifyReply
): Promise<void> {
  const id = validateUuidParam(request.params.id);

  const post = await deleteBlogForAdmin(request.user, id);

  return reply.send(successResponse("Blog post deleted successfully", post));
}

export async function listMyBlogsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parsed = listBlogsQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const { page, limit } = parsed.data;
  const { items, totalItems } = await listMyBlogs(request.user, page, limit);

  return reply.send(
    paginatedResponse("Blog posts retrieved successfully", items, page, limit, totalItems)
  );
}

// ==========================================
// COVER IMAGE HANDLERS
// ==========================================

export async function uploadBlogCoverHandler(
  request: FastifyRequest<{ Params: IdParams }>,
  reply: FastifyReply
): Promise<void> {
  const id = validateUuidParam(request.params.id);

  const file = await request.file();
  if (!file) {
    throw new ValidationError("No file uploaded", "NO_FILE");
  }

  const buffer = await file.toBuffer();
  const uploadedFile = {
    fieldname: file.fieldname,
    filename: file.filename,
    originalFilename: file.filename,
    encoding: file.encoding,
    mimetype: file.mimetype,
    size: buffer.length,
    buffer,
  };

  const media = await uploadBlogCover(request.user, id, uploadedFile);

  return reply.status(201).send(successResponse("Blog cover image uploaded successfully", media));
}

export async function deleteBlogCoverHandler(
  request: FastifyRequest<{ Params: IdParams }>,
  reply: FastifyReply
): Promise<void> {
  const id = validateUuidParam(request.params.id);

  await deleteBlogCoverAuthed(request.user, id);

  return reply.send(successResponse("Blog cover image deleted successfully", null));
}

// ==========================================
// PUBLIC HANDLERS
// ==========================================

export async function getBlogByIdOrSlugHandler(
  request: FastifyRequest<{ Params: IdOrSlugParams }>,
  reply: FastifyReply
): Promise<void> {
  const { idOrSlug } = request.params;

  const post = await getBlogByIdOrSlugPublic(idOrSlug);
  if (!post) {
    throw new NotFoundError("Blog post not found", "BLOG_NOT_FOUND");
  }

  return reply.send(successResponse("Blog post retrieved successfully", post));
}

export async function listPublishedBlogsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parsed = listBlogsQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const { page, limit, search, tag, sortBy } = parsed.data;
  const filters = { search, tag, sortBy };

  const { items, totalItems } = await listPublishedBlogs(page, limit, filters);

  return reply.send(
    paginatedResponse("Blog posts retrieved successfully", items, page, limit, totalItems)
  );
}

export async function getRelatedBlogsHandler(
  request: FastifyRequest<{ Params: IdOrSlugParams }>,
  reply: FastifyReply
): Promise<void> {
  const { idOrSlug } = request.params;

  const items = await getRelatedBlogs(idOrSlug, 3);

  return reply.send(successResponse("Related blog posts retrieved successfully", items));
}
