import type { CreditTransactionType } from "@prisma/client";

export interface SafeCreditBalance {
  id: string;
  userId: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeCreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: CreditTransactionType;
  description: string | null;
  metadata: string | null;
  balanceAfter: number;
  createdAt: Date;
}
