/**
 * Exhaustive API bug-hunting tests for the Guides endpoints.
 *
 * Endpoints tested:
 *   GET    /guides           — List all guides (public, paginated, filterable)
 *   GET    /guides/my        — Get current user's guide profile (auth)
 *   GET    /guides/:id       — Get guide by ID (public)
 *   PATCH  /guides/:id       — Update guide (auth, ownership)
 *   DELETE /guides/:id       — Delete guide (auth, ownership)
 *   GET    /guides/:id/photos      — Get guide photos (public)
 *   POST   /guides/:id/photos      — Upload guide photos (auth, ownership)
 *   DELETE /guides/:id/photos/:photoId — Delete guide photo (auth, ownership)
 *
 * Categories: input validation, authentication, authorization, business logic,
 *             injection attacks, pagination, error shape, race conditions, CSRF.
 *
 * Run: npx tsx src/tests/guides-hunt.test.ts
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
    formData?: FormData;
  } = {}
): Promise<{ status: number; body: any; headers: Headers }> {
  // Only set Content-Type: application/json when we actually have a JSON body
  const hasJsonBody = opts.body !== undefined || opts.rawBody !== undefined;
  const headers: Record<string, string> = {
    ...(hasJsonBody && !opts.formData ? { "Content-Type": "application/json" } : {}),
    ...opts.headers,
  };

  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;

  // CSRF for state-changing methods
  if (
    !opts.skipCsrf &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())
  ) {
    if (!csrfToken) await fetchCsrf();
    headers["X-CSRF-Token"] = csrfToken;
    if (csrfCookie) headers["Cookie"] = csrfCookie;
  }

  const fetchOpts: RequestInit = { method, headers };

  if (opts.formData) {
    fetchOpts.body = opts.formData;
  } else if (opts.rawBody !== undefined) {
    fetchOpts.body = opts.rawBody;
  } else if (opts.body !== undefined) {
    fetchOpts.body = JSON.stringify(opts.body);
  }

  const res = await fetch(`${BASE_URL}${path}`, fetchOpts);

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

/** Create a verified user directly via Prisma + JWT (no API calls, avoids rate limits). */
async function createVerifiedUser(
  suffix: string
): Promise<{
  token: string;
  refreshToken: string;
  userId: string;
  email: string;
}> {
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
): Promise<{
  token: string;
  refreshToken: string;
  userId: string;
  email: string;
}> {
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

/** Create a verified user with the GUIDE role and a guide profile directly via Prisma. */
async function createGuideUser(
  suffix: string
): Promise<{
  token: string;
  refreshToken: string;
  userId: string;
  email: string;
  guideId: string;
}> {
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
          data: [{ role: "USER" }, { role: "GUIDE" }],
        },
      },
    },
  });
  createdUserIds.push(user.id);

  // Create guide profile
  const guide = await prisma.guide.create({
    data: {
      userId: user.id,
      bio: `Test guide bio for ${suffix}`,
      languages: ["English", "Georgian"],
      yearsOfExperience: 5,
      phoneNumber: "+995555000001",
    },
  });

  const accessToken = jwt.sign(
    { userId: user.id, roles: ["USER", "GUIDE"], tokenVersion: user.tokenVersion, emailVerified: true },
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

  return {
    token: accessToken,
    refreshToken,
    userId: user.id,
    email,
    guideId: guide.id,
  };
}

// ─── Error shape checker ────────────────────────────────────

function assertErrorShape(res: { status: number; body: any }, label: string): void {
  assertEq(res.body?.success, false, `${label}: success is false`);
  assert(
    typeof res.body?.error?.code === "string",
    `${label}: has string error.code`
  );
  assert(
    typeof res.body?.error?.message === "string",
    `${label}: has string error.message`
  );
  const bodyStr = JSON.stringify(res.body);
  assert(!bodyStr.includes("stack"), `${label}: no stack trace leaked`);
  assert(
    !bodyStr.toLowerCase().includes("prisma"),
    `${label}: no Prisma leak`
  );
  assert(
    !bodyStr.includes("node_modules"),
    `${label}: no node_modules path leaked`
  );
  assert(!bodyStr.includes("SELECT"), `${label}: no SQL leaked`);
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
      await prisma.inquiryResponse.deleteMany({
        where: { recipientId: userId },
      });
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
        await prisma.driverLocation.deleteMany({
          where: { driverId: driver.id },
        });
        await prisma.driver.delete({ where: { userId } });
      }
      const company = await prisma.company.findUnique({ where: { userId } });
      if (company) {
        const tours = await prisma.tour.findMany({
          where: { companyId: company.id },
        });
        for (const tour of tours) {
          await prisma.media.deleteMany({ where: { entityId: tour.id } });
          await prisma.tourItineraryStep.deleteMany({
            where: { tourId: tour.id },
          });
          await prisma.booking.deleteMany({ where: { entityId: tour.id } });
          await prisma.review.deleteMany({ where: { targetId: tour.id } });
          await prisma.favorite.deleteMany({ where: { entityId: tour.id } });
        }
        await prisma.tour.deleteMany({ where: { companyId: company.id } });
        await prisma.media.deleteMany({ where: { entityId: company.id } });
        await prisma.company.delete({ where: { userId } });
      }

      const ownTours = await prisma.tour.findMany({
        where: { ownerId: userId },
      });
      for (const tour of ownTours) {
        await prisma.media.deleteMany({ where: { entityId: tour.id } });
        await prisma.tourItineraryStep.deleteMany({
          where: { tourId: tour.id },
        });
        await prisma.booking.deleteMany({ where: { entityId: tour.id } });
        await prisma.review.deleteMany({ where: { targetId: tour.id } });
        await prisma.favorite.deleteMany({ where: { entityId: tour.id } });
        await prisma.tour.delete({ where: { id: tour.id } });
      }

      await prisma.userSession.deleteMany({ where: { userId } });
      await prisma.userRoleAssignment.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    } catch (err) {
      console.log(
        `  ⚠️  Cleanup error for user ${userId}: ${(err as Error).message}`
      );
    }
  }

  await prisma.$disconnect();
  console.log("  Done.");
}

// ═══════════════════════════════════════════════════════════════
// 1. INPUT VALIDATION
// ═══════════════════════════════════════════════════════════════

async function testInputValidation(
  guideUser: { token: string; guideId: string }
): Promise<void> {
  section("1. INPUT VALIDATION");

  // --- GET /guides (list) query params ---
  console.log("\n  --- GET /guides query param validation ---");

  {
    const r = await api("GET", "/guides?page=0");
    assert(r.status >= 400 && r.status < 500, "GET /guides page=0 → 4xx");
  }
  {
    const r = await api("GET", "/guides?page=-1");
    assert(r.status >= 400 && r.status < 500, "GET /guides page=-1 → 4xx");
  }
  {
    const r = await api("GET", "/guides?page=abc");
    assert(r.status >= 400 && r.status < 500, "GET /guides page=abc → 4xx");
  }
  {
    const r = await api("GET", "/guides?page=1.5");
    assert(r.status >= 400 && r.status < 500, "GET /guides page=1.5 → 4xx");
  }
  {
    const r = await api("GET", "/guides?limit=0");
    assert(r.status >= 400 && r.status < 500, "GET /guides limit=0 → 4xx");
  }
  {
    const r = await api("GET", "/guides?limit=-1");
    assert(r.status >= 400 && r.status < 500, "GET /guides limit=-1 → 4xx");
  }
  {
    const r = await api("GET", "/guides?limit=101");
    assert(r.status >= 400 && r.status < 500, "GET /guides limit=101 → 4xx");
  }
  {
    const r = await api("GET", "/guides?limit=abc");
    assert(r.status >= 400 && r.status < 500, "GET /guides limit=abc → 4xx");
  }
  {
    // Very large page → should return empty items, no 500
    const r = await api("GET", "/guides?page=99999");
    assert(r.status === 200, "GET /guides page=99999 → 200");
    assertEq(r.body?.data?.items?.length, 0, "page=99999 returns 0 items");
  }

  // locationId filter - invalid UUID
  {
    const r = await api("GET", "/guides?locationId=not-a-uuid");
    assert(r.status >= 400 && r.status < 500, "GET /guides locationId=not-a-uuid → 4xx");
  }

  // sortBy - invalid value
  {
    const r = await api("GET", "/guides?sortBy=invalid_sort");
    assert(r.status >= 400 && r.status < 500, "GET /guides sortBy=invalid → 4xx");
  }

  // minExperience - negative
  {
    const r = await api("GET", "/guides?minExperience=-1");
    assert(r.status >= 400 && r.status < 500, "GET /guides minExperience=-1 → 4xx");
  }

  // minRating - out of range
  {
    const r = await api("GET", "/guides?minRating=6");
    assert(r.status >= 400 && r.status < 500, "GET /guides minRating=6 → 4xx");
  }

  // search - 201+ char string
  {
    const longSearch = "a".repeat(201);
    const r = await api("GET", `/guides?search=${longSearch}`);
    assert(r.status >= 400 && r.status < 500, "GET /guides search 201 chars → 4xx");
  }

  // --- GET /guides/:id param validation ---
  console.log("\n  --- GET /guides/:id param validation ---");

  {
    const r = await api("GET", "/guides/not-a-uuid");
    assert(r.status >= 400 && r.status < 500, "GET /guides/not-a-uuid → 4xx");
  }
  {
    const r = await api("GET", "/guides/12345");
    assert(r.status >= 400 && r.status < 500, "GET /guides/12345 → 4xx");
  }
  {
    const r = await api("GET", "/guides/' OR 1=1 --");
    assert(r.status >= 400 && r.status < 500, "GET /guides/SQL-injection-id → 4xx");
  }
  {
    // Valid UUID but non-existent
    const r = await api("GET", "/guides/00000000-0000-0000-0000-000000000000");
    assertEq(r.status, 404, "GET /guides/non-existent-uuid → 404");
  }

  // --- PATCH /guides/:id body validation ---
  console.log("\n  --- PATCH /guides/:id body validation ---");

  const t = guideUser.token;
  const gid = guideUser.guideId;

  // Empty body is OK (no required fields) - should succeed or at least not 500
  {
    const r = await api("PATCH", `/guides/${gid}`, { token: t, body: {} });
    assert(r.status < 500, "PATCH empty body → no 500");
  }

  // bio too long
  {
    const r = await api("PATCH", `/guides/${gid}`, {
      token: t,
      body: { bio: "x".repeat(2001) },
    });
    assert(r.status >= 400 && r.status < 500, "PATCH bio 2001 chars → 4xx");
  }

  // yearsOfExperience wrong type
  {
    const r = await api("PATCH", `/guides/${gid}`, {
      token: t,
      body: { yearsOfExperience: "not a number" },
    });
    assert(r.status >= 400 && r.status < 500, "PATCH yearsOfExperience=string → 4xx");
  }
  {
    const r = await api("PATCH", `/guides/${gid}`, {
      token: t,
      body: { yearsOfExperience: -1 },
    });
    assert(r.status >= 400 && r.status < 500, "PATCH yearsOfExperience=-1 → 4xx");
  }
  {
    const r = await api("PATCH", `/guides/${gid}`, {
      token: t,
      body: { yearsOfExperience: 71 },
    });
    assert(r.status >= 400 && r.status < 500, "PATCH yearsOfExperience=71 → 4xx");
  }
  {
    const r = await api("PATCH", `/guides/${gid}`, {
      token: t,
      body: { yearsOfExperience: 1.5 },
    });
    assert(r.status >= 400 && r.status < 500, "PATCH yearsOfExperience=1.5 (float) → 4xx");
  }

  // languages - not an array
  {
    const r = await api("PATCH", `/guides/${gid}`, {
      token: t,
      body: { languages: "English" },
    });
    assert(r.status >= 400 && r.status < 500, "PATCH languages=string → 4xx");
  }
  // languages array item too short
  {
    const r = await api("PATCH", `/guides/${gid}`, {
      token: t,
      body: { languages: ["a"] },
    });
    assert(r.status >= 400 && r.status < 500, "PATCH languages=['a'] (< 2 chars) → 4xx");
  }
  // languages array item too long
  {
    const r = await api("PATCH", `/guides/${gid}`, {
      token: t,
      body: { languages: ["a".repeat(51)] },
    });
    assert(r.status >= 400 && r.status < 500, "PATCH languages=[51-char string] → 4xx");
  }

  // photoUrl invalid URL
  {
    const r = await api("PATCH", `/guides/${gid}`, {
      token: t,
      body: { photoUrl: "not-a-url" },
    });
    assert(r.status >= 400 && r.status < 500, "PATCH photoUrl=invalid → 4xx");
  }
  // photoUrl too long
  {
    const r = await api("PATCH", `/guides/${gid}`, {
      token: t,
      body: { photoUrl: "https://example.com/" + "a".repeat(500) },
    });
    assert(r.status >= 400 && r.status < 500, "PATCH photoUrl > 512 chars → 4xx");
  }

  // phoneNumber too long
  {
    const r = await api("PATCH", `/guides/${gid}`, {
      token: t,
      body: { phoneNumber: "+".padEnd(22, "9") },
    });
    assert(r.status >= 400 && r.status < 500, "PATCH phoneNumber > 20 chars → 4xx");
  }

  // locationIds - non-UUID in array
  {
    const r = await api("PATCH", `/guides/${gid}`, {
      token: t,
      body: { locationIds: ["not-uuid"] },
    });
    assert(r.status >= 400 && r.status < 500, "PATCH locationIds=['not-uuid'] → 4xx");
  }

  // Invalid PATCH ID param
  {
    const r = await api("PATCH", "/guides/not-a-uuid", {
      token: t,
      body: { bio: "test" },
    });
    assert(r.status >= 400 && r.status < 500, "PATCH /guides/not-a-uuid → 4xx");
  }

  // Malformed JSON body
  {
    const r = await api("PATCH", `/guides/${gid}`, {
      token: t,
      rawBody: "{bio: invalid json",
      headers: { "Content-Type": "application/json" },
    });
    assert(r.status >= 400 && r.status < 500, "PATCH malformed JSON → 4xx");
  }

  // DELETE - invalid UUID param
  {
    const r = await api("DELETE", "/guides/not-a-uuid", { token: t });
    assert(r.status >= 400 && r.status < 500, "DELETE /guides/not-a-uuid → 4xx");
  }

  // --- Photo endpoints param validation ---
  console.log("\n  --- Photo endpoint param validation ---");

  {
    const r = await api("GET", "/guides/not-a-uuid/photos");
    assert(r.status >= 400 && r.status < 500, "GET /guides/bad-id/photos → 4xx");
  }
  {
    const r = await api("DELETE", `/guides/${gid}/photos/not-a-uuid`, {
      token: t,
    });
    assert(r.status >= 400 && r.status < 500, "DELETE photo bad photoId → 4xx");
  }
  {
    const r = await api("DELETE", "/guides/not-a-uuid/photos/not-a-uuid", {
      token: t,
    });
    assert(r.status >= 400 && r.status < 500, "DELETE photo bad both ids → 4xx");
  }
}

// ═══════════════════════════════════════════════════════════════
// 2. AUTHENTICATION
// ═══════════════════════════════════════════════════════════════

async function testAuthentication(
  guideUser: { token: string; guideId: string }
): Promise<void> {
  section("2. AUTHENTICATION");

  const protectedEndpoints: Array<{
    method: string;
    path: string;
    body?: unknown;
  }> = [
    { method: "GET", path: "/guides/my" },
    {
      method: "PATCH",
      path: `/guides/${guideUser.guideId}`,
      body: { bio: "test" },
    },
    { method: "DELETE", path: `/guides/${guideUser.guideId}` },
    { method: "POST", path: `/guides/${guideUser.guideId}/photos` },
    {
      method: "DELETE",
      path: `/guides/${guideUser.guideId}/photos/00000000-0000-0000-0000-000000000000`,
    },
  ];

  for (const ep of protectedEndpoints) {
    const label = `${ep.method} ${ep.path}`;

    // No auth header
    {
      const r = await api(ep.method, ep.path, { body: ep.body });
      assertEq(r.status, 401, `${label}: no auth → 401`);
      assertEq(
        r.body?.error?.code,
        "NO_AUTH_HEADER",
        `${label}: no auth code`
      );
    }

    // Empty auth header
    {
      const r = await api(ep.method, ep.path, {
        body: ep.body,
        headers: { Authorization: "" },
      });
      assertEq(r.status, 401, `${label}: empty auth → 401`);
    }

    // No Bearer prefix
    {
      const r = await api(ep.method, ep.path, {
        body: ep.body,
        headers: { Authorization: guideUser.token },
      });
      assertEq(r.status, 401, `${label}: no Bearer prefix → 401`);
      assertEq(
        r.body?.error?.code,
        "INVALID_AUTH_FORMAT",
        `${label}: invalid format code`
      );
    }

    // Random string as token
    {
      const r = await api(ep.method, ep.path, {
        body: ep.body,
        token: "random-invalid-token-string",
      });
      assertEq(r.status, 401, `${label}: random token → 401`);
      assertEq(
        r.body?.error?.code,
        "INVALID_TOKEN",
        `${label}: invalid token code`
      );
    }

    // Bearer with no token after space
    {
      const r = await api(ep.method, ep.path, {
        body: ep.body,
        headers: { Authorization: "Bearer " },
      });
      assertEq(r.status, 401, `${label}: Bearer-space-empty → 401`);
    }
  }

  // Unverified email on protected routes
  console.log("\n  --- Unverified email on protected routes ---");
  {
    const unverified = await createUnverifiedUser("guide_unverified");

    const r = await api("GET", "/guides/my", {
      token: unverified.token,
    });
    assertEq(r.status, 403, "GET /guides/my unverified → 403");
    assertEq(
      r.body?.error?.code,
      "EMAIL_NOT_VERIFIED",
      "unverified email code"
    );
  }

  // Token for deactivated user
  console.log("\n  --- Deactivated user ---");
  {
    const deactUser = await createVerifiedUser("guide_deactivated");
    await prisma.user.update({
      where: { id: deactUser.userId },
      data: { isActive: false },
    });

    const r = await api("GET", "/guides/my", { token: deactUser.token });
    assertEq(r.status, 401, "GET /guides/my deactivated → 401");
    assertEq(
      r.body?.error?.code,
      "ACCOUNT_DEACTIVATED",
      "deactivated account code"
    );

    // Re-activate for cleanup
    await prisma.user.update({
      where: { id: deactUser.userId },
      data: { isActive: true },
    });
  }

  // Token with stale tokenVersion
  console.log("\n  --- Stale tokenVersion ---");
  {
    const staleUser = await createVerifiedUser("guide_stale_tv");
    await prisma.user.update({
      where: { id: staleUser.userId },
      data: { tokenVersion: { increment: 1 } },
    });

    const r = await api("GET", "/guides/my", { token: staleUser.token });
    assertEq(r.status, 401, "GET /guides/my stale tokenVersion → 401");
    assertEq(
      r.body?.error?.code,
      "SESSION_INVALIDATED",
      "stale tokenVersion code"
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// 3. AUTHORIZATION (cross-user access, privilege escalation)
// ═══════════════════════════════════════════════════════════════

async function testAuthorization(
  guideA: { token: string; guideId: string; userId: string },
  guideB: { token: string; guideId: string; userId: string },
  regularUser: { token: string; userId: string }
): Promise<void> {
  section("3. AUTHORIZATION");

  // --- Cross-user PATCH ---
  console.log("\n  --- Cross-user update ---");
  {
    const r = await api("PATCH", `/guides/${guideA.guideId}`, {
      token: guideB.token,
      body: { bio: "hacked by guide B" },
    });
    assertEq(r.status, 403, "Guide B PATCH Guide A → 403");
  }

  // --- Cross-user DELETE ---
  {
    const r = await api("DELETE", `/guides/${guideA.guideId}`, {
      token: guideB.token,
    });
    assertEq(r.status, 403, "Guide B DELETE Guide A → 403");
  }

  // --- Regular user (no GUIDE role) trying to update ---
  {
    const r = await api("PATCH", `/guides/${guideA.guideId}`, {
      token: regularUser.token,
      body: { bio: "regular user hack" },
    });
    assertEq(r.status, 403, "Regular user PATCH guide → 403");
  }

  // --- Regular user trying to delete ---
  {
    const r = await api("DELETE", `/guides/${guideA.guideId}`, {
      token: regularUser.token,
    });
    assertEq(r.status, 403, "Regular user DELETE guide → 403");
  }

  // --- PATCH non-existent guide ID (valid UUID) ---
  {
    const r = await api(
      "PATCH",
      "/guides/00000000-0000-0000-0000-000000000000",
      {
        token: guideA.token,
        body: { bio: "ghost" },
      }
    );
    assertEq(r.status, 404, "PATCH non-existent guide → 404");
  }

  // --- DELETE non-existent guide ---
  {
    const r = await api(
      "DELETE",
      "/guides/00000000-0000-0000-0000-000000000000",
      {
        token: guideA.token,
      }
    );
    assertEq(r.status, 404, "DELETE non-existent guide → 404");
  }

  // --- Privilege escalation: non-admin setting isVerified ---
  console.log("\n  --- Privilege escalation: isVerified ---");
  {
    const r = await api("PATCH", `/guides/${guideA.guideId}`, {
      token: guideA.token,
      body: { isVerified: true },
    });
    // Should succeed but NOT set isVerified (stripped for non-admins)
    assert(r.status === 200, "Non-admin PATCH isVerified → 200 (field stripped)");

    // Verify isVerified was NOT changed
    const check = await api("GET", `/guides/${guideA.guideId}`);
    assertEq(
      check.body?.data?.isVerified,
      false,
      "isVerified remains false for non-admin"
    );
  }

  // --- Extra unexpected fields in PATCH body ---
  {
    const r = await api("PATCH", `/guides/${guideA.guideId}`, {
      token: guideA.token,
      body: {
        bio: "normal update",
        role: "ADMIN",
        isAdmin: true,
        userId: "00000000-0000-0000-0000-000000000000",
      },
    });
    // Should not 500, and extra fields should be ignored
    assert(r.status < 500, "Extra fields in PATCH body → no 500");
  }

  // --- GET /guides/my for user with no guide profile ---
  {
    const r = await api("GET", "/guides/my", { token: regularUser.token });
    assertEq(r.status, 404, "GET /guides/my non-guide user → 404");
    assertEq(
      r.body?.error?.code,
      "GUIDE_NOT_FOUND",
      "non-guide user code = GUIDE_NOT_FOUND"
    );
  }

  // --- Photo upload to someone else's guide ---
  console.log("\n  --- Photo upload authorization ---");
  {
    const formData = new FormData();
    // Create a minimal valid JPEG (SOI + EOI markers)
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0xff, 0xd9]);
    const blob = new Blob([jpegBytes], { type: "image/jpeg" });
    formData.append("photos", blob, "test.jpg");

    const r = await api("POST", `/guides/${guideA.guideId}/photos`, {
      token: guideB.token,
      formData,
    });
    assertEq(r.status, 403, "Upload photos to other guide → 403");
  }
}

// ═══════════════════════════════════════════════════════════════
// 4. BUSINESS LOGIC
// ═══════════════════════════════════════════════════════════════

async function testBusinessLogic(
  guideUser: { token: string; guideId: string; userId: string }
): Promise<void> {
  section("4. BUSINESS LOGIC");

  // --- Valid update ---
  console.log("\n  --- Valid guide update ---");
  {
    const r = await api("PATCH", `/guides/${guideUser.guideId}`, {
      token: guideUser.token,
      body: {
        bio: "Updated bio for testing",
        languages: ["English", "French", "Georgian"],
        yearsOfExperience: 10,
        isAvailable: false,
      },
    });
    assertEq(r.status, 200, "Valid PATCH → 200");
    assertEq(r.body?.data?.bio, "Updated bio for testing", "Bio updated");
    assertEq(
      r.body?.data?.yearsOfExperience,
      10,
      "yearsOfExperience updated"
    );
    assertEq(r.body?.data?.isAvailable, false, "isAvailable updated");
  }

  // --- Restore isAvailable ---
  {
    await api("PATCH", `/guides/${guideUser.guideId}`, {
      token: guideUser.token,
      body: { isAvailable: true },
    });
  }

  // --- GET /guides/my returns correct guide ---
  console.log("\n  --- GET /guides/my ---");
  {
    const r = await api("GET", "/guides/my", { token: guideUser.token });
    assertEq(r.status, 200, "GET /guides/my → 200");
    assertEq(r.body?.data?.id, guideUser.guideId, "Correct guide ID");
    assert(r.body?.data?.user !== undefined, "Includes user object");
    assert(Array.isArray(r.body?.data?.locations), "Includes locations array");
  }

  // --- GET /guides/:id returns correct guide ---
  console.log("\n  --- GET /guides/:id ---");
  {
    const r = await api("GET", `/guides/${guideUser.guideId}`);
    assertEq(r.status, 200, "GET /guides/:id → 200");
    assertEq(r.body?.success, true, "success is true");
    assertEq(r.body?.data?.id, guideUser.guideId, "Correct guide returned");
    assert(r.body?.data?.user?.email !== undefined, "User email included");
    assert(
      r.body?.data?.user?.firstName !== undefined,
      "User firstName included"
    );
  }

  // --- GET /guides list includes our guide ---
  console.log("\n  --- GET /guides list ---");
  {
    // Our guide defaults to isVerified=false, so the public list filter defaults to isVerified=true
    // We need to explicitly pass isVerified=false to find our test guide
    const r = await api("GET", "/guides?isVerified=false&isAvailable=true");
    assertEq(r.status, 200, "GET /guides → 200");
    assert(r.body?.data?.items?.length >= 0, "Returns items array");
    assert(
      r.body?.data?.pagination !== undefined,
      "Returns pagination metadata"
    );
    assert(
      typeof r.body?.data?.pagination?.totalItems === "number",
      "pagination.totalItems is number"
    );
    assert(
      typeof r.body?.data?.pagination?.totalPages === "number",
      "pagination.totalPages is number"
    );
  }

  // --- Get photos for a guide with no photos ---
  console.log("\n  --- GET /guides/:id/photos ---");
  {
    const r = await api("GET", `/guides/${guideUser.guideId}/photos`);
    assertEq(r.status, 200, "GET /guides/:id/photos → 200");
    assert(Array.isArray(r.body?.data), "photos data is array");
  }

  // --- Upload photos without any files ---
  console.log("\n  --- Upload with no files ---");
  {
    const formData = new FormData();
    const r = await api("POST", `/guides/${guideUser.guideId}/photos`, {
      token: guideUser.token,
      formData,
    });
    assertEq(r.status, 400, "POST photos no files → 400");
    assertEq(r.body?.error?.code, "NO_FILES_PROVIDED", "no files code");
  }

  // --- Delete non-existent photo ---
  console.log("\n  --- Delete non-existent photo ---");
  {
    const r = await api(
      "DELETE",
      `/guides/${guideUser.guideId}/photos/00000000-0000-0000-0000-000000000000`,
      { token: guideUser.token }
    );
    assertEq(r.status, 404, "DELETE non-existent photo → 404");
  }

  // --- Set locationIds with invalid location UUID ---
  console.log("\n  --- locationIds with non-existent location ---");
  {
    const r = await api("PATCH", `/guides/${guideUser.guideId}`, {
      token: guideUser.token,
      body: { locationIds: ["00000000-0000-0000-0000-000000000099"] },
    });
    assertEq(r.status, 400, "locationIds with non-existent location → 400");
    assertEq(r.body?.error?.code, "INVALID_LOCATION_IDS", "invalid locationIds error code");
  }

  // --- Empty locationIds to clear all locations ---
  {
    const r = await api("PATCH", `/guides/${guideUser.guideId}`, {
      token: guideUser.token,
      body: { locationIds: [] },
    });
    assert(r.status < 500, "Empty locationIds → no 500");
  }
}

// ═══════════════════════════════════════════════════════════════
// 5. INJECTION & ABUSE
// ═══════════════════════════════════════════════════════════════

async function testInjectionAndAbuse(
  guideUser: { token: string; guideId: string }
): Promise<void> {
  section("5. INJECTION & ABUSE");

  const t = guideUser.token;
  const gid = guideUser.guideId;

  // --- XSS in stored fields ---
  console.log("\n  --- XSS payloads in PATCH ---");
  const xssPayloads = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    '"><script>document.cookie</script>',
  ];

  for (const xss of xssPayloads) {
    const r = await api("PATCH", `/guides/${gid}`, {
      token: t,
      body: { bio: xss },
    });
    // Should either reject or store safely — never 500
    assert(r.status < 500, `PATCH bio XSS "${xss.slice(0, 30)}" → no 500`);
  }

  // --- SQL injection in search ---
  console.log("\n  --- SQL injection in search ---");
  const sqliPayloads = [
    "' OR 1=1 --",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "1; SELECT * FROM information_schema.tables",
  ];

  for (const sqli of sqliPayloads) {
    const r = await api(
      "GET",
      `/guides?search=${encodeURIComponent(sqli)}`
    );
    assert(r.status < 500, `GET /guides search="${sqli.slice(0, 30)}" → no 500`);
    const bodyStr = JSON.stringify(r.body);
    assert(!bodyStr.includes("SELECT"), `search="${sqli.slice(0, 30)}" → no SQL leak`);
  }

  // --- Prototype pollution ---
  console.log("\n  --- Prototype pollution ---");
  {
    const r = await api("PATCH", `/guides/${gid}`, {
      token: t,
      body: {
        __proto__: { admin: true },
        constructor: { prototype: { isAdmin: true } },
        bio: "proto test",
      },
    });
    assert(r.status < 500, "Prototype pollution body → no 500");
  }

  // --- Unicode edge cases ---
  console.log("\n  --- Unicode edge cases ---");
  {
    const r = await api("PATCH", `/guides/${gid}`, {
      token: t,
      body: {
        bio: "Test \u200B zero-width \u202E RTL override \uD83D\uDE00 emoji",
      },
    });
    assert(r.status < 500, "Unicode edge chars → no 500");
  }

  // --- Null bytes ---
  {
    const r = await api("PATCH", `/guides/${gid}`, {
      token: t,
      body: { bio: "test\x00admin" },
    });
    assert(r.status < 500, "Null byte in bio → no 500");
  }

  // --- Very long string ---
  {
    const r = await api("PATCH", `/guides/${gid}`, {
      token: t,
      body: { bio: "A".repeat(10000) },
    });
    assert(r.status >= 400 && r.status < 500, "10K char bio → 4xx");
  }

  // --- Path traversal in ID ---
  {
    const r = await api("GET", "/guides/../../etc/passwd");
    assert(r.status >= 400 && r.status < 500, "Path traversal in ID → 4xx");
  }

  // --- Deeply nested JSON ---
  {
    let nested: any = { bio: "deep" };
    for (let i = 0; i < 50; i++) {
      nested = { inner: nested };
    }
    const r = await api("PATCH", `/guides/${gid}`, {
      token: t,
      body: nested,
    });
    assert(r.status < 500, "50-level nested JSON → no 500");
  }

  // --- Huge array ---
  {
    const r = await api("PATCH", `/guides/${gid}`, {
      token: t,
      body: { languages: Array(10000).fill("English") },
    });
    assert(r.status < 500, "10K languages array → no 500");
  }

  // --- Wrong Content-Type ---
  {
    const r = await api("PATCH", `/guides/${gid}`, {
      token: t,
      rawBody: "bio=test",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    assert(r.status >= 400 && r.status < 500, "Wrong content type → 4xx");
  }

  // --- SQL injection in sortBy ---
  {
    const r = await api("GET", "/guides?sortBy=price%3B+DROP+TABLE+guides");
    assert(r.status >= 400 && r.status < 500, "SQL in sortBy → 4xx");
  }
}

// ═══════════════════════════════════════════════════════════════
// 6. PAGINATION & FILTERING
// ═══════════════════════════════════════════════════════════════

async function testPaginationAndFiltering(): Promise<void> {
  section("6. PAGINATION & FILTERING");

  // --- Basic pagination shape ---
  {
    const r = await api("GET", "/guides?page=1&limit=5");
    assertEq(r.status, 200, "GET /guides p=1 l=5 → 200");
    assert(Array.isArray(r.body?.data?.items), "items is array");
    const p = r.body?.data?.pagination;
    assert(typeof p?.page === "number", "pagination.page is number");
    assert(typeof p?.limit === "number", "pagination.limit is number");
    assert(typeof p?.totalItems === "number", "pagination.totalItems is number");
    assert(typeof p?.totalPages === "number", "pagination.totalPages is number");
    assert(typeof p?.hasNextPage === "boolean", "pagination.hasNextPage is boolean");
    assert(typeof p?.hasPreviousPage === "boolean", "pagination.hasPreviousPage is boolean");
    assertEq(p?.page, 1, "page is 1");
    assertEq(p?.limit, 5, "limit is 5");
    assertEq(p?.hasPreviousPage, false, "page 1 has no previous");
  }

  // --- Defaults ---
  {
    const r = await api("GET", "/guides");
    assertEq(r.status, 200, "GET /guides no params → 200");
    assertEq(r.body?.data?.pagination?.page, 1, "default page=1");
    assertEq(r.body?.data?.pagination?.limit, 10, "default limit=10");
  }

  // --- Filter: isVerified=false ---
  {
    const r = await api("GET", "/guides?isVerified=false");
    assertEq(r.status, 200, "GET /guides isVerified=false → 200");
  }

  // --- Filter: isAvailable=false ---
  {
    const r = await api("GET", "/guides?isAvailable=false");
    assertEq(r.status, 200, "GET /guides isAvailable=false → 200");
  }

  // --- Filter: search ---
  {
    const r = await api("GET", "/guides?search=nonexistentxyz123");
    assertEq(r.status, 200, "GET /guides search=nonexistent → 200");
    assertEq(r.body?.data?.items?.length, 0, "no matches for random search");
  }

  // --- Filter: sortBy ---
  for (const sort of ["newest", "rating", "experience", "price", "price_desc"]) {
    const r = await api("GET", `/guides?sortBy=${sort}`);
    assertEq(r.status, 200, `GET /guides sortBy=${sort} → 200`);
  }

  // --- Filters that match nothing ---
  {
    const r = await api(
      "GET",
      "/guides?minExperience=70&minRating=5&minPrice=999999"
    );
    assertEq(r.status, 200, "GET /guides extreme filters → 200");
    assert(Array.isArray(r.body?.data?.items), "Returns empty items array");
    assertEq(
      r.body?.data?.pagination?.totalItems >= 0,
      true,
      "totalItems >= 0"
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// 7. ERROR RESPONSE SHAPE
// ═══════════════════════════════════════════════════════════════

async function testErrorResponseShape(
  guideUser: { token: string; guideId: string }
): Promise<void> {
  section("7. ERROR RESPONSE SHAPE");

  // 404 - Not found
  {
    const r = await api("GET", "/guides/00000000-0000-0000-0000-000000000000");
    assertErrorShape(r, "404 not found");
    assertEq(r.status, 404, "404 status");
  }

  // 401 - No auth
  {
    const r = await api("GET", "/guides/my");
    assertErrorShape(r, "401 no auth");
    assertEq(r.status, 401, "401 status");
  }

  // 400 - Validation
  {
    const r = await api("GET", "/guides?page=0");
    assertErrorShape(r, "400 validation");
  }

  // 403 - Forbidden (cross-user)
  {
    const other = await createVerifiedUser("shape_other");
    const r = await api("PATCH", `/guides/${guideUser.guideId}`, {
      token: other.token,
      body: { bio: "hack" },
    });
    if (r.status === 403) {
      assertErrorShape(r, "403 forbidden");
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 8. RACE CONDITIONS
// ═══════════════════════════════════════════════════════════════

async function testRaceConditions(
  guideUser: { token: string; guideId: string }
): Promise<void> {
  section("8. RACE CONDITIONS");

  // --- Concurrent updates to the same guide ---
  console.log("\n  --- Concurrent PATCH same guide ---");
  {
    const updates = Array.from({ length: 5 }, (_, i) =>
      api("PATCH", `/guides/${guideUser.guideId}`, {
        token: guideUser.token,
        body: { bio: `Concurrent update ${i}` },
      })
    );

    const results = await Promise.all(updates);
    const successes = results.filter((r) => r.status === 200);
    assert(successes.length >= 1, `Concurrent PATCHes: ${successes.length}/5 succeeded`);

    const errors = results.filter((r) => r.status >= 500);
    assertEq(errors.length, 0, "No 500s during concurrent updates");
  }

  // --- Concurrent reads ---
  console.log("\n  --- Concurrent GETs ---");
  {
    const reads = Array.from({ length: 10 }, () =>
      api("GET", `/guides/${guideUser.guideId}`)
    );

    const results = await Promise.all(reads);
    const allOk = results.every((r) => r.status === 200);
    assert(allOk, "10 concurrent GETs all returned 200");
  }
}

// ═══════════════════════════════════════════════════════════════
// 9. CSRF PROTECTION
// ═══════════════════════════════════════════════════════════════

async function testCsrfProtection(
  guideUser: { token: string; guideId: string }
): Promise<void> {
  section("9. CSRF PROTECTION");

  const t = guideUser.token;
  const gid = guideUser.guideId;

  // --- Missing CSRF token on state-changing requests ---
  {
    const r = await api("PATCH", `/guides/${gid}`, {
      token: t,
      body: { bio: "csrf test" },
      skipCsrf: true,
    });
    assertEq(r.status, 403, "PATCH without CSRF → 403");
  }
  {
    const r = await api("DELETE", `/guides/${gid}`, {
      token: t,
      skipCsrf: true,
    });
    assertEq(r.status, 403, "DELETE without CSRF → 403");
  }

  // --- Invalid CSRF token ---
  {
    const r = await api("PATCH", `/guides/${gid}`, {
      token: t,
      body: { bio: "bad csrf" },
      skipCsrf: true,
      headers: { "X-CSRF-Token": "totally-invalid-token" },
    });
    assertEq(r.status, 403, "PATCH invalid CSRF token → 403");
  }

  // --- GET requests should NOT require CSRF ---
  {
    const r = await api("GET", `/guides/${gid}`);
    assertEq(r.status, 200, "GET without CSRF → 200 (no CSRF needed)");
  }
  {
    const r = await api("GET", "/guides");
    assertEq(r.status, 200, "GET /guides without CSRF → 200");
  }
  {
    const r = await api("GET", `/guides/${gid}/photos`);
    assertEq(r.status, 200, "GET photos without CSRF → 200");
  }
}

// ═══════════════════════════════════════════════════════════════
// 10. DELETE BEHAVIOR (soft delete)
// ═══════════════════════════════════════════════════════════════

async function testDeleteBehavior(): Promise<void> {
  section("10. DELETE BEHAVIOR");

  // Create a guide specifically for deletion testing
  const deleteGuide = await createGuideUser("guide_delete_test");

  // Verify guide exists
  {
    const r = await api("GET", `/guides/${deleteGuide.guideId}`);
    assertEq(r.status, 200, "Guide exists before delete");
  }

  // Delete the guide
  {
    const r = await api("DELETE", `/guides/${deleteGuide.guideId}`, {
      token: deleteGuide.token,
    });
    assertEq(r.status, 200, "DELETE guide → 200");
    assertEq(r.body?.data, null, "DELETE returns null data");
  }

  // Guide should still be accessible by ID (soft delete just sets isAvailable=false)
  {
    const r = await api("GET", `/guides/${deleteGuide.guideId}`);
    assertEq(r.status, 200, "Soft-deleted guide still accessible by ID");
    assertEq(r.body?.data?.isAvailable, false, "isAvailable=false after delete");
  }

  // Soft-deleted guide should not appear in default list (isAvailable=true filter)
  {
    const r = await api("GET", "/guides?isAvailable=true&isVerified=false");
    const items = r.body?.data?.items ?? [];
    const found = items.some((g: any) => g.id === deleteGuide.guideId);
    assertEq(found, false, "Soft-deleted guide not in isAvailable=true list");
  }

  // Double delete should still work (idempotent-ish: already isAvailable=false)
  {
    const r = await api("DELETE", `/guides/${deleteGuide.guideId}`, {
      token: deleteGuide.token,
    });
    assertEq(r.status, 200, "Double delete → 200 (idempotent)");
  }
}

// ═══════════════════════════════════════════════════════════════
// 11. RESPONSE SUCCESS SHAPE
// ═══════════════════════════════════════════════════════════════

async function testSuccessResponseShape(
  guideUser: { token: string; guideId: string }
): Promise<void> {
  section("11. SUCCESS RESPONSE SHAPE");

  // --- GET /guides/:id shape ---
  {
    const r = await api("GET", `/guides/${guideUser.guideId}`);
    assertEq(r.body?.success, true, "GET guide: success is true");
    assert(typeof r.body?.message === "string", "GET guide: message is string");
    assert(r.body?.data !== undefined, "GET guide: data exists");
    assert(typeof r.body?.data?.id === "string", "guide.id is string");
    assert(typeof r.body?.data?.bio === "string" || r.body?.data?.bio === null, "guide.bio is string or null");
    assert(Array.isArray(r.body?.data?.locations), "guide.locations is array");
    assert(r.body?.data?.user !== undefined, "guide.user exists");
    assert(typeof r.body?.data?.user?.id === "string", "guide.user.id is string");
    assert(typeof r.body?.data?.user?.email === "string", "guide.user.email is string");
    assert(typeof r.body?.data?.user?.firstName === "string", "guide.user.firstName");
    assert(typeof r.body?.data?.user?.lastName === "string", "guide.user.lastName");
    // Check no sensitive fields exposed
    assert(r.body?.data?.user?.password === undefined, "No password in response");
    assert(r.body?.data?.user?.tokenVersion === undefined, "No tokenVersion in response");
  }

  // --- GET /guides paginated shape ---
  {
    const r = await api("GET", "/guides?page=1&limit=5");
    assertEq(r.body?.success, true, "GET guides list: success is true");
    assert(typeof r.body?.message === "string", "GET guides list: message is string");
    assert(Array.isArray(r.body?.data?.items), "items is array");
    const p = r.body?.data?.pagination;
    assert(p !== undefined, "pagination object exists");
    assert(typeof p?.page === "number", "p.page");
    assert(typeof p?.limit === "number", "p.limit");
    assert(typeof p?.totalItems === "number", "p.totalItems");
    assert(typeof p?.totalPages === "number", "p.totalPages");
    assert(typeof p?.hasNextPage === "boolean", "p.hasNextPage");
    assert(typeof p?.hasPreviousPage === "boolean", "p.hasPreviousPage");
  }

  // --- PATCH shape ---
  {
    const r = await api("PATCH", `/guides/${guideUser.guideId}`, {
      token: guideUser.token,
      body: { bio: "shape test" },
    });
    assertEq(r.body?.success, true, "PATCH guide: success is true");
    assert(typeof r.body?.message === "string", "PATCH guide: message");
    assert(r.body?.data?.id === guideUser.guideId, "PATCH returns updated guide");
  }

  // --- GET photos shape ---
  {
    const r = await api("GET", `/guides/${guideUser.guideId}/photos`);
    assertEq(r.body?.success, true, "GET photos: success is true");
    assert(typeof r.body?.message === "string", "GET photos: message");
    assert(Array.isArray(r.body?.data), "GET photos: data is array");
  }
}

// ─── Main ────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n🔍 Bug Hunt: Guides Endpoints`);
  console.log(`${"═".repeat(60)}`);
  console.log(`Test prefix: ${TEST_PREFIX}\n`);

  try {
    await fetchCsrf();

    // Create test users
    console.log("Setting up test users...");
    const guideA = await createGuideUser("guideA");
    console.log(`  Guide A: ${guideA.guideId}`);
    const guideB = await createGuideUser("guideB");
    console.log(`  Guide B: ${guideB.guideId}`);
    const regularUser = await createVerifiedUser("regular");
    console.log(`  Regular user: ${regularUser.userId}\n`);

    // Run all test categories
    await testInputValidation(guideA);
    await testAuthentication(guideA);
    await testAuthorization(guideA, guideB, regularUser);
    await testBusinessLogic(guideA);
    await testInjectionAndAbuse(guideA);
    await testPaginationAndFiltering();
    await testErrorResponseShape(guideA);
    await testRaceConditions(guideA);
    await testCsrfProtection(guideA);
    await testDeleteBehavior();
    await testSuccessResponseShape(guideA);
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
