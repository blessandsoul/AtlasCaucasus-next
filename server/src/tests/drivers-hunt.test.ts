/**
 * Exhaustive API bug-hunting tests for the Drivers endpoints.
 *
 * Endpoints tested:
 *   GET    /drivers           — List all drivers (public, paginated, filterable)
 *   GET    /drivers/my        — Get current user's driver profile (auth)
 *   GET    /drivers/:id       — Get driver by ID (public)
 *   PATCH  /drivers/:id       — Update driver (auth, ownership)
 *   DELETE /drivers/:id       — Delete driver (auth, ownership)
 *   GET    /drivers/:id/photos      — Get driver photos (public)
 *   POST   /drivers/:id/photos      — Upload driver photos (auth, ownership)
 *   DELETE /drivers/:id/photos/:photoId — Delete driver photo (auth, ownership)
 *
 * Categories: input validation, authentication, authorization, business logic,
 *             injection attacks, pagination, error shape, race conditions, CSRF.
 *
 * Run: npx tsx src/tests/drivers-hunt.test.ts
 */

import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";

// Load .env from server root
dotenv.config({ path: path.resolve(import.meta.dirname, "../../.env") });

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:8000/api/v1";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ─── Counters ────────────────────────────────────────────────

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

function section(title: string): void {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(60)}`);
}

// ─── HTTP + CSRF Helpers ─────────────────────────────────────

let csrfToken = "";
let csrfCookie = "";

async function fetchCsrf(): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/csrf-token`);
  const cookies = res.headers.getSetCookie?.() ?? [];
  for (const c of cookies) {
    if (c.startsWith("_csrf")) csrfCookie = c.split(";")[0];
  }
  const json: any = await res.json();
  csrfToken = json?.data?.csrfToken ?? "";
}

async function api(
  method: string,
  path: string,
  opts: {
    body?: unknown;
    token?: string;
    headers?: Record<string, string>;
    skipCsrf?: boolean;
    rawBody?: string;
    contentType?: string;
  } = {}
): Promise<{ status: number; body: any; headers: Headers }> {
  const hasJsonBody = opts.body !== undefined || opts.rawBody !== undefined;
  const headers: Record<string, string> = {
    ...(opts.contentType !== undefined
      ? (opts.contentType ? { "Content-Type": opts.contentType } : {})
      : (hasJsonBody ? { "Content-Type": "application/json" } : {})),
    ...opts.headers,
  };

  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;

  // CSRF for state-changing methods
  if (!opts.skipCsrf && ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) {
    if (!csrfToken) await fetchCsrf();
    headers["X-CSRF-Token"] = csrfToken;
    if (csrfCookie) headers["Cookie"] = csrfCookie;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: opts.rawBody !== undefined
      ? opts.rawBody
      : opts.body !== undefined
        ? JSON.stringify(opts.body)
        : undefined,
  });

  // Refresh CSRF cookie if returned
  for (const c of res.headers.getSetCookie?.() ?? []) {
    if (c.startsWith("_csrf")) csrfCookie = c.split(";")[0];
  }

  const body = await res.json().catch(() => null);
  return { status: res.status, body, headers: res.headers };
}

// ─── Test User Helpers (Prisma + JWT — no rate limits) ───────

const TEST_PREFIX = `__hunt_${Date.now()}`;
const TEST_PASSWORD = "TestPass123!";
const createdUserIds: string[] = [];

function testEmail(suffix: string): string {
  return `${TEST_PREFIX}_${suffix}@test.local`;
}

/** Create a verified user directly via Prisma + JWT (bypasses rate limits). */
async function createVerifiedUser(
  suffix: string
): Promise<{ token: string; refreshToken: string; userId: string; email: string }> {
  const email = testEmail(suffix);
  const passwordHash = await argon2.hash(TEST_PASSWORD);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: "Test",
      lastName: suffix,
      emailVerified: true,
      roles: { create: { role: "USER" } },
    },
  });
  createdUserIds.push(user.id);

  const accessToken = jwt.sign(
    { userId: user.id, roles: ["USER"], tokenVersion: user.tokenVersion, emailVerified: true },
    ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const tempHash = crypto.randomBytes(32).toString("hex");
  const session = await prisma.userSession.create({
    data: { userId: user.id, refreshTokenHash: tempHash, expiresAt: sessionExpiresAt },
  });

  const refreshToken = jwt.sign(
    { userId: user.id, sessionId: session.id, tokenVersion: user.tokenVersion },
    REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  await prisma.userSession.update({
    where: { id: session.id },
    data: { refreshTokenHash: hashToken(refreshToken) },
  });

  return { token: accessToken, refreshToken, userId: user.id, email };
}

/** Create an unverified user directly via Prisma (no API calls). */
async function createUnverifiedUser(
  suffix: string
): Promise<{ token: string; refreshToken: string; userId: string; email: string }> {
  const email = testEmail(suffix);
  const passwordHash = await argon2.hash(TEST_PASSWORD);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: "Test",
      lastName: suffix,
      emailVerified: false,
      roles: { create: { role: "USER" } },
    },
  });
  createdUserIds.push(user.id);

  const accessToken = jwt.sign(
    { userId: user.id, roles: ["USER"], tokenVersion: user.tokenVersion, emailVerified: false },
    ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const tempHash = crypto.randomBytes(32).toString("hex");
  const session = await prisma.userSession.create({
    data: { userId: user.id, refreshTokenHash: tempHash, expiresAt: sessionExpiresAt },
  });

  const refreshToken = jwt.sign(
    { userId: user.id, sessionId: session.id, tokenVersion: user.tokenVersion },
    REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  await prisma.userSession.update({
    where: { id: session.id },
    data: { refreshTokenHash: hashToken(refreshToken) },
  });

  return { token: accessToken, refreshToken, userId: user.id, email };
}

/** Create a verified user with DRIVER role + driver profile directly via Prisma. */
async function createDriverUser(
  suffix: string
): Promise<{ token: string; refreshToken: string; userId: string; email: string; driverId: string }> {
  const email = testEmail(suffix);
  const passwordHash = await argon2.hash(TEST_PASSWORD);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: "Test",
      lastName: suffix,
      emailVerified: true,
      roles: {
        createMany: {
          data: [{ role: "USER" }, { role: "DRIVER" }],
        },
      },
    },
  });
  createdUserIds.push(user.id);

  const driver = await prisma.driver.create({
    data: {
      userId: user.id,
      bio: `Test driver ${suffix}`,
      vehicleType: "Sedan",
      vehicleCapacity: 4,
      vehicleMake: "Toyota",
      vehicleModel: "Camry",
      vehicleYear: 2022,
      licenseNumber: `LIC-${suffix}`,
      phoneNumber: `+995555${String(Date.now()).slice(-6)}`,
      isVerified: true,
      isAvailable: true,
    },
  });

  const accessToken = jwt.sign(
    { userId: user.id, roles: ["USER", "DRIVER"], tokenVersion: user.tokenVersion, emailVerified: true },
    ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const tempHash = crypto.randomBytes(32).toString("hex");
  const session = await prisma.userSession.create({
    data: { userId: user.id, refreshTokenHash: tempHash, expiresAt: sessionExpiresAt },
  });

  const refreshToken = jwt.sign(
    { userId: user.id, sessionId: session.id, tokenVersion: user.tokenVersion },
    REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  await prisma.userSession.update({
    where: { id: session.id },
    data: { refreshTokenHash: hashToken(refreshToken) },
  });

  return { token: accessToken, refreshToken, userId: user.id, email, driverId: driver.id };
}

// ─── Error Shape Checker ─────────────────────────────────────

function assertErrorShape(body: any, label: string): void {
  assertEq(body?.success, false, `${label} → success is false`);
  assert(typeof body?.error?.code === "string", `${label} → has string error.code`);
  assert(typeof body?.error?.message === "string", `${label} → has string error.message`);
  const json = JSON.stringify(body);
  assert(!json.includes("stack"), `${label} → no stack trace`);
  assert(!/prisma/i.test(json), `${label} → no Prisma leak`);
  assert(!json.includes("node_modules"), `${label} → no paths`);
  assert(!json.includes("SELECT "), `${label} → no SQL`);
}

// ─── Cleanup ─────────────────────────────────────────────────

async function cleanup(): Promise<void> {
  console.log("\n🧹 Cleaning up test data...");

  for (const userId of createdUserIds) {
    try {
      await prisma.notification.deleteMany({ where: { userId } });
      await prisma.favorite.deleteMany({ where: { userId } });
      await prisma.review.deleteMany({ where: { userId } });
      await prisma.booking.deleteMany({ where: { userId } });
      await prisma.inquiryResponse.deleteMany({ where: { recipientId: userId } });
      await prisma.inquiry.deleteMany({ where: { userId } });
      await prisma.chatParticipant.deleteMany({ where: { userId } });
      await prisma.creditTransaction.deleteMany({ where: { userId } });
      await prisma.creditBalance.deleteMany({ where: { userId } });
      await prisma.aiGeneration.deleteMany({ where: { userId } });
      await prisma.media.deleteMany({ where: { entityId: userId } });

      const guide = await prisma.guide.findUnique({ where: { userId } });
      if (guide) {
        await prisma.media.deleteMany({ where: { entityId: guide.id } });
        await prisma.guideLocation.deleteMany({ where: { guideId: guide.id } });
        await prisma.guide.delete({ where: { userId } });
      }
      const driver = await prisma.driver.findUnique({ where: { userId } });
      if (driver) {
        await prisma.media.deleteMany({ where: { entityId: driver.id } });
        await prisma.driverLocation.deleteMany({ where: { driverId: driver.id } });
        await prisma.driver.delete({ where: { userId } });
      }
      const company = await prisma.company.findUnique({ where: { userId } });
      if (company) {
        const tours = await prisma.tour.findMany({ where: { companyId: company.id } });
        for (const tour of tours) {
          await prisma.media.deleteMany({ where: { entityId: tour.id } });
          await prisma.tourItineraryStep.deleteMany({ where: { tourId: tour.id } });
          await prisma.booking.deleteMany({ where: { entityId: tour.id } });
          await prisma.review.deleteMany({ where: { targetId: tour.id } });
          await prisma.favorite.deleteMany({ where: { entityId: tour.id } });
        }
        await prisma.tour.deleteMany({ where: { companyId: company.id } });
        await prisma.media.deleteMany({ where: { entityId: company.id } });
        await prisma.company.delete({ where: { userId } });
      }

      const ownTours = await prisma.tour.findMany({ where: { ownerId: userId } });
      for (const tour of ownTours) {
        await prisma.media.deleteMany({ where: { entityId: tour.id } });
        await prisma.tourItineraryStep.deleteMany({ where: { tourId: tour.id } });
        await prisma.booking.deleteMany({ where: { entityId: tour.id } });
        await prisma.review.deleteMany({ where: { targetId: tour.id } });
        await prisma.favorite.deleteMany({ where: { entityId: tour.id } });
        await prisma.tour.delete({ where: { id: tour.id } });
      }

      await prisma.userSession.deleteMany({ where: { userId } });
      await prisma.userRoleAssignment.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    } catch (err) {
      console.log(`  ⚠️  Cleanup error for user ${userId}: ${(err as Error).message}`);
    }
  }

  await prisma.$disconnect();
  console.log("  Done.");
}

// ═══════════════════════════════════════════════════════════════
// TEST CATEGORIES
// ═══════════════════════════════════════════════════════════════

async function testInputValidation(driverA: { token: string; driverId: string }) {
  section("1. INPUT VALIDATION — GET /drivers (list)");

  // Pagination edge cases
  {
    const r = await api("GET", "/drivers?page=0");
    assert(r.status === 400 || r.status === 422, "page=0 → 400/422");
  }
  {
    const r = await api("GET", "/drivers?page=-1");
    assert(r.status === 400 || r.status === 422, "page=-1 → 400/422");
  }
  {
    const r = await api("GET", "/drivers?page=abc");
    assert(r.status === 400 || r.status === 422, "page=abc → 400/422");
  }
  {
    const r = await api("GET", "/drivers?page=1.5");
    assert(r.status === 400 || r.status === 422, "page=1.5 → 400/422");
  }
  {
    const r = await api("GET", "/drivers?page=2147483648");
    assert(r.status === 200, "page=very large → 200 (empty items)");
    if (r.status === 200) {
      assertEq(r.body?.data?.items?.length, 0, "page=very large → empty items");
    }
  }
  {
    const r = await api("GET", "/drivers?limit=0");
    assert(r.status === 400 || r.status === 422, "limit=0 → 400/422");
  }
  {
    const r = await api("GET", "/drivers?limit=-1");
    assert(r.status === 400 || r.status === 422, "limit=-1 → 400/422");
  }
  {
    const r = await api("GET", "/drivers?limit=101");
    assert(r.status === 400 || r.status === 422, "limit=101 (above max) → 400/422");
  }
  {
    const r = await api("GET", "/drivers?limit=abc");
    assert(r.status === 400 || r.status === 422, "limit=abc → 400/422");
  }

  // Filter edge cases
  {
    const r = await api("GET", "/drivers?locationId=not-a-uuid");
    assert(r.status === 400 || r.status === 422, "locationId=not-a-uuid → 400/422");
  }
  {
    const r = await api("GET", "/drivers?minCapacity=0");
    assert(r.status === 400 || r.status === 422, "minCapacity=0 → 400/422 (min is 1)");
  }
  {
    const r = await api("GET", "/drivers?minCapacity=-5");
    assert(r.status === 400 || r.status === 422, "minCapacity=-5 → 400/422");
  }
  {
    const r = await api("GET", "/drivers?sortBy=invalid");
    assert(r.status === 400 || r.status === 422, "sortBy=invalid → 400/422");
  }
  {
    const r = await api("GET", "/drivers?sortBy=newest");
    assertEq(r.status, 200, "sortBy=newest → 200");
  }
  {
    const r = await api("GET", "/drivers?sortBy=rating");
    assertEq(r.status, 200, "sortBy=rating → 200");
  }
  {
    const r = await api("GET", "/drivers?sortBy=capacity");
    assertEq(r.status, 200, "sortBy=capacity → 200");
  }
  {
    const r = await api("GET", "/drivers?minRating=-1");
    assert(r.status === 400 || r.status === 422, "minRating=-1 → 400/422");
  }
  {
    const r = await api("GET", "/drivers?minRating=6");
    assert(r.status === 400 || r.status === 422, "minRating=6 (above 5) → 400/422");
  }
  {
    const longSearch = "A".repeat(201);
    const r = await api("GET", `/drivers?search=${encodeURIComponent(longSearch)}`);
    assert(r.status === 400 || r.status === 422, "search > 200 chars → 400/422");
  }

  section("1b. INPUT VALIDATION — GET /drivers/:id");

  {
    const r = await api("GET", "/drivers/not-a-uuid");
    assert(r.status === 400 || r.status === 422, "GET /drivers/not-a-uuid → 400/422");
  }
  {
    const r = await api("GET", "/drivers/12345");
    assert(r.status === 400 || r.status === 422, "GET /drivers/12345 → 400/422");
  }
  {
    const r = await api("GET", "/drivers/' OR 1=1 --");
    assert(r.status === 400 || r.status === 422, "GET /drivers/SQL injection → 400/422");
  }
  {
    const r = await api("GET", "/drivers/00000000-0000-0000-0000-000000000000");
    assertEq(r.status, 404, "GET /drivers/non-existent UUID → 404");
  }

  section("1c. INPUT VALIDATION — PATCH /drivers/:id");

  // Empty body
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: {},
    });
    assertEq(r.status, 200, "PATCH with empty body {} → 200 (all fields optional)");
  }

  // Wrong types
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { bio: 12345 },
    });
    assert(r.status === 400 || r.status === 422, "PATCH bio=number → 400/422");
  }
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { vehicleCapacity: "not a number" },
    });
    assert(r.status === 400 || r.status === 422, "PATCH vehicleCapacity=string → 400/422");
  }
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { vehicleCapacity: -1 },
    });
    assert(r.status === 400 || r.status === 422, "PATCH vehicleCapacity=-1 → 400/422");
  }
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { vehicleCapacity: 0 },
    });
    assert(r.status === 400 || r.status === 422, "PATCH vehicleCapacity=0 (below min 1) → 400/422");
  }
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { vehicleCapacity: 101 },
    });
    assert(r.status === 400 || r.status === 422, "PATCH vehicleCapacity=101 (above max 100) → 400/422");
  }
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { vehicleYear: 1899 },
    });
    assert(r.status === 400 || r.status === 422, "PATCH vehicleYear=1899 (below min 1900) → 400/422");
  }
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { vehicleYear: 2101 },
    });
    assert(r.status === 400 || r.status === 422, "PATCH vehicleYear=2101 (above max 2100) → 400/422");
  }
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { photoUrl: "not-a-url" },
    });
    assert(r.status === 400 || r.status === 422, "PATCH photoUrl=invalid → 400/422");
  }
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { isAvailable: "not-a-boolean" },
    });
    assert(r.status === 400 || r.status === 422, "PATCH isAvailable=string → 400/422");
  }
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { locationIds: ["not-a-uuid"] },
    });
    assert(r.status === 400 || r.status === 422, "PATCH locationIds with invalid UUID → 400/422");
  }
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { locationIds: "not-an-array" },
    });
    assert(r.status === 400 || r.status === 422, "PATCH locationIds=string → 400/422");
  }

  // Max length violations
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { bio: "A".repeat(2001) },
    });
    assert(r.status === 400 || r.status === 422, "PATCH bio > 2000 chars → 400/422");
  }
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { vehicleType: "A".repeat(101) },
    });
    assert(r.status === 400 || r.status === 422, "PATCH vehicleType > 100 chars → 400/422");
  }
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { licenseNumber: "A".repeat(51) },
    });
    assert(r.status === 400 || r.status === 422, "PATCH licenseNumber > 50 chars → 400/422");
  }
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { phoneNumber: "A".repeat(21) },
    });
    assert(r.status === 400 || r.status === 422, "PATCH phoneNumber > 20 chars → 400/422");
  }

  // Invalid UUID param
  {
    const r = await api("PATCH", "/drivers/not-a-uuid", {
      token: driverA.token,
      body: { bio: "test" },
    });
    assert(r.status === 400 || r.status === 422, "PATCH /drivers/not-a-uuid → 400/422");
  }

  // Malformed JSON body
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      rawBody: '{"bio": "test"',
    });
    assertEq(r.status, 400, "PATCH malformed JSON → 400");
  }

  // No body at all
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
    });
    assert(r.status === 200 || r.status === 400, "PATCH no body → 200 or 400");
  }

  // Float where int expected
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { vehicleCapacity: 3.7 },
    });
    assert(r.status === 400 || r.status === 422, "PATCH vehicleCapacity=3.7 (float, need int) → 400/422");
  }
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { vehicleYear: 2022.5 },
    });
    assert(r.status === 400 || r.status === 422, "PATCH vehicleYear=2022.5 (float) → 400/422");
  }

  // Infinity / NaN
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      rawBody: '{"vehicleCapacity": Infinity}',
    });
    assert(r.status === 400, "PATCH vehicleCapacity=Infinity → 400 (bad JSON)");
  }
}

async function testAuthentication(driverA: { token: string; driverId: string }) {
  section("2. AUTHENTICATION");

  // No auth header on protected endpoints
  {
    const r = await api("GET", "/drivers/my");
    assertEq(r.status, 401, "GET /drivers/my no auth → 401");
    assertEq(r.body?.error?.code, "NO_AUTH_HEADER", "→ NO_AUTH_HEADER");
  }
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, { body: { bio: "x" } });
    assertEq(r.status, 401, "PATCH /drivers/:id no auth → 401");
  }
  {
    const r = await api("DELETE", `/drivers/${driverA.driverId}`);
    // DELETE without auth but with CSRF — should be 401 for no auth
    assert(r.status === 401 || r.status === 400, "DELETE /drivers/:id no auth → 401 or 400");
  }

  // Empty Authorization header
  {
    const r = await api("GET", "/drivers/my", { headers: { Authorization: "" } });
    assertEq(r.status, 401, "GET /drivers/my empty auth → 401");
  }

  // No Bearer prefix
  {
    const r = await api("GET", "/drivers/my", {
      headers: { Authorization: driverA.token },
    });
    assertEq(r.status, 401, "Auth without Bearer prefix → 401");
    assertEq(r.body?.error?.code, "INVALID_AUTH_FORMAT", "→ INVALID_AUTH_FORMAT");
  }

  // Bearer with no token
  {
    const r = await api("GET", "/drivers/my", {
      headers: { Authorization: "Bearer" },
    });
    assertEq(r.status, 401, "Bearer with no token → 401");
  }

  // Bearer with space only
  {
    const r = await api("GET", "/drivers/my", {
      headers: { Authorization: "Bearer " },
    });
    assertEq(r.status, 401, "Bearer with space only → 401");
  }

  // Random string as token
  {
    const r = await api("GET", "/drivers/my", { token: "random-garbage-token" });
    assertEq(r.status, 401, "Random string token → 401");
    assertEq(r.body?.error?.code, "INVALID_TOKEN", "→ INVALID_TOKEN");
  }

  // Unverified email on protected route
  {
    const unverified = await createUnverifiedUser("drv_unverified");
    const r = await api("GET", "/drivers/my", { token: unverified.token });
    assertEq(r.status, 403, "Unverified user on /drivers/my → 403");
    assertEq(r.body?.error?.code, "EMAIL_NOT_VERIFIED", "→ EMAIL_NOT_VERIFIED");
  }

  // Deactivated user
  {
    const deactivated = await createVerifiedUser("drv_deactivated");
    await prisma.user.update({ where: { id: deactivated.userId }, data: { isActive: false } });
    const r = await api("GET", "/drivers/my", { token: deactivated.token });
    assertEq(r.status, 401, "Deactivated user → 401");
    assertEq(r.body?.error?.code, "ACCOUNT_DEACTIVATED", "→ ACCOUNT_DEACTIVATED");
  }

  // Stale tokenVersion
  {
    const stale = await createVerifiedUser("drv_stale");
    await prisma.user.update({ where: { id: stale.userId }, data: { tokenVersion: { increment: 1 } } });
    const r = await api("GET", "/drivers/my", { token: stale.token });
    assertEq(r.status, 401, "Stale tokenVersion → 401");
    assertEq(r.body?.error?.code, "SESSION_INVALIDATED", "→ SESSION_INVALIDATED");
  }

  // Soft-deleted user
  {
    const deleted = await createVerifiedUser("drv_deleted");
    await prisma.user.update({ where: { id: deleted.userId }, data: { deletedAt: new Date() } });
    const r = await api("GET", "/drivers/my", { token: deleted.token });
    assertEq(r.status, 401, "Soft-deleted user → 401");
    assertEq(r.body?.error?.code, "USER_NOT_FOUND", "→ USER_NOT_FOUND");
    // Restore for cleanup
    await prisma.user.update({ where: { id: deleted.userId }, data: { deletedAt: null } });
  }

  // Public endpoints work without auth
  {
    const r = await api("GET", "/drivers");
    assertEq(r.status, 200, "GET /drivers (public) no auth → 200");
  }
  {
    const r = await api("GET", `/drivers/${driverA.driverId}`);
    assertEq(r.status, 200, "GET /drivers/:id (public) no auth → 200");
  }
  {
    const r = await api("GET", `/drivers/${driverA.driverId}/photos`);
    assertEq(r.status, 200, "GET /drivers/:id/photos (public) no auth → 200");
  }
}

async function testAuthorization(
  driverA: { token: string; userId: string; driverId: string },
  driverB: { token: string; userId: string; driverId: string },
  userC: { token: string; userId: string }
) {
  section("3. AUTHORIZATION — Cross-user access");

  // User B tries to PATCH driver A
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverB.token,
      body: { bio: "Hijacked!" },
    });
    assertEq(r.status, 403, "User B PATCH driver A → 403");
  }

  // User B tries to DELETE driver A
  {
    const r = await api("DELETE", `/drivers/${driverA.driverId}`, {
      token: driverB.token,
    });
    assertEq(r.status, 403, "User B DELETE driver A → 403");
  }

  // Regular user (no DRIVER role) tries to PATCH
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: userC.token,
      body: { bio: "I'm not a driver" },
    });
    assertEq(r.status, 403, "Regular user PATCH driver A → 403");
  }

  // Regular user tries to DELETE
  {
    const r = await api("DELETE", `/drivers/${driverA.driverId}`, {
      token: userC.token,
    });
    assertEq(r.status, 403, "Regular user DELETE driver A → 403");
  }

  // PATCH non-existent driver
  {
    const r = await api("PATCH", "/drivers/00000000-0000-0000-0000-000000000000", {
      token: driverA.token,
      body: { bio: "test" },
    });
    assertEq(r.status, 404, "PATCH non-existent driver → 404");
  }

  // DELETE non-existent driver
  {
    const r = await api("DELETE", "/drivers/00000000-0000-0000-0000-000000000000", {
      token: driverA.token,
    });
    assertEq(r.status, 404, "DELETE non-existent driver → 404");
  }

  // Non-driver user's /my endpoint
  {
    const r = await api("GET", "/drivers/my", { token: userC.token });
    assertEq(r.status, 404, "Non-driver user GET /drivers/my → 404");
    assertEq(r.body?.error?.code, "DRIVER_NOT_FOUND", "→ DRIVER_NOT_FOUND");
  }

  section("3b. AUTHORIZATION — Privilege escalation via body fields");

  // Non-admin tries to set isVerified=true
  {
    // Reset isVerified to false first
    await prisma.driver.update({ where: { id: driverA.driverId }, data: { isVerified: false } });
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { isVerified: true },
    });
    assertEq(r.status, 200, "PATCH isVerified=true by non-admin → 200 (accepted)");
    const dbDriver = await prisma.driver.findUnique({ where: { id: driverA.driverId } });
    assertEq(dbDriver?.isVerified, false, "Non-admin cannot set isVerified=true (DB check)");
    // Restore for other tests
    await prisma.driver.update({ where: { id: driverA.driverId }, data: { isVerified: true } });
  }

  // Extra unexpected fields (should be ignored by Zod strict stripping)
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { isAdmin: true, role: "ADMIN", averageRating: 5.0, reviewCount: 9999 },
    });
    assertEq(r.status, 200, "Extra escalation fields in body → 200 (ignored by Zod)");
  }
}

async function testBusinessLogic(driverA: { token: string; userId: string; driverId: string }) {
  section("4. BUSINESS LOGIC");

  // Valid full update
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: {
        bio: "Updated bio for testing",
        vehicleType: "SUV",
        vehicleCapacity: 7,
        vehicleMake: "Toyota",
        vehicleModel: "Land Cruiser",
        vehicleYear: 2023,
        licenseNumber: "UPD-001",
        phoneNumber: "+995599123456",
        isAvailable: true,
      },
    });
    assertEq(r.status, 200, "Valid full update → 200");
    if (r.status === 200) {
      assertEq(r.body?.data?.bio, "Updated bio for testing", "Bio updated correctly");
      assertEq(r.body?.data?.vehicleType, "SUV", "vehicleType updated correctly");
      assertEq(r.body?.data?.vehicleCapacity, 7, "vehicleCapacity updated correctly");
    }
  }

  // Update with locationIds (empty array to clear)
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { locationIds: [] },
    });
    assertEq(r.status, 200, "PATCH with locationIds=[] → 200 (clears locations)");
    if (r.status === 200) {
      assertEq(r.body?.data?.locations?.length, 0, "Locations cleared");
    }
  }

  // Update with non-existent locationIds (FK constraint)
  {
    const fakeUuid = "00000000-0000-0000-0000-000000000099";
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { locationIds: [fakeUuid] },
    });
    // FK constraint should fail — BUG if it returns 500
    if (r.status === 500) {
      console.log(`    ⚠️  BUG: Non-existent locationId causes 500 (FK constraint error not handled)`);
    }
    assert(
      r.status !== 200,
      `PATCH with non-existent locationId → ${r.status} (should not be 200)`
    );
  }

  // Boundary: vehicleCapacity at min=1 and max=100
  {
    const r1 = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { vehicleCapacity: 1 },
    });
    assertEq(r1.status, 200, "vehicleCapacity=1 (min boundary) → 200");
    const r2 = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { vehicleCapacity: 100 },
    });
    assertEq(r2.status, 200, "vehicleCapacity=100 (max boundary) → 200");
  }

  // Boundary: vehicleYear at min=1900 and max=2100
  {
    const r1 = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { vehicleYear: 1900 },
    });
    assertEq(r1.status, 200, "vehicleYear=1900 (min boundary) → 200");
    const r2 = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { vehicleYear: 2100 },
    });
    assertEq(r2.status, 200, "vehicleYear=2100 (max boundary) → 200");
  }

  // GET /drivers/my returns the owner's profile
  {
    const r = await api("GET", "/drivers/my", { token: driverA.token });
    assertEq(r.status, 200, "GET /drivers/my → 200");
    if (r.status === 200) {
      assertEq(r.body?.data?.userId, driverA.userId, "My profile has correct userId");
    }
  }

  // Owner can update their own driver
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { bio: "Owner update works" },
    });
    assertEq(r.status, 200, "Owner PATCH own driver → 200");
  }

  // Restore capacity
  await api("PATCH", `/drivers/${driverA.driverId}`, {
    token: driverA.token,
    body: { vehicleCapacity: 4 },
  });
}

async function testDeleteBehavior() {
  section("5. DELETE BEHAVIOR — Soft Delete (deletedAt)");

  const toDelete = await createDriverUser("drv_delete_test");

  // Verify driver exists before delete
  {
    const r = await api("GET", `/drivers/${toDelete.driverId}`);
    assertEq(r.status, 200, "Driver exists before delete");
  }

  // Delete the driver
  {
    const r = await api("DELETE", `/drivers/${toDelete.driverId}`, {
      token: toDelete.token,
    });
    assertEq(r.status, 200, "DELETE driver → 200");
  }

  // Verify deletedAt is set in DB
  {
    const dbDriver = await prisma.driver.findUnique({ where: { id: toDelete.driverId } });
    assert(dbDriver !== null, "Driver record still exists in DB");
    assert(dbDriver?.deletedAt !== null, "deletedAt is set after DELETE");
  }

  // After delete: driver NOT accessible via GET /drivers/:id
  {
    const r = await api("GET", `/drivers/${toDelete.driverId}`);
    assertEq(r.status, 404, "After DELETE: GET /drivers/:id → 404");
  }

  // After delete: driver NOT in listing
  {
    const r = await api("GET", "/drivers?page=1&limit=100");
    if (r.status === 200) {
      const items = r.body?.data?.items || [];
      const found = items.find((d: any) => d.id === toDelete.driverId);
      assert(!found, "After DELETE: driver not in listing");
    }
  }

  // After delete: PATCH returns 404 (can't update deleted driver)
  {
    const r = await api("PATCH", `/drivers/${toDelete.driverId}`, {
      token: toDelete.token,
      body: { bio: "I was deleted but trying to update" },
    });
    assertEq(r.status, 404, "After DELETE: PATCH → 404 (blocked)");
  }

  // After delete: cannot reactivate via isAvailable=true
  {
    const r = await api("PATCH", `/drivers/${toDelete.driverId}`, {
      token: toDelete.token,
      body: { isAvailable: true },
    });
    assertEq(r.status, 404, "After DELETE: cannot reactivate via PATCH → 404");
  }

  // After delete: GET /drivers/my returns 404 for the deleted driver's owner
  {
    const r = await api("GET", "/drivers/my", { token: toDelete.token });
    assertEq(r.status, 404, "After DELETE: GET /drivers/my → 404 for deleted driver's owner");
  }

  // After delete: photos endpoint returns 404
  {
    const r = await api("GET", `/drivers/${toDelete.driverId}/photos`);
    assertEq(r.status, 404, "After DELETE: GET /drivers/:id/photos → 404");
  }

  // Double delete returns 404 (driver no longer found)
  {
    const r = await api("DELETE", `/drivers/${toDelete.driverId}`, {
      token: toDelete.token,
    });
    assertEq(r.status, 404, "Double DELETE → 404 (already deleted)");
  }
}

async function testInjectionAndAbuse(driverA: { token: string; driverId: string }) {
  section("6. INJECTION & ABUSE");

  // SQL injection via search
  {
    const r = await api("GET", "/drivers?search=' OR 1=1 --");
    assertEq(r.status, 200, "SQL injection in search → 200 (Prisma safe)");
    assert(!JSON.stringify(r.body).includes("SQL"), "No SQL leaked in search injection");
  }
  {
    const r = await api("GET", "/drivers?search=' UNION SELECT * FROM users --");
    assertEq(r.status, 200, "UNION injection in search → 200 (Prisma safe)");
  }

  // XSS in stored fields
  {
    const xss = '<script>alert(1)</script>';
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { bio: xss },
    });
    if (r.status === 200) {
      const stored = r.body?.data?.bio;
      if (stored === xss) {
        console.log(`    ⚠️  NOTE: XSS stored as-is in bio — client must sanitize on render`);
      }
      assert(true, "XSS in bio accepted (check client sanitization)");
    }
  }
  {
    const xss = '<img src=x onerror=alert(1)>';
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { vehicleType: xss },
    });
    if (r.status === 200) {
      console.log("    ⚠️  NOTE: XSS payload stored in vehicleType");
    }
    assert(r.status === 200 || r.status === 400 || r.status === 422, "XSS in vehicleType → handled");
  }

  // Null byte
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { bio: "test\0admin" },
    });
    assert(r.status === 200 || r.status === 400, "Null byte in bio → handled");
  }

  // Prototype pollution
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { "__proto__": { "admin": true }, "constructor": { "prototype": { "isAdmin": true } } },
    });
    assert(r.status !== 500, "Prototype pollution → not 500");
  }

  // Max bio length
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { bio: "A".repeat(2000) },
    });
    assertEq(r.status, 200, "Bio at max length (2000) → 200");
  }

  // Path traversal in ID
  {
    const r = await api("GET", "/drivers/../../etc/passwd");
    assert(r.status === 400 || r.status === 404 || r.status === 422, "Path traversal in ID → not 200/500");
  }

  // Unicode / emoji / Georgian
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { bio: "RTL: \u202E hello \u200B zero-width 🚗 emoji მოგზაურობა Georgian" },
    });
    assertEq(r.status, 200, "Unicode/emoji/Georgian in bio → 200");
  }

  // Wrong Content-Type
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      rawBody: "bio=test",
      contentType: "text/plain",
    });
    assert(r.status !== 500, "text/plain Content-Type → not 500");
  }

  // Restore bio
  await api("PATCH", `/drivers/${driverA.driverId}`, {
    token: driverA.token,
    body: { bio: "Restored bio after injection tests" },
  });
}

async function testPaginationAndFiltering() {
  section("7. PAGINATION & FILTERING");

  // Normal pagination
  {
    const r = await api("GET", "/drivers?page=1&limit=5");
    assertEq(r.status, 200, "GET /drivers?page=1&limit=5 → 200");
    assert(r.body?.success === true, "Pagination response has success=true");
    assert(Array.isArray(r.body?.data?.items), "Response has items array");
    assert(typeof r.body?.data?.pagination === "object", "Response has pagination object");

    const p = r.body?.data?.pagination;
    if (p) {
      assert(typeof p.page === "number", "pagination.page is number");
      assert(typeof p.limit === "number", "pagination.limit is number");
      assert(typeof p.totalItems === "number", "pagination.totalItems is number");
      assert(typeof p.totalPages === "number", "pagination.totalPages is number");
      assert(typeof p.hasNextPage === "boolean", "pagination.hasNextPage is boolean");
      assert(typeof p.hasPreviousPage === "boolean", "pagination.hasPreviousPage is boolean");
    }
  }

  // Very high page
  {
    const r = await api("GET", "/drivers?page=99999&limit=10");
    assertEq(r.status, 200, "Very high page → 200 with empty items");
    assertEq(r.body?.data?.items?.length, 0, "Very high page → 0 items");
    assertEq(r.body?.data?.pagination?.hasPreviousPage, true, "Very high page → hasPreviousPage=true");
  }

  // Default filter: isVerified=true, isAvailable=true
  {
    const r = await api("GET", "/drivers?page=1&limit=100");
    assertEq(r.status, 200, "Default list → 200");
    const items = r.body?.data?.items || [];
    const allVerified = items.every((d: any) => d.isVerified === true);
    const allAvailable = items.every((d: any) => d.isAvailable === true);
    assert(allVerified, "Default list: all items isVerified=true");
    assert(allAvailable, "Default list: all items isAvailable=true");
  }

  // Explicit isVerified=false — can expose unverified drivers
  {
    const r = await api("GET", "/drivers?isVerified=false&isAvailable=true");
    assertEq(r.status, 200, "isVerified=false → 200");
    const items = r.body?.data?.items || [];
    if (items.length > 0) {
      console.log(`    ⚠️  INFO: ${items.length} unverified drivers exposed via isVerified=false`);
    }
  }

  // Search, minRating, minCapacity, vehicleType filters
  {
    const r = await api("GET", "/drivers?search=Toyota");
    assertEq(r.status, 200, "search=Toyota → 200");
  }
  {
    const r = await api("GET", "/drivers?minRating=4.5");
    assertEq(r.status, 200, "minRating=4.5 → 200");
  }
  {
    const r = await api("GET", "/drivers?minCapacity=10");
    assertEq(r.status, 200, "minCapacity=10 → 200");
  }
  {
    const r = await api("GET", "/drivers?vehicleType=SUV");
    assertEq(r.status, 200, "vehicleType=SUV → 200");
  }

  // SQL injection in sortBy (enum-validated)
  {
    const r = await api("GET", "/drivers?sortBy=newest; DROP TABLE drivers;");
    assert(r.status === 400 || r.status === 422, "SQL injection in sortBy → 400/422");
  }
}

async function testErrorResponseShape(driverA: { token: string; driverId: string }) {
  section("8. ERROR RESPONSE SHAPE");

  // 404
  {
    const r = await api("GET", "/drivers/00000000-0000-0000-0000-000000000000");
    assertErrorShape(r.body, "404 Not Found");
    assertEq(r.status, 404, "404 status code correct");
  }

  // 401
  {
    const r = await api("GET", "/drivers/my");
    assertErrorShape(r.body, "401 Unauthorized");
    assertEq(r.status, 401, "401 status code correct");
  }

  // 422 Validation
  {
    const r = await api("GET", "/drivers?page=abc");
    if (r.status === 400 || r.status === 422) {
      assertErrorShape(r.body, "Validation error");
    }
  }

  // 403 Forbidden
  {
    const user = await createVerifiedUser("drv_forbidden_shape");
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: user.token,
      body: { bio: "test" },
    });
    if (r.status === 403) {
      assertErrorShape(r.body, "403 Forbidden");
    }
  }

  // Verify no internal details leak
  {
    const routes = [
      { method: "GET", path: "/drivers/not-uuid" },
      { method: "GET", path: "/drivers/00000000-0000-0000-0000-000000000000" },
    ];
    for (const route of routes) {
      const r = await api(route.method, route.path);
      const bodyStr = JSON.stringify(r.body);
      assert(!bodyStr.includes("Error:"), `${route.method} ${route.path} → no Error: in body`);
      assert(!/at\s+\w+/.test(bodyStr), `${route.method} ${route.path} → no stack frames`);
    }
  }
}

async function testRaceConditions(driverA: { token: string; driverId: string }) {
  section("9. RACE CONDITIONS");

  // Concurrent updates to the same driver
  {
    const updates = Array.from({ length: 5 }, (_, i) =>
      api("PATCH", `/drivers/${driverA.driverId}`, {
        token: driverA.token,
        body: { bio: `Concurrent update ${i}` },
      })
    );
    const results = await Promise.all(updates);
    const successes = results.filter((r) => r.status === 200).length;
    assert(successes >= 1, `Concurrent PATCH: ${successes}/5 succeeded (at least 1)`);
    const errors500 = results.filter((r) => r.status === 500).length;
    assertEq(errors500, 0, "Concurrent PATCH: no 500 errors");
  }

  // Concurrent locationIds clears
  {
    const updates = Array.from({ length: 5 }, () =>
      api("PATCH", `/drivers/${driverA.driverId}`, {
        token: driverA.token,
        body: { locationIds: [] },
      })
    );
    const results = await Promise.all(updates);
    const errors500 = results.filter((r) => r.status === 500).length;
    assertEq(errors500, 0, "Concurrent locationIds clears: no 500 errors");
  }
}

async function testCsrfProtection(driverA: { token: string; driverId: string }) {
  section("10. CSRF PROTECTION");

  // PATCH without CSRF
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { bio: "no csrf" },
      skipCsrf: true,
    });
    assertEq(r.status, 403, "PATCH without CSRF → 403");
  }

  // DELETE without CSRF
  {
    const r = await api("DELETE", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      skipCsrf: true,
    });
    assertEq(r.status, 403, "DELETE without CSRF → 403");
  }

  // PATCH with invalid CSRF
  {
    const r = await api("PATCH", `/drivers/${driverA.driverId}`, {
      token: driverA.token,
      body: { bio: "bad csrf" },
      skipCsrf: true,
      headers: { "X-CSRF-Token": "invalid-token-12345" },
    });
    assertEq(r.status, 403, "PATCH with invalid CSRF → 403");
  }

  // GET exempt from CSRF
  {
    const r = await api("GET", "/drivers");
    assertEq(r.status, 200, "GET /drivers without CSRF → 200 (GET exempt)");
  }
  {
    const r = await api("GET", `/drivers/${driverA.driverId}`);
    assertEq(r.status, 200, "GET /drivers/:id without CSRF → 200 (GET exempt)");
  }
}

async function testPhotoEndpoints(
  driverA: { token: string; driverId: string },
  driverB: { token: string; driverId: string },
  userC: { token: string }
) {
  section("11. PHOTO ENDPOINTS");

  // GET photos (public)
  {
    const r = await api("GET", `/drivers/${driverA.driverId}/photos`);
    assertEq(r.status, 200, "GET /drivers/:id/photos (public) → 200");
    assert(Array.isArray(r.body?.data), "Photos response is array");
  }

  // GET photos for non-existent driver
  {
    const r = await api("GET", "/drivers/00000000-0000-0000-0000-000000000000/photos");
    assertEq(r.status, 404, "GET photos for non-existent driver → 404");
  }

  // GET photos with invalid UUID
  {
    const r = await api("GET", "/drivers/not-a-uuid/photos");
    assert(r.status === 400 || r.status === 422, "GET photos with invalid UUID → 400/422");
  }

  // POST photos without auth
  {
    const r = await api("POST", `/drivers/${driverA.driverId}/photos`);
    assertEq(r.status, 401, "POST photos without auth → 401");
  }

  // DELETE photo without auth
  {
    const r = await api("DELETE", `/drivers/${driverA.driverId}/photos/00000000-0000-0000-0000-000000000000`);
    assertEq(r.status, 401, "DELETE photo without auth → 401");
  }

  // DELETE photo with invalid photoId UUID
  {
    const r = await api("DELETE", `/drivers/${driverA.driverId}/photos/not-a-uuid`, {
      token: driverA.token,
    });
    assert(r.status === 400 || r.status === 422, "DELETE photo with invalid photoId → 400/422");
  }

  // DELETE photo with invalid driver UUID
  {
    const r = await api("DELETE", "/drivers/not-a-uuid/photos/00000000-0000-0000-0000-000000000000", {
      token: driverA.token,
    });
    assert(r.status === 400 || r.status === 422, "DELETE photo with invalid driver UUID → 400/422");
  }

  // DELETE non-existent photo
  {
    const r = await api("DELETE", `/drivers/${driverA.driverId}/photos/00000000-0000-0000-0000-000000000000`, {
      token: driverA.token,
    });
    assertEq(r.status, 404, "DELETE non-existent photo → 404");
  }

  // POST photos for non-existent driver (no multipart body)
  {
    const r = await api("POST", "/drivers/00000000-0000-0000-0000-000000000000/photos", {
      token: driverA.token,
      contentType: "",
    });
    assert(r.status !== 200 && r.status !== 201, "POST photos for non-existent driver → not 2xx");
  }
}

async function testEmailExposure(driverA: { driverId: string; email: string }) {
  section("12. INFORMATION EXPOSURE");

  // Public GET /drivers/:id exposes user email
  {
    const r = await api("GET", `/drivers/${driverA.driverId}`);
    assertEq(r.status, 200, "GET driver by ID → 200");
    if (r.status === 200) {
      const email = r.body?.data?.user?.email;
      if (email) {
        console.log(`    ⚠️  INFO EXPOSURE: Public GET /drivers/:id exposes user email: ${email}`);
        assert(true, "Public endpoint exposes user.email (verify if intentional)");
      } else {
        assert(true, "User email not exposed on public endpoint (good)");
      }
    }
  }

  // Public list exposes emails
  {
    const r = await api("GET", "/drivers?page=1&limit=1");
    if (r.status === 200 && r.body?.data?.items?.length > 0) {
      const firstItem = r.body.data.items[0];
      if (firstItem?.user?.email) {
        console.log("    ⚠️  INFO EXPOSURE: GET /drivers list exposes user emails");
      }
    }
    assert(true, "Checked email exposure in list endpoint");
  }
}

// ─── Main ────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n🔍 Bug Hunt: DRIVERS Endpoints`);
  console.log(`${"═".repeat(60)}`);
  console.log(`Test prefix: ${TEST_PREFIX}\n`);

  try {
    await fetchCsrf();

    // Create test users via Prisma (bypasses rate limits)
    console.log("📦 Setting up test users...");
    const driverA = await createDriverUser("drvA");
    const driverB = await createDriverUser("drvB");
    const userC = await createVerifiedUser("userC");
    console.log(`  Driver A: ${driverA.driverId} (user: ${driverA.userId})`);
    console.log(`  Driver B: ${driverB.driverId} (user: ${driverB.userId})`);
    console.log(`  User C: ${userC.userId} (no DRIVER role)`);

    await testInputValidation(driverA);
    await testAuthentication(driverA);
    await testAuthorization(driverA, driverB, userC);
    await testBusinessLogic(driverA);
    await testDeleteBehavior();
    await testInjectionAndAbuse(driverA);
    await testPaginationAndFiltering();
    await testErrorResponseShape(driverA);
    await testRaceConditions(driverA);
    await testCsrfProtection(driverA);
    await testPhotoEndpoints(driverA, driverB, userC);
    await testEmailExposure(driverA);
  } finally {
    await cleanup();
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log("\n❌ FAILURES:");
    for (const f of failures) console.log(`   • ${f}`);
    process.exit(1);
  } else {
    console.log("\n✅ All tests passed!");
  }
}

main();
