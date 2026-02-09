import type { JwtUser } from "../auth/auth.types.js";
import type { SafeMedia, UploadedFile } from "../media/media.types.js";
import {
  uploadMediaForEntity,
  deleteAllMediaForEntity,
} from "../media/media.service.js";
import { slugify } from "../../libs/file-upload.js";
import { getBlogPostById } from "./blog.repo.js";
import { NotFoundError, ForbiddenError } from "../../libs/errors.js";

export async function uploadBlogCover(
  currentUser: JwtUser,
  blogPostId: string,
  file: UploadedFile
): Promise<SafeMedia> {
  if (!currentUser.roles.includes("ADMIN")) {
    throw new ForbiddenError("Only administrators can upload blog covers", "ADMIN_REQUIRED");
  }

  const post = await getBlogPostById(blogPostId);
  if (!post) {
    throw new NotFoundError("Blog post not found", "BLOG_NOT_FOUND");
  }

  // Delete existing cover before uploading new one
  await deleteAllMediaForEntity("blog", blogPostId);

  const entitySlug = slugify(post.title, 40);
  return uploadMediaForEntity(currentUser, "blog", blogPostId, file, entitySlug);
}

export async function deleteBlogCoverAuthed(
  currentUser: JwtUser,
  blogPostId: string
): Promise<void> {
  if (!currentUser.roles.includes("ADMIN")) {
    throw new ForbiddenError("Only administrators can delete blog covers", "ADMIN_REQUIRED");
  }

  const post = await getBlogPostById(blogPostId);
  if (!post) {
    throw new NotFoundError("Blog post not found", "BLOG_NOT_FOUND");
  }

  return deleteAllMediaForEntity("blog", blogPostId);
}
