import type { FastifyRequest, FastifyReply } from "fastify";
import { successResponse, paginatedResponse } from "../../libs/response.js";
import { ValidationError, BadRequestError } from "../../libs/errors.js";
import * as companyService from "./company.service.js";
import { updateCompanySchema, companyQuerySchema } from "./company.schemas.js";
import {
    uploadMultipleFiles,
    getCompanyMedia,
    deleteMediaHelper,
} from "../media/media.helpers.js";
import type { UploadedFile } from "../media/media.types.js";

export async function list(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const parsed = companyQuerySchema.safeParse(request.query);
    if (!parsed.success) {
        throw new ValidationError(parsed.error.errors[0].message);
    }

    const { page, limit, ...filters } = parsed.data;

    const { companies, total } = await companyService.getCompanies(
        filters,
        page,
        limit
    );

    return reply.send(
        paginatedResponse("Companies retrieved successfully", companies, page, limit, total)
    );
}

export async function getById(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const { id } = request.params as { id: string };

    const company = await companyService.getCompanyById(id);

    return reply.send(
        successResponse("Company retrieved successfully", company)
    );
}

export async function getMyCompany(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const company = await companyService.getMyCompany(request.user.id);

    return reply.send(
        successResponse("Company retrieved successfully", { company })
    );
}

export async function update(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const { id } = request.params as { id: string };

    const parsed = updateCompanySchema.safeParse(request.body);
    if (!parsed.success) {
        throw new ValidationError(parsed.error.errors[0].message);
    }

    const company = await companyService.updateCompany(
        id,
        request.user.id,
        request.user.roles,
        parsed.data
    );

    return reply.send(
        successResponse("Company updated successfully", company)
    );
}

export async function deleteCompany(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const { id } = request.params as { id: string };

    await companyService.deleteCompany(id, request.user.id, request.user.roles);

    return reply.send(
        successResponse("Company deleted successfully", null)
    );
}

export async function getTourAgents(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const { id } = request.params as { id: string };

    const tourAgents = await companyService.getTourAgents(
        id,
        request.user.id,
        request.user.roles
    );

    return reply.send(
        successResponse("Tour agents retrieved successfully", { tourAgents })
    );
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
        "company",
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

    // Verify company exists
    await companyService.getCompanyById(id);

    const photos = await getCompanyMedia(id);

    return reply.send(successResponse("Company photos retrieved successfully", photos));
}

export async function deletePhoto(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const { id, photoId } = request.params as { id: string; photoId: string };

    // Verify company exists
    await companyService.getCompanyById(id);

    const deleted = await deleteMediaHelper(request.user, photoId);

    return reply.send(successResponse("Photo deleted successfully", deleted));
}
