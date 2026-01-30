/**
 * Search module types
 */

export type SearchCategory = 'all' | 'tours' | 'guides' | 'drivers' | 'companies';

export type SortBy = 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';

export interface SearchFilters {
    locationId?: string;
    category?: SearchCategory;
    query?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    verified?: boolean;
    available?: boolean;
    sortBy?: SortBy;
    page?: number;
    limit?: number;
}

export interface LocationSearchResult {
    id: string;
    name: string;
    region: string | null;
    country: string;
}

export interface LocationStats {
    tours: number;
    guides: number;
    drivers: number;
}

export interface SearchResultCounts {
    tours: number;
    guides: number;
    drivers: number;
    companies: number;
    total: number;
}

export interface TourSearchResult {
    id: string;
    title: string;
    summary: string | null;
    price: number;
    currency: string;
    durationMinutes: number | null;
    maxPeople: number | null;
    difficulty: string | null;
    category: string | null;
    isFeatured: boolean;
    locations: Array<{ id: string; name: string }>;
    owner: { id: string; firstName: string; lastName: string };
    company?: { id: string; companyName: string } | null;
    averageRating: number | null;
    reviewCount: number;
    createdAt: string;
}

export interface GuideSearchResult {
    id: string;
    userId: string;
    user: { id: string; firstName: string; lastName: string };
    bio: string | null;
    languages: string[];
    yearsOfExperience: number | null;
    photoUrl: string | null;
    isVerified: boolean;
    isAvailable: boolean;
    locations: Array<{ id: string; name: string }>;
    averageRating: number | null;
    reviewCount: number;
    createdAt: string;
}

export interface DriverSearchResult {
    id: string;
    userId: string;
    user: { id: string; firstName: string; lastName: string };
    bio: string | null;
    vehicleType: string | null;
    vehicleCapacity: number | null;
    vehicleMake: string | null;
    vehicleModel: string | null;
    vehicleYear: number | null;
    photoUrl: string | null;
    isVerified: boolean;
    isAvailable: boolean;
    locations: Array<{ id: string; name: string }>;
    averageRating: number | null;
    reviewCount: number;
    createdAt: string;
}

export interface CompanySearchResult {
    id: string;
    userId: string;
    companyName: string;
    description: string | null;
    logoUrl: string | null;
    websiteUrl: string | null;
    isVerified: boolean;
    tourCount: number;
    averageRating: number | null;
    reviewCount: number;
    createdAt: string;
}

export interface SearchResults {
    tours: TourSearchResult[];
    guides: GuideSearchResult[];
    drivers: DriverSearchResult[];
    companies: CompanySearchResult[];
    counts: SearchResultCounts;
    location?: { id: string; name: string; region: string | null };
}
