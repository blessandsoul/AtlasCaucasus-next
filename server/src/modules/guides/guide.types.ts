import type { Guide, User, Location } from "@prisma/client";
import type { SafeMedia } from "../media/media.types.js";

export type { Guide };

export interface GuideResponse extends Guide {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        emailVerified: boolean;
    };
    locations: Location[];
    photos?: SafeMedia[]; // Media photos associated with guide
}

export interface UpdateGuideData {
    bio?: string;
    languages?: string[];
    yearsOfExperience?: number;
    photoUrl?: string;
    phoneNumber?: string;
    isVerified?: boolean;
    isAvailable?: boolean;
    locationIds?: string[];
}

export interface GuideFilters {
    locationId?: string;
    language?: string;
    isVerified?: boolean;
    isAvailable?: boolean;
    minExperience?: number;
    search?: string;
    minRating?: number;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'newest' | 'rating' | 'experience' | 'price' | 'price_desc';
}
