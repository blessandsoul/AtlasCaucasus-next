export interface Location {
  id: string;
  city: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
}

export interface DriverMedia {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  entityType: string;
  entityId: string;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  userId: string;
  bio: string | null;
  vehicleType: string;
  vehicleCapacity: number;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  licenseNumber: string;
  photoUrl: string | null;
  phoneNumber: string | null;
  isVerified: boolean;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    emailVerified: boolean;
  };
  locations: Location[];
  photos?: DriverMedia[];
  avatarUrl: string | null; // Primary profile photo
  pricePerDay?: number;
  currency?: string;
  yearsOfExperience?: number;
  averageRating: string | null;
  reviewCount: number;
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
  page?: number;
  limit?: number;
}

export interface DriverPaginatedResponse {
  items: Driver[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
