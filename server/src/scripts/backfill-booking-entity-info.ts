#!/usr/bin/env node

/**
 * One-time backfill script to populate entityName, entityImage,
 * providerUserId, providerName, and referenceNumber for all existing bookings.
 *
 * Usage:
 *   npx tsx src/scripts/backfill-booking-entity-info.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function generateBookingRef(): string {
  const date = new Date();
  const yy = date.getFullYear().toString().slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${yy}${mm}${dd}-${suffix}`;
}

async function generateUniqueRef(): Promise<string> {
  let ref = generateBookingRef();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await prisma.booking.findUnique({
      where: { referenceNumber: ref },
    });
    if (!existing) return ref;
    ref = generateBookingRef();
    attempts++;
  }
  throw new Error("Failed to generate unique reference number after 10 attempts");
}

interface EntityInfo {
  entityName: string | null;
  entityImage: string | null;
  providerUserId: string | null;
  providerName: string | null;
}

async function lookupEntityInfo(
  entityType: string,
  entityId: string
): Promise<EntityInfo> {
  switch (entityType) {
    case "TOUR": {
      const tour = await prisma.tour.findUnique({
        where: { id: entityId },
        select: {
          title: true,
          ownerId: true,
          owner: { select: { firstName: true, lastName: true } },
        },
      });
      if (!tour) return { entityName: null, entityImage: null, providerUserId: null, providerName: null };

      // Get the first tour image
      const media = await prisma.media.findFirst({
        where: { entityType: "tour", entityId },
        orderBy: { createdAt: "asc" },
        select: { url: true },
      });

      return {
        entityName: tour.title,
        entityImage: media?.url ?? null,
        providerUserId: tour.ownerId,
        providerName: `${tour.owner.firstName} ${tour.owner.lastName}`,
      };
    }
    case "GUIDE": {
      const guide = await prisma.guide.findUnique({
        where: { id: entityId },
        select: {
          userId: true,
          photoUrl: true,
          user: { select: { firstName: true, lastName: true } },
        },
      });
      if (!guide) return { entityName: null, entityImage: null, providerUserId: null, providerName: null };

      const name = `${guide.user.firstName} ${guide.user.lastName}`;
      return {
        entityName: name,
        entityImage: guide.photoUrl,
        providerUserId: guide.userId,
        providerName: name,
      };
    }
    case "DRIVER": {
      const driver = await prisma.driver.findUnique({
        where: { id: entityId },
        select: {
          userId: true,
          photoUrl: true,
          user: { select: { firstName: true, lastName: true } },
        },
      });
      if (!driver) return { entityName: null, entityImage: null, providerUserId: null, providerName: null };

      const name = `${driver.user.firstName} ${driver.user.lastName}`;
      return {
        entityName: name,
        entityImage: driver.photoUrl,
        providerUserId: driver.userId,
        providerName: name,
      };
    }
    default:
      return { entityName: null, entityImage: null, providerUserId: null, providerName: null };
  }
}

async function main(): Promise<void> {
  console.log("Starting booking entity info backfill...");

  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        { entityName: null },
        { referenceNumber: null },
      ],
    },
    select: {
      id: true,
      entityType: true,
      entityId: true,
      entityName: true,
      referenceNumber: true,
    },
  });

  console.log(`Found ${bookings.length} bookings to backfill.`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const booking of bookings) {
    try {
      const updates: Record<string, unknown> = {};

      // Backfill entity info if missing
      if (!booking.entityName) {
        const info = await lookupEntityInfo(booking.entityType, booking.entityId);
        updates.entityName = info.entityName;
        updates.entityImage = info.entityImage;
        updates.providerUserId = info.providerUserId;
        updates.providerName = info.providerName;
      }

      // Backfill reference number if missing
      if (!booking.referenceNumber) {
        updates.referenceNumber = await generateUniqueRef();
      }

      if (Object.keys(updates).length > 0) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: updates,
        });
        updated++;
        console.log(`  Updated booking ${booking.id} (${booking.entityType})`);
      } else {
        skipped++;
      }
    } catch (error) {
      errors++;
      console.error(`  Error updating booking ${booking.id}:`, error);
    }
  }

  console.log(`\nBackfill complete: ${updated} updated, ${skipped} skipped, ${errors} errors.`);
}

main()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
