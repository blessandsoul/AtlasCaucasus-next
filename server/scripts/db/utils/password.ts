/**
 * Password hashing utility for seed scripts
 */

import * as argon2 from 'argon2';

// Default password for all seeded users
export const DEFAULT_PASSWORD = 'Password123!';

// Pre-hashed password (generated once to save time during seeding)
let cachedHash: string | null = null;

/**
 * Get the hashed password for seeding
 * Uses caching to avoid hashing the same password multiple times
 */
export async function getHashedPassword(): Promise<string> {
  if (cachedHash) {
    return cachedHash;
  }

  cachedHash = await argon2.hash(DEFAULT_PASSWORD, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  return cachedHash;
}

/**
 * Hash a custom password (for specific users)
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}
