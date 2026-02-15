/**
 * Helper utilities for seed data generation
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a UUID
 */
export function uuid(): string {
  return uuidv4();
}

/**
 * Get a random item from an array
 */
export function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get multiple random items from an array (no duplicates)
 */
export function randomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Get a random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get a random decimal between min and max
 */
export function randomDecimal(min: number, max: number, decimals: number = 2): number {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimals));
}

/**
 * Get a random boolean with optional probability (default 50%)
 */
export function randomBool(probability: number = 0.5): boolean {
  return Math.random() < probability;
}

/**
 * Get a random date between two dates
 */
export function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

/**
 * Get a date in the future (from now)
 */
export function futureDate(daysAhead: number = 30): Date {
  const date = new Date();
  date.setDate(date.getDate() + randomInt(1, daysAhead));
  return date;
}

/**
 * Get a date in the past (from now)
 */
export function pastDate(daysAgo: number = 30): Date {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(1, daysAgo));
  return date;
}

/**
 * Generate a phone number in Georgian format
 */
export function randomPhoneNumber(): string {
  const prefixes = ['555', '557', '558', '568', '571', '574', '577', '591', '592', '593', '595', '597', '598', '599'];
  const prefix = randomItem(prefixes);
  const number = randomInt(100000, 999999).toString();
  return `+995 ${prefix} ${number.slice(0, 2)} ${number.slice(2, 4)} ${number.slice(4)}`;
}

/**
 * Generate a random Georgian car license plate
 */
export function randomLicensePlate(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const region = randomItem(['AA', 'AB', 'BA', 'BB', 'CC', 'GG', 'II', 'KK', 'MM', 'PP', 'QQ', 'RR', 'SS', 'TT', 'UU', 'VV', 'WW', 'XX', 'ZZ']);
  const numbers = randomInt(100, 999).toString();
  const suffix = letters[randomInt(0, letters.length - 1)] + letters[randomInt(0, letters.length - 1)] + letters[randomInt(0, letters.length - 1)];
  return `${region}-${numbers}-${suffix}`;
}

/**
 * Get random image URL from seed-assets folder
 */
export function randomImageUrl(index?: number): string {
  const imageNum = index ?? randomInt(881, 1507);
  return `/seed-assets/image-${imageNum}.jpg`;
}

/**
 * Get multiple random image URLs
 */
export function randomImageUrls(count: number, startIndex?: number): string[] {
  const urls: string[] = [];
  if (startIndex !== undefined) {
    for (let i = 0; i < count; i++) {
      urls.push(`/seed-assets/image-${startIndex + i}.jpg`);
    }
  } else {
    for (let i = 0; i < count; i++) {
      urls.push(`/seed-assets/image-${randomInt(881, 1507)}.jpg`);
    }
  }
  return urls;
}

/**
 * Generate realistic rating (weighted towards higher ratings)
 * Tourism services typically have 4-5 star ratings
 */
export function randomRating(): number {
  const weights = [0.02, 0.03, 0.10, 0.30, 0.55]; // 1-5 star distribution
  const random = Math.random();
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (random < sum) return i + 1;
  }
  return 5;
}

/**
 * Calculate average rating from array of ratings
 */
export function calculateAverageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((a, b) => a + b, 0);
  return Number((sum / ratings.length).toFixed(2));
}

/**
 * Generate a slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Shuffle an array (Fisher-Yates algorithm)
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Chunk an array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Wait for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format a date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Generate a booking reference number (e.g., BK-260210-A3F2)
 */
let bookingRefCounter = 0;
export function generateBookingRef(): string {
  const date = new Date();
  const yy = date.getFullYear().toString().slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  bookingRefCounter++;
  return `BK-${yy}${mm}${dd}-${suffix}${bookingRefCounter}`;
}

/**
 * Fill a template string with variable values
 * e.g. fillTemplate("Hello {name}!", { name: "World" }) => "Hello World!"
 */
export function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

/**
 * Create a progress logger
 */
export function createProgressLogger(total: number, label: string) {
  let current = 0;
  return {
    increment: () => {
      current++;
      if (current % 10 === 0 || current === total) {
        console.log(`  ${label}: ${current}/${total}`);
      }
    },
    done: () => {
      console.log(`  ✓ ${label}: ${total} created`);
    },
  };
}
