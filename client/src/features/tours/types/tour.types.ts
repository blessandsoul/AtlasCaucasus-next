// Tour types matching backend API response

export type TourDifficulty = 'easy' | 'moderate' | 'challenging';
export type AvailabilityType = 'DAILY' | 'WEEKDAYS' | 'WEEKENDS' | 'SPECIFIC_DATES' | 'BY_REQUEST';

export interface ItineraryStep {
    title: string;
    description: string;
}

export interface Tour {
    id: string;
    ownerId: string;
    companyId: string | null;
    title: string;
    summary: string | null;
    description: string | null;
    price: string;
    currency: string;
    city: string | null;
    startLocation: string | null;
    originalPrice: string | null;
    durationMinutes: number | null;
    maxPeople: number | null;
    difficulty: TourDifficulty | null;
    category: string | null;
    isActive: boolean;
    isInstantBooking: boolean;
    hasFreeCancellation: boolean;
    isFeatured: boolean;
    createdAt: string;
    updatedAt: string;
    nextAvailableDate: string | null;
    startDate: string | null;
    availabilityType: AvailabilityType;
    availableDates: string[] | null;
    startTime: string | null;
    itinerary: ItineraryStep[] | null;
    images?: TourImage[];
    averageRating: string | null;
    reviewCount: number;
}

export interface TourImage {
    id: string;
    url: string;
    altText?: string;
    order?: number;
}

export interface TourFilters {
    search?: string;
    city?: string;
    category?: string;
    difficulty?: string;
    minPrice?: number;
    maxPrice?: number;
    locationId?: string;
    minRating?: number;
    minDuration?: number;
    maxDuration?: number;
    maxPeople?: number;
    isFeatured?: boolean;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: 'newest' | 'rating' | 'price' | 'price_desc';
    page?: number;
    limit?: number;
}

export interface ToursResponse {
    items: Tour[];
    pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export interface CreateTourInput {
    title: string;
    price: number;
    summary?: string;
    currency?: string;
    city?: string;
    startLocation?: string;
    originalPrice?: number;
    durationMinutes?: number;
    maxPeople?: number;
    isInstantBooking?: boolean;
    hasFreeCancellation?: boolean;
    nextAvailableDate?: string;
    startDate?: string;
    availabilityType?: AvailabilityType;
    availableDates?: string[];
    startTime?: string;
    itinerary?: ItineraryStep[];
}

export interface UpdateTourInput {
    title?: string;
    price?: number;
    summary?: string | null;
    description?: string | null;
    currency?: string;
    city?: string | null;
    startLocation?: string | null;
    originalPrice?: number | null;
    durationMinutes?: number | null;
    maxPeople?: number | null;
    difficulty?: TourDifficulty | null;
    category?: string | null;
    isActive?: boolean;
    isInstantBooking?: boolean;
    hasFreeCancellation?: boolean;
    isFeatured?: boolean;
    nextAvailableDate?: string | null;
    startDate?: string | null;
    availabilityType?: AvailabilityType;
    availableDates?: string[] | null;
    startTime?: string | null;
    itinerary?: ItineraryStep[] | null;
}

export interface MyToursParams {
    page?: number;
    limit?: number;
    includeInactive?: boolean;
}
