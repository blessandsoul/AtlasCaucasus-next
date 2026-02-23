/**
 * Exhaustive API bug-hunting tests for the Auth endpoints.
 *
 * Categories: input validation, authentication, authorization, business logic,
 *             injection attacks, error shape, race conditions, CSRF.
 *
 * Run: npx tsx src/tests/auth-hunt.test.ts
 */

import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { createClient } from "redis";
import dotenv from "dotenv";
import path from "path";

// Load .env from server root
dotenv.config({ path: path.resolve(import.meta.dirname, "../../.env") });

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:8000/api/v1";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

// ─── Counters ────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

/** Tracks rate-limited skips */
let skippedDueToRateLimit = 0;
/** Last API response status - used by assert to auto-skip rate-limited tests */
let lastApiStatus = 0;

function assert(condition: boolean, label: string): void {
  // Auto-skip if the last API call was rate-limited and we're using in-memory rate limiter
  if (!condition && lastApiStatus === 429 && serverUsesRedisRateLimit === false) {
    skippedDueToRateLimit++;
    console.log(`  ⏭️  ${label} (skipped — rate limited)`);
    return;
  }
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
  // Auto-skip rate-limited results (429 when we expected a different HTTP status)
  if (
    serverUsesRedisRateLimit === false &&
    typeof actual === "number" && typeof expected === "number" &&
    actual === 429 && expected !== 429
  ) {
    skippedDueToRateLimit++;
    console.log(`  ⏭️  ${label} (skipped — rate limited)`);
    return;
  }
  // Also skip when comparing error codes and we got RATE_LIMIT_EXCEEDED
  if (
    serverUsesRedisRateLimit === false &&
    typeof actual === "string" && actual === "RATE_LIMIT_EXCEEDED" &&
    typeof expected === "string" && expected !== "RATE_LIMIT_EXCEEDED"
  ) {
    skippedDueToRateLimit++;
    console.log(`  ⏭️  ${label} (skipped — rate limited)`);
    return;
  }
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

// ─── Redis — Flush Rate Limits ───────────────────────────────

let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedis(): Promise<ReturnType<typeof createClient>> {
  if (redisClient && redisClient.isOpen) return redisClient;
  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
    },
    password: process.env.REDIS_PASSWORD || undefined,
  });
  redisClient.on("error", () => {}); // suppress
  await redisClient.connect();
  return redisClient;
}

let serverUsesRedisRateLimit: boolean | null = null;

async function flushRateLimits(): Promise<void> {
  try {
    const redis = await getRedis();
    await redis.flushDb();

    // On first flush, diagnose whether server uses Redis for rate limiting
    if (serverUsesRedisRateLimit === null) {
      // Send a test request, then check if Redis has any new keys
      const before = await redis.dbSize();
      await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "diag@test.local", password: "x" }),
      });
      // Small delay for Redis write
      await new Promise(r => setTimeout(r, 100));
      const after = await redis.dbSize();
      serverUsesRedisRateLimit = after > before;
      if (!serverUsesRedisRateLimit) {
        console.log("  ⚠️  Server uses IN-MEMORY rate limiting (Redis flush won't help)");
        console.log("  ℹ️  Tests will tolerate 429 on rate-limited endpoints");
      } else {
        console.log("  ✅ Server uses Redis rate limiting — flush effective");
        // Flush again to clear the diagnostic request's key
        await redis.flushDb();
      }
    }
  } catch (err) {
    console.log(`  ⚠️  Redis flush failed: ${(err as Error).message}`);
  }
}

async function disconnectRedis(): Promise<void> {
  try { if (redisClient?.isOpen) await redisClient.quit(); } catch {}
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
  opts: { body?: unknown; token?: string; headers?: Record<string, string>; skipCsrf?: boolean; rawBody?: string } = {}
): Promise<{ status: number; body: any; headers: Headers }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...opts.headers,
  };

  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;

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

  for (const c of res.headers.getSetCookie?.() ?? []) {
    if (c.startsWith("_csrf")) csrfCookie = c.split(";")[0];
  }

  const body = await res.json().catch(() => null);
  lastApiStatus = res.status;
  return { status: res.status, body, headers: res.headers };
}

// ─── Test User Helpers (All via Prisma + direct JWT) ─────────

const TEST_PREFIX = `__hunt_${Date.now()}`;
const TEST_PASSWORD = "TestPass123!";
const createdUserIds: string[] = [];

function testEmail(suffix: string): string {
  return `${TEST_PREFIX}_${suffix}@test.local`;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Create user + session via Prisma, sign JWT directly. Zero HTTP calls. */
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

  // Create session and sign tokens directly
  const accessToken = jwt.sign(
    { userId: user.id, roles: ["USER"], tokenVersion: user.tokenVersion, emailVerified: true },
    ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const tempHash = crypto.randomBytes(32).toString("hex");
  const session = await prisma.userSession.create({
    data: {
      userId: user.id,
      refreshTokenHash: tempHash,
      expiresAt: sessionExpiresAt,
    },
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

/** Create unverified user + session via Prisma */
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

/** Create company user via Prisma + company profile + session */
async function createVerifiedCompanyUser(
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
      roles: { create: { role: "COMPANY" } },
    },
  });
  createdUserIds.push(user.id);

  await prisma.company.create({
    data: { userId: user.id, companyName: `TestCompany_${suffix}` },
  });

  const accessToken = jwt.sign(
    { userId: user.id, roles: ["COMPANY"], tokenVersion: user.tokenVersion, emailVerified: true },
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

// ─── Error Shape Checker ─────────────────────────────────────

function assertErrorShape(res: { status: number; body: any }, label: string): void {
  assertEq(res.body?.success, false, `${label}: success is false`);
  assert(typeof res.body?.error?.code === "string", `${label}: has string error.code`);
  assert(typeof res.body?.error?.message === "string", `${label}: has string error.message`);
  const bodyStr = JSON.stringify(res.body);
  assert(!bodyStr.includes("stack"), `${label}: no stack trace`);
  assert(!/prisma/i.test(bodyStr), `${label}: no Prisma leak`);
  assert(!bodyStr.includes("node_modules"), `${label}: no paths leak`);
  assert(!bodyStr.includes("SELECT "), `${label}: no SQL leak`);
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
  await disconnectRedis();
  console.log("  Done.");
}

// ═══════════════════════════════════════════════════════════════
// 1. INPUT VALIDATION
// ═══════════════════════════════════════════════════════════════

async function testInputValidation(): Promise<void> {
  await flushRateLimits();
  section("1. Input Validation — Register");

  const validReg = { email: testEmail("val_reg"), password: TEST_PASSWORD, firstName: "Test", lastName: "Val" };

  for (const field of ["email", "password", "firstName", "lastName"]) {
    const body = { ...validReg };
    delete (body as any)[field];
    const res = await api("POST", "/auth/register", { body });
    assert(res.status === 400 || res.status === 422, `[VALIDATION] POST /auth/register: missing ${field} → ${res.status}`);
    assertErrorShape(res, `missing ${field}`);
  }

  // Empty body
  const r1 = await api("POST", "/auth/register", { body: {} });
  assert(r1.status === 400 || r1.status === 422, `[VALIDATION] POST /auth/register: empty body → ${r1.status}`);

  // Null fields
  const r2 = await api("POST", "/auth/register", { body: { email: null, password: null, firstName: null, lastName: null } });
  assert(r2.status === 400 || r2.status === 422, `[VALIDATION] POST /auth/register: all null → ${r2.status}`);

  // Wrong types
  const r3 = await api("POST", "/auth/register", { body: { email: 12345, password: true, firstName: [], lastName: {} } });
  assert(r3.status === 400 || r3.status === 422, `[VALIDATION] POST /auth/register: wrong types → ${r3.status}`);

  // Password validation
  for (const [pw, desc] of [
    ["Ab1!", "too short"],
    ["testpass123!", "no uppercase"],
    ["TESTPASS123!", "no lowercase"],
    ["TestPassword!", "no digit"],
    ["TestPass123", "no special char"],
    ["A".repeat(120) + "a1!12345", "too long (129 chars)"],
  ] as const) {
    const res = await api("POST", "/auth/register", { body: { ...validReg, password: pw } });
    assert(res.status === 400 || res.status === 422, `[VALIDATION] POST /auth/register: password ${desc} → ${res.status}`);
  }

  // Name validation
  const rShort = await api("POST", "/auth/register", { body: { ...validReg, firstName: "A" } });
  assert(rShort.status === 400 || rShort.status === 422, `[VALIDATION] POST /auth/register: firstName too short → ${rShort.status}`);

  const rLong = await api("POST", "/auth/register", { body: { ...validReg, firstName: "A".repeat(101) } });
  assert(rLong.status === 400 || rLong.status === 422, `[VALIDATION] POST /auth/register: firstName too long → ${rLong.status}`);

  // Invalid email
  const rEmail = await api("POST", "/auth/register", { body: { ...validReg, email: "notanemail" } });
  assert(rEmail.status === 400 || rEmail.status === 422, `[VALIDATION] POST /auth/register: invalid email → ${rEmail.status}`);

  // Extra fields should be ignored
  const rExtra = await api("POST", "/auth/register", { body: { ...validReg, email: testEmail("val_extra"), isAdmin: true, role: "ADMIN" } });
  assert(rExtra.status === 201, `[VALIDATION] POST /auth/register: extra fields ignored → ${rExtra.status}`);
  if (rExtra.status === 201) {
    createdUserIds.push(rExtra.body.data.user.id);
    assert(!rExtra.body.data.user.roles?.includes("ADMIN"), `[VALIDATION] POST /auth/register: role escalation rejected`);
  }

  await flushRateLimits();
  section("1b. Input Validation — Login");
  const rl1 = await api("POST", "/auth/login", { body: {} });
  assert(rl1.status === 400 || rl1.status === 422, `[VALIDATION] POST /auth/login: empty body → ${rl1.status}`);
  const rl2 = await api("POST", "/auth/login", { body: { email: "test@test.com" } });
  assert(rl2.status === 400 || rl2.status === 422, `[VALIDATION] POST /auth/login: missing password → ${rl2.status}`);
  const rl3 = await api("POST", "/auth/login", { body: { password: "test" } });
  assert(rl3.status === 400 || rl3.status === 422, `[VALIDATION] POST /auth/login: missing email → ${rl3.status}`);
  const rl4 = await api("POST", "/auth/login", { body: { email: "test@test.com", password: "" } });
  assert(rl4.status === 400 || rl4.status === 422, `[VALIDATION] POST /auth/login: empty password → ${rl4.status}`);

  await flushRateLimits();
  section("1c. Input Validation — Refresh/Logout/Verify/Reset/Forgot");
  const rv1 = await api("POST", "/auth/refresh", { body: {} });
  assert(rv1.status === 400 || rv1.status === 422, `[VALIDATION] POST /auth/refresh: empty body → ${rv1.status}`);
  const rv2 = await api("POST", "/auth/refresh", { body: { refreshToken: "" } });
  assert(rv2.status === 400 || rv2.status === 422, `[VALIDATION] POST /auth/refresh: empty refreshToken → ${rv2.status}`);
  const rv3 = await api("POST", "/auth/verify-email", { body: {} });
  assert(rv3.status === 400 || rv3.status === 422, `[VALIDATION] POST /auth/verify-email: empty body → ${rv3.status}`);
  const rv4 = await api("POST", "/auth/verify-email", { body: { token: "short" } });
  assert(rv4.status === 400 || rv4.status === 422, `[VALIDATION] POST /auth/verify-email: token too short → ${rv4.status}`);
  const rv5 = await api("POST", "/auth/verify-email", { body: { token: "a".repeat(65) } });
  assert(rv5.status === 400 || rv5.status === 422, `[VALIDATION] POST /auth/verify-email: token too long (65) → ${rv5.status}`);
  const rv6 = await api("POST", "/auth/reset-password", { body: {} });
  assert(rv6.status === 400 || rv6.status === 422, `[VALIDATION] POST /auth/reset-password: empty body → ${rv6.status}`);
  const rv7 = await api("POST", "/auth/reset-password", { body: { token: "a".repeat(64), newPassword: "weak" } });
  assert(rv7.status === 400 || rv7.status === 422, `[VALIDATION] POST /auth/reset-password: weak newPassword → ${rv7.status}`);
  const rv8 = await api("POST", "/auth/forgot-password", { body: {} });
  assert(rv8.status === 400 || rv8.status === 422, `[VALIDATION] POST /auth/forgot-password: empty body → ${rv8.status}`);
  const rv9 = await api("POST", "/auth/forgot-password", { body: { email: "notvalid" } });
  assert(rv9.status === 400 || rv9.status === 422, `[VALIDATION] POST /auth/forgot-password: invalid email → ${rv9.status}`);
  const rv10 = await api("POST", "/auth/logout", { body: {} });
  assert(rv10.status === 400 || rv10.status === 422, `[VALIDATION] POST /auth/logout: empty body → ${rv10.status}`);
  const rv11 = await api("POST", "/auth/logout", { body: { refreshToken: "" } });
  assert(rv11.status === 400 || rv11.status === 422, `[VALIDATION] POST /auth/logout: empty refreshToken → ${rv11.status}`);

  await flushRateLimits();
  section("1d. Input Validation — Company Register");
  const validCo = { email: testEmail("val_co"), password: TEST_PASSWORD, firstName: "Test", lastName: "Co", companyName: "TestCo" };
  const rc1 = await api("POST", "/auth/register-company", { body: { ...validCo, companyName: undefined } });
  assert(rc1.status === 400 || rc1.status === 422, `[VALIDATION] POST /auth/register-company: missing companyName → ${rc1.status}`);
  const rc2 = await api("POST", "/auth/register-company", { body: { ...validCo, companyName: "A" } });
  assert(rc2.status === 400 || rc2.status === 422, `[VALIDATION] POST /auth/register-company: companyName too short → ${rc2.status}`);
  const rc3 = await api("POST", "/auth/register-company", { body: { ...validCo, websiteUrl: "not-a-url" } });
  assert(rc3.status === 400 || rc3.status === 422, `[VALIDATION] POST /auth/register-company: invalid websiteUrl → ${rc3.status}`);

  section("1e. Input Validation — Claim Role");
  const claimUser = await createVerifiedUser("val_claim");
  const rr1 = await api("POST", "/auth/claim-role", { body: {}, token: claimUser.token });
  assert(rr1.status === 400 || rr1.status === 422, `[VALIDATION] POST /auth/claim-role: empty body → ${rr1.status}`);
  const rr2 = await api("POST", "/auth/claim-role", { body: { role: "INVALID" }, token: claimUser.token });
  assert(rr2.status === 400 || rr2.status === 422, `[VALIDATION] POST /auth/claim-role: invalid role → ${rr2.status}`);
  const rr3 = await api("POST", "/auth/claim-role", { body: { role: "ADMIN" }, token: claimUser.token });
  assert(rr3.status === 400 || rr3.status === 422, `[VALIDATION] POST /auth/claim-role: can't claim ADMIN → ${rr3.status}`);
  const rr4 = await api("POST", "/auth/claim-role", { body: { role: "GUIDE", profile: { yearsOfExperience: -1 } }, token: claimUser.token });
  assert(rr4.status === 400 || rr4.status === 422, `[VALIDATION] POST /auth/claim-role: negative yearsOfExperience → ${rr4.status}`);
  const rr5 = await api("POST", "/auth/claim-role", { body: { role: "GUIDE", profile: { yearsOfExperience: 71 } }, token: claimUser.token });
  assert(rr5.status === 400 || rr5.status === 422, `[VALIDATION] POST /auth/claim-role: yearsOfExperience > 70 → ${rr5.status}`);

  section("1f. Input Validation — Accept Invitation / Tour Agents");
  const ri1 = await api("POST", "/auth/accept-invitation", { body: {} });
  assert(ri1.status === 400 || ri1.status === 422, `[VALIDATION] POST /auth/accept-invitation: empty body → ${ri1.status}`);
  const ri2 = await api("POST", "/auth/accept-invitation", { body: { token: "short", password: TEST_PASSWORD } });
  assert(ri2.status === 400 || ri2.status === 422, `[VALIDATION] POST /auth/accept-invitation: short token → ${ri2.status}`);
  const ri3 = await api("POST", "/auth/accept-invitation", { body: { token: "a".repeat(64), password: "weak" } });
  assert(ri3.status === 400 || ri3.status === 422, `[VALIDATION] POST /auth/accept-invitation: weak password → ${ri3.status}`);

  const companyUser = await createVerifiedCompanyUser("val_ta");
  const rt1 = await api("POST", "/auth/tour-agents", { body: {}, token: companyUser.token });
  assert(rt1.status === 400 || rt1.status === 422, `[VALIDATION] POST /auth/tour-agents: empty body → ${rt1.status}`);
  const rt2 = await api("POST", "/auth/tour-agents", { body: { email: "notvalid", firstName: "Ab", lastName: "Cd" }, token: companyUser.token });
  assert(rt2.status === 400 || rt2.status === 422, `[VALIDATION] POST /auth/tour-agents: invalid email → ${rt2.status}`);
  const rt3 = await api("POST", "/auth/tour-agents", { body: { email: testEmail("val_ta_s"), firstName: "A", lastName: "B" }, token: companyUser.token });
  assert(rt3.status === 400 || rt3.status === 422, `[VALIDATION] POST /auth/tour-agents: firstName too short → ${rt3.status}`);

  await flushRateLimits();
  section("1g. Input Validation — Malformed JSON & Content-Type");
  const rj1 = await api("POST", "/auth/login", { rawBody: "{ bad json" });
  assert(rj1.status === 400 || rj1.status === 422, `[VALIDATION] POST /auth/login: malformed JSON → ${rj1.status}`);
  const rj2 = await api("POST", "/auth/login", { rawBody: JSON.stringify({ email: "t@t.com", password: "t" }), headers: { "Content-Type": "text/plain" } });
  assert(rj2.status !== 500, `[VALIDATION] POST /auth/login: wrong Content-Type → not 500 (got ${rj2.status})`);

  await flushRateLimits();
  section("1h. Input Validation — Prototype Pollution");
  const rp1 = await api("POST", "/auth/register", {
    body: { email: testEmail("val_pp"), password: TEST_PASSWORD, firstName: "Test", lastName: "PP", __proto__: { admin: true }, constructor: { prototype: { isAdmin: true } } },
  });
  assert(rp1.status !== 500, `[VALIDATION] POST /auth/register: prototype pollution safe → ${rp1.status}`);
  if (rp1.status === 201) createdUserIds.push(rp1.body.data.user.id);
}

// ═══════════════════════════════════════════════════════════════
// 2. AUTHENTICATION ATTACKS
// ═══════════════════════════════════════════════════════════════

async function testAuthentication(): Promise<void> {
  section("2. Authentication — Protected Routes (No Auth)");

  const r1 = await api("GET", "/auth/me");
  assertEq(r1.status, 401, `[AUTH] GET /auth/me: no auth → 401`);
  assertEq(r1.body?.error?.code, "NO_AUTH_HEADER", `[AUTH] GET /auth/me: NO_AUTH_HEADER`);

  const r2 = await api("POST", "/auth/logout-all", { body: {} });
  assertEq(r2.status, 401, `[AUTH] POST /auth/logout-all: no auth → 401`);

  const r3 = await api("POST", "/auth/claim-role", { body: { role: "GUIDE", profile: {} } });
  assertEq(r3.status, 401, `[AUTH] POST /auth/claim-role: no auth → 401`);

  const r4 = await api("GET", "/auth/tour-agents");
  assertEq(r4.status, 401, `[AUTH] GET /auth/tour-agents: no auth → 401`);

  section("2b. Authentication — Malformed Bearer");

  const r5 = await api("GET", "/auth/me", { headers: { Authorization: "" } });
  assertEq(r5.status, 401, `[AUTH] GET /auth/me: empty Authorization → 401`);

  const r6 = await api("GET", "/auth/me", { headers: { Authorization: "sometoken" } });
  assertEq(r6.status, 401, `[AUTH] no Bearer prefix → 401`);
  assertEq(r6.body?.error?.code, "INVALID_AUTH_FORMAT", `[AUTH] no Bearer prefix → INVALID_AUTH_FORMAT`);

  const r7 = await api("GET", "/auth/me", { headers: { Authorization: "Bearer" } });
  assertEq(r7.status, 401, `[AUTH] "Bearer" only → 401`);

  const r8 = await api("GET", "/auth/me", { headers: { Authorization: "Bearer " } });
  assertEq(r8.status, 401, `[AUTH] "Bearer " (space only) → 401`);

  const r9 = await api("GET", "/auth/me", { headers: { Authorization: "Bearertoken123" } });
  assertEq(r9.status, 401, `[AUTH] "Bearertoken" (no space) → 401`);

  const r10 = await api("GET", "/auth/me", { token: "this.is.not.a.jwt" });
  assertEq(r10.status, 401, `[AUTH] random string → 401`);
  assertEq(r10.body?.error?.code, "INVALID_TOKEN", `[AUTH] random → INVALID_TOKEN`);

  section("2c. Authentication — Deleted/Deactivated/Stale");

  const delUser = await createVerifiedUser("auth_del");
  await prisma.user.update({ where: { id: delUser.userId }, data: { deletedAt: new Date() } });
  const rd1 = await api("GET", "/auth/me", { token: delUser.token });
  assertEq(rd1.status, 401, `[AUTH] deleted user → 401`);
  assertEq(rd1.body?.error?.code, "USER_NOT_FOUND", `[AUTH] deleted → USER_NOT_FOUND`);
  await prisma.user.update({ where: { id: delUser.userId }, data: { deletedAt: null } });

  const deactUser = await createVerifiedUser("auth_deact");
  await prisma.user.update({ where: { id: deactUser.userId }, data: { isActive: false } });
  const rd2 = await api("GET", "/auth/me", { token: deactUser.token });
  assertEq(rd2.status, 401, `[AUTH] deactivated user → 401`);
  assertEq(rd2.body?.error?.code, "ACCOUNT_DEACTIVATED", `[AUTH] deactivated → ACCOUNT_DEACTIVATED`);
  await prisma.user.update({ where: { id: deactUser.userId }, data: { isActive: true } });

  const tvUser = await createVerifiedUser("auth_tv");
  await prisma.user.update({ where: { id: tvUser.userId }, data: { tokenVersion: { increment: 1 } } });
  const rd3 = await api("GET", "/auth/me", { token: tvUser.token });
  assertEq(rd3.status, 401, `[AUTH] stale tokenVersion → 401`);
  assertEq(rd3.body?.error?.code, "SESSION_INVALIDATED", `[AUTH] stale → SESSION_INVALIDATED`);

  section("2d. Authentication — Unverified Email");

  const unvUser = await createUnverifiedUser("auth_unv");
  const ru1 = await api("POST", "/auth/claim-role", { body: { role: "GUIDE", profile: {} }, token: unvUser.token });
  assertEq(ru1.status, 403, `[AUTH] claim-role unverified → 403`);
  assertEq(ru1.body?.error?.code, "EMAIL_NOT_VERIFIED", `[AUTH] unverified → EMAIL_NOT_VERIFIED`);

  const unvUser2 = await createUnverifiedUser("auth_unv2");
  const ru2 = await api("GET", "/auth/me", { token: unvUser2.token });
  assertEq(ru2.status, 200, `[AUTH] /auth/me unverified → 200 (allowed)`);

  section("2e. Authentication — Refresh Token as Access Token");
  const rfUser = await createVerifiedUser("auth_rf");
  const ru3 = await api("GET", "/auth/me", { token: rfUser.refreshToken });
  assertEq(ru3.status, 401, `[AUTH] refresh token used as access → 401`);
}

// ═══════════════════════════════════════════════════════════════
// 3. AUTHORIZATION ATTACKS
// ═══════════════════════════════════════════════════════════════

async function testAuthorization(): Promise<void> {
  section("3. Authorization — Role-Based Access");

  const regUser = await createVerifiedUser("authz_user");
  const ra1 = await api("GET", "/auth/tour-agents", { token: regUser.token });
  assertEq(ra1.status, 403, `[AUTHZ] GET /auth/tour-agents: USER → 403`);
  assertEq(ra1.body?.error?.code, "INSUFFICIENT_PERMISSIONS", `[AUTHZ] USER → INSUFFICIENT_PERMISSIONS`);

  const regUser2 = await createVerifiedUser("authz_user2");
  const ra2 = await api("POST", "/auth/tour-agents", {
    body: { email: testEmail("authz_fake_ta"), firstName: "Fake", lastName: "Agent" },
    token: regUser2.token,
  });
  assertEq(ra2.status, 403, `[AUTHZ] POST /auth/tour-agents: USER → 403`);
}

// ═══════════════════════════════════════════════════════════════
// 4. BUSINESS LOGIC
// ═══════════════════════════════════════════════════════════════

async function testBusinessLogic(): Promise<void> {
  await flushRateLimits();
  section("4a. Business Logic — Duplicate Email");
  {
    const email = testEmail("biz_dup");
    const r1 = await api("POST", "/auth/register", { body: { email, password: TEST_PASSWORD, firstName: "Test", lastName: "Dup1" } });
    assertEq(r1.status, 201, `[BIZ] first registration → 201`);
    if (r1.status === 201) createdUserIds.push(r1.body.data.user.id);
    const r2 = await api("POST", "/auth/register", { body: { email, password: TEST_PASSWORD, firstName: "Test", lastName: "Dup2" } });
    assertEq(r2.status, 409, `[BIZ] duplicate email → 409`);
    assertEq(r2.body?.error?.code, "EMAIL_EXISTS", `[BIZ] duplicate → EMAIL_EXISTS`);
  }

  await flushRateLimits();
  section("4b. Business Logic — Login Failures");
  {
    const user = await createVerifiedUser("biz_login");
    const r1 = await api("POST", "/auth/login", { body: { email: user.email, password: "WrongPass123!" } });
    assertEq(r1.status, 401, `[BIZ] wrong password → 401`);
    assertEq(r1.body?.error?.code, "INVALID_CREDENTIALS", `[BIZ] wrong pw → INVALID_CREDENTIALS`);

    const r2 = await api("POST", "/auth/login", { body: { email: "nonexistent_99999@test.local", password: TEST_PASSWORD } });
    assertEq(r2.status, 401, `[BIZ] non-existent email → 401`);
    assertEq(r2.body?.error?.code, "INVALID_CREDENTIALS", `[BIZ] non-existent → INVALID_CREDENTIALS (no enumeration)`);
  }

  // Deactivated login
  {
    const deactUser = await createVerifiedUser("biz_deact");
    await prisma.user.update({ where: { id: deactUser.userId }, data: { isActive: false } });
    const res = await api("POST", "/auth/login", { body: { email: deactUser.email, password: TEST_PASSWORD } });
    assertEq(res.status, 401, `[BIZ] deactivated login → 401`);
    assertEq(res.body?.error?.code, "ACCOUNT_DISABLED", `[BIZ] deactivated → ACCOUNT_DISABLED`);
    await prisma.user.update({ where: { id: deactUser.userId }, data: { isActive: true } });
  }

  await flushRateLimits();
  section("4c. Business Logic — Account Lockout");
  {
    const lockUser = await createVerifiedUser("biz_lock");
    for (let i = 0; i < 5; i++) {
      await api("POST", "/auth/login", { body: { email: lockUser.email, password: "WrongPass123!" } });
    }
    const r1 = await api("POST", "/auth/login", { body: { email: lockUser.email, password: "WrongPass123!" } });
    assertEq(r1.status, 401, `[BIZ] locked after 5 fails → 401`);
    assertEq(r1.body?.error?.code, "ACCOUNT_LOCKED", `[BIZ] locked → ACCOUNT_LOCKED`);
    const r2 = await api("POST", "/auth/login", { body: { email: lockUser.email, password: TEST_PASSWORD } });
    assertEq(r2.status, 401, `[BIZ] correct pw but locked → 401`);
    assertEq(r2.body?.error?.code, "ACCOUNT_LOCKED", `[BIZ] correct pw + locked → ACCOUNT_LOCKED`);
    await prisma.user.update({ where: { id: lockUser.userId }, data: { failedLoginAttempts: 0, lockedUntil: null } });
  }

  await flushRateLimits();
  section("4d. Business Logic — Token Refresh");
  {
    const r1 = await api("POST", "/auth/refresh", { body: { refreshToken: "not.a.jwt" } });
    assertEq(r1.status, 401, `[BIZ] refresh random string → 401`);
    assertEq(r1.body?.error?.code, "MALFORMED_REFRESH_TOKEN", `[BIZ] random → MALFORMED_REFRESH_TOKEN`);
  }
  {
    const rfUser = await createVerifiedUser("biz_rf_rev");
    await api("POST", "/auth/logout", { body: { refreshToken: rfUser.refreshToken } });
    const r1 = await api("POST", "/auth/refresh", { body: { refreshToken: rfUser.refreshToken } });
    assertEq(r1.status, 401, `[BIZ] refresh revoked session → 401`);
  }
  {
    const rotUser = await createVerifiedUser("biz_rf_rot");
    const oldRefresh = rotUser.refreshToken;
    const r1 = await api("POST", "/auth/refresh", { body: { refreshToken: oldRefresh } });
    assertEq(r1.status, 200, `[BIZ] first refresh → 200`);
    if (r1.status === 200) assert(r1.body?.data?.refreshToken !== oldRefresh, `[BIZ] refresh returns new token`);
    const r2 = await api("POST", "/auth/refresh", { body: { refreshToken: oldRefresh } });
    assertEq(r2.status, 401, `[BIZ] old token after rotation → 401`);
  }

  section("4e. Business Logic — Logout");
  {
    const logUser = await createVerifiedUser("biz_logout");
    const r1 = await api("POST", "/auth/logout", { body: { refreshToken: logUser.refreshToken } });
    assertEq(r1.status, 200, `[BIZ] normal logout → 200`);
    assert(r1.body?.success === true, `[BIZ] logout success true`);
  }
  {
    const r1 = await api("POST", "/auth/logout", { body: { refreshToken: "not.a.jwt" } });
    assertEq(r1.status, 401, `[BIZ] logout invalid token → 401`);
  }

  section("4f. Business Logic — Logout All");
  {
    const laUser = await createVerifiedUser("biz_la");
    const r1 = await api("POST", "/auth/logout-all", { token: laUser.token, body: {} });
    assertEq(r1.status, 200, `[BIZ] logout-all → 200`);
    if (r1.status === 200) {
      assert(r1.body?.data?.revokedCount >= 1, `[BIZ] logout-all revokedCount >= 1`);
      const r2 = await api("GET", "/auth/me", { token: laUser.token });
      assertEq(r2.status, 401, `[BIZ] after logout-all → 401`);
      assertEq(r2.body?.error?.code, "SESSION_INVALIDATED", `[BIZ] after logout-all → SESSION_INVALIDATED`);
    }
  }

  section("4g. Business Logic — Claim Role");
  {
    const guideUser = await createVerifiedUser("biz_guide");
    const r1 = await api("POST", "/auth/claim-role", { body: { role: "GUIDE", profile: { bio: "Test", languages: ["en"] } }, token: guideUser.token });
    assertEq(r1.status, 200, `[BIZ] claim GUIDE → 200`);
    if (r1.status === 200) assert(r1.body?.data?.roles?.includes("GUIDE"), `[BIZ] user now has GUIDE`);
  }
  {
    const g2 = await createVerifiedUser("biz_guide2");
    await api("POST", "/auth/claim-role", { body: { role: "GUIDE", profile: {} }, token: g2.token });
    const r1 = await api("POST", "/auth/claim-role", { body: { role: "GUIDE", profile: {} }, token: g2.token });
    assertEq(r1.status, 400, `[BIZ] duplicate GUIDE → 400`);
    assertEq(r1.body?.error?.code, "ROLE_ALREADY_CLAIMED", `[BIZ] duplicate → ROLE_ALREADY_CLAIMED`);
  }
  {
    const driverUser = await createVerifiedUser("biz_driver");
    const r1 = await api("POST", "/auth/claim-role", { body: { role: "DRIVER", profile: { vehicleType: "Sedan", vehicleCapacity: 4 } }, token: driverUser.token });
    assertEq(r1.status, 200, `[BIZ] claim DRIVER → 200`);
    if (r1.status === 200) assert(r1.body?.data?.roles?.includes("DRIVER"), `[BIZ] user now has DRIVER`);
  }

  await flushRateLimits();
  section("4h. Business Logic — Forgot Password (No Enumeration)");
  {
    const r1 = await api("POST", "/auth/forgot-password", { body: { email: "nonexistent_fp_9999@test.local" } });
    assertEq(r1.status, 200, `[BIZ] forgot-password non-existent → 200`);
    const fpUser = await createVerifiedUser("biz_fp");
    const r2 = await api("POST", "/auth/forgot-password", { body: { email: fpUser.email } });
    assertEq(r2.status, 200, `[BIZ] forgot-password existing → 200`);
    if (r1.status === 200 && r2.status === 200) {
      assertEq(r1.body?.message, r2.body?.message, `[BIZ] forgot-password: same message (no enumeration)`);
    }
  }

  await flushRateLimits();
  section("4i. Business Logic — Verify/Reset/Invite with Invalid Tokens");
  {
    const r1 = await api("POST", "/auth/verify-email", { body: { token: "a".repeat(64) } });
    assertEq(r1.status, 400, `[BIZ] verify invalid token → 400`);
    assertEq(r1.body?.error?.code, "INVALID_VERIFICATION_TOKEN", `[BIZ] verify → INVALID_VERIFICATION_TOKEN`);
  }
  {
    const r1 = await api("POST", "/auth/reset-password", { body: { token: "b".repeat(64), newPassword: "NewPass123!" } });
    assertEq(r1.status, 400, `[BIZ] reset invalid token → 400`);
    assertEq(r1.body?.error?.code, "INVALID_RESET_TOKEN", `[BIZ] reset → INVALID_RESET_TOKEN`);
  }
  {
    const r1 = await api("POST", "/auth/accept-invitation", { body: { token: "c".repeat(64), password: TEST_PASSWORD } });
    assertEq(r1.status, 400, `[BIZ] accept-invitation invalid → 400`);
    assertEq(r1.body?.error?.code, "INVALID_INVITATION_TOKEN", `[BIZ] invite → INVALID_INVITATION_TOKEN`);
  }

  await flushRateLimits();
  section("4j. Business Logic — Resend Verification");
  {
    const r1 = await api("POST", "/auth/resend-verification", { body: { email: "nonexistent_resend@test.local" } });
    assertEq(r1.status, 200, `[BIZ] resend non-existent → 200`);
    const vUser = await createVerifiedUser("biz_resend_v");
    const r2 = await api("POST", "/auth/resend-verification", { body: { email: vUser.email } });
    assertEq(r2.status, 200, `[BIZ] resend already verified → 200`);
  }

  await flushRateLimits();
  section("4k. Business Logic — Email Case Insensitivity");
  {
    const lcEmail = testEmail("biz_case");
    // Create user directly via Prisma
    const pwHash = await argon2.hash(TEST_PASSWORD);
    const user = await prisma.user.create({
      data: { email: lcEmail, passwordHash: pwHash, firstName: "Test", lastName: "Case", emailVerified: true, roles: { create: { role: "USER" } } },
    });
    createdUserIds.push(user.id);
    // Register with uppercase version should fail
    const ucEmail = lcEmail.toUpperCase();
    const r1 = await api("POST", "/auth/register", { body: { email: ucEmail, password: TEST_PASSWORD, firstName: "Test", lastName: "Case2" } });
    assertEq(r1.status, 409, `[BIZ] uppercase duplicate → 409`);
    // Login with uppercase should work
    const r2 = await api("POST", "/auth/login", { body: { email: ucEmail, password: TEST_PASSWORD } });
    assertEq(r2.status, 200, `[BIZ] login uppercase email → 200`);
  }

  await flushRateLimits();
  section("4l. Business Logic — Tour Agent CRUD");
  {
    const coUser = await createVerifiedCompanyUser("biz_ta_co");
    const taEmail = testEmail("biz_ta_agent");
    const r1 = await api("POST", "/auth/tour-agents", { body: { email: taEmail, firstName: "Agent", lastName: "One" }, token: coUser.token });
    assertEq(r1.status, 201, `[BIZ] create tour agent → 201`);
    if (r1.status === 201) {
      createdUserIds.push(r1.body.data.user.id);
      assert(r1.body.data.user.roles.includes("TOUR_AGENT"), `[BIZ] agent has TOUR_AGENT role`);
      const r2 = await api("POST", "/auth/tour-agents", { body: { email: taEmail, firstName: "Agent", lastName: "Two" }, token: coUser.token });
      assertEq(r2.status, 409, `[BIZ] duplicate tour agent email → 409`);
    }
    const r3 = await api("GET", "/auth/tour-agents", { token: coUser.token });
    assertEq(r3.status, 200, `[BIZ] get tour agents → 200`);
    if (r3.status === 200) assert(Array.isArray(r3.body?.data), `[BIZ] tour agents data is array`);
  }

  await flushRateLimits();
  section("4m. Business Logic — Company Registration");
  {
    const email = testEmail("biz_co_reg");
    const r1 = await api("POST", "/auth/register-company", {
      body: { email, password: TEST_PASSWORD, firstName: "Test", lastName: "CoReg", companyName: "TestCo123", description: "A test", websiteUrl: "https://example.com" },
    });
    assertEq(r1.status, 201, `[BIZ] company register → 201`);
    if (r1.status === 201 && r1.body?.data?.user) {
      createdUserIds.push(r1.body.data.user.id);
      assert(r1.body.data.user.roles.includes("COMPANY"), `[BIZ] has COMPANY role`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 5. INJECTION & ABUSE
// ═══════════════════════════════════════════════════════════════

async function testInjectionAndAbuse(): Promise<void> {
  await flushRateLimits();
  section("5. Injection — SQL Injection");
  for (const payload of ["' OR 1=1 --", "'; DROP TABLE users; --", "' UNION SELECT * FROM users --"]) {
    const res = await api("POST", "/auth/login", { body: { email: payload, password: TEST_PASSWORD } });
    assert(res.status !== 500, `[INJECTION] SQLi email "${payload.substring(0, 20)}" → not 500 (got ${res.status})`);
  }

  await flushRateLimits();
  section("5b. Injection — XSS in Registration");
  for (const payload of ['<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '<svg onload=alert(1)>']) {
    const email = testEmail(`xss_${Math.random().toString(36).substring(7)}`);
    const res = await api("POST", "/auth/register", { body: { email, password: TEST_PASSWORD, firstName: payload, lastName: "Xss" } });
    assert(res.status !== 500, `[INJECTION] XSS in firstName → not 500 (got ${res.status})`);
    if (res.status === 201) createdUserIds.push(res.body.data.user.id);
  }

  await flushRateLimits();
  section("5c. Injection — Prototype Pollution / Large Payloads");
  const rpp = await api("POST", "/auth/login", { body: { email: "t@t.com", password: "t", __proto__: { admin: true } } });
  assert(rpp.status !== 500, `[INJECTION] prototype pollution → not 500 (got ${rpp.status})`);

  const rbig = await api("POST", "/auth/register", { body: { email: testEmail("big"), password: TEST_PASSWORD, firstName: "A".repeat(10000), lastName: "B" } });
  assert(rbig.status === 400 || rbig.status === 422, `[INJECTION] 10K firstName → ${rbig.status}`);

  const rlong = await api("POST", "/auth/register", { body: { email: "a".repeat(300) + "@t.com", password: TEST_PASSWORD, firstName: "Te", lastName: "Lo" } });
  assert(rlong.status === 400 || rlong.status === 422, `[INJECTION] 300 char email → ${rlong.status}`);

  await flushRateLimits();
  section("5d. Injection — Unicode / Null Bytes / CRLF");
  const runi = await api("POST", "/auth/register", { body: { email: testEmail("uni"), password: TEST_PASSWORD, firstName: "T\u200B\u200B", lastName: "U\u202E" } });
  assert(runi.status !== 500, `[INJECTION] unicode → not 500 (got ${runi.status})`);
  if (runi.status === 201) createdUserIds.push(runi.body.data.user.id);

  const rnull = await api("POST", "/auth/login", { body: { email: "t\x00admin@t.com", password: "t" } });
  assert(rnull.status !== 500, `[INJECTION] null byte → not 500 (got ${rnull.status})`);

  const rcrlf = await api("POST", "/auth/login", { body: { email: "t\r\nInjected: true@t.com", password: "t" } });
  assert(rcrlf.status !== 500, `[INJECTION] CRLF → not 500 (got ${rcrlf.status})`);
}

// ═══════════════════════════════════════════════════════════════
// 6. ERROR RESPONSE SHAPE
// ═══════════════════════════════════════════════════════════════

async function testErrorResponseShape(): Promise<void> {
  await flushRateLimits();
  section("6. Error Response Shape");
  const cases = [
    { m: "POST", p: "/auth/register", o: { body: {} }, l: "register empty" },
    { m: "POST", p: "/auth/login", o: { body: { email: "x@y.com", password: "wrong" } }, l: "login wrong" },
    { m: "GET", p: "/auth/me", o: undefined, l: "me no auth" },
    { m: "POST", p: "/auth/refresh", o: { body: { refreshToken: "bad" } }, l: "refresh bad" },
    { m: "POST", p: "/auth/verify-email", o: { body: { token: "x".repeat(64) } }, l: "verify bad" },
    { m: "POST", p: "/auth/reset-password", o: { body: { token: "x".repeat(64), newPassword: "NewPass123!" } }, l: "reset bad" },
  ];
  for (const { m, p, o, l } of cases) {
    const res = await api(m, p, o);
    assert(res.status >= 400, `[SHAPE] ${l}: status >= 400`);
    assertErrorShape(res, l);
  }
}

// ═══════════════════════════════════════════════════════════════
// 7. RACE CONDITIONS
// ═══════════════════════════════════════════════════════════════

async function testRaceConditions(): Promise<void> {
  await flushRateLimits();
  section("7a. Race — Concurrent Registration");
  {
    const raceEmail = testEmail("race_reg");
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        api("POST", "/auth/register", { body: { email: raceEmail, password: TEST_PASSWORD, firstName: "Race", lastName: "Test" } })
      )
    );
    const successes = results.filter((r) => r.status === 201);
    assert(successes.length <= 1, `[RACE] concurrent register: at most 1 success (got ${successes.length})`);
    for (const s of successes) createdUserIds.push(s.body.data.user.id);
    for (const r of results) {
      assert(r.status === 201 || r.status === 409 || r.status === 429 || r.status === 500, `[RACE] result is 201/409/429/500 (got ${r.status})`);
    }
  }

  await flushRateLimits();
  section("7b. Race — Concurrent Refresh");
  {
    const raceUser = await createVerifiedUser("race_rf");
    const results = await Promise.all(
      Array.from({ length: 3 }, () => api("POST", "/auth/refresh", { body: { refreshToken: raceUser.refreshToken } }))
    );
    const successes = results.filter((r) => r.status === 200);
    assert(successes.length <= 1, `[RACE] concurrent refresh: at most 1 success (got ${successes.length})`);
  }

  await flushRateLimits();
  section("7c. Race — Logout-All + Refresh");
  {
    const raceUser2 = await createVerifiedUser("race_la");
    const [r1, r2] = await Promise.all([
      api("POST", "/auth/logout-all", { token: raceUser2.token, body: {} }),
      api("POST", "/auth/refresh", { body: { refreshToken: raceUser2.refreshToken } }),
    ]);
    assert(r1.status !== 500, `[RACE] logout-all not 500 (got ${r1.status})`);
    assert(r2.status !== 500, `[RACE] refresh not 500 (got ${r2.status})`);
  }
}

// ═══════════════════════════════════════════════════════════════
// 8. CSRF PROTECTION
// ═══════════════════════════════════════════════════════════════

async function testCsrfProtection(): Promise<void> {
  await flushRateLimits();
  section("8. CSRF Protection");

  const rc1 = await api("POST", "/auth/login", { body: { email: "t@t.com", password: "t" }, skipCsrf: true });
  assertEq(rc1.status, 403, `[CSRF] no CSRF token → 403 (got ${rc1.status})`);

  const rc2 = await api("POST", "/auth/login", { body: { email: "t@t.com", password: "t" }, skipCsrf: true, headers: { "X-CSRF-Token": "invalid-12345" } });
  assertEq(rc2.status, 403, `[CSRF] invalid CSRF token → 403 (got ${rc2.status})`);

  const rc3 = await api("POST", "/auth/login", { body: { email: "t@t.com", password: "t" }, skipCsrf: true, headers: { "X-CSRF-Token": csrfToken } });
  assertEq(rc3.status, 403, `[CSRF] CSRF header but no cookie → 403 (got ${rc3.status})`);

  const rc4 = await fetch(`${BASE_URL}/auth/csrf-token`);
  assertEq(rc4.status, 200, `[CSRF] GET no CSRF needed → 200`);
}

// ═══════════════════════════════════════════════════════════════
// 9. RESPONSE STRUCTURE
// ═══════════════════════════════════════════════════════════════

async function testResponseStructure(): Promise<void> {
  await flushRateLimits();
  section("9a. Response Structure — Registration");
  {
    const email = testEmail("resp_reg");
    const res = await api("POST", "/auth/register", { body: { email, password: TEST_PASSWORD, firstName: "Test", lastName: "Resp" } });
    assertEq(res.status, 201, `[RESP] register → 201`);
    if (res.status === 201) {
      createdUserIds.push(res.body.data.user.id);
      assert(res.body.success === true, `[RESP] success true`);
      assert(typeof res.body.data.accessToken === "string", `[RESP] has accessToken`);
      assert(typeof res.body.data.refreshToken === "string", `[RESP] has refreshToken`);
      assert(typeof res.body.data.user.id === "string", `[RESP] user has id`);
      assert(Array.isArray(res.body.data.user.roles), `[RESP] user has roles`);
      const userStr = JSON.stringify(res.body.data.user);
      assert(!userStr.includes("passwordHash"), `[RESP] no passwordHash leaked`);
      assert(!userStr.includes("verificationToken"), `[RESP] no verificationToken leaked`);
    }
  }

  section("9b. Response Structure — /auth/me");
  {
    const meUser = await createVerifiedUser("resp_me");
    const res = await api("GET", "/auth/me", { token: meUser.token });
    assertEq(res.status, 200, `[RESP] /auth/me → 200`);
    assert(typeof res.body.data.id === "string", `[RESP] me has id`);
    assert(typeof res.body.data.email === "string", `[RESP] me has email`);
    assert(res.body.data.emailVerified === true, `[RESP] me emailVerified`);
    assert(!JSON.stringify(res.body.data).includes("passwordHash"), `[RESP] me no passwordHash`);
  }

  await flushRateLimits();
  section("9c. Response Structure — Refresh");
  {
    const rfUser = await createVerifiedUser("resp_rf");
    const res = await api("POST", "/auth/refresh", { body: { refreshToken: rfUser.refreshToken } });
    assertEq(res.status, 200, `[RESP] refresh → 200`);
    if (res.status === 200 && res.body?.data) {
      assert(typeof res.body.data.accessToken === "string", `[RESP] refresh has accessToken`);
      assert(typeof res.body.data.refreshToken === "string", `[RESP] refresh has refreshToken`);
    }
  }

  section("9d. Response Structure — CSRF Token");
  {
    const res = await fetch(`${BASE_URL}/auth/csrf-token`);
    const body = await res.json();
    assertEq(res.status, 200, `[RESP] CSRF token → 200`);
    assert(typeof body?.data?.csrfToken === "string", `[RESP] CSRF token is string`);
    assert(body.data.csrfToken.length > 0, `[RESP] CSRF token non-empty`);
  }
}

// ─── Main ────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n🔍 Bug Hunt: Auth Endpoints`);
  console.log(`${"═".repeat(60)}`);
  console.log(`Test prefix: ${TEST_PREFIX}\n`);

  // Initial rate limit flush
  await flushRateLimits();
  console.log("  🗑️  Rate limits flushed (will flush between sections too)");

  try {
    await fetchCsrf();

    await testInputValidation();
    await testAuthentication();
    await testAuthorization();
    await testBusinessLogic();
    await testInjectionAndAbuse();
    await testErrorResponseShape();
    await testRaceConditions();
    await testCsrfProtection();
    await testResponseStructure();
  } finally {
    await cleanup();
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`📊 Results: ${passed} passed, ${failed} failed, ${skippedDueToRateLimit} skipped (rate limited)`);

  if (skippedDueToRateLimit > 0) {
    console.log(`\n⚠️  ${skippedDueToRateLimit} tests skipped due to in-memory rate limiting.`);
    console.log(`   To run all tests, restart the server to reset rate limit counters.`);
  }

  if (failed > 0) {
    console.log("\n❌ FAILURES (real bugs, not rate limit):");
    for (const f of failures) console.log(`   • ${f}`);
    process.exit(1);
  } else {
    console.log("\n✅ All non-skipped tests passed!");
  }
}

main();
