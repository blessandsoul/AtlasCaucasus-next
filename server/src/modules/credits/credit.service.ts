import type { JwtUser } from "../auth/auth.types.js";
import type { SafeCreditBalance, SafeCreditTransaction } from "./credit.types.js";
import type { ServicePaginatedResult } from "../../libs/pagination.js";
import { ForbiddenError } from "../../libs/errors.js";
import {
  getOrCreateBalance,
  deductCredits,
  refundCredits as refundCreditsRepo,
  grantCredits as grantCreditsRepo,
  listTransactions,
  countTransactions,
} from "./credit.repo.js";

/**
 * Get the credit balance for the authenticated user.
 * Creates a balance record with initial credits if none exists.
 */
export async function getCreditBalance(user: JwtUser): Promise<SafeCreditBalance> {
  return getOrCreateBalance(user.id);
}

/**
 * Get paginated credit transaction history for the authenticated user.
 */
export async function getCreditHistory(
  user: JwtUser,
  page: number,
  limit: number,
): Promise<ServicePaginatedResult<SafeCreditTransaction>> {
  const skip = (page - 1) * limit;

  const [items, totalItems] = await Promise.all([
    listTransactions(user.id, skip, limit),
    countTransactions(user.id),
  ]);

  return { items, totalItems };
}

/**
 * Reserve credits before a generation (deducts atomically).
 * Returns the transaction for potential refund reference.
 */
export async function reserveCredits(
  userId: string,
  amount: number,
  description: string,
  metadata?: string,
): Promise<SafeCreditTransaction> {
  return deductCredits(userId, amount, description, metadata);
}

/**
 * Refund credits on generation failure.
 */
export async function refundCredits(
  userId: string,
  amount: number,
  description: string,
  metadata?: string,
): Promise<SafeCreditTransaction> {
  return refundCreditsRepo(userId, amount, description, metadata);
}

/**
 * Admin-only: grant credits to a specific user.
 */
export async function adminGrantCredits(
  adminUser: JwtUser,
  targetUserId: string,
  amount: number,
  description: string,
): Promise<SafeCreditTransaction> {
  if (!adminUser.roles.includes("ADMIN")) {
    throw new ForbiddenError("Only admins can grant credits", "FORBIDDEN");
  }

  return grantCreditsRepo(
    targetUserId,
    amount,
    "ADMIN_GRANT",
    description,
    JSON.stringify({ grantedBy: adminUser.id }),
  );
}
