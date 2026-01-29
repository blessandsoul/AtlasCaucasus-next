import { prisma } from "../../libs/prisma.js";
import type { Company, User } from "@prisma/client";
import type { UpdateCompanyData, CompanyFilters, CompanyResponse } from "./company.types.js";
import { getMediaByEntity } from "../media/media.repo.js";

async function toCompanyResponseWithMedia(company: any): Promise<CompanyResponse> {
    const media = await getMediaByEntity("company", company.id);
    return {
        ...company,
        images: media,
    };
}

export async function findById(id: string): Promise<CompanyResponse | null> {
    const company = await prisma.company.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    emailVerified: true,
                },
            },
        },
    });

    return company ? await toCompanyResponseWithMedia(company) : null;
}

export async function findByUserId(userId: string): Promise<Company | null> {
    return prisma.company.findUnique({
        where: { userId },
    });
}

function buildCompanyFilters(filters: CompanyFilters): any {
    const where: any = {};

    // Verification filter
    if (filters.isVerified !== undefined) {
        where.isVerified = filters.isVerified;
    }

    // Search filter - on company name and description
    if (filters.search) {
        where.OR = [
            { companyName: { contains: filters.search } },
            { description: { contains: filters.search } },
        ];
    }

    // Location filter - filter companies that have tours in a specific location
    if (filters.locationId) {
        where.tours = {
            some: {
                isActive: true,
                locations: {
                    some: {
                        locationId: filters.locationId,
                    },
                },
            },
        };
    }

    // Has active tours filter
    if (filters.hasActiveTours === true) {
        where.tours = {
            some: {
                isActive: true,
            },
        };
    } else if (filters.hasActiveTours === false) {
        where.tours = {
            none: {
                isActive: true,
            },
        };
    }

    // Minimum rating filter
    if (filters.minRating !== undefined) {
        where.averageRating = {
            gte: filters.minRating,
        };
    }

    return where;
}

function getCompanySortOrder(sortBy?: string): any {
    switch (sortBy) {
        case 'rating':
            return { averageRating: 'desc' };
        case 'name':
            return { companyName: 'asc' };
        case 'newest':
        default:
            return { createdAt: 'desc' };
    }
}

export async function findAll(
    filters: CompanyFilters,
    page: number,
    limit: number
): Promise<{ companies: CompanyResponse[]; total: number }> {
    const where = buildCompanyFilters(filters);
    const orderBy = getCompanySortOrder(filters.sortBy);

    const [companies, total] = await Promise.all([
        prisma.company.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        emailVerified: true,
                    },
                },
            },
            orderBy,
        }),
        prisma.company.count({ where }),
    ]);

    const companiesWithMedia = await Promise.all(
        companies.map(toCompanyResponseWithMedia)
    );

    return { companies: companiesWithMedia, total };
}

export async function update(id: string, data: UpdateCompanyData): Promise<Company> {
    return prisma.company.update({
        where: { id },
        data: {
            companyName: data.companyName,
            description: data.description,
            registrationNumber: data.registrationNumber,
            logoUrl: data.logoUrl,
            websiteUrl: data.websiteUrl,
            phoneNumber: data.phoneNumber,
            isVerified: data.isVerified,
        },
    });
}

export async function deleteCompany(id: string): Promise<void> {
    // Soft delete - mark as unverified (companies don't have isActive, only isVerified)
    await prisma.company.update({
        where: { id },
        data: { isVerified: false },
    });
}

export async function getTourAgents(companyUserId: string): Promise<User[]> {
    return prisma.user.findMany({
        where: {
            parentCompanyId: companyUserId,
            deletedAt: null,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}
