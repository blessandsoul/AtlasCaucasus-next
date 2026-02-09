export type AnalyticsEntityType = 'TOUR' | 'GUIDE' | 'DRIVER' | 'COMPANY';

export interface ProviderAnalytics {
    views: {
        total: number;
        last30Days: number;
    };
    inquiries: {
        total: number;
        last30Days: number;
        responseRate: number;
    };
    favorites: {
        total: number;
    };
    bookings: {
        total: number;
        last30Days: number;
    };
    avgRating: number | null;
    reviewCount: number;
}

export interface ViewTrackingData {
    entityType: AnalyticsEntityType;
    entityId: string;
    userId?: string;
}

export interface ViewCountResult {
    total: number;
    last30Days: number;
}
