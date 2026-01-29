import { NotFoundError, ForbiddenError } from "../../libs/errors.js";
import { verifyCompanyOwnership } from "../../libs/authorization.js";
import * as companyRepo from "./company.repo.js";
import type { CompanyResponse, UpdateCompanyData, CompanyFilters } from "./company.types.js";
import type { UserRole } from "../users/user.types.js";
import type { User } from "@prisma/client";
import { deleteCompanyMedia } from "../media/media.helpers.js";

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
