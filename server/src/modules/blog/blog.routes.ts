import type { FastifyInstance } from "fastify";
import { authGuard, requireRole } from "../../middlewares/authGuard.js";
import {
  createBlogHandler,
  updateBlogHandler,
  deleteBlogHandler,
  listMyBlogsHandler,
  uploadBlogCoverHandler,
  deleteBlogCoverHandler,
  getBlogByIdOrSlugHandler,
  listPublishedBlogsHandler,
  getRelatedBlogsHandler,
} from "./blog.controller.js";

interface IdParams {
  id: string;
}

interface IdOrSlugParams {
  idOrSlug: string;
}

const adminPreHandlers = [authGuard, requireRole("ADMIN")];

export async function blogRoutes(fastify: FastifyInstance): Promise<void> {
  // Public: list published blog posts
  fastify.get("/blogs", listPublishedBlogsHandler);

  // Public: get a single published blog post by ID or slug
  fastify.get<{ Params: IdOrSlugParams }>("/blogs/:idOrSlug", getBlogByIdOrSlugHandler);

  // Public: get related blog posts
  fastify.get<{ Params: IdOrSlugParams }>("/blogs/:idOrSlug/related", getRelatedBlogsHandler);

  // Admin: list my blog posts (includes drafts)
  fastify.get("/me/blogs", { preHandler: adminPreHandlers }, listMyBlogsHandler);

  // Admin: create a new blog post
  fastify.post("/blogs", { preHandler: adminPreHandlers }, createBlogHandler);

  // Admin: update a blog post
  fastify.patch<{ Params: IdParams }>("/blogs/:id", { preHandler: adminPreHandlers }, updateBlogHandler);

  // Admin: soft delete a blog post
  fastify.delete<{ Params: IdParams }>("/blogs/:id", { preHandler: adminPreHandlers }, deleteBlogHandler);

  // Admin: upload cover image
  fastify.post<{ Params: IdParams }>("/blogs/:id/cover", { preHandler: adminPreHandlers }, uploadBlogCoverHandler);

  // Admin: delete cover image
  fastify.delete<{ Params: IdParams }>("/blogs/:id/cover", { preHandler: adminPreHandlers }, deleteBlogCoverHandler);
}
