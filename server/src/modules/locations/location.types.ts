import type { Location } from "@prisma/client";

export type { Location };

export interface LocationResponse {
    id: string;
    name: string;
    region: string | null;
    country: string;
    latitude: number | null;
    longitude: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateLocationData {
    name: string;
    region?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
}

export interface UpdateLocationData {
    name?: string;
    region?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    isActive?: boolean;
}

export interface LocationFilters {
    country?: string;
    region?: string;
    isActive?: boolean;
    search?: string;
}
