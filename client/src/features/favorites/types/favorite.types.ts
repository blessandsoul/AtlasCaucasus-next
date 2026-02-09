export type FavoriteEntityType = 'TOUR' | 'GUIDE' | 'DRIVER' | 'COMPANY';

export interface Favorite {
    id: string;
    userId: string;
    entityType: FavoriteEntityType;
    entityId: string;
    createdAt: string;
}

export interface FavoritesResponse {
    items: Favorite[];
    pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export interface BatchCheckResponse {
    favoritedIds: string[];
}

export interface CheckResponse {
    isFavorited: boolean;
}
