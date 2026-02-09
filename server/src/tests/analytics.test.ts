/**
 * Integration tests for the Analytics module.
 *
 * Tests:
 *   - Zod schema validation (TrackViewSchema)
 *   - Repository: getOwnedEntityIds, countInquiries, countFavorites,
 *     countBookings, getAggregateRatings
 *   - Service: getProviderAnalytics, trackView (Redis-dependent)
 *   - Edge cases and bug detection
 *
 * Run with:  npx tsx src/tests/analytics.test.ts
 */

import {
    PrismaClient,
    InquiryTargetType,
    InquiryStatus,
    ReviewTargetType,
    BookingStatus,
} from "@prisma/client";
import { AnalyticsRepository } from "../modules/analytics/analytics.repo.js";
import { AnalyticsService } from "../modules/analytics/analytics.service.js";
import { TrackViewSchema } from "../modules/analytics/analytics.schemas.js";
import type { AnalyticsEntityType } from "../modules/analytics/analytics.types.js";
import type { UserRole } from "../modules/users/user.types.js";

const prisma = new PrismaClient();
const analyticsRepo = new AnalyticsRepository();
const analyticsService = new AnalyticsService();

// ─── Test Helpers ─────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, label: string): void {
    if (condition) {
        passed++;
        console.log(`  ✅ ${label}`);
    } else {
        failed++;
        failures.push(label);
        console.log(`  ❌ ${label}`);
    }
}

function assertEq(actual: unknown, expected: unknown, label: string): void {
    const ok = actual === expected;
    if (!ok) {
        label += ` (got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)})`;
    }
    assert(ok, label);
}

function assertGte(actual: number, expected: number, label: string): void {
    const ok = actual >= expected;
    if (!ok) {
        label += ` (got ${actual}, expected >= ${expected})`;
    }
    assert(ok, label);
}

async function assertThrows(
    fn: () => Promise<unknown>,
    expectedCode: string,
    label: string
): Promise<void> {
    try {
        await fn();
        failed++;
        failures.push(label + " (did not throw)");
        console.log(`  ❌ ${label} (did not throw)`);
    } catch (err: unknown) {
        const error = err as { code?: string };
        if (error.code === expectedCode) {
            passed++;
            console.log(`  ✅ ${label}`);
        } else {
            failed++;
            failures.push(
                label + ` (threw ${error.code} instead of ${expectedCode})`
            );
            console.log(
                `  ❌ ${label} (threw ${error.code} instead of ${expectedCode})`
            );
        }
    }
}

// ─── Test Data ────────────────────────────────────────────────

const TEST_PREFIX = `__analytics_test_${Date.now()}`;
const passwordHash =
    "$argon2id$v=19$m=65536,t=3,p=4$placeholder_hash_for_tests";

const createdUserIds: string[] = [];
const createdTourIds: string[] = [];
const createdGuideIds: string[] = [];
const createdDriverIds: string[] = [];
const createdCompanyIds: string[] = [];
const createdInquiryIds: string[] = [];
const createdInquiryResponseIds: string[] = [];
const createdReviewIds: string[] = [];
const createdFavoriteIds: string[] = [];
const createdBookingIds: string[] = [];

async function createTestUser(
    suffix: string,
    roles: string[] = []
): Promise<string> {
    const user = await prisma.user.create({
        data: {
            email: `${TEST_PREFIX}_${suffix}@test.local`,
            firstName: "Test",
            lastName: suffix,
            passwordHash,
            emailVerified: true,
            isActive: true,
            roles:
                roles.length > 0
                    ? { create: roles.map((r) => ({ role: r as any })) }
                    : undefined,
        },
    });
    createdUserIds.push(user.id);
    return user.id;
}

async function createTestTour(
    ownerId: string,
    title: string,
    isActive: boolean = true
): Promise<string> {
    const tour = await prisma.tour.create({
        data: {
            ownerId,
            title,
            summary: "Test tour for analytics",
            price: 100,
            currency: "GEL",
            isActive,
        },
    });
    createdTourIds.push(tour.id);
    return tour.id;
}

async function createTestGuide(userId: string): Promise<string> {
    const guide = await prisma.guide.create({
        data: {
            userId,
            bio: "Test guide bio",
            languages: ["en"],
            isVerified: true,
            isAvailable: true,
        },
    });
    createdGuideIds.push(guide.id);
    return guide.id;
}

async function createTestDriver(userId: string): Promise<string> {
    const driver = await prisma.driver.create({
        data: {
            userId,
            bio: "Test driver bio",
            vehicleType: "sedan",
            vehicleCapacity: 4,
            isVerified: true,
            isAvailable: true,
        },
    });
    createdDriverIds.push(driver.id);
    return driver.id;
}

async function createTestCompany(userId: string): Promise<string> {
    const company = await prisma.company.create({
        data: {
            userId,
            companyName: `${TEST_PREFIX} Company`,
            description: "Test company for analytics",
            isVerified: true,
        },
    });
    createdCompanyIds.push(company.id);
    return company.id;
}

async function createTestInquiry(
    userId: string,
    recipientId: string,
    targetType: InquiryTargetType,
    targetId: string,
    responseStatus: InquiryStatus,
    createdAt?: Date
): Promise<{ inquiryId: string; responseId: string }> {
    const inquiry = await prisma.inquiry.create({
        data: {
            userId,
            targetType,
            targetIds: JSON.stringify([targetId]),
            subject: `${TEST_PREFIX} inquiry`,
            message: "Test inquiry message",
            createdAt: createdAt ?? new Date(),
        },
    });
    createdInquiryIds.push(inquiry.id);

    const response = await prisma.inquiryResponse.create({
        data: {
            inquiryId: inquiry.id,
            recipientId,
            status: responseStatus,
            message:
                responseStatus !== InquiryStatus.PENDING &&
                responseStatus !== InquiryStatus.EXPIRED
                    ? "Response message"
                    : null,
            respondedAt:
                responseStatus !== InquiryStatus.PENDING &&
                responseStatus !== InquiryStatus.EXPIRED
                    ? new Date()
                    : null,
            createdAt: createdAt ?? new Date(),
        },
    });
    createdInquiryResponseIds.push(response.id);

    return { inquiryId: inquiry.id, responseId: response.id };
}

async function createTestReview(
    userId: string,
    targetType: ReviewTargetType,
    targetId: string,
    rating: number
): Promise<string> {
    const review = await prisma.review.create({
        data: {
            userId,
            targetType,
            targetId,
            rating,
            comment: "Test review",
        },
    });
    createdReviewIds.push(review.id);
    return review.id;
}

async function createTestFavorite(
    userId: string,
    entityType: string,
    entityId: string
): Promise<string> {
    const favorite = await prisma.favorite.create({
        data: { userId, entityType, entityId },
    });
    createdFavoriteIds.push(favorite.id);
    return favorite.id;
}

async function createTestBooking(
    userId: string,
    entityType: string,
    entityId: string,
    createdAt?: Date
): Promise<string> {
    const booking = await prisma.booking.create({
        data: {
            userId,
            entityType,
            entityId,
            status: BookingStatus.CONFIRMED,
            createdAt: createdAt ?? new Date(),
        },
    });
    createdBookingIds.push(booking.id);
    return booking.id;
}

// ─── Unit Tests: Zod Schemas ─────────────────────────────────

function testSchemas(): void {
    console.log("\n══ Unit Tests: Zod Schemas ══");

    // Valid entity types
    for (const entityType of ["TOUR", "GUIDE", "DRIVER", "COMPANY"]) {
        const result = TrackViewSchema.parse({
            entityType,
            entityId: "123e4567-e89b-12d3-a456-426614174000",
        });
        assertEq(result.entityType, entityType, `TrackViewSchema accepts ${entityType}`);
    }

    // Invalid entity type
    let threw = false;
    try {
        TrackViewSchema.parse({
            entityType: "INVALID",
            entityId: "123e4567-e89b-12d3-a456-426614174000",
        });
    } catch {
        threw = true;
    }
    assert(threw, "TrackViewSchema rejects invalid entityType");

    // Non-UUID entityId
    threw = false;
    try {
        TrackViewSchema.parse({
            entityType: "TOUR",
            entityId: "not-a-uuid",
        });
    } catch {
        threw = true;
    }
    assert(threw, "TrackViewSchema rejects non-UUID entityId");

    // Missing fields
    threw = false;
    try {
        TrackViewSchema.parse({});
    } catch {
        threw = true;
    }
    assert(threw, "TrackViewSchema rejects empty object");

    // Missing entityType
    threw = false;
    try {
        TrackViewSchema.parse({
            entityId: "123e4567-e89b-12d3-a456-426614174000",
        });
    } catch {
        threw = true;
    }
    assert(threw, "TrackViewSchema rejects missing entityType");

    // Missing entityId
    threw = false;
    try {
        TrackViewSchema.parse({ entityType: "TOUR" });
    } catch {
        threw = true;
    }
    assert(threw, "TrackViewSchema rejects missing entityId");
}

// ─── Integration Tests: getOwnedEntityIds ────────────────────

async function testGetOwnedEntityIds(): Promise<void> {
    console.log("\n══ Integration: Repo — getOwnedEntityIds ══");

    // Company user with tours
    const companyUserId = await createTestUser("owned_company1", ["COMPANY"]);
    const companyId = await createTestCompany(companyUserId);
    const tour1 = await createTestTour(companyUserId, `${TEST_PREFIX} Owned Tour 1`);
    const tour2 = await createTestTour(companyUserId, `${TEST_PREFIX} Owned Tour 2`);
    const inactiveTour = await createTestTour(
        companyUserId,
        `${TEST_PREFIX} Inactive Tour`,
        false
    );

    const companyEntityMap = await analyticsRepo.getOwnedEntityIds(companyUserId);

    assertEq(companyEntityMap.TOUR.length, 2, "Company user has 2 active tours");
    assert(companyEntityMap.TOUR.includes(tour1), "Includes tour1");
    assert(companyEntityMap.TOUR.includes(tour2), "Includes tour2");
    assert(
        !companyEntityMap.TOUR.includes(inactiveTour),
        "Does NOT include inactive tour"
    );
    assertEq(companyEntityMap.COMPANY.length, 1, "Company user has 1 company");
    assertEq(companyEntityMap.COMPANY[0], companyId, "Company ID matches");
    assertEq(companyEntityMap.GUIDE.length, 0, "Company user has 0 guides");
    assertEq(companyEntityMap.DRIVER.length, 0, "Company user has 0 drivers");

    // Guide user
    const guideUserId = await createTestUser("owned_guide1", ["GUIDE"]);
    const guideId = await createTestGuide(guideUserId);

    const guideEntityMap = await analyticsRepo.getOwnedEntityIds(guideUserId);
    assertEq(guideEntityMap.GUIDE.length, 1, "Guide user has 1 guide");
    assertEq(guideEntityMap.GUIDE[0], guideId, "Guide ID matches");
    assertEq(guideEntityMap.TOUR.length, 0, "Guide user has 0 tours");

    // Driver user
    const driverUserId = await createTestUser("owned_driver1", ["DRIVER"]);
    const driverId = await createTestDriver(driverUserId);

    const driverEntityMap = await analyticsRepo.getOwnedEntityIds(driverUserId);
    assertEq(driverEntityMap.DRIVER.length, 1, "Driver user has 1 driver");
    assertEq(driverEntityMap.DRIVER[0], driverId, "Driver ID matches");

    // User with no entities
    const emptyUserId = await createTestUser("owned_empty1");
    const emptyEntityMap = await analyticsRepo.getOwnedEntityIds(emptyUserId);
    assertEq(emptyEntityMap.TOUR.length, 0, "Empty user has 0 tours");
    assertEq(emptyEntityMap.GUIDE.length, 0, "Empty user has 0 guides");
    assertEq(emptyEntityMap.DRIVER.length, 0, "Empty user has 0 drivers");
    assertEq(emptyEntityMap.COMPANY.length, 0, "Empty user has 0 companies");
}

// ─── Integration Tests: countInquiries ───────────────────────

async function testCountInquiries(): Promise<void> {
    console.log("\n══ Integration: Repo — countInquiries ══");

    const providerId = await createTestUser("inq_provider1", ["COMPANY"]);
    const companyId = await createTestCompany(providerId);
    const tourId = await createTestTour(providerId, `${TEST_PREFIX} Inquiry Tour`);
    const travelerId = await createTestUser("inq_traveler1");

    // Create inquiries with different statuses
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    const fortyFiveDaysAgo = new Date();
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

    // Recent: ACCEPTED
    await createTestInquiry(
        travelerId,
        providerId,
        InquiryTargetType.TOUR,
        tourId,
        InquiryStatus.ACCEPTED,
        fifteenDaysAgo
    );

    // Recent: DECLINED
    const traveler2 = await createTestUser("inq_traveler2");
    await createTestInquiry(
        traveler2,
        providerId,
        InquiryTargetType.TOUR,
        tourId,
        InquiryStatus.DECLINED,
        fifteenDaysAgo
    );

    // Recent: PENDING
    const traveler3 = await createTestUser("inq_traveler3");
    await createTestInquiry(
        traveler3,
        providerId,
        InquiryTargetType.TOUR,
        tourId,
        InquiryStatus.PENDING,
        fifteenDaysAgo
    );

    // Old: RESPONDED (before 30 days)
    const traveler4 = await createTestUser("inq_traveler4");
    await createTestInquiry(
        traveler4,
        providerId,
        InquiryTargetType.TOUR,
        tourId,
        InquiryStatus.RESPONDED,
        fortyFiveDaysAgo
    );

    // Old: EXPIRED (before 30 days)
    const traveler5 = await createTestUser("inq_traveler5");
    await createTestInquiry(
        traveler5,
        providerId,
        InquiryTargetType.TOUR,
        tourId,
        InquiryStatus.EXPIRED,
        fortyFiveDaysAgo
    );

    // All-time counts
    const allTime = await analyticsRepo.countInquiries(providerId);
    assertEq(allTime.total, 5, "Total inquiries = 5");

    // BUG DETECTION: EXPIRED should NOT count as responded
    // EXPIRED means "inquiry expired without a response" — it's NOT a response
    // Current code uses `status: { not: "PENDING" }` which counts EXPIRED as responded
    // Expected correct behavior: responded = ACCEPTED(1) + DECLINED(1) + RESPONDED(1) = 3
    // Bug behavior: responded = everything except PENDING = 4 (includes EXPIRED)
    console.log(`  ℹ️  allTime.responded = ${allTime.responded} (ACCEPTED + DECLINED + RESPONDED + EXPIRED?)`);

    // This assertion tests the EXPECTED correct behavior:
    // If responded = 4, the EXPIRED bug exists
    // If responded = 3, the bug is fixed
    if (allTime.responded === 4) {
        failed++;
        failures.push(
            "BUG: EXPIRED inquiries counted as responded (got 4, should be 3)"
        );
        console.log(
            `  🐛 BUG: EXPIRED inquiries counted as responded (got 4, should be 3)`
        );
    } else if (allTime.responded === 3) {
        passed++;
        console.log(
            `  ✅ EXPIRED inquiries correctly excluded from responded count`
        );
    } else {
        failed++;
        failures.push(
            `Unexpected responded count: ${allTime.responded} (expected 3 or 4)`
        );
        console.log(
            `  ❌ Unexpected responded count: ${allTime.responded}`
        );
    }

    // Last 30 days filter
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recent = await analyticsRepo.countInquiries(providerId, thirtyDaysAgo);
    assertEq(recent.total, 3, "Recent inquiries (last 30 days) = 3");

    // User with no inquiries
    const noInqUser = await createTestUser("inq_empty1");
    const noInq = await analyticsRepo.countInquiries(noInqUser);
    assertEq(noInq.total, 0, "User with no inquiries: total = 0");
    assertEq(noInq.responded, 0, "User with no inquiries: responded = 0");
}

// ─── Integration Tests: countFavorites ───────────────────────

async function testCountFavorites(): Promise<void> {
    console.log("\n══ Integration: Repo — countFavorites ══");

    const providerId = await createTestUser("fav_provider1", ["COMPANY"]);
    const companyId = await createTestCompany(providerId);
    const tourId = await createTestTour(providerId, `${TEST_PREFIX} Fav Tour`);

    const traveler1 = await createTestUser("fav_traveler1");
    const traveler2 = await createTestUser("fav_traveler2");
    const traveler3 = await createTestUser("fav_traveler3");

    // Create favorites for tour (2) and company (1)
    await createTestFavorite(traveler1, "TOUR", tourId);
    await createTestFavorite(traveler2, "TOUR", tourId);
    await createTestFavorite(traveler3, "COMPANY", companyId);

    const entityMap: Record<AnalyticsEntityType, string[]> = {
        TOUR: [tourId],
        GUIDE: [],
        DRIVER: [],
        COMPANY: [companyId],
    };

    const count = await analyticsRepo.countFavorites(entityMap);
    assertEq(count, 3, "Total favorites = 3 (2 tour + 1 company)");

    // Empty entity map
    const emptyMap: Record<AnalyticsEntityType, string[]> = {
        TOUR: [],
        GUIDE: [],
        DRIVER: [],
        COMPANY: [],
    };
    const emptyCount = await analyticsRepo.countFavorites(emptyMap);
    assertEq(emptyCount, 0, "Empty entity map returns 0 favorites");

    // Only count matching entities (not other people's)
    const otherProviderId = await createTestUser("fav_other_provider1", ["COMPANY"]);
    const otherCompanyId = await createTestCompany(otherProviderId);
    await createTestFavorite(traveler1, "COMPANY", otherCompanyId);

    // Re-count original provider — should still be 3
    const recount = await analyticsRepo.countFavorites(entityMap);
    assertEq(recount, 3, "Favorites count unchanged after other provider gets favorite");
}

// ─── Integration Tests: countBookings ────────────────────────

async function testCountBookings(): Promise<void> {
    console.log("\n══ Integration: Repo — countBookings ══");

    const providerId = await createTestUser("bk_provider1", ["COMPANY"]);
    const tourId = await createTestTour(providerId, `${TEST_PREFIX} Booking Tour`);
    const traveler1 = await createTestUser("bk_traveler1");
    const traveler2 = await createTestUser("bk_traveler2");

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const fiftyDaysAgo = new Date();
    fiftyDaysAgo.setDate(fiftyDaysAgo.getDate() - 50);

    // Recent booking
    await createTestBooking(traveler1, "TOUR", tourId, tenDaysAgo);
    // Old booking
    await createTestBooking(traveler2, "TOUR", tourId, fiftyDaysAgo);

    const entityMap: Record<AnalyticsEntityType, string[]> = {
        TOUR: [tourId],
        GUIDE: [],
        DRIVER: [],
        COMPANY: [],
    };

    // All-time
    const total = await analyticsRepo.countBookings(entityMap);
    assertEq(total, 2, "Total bookings = 2");

    // Last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recent = await analyticsRepo.countBookings(entityMap, thirtyDaysAgo);
    assertEq(recent, 1, "Recent bookings (last 30 days) = 1");

    // Empty entity map
    const emptyMap: Record<AnalyticsEntityType, string[]> = {
        TOUR: [],
        GUIDE: [],
        DRIVER: [],
        COMPANY: [],
    };
    const emptyCount = await analyticsRepo.countBookings(emptyMap);
    assertEq(emptyCount, 0, "Empty entity map returns 0 bookings");
}

// ─── Integration Tests: getAggregateRatings ──────────────────

async function testGetAggregateRatings(): Promise<void> {
    console.log("\n══ Integration: Repo — getAggregateRatings ══");

    const providerId = await createTestUser("rating_provider1", ["COMPANY", "GUIDE"]);
    const companyId = await createTestCompany(providerId);
    const guideId = await createTestGuide(providerId);
    const tourId = await createTestTour(providerId, `${TEST_PREFIX} Rating Tour`);

    const traveler1 = await createTestUser("rating_traveler1");
    const traveler2 = await createTestUser("rating_traveler2");
    const traveler3 = await createTestUser("rating_traveler3");

    // Tour reviews: 4 and 5
    await createTestReview(traveler1, ReviewTargetType.TOUR, tourId, 4);
    await createTestReview(traveler2, ReviewTargetType.TOUR, tourId, 5);

    // Guide review: 3
    await createTestReview(traveler3, ReviewTargetType.GUIDE, guideId, 3);

    // Company review: 5
    await createTestReview(traveler1, ReviewTargetType.COMPANY, companyId, 5);

    const entityMap: Record<AnalyticsEntityType, string[]> = {
        TOUR: [tourId],
        GUIDE: [guideId],
        DRIVER: [],
        COMPANY: [companyId],
    };

    const result = await analyticsRepo.getAggregateRatings(entityMap);

    // Average: (4 + 5 + 3 + 5) / 4 = 17 / 4 = 4.25
    assertEq(result.reviewCount, 4, "Review count = 4");
    assert(result.avgRating !== null, "Average rating is not null");
    if (result.avgRating !== null) {
        // Prisma returns Decimal, check approximate equality
        const diff = Math.abs(result.avgRating - 4.25);
        assert(diff < 0.01, `Average rating ≈ 4.25 (got ${result.avgRating})`);
    }

    // No reviews
    const emptyMap: Record<AnalyticsEntityType, string[]> = {
        TOUR: [],
        GUIDE: [],
        DRIVER: [],
        COMPANY: [],
    };
    const emptyResult = await analyticsRepo.getAggregateRatings(emptyMap);
    assertEq(emptyResult.avgRating, null, "No reviews: avgRating = null");
    assertEq(emptyResult.reviewCount, 0, "No reviews: reviewCount = 0");
}

// ─── Integration Tests: Service — getProviderAnalytics ───────

async function testGetProviderAnalytics(): Promise<void> {
    console.log("\n══ Integration: Service — getProviderAnalytics ══");

    // Full provider with data
    const providerId = await createTestUser("svc_provider1", ["COMPANY"]);
    const companyId = await createTestCompany(providerId);
    const tourId = await createTestTour(providerId, `${TEST_PREFIX} Svc Tour`);

    const traveler1 = await createTestUser("svc_traveler1");
    const traveler2 = await createTestUser("svc_traveler2");

    // Add favorites
    await createTestFavorite(traveler1, "TOUR", tourId);
    await createTestFavorite(traveler2, "COMPANY", companyId);

    // Add booking
    await createTestBooking(traveler1, "TOUR", tourId);

    // Add review
    await createTestReview(traveler1, ReviewTargetType.TOUR, tourId, 4);

    // Add inquiry (responded)
    await createTestInquiry(
        traveler1,
        providerId,
        InquiryTargetType.TOUR,
        tourId,
        InquiryStatus.ACCEPTED
    );

    const analytics = await analyticsService.getProviderAnalytics(
        providerId,
        ["COMPANY"] as UserRole[]
    );

    // Verify structure
    assert(typeof analytics.views.total === "number", "views.total is number");
    assert(
        typeof analytics.views.last30Days === "number",
        "views.last30Days is number"
    );
    assertEq(analytics.inquiries.total, 1, "Inquiry total = 1");
    assertEq(analytics.inquiries.last30Days, 1, "Inquiry last30Days = 1");
    assertEq(analytics.favorites.total, 2, "Favorites total = 2");
    assertGte(analytics.bookings.total, 1, "Bookings total >= 1");
    assertEq(analytics.reviewCount, 1, "Review count = 1");
    assert(analytics.avgRating !== null, "Average rating is not null");
    if (analytics.avgRating !== null) {
        assertEq(analytics.avgRating, 4, "Average rating = 4");
    }

    // Response rate: 1 responded / 1 total = 1.0
    assertEq(
        analytics.inquiries.responseRate,
        1,
        "Response rate = 1.0 (100%)"
    );
}

async function testGetProviderAnalyticsEmpty(): Promise<void> {
    console.log("\n══ Integration: Service — getProviderAnalytics (empty) ══");

    const providerId = await createTestUser("svc_empty1", ["GUIDE"]);
    await createTestGuide(providerId);

    const analytics = await analyticsService.getProviderAnalytics(
        providerId,
        ["GUIDE"] as UserRole[]
    );

    assertEq(analytics.views.total, 0, "Empty provider: views.total = 0");
    assertEq(analytics.views.last30Days, 0, "Empty provider: views.last30Days = 0");
    assertEq(analytics.inquiries.total, 0, "Empty provider: inquiries.total = 0");
    assertEq(analytics.inquiries.responseRate, 0, "Empty provider: responseRate = 0");
    assertEq(analytics.favorites.total, 0, "Empty provider: favorites.total = 0");
    assertEq(analytics.bookings.total, 0, "Empty provider: bookings.total = 0");
    assertEq(analytics.avgRating, null, "Empty provider: avgRating = null");
    assertEq(analytics.reviewCount, 0, "Empty provider: reviewCount = 0");
}

async function testGetProviderAnalyticsNonProvider(): Promise<void> {
    console.log("\n══ Integration: Service — getProviderAnalytics (non-provider) ══");

    const regularUserId = await createTestUser("svc_regular1");

    await assertThrows(
        () =>
            analyticsService.getProviderAnalytics(regularUserId, [
                "USER",
            ] as UserRole[]),
        "NOT_A_PROVIDER",
        "Non-provider throws NOT_A_PROVIDER"
    );
}

// ─── Integration Tests: Service — response rate edge cases ───

async function testResponseRateEdgeCases(): Promise<void> {
    console.log("\n══ Integration: Service — response rate edge cases ══");

    // Provider with all PENDING inquiries → response rate should be 0
    const provider1 = await createTestUser("rr_provider1", ["COMPANY"]);
    await createTestCompany(provider1);
    const tour1 = await createTestTour(provider1, `${TEST_PREFIX} RR Tour 1`);
    const t1 = await createTestUser("rr_traveler1");
    const t2 = await createTestUser("rr_traveler2");

    await createTestInquiry(
        t1,
        provider1,
        InquiryTargetType.TOUR,
        tour1,
        InquiryStatus.PENDING
    );
    await createTestInquiry(
        t2,
        provider1,
        InquiryTargetType.TOUR,
        tour1,
        InquiryStatus.PENDING
    );

    const analytics1 = await analyticsService.getProviderAnalytics(
        provider1,
        ["COMPANY"] as UserRole[]
    );
    assertEq(
        analytics1.inquiries.responseRate,
        0,
        "All PENDING: responseRate = 0"
    );
    assertEq(analytics1.inquiries.total, 2, "All PENDING: total = 2");

    // Provider with mix of statuses (tests response rate calculation precision)
    const provider2 = await createTestUser("rr_provider2", ["GUIDE"]);
    await createTestGuide(provider2);
    const t3 = await createTestUser("rr_traveler3");
    const t4 = await createTestUser("rr_traveler4");
    const t5 = await createTestUser("rr_traveler5");

    await createTestInquiry(
        t3,
        provider2,
        InquiryTargetType.GUIDE,
        "00000000-0000-0000-0000-000000000000", // dummy target
        InquiryStatus.ACCEPTED
    );
    await createTestInquiry(
        t4,
        provider2,
        InquiryTargetType.GUIDE,
        "00000000-0000-0000-0000-000000000000",
        InquiryStatus.PENDING
    );
    await createTestInquiry(
        t5,
        provider2,
        InquiryTargetType.GUIDE,
        "00000000-0000-0000-0000-000000000000",
        InquiryStatus.DECLINED
    );

    const analytics2 = await analyticsService.getProviderAnalytics(
        provider2,
        ["GUIDE"] as UserRole[]
    );
    // Expected: 2 responded / 3 total = 0.67
    assertEq(analytics2.inquiries.total, 3, "Mixed statuses: total = 3");
    assertEq(
        analytics2.inquiries.responseRate,
        0.67,
        "Mixed statuses: responseRate = 0.67"
    );
}

// ─── Integration Tests: Multi-entity provider ────────────────

async function testMultiEntityProvider(): Promise<void> {
    console.log("\n══ Integration: Service — multi-entity provider ══");

    // A user who is both a COMPANY and GUIDE
    const multiUserId = await createTestUser("multi_provider1", [
        "COMPANY",
        "GUIDE",
    ]);
    const companyId = await createTestCompany(multiUserId);
    const guideId = await createTestGuide(multiUserId);
    const tour1 = await createTestTour(multiUserId, `${TEST_PREFIX} Multi Tour 1`);
    const tour2 = await createTestTour(multiUserId, `${TEST_PREFIX} Multi Tour 2`);

    const traveler = await createTestUser("multi_traveler1");

    // Favorites across entities
    await createTestFavorite(traveler, "TOUR", tour1);
    await createTestFavorite(traveler, "GUIDE", guideId);
    await createTestFavorite(traveler, "COMPANY", companyId);

    // Reviews across entities
    await createTestReview(traveler, ReviewTargetType.TOUR, tour1, 5);
    await createTestReview(traveler, ReviewTargetType.GUIDE, guideId, 4);

    // Bookings across entities
    await createTestBooking(traveler, "TOUR", tour1);
    await createTestBooking(traveler, "GUIDE", guideId);

    const analytics = await analyticsService.getProviderAnalytics(
        multiUserId,
        ["COMPANY", "GUIDE"] as UserRole[]
    );

    assertEq(analytics.favorites.total, 3, "Multi-entity: favorites = 3");
    assertEq(analytics.reviewCount, 2, "Multi-entity: reviewCount = 2");
    assertGte(analytics.bookings.total, 2, "Multi-entity: bookings >= 2");
    assert(
        analytics.avgRating !== null,
        "Multi-entity: avgRating is not null"
    );
    if (analytics.avgRating !== null) {
        // (5 + 4) / 2 = 4.5
        const diff = Math.abs(analytics.avgRating - 4.5);
        assert(diff < 0.01, `Multi-entity: avgRating ≈ 4.5 (got ${analytics.avgRating})`);
    }
}

// ─── Integration Tests: trackView ────────────────────────────

async function testTrackView(): Promise<void> {
    console.log("\n══ Integration: Service — trackView ══");

    const fakeEntityId = "00000000-0000-0000-0000-000000000001";

    // trackView should not throw even if Redis is down
    let threw = false;
    try {
        await analyticsService.trackView("TOUR", fakeEntityId, undefined, undefined);
    } catch {
        threw = true;
    }
    assert(!threw, "trackView does not throw (even if Redis is down)");

    // Bot filtering — should silently skip
    threw = false;
    try {
        await analyticsService.trackView(
            "TOUR",
            fakeEntityId,
            "user123",
            "Googlebot/2.1 (+http://www.google.com/bot.html)"
        );
    } catch {
        threw = true;
    }
    assert(!threw, "trackView does not throw for bot traffic");

    // Verify bot patterns
    const botAgents = [
        "Googlebot/2.1",
        "Mozilla/5.0 (compatible; bingbot/2.0)",
        "Slurp",
        "Wget/1.21",
        "curl/7.68.0",
        "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)",
    ];

    // Test that the bot regex correctly identifies bots
    const botRegex = /bot|crawler|spider|slurp|wget|curl/i;
    for (const agent of botAgents) {
        assert(
            botRegex.test(agent),
            `Bot detection: "${agent.slice(0, 30)}..." matched`
        );
    }

    // Legitimate user agents should not match
    const legitimateAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    ];
    for (const agent of legitimateAgents) {
        assert(
            !botRegex.test(agent),
            `Non-bot: "${agent.slice(0, 40)}..." not matched`
        );
    }
}

// ─── Integration Tests: getViewCounts ────────────────────────

async function testGetViewCounts(): Promise<void> {
    console.log("\n══ Integration: Service — getViewCounts ══");

    // When Redis is not connected, should return zeros
    const result = await analyticsService.getViewCounts("TOUR", "nonexistent-id");
    assert(
        typeof result.total === "number",
        "getViewCounts returns number for total"
    );
    assert(
        typeof result.last30Days === "number",
        "getViewCounts returns number for last30Days"
    );
    // Can't assert exact values since Redis may or may not be connected
    console.log(
        `  ℹ️  Views for nonexistent entity: total=${result.total}, last30Days=${result.last30Days}`
    );
}

// ─── Bug Hunt: Edge Cases ────────────────────────────────────

async function testEdgeCases(): Promise<void> {
    console.log("\n══ Bug Hunt: Edge Cases ══");

    // 1. Provider with ONLY inactive tours — should see 0 tour-related data
    const inactiveProvider = await createTestUser("edge_inactive1", ["COMPANY"]);
    await createTestCompany(inactiveProvider);
    await createTestTour(inactiveProvider, `${TEST_PREFIX} Inactive Only`, false);

    const entityMap = await analyticsRepo.getOwnedEntityIds(inactiveProvider);
    assertEq(
        entityMap.TOUR.length,
        0,
        "Provider with only inactive tours: 0 tours in entity map"
    );

    // 2. getProviderAnalytics should handle provider with company but no tours
    const noToursProvider = await createTestUser("edge_notours1", ["COMPANY"]);
    await createTestCompany(noToursProvider);

    let threw = false;
    try {
        await analyticsService.getProviderAnalytics(
            noToursProvider,
            ["COMPANY"] as UserRole[]
        );
    } catch {
        threw = true;
    }
    assert(!threw, "Provider with company but no tours does not crash");

    // 3. Reviews for inactive tours shouldn't appear (since inactive tours aren't in entityMap)
    const providerWithInactive = await createTestUser("edge_review_inactive1", [
        "COMPANY",
    ]);
    await createTestCompany(providerWithInactive);
    const activeTourId = await createTestTour(
        providerWithInactive,
        `${TEST_PREFIX} Edge Active Tour`
    );
    const inactiveTourId = await createTestTour(
        providerWithInactive,
        `${TEST_PREFIX} Edge Inactive Tour`,
        false
    );

    const reviewer = await createTestUser("edge_reviewer1");
    // Review on active tour (rating 5)
    await createTestReview(reviewer, ReviewTargetType.TOUR, activeTourId, 5);
    // Review on inactive tour (rating 1) — should NOT be counted
    await createTestReview(reviewer, ReviewTargetType.TOUR, inactiveTourId, 1);

    const edgeEntityMap = await analyticsRepo.getOwnedEntityIds(providerWithInactive);
    const ratings = await analyticsRepo.getAggregateRatings(edgeEntityMap);

    assertEq(
        ratings.reviewCount,
        1,
        "Only active tour reviews counted (not inactive)"
    );
    assertEq(
        ratings.avgRating,
        5,
        "Average rating only includes active tour reviews"
    );

    // 4. Multiple roles on same user — verify no double counting
    const multiRole = await createTestUser("edge_multi_role1", [
        "COMPANY",
        "GUIDE",
        "DRIVER",
    ]);
    await createTestCompany(multiRole);
    await createTestGuide(multiRole);
    await createTestDriver(multiRole);
    const mrTour = await createTestTour(multiRole, `${TEST_PREFIX} MultiRole Tour`);

    const mrTraveler = await createTestUser("edge_mr_traveler1");
    // One favorite for the tour
    await createTestFavorite(mrTraveler, "TOUR", mrTour);

    const mrAnalytics = await analyticsService.getProviderAnalytics(
        multiRole,
        ["COMPANY", "GUIDE", "DRIVER"] as UserRole[]
    );
    assertEq(
        mrAnalytics.favorites.total,
        1,
        "Multi-role provider: favorite counted once, not duplicated"
    );
}

// ─── Cleanup ─────────────────────────────────────────────────

async function cleanup(): Promise<void> {
    console.log("\n🧹 Cleaning up test data...");

    // Delete in dependency order
    if (createdBookingIds.length > 0) {
        await prisma.booking.deleteMany({
            where: { id: { in: createdBookingIds } },
        });
    }

    if (createdReviewIds.length > 0) {
        await prisma.review.deleteMany({
            where: { id: { in: createdReviewIds } },
        });
    }

    if (createdFavoriteIds.length > 0) {
        await prisma.favorite.deleteMany({
            where: { id: { in: createdFavoriteIds } },
        });
    }

    if (createdInquiryResponseIds.length > 0) {
        await prisma.inquiryResponse.deleteMany({
            where: { id: { in: createdInquiryResponseIds } },
        });
    }

    if (createdInquiryIds.length > 0) {
        await prisma.inquiry.deleteMany({
            where: { id: { in: createdInquiryIds } },
        });
    }

    if (createdGuideIds.length > 0) {
        await prisma.guide.deleteMany({
            where: { id: { in: createdGuideIds } },
        });
    }

    if (createdDriverIds.length > 0) {
        await prisma.driver.deleteMany({
            where: { id: { in: createdDriverIds } },
        });
    }

    if (createdCompanyIds.length > 0) {
        await prisma.company.deleteMany({
            where: { id: { in: createdCompanyIds } },
        });
    }

    if (createdTourIds.length > 0) {
        await prisma.tour.deleteMany({
            where: { id: { in: createdTourIds } },
        });
    }

    if (createdUserIds.length > 0) {
        await prisma.userRoleAssignment.deleteMany({
            where: { userId: { in: createdUserIds } },
        });
        await prisma.user.deleteMany({
            where: { id: { in: createdUserIds } },
        });
    }

    console.log(
        `  Removed ${createdUserIds.length} users, ${createdTourIds.length} tours, ` +
            `${createdReviewIds.length} reviews, ${createdFavoriteIds.length} favorites, ` +
            `${createdBookingIds.length} bookings, ${createdInquiryIds.length} inquiries`
    );
}

// ─── Main ────────────────────────────────────────────────────

async function main(): Promise<void> {
    console.log("🧪 Analytics Module Tests");
    console.log("═══════════════════════════════════════");

    try {
        // Unit tests (no DB)
        testSchemas();

        // Integration tests — Repository
        await testGetOwnedEntityIds();
        await testCountInquiries();
        await testCountFavorites();
        await testCountBookings();
        await testGetAggregateRatings();

        // Integration tests — Service
        await testGetProviderAnalytics();
        await testGetProviderAnalyticsEmpty();
        await testGetProviderAnalyticsNonProvider();
        await testResponseRateEdgeCases();
        await testMultiEntityProvider();

        // View tracking (Redis-dependent)
        await testTrackView();
        await testGetViewCounts();

        // Bug hunting: edge cases
        await testEdgeCases();
    } finally {
        await cleanup();
        await prisma.$disconnect();
    }

    // Summary
    console.log("\n═══════════════════════════════════════");
    console.log(`📊 Results: ${passed} passed, ${failed} failed`);

    if (failed > 0) {
        console.log("\n❌ FAILURES:");
        for (const f of failures) {
            console.log(`   • ${f}`);
        }
        process.exit(1);
    } else {
        console.log("\n✅ All tests passed!");
    }
}

main();
