/**
 * Exhaustive API bug-hunting tests for the Users endpoints.
 *
 * Categories: input validation, authentication, authorization, business logic,
 *             injection attacks, pagination, error shape, race conditions, CSRF.
 *
 * Run: npx tsx src/tests/users-hunt.test.ts
 */

import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

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
  opts: { body?: unknown; token?: string; headers?: Record<string, string>; skipCsrf?: boolean; rawBody?: string } = {}
): Promise<{ status: number; body: any; headers: Headers }> {
  const hasBody = opts.body !== undefined || opts.rawBody !== undefined;
  const headers: Record<string, string> = {
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
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

// ─── Test User Helpers ───────────────────────────────────────
// Creates users directly via Prisma to avoid register/login rate limits.
// Only uses HTTP login for the few users that need JWT tokens.

const TEST_PREFIX = `__hunt_${Date.now()}`;
const TEST_PASSWORD = "TestPass123!";
const createdUserIds: string[] = [];
let passwordHash = "";

function testEmail(suffix: string): string {
  return `${TEST_PREFIX}_${suffix}@test.local`;
}

/** Create a user directly via Prisma (bypasses rate limits). */
async function createUserViaPrisma(
  suffix: string,
  opts: { verified?: boolean; role?: string; active?: boolean } = {}
): Promise<{ userId: string; email: string }> {
  const email = testEmail(suffix);
  if (!passwordHash) passwordHash = await argon2.hash(TEST_PASSWORD);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: "Test",
      lastName: suffix,
      emailVerified: opts.verified ?? false,
      isActive: opts.active ?? true,
      roles: {
        create: { role: (opts.role || "USER") as any },
      },
    },
  });

  createdUserIds.push(user.id);
  return { userId: user.id, email };
}

/** Login via HTTP and return tokens. Handles rate limit gracefully. */
async function loginUser(email: string): Promise<{ token: string; refreshToken: string }> {
  const res = await api("POST", "/auth/login", {
    body: { email, password: TEST_PASSWORD },
  });
  if (res.status === 429) {
    throw new Error(`Login rate limited for ${email}. Restart server to clear in-memory rate limits.`);
  }
  if (res.status !== 200) throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  return {
    token: res.body.data.accessToken,
    refreshToken: res.body.data.refreshToken,
  };
}

/** Create a verified user via Prisma and login for token. */
async function createVerifiedUser(
  suffix: string
): Promise<{ token: string; refreshToken: string; userId: string; email: string }> {
  const { userId, email } = await createUserViaPrisma(suffix, { verified: true });
  const { token, refreshToken } = await loginUser(email);
  return { token, refreshToken, userId, email };
}

/** Create an unverified user via Prisma and login for token. */
async function createUnverifiedUser(
  suffix: string
): Promise<{ token: string; refreshToken: string; userId: string; email: string }> {
  const { userId, email } = await createUserViaPrisma(suffix, { verified: false });
  const { token, refreshToken } = await loginUser(email);
  return { token, refreshToken, userId, email };
}

/** Create a verified user with ADMIN role and login. */
async function createAdminUser(
  suffix: string
): Promise<{ token: string; refreshToken: string; userId: string; email: string }> {
  const { userId, email } = await createUserViaPrisma(suffix, { verified: true });
  // Add ADMIN role
  await prisma.userRoleAssignment.create({ data: { userId, role: "ADMIN" } });
  const { token, refreshToken } = await loginUser(email);
  return { token, refreshToken, userId, email };
}

/** Create a user via Prisma only (no login, no token). */
async function createTargetUser(
  suffix: string,
  opts: { verified?: boolean; role?: string; active?: boolean } = {}
): Promise<{ userId: string; email: string }> {
  return createUserViaPrisma(suffix, { verified: true, ...opts });
}

// ─── Error Shape Validator ───────────────────────────────────

function assertErrorShape(res: { status: number; body: any }, label: string): void {
  assertEq(res.body?.success, false, `${label}: success is false`);
  assert(typeof res.body?.error?.code === "string", `${label}: has string code`);
  assert(typeof res.body?.error?.message === "string", `${label}: has string message`);
  const bodyStr = JSON.stringify(res.body);
  assert(!bodyStr.includes("stack"), `${label}: no stack trace`);
  assert(!bodyStr.toLowerCase().includes("prisma"), `${label}: no Prisma leak`);
  assert(!bodyStr.includes("node_modules"), `${label}: no paths leaked`);
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
// 1. INPUT VALIDATION
// ═══════════════════════════════════════════════════════════════

async function testInputValidation(adminToken: string, regularUserId: string): Promise<void> {
  section("1. INPUT VALIDATION — POST /users (Admin Create)");

  // --- Missing required fields ---
  const requiredFields = ["email", "password", "firstName", "lastName"];
  const validBody = { email: testEmail("val_missing"), password: TEST_PASSWORD, firstName: "Test", lastName: "User" };

  for (const field of requiredFields) {
    const body = { ...validBody };
    delete (body as any)[field];
    const res = await api("POST", "/users", { body, token: adminToken });
    assert(res.status === 400 || res.status === 422, `POST /users: missing ${field} → 4xx`);
    assertErrorShape(res, `POST /users missing ${field}`);
  }

  // Empty body
  {
    const res = await api("POST", "/users", { body: {}, token: adminToken });
    assert(res.status === 400 || res.status === 422, "POST /users: empty body → 4xx");
  }

  // No body at all
  {
    const res = await api("POST", "/users", { token: adminToken });
    assert(res.status === 400 || res.status === 422, "POST /users: no body → 4xx");
  }

  // --- Wrong types ---
  {
    const res = await api("POST", "/users", { body: { ...validBody, email: 12345 }, token: adminToken });
    assert(res.status === 400 || res.status === 422, "POST /users: email as number → 4xx");
  }
  {
    const res = await api("POST", "/users", { body: { ...validBody, firstName: true }, token: adminToken });
    assert(res.status === 400 || res.status === 422, "POST /users: firstName as boolean → 4xx");
  }
  {
    const res = await api("POST", "/users", { body: { ...validBody, password: ["arr"] }, token: adminToken });
    assert(res.status === 400 || res.status === 422, "POST /users: password as array → 4xx");
  }

  // --- Boundary values ---
  {
    const res = await api("POST", "/users", { body: { ...validBody, password: "Short1!" }, token: adminToken });
    assert(res.status === 400 || res.status === 422, "POST /users: password 7 chars → 4xx");
  }
  {
    const res = await api("POST", "/users", { body: { ...validBody, firstName: "A" }, token: adminToken });
    assert(res.status === 400 || res.status === 422, "POST /users: firstName 1 char → 4xx");
  }
  {
    const res = await api("POST", "/users", { body: { ...validBody, lastName: "B" }, token: adminToken });
    assert(res.status === 400 || res.status === 422, "POST /users: lastName 1 char → 4xx");
  }

  // --- Invalid role value ---
  {
    const res = await api("POST", "/users", { body: { ...validBody, email: testEmail("val_badrole"), role: "SUPERADMIN" }, token: adminToken });
    assert(res.status === 400 || res.status === 422, "POST /users: invalid role SUPERADMIN → 4xx");
  }

  section("1. INPUT VALIDATION — PATCH /users/:id (Update)");

  // Invalid UUID in params
  {
    const res = await api("PATCH", "/users/not-a-uuid", { body: { firstName: "Test" }, token: adminToken });
    assert(res.status === 400 || res.status === 422, "PATCH /users/not-a-uuid → 4xx");
    assertErrorShape(res, "PATCH invalid UUID");
  }
  {
    const res = await api("PATCH", "/users/' OR 1=1 --", { body: { firstName: "Test" }, token: adminToken });
    assert(res.status === 400 || res.status === 422, "PATCH /users/SQLi in UUID → 4xx");
  }

  // Invalid email format
  {
    const res = await api("PATCH", `/users/${regularUserId}`, { body: { email: "not-an-email" }, token: adminToken });
    assert(res.status === 400 || res.status === 422, "PATCH /users: invalid email format → 4xx");
  }

  // Phone number too long (max 20)
  {
    const res = await api("PATCH", `/users/${regularUserId}`, { body: { phoneNumber: "1".repeat(21) }, token: adminToken });
    assert(res.status === 400 || res.status === 422, "PATCH /users: phoneNumber 21 chars → 4xx");
  }

  section("1. INPUT VALIDATION — PATCH /users/:id/role");

  // Missing role field
  {
    const res = await api("PATCH", `/users/${regularUserId}/role`, { body: {}, token: adminToken });
    assert(res.status === 400 || res.status === 422, "PATCH role: missing role → 4xx");
  }
  // Invalid role
  {
    const res = await api("PATCH", `/users/${regularUserId}/role`, { body: { role: "HACKER" }, token: adminToken });
    assert(res.status === 400 || res.status === 422, "PATCH role: invalid role HACKER → 4xx");
  }
  // Wrong type
  {
    const res = await api("PATCH", `/users/${regularUserId}/role`, { body: { role: 123 }, token: adminToken });
    assert(res.status === 400 || res.status === 422, "PATCH role: role as number → 4xx");
  }

  section("1. INPUT VALIDATION — DELETE /users/:id/roles/:role");

  // Invalid role in path
  {
    const res = await api("DELETE", `/users/${regularUserId}/roles/HACKER`, { token: adminToken });
    assert(res.status === 400 || res.status === 422, "DELETE role: invalid role HACKER → 4xx");
  }
  // Invalid UUID
  {
    const res = await api("DELETE", `/users/not-a-uuid/roles/USER`, { token: adminToken });
    assert(res.status === 400 || res.status === 422, "DELETE role: invalid UUID → 4xx");
  }

  section("1. INPUT VALIDATION — Malformed JSON / Content-Type");

  // Malformed JSON
  {
    const res = await api("POST", "/users", { rawBody: '{"email": "bad json', token: adminToken });
    assert(res.status === 400 || res.status === 422, "POST /users: malformed JSON → 4xx");
  }

  // Wrong Content-Type
  {
    const res = await api("POST", "/users", {
      rawBody: "email=test@test.com&password=Test1234!&firstName=Test&lastName=User",
      token: adminToken,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    assert(res.status === 400 || res.status === 415 || res.status === 422, "POST /users: wrong Content-Type → 4xx");
  }

  section("1. INPUT VALIDATION — Extra/Escalation Fields");

  {
    const body = { ...validBody, email: testEmail("val_extra"), isAdmin: true, superpower: "fly" };
    const res = await api("POST", "/users", { body, token: adminToken });
    if (res.status === 201) {
      const userId = res.body.data.id;
      createdUserIds.push(userId);
      assert(res.body.data.isAdmin === undefined, "POST /users: isAdmin field NOT in response");
    }
    assert(res.status !== 500, "POST /users: extra fields don't cause 500");
  }
}

// ═══════════════════════════════════════════════════════════════
// 2. AUTHENTICATION
// ═══════════════════════════════════════════════════════════════

async function testAuthentication(
  regularUserId: string,
  authMulti: { token: string; userId: string },
  unverified1: { token: string; userId: string }
): Promise<void> {
  section("2. AUTHENTICATION — Missing/Malformed Auth");

  // No auth header
  {
    const res = await api("GET", `/users/${regularUserId}`);
    assertEq(res.status, 401, "GET /users/:id: no auth header → 401");
    assertErrorShape(res, "no auth header");
  }

  // Empty Authorization header
  {
    const res = await api("GET", `/users/${regularUserId}`, { headers: { Authorization: "" } });
    assertEq(res.status, 401, "GET /users/:id: empty auth header → 401");
  }

  // No "Bearer " prefix
  {
    const res = await api("GET", `/users/${regularUserId}`, { headers: { Authorization: "some-token" } });
    assertEq(res.status, 401, "GET /users/:id: no Bearer prefix → 401");
  }

  // "Bearer" with no token
  {
    const res = await api("GET", `/users/${regularUserId}`, { headers: { Authorization: "Bearer" } });
    assertEq(res.status, 401, "GET /users/:id: Bearer with no token → 401");
  }

  // "Bearer " with just spaces
  {
    const res = await api("GET", `/users/${regularUserId}`, { headers: { Authorization: "Bearer   " } });
    assertEq(res.status, 401, "GET /users/:id: Bearer with spaces → 401");
  }

  // Random string as token
  {
    const res = await api("GET", `/users/${regularUserId}`, { token: "totally-not-a-jwt" });
    assertEq(res.status, 401, "GET /users/:id: random string token → 401");
    assertErrorShape(res, "random token");
  }

  // Modified JWT payload (tampered, not signed correctly)
  {
    const fakePayload = Buffer.from(JSON.stringify({ userId: "00000000-0000-0000-0000-000000000000", roles: ["ADMIN"], tokenVersion: 0, emailVerified: true })).toString("base64url");
    const fakeToken = `eyJhbGciOiJIUzI1NiJ9.${fakePayload}.invalidsignature`;
    const res = await api("GET", `/users/${regularUserId}`, { token: fakeToken });
    assertEq(res.status, 401, "GET /users/:id: tampered JWT → 401");
  }

  section("2. AUTHENTICATION — Token for Deleted/Deactivated/Stale User");

  // Use pre-created authMulti user - test multiple failure modes sequentially

  // Baseline: token works
  {
    const res = await api("GET", `/users/${authMulti.userId}`, { token: authMulti.token });
    assertEq(res.status, 200, "Auth multi: baseline token works → 200");
  }

  // Soft-delete → 401
  {
    await prisma.user.update({ where: { id: authMulti.userId }, data: { deletedAt: new Date() } });
    const res = await api("GET", `/users/${authMulti.userId}`, { token: authMulti.token });
    assertEq(res.status, 401, "GET /users/:id: token for soft-deleted user → 401");
    await prisma.user.update({ where: { id: authMulti.userId }, data: { deletedAt: null } });
  }

  // Deactivate → 401
  {
    await prisma.user.update({ where: { id: authMulti.userId }, data: { isActive: false } });
    const res = await api("GET", `/users/${authMulti.userId}`, { token: authMulti.token });
    assertEq(res.status, 401, "GET /users/:id: token for deactivated user → 401");
    await prisma.user.update({ where: { id: authMulti.userId }, data: { isActive: true } });
  }

  // Stale tokenVersion → 401
  {
    await prisma.user.update({ where: { id: authMulti.userId }, data: { tokenVersion: { increment: 1 } } });
    const res = await api("GET", `/users/${authMulti.userId}`, { token: authMulti.token });
    assertEq(res.status, 401, "GET /users/:id: stale tokenVersion → 401");
  }

  section("2. AUTHENTICATION — Unverified Email");

  // Unverified email on protected route (use pre-created unverified user)
  {
    const res = await api("GET", `/users/${unverified1.userId}`, { token: unverified1.token });
    assertEq(res.status, 403, "GET /users/:id: unverified email → 403");
    assertEq(res.body?.error?.code, "EMAIL_NOT_VERIFIED", "error code is EMAIL_NOT_VERIFIED");
  }

  // Admin-only endpoints with unverified user
  {
    const res = await api("GET", "/users", { token: unverified1.token });
    assertEq(res.status, 403, "GET /users: unverified email → 403");
  }
}

// ═══════════════════════════════════════════════════════════════
// 3. AUTHORIZATION
// ═══════════════════════════════════════════════════════════════

async function testAuthorization(
  adminToken: string,
  adminUserId: string,
  regularToken: string,
  regularUserId: string
): Promise<void> {
  section("3. AUTHORIZATION — Regular User on Admin-Only Endpoints");

  // POST /users (admin-only)
  {
    const res = await api("POST", "/users", {
      body: { email: testEmail("authz_noperm"), password: TEST_PASSWORD, firstName: "Test", lastName: "NoAuth" },
      token: regularToken,
    });
    assertEq(res.status, 403, "POST /users: regular user → 403");
    assertEq(res.body?.error?.code, "INSUFFICIENT_PERMISSIONS", "code: INSUFFICIENT_PERMISSIONS");
  }

  // GET /users (admin-only)
  {
    const res = await api("GET", "/users", { token: regularToken });
    assertEq(res.status, 403, "GET /users: regular user → 403");
  }

  // PATCH /users/:id/role (admin-only)
  {
    const res = await api("PATCH", `/users/${regularUserId}/role`, {
      body: { role: "ADMIN" },
      token: regularToken,
    });
    assertEq(res.status, 403, "PATCH /users/:id/role: regular user → 403");
  }

  // DELETE /users/:id/roles/:role (admin-only)
  {
    const res = await api("DELETE", `/users/${regularUserId}/roles/USER`, { token: regularToken });
    assertEq(res.status, 403, "DELETE /users/:id/roles/:role: regular user → 403");
  }

  // POST /users/:id/unlock (admin-only)
  {
    const res = await api("POST", `/users/${regularUserId}/unlock`, { token: regularToken });
    assertEq(res.status, 403, "POST /users/:id/unlock: regular user → 403");
  }

  // POST /users/:id/restore (admin-only)
  {
    const res = await api("POST", `/users/${regularUserId}/restore`, { token: regularToken });
    assertEq(res.status, 403, "POST /users/:id/restore: regular user → 403");
  }

  section("3. AUTHORIZATION — Cross-User Access (requireSelfOrAdmin)");

  const { userId: user2Id } = await createTargetUser("authz_user2");

  // User A tries to GET User B → should fail
  {
    const res = await api("GET", `/users/${user2Id}`, { token: regularToken });
    assertEq(res.status, 403, "GET /users/:id: User A reads User B → 403");
  }

  // User A tries to PATCH User B → should fail
  {
    const res = await api("PATCH", `/users/${user2Id}`, {
      body: { firstName: "Hacked" },
      token: regularToken,
    });
    assertEq(res.status, 403, "PATCH /users/:id: User A updates User B → 403");
  }

  // User A tries to DELETE User B → should fail
  {
    const res = await api("DELETE", `/users/${user2Id}`, { token: regularToken });
    assertEq(res.status, 403, "DELETE /users/:id: User A deletes User B → 403");
  }

  section("3. AUTHORIZATION — Admin CAN Access Other Users");

  // Admin reads regular user → 200
  {
    const res = await api("GET", `/users/${regularUserId}`, { token: adminToken });
    assertEq(res.status, 200, "GET /users/:id: admin reads regular user → 200");
  }

  // Admin updates regular user → 200
  {
    const res = await api("PATCH", `/users/${regularUserId}`, {
      body: { firstName: "AdminUpdated" },
      token: adminToken,
    });
    assertEq(res.status, 200, "PATCH /users/:id: admin updates regular user → 200");
  }

  // Self-access → 200
  {
    const res = await api("GET", `/users/${regularUserId}`, { token: regularToken });
    assertEq(res.status, 200, "GET /users/:id: user reads own data → 200");
  }
}

// ═══════════════════════════════════════════════════════════════
// 4. BUSINESS LOGIC
// ═══════════════════════════════════════════════════════════════

async function testBusinessLogic(
  adminToken: string,
  adminUserId: string,
  regularToken: string,
  regularUserId: string,
  regularEmail: string,
  selfDelUser: { token: string; userId: string }
): Promise<void> {
  section("4. BUSINESS LOGIC — POST /users (Admin Create)");

  // Happy path: create a user
  {
    const email = testEmail("biz_create");
    const res = await api("POST", "/users", {
      body: { email, password: TEST_PASSWORD, firstName: "Biz", lastName: "Create" },
      token: adminToken,
    });
    assertEq(res.status, 201, "POST /users: create user → 201");
    assert(res.body?.data?.id !== undefined, "POST /users: response has user id");
    assert(res.body?.data?.email === email, "POST /users: response has correct email");
    assert(res.body?.data?.passwordHash === undefined, "POST /users: no passwordHash leaked");
    assert(res.body?.data?.verificationToken === undefined, "POST /users: no verificationToken leaked");
    if (res.body?.data?.id) createdUserIds.push(res.body.data.id);
  }

  // Create with specific role
  {
    const email = testEmail("biz_create_company");
    const res = await api("POST", "/users", {
      body: { email, password: TEST_PASSWORD, firstName: "Biz", lastName: "Company", role: "COMPANY" },
      token: adminToken,
    });
    assertEq(res.status, 201, "POST /users: create with role COMPANY → 201");
    assert(
      res.body?.data?.roles?.includes("COMPANY"),
      "POST /users: user has COMPANY role"
    );
    if (res.body?.data?.id) createdUserIds.push(res.body.data.id);
  }

  // Duplicate email → 409
  {
    const res = await api("POST", "/users", {
      body: { email: regularEmail, password: TEST_PASSWORD, firstName: "Dup", lastName: "Email" },
      token: adminToken,
    });
    assertEq(res.status, 409, "POST /users: duplicate email → 409");
    assertEq(res.body?.error?.code, "EMAIL_EXISTS", "error code: EMAIL_EXISTS");
  }

  section("4. BUSINESS LOGIC — PATCH /users/:id (Self vs Admin)");

  // Self-update: update own firstName
  {
    const res = await api("PATCH", `/users/${regularUserId}`, {
      body: { firstName: "SelfUpdated" },
      token: regularToken,
    });
    assertEq(res.status, 200, "PATCH self: update firstName → 200");
    assertEq(res.body?.data?.firstName, "SelfUpdated", "PATCH self: firstName changed");
  }

  // Self-update: try to set isActive (should be ignored by self schema)
  {
    const res = await api("PATCH", `/users/${regularUserId}`, {
      body: { isActive: false },
      token: regularToken,
    });
    if (res.status === 200) {
      const getRes = await api("GET", `/users/${regularUserId}`, { token: regularToken });
      assertEq(getRes.body?.data?.isActive, true, "PATCH self: isActive field ignored (still true)");
    } else {
      assert(res.status === 400 || res.status === 422, "PATCH self: isActive → rejected or ignored");
    }
  }

  // Admin-update: set isActive to false
  {
    const { userId: targetId } = await createTargetUser("biz_admin_deactivate");
    const res = await api("PATCH", `/users/${targetId}`, {
      body: { isActive: false },
      token: adminToken,
    });
    assertEq(res.status, 200, "PATCH admin: set isActive=false → 200");
    assertEq(res.body?.data?.isActive, false, "PATCH admin: isActive is false");
  }

  // Self-update: update emailNotifications
  {
    const res = await api("PATCH", `/users/${regularUserId}`, {
      body: { emailNotifications: false },
      token: regularToken,
    });
    assertEq(res.status, 200, "PATCH self: update emailNotifications → 200");
    assertEq(res.body?.data?.emailNotifications, false, "PATCH self: emailNotifications changed");
    // Restore
    await api("PATCH", `/users/${regularUserId}`, { body: { emailNotifications: true }, token: regularToken });
  }

  // BUG TEST: Email update silently fails (repo doesn't include email in update data)
  {
    const { userId: targetId } = await createTargetUser("biz_email_bug");
    const newEmail = testEmail("biz_email_updated");
    const res = await api("PATCH", `/users/${targetId}`, {
      body: { email: newEmail },
      token: adminToken,
    });
    assertEq(res.status, 200, "PATCH: email update request → 200");
    const getRes = await api("GET", `/users/${targetId}`, { token: adminToken });
    assertEq(
      getRes.body?.data?.email, newEmail,
      "BUG: PATCH email update → email should change in DB (repo bug: email not in update query)"
    );
  }

  section("4. BUSINESS LOGIC — PATCH /users/:id/role (Add Role)");

  // Add GUIDE role
  {
    const { userId: targetId } = await createTargetUser("biz_add_role");
    const res = await api("PATCH", `/users/${targetId}/role`, {
      body: { role: "GUIDE" },
      token: adminToken,
    });
    assertEq(res.status, 200, "PATCH role: add GUIDE → 200");
    assert(res.body?.data?.roles?.includes("GUIDE"), "PATCH role: user now has GUIDE role");
  }

  // Add same role again (idempotent via upsert)
  {
    const { userId: targetId } = await createTargetUser("biz_add_role_dup");
    await api("PATCH", `/users/${targetId}/role`, { body: { role: "DRIVER" }, token: adminToken });
    const res = await api("PATCH", `/users/${targetId}/role`, { body: { role: "DRIVER" }, token: adminToken });
    assertEq(res.status, 200, "PATCH role: add duplicate DRIVER → 200 (idempotent)");
    const driverCount = res.body?.data?.roles?.filter((r: string) => r === "DRIVER").length;
    assertEq(driverCount, 1, "PATCH role: DRIVER role appears only once");
  }

  // Non-existent user
  {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const res = await api("PATCH", `/users/${fakeId}/role`, { body: { role: "GUIDE" }, token: adminToken });
    assertEq(res.status, 404, "PATCH role: non-existent user → 404");
  }

  section("4. BUSINESS LOGIC — DELETE /users/:id/roles/:role (Remove Role)");

  // Remove a role that exists
  {
    const { userId: targetId } = await createTargetUser("biz_rm_role");
    await api("PATCH", `/users/${targetId}/role`, { body: { role: "GUIDE" }, token: adminToken });
    const res = await api("DELETE", `/users/${targetId}/roles/GUIDE`, { token: adminToken });
    assertEq(res.status, 200, "DELETE role: remove GUIDE → 200");
    assert(!res.body?.data?.roles?.includes("GUIDE"), "DELETE role: GUIDE removed from roles");
  }

  // Remove a role user doesn't have (deleteMany is a no-op)
  {
    const { userId: targetId } = await createTargetUser("biz_rm_role_missing");
    const res = await api("DELETE", `/users/${targetId}/roles/DRIVER`, { token: adminToken });
    assertEq(res.status, 200, "DELETE role: remove non-existent DRIVER → 200 (no-op)");
  }

  section("4. BUSINESS LOGIC — DELETE /users/:id (Soft Delete)");

  // Soft delete via admin
  {
    const { userId: targetId } = await createTargetUser("biz_delete");
    const res = await api("DELETE", `/users/${targetId}`, { token: adminToken });
    assertEq(res.status, 200, "DELETE /users/:id → 200");
    const dbUser = await prisma.user.findUnique({ where: { id: targetId } });
    assert(dbUser?.deletedAt !== null, "DELETE: deletedAt is set (soft delete)");
    assert(dbUser !== null, "DELETE: user still exists in DB (not hard deleted)");
  }

  // Delete already-deleted user → 404
  {
    const { userId: targetId } = await createTargetUser("biz_delete_twice");
    await api("DELETE", `/users/${targetId}`, { token: adminToken });
    const res = await api("DELETE", `/users/${targetId}`, { token: adminToken });
    assertEq(res.status, 404, "DELETE: already deleted user → 404");
  }

  // Self-delete (use pre-created user to avoid extra login)
  {
    const res = await api("DELETE", `/users/${selfDelUser.userId}`, { token: selfDelUser.token });
    assertEq(res.status, 200, "DELETE /users/:id: self-delete → 200");
  }

  // Non-existent user
  {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const res = await api("DELETE", `/users/${fakeId}`, { token: adminToken });
    assertEq(res.status, 404, "DELETE: non-existent user → 404");
  }

  section("4. BUSINESS LOGIC — POST /users/:id/unlock");

  // Unlock a locked user
  {
    const { userId: targetId } = await createTargetUser("biz_unlock");
    await prisma.user.update({
      where: { id: targetId },
      data: { failedLoginAttempts: 5, lockedUntil: new Date(Date.now() + 3600000) },
    });
    const res = await api("POST", `/users/${targetId}/unlock`, { token: adminToken });
    assertEq(res.status, 200, "POST unlock: locked user → 200");
    const dbUser = await prisma.user.findUnique({ where: { id: targetId } });
    assertEq(dbUser?.failedLoginAttempts, 0, "POST unlock: failedLoginAttempts reset to 0");
    assertEq(dbUser?.lockedUntil, null, "POST unlock: lockedUntil reset to null");
  }

  // Unlock a user that's not locked → 404
  {
    const { userId: targetId } = await createTargetUser("biz_unlock_notlocked");
    const res = await api("POST", `/users/${targetId}/unlock`, { token: adminToken });
    assertEq(res.status, 404, "POST unlock: not locked user → 404");
    assertEq(res.body?.error?.code, "USER_NOT_LOCKED", "error code: USER_NOT_LOCKED");
  }

  // Unlock non-existent user → 404
  {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const res = await api("POST", `/users/${fakeId}/unlock`, { token: adminToken });
    assertEq(res.status, 404, "POST unlock: non-existent user → 404");
  }

  // Unlock user with failed attempts but no lock
  {
    const { userId: targetId } = await createTargetUser("biz_unlock_attempts");
    await prisma.user.update({ where: { id: targetId }, data: { failedLoginAttempts: 3 } });
    const res = await api("POST", `/users/${targetId}/unlock`, { token: adminToken });
    assertEq(res.status, 200, "POST unlock: user with failed attempts only → 200");
  }

  section("4. BUSINESS LOGIC — POST /users/:id/restore");

  // Restore a soft-deleted user
  {
    const { userId: targetId } = await createTargetUser("biz_restore");
    await prisma.user.update({ where: { id: targetId }, data: { deletedAt: new Date(), isActive: false } });
    const res = await api("POST", `/users/${targetId}/restore`, { token: adminToken });
    assertEq(res.status, 200, "POST restore: deleted user → 200");
    assertEq(res.body?.data?.isActive, true, "POST restore: isActive reset to true");
    const dbUser = await prisma.user.findUnique({ where: { id: targetId } });
    assertEq(dbUser?.deletedAt, null, "POST restore: deletedAt is null");
  }

  // Restore a non-deleted user → 404
  {
    const { userId: targetId } = await createTargetUser("biz_restore_active");
    const res = await api("POST", `/users/${targetId}/restore`, { token: adminToken });
    assertEq(res.status, 404, "POST restore: active user → 404");
    assertEq(res.body?.error?.code, "DELETED_USER_NOT_FOUND", "error code: DELETED_USER_NOT_FOUND");
  }

  // Restore non-existent user → 404
  {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const res = await api("POST", `/users/${fakeId}/restore`, { token: adminToken });
    assertEq(res.status, 404, "POST restore: non-existent user → 404");
  }

  section("4. BUSINESS LOGIC — Safe User Response Checks");

  {
    const res = await api("GET", `/users/${regularUserId}`, { token: adminToken });
    assertEq(res.status, 200, "GET user: response shape check");
    const data = res.body?.data;
    assert(data?.passwordHash === undefined, "SafeUser: no passwordHash");
    assert(data?.verificationToken === undefined, "SafeUser: no verificationToken");
    assert(data?.resetPasswordToken === undefined, "SafeUser: no resetPasswordToken");
    assert(data?.tokenVersion === undefined, "SafeUser: no tokenVersion");
    assert(data?.failedLoginAttempts === undefined, "SafeUser: no failedLoginAttempts");
    assert(data?.lockedUntil === undefined, "SafeUser: no lockedUntil");
    assert(typeof data?.id === "string", "SafeUser: has id");
    assert(typeof data?.email === "string", "SafeUser: has email");
    assert(typeof data?.firstName === "string", "SafeUser: has firstName");
    assert(typeof data?.lastName === "string", "SafeUser: has lastName");
    assert(Array.isArray(data?.roles), "SafeUser: has roles array");
    assert(typeof data?.isActive === "boolean", "SafeUser: has isActive");
    assert(typeof data?.emailVerified === "boolean", "SafeUser: has emailVerified");
  }
}

// ═══════════════════════════════════════════════════════════════
// 5. INJECTION & ABUSE
// ═══════════════════════════════════════════════════════════════

async function testInjectionAndAbuse(adminToken: string, regularUserId: string): Promise<void> {
  section("5. INJECTION & ABUSE — SQL Injection");

  // SQL injection in UUID param
  {
    const res = await api("GET", `/users/' OR 1=1 --`, { token: adminToken });
    assert(res.status !== 500, "GET /users/SQLi: no 500");
    assert(res.status === 400 || res.status === 422, "GET /users/SQLi: → 4xx");
  }

  // SQL injection in query params
  {
    const res = await api("GET", `/users?page=1;DROP TABLE users`, { token: adminToken });
    assert(res.status !== 500, "GET /users?SQLi page: no 500");
  }

  // SQL injection in body fields
  {
    const email = testEmail("inj_sqli_body");
    const res = await api("POST", "/users", {
      body: { email, password: TEST_PASSWORD, firstName: "'; DROP TABLE users; --", lastName: "SQLi" },
      token: adminToken,
    });
    assert(res.status !== 500, "POST /users SQLi in firstName: no 500");
    if (res.status === 201 && res.body?.data?.id) {
      createdUserIds.push(res.body.data.id);
      assertEq(res.body.data.firstName, "'; DROP TABLE users; --", "SQLi stored literally, not executed");
    }
  }

  section("5. INJECTION & ABUSE — XSS in Stored Fields");

  {
    const email = testEmail("inj_xss");
    const res = await api("POST", "/users", {
      body: { email, password: TEST_PASSWORD, firstName: "<script>alert(1)</script>", lastName: "<img src=x onerror=alert(1)>" },
      token: adminToken,
    });
    assert(res.status !== 500, "POST /users XSS payloads: no 500");
    if (res.status === 201 && res.body?.data?.id) {
      createdUserIds.push(res.body.data.id);
      console.log("    ⚠️  NOTE: XSS payloads stored as-is in firstName/lastName (client must escape)");
    }
  }

  section("5. INJECTION & ABUSE — Prototype Pollution");

  {
    const email = testEmail("inj_proto");
    const res = await api("POST", "/users", {
      body: {
        email, password: TEST_PASSWORD, firstName: "Proto", lastName: "Test",
        "__proto__": { "admin": true },
        "constructor": { "prototype": { "isAdmin": true } },
      },
      token: adminToken,
    });
    assert(res.status !== 500, "POST /users prototype pollution: no 500");
    if (res.status === 201 && res.body?.data?.id) createdUserIds.push(res.body.data.id);
  }

  section("5. INJECTION & ABUSE — Huge Payloads");

  {
    const res = await api("POST", "/users", {
      body: { email: testEmail("inj_huge"), password: TEST_PASSWORD, firstName: "A".repeat(10000), lastName: "Huge" },
      token: adminToken,
    });
    assert(res.status !== 500, "POST /users: 10K char firstName: no 500");
    if (res.status === 201 && res.body?.data?.id) {
      createdUserIds.push(res.body.data.id);
      console.log("    ⚠️  NOTE: 10K char firstName accepted (no max length validation on firstName in schema)");
    }
  }

  section("5. INJECTION & ABUSE — Path Traversal in :id");

  {
    const res = await api("GET", `/users/../../etc/passwd`, { token: adminToken });
    assert(res.status !== 500, "GET /users/path-traversal: no 500");
    assert(res.status === 400 || res.status === 422, "GET /users/path-traversal: → 4xx");
  }

  section("5. INJECTION & ABUSE — Special Characters");

  {
    const res = await api("PATCH", `/users/${regularUserId}`, {
      body: { firstName: "Test\0Admin" },
      token: adminToken,
    });
    assert(res.status !== 500, "PATCH: null byte in firstName: no 500");
  }

  {
    const res = await api("PATCH", `/users/${regularUserId}`, {
      body: { firstName: "テスト🎉" },
      token: adminToken,
    });
    assert(res.status !== 500, "PATCH: unicode/emoji in firstName: no 500");
    if (res.status === 200) {
      assertEq(res.body?.data?.firstName, "テスト🎉", "PATCH: unicode stored correctly");
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 6. PAGINATION (GET /users)
// ═══════════════════════════════════════════════════════════════

async function testPagination(adminToken: string): Promise<void> {
  section("6. PAGINATION — Invalid Values");

  {
    const res = await api("GET", "/users?page=0", { token: adminToken });
    assert(res.status === 400 || res.status === 422, "GET /users: page=0 → 4xx");
  }
  {
    const res = await api("GET", "/users?page=-1", { token: adminToken });
    assert(res.status === 400 || res.status === 422, "GET /users: page=-1 → 4xx");
  }
  {
    const res = await api("GET", "/users?page=abc", { token: adminToken });
    assert(res.status === 400 || res.status === 422, "GET /users: page=abc → 4xx");
  }
  {
    const res = await api("GET", "/users?page=1.5", { token: adminToken });
    assert(res.status === 400 || res.status === 422, "GET /users: page=1.5 → 4xx");
  }
  {
    const res = await api("GET", "/users?limit=0", { token: adminToken });
    assert(res.status === 400 || res.status === 422, "GET /users: limit=0 → 4xx");
  }
  {
    const res = await api("GET", "/users?limit=-1", { token: adminToken });
    assert(res.status === 400 || res.status === 422, "GET /users: limit=-1 → 4xx");
  }
  {
    const res = await api("GET", "/users?limit=101", { token: adminToken });
    assert(res.status === 400 || res.status === 422, "GET /users: limit=101 → 4xx");
  }
  {
    const res = await api("GET", "/users?limit=abc", { token: adminToken });
    assert(res.status === 400 || res.status === 422, "GET /users: limit=abc → 4xx");
  }

  section("6. PAGINATION — Valid Requests");

  {
    const res = await api("GET", "/users", { token: adminToken });
    assertEq(res.status, 200, "GET /users: default pagination → 200");
    assert(Array.isArray(res.body?.data?.items), "GET /users: has items array");
    const pg = res.body?.data?.pagination;
    assert(pg !== undefined, "GET /users: has pagination object");
    assertEq(pg?.page, 1, "GET /users: default page is 1");
    assertEq(pg?.limit, 10, "GET /users: default limit is 10");
    assert(typeof pg?.totalItems === "number", "GET /users: totalItems is number");
    assert(typeof pg?.totalPages === "number", "GET /users: totalPages is number");
    assert(typeof pg?.hasNextPage === "boolean", "GET /users: hasNextPage is boolean");
    assert(typeof pg?.hasPreviousPage === "boolean", "GET /users: hasPreviousPage is boolean");
    assertEq(pg?.hasPreviousPage, false, "GET /users: page 1 has no previous page");
  }

  {
    const res = await api("GET", "/users?page=99999", { token: adminToken });
    assertEq(res.status, 200, "GET /users: page beyond total → 200");
    assertEq(res.body?.data?.items?.length, 0, "GET /users: page beyond total → empty items");
    assert(res.body?.data?.pagination?.totalItems >= 0, "GET /users: totalItems still present");
  }

  {
    const res = await api("GET", "/users?page=1&limit=2", { token: adminToken });
    assertEq(res.status, 200, "GET /users: page=1&limit=2 → 200");
    assert(res.body?.data?.items?.length <= 2, "GET /users: respects limit=2");
    assertEq(res.body?.data?.pagination?.limit, 2, "GET /users: pagination shows limit=2");
  }
}

// ═══════════════════════════════════════════════════════════════
// 7. ERROR RESPONSE SHAPE
// ═══════════════════════════════════════════════════════════════

async function testErrorResponseShape(adminToken: string, regularUser: { token: string; userId: string }): Promise<void> {
  section("7. ERROR RESPONSE SHAPE");

  // 401
  {
    const res = await api("GET", "/users");
    assertErrorShape(res, "401 shape");
  }

  // 403 (use existing regular user token - non-admin on admin endpoint)
  {
    const res = await api("GET", "/users", { token: regularUser.token });
    assertErrorShape(res, "403 shape");
  }

  // 404
  {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const res = await api("GET", `/users/${fakeId}`, { token: adminToken });
    assertErrorShape(res, "404 shape");
  }

  // 409
  {
    const { email } = await createTargetUser("err_shape_409");
    const res = await api("POST", "/users", {
      body: { email, password: TEST_PASSWORD, firstName: "Dup", lastName: "Test" },
      token: adminToken,
    });
    assertErrorShape(res, "409 shape");
  }

  // 422 validation
  {
    const res = await api("POST", "/users", { body: {}, token: adminToken });
    assertErrorShape(res, "422 validation shape");
  }
}

// ═══════════════════════════════════════════════════════════════
// 8. RACE CONDITIONS
// ═══════════════════════════════════════════════════════════════

async function testRaceConditions(adminToken: string): Promise<void> {
  section("8. RACE CONDITIONS — Concurrent User Creation (Same Email)");

  {
    const email = testEmail("race_create");
    const body = { email, password: TEST_PASSWORD, firstName: "Race", lastName: "Test" };

    const results = await Promise.all(
      Array.from({ length: 5 }, () => api("POST", "/users", { body, token: adminToken }))
    );

    const created = results.filter((r) => r.status === 201);
    const conflicts = results.filter((r) => r.status === 409);
    const errors500 = results.filter((r) => r.status === 500);

    for (const r of created) {
      if (r.body?.data?.id) createdUserIds.push(r.body.data.id);
    }

    assert(created.length <= 1, `Race create: at most 1 created (got ${created.length})`);
    assertEq(errors500.length, 0, "Race create: no 500 errors");
    console.log(`    Created: ${created.length}, Conflicts: ${conflicts.length}, 500s: ${errors500.length}`);
  }

  section("8. RACE CONDITIONS — Concurrent Delete + Update");

  {
    const { userId: targetId } = await createTargetUser("race_del_upd");

    const [delRes, updRes] = await Promise.all([
      api("DELETE", `/users/${targetId}`, { token: adminToken }),
      api("PATCH", `/users/${targetId}`, { body: { firstName: "Racing" }, token: adminToken }),
    ]);

    assert(delRes.status !== 500, "Race delete+update: DELETE no 500");
    assert(updRes.status !== 500, "Race delete+update: PATCH no 500");
    console.log(`    DELETE: ${delRes.status}, PATCH: ${updRes.status}`);
  }

  section("8. RACE CONDITIONS — Concurrent Role Add (Same Role)");

  {
    const { userId: targetId } = await createTargetUser("race_role_add");

    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        api("PATCH", `/users/${targetId}/role`, { body: { role: "GUIDE" }, token: adminToken })
      )
    );

    const successes = results.filter((r) => r.status === 200);
    const errors500 = results.filter((r) => r.status === 500);

    assertEq(errors500.length, 0, "Race role add: no 500 errors");
    console.log(`    Successes: ${successes.length}, 500s: ${errors500.length}`);

    const getRes = await api("GET", `/users/${targetId}`, { token: adminToken });
    const guideCount = getRes.body?.data?.roles?.filter((r: string) => r === "GUIDE").length ?? 0;
    assertEq(guideCount, 1, "Race role add: GUIDE role appears only once after concurrent adds");
  }
}

// ═══════════════════════════════════════════════════════════════
// 9. CSRF PROTECTION
// ═══════════════════════════════════════════════════════════════

async function testCsrfProtection(adminToken: string, regularUserId: string): Promise<void> {
  section("9. CSRF PROTECTION");

  // POST without CSRF token
  {
    const res = await api("POST", "/users", {
      body: { email: testEmail("csrf_no_token"), password: TEST_PASSWORD, firstName: "CSRF", lastName: "Test" },
      token: adminToken,
      skipCsrf: true,
    });
    assertEq(res.status, 403, "POST /users: no CSRF token → 403");
  }

  // PATCH without CSRF token
  {
    const res = await api("PATCH", `/users/${regularUserId}`, {
      body: { firstName: "CSRFtest" },
      token: adminToken,
      skipCsrf: true,
    });
    assertEq(res.status, 403, "PATCH /users: no CSRF token → 403");
  }

  // DELETE without CSRF token
  {
    const { userId: targetId } = await createTargetUser("csrf_delete");
    const res = await api("DELETE", `/users/${targetId}`, {
      token: adminToken,
      skipCsrf: true,
    });
    assertEq(res.status, 403, "DELETE /users: no CSRF token → 403");
  }

  // Invalid CSRF token
  {
    const res = await api("POST", `/users/${regularUserId}/unlock`, {
      token: adminToken,
      skipCsrf: true,
      headers: { "X-CSRF-Token": "totally-invalid-csrf-token" },
    });
    assertEq(res.status, 403, "POST unlock: invalid CSRF token → 403");
  }

  // GET works without CSRF
  {
    const res = await api("GET", `/users/${regularUserId}`, { token: adminToken });
    assertEq(res.status, 200, "GET /users/:id: works without CSRF → 200");
  }
}

// ═══════════════════════════════════════════════════════════════
// 10. ADDITIONAL EDGE CASES
// ═══════════════════════════════════════════════════════════════

async function testAdditionalEdgeCases(adminToken: string, regularUserId: string): Promise<void> {
  section("10. ADDITIONAL EDGE CASES");

  // Non-existent UUID
  {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const res = await api("GET", `/users/${fakeId}`, { token: adminToken });
    assertEq(res.status, 404, "GET /users: non-existent UUID → 404");
    assertEq(res.body?.error?.code, "USER_NOT_FOUND", "error code: USER_NOT_FOUND");
  }

  // PATCH with empty body
  {
    const res = await api("PATCH", `/users/${regularUserId}`, { body: {}, token: adminToken });
    assert(res.status === 200 || res.status === 400, "PATCH empty body: 200 (no-op) or 400");
    assert(res.status !== 500, "PATCH empty body: no 500");
  }

  // Create user with all valid role values via admin POST /users
  for (const role of ["USER", "COMPANY", "ADMIN", "TOUR_AGENT", "GUIDE", "DRIVER"] as const) {
    const email = testEmail(`edge_role_${role.toLowerCase()}`);
    const res = await api("POST", "/users", {
      body: { email, password: TEST_PASSWORD, firstName: "Role", lastName: role, role },
      token: adminToken,
    });
    assertEq(res.status, 201, `POST /users: role ${role} → 201`);
    if (res.body?.data?.id) createdUserIds.push(res.body.data.id);
  }

  // Phone number exactly at max (20)
  {
    const res = await api("PATCH", `/users/${regularUserId}`, {
      body: { phoneNumber: "1".repeat(20) },
      token: adminToken,
    });
    assertEq(res.status, 200, "PATCH: phoneNumber 20 chars → 200");
  }

  // Set phoneNumber to null
  {
    const res = await api("PATCH", `/users/${regularUserId}`, {
      body: { phoneNumber: null },
      token: adminToken,
    });
    assertEq(res.status, 200, "PATCH: phoneNumber null → 200");
    assertEq(res.body?.data?.phoneNumber, null, "PATCH: phoneNumber is null");
  }

  // Delete → restore → delete → restore cycle
  {
    const { userId: targetId } = await createTargetUser("edge_cycle");
    const del1 = await api("DELETE", `/users/${targetId}`, { token: adminToken });
    assertEq(del1.status, 200, "Cycle: first delete → 200");
    const restore = await api("POST", `/users/${targetId}/restore`, { token: adminToken });
    assertEq(restore.status, 200, "Cycle: restore → 200");
    const del2 = await api("DELETE", `/users/${targetId}`, { token: adminToken });
    assertEq(del2.status, 200, "Cycle: second delete → 200");
    const restore2 = await api("POST", `/users/${targetId}/restore`, { token: adminToken });
    assertEq(restore2.status, 200, "Cycle: second restore → 200");
  }
}

// ─── Main ────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n🔍 Bug Hunt: Users Endpoints`);
  console.log(`${"═".repeat(60)}`);
  console.log(`Test prefix: ${TEST_PREFIX}\n`);

  try {
    await fetchCsrf();

    // Setup: create all users that need tokens up front (max 5 logins to stay under rate limit)
    console.log("Setting up test users...");
    const admin = await createAdminUser("admin");             // login #1
    const regular = await createVerifiedUser("regular");      // login #2
    // Pre-create users for auth tests that need tokens
    const authMulti = await createVerifiedUser("auth_multi"); // login #3
    const unverified1 = await createUnverifiedUser("auth_unverified");   // login #4
    const selfDelUser = await createVerifiedUser("biz_self_delete");     // login #5

    console.log(`  Admin: ${admin.userId}`);
    console.log(`  Regular: ${regular.userId}`);
    console.log(`  AuthMulti: ${authMulti.userId}`);
    console.log(`  Unverified: ${unverified1.userId}`);
    console.log(`  SelfDel: ${selfDelUser.userId}`);

    // Run all test categories, passing pre-created tokens
    await testInputValidation(admin.token, regular.userId);
    await testAuthentication(regular.userId, authMulti, unverified1);
    await testAuthorization(admin.token, admin.userId, regular.token, regular.userId);
    await testBusinessLogic(admin.token, admin.userId, regular.token, regular.userId, regular.email, selfDelUser);
    await testInjectionAndAbuse(admin.token, regular.userId);
    await testPagination(admin.token);
    await testErrorResponseShape(admin.token, regular);
    await testRaceConditions(admin.token);
    await testCsrfProtection(admin.token, regular.userId);
    await testAdditionalEdgeCases(admin.token, regular.userId);
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
