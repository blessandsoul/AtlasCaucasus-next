/**
 * Seed analytics data for ALL existing users in the database.
 *
 * Does NOT create new users — it reads all existing providers, tours,
 * and travelers, then populates:
 *   - Favorites (travelers → tours, guides, drivers, companies)
 *   - Bookings (travelers → tours, guides, drivers)
 *   - Reviews (travelers → tours, guides, drivers, companies)
 *   - Inquiries + InquiryResponses (travelers → providers)
 *
 * Safe to run multiple times: uses upsert / skipDuplicates where possible.
 *
 * Usage: npx tsx src/scripts/db/seed-analytics.ts
 */

import {
    PrismaClient,
    InquiryTargetType,
    InquiryStatus,
    ReviewTargetType,
    BookingStatus,
} from "@prisma/client";
import {
    randomInt,
    randomRating,
    randomItem,
    randomItems,
    pastDate,
    randomBool,
} from "./utils/helpers.js";

const prisma = new PrismaClient();

// ─── Counters ─────────────────────────────────────────────────

const stats = {
    favorites: 0,
    bookings: 0,
    reviews: 0,
    inquiries: 0,
    inquiryResponses: 0,
    skippedDuplicates: 0,
};

// ─── Helpers ──────────────────────────────────────────────────

const COMMENTS = [
    "Amazing experience, highly recommended!",
    "Great tour, beautiful views and excellent organization.",
    "Good value for money. Would recommend to friends.",
    "Wonderful guide, very knowledgeable about local history.",
    "Excellent driver, safe and comfortable ride throughout.",
    "Would book again without hesitation!",
    "Fantastic company, well organized from start to finish.",
    "A truly memorable experience in Georgia.",
    "Professional service and friendly staff.",
    "One of the best tours I've ever taken.",
    "Beautiful scenery and great company.",
    "Very informative and fun. Perfect for families.",
    "Smooth booking process and excellent communication.",
    "The highlight of our Georgia trip!",
    "Exceeded our expectations in every way.",
];

const INQUIRY_SUBJECTS = [
    "Availability for next month?",
    "Group booking inquiry",
    "Private tour request",
    "Custom itinerary question",
    "Price for a larger group",
    "Accessibility accommodations",
    "Duration and meeting point",
    "Children-friendly options?",
    "Multi-day package inquiry",
    "Special dietary requirements",
];

const INQUIRY_MESSAGES = [
    "Hi, I'm planning a trip to Georgia and would love to learn more about your services. Could you share availability?",
    "We are a group of 6 friends visiting next month. Do you offer any group discounts?",
    "I'd like to arrange a private experience. What are the options and pricing?",
    "Can you accommodate wheelchair users? We want to make sure everyone in our group can participate.",
    "We're looking for a full-day experience. What would you recommend for first-time visitors?",
    "Hello! I found your listing and I'm very interested. Could you tell me more about what's included?",
    "We have children aged 5 and 8. Is this suitable for families with young kids?",
    "I'm a solo traveler interested in joining a small group tour. When is the next available date?",
];

const RESPONSE_MESSAGES = [
    "Thank you for your inquiry! We'd be happy to help. Let me share the details...",
    "Great to hear from you! Yes, we have availability. Here are the options...",
    "Welcome! We offer special group rates for 5+ people. Let me send you a quote.",
    "Absolutely, we can accommodate that. Let me put together a custom plan for you.",
    "Thanks for reaching out! This experience is perfect for what you're looking for.",
];

/**
 * Safely create a favorite, skipping if duplicate.
 */
async function safeFavorite(
    userId: string,
    entityType: string,
    entityId: string
): Promise<boolean> {
    try {
        await prisma.favorite.create({
            data: { userId, entityType, entityId },
        });
        stats.favorites++;
        return true;
    } catch (err: any) {
        if (err?.code === "P2002") {
            stats.skippedDuplicates++;
            return false;
        }
        throw err;
    }
}

/**
 * Safely create a review, skipping if duplicate (user + target).
 */
async function safeReview(
    userId: string,
    targetType: ReviewTargetType,
    targetId: string,
    rating: number,
    comment: string,
    createdAt: Date
): Promise<boolean> {
    try {
        await prisma.review.create({
            data: { userId, targetType, targetId, rating, comment, createdAt },
        });
        stats.reviews++;
        return true;
    } catch (err: any) {
        if (err?.code === "P2002") {
            stats.skippedDuplicates++;
            return false;
        }
        throw err;
    }
}

// ─── Main Seed ────────────────────────────────────────────────

async function main(): Promise<void> {
    console.log("🌱 Seeding Analytics Data for ALL Existing Users");
    console.log("═══════════════════════════════════════════════════");

    // ── 1. Load all existing entities from DB ──

    console.log("\n📋 Loading existing data...");

    const allUsers = await prisma.user.findMany({
        where: { isActive: true },
        include: {
            roles: true,
        },
    });

    const companies = await prisma.company.findMany({
        include: { user: { include: { roles: true } } },
    });

    const guides = await prisma.guide.findMany({
        where: { isAvailable: true },
        include: { user: { include: { roles: true } } },
    });

    const drivers = await prisma.driver.findMany({
        where: { isAvailable: true },
        include: { user: { include: { roles: true } } },
    });

    const tours = await prisma.tour.findMany({
        where: { isActive: true },
        select: { id: true, ownerId: true, title: true },
    });

    // Identify travelers (users with USER role and no provider roles)
    const providerRoles = new Set(["COMPANY", "GUIDE", "DRIVER", "TOUR_AGENT", "ADMIN"]);
    const travelers = allUsers.filter(
        (u) =>
            u.roles.length > 0 &&
            u.roles.some((r) => r.role === "USER") &&
            !u.roles.some((r) => providerRoles.has(r.role))
    );

    // If no travelers exist, fall back to all active users that aren't admins
    const travelerIds =
        travelers.length > 0
            ? travelers.map((t) => t.id)
            : allUsers
                  .filter((u) => !u.roles.some((r) => r.role === "ADMIN"))
                  .slice(0, 10)
                  .map((u) => u.id);

    console.log(`  Users:     ${allUsers.length}`);
    console.log(`  Companies: ${companies.length}`);
    console.log(`  Guides:    ${guides.length}`);
    console.log(`  Drivers:   ${drivers.length}`);
    console.log(`  Tours:     ${tours.length}`);
    console.log(`  Travelers: ${travelerIds.length}`);

    if (travelerIds.length === 0) {
        console.log("\n⚠️  No travelers found in DB. Cannot seed analytics data.");
        console.log("   Run the realistic seeder first: npm run db:seed:realistic");
        return;
    }

    // ── 2. Favorites ──

    console.log("\n❤️  Seeding favorites...");

    // Favorites for tours (each tour gets 1-6 favorites from random travelers)
    for (const tour of tours) {
        const numFavs = randomInt(1, Math.min(6, travelerIds.length));
        const favers = randomItems(travelerIds, numFavs);
        for (const travelerId of favers) {
            await safeFavorite(travelerId, "TOUR", tour.id);
        }
    }

    // Favorites for guides (each guide gets 1-4 favorites)
    for (const guide of guides) {
        const numFavs = randomInt(1, Math.min(4, travelerIds.length));
        const favers = randomItems(travelerIds, numFavs);
        for (const travelerId of favers) {
            await safeFavorite(travelerId, "GUIDE", guide.id);
        }
    }

    // Favorites for drivers (each driver gets 1-3 favorites)
    for (const driver of drivers) {
        const numFavs = randomInt(1, Math.min(3, travelerIds.length));
        const favers = randomItems(travelerIds, numFavs);
        for (const travelerId of favers) {
            await safeFavorite(travelerId, "DRIVER", driver.id);
        }
    }

    // Favorites for companies (each company gets 1-5 favorites)
    for (const company of companies) {
        const numFavs = randomInt(1, Math.min(5, travelerIds.length));
        const favers = randomItems(travelerIds, numFavs);
        for (const travelerId of favers) {
            await safeFavorite(travelerId, "COMPANY", company.id);
        }
    }

    console.log(`  ✓ ${stats.favorites} favorites created (${stats.skippedDuplicates} duplicates skipped)`);

    // ── 3. Bookings ──

    console.log("\n📅 Seeding bookings...");

    // Tour bookings — each tour gets 1-4 bookings, mix of old and recent
    for (const tour of tours) {
        const numBookings = randomInt(1, Math.min(4, travelerIds.length));
        const bookers = randomItems(travelerIds, numBookings);
        for (let j = 0; j < bookers.length; j++) {
            const isRecent = j < 2; // First 2 are recent
            const bookingDate = isRecent ? pastDate(20) : pastDate(60);
            const status = randomBool(0.85)
                ? BookingStatus.CONFIRMED
                : randomBool(0.5)
                ? BookingStatus.COMPLETED
                : BookingStatus.CANCELLED;

            await prisma.booking.create({
                data: {
                    userId: bookers[j],
                    entityType: "TOUR",
                    entityId: tour.id,
                    status,
                    date: bookingDate,
                    guests: randomInt(1, 6),
                    totalPrice: randomInt(50, 800),
                    currency: "GEL",
                    createdAt: bookingDate,
                    cancelledAt: status === BookingStatus.CANCELLED ? new Date() : null,
                },
            });
            stats.bookings++;
        }
    }

    // Guide bookings — each guide gets 0-3 bookings
    for (const guide of guides) {
        const numBookings = randomInt(0, Math.min(3, travelerIds.length));
        const bookers = randomItems(travelerIds, numBookings);
        for (const bookerId of bookers) {
            const bookingDate = pastDate(30);
            await prisma.booking.create({
                data: {
                    userId: bookerId,
                    entityType: "GUIDE",
                    entityId: guide.id,
                    status: BookingStatus.CONFIRMED,
                    date: bookingDate,
                    guests: randomInt(1, 4),
                    totalPrice: randomInt(80, 400),
                    currency: "GEL",
                    createdAt: bookingDate,
                },
            });
            stats.bookings++;
        }
    }

    // Driver bookings — each driver gets 0-3 bookings
    for (const driver of drivers) {
        const numBookings = randomInt(0, Math.min(3, travelerIds.length));
        const bookers = randomItems(travelerIds, numBookings);
        for (const bookerId of bookers) {
            const bookingDate = pastDate(30);
            await prisma.booking.create({
                data: {
                    userId: bookerId,
                    entityType: "DRIVER",
                    entityId: driver.id,
                    status: BookingStatus.CONFIRMED,
                    date: bookingDate,
                    guests: randomInt(1, 7),
                    totalPrice: randomInt(60, 350),
                    currency: "GEL",
                    createdAt: bookingDate,
                },
            });
            stats.bookings++;
        }
    }

    console.log(`  ✓ ${stats.bookings} bookings created`);

    // ── 4. Reviews ──

    console.log("\n⭐ Seeding reviews...");

    // Tour reviews — each tour gets 1-5 reviews
    for (const tour of tours) {
        const numReviews = randomInt(1, Math.min(5, travelerIds.length));
        const reviewers = randomItems(travelerIds, numReviews);
        for (const reviewerId of reviewers) {
            await safeReview(
                reviewerId,
                ReviewTargetType.TOUR,
                tour.id,
                randomRating(),
                randomItem(COMMENTS),
                pastDate(60)
            );
        }
    }

    // Guide reviews — each guide gets 1-4 reviews
    for (const guide of guides) {
        const numReviews = randomInt(1, Math.min(4, travelerIds.length));
        const reviewers = randomItems(travelerIds, numReviews);
        for (const reviewerId of reviewers) {
            await safeReview(
                reviewerId,
                ReviewTargetType.GUIDE,
                guide.id,
                randomRating(),
                randomItem(COMMENTS),
                pastDate(45)
            );
        }
    }

    // Driver reviews — each driver gets 1-3 reviews
    for (const driver of drivers) {
        const numReviews = randomInt(1, Math.min(3, travelerIds.length));
        const reviewers = randomItems(travelerIds, numReviews);
        for (const reviewerId of reviewers) {
            await safeReview(
                reviewerId,
                ReviewTargetType.DRIVER,
                driver.id,
                randomRating(),
                randomItem(COMMENTS),
                pastDate(40)
            );
        }
    }

    // Company reviews — each company gets 1-3 reviews
    for (const company of companies) {
        const numReviews = randomInt(1, Math.min(3, travelerIds.length));
        const reviewers = randomItems(travelerIds, numReviews);
        for (const reviewerId of reviewers) {
            await safeReview(
                reviewerId,
                ReviewTargetType.COMPANY,
                company.id,
                randomRating(),
                randomItem(COMMENTS),
                pastDate(50)
            );
        }
    }

    console.log(`  ✓ ${stats.reviews} reviews created (${stats.skippedDuplicates} total duplicates skipped)`);

    // ── 5. Inquiries + InquiryResponses ──

    console.log("\n💬 Seeding inquiries...");

    const inquiryStatusPool: InquiryStatus[] = [
        InquiryStatus.ACCEPTED,
        InquiryStatus.ACCEPTED,
        InquiryStatus.RESPONDED,
        InquiryStatus.DECLINED,
        InquiryStatus.PENDING,
        InquiryStatus.PENDING,
        InquiryStatus.EXPIRED,
    ];

    // Build a map of userId -> their owned entity IDs for targeting inquiries
    const companyOwnerIds = companies.map((c) => c.userId);
    const guideOwnerIds = guides.map((g) => g.userId);
    const driverOwnerIds = drivers.map((d) => d.userId);

    // Inquiries to companies (targeting their tours)
    for (const company of companies) {
        const companyTours = tours.filter((t) => t.ownerId === company.userId);
        if (companyTours.length === 0) continue;

        const numInquiries = randomInt(2, Math.min(6, travelerIds.length));
        const inquirers = randomItems(travelerIds, numInquiries);

        for (const travelerId of inquirers) {
            const targetTour = randomItem(companyTours);
            const status = randomItem(inquiryStatusPool);
            const isRecent = randomBool(0.6);
            const createdAt = isRecent ? pastDate(20) : pastDate(50);

            const inquiry = await prisma.inquiry.create({
                data: {
                    userId: travelerId,
                    targetType: InquiryTargetType.TOUR,
                    targetIds: JSON.stringify([targetTour.id]),
                    subject: randomItem(INQUIRY_SUBJECTS),
                    message: randomItem(INQUIRY_MESSAGES),
                    createdAt,
                },
            });
            stats.inquiries++;

            const isResponded =
                status !== InquiryStatus.PENDING && status !== InquiryStatus.EXPIRED;

            await prisma.inquiryResponse.create({
                data: {
                    inquiryId: inquiry.id,
                    recipientId: company.userId,
                    status,
                    message: isResponded ? randomItem(RESPONSE_MESSAGES) : null,
                    respondedAt: isResponded ? pastDate(5) : null,
                    createdAt,
                },
            });
            stats.inquiryResponses++;
        }
    }

    // Inquiries to guides
    for (const guide of guides) {
        const numInquiries = randomInt(1, Math.min(4, travelerIds.length));
        const inquirers = randomItems(travelerIds, numInquiries);

        for (const travelerId of inquirers) {
            const status = randomItem(inquiryStatusPool);
            const isRecent = randomBool(0.6);
            const createdAt = isRecent ? pastDate(20) : pastDate(50);

            const inquiry = await prisma.inquiry.create({
                data: {
                    userId: travelerId,
                    targetType: InquiryTargetType.GUIDE,
                    targetIds: JSON.stringify([guide.id]),
                    subject: randomItem(INQUIRY_SUBJECTS),
                    message: randomItem(INQUIRY_MESSAGES),
                    createdAt,
                },
            });
            stats.inquiries++;

            const isResponded =
                status !== InquiryStatus.PENDING && status !== InquiryStatus.EXPIRED;

            await prisma.inquiryResponse.create({
                data: {
                    inquiryId: inquiry.id,
                    recipientId: guide.userId,
                    status,
                    message: isResponded ? randomItem(RESPONSE_MESSAGES) : null,
                    respondedAt: isResponded ? pastDate(5) : null,
                    createdAt,
                },
            });
            stats.inquiryResponses++;
        }
    }

    // Inquiries to drivers
    for (const driver of drivers) {
        const numInquiries = randomInt(1, Math.min(3, travelerIds.length));
        const inquirers = randomItems(travelerIds, numInquiries);

        for (const travelerId of inquirers) {
            const status = randomItem(inquiryStatusPool);
            const isRecent = randomBool(0.6);
            const createdAt = isRecent ? pastDate(20) : pastDate(50);

            const inquiry = await prisma.inquiry.create({
                data: {
                    userId: travelerId,
                    targetType: InquiryTargetType.DRIVER,
                    targetIds: JSON.stringify([driver.id]),
                    subject: randomItem(INQUIRY_SUBJECTS),
                    message: randomItem(INQUIRY_MESSAGES),
                    createdAt,
                },
            });
            stats.inquiries++;

            const isResponded =
                status !== InquiryStatus.PENDING && status !== InquiryStatus.EXPIRED;

            await prisma.inquiryResponse.create({
                data: {
                    inquiryId: inquiry.id,
                    recipientId: driver.userId,
                    status,
                    message: isResponded ? randomItem(RESPONSE_MESSAGES) : null,
                    respondedAt: isResponded ? pastDate(5) : null,
                    createdAt,
                },
            });
            stats.inquiryResponses++;
        }
    }

    console.log(`  ✓ ${stats.inquiries} inquiries created`);
    console.log(`  ✓ ${stats.inquiryResponses} inquiry responses created`);

    // ── Summary ──

    console.log("\n═══════════════════════════════════════════════════");
    console.log("✅ Analytics seed complete for all existing users!");
    console.log(`   Favorites:          ${stats.favorites}`);
    console.log(`   Bookings:           ${stats.bookings}`);
    console.log(`   Reviews:            ${stats.reviews}`);
    console.log(`   Inquiries:          ${stats.inquiries}`);
    console.log(`   Inquiry Responses:  ${stats.inquiryResponses}`);
    console.log(`   Duplicates skipped: ${stats.skippedDuplicates}`);
    console.log(`\n📊 Providers with analytics data:`);
    console.log(`   ${companies.length} companies (${tours.length} tours)`);
    console.log(`   ${guides.length} guides`);
    console.log(`   ${drivers.length} drivers`);
}

main()
    .catch((err) => {
        console.error("❌ Seed failed:", err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
