// Location types matching backend API response

export interface Location {
    id: string;
    name: string;
    region: string | null;
    country: string;
    latitude: number | null;
    longitude: number | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface LocationFilters {
    search?: string;
    country?: string;
    region?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}

export interface LocationsResponse {
    items: Location[];
    pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export interface CreateLocationInput {
    name: string;
    region?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
}

export interface UpdateLocationInput {
    name?: string;
    region?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    isActive?: boolean;
}
