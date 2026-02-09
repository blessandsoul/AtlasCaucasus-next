import type { FastifyInstance } from "fastify";
import { authGuard, requireRole } from "../../middlewares/authGuard.js";
import {
  getMyBalanceHandler,
  getMyHistoryHandler,
  adminGrantCreditsHandler,
} from "./credit.controller.js";

export async function creditRoutes(fastify: FastifyInstance): Promise<void> {
  // Auth + verified: get current user's credit balance
  fastify.get(
    "/credits/balance",
    { preHandler: [authGuard] },
    getMyBalanceHandler,
  );

  // Auth + verified: get current user's credit transaction history
  fastify.get(
    "/credits/history",
    { preHandler: [authGuard] },
    getMyHistoryHandler,
  );

  // Admin only: grant credits to a user
  fastify.post(
    "/credits/grant",
    { preHandler: [authGuard, requireRole("ADMIN")] },
    adminGrantCreditsHandler,
  );
}
