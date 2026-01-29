import type { FastifyRequest, FastifyReply } from "fastify";
import type { MultipartFile } from "@fastify/multipart";
import { successResponse } from "../../libs/response.js";
import { ValidationError, BadRequestError } from "../../libs/errors.js";
import { logger } from "../../libs/logger.js";
import {
  uploadMediaForEntity,
  getMediaForEntity,
  deleteMediaById,
} from "./media.service.js";
import {
  uploadMediaSchema,
  getMediaQuerySchema,
  deleteMediaParamsSchema,
} from "./media.schemas.js";
import { verifyEntityOwnership } from "./media.authorization.js";
import type { UploadedFile } from "./media.types.js";
import {
  uploadMultipleFiles,
  uploadTourImage,
  uploadCompanyLogo,
  uploadGuidePhoto,
  uploadDriverPhoto,
  uploadUserAvatar,
} from "./media.helpers.js";

interface UploadMediaParams {
  entityType: string;
  entityId: string;
}

interface GetMediaParams {
  entityType: string;
  entityId: string;
}

interface DeleteMediaParams {
  id: string;
}

// Upload file handler
export async function uploadMediaHandler(
  request: FastifyRequest<{ Params: UploadMediaParams }>,
  reply: FastifyReply
): Promise<void> {
  // Validate params
  const paramsParsed = uploadMediaSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    throw new ValidationError(paramsParsed.error.errors[0].message);
  }

  const { entityType, entityId } = paramsParsed.data;

  // Verify ownership before processing the file
  await verifyEntityOwnership(request.user, entityType, entityId);

  // Get file from multipart request
  const data = await request.file();

  if (!data) {
    throw new BadRequestError("No file provided", "NO_FILE_PROVIDED");
  }

  // Convert MultipartFile to UploadedFile
  const buffer = await data.toBuffer();
  const uploadedFile: UploadedFile = {
    fieldname: data.fieldname,
    filename: data.filename,
    originalFilename: data.filename,
    encoding: data.encoding,
    mimetype: data.mimetype,
    size: buffer.length,
    buffer,
  };

  // Upload file
  const media = await uploadMediaForEntity(
    request.user,
    entityType,
    entityId,
    uploadedFile
  );

  return reply.status(201).send(
    successResponse("File uploaded successfully", media)
  );
}

// Get media for entity handler
export async function getMediaHandler(
  request: FastifyRequest<{ Params: GetMediaParams }>,
  reply: FastifyReply
): Promise<void> {
  // Validate params
  const paramsParsed = getMediaQuerySchema.safeParse(request.params);
  if (!paramsParsed.success) {
    throw new ValidationError(paramsParsed.error.errors[0].message);
  }

  const { entityType, entityId } = paramsParsed.data;

  const media = await getMediaForEntity(entityType, entityId);

  return reply.send(
    successResponse("Media retrieved successfully", media)
  );
}

// Delete media handler
export async function deleteMediaHandler(
  request: FastifyRequest<{ Params: DeleteMediaParams }>,
  reply: FastifyReply
): Promise<void> {
  // Validate params
  const paramsParsed = deleteMediaParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    throw new ValidationError(paramsParsed.error.errors[0].message);
  }

  const { id } = paramsParsed.data;

  const media = await deleteMediaById(request.user, id);

  return reply.send(successResponse("Media deleted successfully", media));
}

// Batch upload handler - upload multiple files at once
export async function uploadMultipleMediaHandler(
  request: FastifyRequest<{ Params: UploadMediaParams }>,
  reply: FastifyReply
): Promise<void> {
  // Validate params
  const paramsParsed = uploadMediaSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    throw new ValidationError(paramsParsed.error.errors[0].message);
  }

  const { entityType, entityId } = paramsParsed.data;

  // Get all files from multipart request
  const files = request.files();
  const fileArray: MultipartFile[] = [];

  for await (const file of files) {
    fileArray.push(file);
  }

  if (fileArray.length === 0) {
    throw new BadRequestError("No files provided", "NO_FILES_PROVIDED");
  }

  // Convert MultipartFiles to UploadedFiles
  const uploadedFiles: UploadedFile[] = await Promise.all(
    fileArray.map(async (data) => {
      const buffer = await data.toBuffer();
      return {
        fieldname: data.fieldname,
        filename: data.filename,
        originalFilename: data.filename,
        encoding: data.encoding,
        mimetype: data.mimetype,
        size: buffer.length,
        buffer,
      };
    })
  );

  // Upload files
  const mediaList = await uploadMultipleFiles(
    request.user,
    entityType,
    entityId,
    uploadedFiles
  );

  return reply.status(201).send(
    successResponse(
      `${mediaList.length} file(s) uploaded successfully`,
      mediaList
    )
  );
}

// Specialized endpoint: Upload tour images (supports multiple)
export async function uploadTourImageHandler(
  request: FastifyRequest<{ Params: { tourId: string } }>,
  reply: FastifyReply
): Promise<void> {
  const { tourId } = request.params;

  logger.debug({ tourId }, "Starting tour image upload");

  const parts = request.files();
  const uploadedFiles: UploadedFile[] = [];

  // Consume buffer IMMEDIATELY for each file part
  for await (const part of parts) {
    logger.debug({ filename: part.filename, mimetype: part.mimetype }, "Received file");

    const buffer = await part.toBuffer();
    logger.debug({ filename: part.filename, size: buffer.length }, "File buffered");

    uploadedFiles.push({
      fieldname: part.fieldname,
      filename: part.filename,
      originalFilename: part.filename,
      encoding: part.encoding,
      mimetype: part.mimetype,
      size: buffer.length,
      buffer,
    });
  }

  logger.debug({ fileCount: uploadedFiles.length }, "Total files received");

  if (uploadedFiles.length === 0) {
    logger.warn({ tourId }, "No files provided in tour image upload request");
    throw new BadRequestError("No files provided", "NO_FILES_PROVIDED");
  }

  logger.debug({ tourId, fileCount: uploadedFiles.length }, "Uploading files to storage");
  const mediaList = await uploadMultipleFiles(request.user, "tour", tourId, uploadedFiles);
  logger.info({ tourId, uploadedCount: mediaList.length }, "Tour images uploaded successfully");

  return reply.status(201).send(
    successResponse(`${mediaList.length} tour image(s) uploaded successfully`, mediaList)
  );
}

// Specialized endpoint: Upload company logo
export async function uploadCompanyLogoHandler(
  request: FastifyRequest<{ Params: { companyId: string } }>,
  reply: FastifyReply
): Promise<void> {
  const { companyId } = request.params;

  const data = await request.file();
  if (!data) {
    throw new BadRequestError("No file provided", "NO_FILE_PROVIDED");
  }

  const buffer = await data.toBuffer();
  const uploadedFile: UploadedFile = {
    fieldname: data.fieldname,
    filename: data.filename,
    originalFilename: data.filename,
    encoding: data.encoding,
    mimetype: data.mimetype,
    size: buffer.length,
    buffer,
  };

  const media = await uploadCompanyLogo(request.user, companyId, uploadedFile);

  return reply.status(201).send(
    successResponse("Company logo uploaded successfully", media)
  );
}

// Specialized endpoint: Upload guide photo
export async function uploadGuidePhotoHandler(
  request: FastifyRequest<{ Params: { guideId: string } }>,
  reply: FastifyReply
): Promise<void> {
  const { guideId } = request.params;

  const data = await request.file();
  if (!data) {
    throw new BadRequestError("No file provided", "NO_FILE_PROVIDED");
  }

  const buffer = await data.toBuffer();
  const uploadedFile: UploadedFile = {
    fieldname: data.fieldname,
    filename: data.filename,
    originalFilename: data.filename,
    encoding: data.encoding,
    mimetype: data.mimetype,
    size: buffer.length,
    buffer,
  };

  const media = await uploadGuidePhoto(request.user, guideId, uploadedFile);

  return reply.status(201).send(
    successResponse("Guide photo uploaded successfully", media)
  );
}

// Specialized endpoint: Upload driver photo
export async function uploadDriverPhotoHandler(
  request: FastifyRequest<{ Params: { driverId: string } }>,
  reply: FastifyReply
): Promise<void> {
  const { driverId } = request.params;

  const data = await request.file();
  if (!data) {
    throw new BadRequestError("No file provided", "NO_FILE_PROVIDED");
  }

  const buffer = await data.toBuffer();
  const uploadedFile: UploadedFile = {
    fieldname: data.fieldname,
    filename: data.filename,
    originalFilename: data.filename,
    encoding: data.encoding,
    mimetype: data.mimetype,
    size: buffer.length,
    buffer,
  };

  const media = await uploadDriverPhoto(request.user, driverId, uploadedFile);

  return reply.status(201).send(
    successResponse("Driver photo uploaded successfully", media)
  );
}

// Specialized endpoint: Upload user avatar
export async function uploadUserAvatarHandler(
  request: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
): Promise<void> {
  const { userId } = request.params;

  const data = await request.file();
  if (!data) {
    throw new BadRequestError("No file provided", "NO_FILE_PROVIDED");
  }

  const buffer = await data.toBuffer();
  const uploadedFile: UploadedFile = {
    fieldname: data.fieldname,
    filename: data.filename,
    originalFilename: data.filename,
    encoding: data.encoding,
    mimetype: data.mimetype,
    size: buffer.length,
    buffer,
  };

  const media = await uploadUserAvatar(request.user, userId, uploadedFile);

  return reply.status(201).send(
    successResponse("User avatar uploaded successfully", media)
  );
}
