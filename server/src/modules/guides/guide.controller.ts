import type { FastifyRequest, FastifyReply } from "fastify";
import { successResponse, paginatedResponse } from "../../libs/response.js";
import { ValidationError, BadRequestError } from "../../libs/errors.js";
import * as guideService from "./guide.service.js";
import { updateGuideSchema, guideQuerySchema } from "./guide.schemas.js";
import {
    uploadMultipleFiles,
    getGuidePhotos,
    deleteMediaHelper,
} from "../media/media.helpers.js";
import type { UploadedFile } from "../media/media.types.js";

export async function list(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const parsed = guideQuerySchema.safeParse(request.query);
    if (!parsed.success) {
        throw new ValidationError(parsed.error.errors[0].message);
    }

    const { page, limit, ...filters } = parsed.data;

    const { guides, total } = await guideService.getGuides(filters, page, limit);

    return reply.send(
        paginatedResponse("Guides retrieved successfully", guides, page, limit, total)
    );
}

export async function getById(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const { id } = request.params as { id: string };

    const guide = await guideService.getGuideById(id);

    return reply.send(successResponse("Guide retrieved successfully", guide));
}

export async function getMyProfile(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const guide = await guideService.getMyGuide(request.user.id);

    return reply.send(successResponse("Guide profile retrieved successfully", guide));
}

export async function update(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const { id } = request.params as { id: string };

    const parsed = updateGuideSchema.safeParse(request.body);
    if (!parsed.success) {
        throw new ValidationError(parsed.error.errors[0].message);
    }

    const guide = await guideService.updateGuide(
        id,
        request.user.id,
        request.user.roles,
        parsed.data
    );

    return reply.send(successResponse("Guide updated successfully", guide));
}

export async function deleteGuide(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const { id } = request.params as { id: string };

    await guideService.deleteGuide(id, request.user.id, request.user.roles);

    return reply.send(successResponse("Guide deleted successfully", null));
}

// ==========================================
// PHOTO MANAGEMENT
// ==========================================

export async function uploadPhotos(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const { id } = request.params as { id: string };

    // Get all files from multipart request
    const parts = request.files();
    const uploadedFiles: UploadedFile[] = [];

    for await (const part of parts) {
        const buffer = await part.toBuffer();
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

    if (uploadedFiles.length === 0) {
        throw new BadRequestError("No files provided", "NO_FILES_PROVIDED");
    }

    const mediaList = await uploadMultipleFiles(
        request.user,
        "guide",
        id,
        uploadedFiles
    );

    return reply.status(201).send(
        successResponse(
            `${mediaList.length} photo(s) uploaded successfully`,
            mediaList
        )
    );
}

export async function getPhotos(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const { id } = request.params as { id: string };

    // Verify guide exists
    await guideService.getGuideById(id);

    const photos = await getGuidePhotos(id);

    return reply.send(successResponse("Guide photos retrieved successfully", photos));
}

export async function deletePhoto(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const { id, photoId } = request.params as { id: string; photoId: string };

    // Verify guide exists
    await guideService.getGuideById(id);

    const deleted = await deleteMediaHelper(request.user, photoId);

    return reply.send(successResponse("Photo deleted successfully", deleted));
}
