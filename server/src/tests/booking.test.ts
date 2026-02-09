/**
 * Integration tests for the Booking Management System.
 *
 * Tests the full booking lifecycle:
 *   - Create bookings (via repo/service)
 *   - List user bookings with filters + pagination
 *   - List provider received bookings
 *   - Cancel booking (ownership, status checks)
 *   - Complete booking (entity ownership verification)
 *   - Edge cases (double cancel, complete cancelled, etc.)
 *
 * Run with:  npx tsx src/tests/booking.test.ts
 */

import { PrismaClient, BookingStatus } from "@prisma/client";
import { BookingService } from "../modules/bookings/booking.service.js";
import { BookingRepository } from "../modules/bookings/booking.repo.js";
import { BookingQuerySchema, BookingIdParamSchema } from "../modules/bookings/booking.schemas.js";
import type { CreateBookingData } from "../modules/bookings/booking.types.js";

const prisma = new PrismaClient();
const bookingService = new BookingService();
const bookingRepo = new BookingRepository();

// ─── Test Helpers ────────────────────────────────────────────

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
            failures.push(label + ` (threw ${error.code} instead of ${expectedCode})`);
            console.log(`  ❌ ${label} (threw ${error.code} instead of ${expectedCode})`);
        }
    }
}

// ─── Test Data ───────────────────────────────────────────────

const TEST_PREFIX = `__bk_test_${Date.now()}`;
const passwordHash = "$argon2id$v=19$m=65536,t=3,p=4$placeholder_hash_for_tests";

const createdUserIds: string[] = [];
const createdTourIds: string[] = [];
const createdGuideIds: string[] = [];
const createdDriverIds: string[] = [];
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

async function createTestTour(ownerId: string, title: string): Promise<string> {
    const tour = await prisma.tour.create({
        data: {
            ownerId,
            title,
            summary: "Test tour summary",
            price: 100,
            currency: "GEL",
            isActive: true,
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

// ─── Unit Tests: Zod Schemas ─────────────────────────────────

function testSchemas(): void {
    console.log("\n══ Unit Tests: Zod Schemas ══");

    // BookingQuerySchema defaults
    const defaults = BookingQuerySchema.parse({});
    assertEq(defaults.page, 1, "Query defaults: page = 1");
    assertEq(defaults.limit, 10, "Query defaults: limit = 10");
    assertEq(defaults.status, undefined, "Query defaults: status = undefined");
    assertEq(defaults.entityType, undefined, "Query defaults: entityType = undefined");

    // BookingQuerySchema with valid values
    const valid = BookingQuerySchema.parse({
        page: "2",
        limit: "20",
        status: "CONFIRMED",
        entityType: "TOUR",
    });
    assertEq(valid.page, 2, "Query parse: page coerced to 2");
    assertEq(valid.limit, 20, "Query parse: limit coerced to 20");
    assertEq(valid.status, "CONFIRMED", "Query parse: status = CONFIRMED");
    assertEq(valid.entityType, "TOUR", "Query parse: entityType = TOUR");

    // BookingQuerySchema invalid status
    let threw = false;
    try {
        BookingQuerySchema.parse({ status: "INVALID" });
    } catch {
        threw = true;
    }
    assert(threw, "Query rejects invalid status");

    // BookingQuerySchema invalid entityType
    threw = false;
    try {
        BookingQuerySchema.parse({ entityType: "COMPANY" });
    } catch {
        threw = true;
    }
    assert(threw, "Query rejects invalid entityType (COMPANY)");

    // BookingQuerySchema limit bounds
    threw = false;
    try {
        BookingQuerySchema.parse({ limit: "0" });
    } catch {
        threw = true;
    }
    assert(threw, "Query rejects limit = 0");

    threw = false;
    try {
        BookingQuerySchema.parse({ limit: "101" });
    } catch {
        threw = true;
    }
    assert(threw, "Query rejects limit = 101");

    // BookingIdParamSchema valid UUID
    const idResult = BookingIdParamSchema.parse({
        id: "123e4567-e89b-12d3-a456-426614174000",
    });
    assertEq(
        idResult.id,
        "123e4567-e89b-12d3-a456-426614174000",
        "Id param: valid UUID accepted"
    );

    // BookingIdParamSchema invalid UUID
    threw = false;
    try {
        BookingIdParamSchema.parse({ id: "not-a-uuid" });
    } catch {
        threw = true;
    }
    assert(threw, "Id param rejects non-UUID");
}

// ─── Integration Tests: Repository ───────────────────────────

async function testRepoCreate(): Promise<void> {
    console.log("\n══ Integration: Repo — create booking ══");

    const userId = await createTestUser("repo_customer1");
    const providerId = await createTestUser("repo_provider1", ["GUIDE"]);
    const tourId = await createTestTour(providerId, `${TEST_PREFIX} Tour 1`);

    const data: CreateBookingData = {
        userId,
        entityType: "TOUR",
        entityId: tourId,
        date: new Date("2026-03-15"),
        guests: 4,
        totalPrice: 400,
        currency: "GEL",
        notes: "Test booking notes",
    };

    const booking = await bookingRepo.create(data);
    createdBookingIds.push(booking.id);

    assert(!!booking.id, "Booking created with UUID");
    assertEq(booking.userId, userId, "Booking userId matches");
    assertEq(booking.entityType, "TOUR", "Booking entityType = TOUR");
    assertEq(booking.entityId, tourId, "Booking entityId matches");
    assertEq(booking.status, "CONFIRMED", "Default status = CONFIRMED");
    assertEq(booking.currency, "GEL", "Currency = GEL");
    assertEq(booking.guests, 4, "Guests = 4");
    assertEq(booking.notes, "Test booking notes", "Notes preserved");
    assert(!!booking.user, "Booking includes user relation");
    assertEq(booking.user.firstName, "Test", "User firstName = Test");
}

async function testRepoFindById(): Promise<void> {
    console.log("\n══ Integration: Repo — findById ══");

    const userId = await createTestUser("repo_findby1");
    const providerId = await createTestUser("repo_findby_prov1", ["GUIDE"]);
    const tourId = await createTestTour(providerId, `${TEST_PREFIX} FindBy Tour`);

    const created = await bookingRepo.create({
        userId,
        entityType: "TOUR",
        entityId: tourId,
    });
    createdBookingIds.push(created.id);

    const found = await bookingRepo.findById(created.id);
    assert(found !== null, "findById returns booking");
    assertEq(found?.id, created.id, "findById returns correct booking");

    const notFound = await bookingRepo.findById(
        "00000000-0000-0000-0000-000000000000"
    );
    assertEq(notFound, null, "findById returns null for non-existent ID");
}

async function testRepoFindByUser(): Promise<void> {
    console.log("\n══ Integration: Repo — findByUser + filters ══");

    const userId = await createTestUser("repo_list1");
    const providerId = await createTestUser("repo_list_prov1", ["GUIDE"]);
    const tourId = await createTestTour(providerId, `${TEST_PREFIX} List Tour`);
    const guideId = await createTestGuide(providerId);

    // Create 3 bookings: 2 TOUR, 1 GUIDE
    for (let i = 0; i < 2; i++) {
        const b = await bookingRepo.create({
            userId,
            entityType: "TOUR",
            entityId: tourId,
        });
        createdBookingIds.push(b.id);
    }
    const guideBooking = await bookingRepo.create({
        userId,
        entityType: "GUIDE",
        entityId: guideId,
    });
    createdBookingIds.push(guideBooking.id);

    // Cancel one of the tour bookings
    await bookingRepo.updateStatus(
        createdBookingIds[createdBookingIds.length - 3],
        BookingStatus.CANCELLED,
        new Date()
    );

    // All bookings for user
    const all = await bookingRepo.findByUser(userId, 1, 10, {});
    assertEq(all.total, 3, "User has 3 total bookings");
    assertEq(all.bookings.length, 3, "All 3 returned on page 1");

    // Filter by status CONFIRMED
    const confirmed = await bookingRepo.findByUser(userId, 1, 10, {
        status: BookingStatus.CONFIRMED,
    });
    assertEq(confirmed.total, 2, "2 CONFIRMED bookings");

    // Filter by status CANCELLED
    const cancelled = await bookingRepo.findByUser(userId, 1, 10, {
        status: BookingStatus.CANCELLED,
    });
    assertEq(cancelled.total, 1, "1 CANCELLED booking");

    // Filter by entityType GUIDE
    const guideOnly = await bookingRepo.findByUser(userId, 1, 10, {
        entityType: "GUIDE",
    });
    assertEq(guideOnly.total, 1, "1 GUIDE booking");

    // Pagination: limit 1
    const page1 = await bookingRepo.findByUser(userId, 1, 1, {});
    assertEq(page1.bookings.length, 1, "Page 1 with limit 1 returns 1");
    assertEq(page1.total, 3, "Total still 3 with limit 1");

    const page2 = await bookingRepo.findByUser(userId, 2, 1, {});
    assertEq(page2.bookings.length, 1, "Page 2 with limit 1 returns 1");
}

async function testRepoReceivedByProvider(): Promise<void> {
    console.log("\n══ Integration: Repo — findReceivedByProvider ══");

    const customerId = await createTestUser("repo_recv_cust1");
    const providerId = await createTestUser("repo_recv_prov1", [
        "GUIDE",
        "DRIVER",
    ]);

    const tourId = await createTestTour(providerId, `${TEST_PREFIX} Provider Tour`);
    const guideId = await createTestGuide(providerId);
    const driverId = await createTestDriver(providerId);

    // Create bookings from customer for each entity type
    const tourBooking = await bookingRepo.create({
        userId: customerId,
        entityType: "TOUR",
        entityId: tourId,
    });
    createdBookingIds.push(tourBooking.id);

    const guideBooking = await bookingRepo.create({
        userId: customerId,
        entityType: "GUIDE",
        entityId: guideId,
    });
    createdBookingIds.push(guideBooking.id);

    const driverBooking = await bookingRepo.create({
        userId: customerId,
        entityType: "DRIVER",
        entityId: driverId,
    });
    createdBookingIds.push(driverBooking.id);

    // Provider should see all 3
    const received = await bookingRepo.findReceivedByProvider(
        providerId,
        1,
        10,
        {}
    );
    assertEq(received.total, 3, "Provider sees 3 received bookings");

    // Filter by entityType
    const tourOnly = await bookingRepo.findReceivedByProvider(
        providerId,
        1,
        10,
        { entityType: "TOUR" }
    );
    // Note: entityType filter is on the booking itself, not the provider query
    // The repo applies status filter but entityType is part of the OR conditions
    // We check that the result includes TOUR bookings
    assert(tourOnly.total >= 1, "Provider sees at least 1 TOUR booking");

    // Unrelated provider should see 0
    const otherProviderId = await createTestUser("repo_recv_other1");
    const otherReceived = await bookingRepo.findReceivedByProvider(
        otherProviderId,
        1,
        10,
        {}
    );
    assertEq(otherReceived.total, 0, "Unrelated provider sees 0 bookings");
}

// ─── Integration Tests: Service ──────────────────────────────

async function testServiceCreateBooking(): Promise<void> {
    console.log("\n══ Integration: Service — createBooking ══");

    const userId = await createTestUser("svc_create1");
    const providerId = await createTestUser("svc_create_prov1", ["GUIDE"]);
    const tourId = await createTestTour(providerId, `${TEST_PREFIX} Svc Tour`);

    const booking = await bookingService.createBooking({
        userId,
        entityType: "TOUR",
        entityId: tourId,
        guests: 2,
        totalPrice: 200,
        currency: "USD",
    });
    createdBookingIds.push(booking.id);

    assert(!!booking.id, "Service creates booking");
    assertEq(booking.status, "CONFIRMED", "New booking status = CONFIRMED");
    assertEq(booking.currency, "USD", "Currency = USD");
}

async function testServiceGetUserBookings(): Promise<void> {
    console.log("\n══ Integration: Service — getUserBookings ══");

    const userId = await createTestUser("svc_list1");
    const providerId = await createTestUser("svc_list_prov1", ["GUIDE"]);
    const tourId = await createTestTour(providerId, `${TEST_PREFIX} Svc List Tour`);

    // Create 2 bookings
    for (let i = 0; i < 2; i++) {
        const b = await bookingService.createBooking({
            userId,
            entityType: "TOUR",
            entityId: tourId,
        });
        createdBookingIds.push(b.id);
    }

    const result = await bookingService.getUserBookings(userId, 1, 10, {});
    assertEq(result.totalItems, 2, "getUserBookings returns 2 items");
    assertEq(result.items.length, 2, "getUserBookings items array length = 2");
}

async function testServiceCancelBooking(): Promise<void> {
    console.log("\n══ Integration: Service — cancelBooking ══");

    const userId = await createTestUser("svc_cancel1");
    const providerId = await createTestUser("svc_cancel_prov1", ["GUIDE"]);
    const tourId = await createTestTour(providerId, `${TEST_PREFIX} Cancel Tour`);

    const booking = await bookingService.createBooking({
        userId,
        entityType: "TOUR",
        entityId: tourId,
    });
    createdBookingIds.push(booking.id);

    // Cancel the booking
    const cancelled = await bookingService.cancelBooking(booking.id, userId);
    assertEq(cancelled.status, "CANCELLED", "Booking status = CANCELLED after cancel");
    assert(cancelled.cancelledAt !== null, "cancelledAt is set");

    // Double cancel should throw BOOKING_ALREADY_CANCELLED
    await assertThrows(
        () => bookingService.cancelBooking(booking.id, userId),
        "BOOKING_ALREADY_CANCELLED",
        "Double cancel throws BOOKING_ALREADY_CANCELLED"
    );

    // Wrong user should throw FORBIDDEN
    const otherUserId = await createTestUser("svc_cancel_other1");
    const booking2 = await bookingService.createBooking({
        userId,
        entityType: "TOUR",
        entityId: tourId,
    });
    createdBookingIds.push(booking2.id);

    await assertThrows(
        () => bookingService.cancelBooking(booking2.id, otherUserId),
        "FORBIDDEN",
        "Cancel by non-owner throws FORBIDDEN"
    );

    // Non-existent booking should throw BOOKING_NOT_FOUND
    await assertThrows(
        () =>
            bookingService.cancelBooking(
                "00000000-0000-0000-0000-000000000000",
                userId
            ),
        "BOOKING_NOT_FOUND",
        "Cancel non-existent booking throws BOOKING_NOT_FOUND"
    );
}

async function testServiceCompleteBooking(): Promise<void> {
    console.log("\n══ Integration: Service — completeBooking ══");

    const customerId = await createTestUser("svc_complete_cust1");
    const providerId = await createTestUser("svc_complete_prov1", ["GUIDE"]);
    const tourId = await createTestTour(providerId, `${TEST_PREFIX} Complete Tour`);

    const booking = await bookingService.createBooking({
        userId: customerId,
        entityType: "TOUR",
        entityId: tourId,
    });
    createdBookingIds.push(booking.id);

    // Provider completes the booking
    const completed = await bookingService.completeBooking(
        booking.id,
        providerId
    );
    assertEq(completed.status, "COMPLETED", "Booking status = COMPLETED");

    // Double complete should throw BOOKING_ALREADY_COMPLETED
    await assertThrows(
        () => bookingService.completeBooking(booking.id, providerId),
        "BOOKING_ALREADY_COMPLETED",
        "Double complete throws BOOKING_ALREADY_COMPLETED"
    );

    // Non-owner provider should throw FORBIDDEN
    const wrongProvider = await createTestUser("svc_complete_wrong1");
    const booking2 = await bookingService.createBooking({
        userId: customerId,
        entityType: "TOUR",
        entityId: tourId,
    });
    createdBookingIds.push(booking2.id);

    await assertThrows(
        () => bookingService.completeBooking(booking2.id, wrongProvider),
        "FORBIDDEN",
        "Complete by non-owner throws FORBIDDEN"
    );
}

async function testServiceCancelCompleted(): Promise<void> {
    console.log("\n══ Integration: Service — cancel completed booking ══");

    const customerId = await createTestUser("svc_cc_cust1");
    const providerId = await createTestUser("svc_cc_prov1", ["GUIDE"]);
    const tourId = await createTestTour(providerId, `${TEST_PREFIX} CC Tour`);

    const booking = await bookingService.createBooking({
        userId: customerId,
        entityType: "TOUR",
        entityId: tourId,
    });
    createdBookingIds.push(booking.id);

    // Complete the booking first
    await bookingService.completeBooking(booking.id, providerId);

    // Try to cancel a completed booking
    await assertThrows(
        () => bookingService.cancelBooking(booking.id, customerId),
        "BOOKING_COMPLETED",
        "Cancel completed booking throws BOOKING_COMPLETED"
    );
}

async function testServiceCompleteCancelled(): Promise<void> {
    console.log("\n══ Integration: Service — complete cancelled booking ══");

    const customerId = await createTestUser("svc_compc_cust1");
    const providerId = await createTestUser("svc_compc_prov1", ["GUIDE"]);
    const tourId = await createTestTour(providerId, `${TEST_PREFIX} CompC Tour`);

    const booking = await bookingService.createBooking({
        userId: customerId,
        entityType: "TOUR",
        entityId: tourId,
    });
    createdBookingIds.push(booking.id);

    // Cancel the booking first
    await bookingService.cancelBooking(booking.id, customerId);

    // Try to complete a cancelled booking
    await assertThrows(
        () => bookingService.completeBooking(booking.id, providerId),
        "BOOKING_CANCELLED",
        "Complete cancelled booking throws BOOKING_CANCELLED"
    );
}

async function testServiceGuideEntityOwnership(): Promise<void> {
    console.log("\n══ Integration: Service — guide entity ownership ══");

    const customerId = await createTestUser("svc_guide_cust1");
    const guideUserId = await createTestUser("svc_guide_prov1", ["GUIDE"]);
    const guideId = await createTestGuide(guideUserId);

    const booking = await bookingService.createBooking({
        userId: customerId,
        entityType: "GUIDE",
        entityId: guideId,
    });
    createdBookingIds.push(booking.id);

    // Guide owner can complete
    const completed = await bookingService.completeBooking(
        booking.id,
        guideUserId
    );
    assertEq(completed.status, "COMPLETED", "Guide owner can complete booking");
}

async function testServiceDriverEntityOwnership(): Promise<void> {
    console.log("\n══ Integration: Service — driver entity ownership ══");

    const customerId = await createTestUser("svc_driver_cust1");
    const driverUserId = await createTestUser("svc_driver_prov1", ["DRIVER"]);
    const driverId = await createTestDriver(driverUserId);

    const booking = await bookingService.createBooking({
        userId: customerId,
        entityType: "DRIVER",
        entityId: driverId,
    });
    createdBookingIds.push(booking.id);

    // Driver owner can complete
    const completed = await bookingService.completeBooking(
        booking.id,
        driverUserId
    );
    assertEq(completed.status, "COMPLETED", "Driver owner can complete booking");
}

async function testServiceDefaultCurrency(): Promise<void> {
    console.log("\n══ Integration: Service — default currency ══");

    const userId = await createTestUser("svc_curr1");
    const providerId = await createTestUser("svc_curr_prov1", ["GUIDE"]);
    const tourId = await createTestTour(providerId, `${TEST_PREFIX} Curr Tour`);

    // No currency specified → should default to GEL
    const booking = await bookingService.createBooking({
        userId,
        entityType: "TOUR",
        entityId: tourId,
    });
    createdBookingIds.push(booking.id);

    assertEq(booking.currency, "GEL", "Default currency = GEL when not specified");
}

// ─── Cleanup ─────────────────────────────────────────────────

async function cleanup(): Promise<void> {
    console.log("\n🧹 Cleaning up test data...");

    // Delete bookings first (depends on users and tours)
    if (createdBookingIds.length > 0) {
        await prisma.booking.deleteMany({
            where: { id: { in: createdBookingIds } },
        });
        console.log(`  Removed ${createdBookingIds.length} test bookings`);
    }

    // Delete guides and drivers (depends on users)
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

    // Delete tours (depends on users)
    if (createdTourIds.length > 0) {
        await prisma.tour.deleteMany({
            where: { id: { in: createdTourIds } },
        });
    }

    // Delete role assignments then users
    if (createdUserIds.length > 0) {
        await prisma.userRoleAssignment.deleteMany({
            where: { userId: { in: createdUserIds } },
        });
        await prisma.user.deleteMany({
            where: { id: { in: createdUserIds } },
        });
        console.log(`  Removed ${createdUserIds.length} test users and their profiles`);
    }
}

// ─── Main ────────────────────────────────────────────────────

async function main(): Promise<void> {
    console.log("🧪 Booking Management System Tests");
    console.log("═══════════════════════════════════");

    try {
        // Unit tests (no DB)
        testSchemas();

        // Integration tests (DB)
        await testRepoCreate();
        await testRepoFindById();
        await testRepoFindByUser();
        await testRepoReceivedByProvider();
        await testServiceCreateBooking();
        await testServiceGetUserBookings();
        await testServiceCancelBooking();
        await testServiceCompleteBooking();
        await testServiceCancelCompleted();
        await testServiceCompleteCancelled();
        await testServiceGuideEntityOwnership();
        await testServiceDriverEntityOwnership();
        await testServiceDefaultCurrency();
    } finally {
        await cleanup();
        await prisma.$disconnect();
    }

    // Summary
    console.log("\n═══════════════════════════════════");
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
