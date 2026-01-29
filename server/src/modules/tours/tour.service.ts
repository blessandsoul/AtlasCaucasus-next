import type { JwtUser } from "../auth/auth.types.js";
import type { SafeTour, CreateTourData, UpdateTourData } from "./tour.types.js";
import {
  createTour,
  getTourById,
  listToursByOwner,
  countToursByOwner,
  updateTour,
  softDeleteTour,
  listAllActiveTours,
  countAllActiveTours,
  listToursByCompany,
  countToursByCompany,
  type TourFilters,
} from "./tour.repo.js";
import { NotFoundError, ForbiddenError, BadRequestError } from "../../libs/errors.js";
import { deleteTourImages } from "../media/media.helpers.js";
import { findById as getCompanyById } from "../companies/company.repo.js";

function assertOwnerOrAdmin(tour: SafeTour, currentUser: JwtUser): void {
  const isOwner = tour.ownerId === currentUser.id;
  const isAdmin = currentUser.roles.includes("ADMIN");

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError("You can only modify your own tours", "NOT_TOUR_OWNER");
  }
}

export async function createTourForUser(
  currentUser: JwtUser,
  data: CreateTourData,
): Promise<SafeTour> {
  // Validate companyId ownership if provided
  if (data.companyId) {
    const company = await getCompanyById(data.companyId);

    if (!company) {
      throw new BadRequestError("Company not found", "COMPANY_NOT_FOUND");
    }

    // User must own the company or be an admin
    const isOwner = (company as any).userId === currentUser.id;
    const isAdmin = currentUser.roles.includes("ADMIN");

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError(
        "You can only create tours for your own company",
        "NOT_COMPANY_OWNER"
      );
    }
  }

  return createTour(currentUser.id, data);
}

export async function getTourByIdPublic(id: string): Promise<SafeTour | null> {
  const tour = await getTourById(id);

  if (!tour || !tour.isActive) {
    return null;
  }

  return tour;
}

export async function getTourByIdForOwner(
  currentUser: JwtUser,
  id: string,
): Promise<SafeTour> {
  const tour = await getTourById(id);

  if (!tour) {
    throw new NotFoundError("Tour not found", "TOUR_NOT_FOUND");
  }

  assertOwnerOrAdmin(tour, currentUser);

  return tour;
}

export async function listMyTours(
  currentUser: JwtUser,
  page: number,
  limit: number,
  includeInactive: boolean = false
): Promise<{ items: SafeTour[]; totalItems: number }> {
  const offset = (page - 1) * limit;

  const items = await listToursByOwner(
    currentUser.id,
    offset,
    limit,
    includeInactive
  );

  const totalItems = await countToursByOwner(currentUser.id, includeInactive);

  return { items, totalItems };
}

export async function updateTourForUser(
  currentUser: JwtUser,
  id: string,
  data: UpdateTourData,
): Promise<SafeTour> {
  const tour = await getTourById(id);

  if (!tour) {
    throw new NotFoundError("Tour not found", "TOUR_NOT_FOUND");
  }

  assertOwnerOrAdmin(tour, currentUser);

  const updated = await updateTour(id, data);

  if (!updated) {
    throw new NotFoundError("Tour not found", "TOUR_NOT_FOUND");
  }

  return updated;
}

export async function softDeleteTourForUser(
  currentUser: JwtUser,
  id: string,
): Promise<SafeTour> {
  const tour = await getTourById(id);

  if (!tour) {
    throw new NotFoundError("Tour not found", "TOUR_NOT_FOUND");
  }

  assertOwnerOrAdmin(tour, currentUser);

  // Delete associated media files before soft deleting tour
  await deleteTourImages(id);

  const deleted = await softDeleteTour(id);

  if (!deleted) {
    throw new NotFoundError("Tour not found", "TOUR_NOT_FOUND");
  }

  return deleted;
}

export async function listAllToursPublic(
  page: number,
  limit: number,
  filters?: TourFilters
): Promise<{ items: SafeTour[]; totalItems: number }> {
  const offset = (page - 1) * limit;

  const items = await listAllActiveTours(offset, limit, filters);
  const totalItems = await countAllActiveTours(filters);

  return { items, totalItems };
}

export async function listCompanyToursPublic(
  companyId: string,
  page: number,
  limit: number
): Promise<{ items: SafeTour[]; totalItems: number }> {
  const offset = (page - 1) * limit;

  const items = await listToursByCompany(companyId, offset, limit);
  const totalItems = await countToursByCompany(companyId);

  return { items, totalItems };
}
