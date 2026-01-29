import type { FastifyRequest, FastifyReply } from "fastify";
import { successResponse, paginatedResponse } from "../../libs/response.js";
import { PaginationSchema } from "../../libs/pagination.js";
import { ValidationError, NotFoundError } from "../../libs/errors.js";
import {
  createTourForUser,
  getTourByIdPublic,
  listMyTours,
  updateTourForUser,
  softDeleteTourForUser,
  listAllToursPublic,
  listCompanyToursPublic,
} from "./tour.service.js";
import {
  createTourSchema,
  updateTourSchema,
  listAllToursQuerySchema,
} from "./tour.schemas.js";

interface IdParams {
  id: string;
}

export async function createTourHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = createTourSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const tour = await createTourForUser(request.user, parsed.data);

  return reply.status(201).send(successResponse("Tour created successfully", tour));
}

export async function getTourByIdHandler(
  request: FastifyRequest<{ Params: IdParams }>,
  reply: FastifyReply,
): Promise<void> {
  const { id } = request.params;

  const tour = await getTourByIdPublic(id);

  if (!tour) {
    throw new NotFoundError("Tour not found", "TOUR_NOT_FOUND");
  }

  return reply.send(successResponse("Tour retrieved successfully", tour));
}

export async function listMyToursHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  // Validate pagination params
  const paginationParsed = PaginationSchema.safeParse(request.query);
  if (!paginationParsed.success) {
    throw new ValidationError(paginationParsed.error.errors[0].message);
  }

  const { page, limit } = paginationParsed.data;

  // Parse includeInactive from query
  const includeInactive = request.query &&
    typeof request.query === 'object' &&
    'includeInactive' in request.query
    ? String(request.query.includeInactive) === 'true'
    : false;

  const { items, totalItems } = await listMyTours(
    request.user,
    page,
    limit,
    includeInactive
  );

  return reply.send(
    paginatedResponse("Tours retrieved successfully", items, page, limit, totalItems)
  );
}

export async function updateTourHandler(
  request: FastifyRequest<{ Params: IdParams }>,
  reply: FastifyReply,
): Promise<void> {
  const { id } = request.params;

  const parsed = updateTourSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const tour = await updateTourForUser(request.user, id, parsed.data);

  return reply.send(successResponse("Tour updated successfully", tour));
}

export async function deleteTourHandler(
  request: FastifyRequest<{ Params: IdParams }>,
  reply: FastifyReply,
): Promise<void> {
  const { id } = request.params;

  const tour = await softDeleteTourForUser(request.user, id);

  return reply.send(successResponse("Tour deleted successfully", tour));
}

export async function listAllToursHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  // Validate query params
  const parsed = listAllToursQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const { page, limit, search, category, difficulty, minPrice, maxPrice, locationId } = parsed.data;

  // Build filters object
  const filters = {
    search,
    category,
    difficulty,
    minPrice,
    maxPrice,
    locationId,
  };

  const { items, totalItems } = await listAllToursPublic(page, limit, filters);

  return reply.send(
    paginatedResponse("Tours retrieved successfully", items, page, limit, totalItems)
  );
}

export async function listCompanyToursHandler(
  request: FastifyRequest<{ Params: IdParams }>,
  reply: FastifyReply,
): Promise<void> {
  const { id } = request.params;

  // Validate pagination params
  const paginationParsed = PaginationSchema.safeParse(request.query);
  if (!paginationParsed.success) {
    throw new ValidationError(paginationParsed.error.errors[0].message);
  }

  const { page, limit } = paginationParsed.data;

  const { items, totalItems } = await listCompanyToursPublic(id, page, limit);

  return reply.send(
    paginatedResponse("Company tours retrieved successfully", items, page, limit, totalItems)
  );
}
