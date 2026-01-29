import type { Company, User } from "@prisma/client";

export type { Company };

export interface CompanyResponse extends Company {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        emailVerified: boolean;
    };
}

export interface UpdateCompanyData {
    companyName?: string;
    description?: string;
    registrationNumber?: string;
    logoUrl?: string;
    websiteUrl?: string;
    phoneNumber?: string;
    isVerified?: boolean;
}

export interface CompanyFilters {
    isVerified?: boolean;
    search?: string;
    locationId?: string;
    hasActiveTours?: boolean;
    minRating?: number;
    sortBy?: 'newest' | 'rating' | 'name';
}
