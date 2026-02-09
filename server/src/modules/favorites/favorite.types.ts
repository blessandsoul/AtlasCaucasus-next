export type FavoriteEntityType = "TOUR" | "GUIDE" | "DRIVER" | "COMPANY";

export interface CreateFavoriteData {
    userId: string;
    entityType: FavoriteEntityType;
    entityId: string;
}

export interface FavoriteFilters {
    entityType?: FavoriteEntityType;
}

export interface BatchCheckData {
    entityType: FavoriteEntityType;
    entityIds: string[];
}
