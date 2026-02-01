import type { FastifyRequest, FastifyReply } from "fastify";
import { successResponse, paginatedResponse } from "../../libs/response.js";
import { ValidationError, BadRequestError } from "../../libs/errors.js";
import { validateUuidParam } from "../../libs/validation.js";
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
    const id = validateUuidParam((request.params as { id: string }).id);

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
        successResponse("Company retrieved successfully", company)
    );
}

export async function update(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const id = validateUuidParam((request.params as { id: string }).id);

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
    const id = validateUuidParam((request.params as { id: string }).id);

    await companyService.deleteCompany(id, request.user.id, request.user.roles);

    return reply.send(
        successResponse("Company deleted successfully", null)
    );
}

export async function getTourAgents(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const id = validateUuidParam((request.params as { id: string }).id);

    const tourAgents = await companyService.getTourAgents(
        id,
        request.user.id,
        request.user.roles
    );

    return reply.send(
        successResponse("Tour agents retrieved successfully", tourAgents)
    );
}

// ==========================================
// PHOTO MANAGEMENT
// ==========================================

export async function uploadPhotos(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const id = validateUuidParam((request.params as { id: string }).id);

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
    const id = validateUuidParam((request.params as { id: string }).id);

    // Verify company exists
    await companyService.getCompanyById(id);

    const photos = await getCompanyMedia(id);

    return reply.send(successResponse("Company photos retrieved successfully", photos));
}

export async function deletePhoto(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const params = request.params as { id: string; photoId: string };
    const id = validateUuidParam(params.id);
    const photoId = validateUuidParam(params.photoId);

    // Verify company exists
    await companyService.getCompanyById(id);

    const deleted = await deleteMediaHelper(request.user, photoId);

    return reply.send(successResponse("Photo deleted successfully", deleted));
}

// ==========================================
// LOGO MANAGEMENT
// ==========================================

export async function uploadLogo(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const id = validateUuidParam((request.params as { id: string }).id);

    // Get file from multipart request
    const file = await request.file();

    if (!file) {
        throw new BadRequestError("No logo file provided", "NO_FILE_PROVIDED");
    }

    const buffer = await file.toBuffer();
    const uploadedFile: UploadedFile = {
        fieldname: file.fieldname,
        filename: file.filename,
        originalFilename: file.filename,
        encoding: file.encoding,
        mimetype: file.mimetype,
        size: buffer.length,
        buffer,
    };

    const result = await companyService.uploadCompanyLogo(
        id,
        request.user.id,
        request.user.roles,
        uploadedFile
    );

    return reply.status(201).send(
        successResponse("Logo uploaded successfully", result)
    );
}

export async function deleteLogo(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const id = validateUuidParam((request.params as { id: string }).id);

    await companyService.deleteCompanyLogo(
        id,
        request.user.id,
        request.user.roles
    );

    return reply.send(successResponse("Logo deleted successfully", null));
}
