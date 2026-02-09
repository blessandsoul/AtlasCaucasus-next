import type { CreditTransactionType } from "@prisma/client";
import { prisma } from "../../libs/prisma.js";
import { env } from "../../config/env.js";
import { BadRequestError } from "../../libs/errors.js";
import type { SafeCreditBalance, SafeCreditTransaction } from "./credit.types.js";

/**
 * Get or create a credit balance for a user.
 * Uses upsert to atomically create with initial credits if not exists.
 */
export async function getOrCreateBalance(userId: string): Promise<SafeCreditBalance> {
  const initialCredits = env.AI_INITIAL_CREDITS;

  const balance = await prisma.$transaction(async (tx) => {
    const existing = await tx.creditBalance.findUnique({
      where: { userId },
    });

    if (existing) {
      return existing;
    }

    // Create balance with initial credits
    const created = await tx.creditBalance.create({
      data: {
        userId,
        balance: initialCredits,
      },
    });

    // Record the initial grant transaction
    if (initialCredits > 0) {
      await tx.creditTransaction.create({
        data: {
          userId,
          amount: initialCredits,
          type: "INITIAL_GRANT",
          description: "Welcome bonus credits",
          balanceAfter: initialCredits,
        },
      });
    }

    return created;
  });

  return balance;
}

/**
 * Get a user's credit balance (returns null if no balance record exists).
 */
export async function getBalance(userId: string): Promise<SafeCreditBalance | null> {
  return prisma.creditBalance.findUnique({
    where: { userId },
  });
}

/**
 * Atomically deduct credits from a user's balance.
 * Creates a transaction record for audit.
 * Throws BadRequestError if insufficient credits.
 */
export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  metadata?: string,
): Promise<SafeCreditTransaction> {
  return prisma.$transaction(async (tx) => {
    const balance = await tx.creditBalance.findUnique({
      where: { userId },
    });

    if (!balance || balance.balance < amount) {
      throw new BadRequestError("Insufficient credits", "INSUFFICIENT_CREDITS");
    }

    const newBalance = balance.balance - amount;

    await tx.creditBalance.update({
      where: { userId },
      data: { balance: newBalance },
    });

    const transaction = await tx.creditTransaction.create({
      data: {
        userId,
        amount: -amount,
        type: "GENERATION_DEBIT",
        description,
        metadata: metadata ?? null,
        balanceAfter: newBalance,
      },
    });

    return transaction;
  });
}

/**
 * Refund credits to a user's balance (e.g., on generation failure).
 */
export async function refundCredits(
  userId: string,
  amount: number,
  description: string,
  metadata?: string,
): Promise<SafeCreditTransaction> {
  return prisma.$transaction(async (tx) => {
    const balance = await tx.creditBalance.findUnique({
      where: { userId },
    });

    // If no balance exists, create one
    const currentBalance = balance?.balance ?? 0;
    const newBalance = currentBalance + amount;

    await tx.creditBalance.upsert({
      where: { userId },
      update: { balance: newBalance },
      create: { userId, balance: newBalance },
    });

    const transaction = await tx.creditTransaction.create({
      data: {
        userId,
        amount,
        type: "GENERATION_REFUND",
        description,
        metadata: metadata ?? null,
        balanceAfter: newBalance,
      },
    });

    return transaction;
  });
}

/**
 * Grant credits to a user (admin action or purchase).
 */
export async function grantCredits(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  description: string,
  metadata?: string,
): Promise<SafeCreditTransaction> {
  return prisma.$transaction(async (tx) => {
    const balance = await tx.creditBalance.findUnique({
      where: { userId },
    });

    const currentBalance = balance?.balance ?? 0;
    const newBalance = currentBalance + amount;

    await tx.creditBalance.upsert({
      where: { userId },
      update: { balance: newBalance },
      create: { userId, balance: newBalance },
    });

    const transaction = await tx.creditTransaction.create({
      data: {
        userId,
        amount,
        type,
        description,
        metadata: metadata ?? null,
        balanceAfter: newBalance,
      },
    });

    return transaction;
  });
}

/**
 * List credit transactions for a user (paginated, newest first).
 */
export async function listTransactions(
  userId: string,
  skip: number,
  take: number,
): Promise<SafeCreditTransaction[]> {
  return prisma.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });
}

/**
 * Count total credit transactions for a user.
 */
export async function countTransactions(userId: string): Promise<number> {
  return prisma.creditTransaction.count({
    where: { userId },
  });
}
