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

export type AnalyticsEntityType = 'TOUR' | 'GUIDE' | 'DRIVER' | 'COMPANY';
