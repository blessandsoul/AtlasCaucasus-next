/**
 * Search module types for the Tourism Server aggregator
 */

export enum SearchCategory {
    ALL = "all",
    TOURS = "tours",
    GUIDES = "guides",
    DRIVERS = "drivers",
    COMPANIES = "companies",
}

export enum SortBy {
    RELEVANCE = "relevance",
    PRICE_ASC = "price_asc",
    PRICE_DESC = "price_desc",
    RATING = "rating",
    NEWEST = "newest",
}

export interface SearchFilters {
    locationId?: string;
    category?: SearchCategory;
    query?: string; // Text search
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    verified?: boolean;
    available?: boolean;
    sortBy?: SortBy;
}

export interface SearchResults {
    tours: TourSearchResult[];
    guides: GuideSearchResult[];
    drivers: DriverSearchResult[];
    companies: CompanySearchResult[];
    counts: {
        tours: number;
        guides: number;
        drivers: number;
        companies: number;
        total: number;
    };
    location?: {
        id: string;
        name: string;
        region: string | null;
    };
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
    locations: Array<{
        id: string;
        name: string;
    }>;
    owner: {
        id: string;
        firstName: string;
        lastName: string;
    };
    company?: {
        id: string;
        companyName: string;
    } | null;
    averageRating: number | null;
    reviewCount: number;
    createdAt: Date;
}

export interface GuideSearchResult {
    id: string;
    userId: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
    };
    bio: string | null;
    languages: string[];
    yearsOfExperience: number | null;
    photoUrl: string | null;
    isVerified: boolean;
    isAvailable: boolean;
    locations: Array<{
        id: string;
        name: string;
    }>;
    averageRating: number | null;
    reviewCount: number;
    createdAt: Date;
}

export interface DriverSearchResult {
    id: string;
    userId: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
    };
    bio: string | null;
    vehicleType: string | null;
    vehicleCapacity: number | null;
    vehicleMake: string | null;
    vehicleModel: string | null;
    vehicleYear: number | null;
    photoUrl: string | null;
    isVerified: boolean;
    isAvailable: boolean;
    locations: Array<{
        id: string;
        name: string;
    }>;
    averageRating: number | null;
    reviewCount: number;
    createdAt: Date;
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
    createdAt: Date;
}

export interface LocationSearchResult {
    id: string;
    name: string;
    region: string | null;
    country: string;
}
