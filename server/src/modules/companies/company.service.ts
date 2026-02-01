import { NotFoundError, ForbiddenError, ValidationError } from "../../libs/errors.js";
import { verifyCompanyOwnership } from "../../libs/authorization.js";
import * as companyRepo from "./company.repo.js";
import type { CompanyResponse, UpdateCompanyData, CompanyFilters } from "./company.types.js";
import type { UserRole } from "../users/user.types.js";
import type { User } from "@prisma/client";
import type { UploadedFile } from "../media/media.types.js";
import { deleteCompanyMedia } from "../media/media.helpers.js";
import {
    sanitizeFilename,
    generateSeoFriendlyFilename,
    validateFileType,
    validateFileSize,
    saveFile,
    deleteFile,
    slugify,
} from "../../libs/file-upload.js";
import { FILE_VALIDATION } from "../media/media.schemas.js";

export async function getCompanies(
    filters: CompanyFilters,
    page: number,
    limit: number
): Promise<{ companies: CompanyResponse[]; total: number }> {
    // For public access, only return verified companies unless explicitly filtering
    // Create new object to avoid mutating input
    const effectiveFilters: CompanyFilters = {
        ...filters,
        isVerified: filters.isVerified ?? true,
    };

    return companyRepo.findAll(effectiveFilters, page, limit);
}

export async function getCompanyById(id: string): Promise<CompanyResponse> {
    const company = await companyRepo.findById(id);

    if (!company) {
        throw new NotFoundError("Company not found", "COMPANY_NOT_FOUND");
    }

    return company;
}

export async function getMyCompany(userId: string): Promise<CompanyResponse> {
    const company = await companyRepo.findByUserId(userId);

    if (!company) {
        throw new NotFoundError("You don't have a company profile", "COMPANY_NOT_FOUND");
    }

    // Get full company response with user info and media
    return getCompanyById(company.id);
}

export async function updateCompany(
    id: string,
    userId: string,
    userRoles: UserRole[],
    data: UpdateCompanyData
): Promise<CompanyResponse> {
    // Verify company exists
    const company = await getCompanyById(id);

    // Verify ownership or admin
    const hasPermission = await verifyCompanyOwnership(id, userId, userRoles);
    if (!hasPermission) {
        throw new ForbiddenError(
            "You do not have permission to update this company",
            "FORBIDDEN"
        );
    }

    // Non-admins cannot update isVerified - create new object to avoid mutation
    const { isVerified, ...safeData } = data;
    const updateData = userRoles.includes("ADMIN") ? data : safeData;

    await companyRepo.update(id, updateData);

    // Return updated company
    return getCompanyById(id);
}

export async function deleteCompany(
    id: string,
    userId: string,
    userRoles: UserRole[]
): Promise<void> {
    // Verify company exists
    await getCompanyById(id);

    // Verify ownership or admin
    const hasPermission = await verifyCompanyOwnership(id, userId, userRoles);
    if (!hasPermission) {
        throw new ForbiddenError(
            "You do not have permission to delete this company",
            "FORBIDDEN"
        );
    }

    // Delete associated media files (logo, images) before deleting company
    await deleteCompanyMedia(id);

    await companyRepo.deleteCompany(id);
}

export async function getTourAgents(
    companyId: string,
    requesterId: string,
    requesterRoles: UserRole[]
): Promise<User[]> {
    // Verify company exists
    const company = await getCompanyById(companyId);

    // Verify ownership or admin
    const hasPermission = await verifyCompanyOwnership(companyId, requesterId, requesterRoles);
    if (!hasPermission) {
        throw new ForbiddenError(
            "You do not have permission to view tour agents for this company",
            "FORBIDDEN"
        );
    }

    return companyRepo.getTourAgents(company.userId);
}

// ==========================================
// LOGO MANAGEMENT
// ==========================================

export async function uploadCompanyLogo(
    companyId: string,
    userId: string,
    userRoles: UserRole[],
    file: UploadedFile
): Promise<{ logoUrl: string }> {
    // Verify company exists
    const company = await getCompanyById(companyId);

    // Verify ownership or admin
    const hasPermission = await verifyCompanyOwnership(companyId, userId, userRoles);
    if (!hasPermission) {
        throw new ForbiddenError(
            "You do not have permission to upload logo for this company",
            "FORBIDDEN"
        );
    }

    // Validate file type
    if (!validateFileType(file.mimetype, FILE_VALIDATION.ALLOWED_MIME_TYPES)) {
        throw new ValidationError(
            `Invalid file type. Allowed types: ${FILE_VALIDATION.ALLOWED_MIME_TYPES.join(", ")}`
        );
    }

    // Validate file size
    if (!validateFileSize(file.size, FILE_VALIDATION.MAX_SIZE)) {
        throw new ValidationError(
            `File too large. Maximum size: ${FILE_VALIDATION.MAX_SIZE / (1024 * 1024)}MB`
        );
    }

    // Delete old logo file if exists
    if (company.logoUrl) {
        await deleteFile(company.logoUrl);
    }

    // Generate SEO-friendly filename
    const sanitizedName = sanitizeFilename(file.originalFilename);
    const companySlug = slugify(company.companyName || "company", 40);
    const uniqueFilename = generateSeoFriendlyFilename(sanitizedName, "company", `${companySlug}-logo`);

    // Save file to disk
    const logoUrl = await saveFile(file.buffer, "company", uniqueFilename);

    // Update company with new logo URL
    await companyRepo.update(companyId, { logoUrl });

    return { logoUrl };
}

export async function deleteCompanyLogo(
    companyId: string,
    userId: string,
    userRoles: UserRole[]
): Promise<void> {
    // Verify company exists
    const company = await getCompanyById(companyId);

    // Verify ownership or admin
    const hasPermission = await verifyCompanyOwnership(companyId, userId, userRoles);
    if (!hasPermission) {
        throw new ForbiddenError(
            "You do not have permission to delete logo for this company",
            "FORBIDDEN"
        );
    }

    // Delete logo file if exists
    if (company.logoUrl) {
        await deleteFile(company.logoUrl);
    }

    // Clear logo URL in database
    await companyRepo.update(companyId, { logoUrl: null });
}
