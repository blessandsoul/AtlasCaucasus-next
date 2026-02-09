/**
 * Booking Seed Script
 *
 * Creates realistic bookings by linking existing traveler users
 * to tours, guides, and drivers that already exist in the database.
 *
 * Run AFTER the realistic seeder:
 *   npx tsx src/scripts/db/seed-bookings.ts
 *
 * Creates ~25 bookings across all statuses and entity types.
 */

import { PrismaClient, BookingStatus } from '@prisma/client';
import { uuid, randomItem, randomItems, randomInt, pastDate, futureDate } from './utils/helpers.js';

const prisma = new PrismaClient();

// Booking notes templates
const BOOKING_NOTES = {
  TOUR: [
    'Looking forward to this tour! We will arrive at the meeting point 10 minutes early.',
    'We have 2 children in our group, ages 8 and 12.',
    'Celebrating our anniversary, would love any special recommendations!',
    'First time visiting Georgia. Very excited!',
    'We need vegetarian lunch options if meals are included.',
    'Can we extend the tour by 1 hour? Happy to pay extra.',
    'We have a guest who needs wheelchair accessibility.',
    null,
    null,
    null,
  ],
  GUIDE: [
    'We would prefer English-speaking guidance throughout.',
    'Interested in historical sites and local cuisine.',
    'Group of photography enthusiasts — we may need extra stops for photos.',
    'Please bring maps of the hiking trails.',
    null,
    null,
  ],
  DRIVER: [
    'We have 3 large suitcases, please ensure enough trunk space.',
    'Airport pickup at terminal 2, flight lands at 14:30.',
    'Need child car seat for a 3-year-old.',
    'Multiple stops planned — Tbilisi to Kazbegi with stops at Ananuri and Gudauri.',
    null,
    null,
  ],
};

const CURRENCIES = ['GEL', 'USD', 'EUR'];

async function main(): Promise<void> {
  console.log('');
  console.log('📅 Seeding Bookings...');
  console.log('');

  // Fetch existing data
  const travelers = await prisma.user.findMany({
    where: {
      roles: { some: { role: 'USER' } },
      isActive: true,
      emailVerified: true,
    },
    select: { id: true, email: true },
    take: 20,
  });

  const tours = await prisma.tour.findMany({
    where: { isActive: true },
    select: { id: true, ownerId: true, title: true, price: true, currency: true },
    take: 20,
  });

  const guides = await prisma.guide.findMany({
    where: { isAvailable: true },
    select: { id: true, userId: true, pricePerDay: true, currency: true },
    take: 10,
  });

  const drivers = await prisma.driver.findMany({
    where: { isAvailable: true },
    select: { id: true, userId: true },
    take: 10,
  });

  if (travelers.length === 0) {
    console.log('  ⚠️  No traveler users found. Run the realistic seeder first:');
    console.log('     npm run db:seed:realistic');
    return;
  }

  if (tours.length === 0 && guides.length === 0 && drivers.length === 0) {
    console.log('  ⚠️  No tours, guides, or drivers found. Run the realistic seeder first.');
    return;
  }

  console.log(`  Found: ${travelers.length} travelers, ${tours.length} tours, ${guides.length} guides, ${drivers.length} drivers`);

  let bookingCount = 0;
  const statuses: BookingStatus[] = [
    BookingStatus.CONFIRMED,
    BookingStatus.CONFIRMED,
    BookingStatus.CONFIRMED,
    BookingStatus.COMPLETED,
    BookingStatus.COMPLETED,
    BookingStatus.CANCELLED,
  ];

  // ── Tour Bookings (10-12) ─────────────────────────────────
  if (tours.length > 0) {
    const tourBookingCount = Math.min(12, tours.length);
    const selectedTours = randomItems(tours, tourBookingCount);

    for (const tour of selectedTours) {
      const traveler = randomItem(travelers);
      // Skip if traveler is the tour owner
      if (traveler.id === tour.ownerId) continue;

      const status = randomItem(statuses);
      const guests = randomInt(1, 8);
      const price = tour.price ? Number(tour.price) * guests : randomInt(100, 800);

      await prisma.booking.create({
        data: {
          id: uuid(),
          userId: traveler.id,
          entityType: 'TOUR',
          entityId: tour.id,
          status,
          date: status === BookingStatus.COMPLETED ? pastDate(60) : futureDate(30),
          guests,
          totalPrice: price,
          currency: tour.currency || 'GEL',
          notes: randomItem(BOOKING_NOTES.TOUR),
          createdAt: pastDate(status === BookingStatus.COMPLETED ? 90 : 30),
          cancelledAt: status === BookingStatus.CANCELLED ? pastDate(15) : null,
        },
      });
      bookingCount++;
    }
    console.log(`  ✓ Created ${bookingCount} tour bookings`);
  }

  // ── Guide Bookings (5-8) ──────────────────────────────────
  const guideBookingStart = bookingCount;
  if (guides.length > 0) {
    const guideBookingCount = Math.min(8, guides.length);
    const selectedGuides = randomItems(guides, guideBookingCount);

    for (const guide of selectedGuides) {
      const traveler = randomItem(travelers);
      if (traveler.id === guide.userId) continue;

      const status = randomItem(statuses);
      const days = randomInt(1, 5);
      const pricePerDay = guide.pricePerDay ? Number(guide.pricePerDay) : randomInt(80, 300);

      await prisma.booking.create({
        data: {
          id: uuid(),
          userId: traveler.id,
          entityType: 'GUIDE',
          entityId: guide.id,
          status,
          date: status === BookingStatus.COMPLETED ? pastDate(45) : futureDate(21),
          guests: randomInt(1, 6),
          totalPrice: pricePerDay * days,
          currency: guide.currency || 'GEL',
          notes: randomItem(BOOKING_NOTES.GUIDE),
          createdAt: pastDate(status === BookingStatus.COMPLETED ? 75 : 21),
          cancelledAt: status === BookingStatus.CANCELLED ? pastDate(10) : null,
        },
      });
      bookingCount++;
    }
    console.log(`  ✓ Created ${bookingCount - guideBookingStart} guide bookings`);
  }

  // ── Driver Bookings (4-6) ─────────────────────────────────
  const driverBookingStart = bookingCount;
  if (drivers.length > 0) {
    const driverBookingCount = Math.min(6, drivers.length);
    const selectedDrivers = randomItems(drivers, driverBookingCount);

    for (const driver of selectedDrivers) {
      const traveler = randomItem(travelers);
      if (traveler.id === driver.userId) continue;

      const status = randomItem(statuses);
      const price = randomInt(50, 400);

      await prisma.booking.create({
        data: {
          id: uuid(),
          userId: traveler.id,
          entityType: 'DRIVER',
          entityId: driver.id,
          status,
          date: status === BookingStatus.COMPLETED ? pastDate(30) : futureDate(14),
          guests: randomInt(1, 4),
          totalPrice: price,
          currency: randomItem(CURRENCIES),
          notes: randomItem(BOOKING_NOTES.DRIVER),
          createdAt: pastDate(status === BookingStatus.COMPLETED ? 60 : 14),
          cancelledAt: status === BookingStatus.CANCELLED ? pastDate(7) : null,
        },
      });
      bookingCount++;
    }
    console.log(`  ✓ Created ${bookingCount - driverBookingStart} driver bookings`);
  }

  // ── Summary ────────────────────────────────────────────────
  const statusCounts = await prisma.booking.groupBy({
    by: ['status'],
    _count: { status: true },
  });

  const entityCounts = await prisma.booking.groupBy({
    by: ['entityType'],
    _count: { entityType: true },
  });

  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log(`✅ Seeded ${bookingCount} bookings`);
  console.log('');
  console.log('📊 By status:');
  for (const s of statusCounts) {
    console.log(`   • ${s.status}: ${s._count.status}`);
  }
  console.log('');
  console.log('📊 By entity type:');
  for (const e of entityCounts) {
    console.log(`   • ${e.entityType}: ${e._count.entityType}`);
  }
  console.log('');
  console.log('💡 Log in as any traveler user to see bookings in /dashboard/bookings');
  console.log('💡 Log in as any provider (guide/driver/company) to see received bookings');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding bookings:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
