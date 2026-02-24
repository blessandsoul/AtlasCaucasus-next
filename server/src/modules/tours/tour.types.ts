import type { SafeMedia } from "../media/media.types.js";

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
  createdAt: Date;
  updatedAt: Date;
  nextAvailableDate: Date | null;
  startDate: Date | null;
  availabilityType: string;
  availableDates: string | null;
  startTime: string | null;
  itinerary: string | null;
}

export interface CreateTourData {
  title: string;
  price: string | number;
  companyId?: string | null;
  summary?: string | null;
  description?: string | null;
  currency?: string;
  city?: string | null;
  startLocation?: string | null;
  originalPrice?: string | number | null;
  durationMinutes?: number | null;
  maxPeople?: number | null;
  difficulty?: TourDifficulty | null;
  category?: string | null;
  isActive?: boolean;
  isInstantBooking?: boolean;
  hasFreeCancellation?: boolean;
  isFeatured?: boolean;
  nextAvailableDate?: Date | null;
  startDate?: Date | null;
  availabilityType?: AvailabilityType;
  availableDates?: string[] | null;
  startTime?: string | null;
  itinerary?: ItineraryStep[] | null;
}

export interface UpdateTourData {
  title?: string;
  summary?: string | null;
  description?: string | null;
  price?: string | number;
  currency?: string;
  city?: string | null;
  startLocation?: string | null;
  originalPrice?: string | number | null;
  durationMinutes?: number | null;
  maxPeople?: number | null;
  difficulty?: TourDifficulty | null;
  category?: string | null;
  isActive?: boolean;
  isInstantBooking?: boolean;
  hasFreeCancellation?: boolean;
  isFeatured?: boolean;
  nextAvailableDate?: Date | null;
  startDate?: Date | null;
  availabilityType?: AvailabilityType;
  availableDates?: string[] | null;
  startTime?: string | null;
  itinerary?: ItineraryStep[] | null;
}

export interface SafeTour {
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
  difficulty: string | null;
  category: string | null;
  isActive: boolean;
  isInstantBooking: boolean;
  hasFreeCancellation: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  nextAvailableDate: Date | null;
  startDate: Date | null;
  availabilityType: string;
  availableDates: string[] | null;
  startTime: string | null;
  itinerary: ItineraryStep[] | null;
  averageRating: string | null;
  reviewCount: number;
  images?: SafeMedia[]; // Media images associated with tour
}
