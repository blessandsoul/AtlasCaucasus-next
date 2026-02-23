/**
 * Exhaustive API bug-hunting tests for the Tours endpoints.
 *
 * Endpoints tested:
 *   1. GET  /tours              — List All Tours (public)
 *   2. GET  /tours/:id          — Get Tour by ID (public)
 *   3. POST /tours              — Create Tour (auth)
 *   4. GET  /me/tours           — List My Tours (auth)
 *   5. PATCH /tours/:id         — Update Tour (auth, owner/admin)
 *   6. DEL  /tours/:id          — Delete Tour (auth, owner/admin)
 *   7. POST /tours/:tourId/images — Upload Tour Image (auth)
 *   8. GET  /media/tour/:entityId — Get Tour Images (public)
 *   9. GET  /tours/:id/related  — Get Related Tours (public)
 *  10. GET  /tours/:id/availability — Check Tour Availability (public, rate-limited)
 *
 * Categories: input validation, authentication, authorization, business logic,
 *             injection attacks, pagination, error shape, race conditions, CSRF.
 *
 * Run: npx tsx src/tests/tours-hunt.test.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:8000/api/v1";

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
  opts: { body?: unknown; token?: string; headers?: Record<string, string>; skipCsrf?: boolean; rawBody?: string; contentType?: string } = {}
): Promise<{ status: number; body: any; headers: Headers }> {
  const headers: Record<string, string> = {
    ...opts.headers,
  };

  // Set content-type unless explicitly overridden or suppressed
  if (opts.contentType !== undefined) {
    if (opts.contentType !== "") headers["Content-Type"] = opts.contentType;
  } else if (opts.rawBody === undefined && opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
  } else if (opts.rawBody !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

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

// ─── Test User Helpers ───────────────────────────────────────

const TEST_PREFIX = `__hunt_${Date.now()}`;
const TEST_PASSWORD = "TestPass123!";
const createdUserIds: string[] = [];

function testEmail(suffix: string): string {
  return `${TEST_PREFIX}_${suffix}@test.local`;
}

/** Small delay to help avoid rate limits */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sign a JWT access token directly using the server's secret.
 * Avoids all rate-limited auth endpoints.
 */
async function signAccessToken(payload: {
  userId: string;
  roles: string[];
  tokenVersion: number;
  emailVerified: boolean;
}): Promise<string> {
  const jwt = await import("jsonwebtoken");
  const secret = process.env.ACCESS_TOKEN_SECRET!;
  return jwt.default.sign(payload, secret, { expiresIn: "15m" });
}

/** Create a user directly via Prisma and sign a token locally. No HTTP calls at all. */
async function createVerifiedUser(
  suffix: string
): Promise<{ token: string; refreshToken: string; userId: string; email: string }> {
  const email = testEmail(suffix);
  const userId = crypto.randomUUID();

  await prisma.user.create({
    data: {
      id: userId,
      email,
      passwordHash: "unused-hash", // Never need to login via HTTP
      firstName: "Test",
      lastName: suffix,
      isActive: true,
      emailVerified: true,
      tokenVersion: 0,
    },
  });
  await prisma.userRoleAssignment.create({ data: { userId, role: "USER" } });
  createdUserIds.push(userId);

  const token = await signAccessToken({
    userId,
    roles: ["USER"],
    tokenVersion: 0,
    emailVerified: true,
  });

  return { token, refreshToken: "", userId, email };
}

/** Create a user with unverified email, sign token locally. */
async function createUnverifiedUser(
  suffix: string
): Promise<{ token: string; refreshToken: string; userId: string; email: string }> {
  const email = testEmail(suffix);
  const userId = crypto.randomUUID();

  await prisma.user.create({
    data: {
      id: userId,
      email,
      passwordHash: "unused-hash",
      firstName: "Test",
      lastName: suffix,
      isActive: true,
      emailVerified: false,
      tokenVersion: 0,
    },
  });
  await prisma.userRoleAssignment.create({ data: { userId, role: "USER" } });
  createdUserIds.push(userId);

  const token = await signAccessToken({
    userId,
    roles: ["USER"],
    tokenVersion: 0,
    emailVerified: false,
  });

  return { token, refreshToken: "", userId, email };
}

// Track created tour IDs for cleanup
const createdTourIds: string[] = [];

/** Helper to create a tour as a user */
async function createTourAs(
  token: string,
  overrides: Record<string, unknown> = {}
): Promise<{ id: string; [key: string]: unknown }> {
  const body = {
    title: `${TEST_PREFIX} Test Tour ${Date.now()}`,
    price: 99.99,
    summary: "A test tour",
    currency: "GEL",
    city: "Tbilisi",
    durationMinutes: 120,
    maxPeople: 10,
    ...overrides,
  };

  const res = await api("POST", "/tours", { body, token });
  if (res.status !== 201) throw new Error(`Create tour failed: ${JSON.stringify(res.body)}`);
  createdTourIds.push(res.body.data.id);
  return res.body.data;
}

// ─── Cleanup ─────────────────────────────────────────────────

async function cleanup(): Promise<void> {
  console.log("\n🧹 Cleaning up test data...");

  // Clean up tours first
  for (const tourId of createdTourIds) {
    try {
      await prisma.media.deleteMany({ where: { entityId: tourId } });
      await prisma.booking.deleteMany({ where: { entityId: tourId } });
      await prisma.review.deleteMany({ where: { targetId: tourId } });
      await prisma.favorite.deleteMany({ where: { entityId: tourId } });
      await prisma.tourLocation.deleteMany({ where: { tourId } });
      await prisma.tour.delete({ where: { id: tourId } }).catch(() => {});
    } catch (err) {
      console.log(`  ⚠️  Cleanup error for tour ${tourId}: ${(err as Error).message}`);
    }
  }

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
          await prisma.tourLocation.deleteMany({ where: { tourId: tour.id } });
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
        await prisma.booking.deleteMany({ where: { entityId: tour.id } });
        await prisma.review.deleteMany({ where: { targetId: tour.id } });
        await prisma.favorite.deleteMany({ where: { entityId: tour.id } });
        await prisma.tourLocation.deleteMany({ where: { tourId: tour.id } });
        await prisma.tour.delete({ where: { id: tour.id } }).catch(() => {});
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

// ─── Error shape helper ──────────────────────────────────────

function assertErrorShape(res: { body: any }, label: string): void {
  assertEq(res.body?.success, false, `${label}: success is false`);
  assert(typeof res.body?.error?.code === "string", `${label}: has string code`);
  assert(typeof res.body?.error?.message === "string", `${label}: has string message`);
  const bodyStr = JSON.stringify(res.body);
  assert(!bodyStr.includes("stack"), `${label}: no stack trace`);
  assert(!bodyStr.toLowerCase().includes("prisma"), `${label}: no Prisma leak`);
  assert(!bodyStr.includes("node_modules"), `${label}: no path leak`);
  assert(!bodyStr.includes("SELECT"), `${label}: no SQL leak`);
}

// ═══════════════════════════════════════════════════════════════
// 1. INPUT VALIDATION — POST /tours (Create Tour)
// ═══════════════════════════════════════════════════════════════

async function testCreateTourValidation(token: string): Promise<void> {
  section("1. INPUT VALIDATION — POST /tours (Create Tour)");

  // Missing body entirely
  {
    const r = await api("POST", "/tours", { token, rawBody: "" });
    assert(r.status >= 400 && r.status < 500, "POST /tours empty body → 4xx");
  }

  // Empty object
  {
    const r = await api("POST", "/tours", { body: {}, token });
    assert(r.status >= 400 && r.status < 500, "POST /tours {} → 4xx (missing title + price)");
  }

  // Missing title
  {
    const r = await api("POST", "/tours", { body: { price: 10 }, token });
    assert(r.status >= 400 && r.status < 500, "POST /tours missing title → 4xx");
  }

  // Missing price
  {
    const r = await api("POST", "/tours", { body: { title: "Hello" }, token });
    assert(r.status >= 400 && r.status < 500, "POST /tours missing price → 4xx");
  }

  // Title too short (min 3 chars)
  {
    const r = await api("POST", "/tours", { body: { title: "ab", price: 10 }, token });
    assert(r.status >= 400 && r.status < 500, "POST /tours title < 3 chars → 4xx");
  }

  // Title too long (max 200 chars)
  {
    const r = await api("POST", "/tours", { body: { title: "x".repeat(201), price: 10 }, token });
    assert(r.status >= 400 && r.status < 500, "POST /tours title > 200 chars → 4xx");
  }

  // Price negative
  {
    const r = await api("POST", "/tours", { body: { title: "Good title", price: -1 }, token });
    assert(r.status >= 400 && r.status < 500, "POST /tours price=-1 → 4xx");
  }

  // Price is string
  {
    const r = await api("POST", "/tours", { body: { title: "Good title", price: "not a number" }, token });
    assert(r.status >= 400 && r.status < 500, "POST /tours price=string → 4xx");
  }

  // Price is NaN
  {
    const r = await api("POST", "/tours", { body: { title: "Good title", price: NaN }, token });
    assert(r.status >= 400 && r.status < 500, "POST /tours price=NaN → 4xx");
  }

  // Price zero (should be allowed)
  {
    const r = await api("POST", "/tours", { body: { title: "Free Tour", price: 0 }, token });
    assertEq(r.status, 201, "POST /tours price=0 → 201 (free tour)");
    if (r.status === 201) createdTourIds.push(r.body.data.id);
  }

  // Currency wrong length
  {
    const r = await api("POST", "/tours", { body: { title: "Good", price: 10, currency: "AB" }, token });
    assert(r.status >= 400 && r.status < 500, "POST /tours currency=2chars → 4xx");
  }

  {
    const r = await api("POST", "/tours", { body: { title: "Good", price: 10, currency: "ABCD" }, token });
    assert(r.status >= 400 && r.status < 500, "POST /tours currency=4chars → 4xx");
  }

  // Summary too long
  {
    const r = await api("POST", "/tours", { body: { title: "Good", price: 10, summary: "x".repeat(1001) }, token });
    assert(r.status >= 400 && r.status < 500, "POST /tours summary > 1000 chars → 4xx");
  }

  // durationMinutes negative
  {
    const r = await api("POST", "/tours", { body: { title: "Good", price: 10, durationMinutes: -5 }, token });
    assert(r.status >= 400 && r.status < 500, "POST /tours durationMinutes < 0 → 4xx");
  }

  // durationMinutes float
  {
    const r = await api("POST", "/tours", { body: { title: "Good", price: 10, durationMinutes: 1.5 }, token });
    assert(r.status >= 400 && r.status < 500, "POST /tours durationMinutes=float → 4xx");
  }

  // maxPeople < 1
  {
    const r = await api("POST", "/tours", { body: { title: "Good", price: 10, maxPeople: 0 }, token });
    assert(r.status >= 400 && r.status < 500, "POST /tours maxPeople=0 → 4xx");
  }

  // Invalid availabilityType
  {
    const r = await api("POST", "/tours", { body: { title: "Good", price: 10, availabilityType: "ALWAYS" }, token });
    assert(r.status >= 400 && r.status < 500, "POST /tours invalid availabilityType → 4xx");
  }

  // startTime wrong format
  {
    const r = await api("POST", "/tours", { body: { title: "Good", price: 10, startTime: "9:30" }, token });
    assert(r.status >= 400 && r.status < 500, "POST /tours startTime bad format → 4xx");
  }

  // startTime valid format
  {
    const r = await api("POST", "/tours", { body: { title: "Good Tour OK", price: 10, startTime: "09:30" }, token });
    assertEq(r.status, 201, "POST /tours startTime=09:30 → 201");
    if (r.status === 201) createdTourIds.push(r.body.data.id);
  }

  // Itinerary too many steps
  {
    const steps = Array.from({ length: 31 }, (_, i) => ({ title: `Step ${i}`, description: `Desc ${i}` }));
    const r = await api("POST", "/tours", { body: { title: "Good", price: 10, itinerary: steps }, token });
    assert(r.status >= 400 && r.status < 500, "POST /tours 31 itinerary steps → 4xx");
  }

  // Itinerary step missing title
  {
    const r = await api("POST", "/tours", {
      body: { title: "Good", price: 10, itinerary: [{ description: "hello" }] },
      token,
    });
    assert(r.status >= 400 && r.status < 500, "POST /tours itinerary step missing title → 4xx");
  }

  // Wrong types
  {
    const r = await api("POST", "/tours", { body: { title: 12345, price: 10 }, token });
    assert(r.status >= 400 && r.status < 500, "POST /tours title=number → 4xx");
  }

  {
    const r = await api("POST", "/tours", { body: { title: "Good", price: true }, token });
    assert(r.status >= 400 && r.status < 500, "POST /tours price=boolean → 4xx");
  }

  // Null body
  {
    const r = await api("POST", "/tours", { body: null, token });
    assert(r.status >= 400 && r.status < 500, "POST /tours body=null → 4xx");
  }

  // Array body
  {
    const r = await api("POST", "/tours", { body: [{ title: "x", price: 1 }], token });
    assert(r.status >= 400 && r.status < 500, "POST /tours body=array → 4xx");
  }

  // Malformed JSON
  {
    const r = await api("POST", "/tours", { token, rawBody: "{title:bad json" });
    assert(r.status >= 400 && r.status < 500, "POST /tours malformed JSON → 4xx");
  }

  // XSS in title (should be accepted but not cause issues — stored XSS test)
  {
    const r = await api("POST", "/tours", {
      body: { title: '<script>alert("xss")</script>', price: 10 },
      token,
    });
    // This should still create (or reject, both are acceptable), but no 500
    assert(r.status !== 500, "POST /tours XSS in title → no 500");
    if (r.status === 201) createdTourIds.push(r.body.data.id);
  }

  // SQL injection in title
  {
    const r = await api("POST", "/tours", {
      body: { title: "'; DROP TABLE tours; --", price: 10 },
      token,
    });
    assert(r.status !== 500, "POST /tours SQL injection in title → no 500");
    if (r.status === 201) createdTourIds.push(r.body.data.id);
  }

  // Prototype pollution
  {
    const r = await api("POST", "/tours", {
      body: { title: "Good", price: 10, "__proto__": { "admin": true }, "constructor": { "prototype": { "isAdmin": true } } },
      token,
    });
    assert(r.status !== 500, "POST /tours prototype pollution → no 500");
    if (r.status === 201) {
      createdTourIds.push(r.body.data.id);
      // Verify admin fields were NOT set
      assert(r.body.data.isAdmin === undefined, "POST /tours prototype pollution: isAdmin not set");
    }
  }

  // Extra fields should be ignored (privilege escalation attempt)
  {
    const r = await api("POST", "/tours", {
      body: { title: "Good Tour Ext", price: 10, isFeatured: true, isActive: false },
      token,
    });
    // isFeatured and isActive are not in createTourSchema, but they may pass through
    assert(r.status !== 500, "POST /tours extra fields → no 500");
    if (r.status === 201) createdTourIds.push(r.body.data.id);
  }

  // Extremely long string (10K chars) in title
  {
    const r = await api("POST", "/tours", {
      body: { title: "a".repeat(10000), price: 10 },
      token,
    });
    assert(r.status >= 400 && r.status < 500, "POST /tours 10K char title → 4xx");
  }
}

// ═══════════════════════════════════════════════════════════════
// 2. INPUT VALIDATION — PATCH /tours/:id (Update Tour)
// ═══════════════════════════════════════════════════════════════

async function testUpdateTourValidation(token: string, tourId: string): Promise<void> {
  section("2. INPUT VALIDATION — PATCH /tours/:id (Update Tour)");

  // Empty object (should be fine — all fields optional)
  {
    const r = await api("PATCH", `/tours/${tourId}`, { body: {}, token });
    assertEq(r.status, 200, "PATCH /tours/:id {} → 200 (no changes)");
  }

  // Invalid UUID in path
  {
    const r = await api("PATCH", "/tours/not-a-uuid", { body: { title: "New" }, token });
    assert(r.status >= 400 && r.status < 500, "PATCH /tours/bad-uuid → 4xx");
  }

  // UUID that doesn't exist
  {
    const r = await api("PATCH", "/tours/00000000-0000-0000-0000-000000000000", { body: { title: "New" }, token });
    assertEq(r.status, 404, "PATCH /tours/nonexistent → 404");
  }

  // Title too short
  {
    const r = await api("PATCH", `/tours/${tourId}`, { body: { title: "ab" }, token });
    assert(r.status >= 400 && r.status < 500, "PATCH title < 3 chars → 4xx");
  }

  // Title too long
  {
    const r = await api("PATCH", `/tours/${tourId}`, { body: { title: "x".repeat(201) }, token });
    assert(r.status >= 400 && r.status < 500, "PATCH title > 200 chars → 4xx");
  }

  // Price negative
  {
    const r = await api("PATCH", `/tours/${tourId}`, { body: { price: -5 }, token });
    assert(r.status >= 400 && r.status < 500, "PATCH price=-5 → 4xx");
  }

  // maxPeople zero
  {
    const r = await api("PATCH", `/tours/${tourId}`, { body: { maxPeople: 0 }, token });
    assert(r.status >= 400 && r.status < 500, "PATCH maxPeople=0 → 4xx");
  }

  // Nullable fields — set summary to null
  {
    const r = await api("PATCH", `/tours/${tourId}`, { body: { summary: null }, token });
    assertEq(r.status, 200, "PATCH summary=null → 200 (clear field)");
  }

  // Nullable fields — set city to null
  {
    const r = await api("PATCH", `/tours/${tourId}`, { body: { city: null }, token });
    assertEq(r.status, 200, "PATCH city=null → 200 (clear field)");
  }

  // Invalid itinerary step
  {
    const r = await api("PATCH", `/tours/${tourId}`, {
      body: { itinerary: [{ title: "", description: "test" }] },
      token,
    });
    assert(r.status >= 400 && r.status < 500, "PATCH itinerary empty step title → 4xx");
  }

  // SQL injection in path param
  {
    const r = await api("PATCH", "/tours/' OR 1=1 --", { body: { title: "New" }, token });
    assert(r.status >= 400 && r.status < 500, "PATCH /tours/sqli → 4xx");
    assertErrorShape(r, "PATCH /tours/sqli error shape");
  }

  // Path traversal in ID
  {
    const r = await api("PATCH", "/tours/../../etc/passwd", { body: { title: "New" }, token });
    assert(r.status >= 400 && r.status < 500, "PATCH /tours/path-traversal → 4xx");
  }
}

// ═══════════════════════════════════════════════════════════════
// 3. INPUT VALIDATION — GET /tours (List All Tours Query Params)
// ═══════════════════════════════════════════════════════════════

async function testListAllToursValidation(): Promise<void> {
  section("3. INPUT VALIDATION — GET /tours (List / Query Params)");

  // Default (no params)
  {
    const r = await api("GET", "/tours");
    assertEq(r.status, 200, "GET /tours default → 200");
    assert(r.body?.success === true, "GET /tours success=true");
    assert(Array.isArray(r.body?.data?.items), "GET /tours has items array");
    assert(typeof r.body?.data?.pagination === "object", "GET /tours has pagination object");
  }

  // page=0
  {
    const r = await api("GET", "/tours?page=0");
    assert(r.status >= 400 && r.status < 500, "GET /tours page=0 → 4xx");
  }

  // page=-1
  {
    const r = await api("GET", "/tours?page=-1");
    assert(r.status >= 400 && r.status < 500, "GET /tours page=-1 → 4xx");
  }

  // page=abc
  {
    const r = await api("GET", "/tours?page=abc");
    assert(r.status >= 400 && r.status < 500, "GET /tours page=abc → 4xx");
  }

  // page=1.5
  {
    const r = await api("GET", "/tours?page=1.5");
    assert(r.status >= 400 && r.status < 500, "GET /tours page=1.5 → 4xx");
  }

  // limit=0
  {
    const r = await api("GET", "/tours?limit=0");
    assert(r.status >= 400 && r.status < 500, "GET /tours limit=0 → 4xx");
  }

  // limit=-1
  {
    const r = await api("GET", "/tours?limit=-1");
    assert(r.status >= 400 && r.status < 500, "GET /tours limit=-1 → 4xx");
  }

  // limit=101 (over max)
  {
    const r = await api("GET", "/tours?limit=101");
    assert(r.status >= 400 && r.status < 500, "GET /tours limit=101 → 4xx");
  }

  // limit=abc
  {
    const r = await api("GET", "/tours?limit=abc");
    assert(r.status >= 400 && r.status < 500, "GET /tours limit=abc → 4xx");
  }

  // Very high page (beyond data) — should return empty
  {
    const r = await api("GET", "/tours?page=99999");
    assertEq(r.status, 200, "GET /tours page=99999 → 200");
    assertEq(r.body?.data?.items?.length, 0, "GET /tours page=99999 → empty items");
    assert(r.body?.data?.pagination?.hasPreviousPage === true, "GET /tours page=99999 → hasPreviousPage");
  }

  // sortBy invalid
  {
    const r = await api("GET", "/tours?sortBy=invalid");
    assert(r.status >= 400 && r.status < 500, "GET /tours sortBy=invalid → 4xx");
  }

  // sortBy SQL injection
  {
    const r = await api("GET", "/tours?sortBy=price;DROP TABLE tours");
    assert(r.status >= 400 && r.status < 500, "GET /tours sortBy=sqli → 4xx");
  }

  // Valid sortBy values
  for (const sortBy of ["newest", "rating", "price", "price_desc"]) {
    const r = await api("GET", `/tours?sortBy=${sortBy}`);
    assertEq(r.status, 200, `GET /tours sortBy=${sortBy} → 200`);
  }

  // minPrice > maxPrice (logical error — should still work, just return 0)
  {
    const r = await api("GET", "/tours?minPrice=1000&maxPrice=1");
    assertEq(r.status, 200, "GET /tours minPrice>maxPrice → 200 (empty result)");
  }

  // minPrice negative
  {
    const r = await api("GET", "/tours?minPrice=-5");
    assert(r.status >= 400 && r.status < 500, "GET /tours minPrice=-5 → 4xx");
  }

  // search with SQL injection
  {
    const r = await api("GET", "/tours?search=' OR 1=1 --");
    assertEq(r.status, 200, "GET /tours search=sqli → 200 (no crash)");
  }

  // search with XSS
  {
    const r = await api("GET", "/tours?search=<script>alert(1)</script>");
    assertEq(r.status, 200, "GET /tours search=xss → 200 (no crash)");
  }

  // search very long (over 200 chars)
  {
    const r = await api("GET", `/tours?search=${"a".repeat(201)}`);
    assert(r.status >= 400 && r.status < 500, "GET /tours search > 200 chars → 4xx");
  }

  // locationId invalid UUID
  {
    const r = await api("GET", "/tours?locationId=not-uuid");
    assert(r.status >= 400 && r.status < 500, "GET /tours locationId=invalid → 4xx");
  }

  // minRating out of range
  {
    const r = await api("GET", "/tours?minRating=6");
    assert(r.status >= 400 && r.status < 500, "GET /tours minRating=6 → 4xx");
  }

  // dateFrom valid
  {
    const r = await api("GET", "/tours?dateFrom=2026-03-01");
    assertEq(r.status, 200, "GET /tours dateFrom valid → 200");
  }

  // dateFrom invalid format
  {
    const r = await api("GET", "/tours?dateFrom=01-03-2026");
    assert(r.status >= 400 && r.status < 500, "GET /tours dateFrom bad format → 4xx");
  }

  // Pagination math verification
  {
    const r = await api("GET", "/tours?page=1&limit=1");
    assertEq(r.status, 200, "GET /tours page=1 limit=1 → 200");
    if (r.body?.data?.pagination) {
      const p = r.body.data.pagination;
      assertEq(p.page, 1, "pagination.page = 1");
      assertEq(p.limit, 1, "pagination.limit = 1");
      assert(typeof p.totalItems === "number", "pagination.totalItems is number");
      assert(typeof p.totalPages === "number", "pagination.totalPages is number");
      assert(typeof p.hasNextPage === "boolean", "pagination.hasNextPage is boolean");
      assert(typeof p.hasPreviousPage === "boolean", "pagination.hasPreviousPage is boolean");
      assertEq(p.hasPreviousPage, false, "page 1 → hasPreviousPage=false");
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 4. INPUT VALIDATION — GET /tours/:id (Get Tour by ID)
// ═══════════════════════════════════════════════════════════════

async function testGetTourByIdValidation(existingTourId: string): Promise<void> {
  section("4. INPUT VALIDATION — GET /tours/:id");

  // Valid ID
  {
    const r = await api("GET", `/tours/${existingTourId}`);
    assertEq(r.status, 200, "GET /tours/:id valid → 200");
    assert(r.body?.success === true, "GET /tours/:id success=true");
    assert(typeof r.body?.data?.id === "string", "GET /tours/:id returns tour object");
  }

  // Invalid UUID
  {
    const r = await api("GET", "/tours/not-a-uuid");
    assert(r.status >= 400 && r.status < 500, "GET /tours/bad-uuid → 4xx");
    assertErrorShape(r, "GET /tours/bad-uuid");
  }

  // Non-existent UUID
  {
    const r = await api("GET", "/tours/00000000-0000-0000-0000-000000000000");
    assertEq(r.status, 404, "GET /tours/nonexistent → 404");
    assertErrorShape(r, "GET /tours/nonexistent");
  }

  // SQL injection in ID
  {
    const r = await api("GET", "/tours/' OR 1=1 --");
    assert(r.status >= 400 && r.status < 500, "GET /tours/sqli → 4xx");
  }

  // Empty ID — trailing slash may or may not match list endpoint
  {
    const r = await api("GET", "/tours/");
    assert(r.status !== 500, "GET /tours/ → no 500");
  }

  // Path traversal
  {
    const r = await api("GET", "/tours/../../etc/passwd");
    assert(r.status >= 400 && r.status < 500, "GET /tours/path-traversal → 4xx");
  }
}

// ═══════════════════════════════════════════════════════════════
// 5. AUTHENTICATION ATTACKS
// ═══════════════════════════════════════════════════════════════

async function testAuthentication(): Promise<void> {
  section("5. AUTHENTICATION ATTACKS");

  // POST /tours — No auth header
  {
    const r = await api("POST", "/tours", { body: { title: "Test", price: 10 } });
    assertEq(r.status, 401, "POST /tours no auth → 401");
    assertEq(r.body?.error?.code, "NO_AUTH_HEADER", "POST /tours no auth → NO_AUTH_HEADER");
  }

  // POST /tours — Empty Authorization header
  {
    const r = await api("POST", "/tours", {
      body: { title: "Test", price: 10 },
      headers: { Authorization: "" },
    });
    assertEq(r.status, 401, "POST /tours empty auth → 401");
  }

  // POST /tours — No "Bearer " prefix
  {
    const r = await api("POST", "/tours", {
      body: { title: "Test", price: 10 },
      headers: { Authorization: "sometoken123" },
    });
    assertEq(r.status, 401, "POST /tours no Bearer → 401");
    assertEq(r.body?.error?.code, "INVALID_AUTH_FORMAT", "POST /tours → INVALID_AUTH_FORMAT");
  }

  // POST /tours — Bearer with no token
  {
    const r = await api("POST", "/tours", {
      body: { title: "Test", price: 10 },
      headers: { Authorization: "Bearer" },
    });
    assertEq(r.status, 401, "POST /tours Bearer-no-space → 401");
  }

  // POST /tours — Bearer with space only
  {
    const r = await api("POST", "/tours", {
      body: { title: "Test", price: 10 },
      headers: { Authorization: "Bearer " },
    });
    assertEq(r.status, 401, "POST /tours Bearer+space → 401");
  }

  // POST /tours — Random string as token
  {
    const r = await api("POST", "/tours", {
      body: { title: "Test", price: 10 },
      token: "not.a.valid.jwt.token",
    });
    assertEq(r.status, 401, "POST /tours random token → 401");
    assertEq(r.body?.error?.code, "INVALID_TOKEN", "POST /tours → INVALID_TOKEN");
  }

  // GET /me/tours — No auth
  {
    const r = await api("GET", "/me/tours");
    assertEq(r.status, 401, "GET /me/tours no auth → 401");
  }

  // PATCH /tours/:id — No auth
  {
    const r = await api("PATCH", "/tours/00000000-0000-0000-0000-000000000000", {
      body: { title: "Updated" },
    });
    assertEq(r.status, 401, "PATCH /tours/:id no auth → 401");
  }

  // DELETE /tours/:id — No auth
  {
    const r = await api("DELETE", "/tours/00000000-0000-0000-0000-000000000000");
    assertEq(r.status, 401, "DELETE /tours/:id no auth → 401");
  }

  // Public endpoints don't need auth
  {
    const r = await api("GET", "/tours");
    assertEq(r.status, 200, "GET /tours no auth → 200 (public)");
  }

  // Token for deactivated user — use direct JWT signing to avoid rate limits
  {
    const deactId = crypto.randomUUID();
    await prisma.user.create({
      data: { id: deactId, email: testEmail("deactivated"), passwordHash: "x", firstName: "Test", lastName: "Deact", isActive: false, emailVerified: true, tokenVersion: 0 },
    });
    await prisma.userRoleAssignment.create({ data: { userId: deactId, role: "USER" } });
    createdUserIds.push(deactId);

    const deactToken = await signAccessToken({ userId: deactId, roles: ["USER"], tokenVersion: 0, emailVerified: true });
    const r = await api("POST", "/tours", { body: { title: "Test", price: 10 }, token: deactToken });
    assertEq(r.status, 401, "POST /tours deactivated user → 401");
    assertEq(r.body?.error?.code, "ACCOUNT_DEACTIVATED", "POST /tours → ACCOUNT_DEACTIVATED");
    // Re-activate for cleanup
    await prisma.user.update({ where: { id: deactId }, data: { isActive: true } });
  }

  // Token for soft-deleted user
  {
    const delId = crypto.randomUUID();
    await prisma.user.create({
      data: { id: delId, email: testEmail("softdel"), passwordHash: "x", firstName: "Test", lastName: "SoftDel", isActive: true, emailVerified: true, tokenVersion: 0, deletedAt: new Date() },
    });
    await prisma.userRoleAssignment.create({ data: { userId: delId, role: "USER" } });
    createdUserIds.push(delId);

    const delToken = await signAccessToken({ userId: delId, roles: ["USER"], tokenVersion: 0, emailVerified: true });
    const r = await api("POST", "/tours", { body: { title: "Test", price: 10 }, token: delToken });
    assertEq(r.status, 401, "POST /tours soft-deleted user → 401");
    assertEq(r.body?.error?.code, "USER_NOT_FOUND", "POST /tours deleted → USER_NOT_FOUND");
    // Undo for cleanup
    await prisma.user.update({ where: { id: delId }, data: { deletedAt: null } });
  }

  // Stale tokenVersion
  {
    const staleId = crypto.randomUUID();
    await prisma.user.create({
      data: { id: staleId, email: testEmail("staletoken"), passwordHash: "x", firstName: "Test", lastName: "Stale", isActive: true, emailVerified: true, tokenVersion: 0 },
    });
    await prisma.userRoleAssignment.create({ data: { userId: staleId, role: "USER" } });
    createdUserIds.push(staleId);

    // Sign token with tokenVersion=0, then bump DB to version 1
    const staleToken = await signAccessToken({ userId: staleId, roles: ["USER"], tokenVersion: 0, emailVerified: true });
    await prisma.user.update({ where: { id: staleId }, data: { tokenVersion: 1 } });

    const r = await api("POST", "/tours", { body: { title: "Test", price: 10 }, token: staleToken });
    assertEq(r.status, 401, "POST /tours stale tokenVersion → 401");
    assertEq(r.body?.error?.code, "SESSION_INVALIDATED", "POST /tours → SESSION_INVALIDATED");
  }

  // Unverified email
  {
    const unverified = await createUnverifiedUser("unverified");
    const r = await api("POST", "/tours", {
      body: { title: "Test", price: 10 },
      token: unverified.token,
    });
    assertEq(r.status, 403, "POST /tours unverified email → 403");
    assertEq(r.body?.error?.code, "EMAIL_NOT_VERIFIED", "POST /tours → EMAIL_NOT_VERIFIED");
  }
}

// ═══════════════════════════════════════════════════════════════
// 6. AUTHORIZATION — Cross-user access
// ═══════════════════════════════════════════════════════════════

async function testAuthorization(
  userA: { token: string; userId: string },
  userB: { token: string; userId: string }
): Promise<void> {
  section("6. AUTHORIZATION — Cross-user access");

  // User A creates a tour
  const tourA = await createTourAs(userA.token, { title: "User A's private tour" });

  // User B tries to update User A's tour
  {
    const r = await api("PATCH", `/tours/${tourA.id}`, {
      body: { title: "Hacked by B" },
      token: userB.token,
    });
    assertEq(r.status, 403, "PATCH User A's tour by User B → 403");
    assertEq(r.body?.error?.code, "NOT_TOUR_OWNER", "PATCH → NOT_TOUR_OWNER");
  }

  // User B tries to delete User A's tour
  {
    const r = await api("DELETE", `/tours/${tourA.id}`, { token: userB.token });
    assertEq(r.status, 403, "DELETE User A's tour by User B → 403");
    assertEq(r.body?.error?.code, "NOT_TOUR_OWNER", "DELETE → NOT_TOUR_OWNER");
  }

  // User B should still see User A's tour in public listings (if active)
  {
    const r = await api("GET", `/tours/${tourA.id}`);
    assertEq(r.status, 200, "GET User A's tour publicly → 200");
  }

  // User B's /me/tours should NOT contain User A's tour
  {
    const r = await api("GET", "/me/tours?limit=100", { token: userB.token });
    assertEq(r.status, 200, "GET /me/tours for User B → 200");
    const hasTourA = r.body?.data?.items?.some((t: any) => t.id === tourA.id);
    assertEq(hasTourA, false, "User B's /me/tours does NOT include User A's tour");
  }

  // Privilege escalation: try to set isFeatured via update
  {
    const r = await api("PATCH", `/tours/${tourA.id}`, {
      body: { isFeatured: true },
      token: userA.token,
    });
    // This may or may not be allowed depending on schema
    assert(r.status !== 500, "PATCH isFeatured → no 500");
  }
}

// ═══════════════════════════════════════════════════════════════
// 7. BUSINESS LOGIC
// ═══════════════════════════════════════════════════════════════

async function testBusinessLogic(token: string): Promise<void> {
  section("7. BUSINESS LOGIC");

  // Create a tour and verify response shape
  {
    const tour = await createTourAs(token, {
      title: `${TEST_PREFIX} BizLogic Tour`,
      price: 49.99,
      currency: "USD",
      city: "Batumi",
      durationMinutes: 60,
      maxPeople: 5,
      availabilityType: "DAILY",
      startTime: "10:00",
      itinerary: [
        { title: "Start", description: "Meet at the port" },
        { title: "End", description: "Return to port" },
      ],
    });

    assertEq(tour.title, `${TEST_PREFIX} BizLogic Tour`, "Create: title matches");
    assertEq(tour.currency, "USD", "Create: currency matches");
    assertEq(tour.city, "Batumi", "Create: city matches");
    assertEq(tour.durationMinutes, 60, "Create: durationMinutes matches");
    assertEq(tour.maxPeople, 5, "Create: maxPeople matches");
    assertEq(tour.isActive, true, "Create: isActive = true by default");
    assertEq(tour.availabilityType, "DAILY", "Create: availabilityType matches");
    assertEq(tour.startTime, "10:00", "Create: startTime matches");
    assert(Array.isArray(tour.itinerary), "Create: itinerary is array");
    assertEq(tour.itinerary?.length, 2, "Create: itinerary has 2 steps");
  }

  // Create tour with companyId for non-existent company → 400
  {
    const r = await api("POST", "/tours", {
      body: { title: "Company tour test", price: 10, companyId: "00000000-0000-0000-0000-000000000000" },
      token,
    });
    assertEq(r.status, 400, "Create tour with fake companyId → 400");
    assertEq(r.body?.error?.code, "COMPANY_NOT_FOUND", "Create tour → COMPANY_NOT_FOUND");
  }

  // Update a tour
  {
    const tour = await createTourAs(token, { title: "Original Title" });
    const r = await api("PATCH", `/tours/${tour.id}`, {
      body: { title: "Updated Title", price: 200.50 },
      token,
    });
    assertEq(r.status, 200, "Update tour → 200");
    assertEq(r.body?.data?.title, "Updated Title", "Update: title changed");
  }

  // Soft delete a tour → GET public should 404
  {
    const tour = await createTourAs(token, { title: "To be deleted" });
    const delRes = await api("DELETE", `/tours/${tour.id}`, { token });
    assertEq(delRes.status, 200, "Delete tour → 200");
    assertEq(delRes.body?.data?.isActive, false, "Delete: isActive → false");

    // Public GET should now 404
    const getRes = await api("GET", `/tours/${tour.id}`);
    assertEq(getRes.status, 404, "GET deleted tour → 404");
  }

  // Double-delete should still work or return 404
  {
    const tour = await createTourAs(token, { title: "Double delete" });
    await api("DELETE", `/tours/${tour.id}`, { token });
    const r = await api("DELETE", `/tours/${tour.id}`, { token });
    // Could be 200 (idempotent) or 404 — either is acceptable but not 500
    assert(r.status !== 500, "Double-delete → no 500");
  }

  // List My Tours
  {
    const r = await api("GET", "/me/tours", { token });
    assertEq(r.status, 200, "GET /me/tours → 200");
    assert(Array.isArray(r.body?.data?.items), "/me/tours has items array");
  }

  // List My Tours with includeInactive
  {
    const tour = await createTourAs(token, { title: "Inactive test" });
    await api("DELETE", `/tours/${tour.id}`, { token }); // soft delete

    const withInactive = await api("GET", "/me/tours?includeInactive=true", { token });
    assertEq(withInactive.status, 200, "/me/tours?includeInactive=true → 200");
    const hasInactive = withInactive.body?.data?.items?.some((t: any) => t.id === tour.id);
    assertEq(hasInactive, true, "/me/tours includeInactive shows deleted tour");

    const withoutInactive = await api("GET", "/me/tours?includeInactive=false", { token });
    const hasActive = withoutInactive.body?.data?.items?.some((t: any) => t.id === tour.id);
    assertEq(hasActive, false, "/me/tours includeInactive=false hides deleted tour");
  }
}

// ═══════════════════════════════════════════════════════════════
// 8. RELATED TOURS
// ═══════════════════════════════════════════════════════════════

async function testRelatedTours(token: string): Promise<void> {
  section("8. RELATED TOURS — GET /tours/:id/related");

  // Create a tour to get related for
  const tour = await createTourAs(token, { title: "Main Tour", city: "Tbilisi" });

  // Valid request
  {
    const r = await api("GET", `/tours/${tour.id}/related`);
    assertEq(r.status, 200, "GET /tours/:id/related → 200");
    assert(Array.isArray(r.body?.data), "related tours → array");
    // The current tour should NOT be in the results
    const self = r.body?.data?.find((t: any) => t.id === tour.id);
    assertEq(self, undefined, "related tours does not include self");
  }

  // Custom limit
  {
    const r = await api("GET", `/tours/${tour.id}/related?limit=2`);
    assertEq(r.status, 200, "related limit=2 → 200");
    assert(r.body?.data?.length <= 2, "related limit=2 → at most 2 items");
  }

  // limit=0 (below min)
  {
    const r = await api("GET", `/tours/${tour.id}/related?limit=0`);
    assert(r.status >= 400 && r.status < 500, "related limit=0 → 4xx");
  }

  // limit=21 (above max)
  {
    const r = await api("GET", `/tours/${tour.id}/related?limit=21`);
    assert(r.status >= 400 && r.status < 500, "related limit=21 → 4xx");
  }

  // Invalid tour ID
  {
    const r = await api("GET", "/tours/not-uuid/related");
    assert(r.status >= 400 && r.status < 500, "related bad uuid → 4xx");
  }

  // Non-existent tour ID (should return empty array — tour not found in service)
  {
    const r = await api("GET", "/tours/00000000-0000-0000-0000-000000000000/related");
    assertEq(r.status, 200, "related nonexistent tour → 200");
    assertEq(r.body?.data?.length, 0, "related nonexistent → empty array");
  }
}

// ═══════════════════════════════════════════════════════════════
// 9. AVAILABILITY CHECK — GET /tours/:id/availability
// ═══════════════════════════════════════════════════════════════

async function testAvailability(token: string): Promise<void> {
  section("9. AVAILABILITY — GET /tours/:id/availability");

  const tour = await createTourAs(token, {
    title: "Availability Tour",
    maxPeople: 10,
    availabilityType: "DAILY",
  });

  // Valid check
  {
    const r = await api("GET", `/tours/${tour.id}/availability?date=2026-03-15&guests=2`);
    assertEq(r.status, 200, "availability valid → 200");
    assert(r.body?.success === true, "availability success=true");
  }

  // Missing date
  {
    const r = await api("GET", `/tours/${tour.id}/availability?guests=2`);
    assert(r.status >= 400 && r.status < 500, "availability missing date → 4xx");
  }

  // Missing guests
  {
    const r = await api("GET", `/tours/${tour.id}/availability?date=2026-03-15`);
    assert(r.status >= 400 && r.status < 500, "availability missing guests → 4xx");
  }

  // Invalid date
  {
    const r = await api("GET", `/tours/${tour.id}/availability?date=not-a-date&guests=2`);
    assert(r.status >= 400 && r.status < 500, "availability bad date → 4xx");
  }

  // guests=0
  {
    const r = await api("GET", `/tours/${tour.id}/availability?date=2026-03-15&guests=0`);
    assert(r.status >= 400 && r.status < 500, "availability guests=0 → 4xx");
  }

  // guests=-1
  {
    const r = await api("GET", `/tours/${tour.id}/availability?date=2026-03-15&guests=-1`);
    assert(r.status >= 400 && r.status < 500, "availability guests=-1 → 4xx");
  }

  // guests=101 (above max)
  {
    const r = await api("GET", `/tours/${tour.id}/availability?date=2026-03-15&guests=101`);
    assert(r.status >= 400 && r.status < 500, "availability guests=101 → 4xx");
  }

  // Non-existent tour
  {
    const r = await api("GET", "/tours/00000000-0000-0000-0000-000000000000/availability?date=2026-03-15&guests=2");
    assert(r.status === 404 || r.status === 200, "availability nonexistent → 404 or 200 with unavailable");
  }

  // Invalid UUID for tour
  {
    const r = await api("GET", "/tours/bad-uuid/availability?date=2026-03-15&guests=2");
    assert(r.status >= 400 && r.status < 500, "availability bad uuid → 4xx");
  }
}

// ═══════════════════════════════════════════════════════════════
// 10. TOUR IMAGES — POST /tours/:tourId/images & GET /media/tour/:id
// ═══════════════════════════════════════════════════════════════

async function testTourImages(token: string, tourId: string): Promise<void> {
  section("10. TOUR IMAGES — Upload & Get");

  // GET tour images (should work without auth)
  {
    const r = await api("GET", `/media/tour/${tourId}`);
    assertEq(r.status, 200, "GET /media/tour/:id → 200");
    assert(Array.isArray(r.body?.data), "GET tour images → array");
  }

  // GET images with bad entity type
  {
    const r = await api("GET", `/media/invalid_type/${tourId}`);
    // Could be 400 or 200 with empty array
    assert(r.status !== 500, "GET /media/invalid_type/:id → no 500");
  }

  // GET images with invalid UUID
  {
    const r = await api("GET", "/media/tour/not-a-uuid");
    assert(r.status !== 500, "GET /media/tour/bad-uuid → no 500");
  }

  // Upload without auth → 401
  {
    // We need to send a multipart request; use raw approach
    const boundary = "----TestBoundary";
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="test.jpg"',
      "Content-Type: image/jpeg",
      "",
      "fake-image-data",
      `--${boundary}--`,
    ].join("\r\n");

    const r = await api("POST", `/tours/${tourId}/images`, {
      rawBody: body,
      contentType: `multipart/form-data; boundary=${boundary}`,
    });
    assertEq(r.status, 401, "Upload tour image no auth → 401");
  }

  // Upload with auth but no file (empty multipart) → should be some error but not 500
  {
    const boundary = "----TestBoundary2";
    const body = `--${boundary}--\r\n`;

    const r = await api("POST", `/tours/${tourId}/images`, {
      rawBody: body,
      contentType: `multipart/form-data; boundary=${boundary}`,
      token,
    });
    assert(r.status !== 500, "Upload tour image empty → no 500");
  }
}

// ═══════════════════════════════════════════════════════════════
// 11. CSRF PROTECTION
// ═══════════════════════════════════════════════════════════════

async function testCsrfProtection(token: string): Promise<void> {
  section("11. CSRF PROTECTION");

  // POST without CSRF token
  {
    const r = await api("POST", "/tours", {
      body: { title: "CSRF Test", price: 10 },
      token,
      skipCsrf: true,
    });
    assertEq(r.status, 403, "POST /tours no CSRF → 403");
  }

  // PATCH without CSRF token
  {
    const r = await api("PATCH", "/tours/00000000-0000-0000-0000-000000000000", {
      body: { title: "CSRF" },
      token,
      skipCsrf: true,
    });
    assertEq(r.status, 403, "PATCH /tours no CSRF → 403");
  }

  // DELETE without CSRF token
  {
    const r = await api("DELETE", "/tours/00000000-0000-0000-0000-000000000000", {
      token,
      skipCsrf: true,
    });
    assertEq(r.status, 403, "DELETE /tours no CSRF → 403");
  }

  // Invalid CSRF token
  {
    const r = await fetch(`${BASE_URL}/tours`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-CSRF-Token": "totally-invalid-csrf-token",
        "Cookie": csrfCookie,
      },
      body: JSON.stringify({ title: "CSRF Test", price: 10 }),
    });
    const body = await r.json().catch(() => null);
    assertEq(r.status, 403, "POST /tours invalid CSRF → 403");
  }

  // GET requests should work WITHOUT CSRF
  {
    const r = await fetch(`${BASE_URL}/tours`, { method: "GET" });
    const body = await r.json();
    assertEq(r.status, 200, "GET /tours no CSRF → 200");
  }
}

// ═══════════════════════════════════════════════════════════════
// 12. ERROR RESPONSE SHAPES
// ═══════════════════════════════════════════════════════════════

async function testErrorResponseShapes(token: string): Promise<void> {
  section("12. ERROR RESPONSE SHAPES");

  // 401 error shape
  {
    const r = await api("POST", "/tours", { body: { title: "Test", price: 10 } });
    assertErrorShape(r, "401 (no auth)");
  }

  // 404 error shape
  {
    const r = await api("GET", "/tours/00000000-0000-0000-0000-000000000000");
    assertErrorShape(r, "404 (not found)");
  }

  // 4xx validation error shape
  {
    const r = await api("POST", "/tours", { body: { price: 10 }, token });
    assertErrorShape(r, "4xx (validation)");
  }

  // 403 CSRF error shape
  {
    const r = await api("POST", "/tours", {
      body: { title: "Test", price: 10 },
      token,
      skipCsrf: true,
    });
    assertErrorShape(r, "403 (CSRF)");
  }

  // Verify no data leaks on 401
  {
    const r = await api("GET", "/me/tours");
    assertErrorShape(r, "401 no data leak");
    assert(r.body?.data === undefined, "401: no data field present");
  }
}

// ═══════════════════════════════════════════════════════════════
// 13. INJECTION ATTACKS (expanded)
// ═══════════════════════════════════════════════════════════════

async function testInjectionAttacks(token: string): Promise<void> {
  section("13. INJECTION & ABUSE ATTACKS");

  // SQL injection via search query params
  {
    const injections = [
      "' OR 1=1 --",
      "' UNION SELECT * FROM users --",
      "'; DROP TABLE tours; --",
      "1; SELECT * FROM users",
    ];
    for (const sqli of injections) {
      const r = await api("GET", `/tours?search=${encodeURIComponent(sqli)}`);
      assertEq(r.status, 200, `search sqli: ${sqli.slice(0, 30)} → 200 (safe)`);
      assert(!JSON.stringify(r.body).includes("SELECT"), `search sqli no SQL leak: ${sqli.slice(0, 20)}`);
    }
  }

  // XSS stored in tour fields
  {
    const xssPayloads = [
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      '"><script>alert(document.cookie)</script>',
    ];
    for (const xss of xssPayloads) {
      const r = await api("POST", "/tours", {
        body: { title: `XSS ${xss}`.slice(0, 200), price: 10 },
        token,
      });
      assert(r.status !== 500, `XSS in title: ${xss.slice(0, 30)} → no 500`);
      if (r.status === 201) createdTourIds.push(r.body.data.id);
    }
  }

  // Unicode edge cases
  {
    const unicodeCases = [
      "Tour with \u200B zero-width space",
      "Tour with \u202E RTL override",
      "Tour with 日本語 CJK",
      "Tour with 🏔️🗺️ emoji",
      "Tour with \0 null byte",
    ];
    for (const uc of unicodeCases) {
      const r = await api("POST", "/tours", {
        body: { title: uc.slice(0, 200), price: 10 },
        token,
      });
      assert(r.status !== 500, `Unicode: ${uc.slice(0, 30)} → no 500`);
      if (r.status === 201) createdTourIds.push(r.body.data.id);
    }
  }

  // Huge payload
  {
    const r = await api("POST", "/tours", {
      body: { title: "a".repeat(200), price: 10, summary: "b".repeat(1000) },
      token,
    });
    assert(r.status !== 500, "Large but valid payload → no 500");
    if (r.status === 201) createdTourIds.push(r.body.data.id);
  }

  // Deeply nested JSON
  {
    let nested: any = { title: "Deep", price: 10 };
    for (let i = 0; i < 50; i++) {
      nested = { wrapper: nested };
    }
    const r = await api("POST", "/tours", { body: nested, token });
    assert(r.status >= 400 && r.status < 500, "Deeply nested JSON → 4xx (validation)");
  }

  // CRLF injection in search
  {
    const r = await api("GET", `/tours?search=${encodeURIComponent("test\r\nInjected-Header: true")}`);
    assert(r.status !== 500, "CRLF injection in search → no 500");
  }
}

// ═══════════════════════════════════════════════════════════════
// 14. RACE CONDITIONS
// ═══════════════════════════════════════════════════════════════

async function testRaceConditions(token: string): Promise<void> {
  section("14. RACE CONDITIONS");

  // Concurrent update and delete on same tour
  {
    const tour = await createTourAs(token, { title: "Race Test Tour" });

    const [updateRes, deleteRes] = await Promise.all([
      api("PATCH", `/tours/${tour.id}`, { body: { title: "Updated Race" }, token }),
      api("DELETE", `/tours/${tour.id}`, { token }),
    ]);

    // Both should succeed or one gets a 404 — no 500s
    assert(updateRes.status !== 500, "Race: concurrent update → no 500");
    assert(deleteRes.status !== 500, "Race: concurrent delete → no 500");
  }

  // Concurrent tour creation (should all succeed — no unique constraint)
  {
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        api("POST", "/tours", {
          body: { title: `Race Tour ${i}`, price: i * 10 + 1 },
          token,
        })
      )
    );

    const successes = results.filter((r) => r.status === 201);
    assert(successes.length === 5, `Race: 5 concurrent creates → ${successes.length}/5 succeeded`);
    for (const s of successes) {
      createdTourIds.push(s.body.data.id);
    }

    const errors = results.filter((r) => r.status === 500);
    assertEq(errors.length, 0, "Race: no 500 errors in concurrent creates");
  }
}

// ═══════════════════════════════════════════════════════════════
// 15. CONTENT-TYPE ATTACKS
// ═══════════════════════════════════════════════════════════════

async function testContentTypeAttacks(token: string): Promise<void> {
  section("15. CONTENT-TYPE ATTACKS");

  // Wrong content-type (text/plain)
  {
    const r = await api("POST", "/tours", {
      rawBody: JSON.stringify({ title: "Test", price: 10 }),
      contentType: "text/plain",
      token,
    });
    // May reject or try to parse — either way, no 500
    assert(r.status !== 500, "POST /tours Content-Type: text/plain → no 500");
  }

  // No content-type
  {
    const r = await api("POST", "/tours", {
      rawBody: JSON.stringify({ title: "Test", price: 10 }),
      contentType: "",
      token,
    });
    assert(r.status !== 500, "POST /tours no Content-Type → no 500");
  }

  // XML content-type
  {
    const r = await api("POST", "/tours", {
      rawBody: "<tour><title>Test</title><price>10</price></tour>",
      contentType: "application/xml",
      token,
    });
    assert(r.status !== 500, "POST /tours Content-Type: xml → no 500");
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  console.log(`\n🔍 Bug Hunt: Tours Endpoints (10 endpoints)`);
  console.log(`${"═".repeat(60)}`);
  console.log(`Test prefix: ${TEST_PREFIX}\n`);

  try {
    await fetchCsrf();

    // Create test users
    console.log("Setting up test users...");
    const userA = await createVerifiedUser("tourA");
    const userB = await createVerifiedUser("tourB");
    console.log(`  User A: ${userA.userId}`);
    console.log(`  User B: ${userB.userId}`);

    // Create a reference tour for tests
    const referenceTour = await createTourAs(userA.token, {
      title: `${TEST_PREFIX} Reference Tour`,
      city: "Tbilisi",
    });

    // Run all test categories
    await testCreateTourValidation(userA.token);
    await testUpdateTourValidation(userA.token, referenceTour.id);
    await testListAllToursValidation();
    await testGetTourByIdValidation(referenceTour.id);
    await testAuthentication();
    await testAuthorization(userA, userB);
    await testBusinessLogic(userA.token);
    await testRelatedTours(userA.token);
    await testAvailability(userA.token);
    await testTourImages(userA.token, referenceTour.id);
    await testCsrfProtection(userA.token);
    await testErrorResponseShapes(userA.token);
    await testInjectionAttacks(userA.token);
    await testRaceConditions(userA.token);
    await testContentTypeAttacks(userA.token);
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
