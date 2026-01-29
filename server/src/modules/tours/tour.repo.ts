import { prisma } from "../../libs/prisma.js";
import type { Tour as PrismaTour } from "@prisma/client";
import type { CreateTourData, UpdateTourData, SafeTour, TourDifficulty } from "./tour.types.js";
import { getMediaByEntity, getMediaByEntityIds } from "../media/media.repo.js";
import type { SafeMedia } from "../media/media.types.js";
import { logger } from "../../libs/logger.js";

// Convert Prisma Tour to SafeTour
function toSafeTour(tour: PrismaTour): SafeTour {
  return {
    id: tour.id,
    ownerId: tour.ownerId,
    companyId: tour.companyId,
    title: tour.title,
    summary: tour.summary,
    description: tour.description,
    price: tour.price.toString(),
    currency: tour.currency,
    city: tour.city,
    startLocation: tour.startLocation,
    originalPrice: tour.originalPrice?.toString() ?? null,
    durationMinutes: tour.durationMinutes,
    maxPeople: tour.maxPeople,
    difficulty: tour.difficulty,
    category: tour.category,
    isActive: tour.isActive,
    isInstantBooking: tour.isInstantBooking,
    hasFreeCancellation: tour.hasFreeCancellation,
    isFeatured: tour.isFeatured,
    createdAt: tour.createdAt,
    updatedAt: tour.updatedAt,
    nextAvailableDate: tour.nextAvailableDate,
    startDate: tour.startDate,
  };
}

// Convert Prisma Tour to SafeTour with media (single tour - still makes individual query)
async function toSafeTourWithMedia(tour: PrismaTour): Promise<SafeTour> {
  const safeTour = toSafeTour(tour);
  const media = await getMediaByEntity("tour", tour.id);
  return {
    ...safeTour,
    images: media,
  };
}

// Batch convert multiple tours with media (solves N+1 query problem)
async function toSafeToursWithMediaBatch(tours: PrismaTour[]): Promise<SafeTour[]> {
  if (tours.length === 0) {
    return [];
  }

  // Batch fetch all media for all tours in a single query
  const tourIds = tours.map(t => t.id);
  const mediaMap = await getMediaByEntityIds("tour", tourIds);

  // Map each tour to SafeTour with its media
  return tours.map(tour => {
    const safeTour = toSafeTour(tour);
    const tourMedia = mediaMap.get(tour.id) || [];
    return {
      ...safeTour,
      images: tourMedia,
    };
  });
}

export async function createTour(
  ownerId: string,
  data: CreateTourData
): Promise<SafeTour> {
  // Convert and validate price
  const priceValue = typeof data.price === 'string' ? parseFloat(data.price) : data.price;
  const originalPriceValue = data.originalPrice ? (typeof data.originalPrice === 'string' ? parseFloat(data.originalPrice) : data.originalPrice) : null;

  // Log for debugging
  logger.debug({ priceValue, originalPriceValue }, "Creating tour with price values");

  // Validate price is within DECIMAL(10,2) range
  if (isNaN(priceValue) || priceValue < 0 || priceValue > 99999999.99) {
    throw new Error(`Invalid price value: ${priceValue}. Must be between 0 and 99999999.99`);
  }

  const tour = await prisma.tour.create({
    data: {
      ownerId,
      companyId: data.companyId ?? null,
      title: data.title,
      summary: data.summary ?? null,
      description: data.description ?? null,
      price: priceValue,
      currency: data.currency ?? "GEL",
      city: data.city ?? null,
      startLocation: data.startLocation ?? null,
      originalPrice: originalPriceValue,
      durationMinutes: data.durationMinutes ?? null,
      maxPeople: data.maxPeople ?? null,
      difficulty: data.difficulty as TourDifficulty ?? null,
      category: data.category ?? null,
      isActive: data.isActive ?? true,
      isInstantBooking: data.isInstantBooking ?? false,
      hasFreeCancellation: data.hasFreeCancellation ?? false,
      isFeatured: data.isFeatured ?? false,
      nextAvailableDate: data.nextAvailableDate ?? null,
      startDate: data.startDate ?? null,
    },
  });

  return toSafeTour(tour);
}

export async function getTourById(id: string): Promise<SafeTour | null> {
  const tour = await prisma.tour.findUnique({
    where: { id },
  });

  return tour ? await toSafeTourWithMedia(tour) : null;
}

export async function listToursByOwner(
  ownerId: string,
  skip: number,
  take: number,
  includeInactive: boolean = false
): Promise<SafeTour[]> {
  const tours = await prisma.tour.findMany({
    where: {
      ownerId,
      isActive: includeInactive ? undefined : true,
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });

  // Use batch fetch to avoid N+1 queries
  return toSafeToursWithMediaBatch(tours);
}

export async function countToursByOwner(
  ownerId: string,
  includeInactive: boolean = false
): Promise<number> {
  return prisma.tour.count({
    where: {
      ownerId,
      isActive: includeInactive ? undefined : true,
    },
  });
}

export async function updateTour(
  id: string,
  data: UpdateTourData
): Promise<SafeTour | null> {
  try {
    const tour = await prisma.tour.update({
      where: { id },
      data: {
        title: data.title,
        summary: data.summary,
        description: data.description,
        price: data.price ? (typeof data.price === 'string' ? parseFloat(data.price) : data.price) : undefined,
        currency: data.currency,
        city: data.city,
        startLocation: data.startLocation,
        originalPrice: data.originalPrice !== undefined ? (data.originalPrice === null ? null : (typeof data.originalPrice === 'string' ? parseFloat(data.originalPrice) : data.originalPrice)) : undefined,
        durationMinutes: data.durationMinutes,
        maxPeople: data.maxPeople,
        difficulty: data.difficulty as TourDifficulty,
        category: data.category,
        isActive: data.isActive,
        isInstantBooking: data.isInstantBooking,
        hasFreeCancellation: data.hasFreeCancellation,
        isFeatured: data.isFeatured,
        nextAvailableDate: data.nextAvailableDate,
        startDate: data.startDate,
      },
    });

    return toSafeTour(tour);
  } catch (err: unknown) {
    // If not found, Prisma throws P2025
    if ((err as { code?: string }).code === "P2025") {
      return null;
    }
    throw err;
  }
}

export async function softDeleteTour(id: string): Promise<SafeTour | null> {
  try {
    const tour = await prisma.tour.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return toSafeTour(tour);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      return null;
    }
    throw err;
  }
}

// ==========================================
// TOUR LOCATIONS (Many-to-Many)
// ==========================================

export async function addTourLocation(
  tourId: string,
  locationId: string,
  order: number = 0
): Promise<void> {
  await prisma.tourLocation.upsert({
    where: {
      tourId_locationId: {
        tourId,
        locationId,
      },
    },
    update: { order },
    create: {
      tourId,
      locationId,
      order,
    },
  });
}

export async function removeTourLocation(
  tourId: string,
  locationId: string
): Promise<void> {
  await prisma.tourLocation.delete({
    where: {
      tourId_locationId: {
        tourId,
        locationId,
      },
    },
  }).catch(() => {
    // Ignore if not found
  });
}

export async function getTourLocations(tourId: string): Promise<string[]> {
  const locations = await prisma.tourLocation.findMany({
    where: { tourId },
    orderBy: { order: "asc" },
    select: { locationId: true },
  });

  return locations.map((l) => l.locationId);
}

// ==========================================
// PUBLIC TOUR LISTING (All Active Tours)
// ==========================================

export interface TourFilters {
  search?: string;
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
  sortBy?: 'newest' | 'rating' | 'price' | 'price_desc';
}

// Shared filter builder to avoid duplication between list and count functions
function buildTourFilters(filters?: TourFilters): Record<string, unknown> {
  const where: Record<string, unknown> = {
    isActive: true,
  };

  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { summary: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }

  if (filters?.category) {
    where.category = filters.category;
  }

  if (filters?.difficulty) {
    where.difficulty = filters.difficulty;
  }

  if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
    const priceFilter: Record<string, number> = {};
    if (filters.minPrice !== undefined) {
      priceFilter.gte = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      priceFilter.lte = filters.maxPrice;
    }
    where.price = priceFilter;
  }

  // Filter by location (via TourLocation junction table)
  if (filters?.locationId) {
    where.locations = {
      some: {
        locationId: filters.locationId,
      },
    };
  }

  // Minimum rating filter
  if (filters?.minRating !== undefined) {
    where.averageRating = {
      gte: filters.minRating,
    };
  }

  // Duration range filter (in minutes)
  if (filters?.minDuration !== undefined || filters?.maxDuration !== undefined) {
    const durationFilter: Record<string, number> = {};
    if (filters.minDuration !== undefined) {
      durationFilter.gte = filters.minDuration;
    }
    if (filters.maxDuration !== undefined) {
      durationFilter.lte = filters.maxDuration;
    }
    where.durationMinutes = durationFilter;
  }

  // Max people filter (tours that can accommodate at least this many people)
  if (filters?.maxPeople !== undefined) {
    where.maxPeople = {
      gte: filters.maxPeople,
    };
  }

  // Featured filter
  if (filters?.isFeatured !== undefined) {
    where.isFeatured = filters.isFeatured;
  }

  return where;
}

// Get sort order based on sortBy parameter
function getTourSortOrder(sortBy?: string): any[] {
  switch (sortBy) {
    case 'rating':
      return [{ averageRating: 'desc' }, { createdAt: 'desc' }];
    case 'price':
      return [{ price: 'asc' }, { createdAt: 'desc' }];
    case 'price_desc':
      return [{ price: 'desc' }, { createdAt: 'desc' }];
    case 'newest':
    default:
      return [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
  }
}

export async function listAllActiveTours(
  skip: number,
  take: number,
  filters?: TourFilters
): Promise<SafeTour[]> {
  const where = buildTourFilters(filters);
  const orderBy = getTourSortOrder(filters?.sortBy);

  const tours = await prisma.tour.findMany({
    where,
    orderBy,
    skip,
    take,
  });

  // Use batch fetch to avoid N+1 queries
  return toSafeToursWithMediaBatch(tours);
}

export async function countAllActiveTours(filters?: TourFilters): Promise<number> {
  const where = buildTourFilters(filters);
  return prisma.tour.count({ where });
}

// ==========================================
// PUBLIC COMPANY TOURS (Active Tours by Company)
// ==========================================

export async function listToursByCompany(
  companyId: string,
  skip: number,
  take: number
): Promise<SafeTour[]> {
  // First get the company to find the userId
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { userId: true },
  });

  if (!company) {
    return [];
  }

  // Find tours where either companyId matches OR ownerId matches the company's userId
  const tours = await prisma.tour.findMany({
    where: {
      isActive: true,
      OR: [
        { companyId },
        { ownerId: company.userId },
      ],
    },
    orderBy: [
      { isFeatured: "desc" },
      { createdAt: "desc" },
    ],
    skip,
    take,
  });

  // Use batch fetch to avoid N+1 queries
  return toSafeToursWithMediaBatch(tours);
}

export async function countToursByCompany(companyId: string): Promise<number> {
  // First get the company to find the userId
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { userId: true },
  });

  if (!company) {
    return 0;
  }

  // Count tours where either companyId matches OR ownerId matches the company's userId
  return prisma.tour.count({
    where: {
      isActive: true,
      OR: [
        { companyId },
        { ownerId: company.userId },
      ],
    },
  });
}
