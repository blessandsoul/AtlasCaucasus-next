import type { Driver, User, Location } from "@prisma/client";
import type { SafeMedia } from "../media/media.types.js";

export type { Driver };

export interface DriverResponse extends Driver {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        emailVerified: boolean;
    };
    locations: Location[];
    photos?: SafeMedia[]; // Media photos associated with driver
}

export interface UpdateDriverData {
    bio?: string;
    vehicleType?: string;
    vehicleCapacity?: number;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: number;
    licenseNumber?: string;
    photoUrl?: string;
    phoneNumber?: string;
    isVerified?: boolean;
    isAvailable?: boolean;
    locationIds?: string[];
}

export interface DriverFilters {
    locationId?: string;
    vehicleType?: string;
    minCapacity?: number;
    isVerified?: boolean;
    isAvailable?: boolean;
    search?: string;
    minRating?: number;
    sortBy?: 'newest' | 'rating' | 'capacity';
}
