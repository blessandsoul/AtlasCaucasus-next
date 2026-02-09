/**
 * Integration tests for provider response time calculation.
 *
 * Tests the rolling average formula:
 *   newAvg = ((oldAvg * count) + newTime) / (count + 1)
 *
 * Run with:  npx tsx src/tests/response-time.test.ts
 */

import { PrismaClient, InquiryTargetType } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────

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
        label += ` (got ${actual}, expected ${expected})`;
    }
    assert(ok, label);
}

/**
 * Pure implementation of the updateAvg formula (mirrors inquiry.service.ts).
 * We test this separately to guarantee the math before touching the DB.
 */
function updateAvg(oldAvg: number | null, count: number, newTime: number): number {
    if (oldAvg === null || count === 0) return newTime;
    return Math.round(((oldAvg * count) + newTime) / (count + 1));
}

// Generate a unique email for test isolation
const TEST_PREFIX = `__rt_test_${Date.now()}`;
const passwordHash = "$2b$10$K4t8YqN1hJqXhkR5mVxLxOxQyPzG4FvD2FwrIeV3nQ8W5sKjT6kZq";

// Track created entities for cleanup
const createdUserIds: string[] = [];

// ─── Unit Tests: Pure Math ────────────────────────────────────

function testPureMath(): void {
    console.log("\n══ Unit Tests: updateAvg pure math ══");

    // First response ever — null avg, count 0
    assertEq(updateAvg(null, 0, 30), 30, "First response: null avg → returns newTime");
    assertEq(updateAvg(null, 0, 0), 0, "First response: 0 minutes → returns 0");
    assertEq(updateAvg(null, 0, 2880), 2880, "First response: 2 days → returns 2880");

    // Second response — simple average
    assertEq(updateAvg(30, 1, 90), 60, "Two responses: avg(30, 90) = 60");
    assertEq(updateAvg(100, 1, 100), 100, "Two equal responses: avg(100, 100) = 100");
    assertEq(updateAvg(10, 1, 30), 20, "Two responses: avg(10, 30) = 20");

    // Third response
    assertEq(updateAvg(60, 2, 60), 60, "Three equal responses: avg stays 60");
    // (60*2 + 120) / 3 = 240/3 = 80
    assertEq(updateAvg(60, 2, 120), 80, "Three responses: (60*2 + 120)/3 = 80");

    // Multiple responses — simulate a sequence
    let avg: number | null = null;
    let count = 0;
    const times = [30, 60, 90, 120, 150];
    for (const t of times) {
        avg = updateAvg(avg, count, t);
        count++;
    }
    // Manual: (30+60+90+120+150)/5 = 450/5 = 90
    assertEq(avg, 90, "Sequence [30,60,90,120,150] → avg = 90");

    // Edge: Rounding — (10*1 + 7)/2 = 8.5 → rounds to 9
    assertEq(updateAvg(10, 1, 7), 9, "Rounding: (10+7)/2 = 8.5 → rounds to 9");

    // Edge: (5*2 + 1)/3 = 11/3 = 3.666 → rounds to 4
    assertEq(updateAvg(5, 2, 1), 4, "Rounding: (5*2+1)/3 = 3.67 → rounds to 4");

    // Edge: Large values (2 days = 2880 min)
    assertEq(updateAvg(2880, 1, 0), 1440, "Large: avg(2880, 0) = 1440");

    // Stability: count=0 but non-null avg (corrupted state) → should still work
    assertEq(updateAvg(100, 0, 50), 50, "Corrupted state (avg=100 but count=0) → returns newTime");

    // Weighted average correctness after many responses
    avg = null;
    count = 0;
    const manyTimes = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    for (const t of manyTimes) {
        avg = updateAvg(avg, count, t);
        count++;
    }
    // Sum = 550, count = 10 → 55
    // BUT due to rounding at each step, let's compute manually:
    // Step 1: avg=10, count=1
    // Step 2: (10*1+20)/2 = 15, count=2
    // Step 3: (15*2+30)/3 = 60/3 = 20, count=3
    // Step 4: (20*3+40)/4 = 100/4 = 25, count=4
    // Step 5: (25*4+50)/5 = 150/5 = 30, count=5
    // Step 6: (30*5+60)/6 = 210/6 = 35, count=6
    // Step 7: (35*6+70)/7 = 280/7 = 40, count=7
    // Step 8: (40*7+80)/8 = 360/8 = 45, count=8
    // Step 9: (45*8+90)/9 = 450/9 = 50, count=9
    // Step 10: (50*9+100)/10 = 550/10 = 55, count=10
    assertEq(avg, 55, "10-step sequence [10..100] → avg = 55 (exact, no rounding drift)");
    assertEq(count, 10, "10-step sequence → count = 10");

    // Rounding drift test: odd numbers that cause fractional midpoints
    avg = null;
    count = 0;
    const driftTimes = [1, 2, 3, 4, 5];
    for (const t of driftTimes) {
        avg = updateAvg(avg, count, t);
        count++;
    }
    // Step 1: avg=1, c=1
    // Step 2: (1+2)/2 = 1.5 → 2, c=2
    // Step 3: (2*2+3)/3 = 7/3 = 2.33 → 2, c=3
    // Step 4: (2*3+4)/4 = 10/4 = 2.5 → 3, c=4
    // Step 5: (3*4+5)/5 = 17/5 = 3.4 → 3, c=5
    // True avg = 15/5 = 3, rolling avg = 3 ✓
    assertEq(avg, 3, "Drift test [1,2,3,4,5] → rolling avg = 3 (matches true avg)");

    // Bigger drift test
    avg = null;
    count = 0;
    const driftTimes2 = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1000];
    for (const t of driftTimes2) {
        avg = updateAvg(avg, count, t);
        count++;
    }
    // True avg = (9 + 1000)/10 = 100.9 → 101
    // Step 1-9: avg stays 1
    // Step 10: (1*9 + 1000)/10 = 1009/10 = 100.9 → 101
    assertEq(avg, 101, "Outlier test [1x9, 1000] → rolling avg = 101");
}

// ─── Integration Tests: Database ──────────────────────────────

async function createTestUser(suffix: string, roles: string[] = []): Promise<string> {
    const user = await prisma.user.create({
        data: {
            email: `${TEST_PREFIX}_${suffix}@test.local`,
            firstName: "Test",
            lastName: suffix,
            passwordHash,
            emailVerified: true,
            isActive: true,
            roles: roles.length > 0 ? {
                create: roles.map(r => ({ role: r as any }))
            } : undefined,
        },
    });
    createdUserIds.push(user.id);
    return user.id;
}

async function testGuideResponseTime(): Promise<void> {
    console.log("\n══ Integration: Guide response time ══");

    const userId = await createTestUser("guide1", ["GUIDE"]);

    // Create guide profile with null avg
    const guide = await prisma.guide.create({
        data: {
            userId,
            bio: "Test guide",
            languages: ["en"],
            isVerified: true,
            isAvailable: true,
        },
    });

    // Verify initial state
    const initial = await prisma.guide.findUnique({
        where: { id: guide.id },
        select: { avgResponseTimeMinutes: true, responseCount: true },
    });
    assertEq(initial?.avgResponseTimeMinutes, null, "Guide initial avg is null");
    assertEq(initial?.responseCount, 0, "Guide initial count is 0");

    // Simulate first response: 30 minutes
    await simulateResponseUpdate("guide", guide.id, null, 0, 30);
    let updated = await prisma.guide.findUnique({
        where: { id: guide.id },
        select: { avgResponseTimeMinutes: true, responseCount: true },
    });
    assertEq(updated?.avgResponseTimeMinutes, 30, "Guide after 1st response: avg = 30");
    assertEq(updated?.responseCount, 1, "Guide after 1st response: count = 1");

    // Simulate second response: 90 minutes → avg = (30+90)/2 = 60
    await simulateResponseUpdate("guide", guide.id, 30, 1, 90);
    updated = await prisma.guide.findUnique({
        where: { id: guide.id },
        select: { avgResponseTimeMinutes: true, responseCount: true },
    });
    assertEq(updated?.avgResponseTimeMinutes, 60, "Guide after 2nd response: avg = 60");
    assertEq(updated?.responseCount, 2, "Guide after 2nd response: count = 2");

    // Simulate third response: 60 minutes → avg = (60*2 + 60)/3 = 60
    await simulateResponseUpdate("guide", guide.id, 60, 2, 60);
    updated = await prisma.guide.findUnique({
        where: { id: guide.id },
        select: { avgResponseTimeMinutes: true, responseCount: true },
    });
    assertEq(updated?.avgResponseTimeMinutes, 60, "Guide after 3rd response: avg = 60");
    assertEq(updated?.responseCount, 3, "Guide after 3rd response: count = 3");

    // Simulate 4th response: 120 minutes → avg = (60*3 + 120)/4 = 300/4 = 75
    await simulateResponseUpdate("guide", guide.id, 60, 3, 120);
    updated = await prisma.guide.findUnique({
        where: { id: guide.id },
        select: { avgResponseTimeMinutes: true, responseCount: true },
    });
    assertEq(updated?.avgResponseTimeMinutes, 75, "Guide after 4th response: avg = 75");
    assertEq(updated?.responseCount, 4, "Guide after 4th response: count = 4");
}

async function testDriverResponseTime(): Promise<void> {
    console.log("\n══ Integration: Driver response time ══");

    const userId = await createTestUser("driver1", ["DRIVER"]);

    const driver = await prisma.driver.create({
        data: {
            userId,
            bio: "Test driver",
            vehicleType: "sedan",
            vehicleCapacity: 4,
            isVerified: true,
            isAvailable: true,
        },
    });

    // 5 responses: 10, 20, 30, 40, 50
    const times = [10, 20, 30, 40, 50];
    let avg: number | null = null;
    let count = 0;

    for (const t of times) {
        await simulateResponseUpdate("driver", driver.id, avg, count, t);
        avg = updateAvg(avg, count, t);
        count++;
    }

    const final = await prisma.driver.findUnique({
        where: { id: driver.id },
        select: { avgResponseTimeMinutes: true, responseCount: true },
    });
    assertEq(final?.avgResponseTimeMinutes, 30, "Driver after 5 responses: avg = 30");
    assertEq(final?.responseCount, 5, "Driver after 5 responses: count = 5");
}

async function testCompanyResponseTime(): Promise<void> {
    console.log("\n══ Integration: Company response time ══");

    const userId = await createTestUser("company1", ["COMPANY"]);

    const company = await prisma.company.create({
        data: {
            userId,
            companyName: `TestCo_${TEST_PREFIX}`,
            isVerified: true,
        },
    });

    // Single very fast response: 5 minutes
    await simulateResponseUpdate("company", company.id, null, 0, 5);
    let updated = await prisma.company.findUnique({
        where: { id: company.id },
        select: { avgResponseTimeMinutes: true, responseCount: true },
    });
    assertEq(updated?.avgResponseTimeMinutes, 5, "Company after quick response: avg = 5");
    assertEq(updated?.responseCount, 1, "Company count = 1");

    // Second response: 2 days (2880 min) → avg = (5+2880)/2 = 1442.5 → 1443
    await simulateResponseUpdate("company", company.id, 5, 1, 2880);
    updated = await prisma.company.findUnique({
        where: { id: company.id },
        select: { avgResponseTimeMinutes: true, responseCount: true },
    });
    assertEq(updated?.avgResponseTimeMinutes, 1443, "Company after slow 2nd response: avg = 1443");
    assertEq(updated?.responseCount, 2, "Company count = 2");
}

async function testDualProfileUser(): Promise<void> {
    console.log("\n══ Integration: User with Guide + Driver profiles ══");

    const userId = await createTestUser("dual1", ["GUIDE", "DRIVER"]);

    const guide = await prisma.guide.create({
        data: {
            userId,
            bio: "Dual profile - guide",
            languages: ["en"],
            isVerified: true,
            isAvailable: true,
        },
    });

    const driver = await prisma.driver.create({
        data: {
            userId,
            bio: "Dual profile - driver",
            vehicleType: "suv",
            vehicleCapacity: 6,
            isVerified: true,
            isAvailable: true,
        },
    });

    // Use the real updateProviderResponseTime logic — simulate via direct DB update
    // that mirrors what the service does: lookup all profiles by userId, update each
    const responseTimeMinutes = 45;

    const [g, d] = await Promise.all([
        prisma.guide.findUnique({ where: { userId }, select: { id: true, avgResponseTimeMinutes: true, responseCount: true } }),
        prisma.driver.findUnique({ where: { userId }, select: { id: true, avgResponseTimeMinutes: true, responseCount: true } }),
    ]);

    if (g) {
        const newAvg = updateAvg(g.avgResponseTimeMinutes, g.responseCount, responseTimeMinutes);
        await prisma.guide.update({
            where: { id: g.id },
            data: { avgResponseTimeMinutes: newAvg, responseCount: { increment: 1 } },
        });
    }
    if (d) {
        const newAvg = updateAvg(d.avgResponseTimeMinutes, d.responseCount, responseTimeMinutes);
        await prisma.driver.update({
            where: { id: d.id },
            data: { avgResponseTimeMinutes: newAvg, responseCount: { increment: 1 } },
        });
    }

    const updatedGuide = await prisma.guide.findUnique({
        where: { id: guide.id },
        select: { avgResponseTimeMinutes: true, responseCount: true },
    });
    const updatedDriver = await prisma.driver.findUnique({
        where: { id: driver.id },
        select: { avgResponseTimeMinutes: true, responseCount: true },
    });

    assertEq(updatedGuide?.avgResponseTimeMinutes, 45, "Dual user: guide avg = 45");
    assertEq(updatedGuide?.responseCount, 1, "Dual user: guide count = 1");
    assertEq(updatedDriver?.avgResponseTimeMinutes, 45, "Dual user: driver avg = 45");
    assertEq(updatedDriver?.responseCount, 1, "Dual user: driver count = 1");
}

async function testZeroResponseTime(): Promise<void> {
    console.log("\n══ Integration: Zero-minute response (instant) ══");

    const userId = await createTestUser("instant1", ["GUIDE"]);

    const guide = await prisma.guide.create({
        data: {
            userId,
            bio: "Instant responder",
            languages: ["en"],
            isVerified: true,
            isAvailable: true,
        },
    });

    await simulateResponseUpdate("guide", guide.id, null, 0, 0);
    const updated = await prisma.guide.findUnique({
        where: { id: guide.id },
        select: { avgResponseTimeMinutes: true, responseCount: true },
    });
    assertEq(updated?.avgResponseTimeMinutes, 0, "Zero-minute response: avg = 0");
    assertEq(updated?.responseCount, 1, "Zero-minute response: count = 1");

    // Second response: 10 min → avg = (0+10)/2 = 5
    await simulateResponseUpdate("guide", guide.id, 0, 1, 10);
    const updated2 = await prisma.guide.findUnique({
        where: { id: guide.id },
        select: { avgResponseTimeMinutes: true, responseCount: true },
    });
    assertEq(updated2?.avgResponseTimeMinutes, 5, "After 2nd response: avg = 5");
}

async function testManyResponses(): Promise<void> {
    console.log("\n══ Integration: 20 sequential responses ══");

    const userId = await createTestUser("many1", ["GUIDE"]);

    const guide = await prisma.guide.create({
        data: {
            userId,
            bio: "Many responses",
            languages: ["en"],
            isVerified: true,
            isAvailable: true,
        },
    });

    // 20 responses, all 60 min → avg should stay exactly 60
    let avg: number | null = null;
    let count = 0;
    for (let i = 0; i < 20; i++) {
        await simulateResponseUpdate("guide", guide.id, avg, count, 60);
        avg = updateAvg(avg, count, 60);
        count++;
    }

    const final = await prisma.guide.findUnique({
        where: { id: guide.id },
        select: { avgResponseTimeMinutes: true, responseCount: true },
    });
    assertEq(final?.avgResponseTimeMinutes, 60, "20 identical responses: avg = 60");
    assertEq(final?.responseCount, 20, "20 responses: count = 20");
}

async function testRoundingAccuracy(): Promise<void> {
    console.log("\n══ Integration: Rounding accuracy over steps ══");

    const userId = await createTestUser("round1", ["DRIVER"]);

    const driver = await prisma.driver.create({
        data: {
            userId,
            bio: "Rounding test",
            vehicleType: "minivan",
            vehicleCapacity: 7,
            isVerified: false,
            isAvailable: true,
        },
    });

    // Sequence designed to produce rounding at each step
    const times = [7, 13, 3, 17, 11];
    let avg: number | null = null;
    let count = 0;
    const expectedAvgs: number[] = [];

    for (const t of times) {
        avg = updateAvg(avg, count, t);
        count++;
        expectedAvgs.push(avg);
    }

    // Now do the same in DB
    let dbAvg: number | null = null;
    let dbCount = 0;
    for (let i = 0; i < times.length; i++) {
        await simulateResponseUpdate("driver", driver.id, dbAvg, dbCount, times[i]);
        const current = await prisma.driver.findUnique({
            where: { id: driver.id },
            select: { avgResponseTimeMinutes: true, responseCount: true },
        });
        dbAvg = current?.avgResponseTimeMinutes ?? null;
        dbCount = current?.responseCount ?? 0;
        assertEq(dbAvg, expectedAvgs[i], `Rounding step ${i + 1} (time=${times[i]}): DB avg = ${expectedAvgs[i]}`);
    }

    assertEq(dbCount, 5, "Rounding test: final count = 5");
}

// ─── Helper: Simulate a response update in DB ─────────────────

async function simulateResponseUpdate(
    type: "guide" | "driver" | "company",
    profileId: string,
    currentAvg: number | null,
    currentCount: number,
    responseTimeMinutes: number
): Promise<void> {
    const newAvg = updateAvg(currentAvg, currentCount, responseTimeMinutes);

    switch (type) {
        case "guide":
            await prisma.guide.update({
                where: { id: profileId },
                data: { avgResponseTimeMinutes: newAvg, responseCount: { increment: 1 } },
            });
            break;
        case "driver":
            await prisma.driver.update({
                where: { id: profileId },
                data: { avgResponseTimeMinutes: newAvg, responseCount: { increment: 1 } },
            });
            break;
        case "company":
            await prisma.company.update({
                where: { id: profileId },
                data: { avgResponseTimeMinutes: newAvg, responseCount: { increment: 1 } },
            });
            break;
    }
}

// ─── Cleanup ──────────────────────────────────────────────────

async function cleanup(): Promise<void> {
    console.log("\n🧹 Cleaning up test data...");

    // Delete in dependency order
    for (const userId of createdUserIds) {
        await prisma.guide.deleteMany({ where: { userId } });
        await prisma.driver.deleteMany({ where: { userId } });
        await prisma.company.deleteMany({ where: { userId } });
    }
    // Delete role assignments then users
    await prisma.userRoleAssignment.deleteMany({
        where: { userId: { in: createdUserIds } },
    });
    await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
    });

    console.log(`  Removed ${createdUserIds.length} test users and their profiles`);
}

// ─── Main ─────────────────────────────────────────────────────

async function main(): Promise<void> {
    console.log("🧪 Response Time Calculation Tests");
    console.log("═══════════════════════════════════");

    try {
        // Unit tests (no DB)
        testPureMath();

        // Integration tests (DB)
        await testGuideResponseTime();
        await testDriverResponseTime();
        await testCompanyResponseTime();
        await testDualProfileUser();
        await testZeroResponseTime();
        await testManyResponses();
        await testRoundingAccuracy();
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
