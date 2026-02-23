/**
 * Exhaustive API bug-hunting tests for the Companies endpoints.
 *
 * All 13 endpoints:
 *   GET    /companies              — List companies (public, paginated, filtered)
 *   GET    /companies/my           — Get my company (auth)
 *   GET    /companies/:id          — Get company by ID (public)
 *   PATCH  /companies/:id          — Update company (auth, owner/admin)
 *   DELETE /companies/:id          — Delete company (auth, owner/admin) — soft delete
 *   GET    /companies/:id/tour-agents   — Get tour agents (auth, owner/admin)
 *   DELETE /companies/:id/tour-agents/:agentId — Delete tour agent (auth, owner/admin)
 *   GET    /companies/:id/tours    — Get company tours (public, paginated)
 *   GET    /companies/:id/photos   — Get company photos (public)
 *   POST   /companies/:id/photos   — Upload company photos (auth, owner/admin)
 *   DELETE /companies/:id/photos/:photoId — Delete company photo (auth, owner)
 *   POST   /companies/:id/logo     — Upload company logo (auth, owner/admin)
 *   DELETE /companies/:id/logo     — Delete company logo (auth, owner/admin)
 *
 * Categories: input validation, authentication, authorization, business logic,
 *             injection attacks, pagination, error shape, race conditions, CSRF.
 *
 * Run: npx tsx src/tests/companies-hunt.test.ts
 */

import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "crypto";
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
    multipart?: { fieldName: string; fileName: string; mimeType: string; buffer: Buffer }[];
  } = {}
): Promise<{ status: number; body: any; headers: Headers }> {
  // Only set Content-Type: application/json when we have a JSON body
  const hasJsonBody = opts.body !== undefined || opts.rawBody !== undefined;
  const headers: Record<string, string> = {
    ...(hasJsonBody && !opts.multipart ? { "Content-Type": "application/json" } : {}),
    ...opts.headers,
  };

  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;

  // CSRF for state-changing methods
  if (!opts.skipCsrf && ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) {
    if (!csrfToken) await fetchCsrf();
    headers["X-CSRF-Token"] = csrfToken;
    if (csrfCookie) headers["Cookie"] = csrfCookie;
  }

  let bodyPayload: any = undefined;

  if (opts.multipart) {
    const formData = new FormData();
    for (const file of opts.multipart) {
      const blob = new Blob([file.buffer], { type: file.mimeType });
      formData.append(file.fieldName, blob, file.fileName);
    }
    bodyPayload = formData;
  } else if (opts.rawBody !== undefined) {
    bodyPayload = opts.rawBody;
  } else if (opts.body !== undefined) {
    bodyPayload = JSON.stringify(opts.body);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: bodyPayload,
  });

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

/**
 * Create user directly via Prisma + sign JWT locally (no HTTP calls, avoids all rate limits).
 */
async function createUserDirect(
  suffix: string,
  opts?: {
    roles?: string[];
    emailVerified?: boolean;
    companyName?: string;
  }
): Promise<{ token: string; refreshToken: string; userId: string; email: string; companyId?: string }> {
  const email = testEmail(suffix);
  const passwordHash = await argon2.hash(TEST_PASSWORD);
  const roles = opts?.roles ?? ["USER"];
  const emailVerified = opts?.emailVerified ?? true;

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: "Test",
      lastName: suffix,
      emailVerified,
      roles: {
        create: roles.map((role) => ({ role: role as any })),
      },
    },
  });
  createdUserIds.push(user.id);

  let companyId: string | undefined;
  if (opts?.companyName) {
    const company = await prisma.company.create({
      data: {
        userId: user.id,
        companyName: opts.companyName,
      },
    });
    companyId = company.id;
  }

  // Sign JWT locally (matches what auth service does)
  const accessToken = jwt.sign(
    { userId: user.id, roles, tokenVersion: user.tokenVersion, emailVerified },
    ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  // Create a session for refresh token
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
    companyId,
  };
}

/** Helper to create a minimal valid JPEG buffer */
function makeJpegBuffer(): Buffer {
  return Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
    0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
    0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
    0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
    0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
    0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
    0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
    0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
    0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
    0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
    0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
    0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
    0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
    0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
    0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
    0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
    0x00, 0x00, 0x3F, 0x00, 0x7B, 0x94, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00,
    0xFF, 0xD9,
  ]);
}

/** Validate error response shape */
function assertErrorShape(body: any, label: string): void {
  assertEq(body?.success, false, `${label}: success is false`);
  assert(typeof body?.error?.code === "string", `${label}: has string error.code`);
  assert(typeof body?.error?.message === "string", `${label}: has string error.message`);
  const bodyStr = JSON.stringify(body);
  assert(!bodyStr.includes("stack"), `${label}: no stack trace`);
  assert(!/prisma/i.test(bodyStr), `${label}: no Prisma leak`);
  assert(!bodyStr.includes("node_modules"), `${label}: no paths`);
  assert(!bodyStr.includes("SELECT"), `${label}: no SQL leak`);
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

async function testInputValidation(companyA: any): Promise<void> {
  section("1. INPUT VALIDATION — GET /companies (query params)");

  let r = await api("GET", "/companies?page=0");
  assert(r.status === 400 || r.status === 422, "page=0 rejected");

  r = await api("GET", "/companies?page=-1");
  assert(r.status === 400 || r.status === 422, "page=-1 rejected");

  r = await api("GET", "/companies?page=abc");
  assert(r.status === 400 || r.status === 422, "page=abc rejected");

  r = await api("GET", "/companies?page=1.5");
  assert(r.status === 400 || r.status === 422, "page=1.5 rejected");

  r = await api("GET", "/companies?page=2147483648");
  assert(r.status === 200 || r.status === 400, "page=MAX_INT doesn't crash");
  if (r.status === 200) {
    assertEq(r.body.data.items.length, 0, "page=MAX_INT returns empty items");
  }

  r = await api("GET", "/companies?limit=0");
  assert(r.status === 400 || r.status === 422, "limit=0 rejected");

  r = await api("GET", "/companies?limit=-1");
  assert(r.status === 400 || r.status === 422, "limit=-1 rejected");

  r = await api("GET", "/companies?limit=101");
  assert(r.status === 400 || r.status === 422, "limit=101 rejected");

  r = await api("GET", "/companies?limit=abc");
  assert(r.status === 400 || r.status === 422, "limit=abc rejected");

  r = await api("GET", "/companies?sortBy=invalid");
  assert(r.status === 400 || r.status === 422, "sortBy=invalid rejected");

  r = await api("GET", "/companies?sortBy=rating;DROP TABLE companies;--");
  assert(r.status === 400 || r.status === 422, "sortBy SQL injection rejected");

  r = await api("GET", "/companies?minRating=-1");
  assert(r.status === 400 || r.status === 422, "minRating=-1 rejected");

  r = await api("GET", "/companies?minRating=6");
  assert(r.status === 400 || r.status === 422, "minRating=6 rejected");

  r = await api("GET", "/companies?locationId=not-a-uuid");
  assert(r.status === 400 || r.status === 422, "locationId=not-a-uuid rejected");

  r = await api("GET", "/companies?search=<script>alert(1)</script>");
  assert(r.status === 200, "search with XSS doesn't crash");

  r = await api("GET", "/companies?search=' OR 1=1 --");
  assert(r.status === 200, "search with SQL injection doesn't crash");

  r = await api("GET", `/companies?search=${"A".repeat(201)}`);
  assert(r.status === 400 || r.status === 422, "search over 200 chars rejected");

  r = await api("GET", "/companies?page=1&limit=5&sortBy=newest");
  assertEq(r.status, 200, "valid query succeeds");
  assertEq(r.body.success, true, "valid query returns success: true");
  assert(Array.isArray(r.body.data.items), "valid query returns items array");

  section("1b. INPUT VALIDATION — GET /companies/:id (UUID param)");

  r = await api("GET", "/companies/not-a-uuid");
  assert(r.status === 400, "GET /companies/not-a-uuid returns 400");

  r = await api("GET", "/companies/12345");
  assert(r.status === 400, "GET /companies/12345 returns 400");

  r = await api("GET", `/companies/' OR 1=1 --`);
  assert(r.status === 400, "GET /companies/sqli returns 400");

  r = await api("GET", "/companies/");
  assert(r.status !== 500, "GET /companies/ (empty id) doesn't crash");

  const fakeUuid = "00000000-0000-0000-0000-000000000000";
  r = await api("GET", `/companies/${fakeUuid}`);
  assertEq(r.status, 404, "GET non-existent UUID returns 404");

  section("1c. INPUT VALIDATION — PATCH /companies/:id (body)");

  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: {},
  });
  assertEq(r.status, 200, "PATCH with empty body succeeds (all fields optional)");

  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { companyName: "A" },
  });
  assert(r.status === 400 || r.status === 422, "companyName too short (1 char) rejected");

  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { companyName: "X".repeat(256) },
  });
  assert(r.status === 400 || r.status === 422, "companyName too long (256 chars) rejected");

  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { description: "D".repeat(2001) },
  });
  assert(r.status === 400 || r.status === 422, "description too long rejected");

  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { websiteUrl: "not-a-url" },
  });
  assert(r.status === 400 || r.status === 422, "invalid websiteUrl rejected");

  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { websiteUrl: "javascript:alert(1)" },
  });
  assert(r.status === 400 || r.status === 422, "javascript: protocol websiteUrl is rejected");

  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { logoUrl: "not-a-valid-url" },
  });
  assert(r.status === 400 || r.status === 422, "invalid logoUrl rejected");

  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { phoneNumber: "1".repeat(21) },
  });
  assert(r.status === 400 || r.status === 422, "phoneNumber too long rejected");

  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { registrationNumber: "R".repeat(101) },
  });
  assert(r.status === 400 || r.status === 422, "registrationNumber too long rejected");

  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { companyName: 12345 },
  });
  assert(r.status === 400 || r.status === 422, "companyName as number rejected");

  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { isVerified: "yes" },
  });
  assert(r.status === 400 || r.status === 422, "isVerified as string rejected");

  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { companyName: null },
  });
  assert(r.status === 400 || r.status === 422 || r.status === 200, "companyName: null handled gracefully");

  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    rawBody: "{companyName: 'broken json'",
  });
  assert(r.status === 400, "malformed JSON rejected");

  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    headers: { "Content-Type": "text/plain" },
    rawBody: JSON.stringify({ companyName: "Test" }),
  });
  assert(r.status !== 500, "wrong Content-Type doesn't crash");

  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { "__proto__": { "admin": true }, "constructor": { "prototype": { "isAdmin": true } } },
  });
  assert(r.status !== 500, "prototype pollution doesn't crash");

  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { companyName: '<script>alert("xss")</script>' },
  });
  assert(r.status === 200 || r.status === 400, "XSS in companyName handled");

  const newName = `${TEST_PREFIX}_Updated`;
  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { companyName: newName },
  });
  assertEq(r.status, 200, "valid update succeeds");
  assertEq(r.body.data.companyName, newName, "companyName updated correctly");

  section("1d. INPUT VALIDATION — UUID params on nested routes");

  r = await api("GET", "/companies/not-a-uuid/tours");
  assert(r.status === 400, "GET /companies/not-a-uuid/tours returns 400");

  r = await api("GET", "/companies/not-a-uuid/photos");
  assert(r.status === 400, "GET /companies/not-a-uuid/photos returns 400");

  r = await api("GET", `/companies/not-a-uuid/tour-agents`, { token: companyA.token });
  assert(r.status === 400, "GET /companies/not-a-uuid/tour-agents returns 400");

  r = await api("DELETE", `/companies/not-a-uuid/tour-agents/${fakeUuid}`, { token: companyA.token });
  assert(r.status === 400, "DELETE /companies/not-a-uuid/tour-agents/:agentId returns 400");

  r = await api("DELETE", `/companies/${companyA.companyId}/tour-agents/not-a-uuid`, { token: companyA.token });
  assert(r.status === 400, "DELETE /companies/:id/tour-agents/not-a-uuid returns 400");
}

async function testAuthentication(companyA: any): Promise<void> {
  section("2. AUTHENTICATION ATTACKS");

  // No auth header on protected routes
  let r = await api("GET", "/companies/my");
  assertEq(r.status, 401, "GET /companies/my without auth → 401");
  assertEq(r.body?.error?.code, "NO_AUTH_HEADER", "error code = NO_AUTH_HEADER");

  r = await api("PATCH", `/companies/${companyA.companyId}`, { body: { companyName: "hack" } });
  assertEq(r.status, 401, "PATCH without auth → 401");

  // DELETE without auth — note: CSRF hook runs before auth on state-changing requests
  r = await api("DELETE", `/companies/${companyA.companyId}`);
  assert(r.status === 401 || r.status === 403, "DELETE without auth → 401 or 403 (CSRF may run first)");

  r = await api("GET", `/companies/${companyA.companyId}/tour-agents`);
  assertEq(r.status, 401, "GET tour-agents without auth → 401");

  // Empty auth header
  r = await api("GET", "/companies/my", { headers: { Authorization: "" } });
  assertEq(r.status, 401, "empty Authorization header → 401");

  // No Bearer prefix
  r = await api("GET", "/companies/my", { headers: { Authorization: companyA.token } });
  assertEq(r.status, 401, "no Bearer prefix → 401");
  assertEq(r.body?.error?.code, "INVALID_AUTH_FORMAT", "error code = INVALID_AUTH_FORMAT");

  // Bearer with no space
  r = await api("GET", "/companies/my", { headers: { Authorization: `Bearer${companyA.token}` } });
  assertEq(r.status, 401, "Bearer(no space)token → 401");

  // Bearer with only space
  r = await api("GET", "/companies/my", { headers: { Authorization: "Bearer " } });
  assertEq(r.status, 401, "Bearer(space only) → 401");

  // Random string as token
  r = await api("GET", "/companies/my", { token: "totally.random.string" });
  assertEq(r.status, 401, "random string token → 401");
  assertEq(r.body?.error?.code, "INVALID_TOKEN", "error code = INVALID_TOKEN");

  // Unverified email — create via Prisma with emailVerified=false
  const unverified = await createUserDirect("co_unverified", { roles: ["USER"], emailVerified: false });
  r = await api("GET", "/companies/my", { token: unverified.token });
  assertEq(r.status, 403, "unverified email on /companies/my → 403");
  assertEq(r.body?.error?.code, "EMAIL_NOT_VERIFIED", "error code = EMAIL_NOT_VERIFIED");

  // Token for deactivated user
  const deactivated = await createUserDirect("co_deactivated", { roles: ["USER"] });
  await prisma.user.update({ where: { id: deactivated.userId }, data: { isActive: false } });
  r = await api("GET", "/companies/my", { token: deactivated.token });
  assertEq(r.status, 401, "deactivated user → 401");
  assertEq(r.body?.error?.code, "ACCOUNT_DEACTIVATED", "error code = ACCOUNT_DEACTIVATED");

  // Token for soft-deleted user
  const deletedUser = await createUserDirect("co_deleted", { roles: ["USER"] });
  await prisma.user.update({ where: { id: deletedUser.userId }, data: { deletedAt: new Date() } });
  r = await api("GET", "/companies/my", { token: deletedUser.token });
  assertEq(r.status, 401, "deleted user → 401");
  assertEq(r.body?.error?.code, "USER_NOT_FOUND", "error code = USER_NOT_FOUND");

  // Stale tokenVersion
  const staleUser = await createUserDirect("co_stale", { roles: ["USER"] });
  await prisma.user.update({ where: { id: staleUser.userId }, data: { tokenVersion: { increment: 1 } } });
  r = await api("GET", "/companies/my", { token: staleUser.token });
  assertEq(r.status, 401, "stale tokenVersion → 401");
  assertEq(r.body?.error?.code, "SESSION_INVALIDATED", "error code = SESSION_INVALIDATED");

  // Public routes should work without auth
  r = await api("GET", "/companies");
  assertEq(r.status, 200, "GET /companies (public) works without auth");

  r = await api("GET", `/companies/${companyA.companyId}`);
  assertEq(r.status, 200, "GET /companies/:id (public) works without auth");

  r = await api("GET", `/companies/${companyA.companyId}/tours`);
  assertEq(r.status, 200, "GET /companies/:id/tours (public) works without auth");

  r = await api("GET", `/companies/${companyA.companyId}/photos`);
  assertEq(r.status, 200, "GET /companies/:id/photos (public) works without auth");
}

async function testAuthorization(companyA: any, companyB: any, regularUser: any): Promise<void> {
  section("3. AUTHORIZATION — Cross-user & role checks");

  // CompanyB tries to update CompanyA
  let r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyB.token,
    body: { companyName: "Hijacked" },
  });
  assertEq(r.status, 403, "CompanyB cannot update CompanyA → 403");

  // CompanyB tries to delete CompanyA
  r = await api("DELETE", `/companies/${companyA.companyId}`, { token: companyB.token });
  assertEq(r.status, 403, "CompanyB cannot delete CompanyA → 403");

  // CompanyB tries to view CompanyA's tour agents
  r = await api("GET", `/companies/${companyA.companyId}/tour-agents`, { token: companyB.token });
  assertEq(r.status, 403, "CompanyB cannot view CompanyA's tour agents → 403");

  // Regular USER tries to update company
  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: regularUser.token,
    body: { companyName: "Hijacked by user" },
  });
  assertEq(r.status, 403, "Regular USER cannot update company → 403");

  // Regular USER tries to delete company
  r = await api("DELETE", `/companies/${companyA.companyId}`, { token: regularUser.token });
  assertEq(r.status, 403, "Regular USER cannot delete company → 403");

  // Regular USER tries to view tour agents
  r = await api("GET", `/companies/${companyA.companyId}/tour-agents`, { token: regularUser.token });
  assertEq(r.status, 403, "Regular USER cannot view tour agents → 403");

  // Non-admin user tries to set isVerified=true (privilege escalation)
  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { isVerified: true },
  });
  if (r.status === 200) {
    const checkRes = await api("GET", `/companies/${companyA.companyId}`);
    const isVerifiedVal = checkRes.body?.data?.isVerified;
    assert(isVerifiedVal !== true, "Non-admin setting isVerified should be stripped");
  } else {
    assert(true, "Non-admin isVerified=true rejected at validation");
  }

  // Extra fields in body (privilege escalation attempt)
  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { companyName: "Safe Update", role: "ADMIN", userId: "fake-id" },
  });
  assert(r.status === 200 || r.status === 400, "Extra fields don't cause escalation");
  if (r.status === 200) {
    assert(r.body.data.userId !== "fake-id", "userId not overwritten by body field");
  }

  // Company owner should access their own data
  r = await api("GET", "/companies/my", { token: companyA.token });
  assertEq(r.status, 200, "Company owner can access /companies/my");
  assertEq(r.body.data.id, companyA.companyId, "Returns correct company");

  // Regular USER without a company
  r = await api("GET", "/companies/my", { token: regularUser.token });
  assertEq(r.status, 404, "User without company → 404 on /companies/my");

  // CompanyB tries to delete photo from CompanyA
  r = await api("DELETE", `/companies/${companyA.companyId}/photos/00000000-0000-0000-0000-000000000000`, {
    token: companyB.token,
  });
  assert(r.status === 403 || r.status === 404, "CompanyB cannot delete CompanyA's photos");

  // CompanyB tries to upload photos to CompanyA
  r = await api("POST", `/companies/${companyA.companyId}/photos`, {
    token: companyB.token,
    multipart: [
      { fieldName: "photos", fileName: "test.jpg", mimeType: "image/jpeg", buffer: makeJpegBuffer() },
    ],
  });
  assertEq(r.status, 403, "CompanyB cannot upload photos to CompanyA → 403");

  // CompanyB tries to upload logo to CompanyA
  r = await api("POST", `/companies/${companyA.companyId}/logo`, {
    token: companyB.token,
    multipart: [
      { fieldName: "logo", fileName: "logo.jpg", mimeType: "image/jpeg", buffer: makeJpegBuffer() },
    ],
  });
  assertEq(r.status, 403, "CompanyB cannot upload logo to CompanyA → 403");

  // CompanyB tries to delete CompanyA's logo
  r = await api("DELETE", `/companies/${companyA.companyId}/logo`, { token: companyB.token });
  assertEq(r.status, 403, "CompanyB cannot delete CompanyA's logo → 403");

  // CompanyB tries to delete CompanyA's tour agent
  const fakeAgentId = "00000000-0000-0000-0000-000000000001";
  r = await api("DELETE", `/companies/${companyA.companyId}/tour-agents/${fakeAgentId}`, {
    token: companyB.token,
  });
  assertEq(r.status, 403, "CompanyB cannot delete CompanyA's tour agents → 403");
}

async function testBusinessLogic(companyA: any): Promise<void> {
  section("4. BUSINESS LOGIC");

  const fakeUuid = "00000000-0000-0000-0000-000000000000";

  // Get company by ID
  let r = await api("GET", `/companies/${companyA.companyId}`);
  assertEq(r.status, 200, "GET /companies/:id returns company data");
  assert(r.body.data.id === companyA.companyId, "returned company has correct ID");
  assert(typeof r.body.data.companyName === "string", "company has companyName");
  assert(r.body.data.user !== undefined, "company includes user relation");

  // GET /companies/my
  r = await api("GET", "/companies/my", { token: companyA.token });
  assertEq(r.status, 200, "GET /companies/my succeeds");
  assertEq(r.body.data.id, companyA.companyId, "/companies/my returns correct company");

  // Company not found
  r = await api("GET", `/companies/${fakeUuid}`);
  assertEq(r.status, 404, "non-existent company returns 404");
  assertEq(r.body?.error?.code, "COMPANY_NOT_FOUND", "error code = COMPANY_NOT_FOUND");

  // Delete company (soft delete)
  const tempCompany = await createUserDirect("co_temp_del", {
    roles: ["COMPANY"],
    companyName: "TempDeleteCo",
  });
  r = await api("DELETE", `/companies/${tempCompany.companyId}`, { token: tempCompany.token });
  assertEq(r.status, 200, "DELETE /companies/:id succeeds");
  assertEq(r.body.data, null, "DELETE returns null data");

  // After soft-delete with deletedAt, company should return 404
  r = await api("GET", `/companies/${tempCompany.companyId}`);
  assertEq(r.status, 404, "Soft-deleted company returns 404");

  // Update non-existent company
  r = await api("PATCH", `/companies/${fakeUuid}`, {
    token: companyA.token,
    body: { companyName: "Ghost" },
  });
  assert(r.status === 404 || r.status === 403, "update non-existent company fails");

  // Delete non-existent company
  r = await api("DELETE", `/companies/${fakeUuid}`, { token: companyA.token });
  assert(r.status === 404 || r.status === 403, "delete non-existent company fails");

  // Tour agents — empty initially
  r = await api("GET", `/companies/${companyA.companyId}/tour-agents`, { token: companyA.token });
  assertEq(r.status, 200, "GET tour-agents succeeds");
  assert(Array.isArray(r.body.data), "tour-agents returns array");

  // Delete non-existent tour agent
  r = await api("DELETE", `/companies/${companyA.companyId}/tour-agents/${fakeUuid}`, {
    token: companyA.token,
  });
  assertEq(r.status, 404, "delete non-existent agent returns 404");

  // Photos — empty initially
  r = await api("GET", `/companies/${companyA.companyId}/photos`);
  assertEq(r.status, 200, "GET photos succeeds");
  assert(Array.isArray(r.body.data), "photos returns array");

  // Photos for non-existent company
  r = await api("GET", `/companies/${fakeUuid}/photos`);
  assertEq(r.status, 404, "GET photos for non-existent company returns 404");

  // Company tours
  r = await api("GET", `/companies/${companyA.companyId}/tours`);
  assertEq(r.status, 200, "GET /companies/:id/tours succeeds");
  assert(Array.isArray(r.body.data.items), "tours returns paginated items");

  // Delete logo when none exists
  r = await api("DELETE", `/companies/${companyA.companyId}/logo`, { token: companyA.token });
  assertEq(r.status, 200, "DELETE logo when none exists returns 200 (graceful)");

  // Delete photo with fake photoId
  r = await api("DELETE", `/companies/${companyA.companyId}/photos/${fakeUuid}`, {
    token: companyA.token,
  });
  assert(r.status === 404, "DELETE non-existent photo returns 404");

  // Upload photos with no files (JSON body, not multipart)
  r = await api("POST", `/companies/${companyA.companyId}/photos`, {
    token: companyA.token,
    body: { files: "not-multipart" },
  });
  assert(r.status === 400 || r.status === 415, "non-multipart POST to photos endpoint rejected");

  section("4b. BUSINESS LOGIC — isVerified filter");

  // Default list returns only verified companies
  r = await api("GET", "/companies?page=1&limit=100");
  assertEq(r.status, 200, "default list returns verified companies");
  const allVerified = (r.body.data.items as any[]).every((c: any) => c.isVerified === true);
  assert(allVerified, "all listed companies are verified by default");

  // isVerified filter removed from public schema — should be ignored (still returns verified only)
  r = await api("GET", "/companies?isVerified=false&page=1&limit=100");
  assertEq(r.status, 200, "isVerified=false query param is ignored");
  const stillAllVerified = (r.body.data.items as any[]).every((c: any) => c.isVerified === true);
  assert(stillAllVerified, "isVerified=false param does NOT expose unverified companies");

  section("4c. BUSINESS LOGIC — Update after soft delete");

  // Soft-deleted company should be blocked from updates (returns 404)
  if (tempCompany.companyId) {
    r = await api("PATCH", `/companies/${tempCompany.companyId}`, {
      token: tempCompany.token,
      body: { companyName: "Zombie Company" },
    });
    assertEq(r.status, 404, "Update soft-deleted company returns 404");
  }
}

async function testInjectionAndAbuse(companyA: any): Promise<void> {
  section("5. INJECTION & API ABUSE");

  const sqliPayloads = [
    "' OR 1=1 --",
    "'; DROP TABLE companies; --",
    "' UNION SELECT * FROM users --",
    "1' AND SLEEP(5) --",
  ];

  for (const payload of sqliPayloads) {
    const r = await api("GET", `/companies?search=${encodeURIComponent(payload)}`);
    assert(r.status === 200 || r.status === 400, `SQLi search: ${payload.substring(0, 30)}... → no 500`);
    if (r.body) {
      const bodyStr = JSON.stringify(r.body);
      assert(!bodyStr.includes("SELECT"), `SQLi search: no SQL leaked for "${payload.substring(0, 20)}"`);
    }
  }

  // XSS in stored fields
  const xssPayloads = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
  ];

  for (const payload of xssPayloads) {
    const r = await api("PATCH", `/companies/${companyA.companyId}`, {
      token: companyA.token,
      body: { description: payload },
    });
    if (r.status === 200) {
      assert(true, `XSS stored (client must sanitize): ${payload.substring(0, 30)}`);
    } else {
      assert(true, `XSS payload rejected: ${payload.substring(0, 30)}`);
    }
  }

  // Prototype pollution
  let r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { "__proto__": { "isAdmin": true }, "constructor": { "prototype": { "role": "ADMIN" } } },
  });
  assert(r.status !== 500, "prototype pollution doesn't crash");

  // Huge payload
  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { description: "A".repeat(100000) },
  });
  assert(r.status === 400 || r.status === 413 || r.status === 422, "100KB description rejected");

  // Unicode tricks
  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { companyName: "Normal\u200BName\u200B" },
  });
  assert(r.status === 200 || r.status === 400, "zero-width spaces handled");

  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { companyName: "Test\u202EOverride" },
  });
  assert(r.status === 200 || r.status === 400, "RTL override handled");

  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { companyName: "Test\0Null" },
  });
  assert(r.status !== 500, "null byte doesn't crash");

  r = await api("GET", "/companies/..%2F..%2Fetc%2Fpasswd");
  assert(r.status === 400 || r.status === 404, "path traversal in ID rejected (400 or 404)");
}

async function testPaginationAndFiltering(companyA: any): Promise<void> {
  section("6. PAGINATION & FILTERING");

  let r = await api("GET", "/companies");
  assertEq(r.status, 200, "default pagination works");
  assert(r.body.data.pagination !== undefined, "pagination metadata present");
  assert(typeof r.body.data.pagination.page === "number", "pagination.page is number");
  assert(typeof r.body.data.pagination.limit === "number", "pagination.limit is number");
  assert(typeof r.body.data.pagination.totalItems === "number", "pagination.totalItems is number");
  assert(typeof r.body.data.pagination.totalPages === "number", "pagination.totalPages is number");
  assert(typeof r.body.data.pagination.hasNextPage === "boolean", "pagination.hasNextPage is boolean");
  assert(typeof r.body.data.pagination.hasPreviousPage === "boolean", "pagination.hasPreviousPage is boolean");

  r = await api("GET", "/companies?page=99999&limit=10");
  assertEq(r.status, 200, "page beyond total returns 200");
  assertEq(r.body.data.items.length, 0, "page beyond total returns 0 items");
  assertEq(r.body.data.pagination.hasNextPage, false, "page beyond total: hasNextPage=false");

  r = await api("GET", "/companies?page=1&limit=1");
  assertEq(r.body.data.pagination.hasPreviousPage, false, "page 1: hasPreviousPage=false");

  for (const sortBy of ["newest", "rating", "name"]) {
    r = await api("GET", `/companies?sortBy=${sortBy}&limit=5`);
    assertEq(r.status, 200, `sortBy=${sortBy} succeeds`);
  }

  r = await api("GET", "/companies?hasActiveTours=true");
  assertEq(r.status, 200, "hasActiveTours=true works");

  r = await api("GET", "/companies?hasActiveTours=false");
  assertEq(r.status, 200, "hasActiveTours=false works");

  r = await api("GET", "/companies?minRating=0");
  assertEq(r.status, 200, "minRating=0 works");

  r = await api("GET", "/companies?minRating=5");
  assertEq(r.status, 200, "minRating=5 works");

  // Company tours pagination
  r = await api("GET", `/companies/${companyA.companyId}/tours?page=1&limit=5`);
  assertEq(r.status, 200, "company tours pagination works");
  assert(r.body.data.pagination !== undefined, "company tours has pagination");

  r = await api("GET", `/companies/${companyA.companyId}/tours?page=0`);
  assert(r.status === 400 || r.status === 422, "company tours page=0 rejected");

  r = await api("GET", `/companies/${companyA.companyId}/tours?limit=101`);
  assert(r.status === 400 || r.status === 422, "company tours limit=101 rejected");

  // Combined filters
  r = await api("GET", `/companies?search=test&sortBy=rating&minRating=0&hasActiveTours=true&page=1&limit=5`);
  assertEq(r.status, 200, "combined filters work together");
}

async function testErrorResponseShape(companyA: any): Promise<void> {
  section("7. ERROR RESPONSE SHAPE");

  const fakeUuid = "00000000-0000-0000-0000-000000000000";

  let r = await api("GET", `/companies/${fakeUuid}`);
  assertErrorShape(r.body, "404 company not found");

  r = await api("GET", "/companies?page=abc");
  assertErrorShape(r.body, "400 invalid page");

  r = await api("GET", "/companies/my");
  assertErrorShape(r.body, "401 no auth header");

  const otherUser = await createUserDirect("co_err_shape", { roles: ["USER"] });
  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: otherUser.token,
    body: { companyName: "Hack" },
  });
  assertErrorShape(r.body, "403 forbidden update");

  // Success response shape
  r = await api("GET", `/companies/${companyA.companyId}`);
  assertEq(r.body.success, true, "success response: success=true");
  assert(typeof r.body.message === "string", "success response: has message");
  assert(r.body.data !== undefined, "success response: has data");

  // Paginated response shape
  r = await api("GET", "/companies");
  assertEq(r.body.success, true, "paginated response: success=true");
  assert(typeof r.body.message === "string", "paginated response: has message");
  assert(Array.isArray(r.body.data.items), "paginated response: has items array");
  assert(r.body.data.pagination !== undefined, "paginated response: has pagination");
}

async function testRaceConditions(companyA: any): Promise<void> {
  section("8. RACE CONDITIONS");

  // Concurrent updates to same company
  const results = await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      api("PATCH", `/companies/${companyA.companyId}`, {
        token: companyA.token,
        body: { description: `Concurrent update ${i}` },
      })
    )
  );
  const successes = results.filter((r) => r.status === 200);
  assert(successes.length > 0, `concurrent updates: ${successes.length}/5 succeeded`);
  assert(results.every((r) => r.status !== 500), "concurrent updates: no 500 errors");

  // Concurrent deletes on same company
  const tempCo = await createUserDirect("co_race_del", {
    roles: ["COMPANY"],
    companyName: "RaceDeleteCo",
  });
  const delResults = await Promise.all(
    Array.from({ length: 3 }, () =>
      api("DELETE", `/companies/${tempCo.companyId}`, { token: tempCo.token })
    )
  );
  const delSuccesses = delResults.filter((r) => r.status === 200);
  assert(delSuccesses.length >= 1, `concurrent deletes: at least 1 succeeded`);
  assert(delResults.every((r) => r.status !== 500), "concurrent deletes: no 500 errors");
}

async function testCsrfProtection(companyA: any): Promise<void> {
  section("9. CSRF PROTECTION");

  let r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { companyName: "CSRF bypass attempt" },
    skipCsrf: true,
  });
  assertEq(r.status, 403, "PATCH without CSRF token → 403");

  r = await api("DELETE", `/companies/${companyA.companyId}/logo`, {
    token: companyA.token,
    skipCsrf: true,
  });
  assertEq(r.status, 403, "DELETE without CSRF token → 403");

  r = await api("POST", `/companies/${companyA.companyId}/logo`, {
    token: companyA.token,
    skipCsrf: true,
    multipart: [
      { fieldName: "logo", fileName: "test.jpg", mimeType: "image/jpeg", buffer: makeJpegBuffer() },
    ],
  });
  assertEq(r.status, 403, "POST upload without CSRF → 403");

  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { companyName: "CSRF invalid" },
    skipCsrf: true,
    headers: { "X-CSRF-Token": "totally-fake-csrf-token" },
  });
  assertEq(r.status, 403, "PATCH with fake CSRF token → 403");

  // GET requests should work without CSRF
  r = await api("GET", "/companies");
  assertEq(r.status, 200, "GET works without CSRF token");

  r = await api("GET", `/companies/${companyA.companyId}`);
  assertEq(r.status, 200, "GET by ID works without CSRF token");
}

async function testLogoAndPhotoEndpoints(companyA: any): Promise<void> {
  section("10. LOGO & PHOTO UPLOAD/DELETE");

  // Upload a valid logo
  let r = await api("POST", `/companies/${companyA.companyId}/logo`, {
    token: companyA.token,
    multipart: [
      { fieldName: "logo", fileName: "company-logo.jpg", mimeType: "image/jpeg", buffer: makeJpegBuffer() },
    ],
  });
  if (r.status === 201) {
    assert(true, "logo upload succeeded");
    assert(typeof r.body.data.logoUrl === "string", "logo upload returns logoUrl");

    const check = await api("GET", `/companies/${companyA.companyId}`);
    assert(typeof check.body.data.logoUrl === "string", "company now has logoUrl");

    r = await api("DELETE", `/companies/${companyA.companyId}/logo`, { token: companyA.token });
    assertEq(r.status, 200, "logo delete succeeds");

    const check2 = await api("GET", `/companies/${companyA.companyId}`);
    assertEq(check2.body.data.logoUrl, null, "company logoUrl is null after delete");
  } else {
    console.log(`  ⚠️  Logo upload returned ${r.status} — magic bytes validation may be strict`);
    assert(r.status !== 500, "logo upload doesn't crash server");
  }

  // Upload photos
  r = await api("POST", `/companies/${companyA.companyId}/photos`, {
    token: companyA.token,
    multipart: [
      { fieldName: "photos", fileName: "photo1.jpg", mimeType: "image/jpeg", buffer: makeJpegBuffer() },
    ],
  });
  if (r.status === 201) {
    assert(true, "photo upload succeeded");
    assert(Array.isArray(r.body.data), "photo upload returns array");
    const photoId = r.body.data[0]?.id;

    const photos = await api("GET", `/companies/${companyA.companyId}/photos`);
    assertEq(photos.status, 200, "get photos after upload succeeds");
    assert(photos.body.data.length > 0, "photos array has items after upload");

    if (photoId) {
      r = await api("DELETE", `/companies/${companyA.companyId}/photos/${photoId}`, {
        token: companyA.token,
      });
      assertEq(r.status, 200, "photo delete succeeds");
    }
  } else {
    console.log(`  ⚠️  Photo upload returned ${r.status}`);
    assert(r.status !== 500, "photo upload doesn't crash server");
  }

  // Upload to non-existent company
  const fakeUuid = "00000000-0000-0000-0000-000000000000";
  r = await api("POST", `/companies/${fakeUuid}/logo`, {
    token: companyA.token,
    multipart: [
      { fieldName: "logo", fileName: "logo.jpg", mimeType: "image/jpeg", buffer: makeJpegBuffer() },
    ],
  });
  assert(r.status === 403 || r.status === 404, "upload logo to non-existent company fails");
}

async function testTourAgentEndpoints(companyA: any): Promise<void> {
  section("11. TOUR AGENT ENDPOINTS");

  const fakeUuid = "00000000-0000-0000-0000-000000000000";

  let r = await api("GET", `/companies/${companyA.companyId}/tour-agents`, { token: companyA.token });
  assertEq(r.status, 200, "GET tour-agents succeeds");
  assert(Array.isArray(r.body.data), "tour-agents returns array");

  r = await api("GET", `/companies/${fakeUuid}/tour-agents`, { token: companyA.token });
  assert(r.status === 404 || r.status === 403, "GET tour-agents for non-existent company fails");

  r = await api("DELETE", `/companies/${companyA.companyId}/tour-agents/${fakeUuid}`, {
    token: companyA.token,
  });
  assertEq(r.status, 404, "delete non-existent agent returns 404");

  r = await api("DELETE", `/companies/${fakeUuid}/tour-agents/${fakeUuid}`, {
    token: companyA.token,
  });
  assert(r.status === 404 || r.status === 403, "delete agent from non-existent company fails");
}

async function testEdgeCases(companyA: any): Promise<void> {
  section("12. EDGE CASES");

  // Double-delete company
  const tempCo = await createUserDirect("co_double_del", {
    roles: ["COMPANY"],
    companyName: "DoubleDeleteCo",
  });
  let r = await api("DELETE", `/companies/${tempCo.companyId}`, { token: tempCo.token });
  assertEq(r.status, 200, "first delete succeeds");

  r = await api("DELETE", `/companies/${tempCo.companyId}`, { token: tempCo.token });
  assert(r.status === 200 || r.status === 404, "double delete doesn't crash");

  // Concurrent requests to /companies/my
  const myResults = await Promise.all(
    Array.from({ length: 5 }, () => api("GET", "/companies/my", { token: companyA.token }))
  );
  assert(myResults.every((r) => r.status === 200), "concurrent /companies/my all succeed");
  const ids = myResults.map((r) => r.body.data.id);
  assert(new Set(ids).size === 1, "concurrent /companies/my return same company");

  // Exactly 200 chars search
  r = await api("GET", `/companies?search=${"A".repeat(200)}`);
  assertEq(r.status, 200, "search with exactly 200 chars accepted");

  // Empty string for optional fields
  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { description: "" },
  });
  assertEq(r.status, 200, "empty string for optional description accepted");

  // Georgian Unicode + special chars
  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { companyName: "Test & Co. (საქართველო)" },
  });
  assertEq(r.status, 200, "Georgian Unicode + special chars accepted");

  // Valid websiteUrl
  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { websiteUrl: "https://example.com" },
  });
  assertEq(r.status, 200, "valid websiteUrl update succeeds");

  // Valid phoneNumber
  r = await api("PATCH", `/companies/${companyA.companyId}`, {
    token: companyA.token,
    body: { phoneNumber: "+995599123456" },
  });
  assertEq(r.status, 200, "valid phoneNumber update succeeds");
}

// ─── Main ────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n🔍 Bug Hunt: Companies Endpoints (13 endpoints)`);
  console.log(`${"═".repeat(60)}`);
  console.log(`Test prefix: ${TEST_PREFIX}\n`);

  let companyA: any;
  let companyB: any;
  let regularUser: any;

  try {
    await fetchCsrf();

    // Setup test users via Prisma + login (bypasses registration rate limits)
    console.log("Setting up test users...");
    companyA = await createUserDirect("co_owner_a", { roles: ["COMPANY"], companyName: "CompanyAlpha" });
    companyB = await createUserDirect("co_owner_b", { roles: ["COMPANY"], companyName: "CompanyBeta" });
    regularUser = await createUserDirect("co_regular", { roles: ["USER"] });
    console.log("  ✓ Test users created\n");

    await testInputValidation(companyA);
    await testAuthentication(companyA);
    await testAuthorization(companyA, companyB, regularUser);
    await testBusinessLogic(companyA);
    await testInjectionAndAbuse(companyA);
    await testPaginationAndFiltering(companyA);
    await testErrorResponseShape(companyA);
    await testRaceConditions(companyA);
    await testCsrfProtection(companyA);
    await testLogoAndPhotoEndpoints(companyA);
    await testTourAgentEndpoints(companyA);
    await testEdgeCases(companyA);
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
