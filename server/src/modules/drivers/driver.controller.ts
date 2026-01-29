import type { FastifyRequest, FastifyReply } from "fastify";
import { successResponse, paginatedResponse } from "../../libs/response.js";
import { ValidationError, BadRequestError } from "../../libs/errors.js";
import * as driverService from "./driver.service.js";
import { updateDriverSchema, driverQuerySchema } from "./driver.schemas.js";
import {
    uploadMultipleFiles,
    getDriverPhotos,
    deleteMediaHelper,
} from "../media/media.helpers.js";
import type { UploadedFile } from "../media/media.types.js";

export async function list(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const parsed = driverQuerySchema.safeParse(request.query);
    if (!parsed.success) {
        throw new ValidationError(parsed.error.errors[0].message);
    }

    const { page, limit, ...filters } = parsed.data;

    const { drivers, total } = await driverService.getDrivers(filters, page, limit);

    return reply.send(
        paginatedResponse("Drivers retrieved successfully", drivers, page, limit, total)
    );
}

export async function getById(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const { id } = request.params as { id: string };

    const driver = await driverService.getDriverById(id);

    return reply.send(successResponse("Driver retrieved successfully", driver));
}

export async function getMyProfile(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const driver = await driverService.getMyDriver(request.user.id);

    return reply.send(successResponse("Driver profile retrieved successfully", driver));
}

export async function update(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const { id } = request.params as { id: string };

    const parsed = updateDriverSchema.safeParse(request.body);
    if (!parsed.success) {
        throw new ValidationError(parsed.error.errors[0].message);
    }

    const driver = await driverService.updateDriver(
        id,
        request.user.id,
        request.user.roles,
        parsed.data
    );

    return reply.send(successResponse("Driver updated successfully", driver));
}

export async function deleteDriver(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const { id } = request.params as { id: string };

    await driverService.deleteDriver(id, request.user.id, request.user.roles);

    return reply.send(successResponse("Driver deleted successfully", null));
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
        "driver",
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

    // Verify driver exists
    await driverService.getDriverById(id);

    const photos = await getDriverPhotos(id);

    return reply.send(successResponse("Driver photos retrieved successfully", photos));
}

export async function deletePhoto(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const { id, photoId } = request.params as { id: string; photoId: string };

    // Verify driver exists
    await driverService.getDriverById(id);

    const deleted = await deleteMediaHelper(request.user, photoId);

    return reply.send(successResponse("Photo deleted successfully", deleted));
}
