import type { FastifyRequest, FastifyReply } from "fastify";
import { successResponse, paginatedResponse } from "../../libs/response.js";
import { PaginationSchema } from "../../libs/pagination.js";
import { ValidationError } from "../../libs/errors.js";
import { getCreditBalance, getCreditHistory, adminGrantCredits } from "./credit.service.js";
import { adminGrantCreditsSchema } from "./credit.schemas.js";

/**
 * GET /credits/balance — Get current user's credit balance.
 */
export async function getMyBalanceHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const balance = await getCreditBalance(request.user);
  return reply.send(successResponse("Credit balance retrieved successfully", balance));
}

/**
 * GET /credits/history — Get current user's credit transaction history (paginated).
 */
export async function getMyHistoryHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const paginationParsed = PaginationSchema.safeParse(request.query);
  if (!paginationParsed.success) {
    throw new ValidationError(paginationParsed.error.errors[0].message);
  }

  const { page, limit } = paginationParsed.data;
  const { items, totalItems } = await getCreditHistory(request.user, page, limit);

  return reply.send(
    paginatedResponse("Credit history retrieved successfully", items, page, limit, totalItems),
  );
}

/**
 * POST /credits/grant — Admin grants credits to a user.
 */
export async function adminGrantCreditsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = adminGrantCreditsSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const { userId, amount, description } = parsed.data;
  const transaction = await adminGrantCredits(request.user, userId, amount, description);

  return reply.status(201).send(
    successResponse("Credits granted successfully", transaction),
  );
}
