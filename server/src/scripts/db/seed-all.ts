/**
 * Unified Database Seeder (seed-all)
 *
 * Seeds ALL 35 database tables with ~4x the data of seed-realistic.ts.
 * Covers every entity: users, companies, guides, drivers, tours, itineraries,
 * reviews, chats, inquiries, bookings, favorites, media, blogs, notifications,
 * audit logs, AI credits/generations, user sessions, response times, view counts.
 *
 * Usage: npx tsx scripts/db/seed-all.ts
 *        npx tsx scripts/db/seed-all.ts --skip-clear  (skip data clearing)
 */

import {
  PrismaClient,
  UserRole,
  ChatType,
  NotificationType,
  InquiryTargetType,
  InquiryStatus,
  ReviewTargetType,
  AuditAction,
  TourDifficulty,
  BookingStatus,
  AiGenerationStatus,
  AiGenerationType,
  CreditTransactionType,
} from '@prisma/client';
import { getHashedPassword, DEFAULT_PASSWORD } from './utils/password.js';
import {
  uuid,
  randomItem,
  randomItems,
  randomInt,
  randomBool,
  randomDecimal,
  randomImageUrl,
  randomRating,
  randomPhoneNumber,
  randomLicensePlate,
  pastDate,
  futureDate,
  randomDate,
  createProgressLogger,
  slugify,
  generateBookingRef,
  formatDate,
  shuffle,
} from './utils/helpers.js';
import {
  ALL_USERS,
  ADMIN_USERS,
  COMPANY_OWNER_USERS,
  TOUR_AGENT_USERS,
  GUIDE_USERS,
  DRIVER_USERS,
  TRAVELER_USERS,
  MULTI_ROLE_USERS,
} from './data/users.js';
import { COMPANIES } from './data/companies.js';
import { GUIDE_PROFILES, MULTI_ROLE_GUIDE_PROFILES, ALL_GUIDE_PROFILES } from './data/guides.js';
import { DRIVER_PROFILES, MULTI_ROLE_DRIVER_PROFILES, ALL_DRIVER_PROFILES } from './data/drivers.js';
import { ALL_TOURS, COMPANY_TOURS, INDIVIDUAL_TOURS } from './data/tours.js';
import { getRandomComment } from './data/reviews.js';
import {
  INQUIRY_MESSAGES,
  RESPONSE_MESSAGES,
  FOLLOW_UP_MESSAGES,
  CASUAL_CHAT_MESSAGES,
  generateConversation,
} from './data/messages.js';
import { BLOG_POSTS } from './data/blogs.js';
import {
  weightedRandomLanguage,
  getRandomFullName,
  getRandomGuideBio,
  getRandomDriverBio,
  getRandomCompanyDescription,
  getRandomTourTitle,
  getRandomTourSummary,
  getRandomTourDescription,
  getItinerarySteps,
  getRandomBlogPost,
  getRandomSpecialty,
  getLocationName,
  SPECIALTIES_MULTILINGUAL,
  BLOG_POST_TEMPLATES_KA,
  BLOG_POST_TEMPLATES_RU,
} from './data/multilingual.js';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface UserData {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  isActive: boolean;
  emailVerified: boolean;
  roles: UserRole[];
  parentCompanyIndex?: number;
}

const prisma = new PrismaClient();

const LOCATIONS = [
  { name: 'Tbilisi', region: 'Tbilisi', latitude: 41.7151, longitude: 44.8271 },
  { name: 'Mtskheta', region: 'Mtskheta-Mtianeti', latitude: 41.8456, longitude: 44.7197 },
  { name: 'Kazbegi (Stepantsminda)', region: 'Mtskheta-Mtianeti', latitude: 42.6591, longitude: 44.6430 },
  { name: 'Mestia', region: 'Samegrelo-Zemo Svaneti', latitude: 43.0448, longitude: 42.7298 },
  { name: 'Ushguli', region: 'Samegrelo-Zemo Svaneti', latitude: 42.9200, longitude: 43.0156 },
  { name: 'Kutaisi', region: 'Imereti', latitude: 42.2679, longitude: 42.6946 },
  { name: 'Signagi', region: 'Kakheti', latitude: 41.6183, longitude: 45.9217 },
  { name: 'Telavi', region: 'Kakheti', latitude: 41.9198, longitude: 45.4731 },
  { name: 'Gori', region: 'Shida Kartli', latitude: 41.9828, longitude: 44.1106 },
  { name: 'Kvareli', region: 'Kakheti', latitude: 41.9531, longitude: 45.8156 },
  { name: 'Tsinandali', region: 'Kakheti', latitude: 41.8947, longitude: 45.5772 },
  { name: 'Gudauri', region: 'Mtskheta-Mtianeti', latitude: 42.4769, longitude: 44.4832 },
  { name: 'Bakuriani', region: 'Samtskhe-Javakheti', latitude: 41.7506, longitude: 43.5294 },
  { name: 'Batumi', region: 'Adjara', latitude: 41.6168, longitude: 41.6367 },
  { name: 'Borjomi', region: 'Samtskhe-Javakheti', latitude: 41.8394, longitude: 43.3894 },
  { name: 'Vardzia', region: 'Samtskhe-Javakheti', latitude: 41.3811, longitude: 43.2847 },
  { name: 'David Gareja', region: 'Kakheti', latitude: 41.4500, longitude: 45.3833 },
  { name: 'Lagodekhi', region: 'Kakheti', latitude: 41.8261, longitude: 46.2844 },
  { name: 'Kobuleti', region: 'Adjara', latitude: 41.8214, longitude: 41.7767 },
  { name: 'Martvili', region: 'Samegrelo-Zemo Svaneti', latitude: 42.4167, longitude: 42.3833 },
  { name: 'Zugdidi', region: 'Samegrelo-Zemo Svaneti', latitude: 42.5088, longitude: 41.8709 },
  { name: 'Uplistsikhe', region: 'Shida Kartli', latitude: 41.9667, longitude: 44.2083 },
  { name: 'Tusheti (Omalo)', region: 'Kakheti', latitude: 42.3744, longitude: 45.6247 },
  { name: 'Shatili', region: 'Mtskheta-Mtianeti', latitude: 42.6117, longitude: 45.1600 },
];

const CATEGORIES = [
  'Adventure', 'Cultural', 'Wine & Food', 'Nature', 'Historical',
  'City Tour', 'Photography', 'Hiking', 'Ski & Snow', 'Beach & Coast',
];

const AVAILABILITY_TYPES = ['DAILY', 'WEEKDAYS', 'WEEKENDS', 'SPECIFIC_DATES', 'BY_REQUEST'];
const START_TIMES = ['07:00', '08:00', '09:00', '09:30', '10:00', '11:00', '14:00', '15:00'];

const BOOKING_NOTES_TEMPLATES = [
  'Looking forward to this experience!',
  'We have 2 children in our group.',
  'Celebrating our anniversary trip.',
  'First time visiting Georgia, very excited!',
  'Need vegetarian meal options if food is included.',
  'Can we start 30 minutes earlier?',
  'Group of photography enthusiasts.',
  'Airport pickup — flight lands at 14:30.',
  'We have 3 large suitcases.',
  null, null, null, null, null,
];

const VEHICLE_TYPES_GEN = [
  'Sedan', 'SUV', 'Minivan', 'Minibus', 'Luxury Sedan', 'Jeep', 'MPV', 'Van',
];
const VEHICLE_MAKES_GEN = [
  'Toyota', 'Mercedes-Benz', 'Hyundai', 'Mitsubishi', 'Ford', 'Volkswagen',
  'Nissan', 'BMW', 'Kia', 'Chevrolet',
];
const VEHICLE_MODELS_GEN: Record<string, string[]> = {
  'Toyota': ['Prado', 'Land Cruiser', 'Camry', 'Corolla', 'RAV4', 'Highlander'],
  'Mercedes-Benz': ['V-Class', 'Sprinter', 'E-Class', 'S-Class', 'GLE'],
  'Hyundai': ['Tucson', 'Santa Fe', 'Staria', 'H-1', 'Sonata'],
  'Mitsubishi': ['Pajero', 'Outlander', 'L200', 'Delica'],
  'Ford': ['Transit', 'Explorer', 'Ranger', 'Everest'],
  'Volkswagen': ['Transporter', 'Caravelle', 'Tiguan', 'Touareg'],
  'Nissan': ['Patrol', 'X-Trail', 'Pathfinder', 'NV200'],
  'BMW': ['X5', 'X3', '5 Series', '7 Series'],
  'Kia': ['Sorento', 'Sportage', 'Carnival'],
  'Chevrolet': ['Captiva', 'Tahoe', 'Suburban'],
};

const LANGUAGES_POOL = [
  ['ka', 'en'], ['ka', 'en', 'ru'], ['ka', 'en', 'de'], ['ka', 'en', 'fr'],
  ['ka', 'en', 'ru', 'de'], ['ka', 'en', 'ru', 'fr'], ['ka', 'en', 'tr'],
  ['ka', 'en', 'ru', 'it'], ['ka', 'en', 'es'], ['ka', 'en', 'ru', 'he'],
  ['ka', 'en', 'ru', 'ar'], ['ka', 'en', 'ru', 'zh'], ['ka', 'en', 'ja'],
  ['ka', 'en', 'ko'], ['ka', 'en', 'ru', 'pl'],
];

// ============================================================================
// CREATED IDS TRACKER
// ============================================================================

interface CreatedIds {
  locations: string[];
  users: Map<string, string>; // email -> id
  userIds: string[]; // flat list of all user IDs
  companies: string[];
  companyUserIds: string[]; // userId for each company
  guides: string[];
  guideUserIds: string[]; // userId for each guide
  drivers: string[];
  driverUserIds: string[]; // userId for each driver
  tours: string[];
  tourOwnerIds: string[]; // ownerId for each tour
  tourCompanyIds: (string | null)[]; // companyId for each tour
  tourCategories: string[]; // category for each tour
  chats: string[];
  chatParticipantMap: Map<string, string[]>; // chatId -> [userId]
  inquiries: string[];
  bookings: string[];
  blogPosts: string[];
  reviews: string[];
  favorites: string[];
  media: string[];
  notifications: string[];
  auditLogs: string[];
  travelerUserIds: string[];
  adminUserIds: string[];
}

const createdIds: CreatedIds = {
  locations: [],
  users: new Map(),
  userIds: [],
  companies: [],
  companyUserIds: [],
  guides: [],
  guideUserIds: [],
  drivers: [],
  driverUserIds: [],
  tours: [],
  tourOwnerIds: [],
  tourCompanyIds: [],
  tourCategories: [],
  chats: [],
  chatParticipantMap: new Map(),
  inquiries: [],
  bookings: [],
  blogPosts: [],
  reviews: [],
  favorites: [],
  media: [],
  notifications: [],
  auditLogs: [],
  travelerUserIds: [],
  adminUserIds: [],
};

// ============================================================================
// PHASE 0: CLEAR ALL DATA
// ============================================================================

const TABLES_TO_CLEAR = [
  'ai_generations', 'credit_transactions', 'credit_balances', 'ai_template_configs',
  'audit_logs', 'notifications', 'favorites', 'blog_posts', 'bookings',
  'message_read_receipts', 'chat_messages', 'chat_participants', 'chats',
  'inquiry_responses', 'inquiries', 'reviews', 'media',
  'tour_locations', 'tours',
  'guide_locations', 'driver_locations', 'guides', 'drivers', 'companies',
  'user_sessions', 'user_roles', 'users',
];

async function clearAllData(): Promise<void> {
  console.log('\n🗑️  Phase 0: Clearing all data...');

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');

  for (const table of TABLES_TO_CLEAR) {
    const result = await prisma.$executeRawUnsafe(`DELETE FROM ${table}`);
    if (result > 0) {
      console.log(`  Cleared ${table}: ${result} rows`);
    }
  }

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
  console.log('  ✓ All data cleared');
}

// ============================================================================
// PHASE 1: LOCATIONS
// ============================================================================

async function seedLocations(): Promise<void> {
  console.log('\n📍 Phase 1: Seeding Locations...');

  const existingCount = await prisma.location.count();
  if (existingCount > 0) {
    console.log(`  ℹ️  ${existingCount} locations already exist, fetching IDs...`);
    const existing = await prisma.location.findMany({ select: { id: true } });
    createdIds.locations = existing.map(l => l.id);
    return;
  }

  for (const loc of LOCATIONS) {
    const created = await prisma.location.create({
      data: {
        id: uuid(),
        name: loc.name,
        region: loc.region,
        country: 'Georgia',
        latitude: loc.latitude,
        longitude: loc.longitude,
        isActive: true,
      },
    });
    createdIds.locations.push(created.id);
  }

  console.log(`  ✓ Created ${LOCATIONS.length} locations`);
}

// ============================================================================
// PHASE 2: USERS (~192 total: 48 hardcoded + ~144 generated)
// ============================================================================

async function seedUsers(): Promise<void> {
  console.log('\n👥 Phase 2: Seeding Users...');

  const passwordHash = await getHashedPassword();
  let totalUsers = 0;

  // --- 2a: Create the 48 hardcoded users ---
  for (const userData of ALL_USERS) {
    const userId = uuid();
    await prisma.user.create({
      data: {
        id: userId,
        email: userData.email,
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        isActive: userData.isActive,
        emailVerified: userData.emailVerified,
        tokenVersion: 0,
      },
    });

    for (const role of userData.roles) {
      await prisma.userRoleAssignment.create({
        data: { id: uuid(), userId, role },
      });
    }

    createdIds.users.set(userData.email, userId);
    createdIds.userIds.push(userId);
    totalUsers++;
  }

  // Link tour agents to parent companies
  for (const agent of TOUR_AGENT_USERS) {
    if (agent.parentCompanyIndex !== undefined) {
      const parentOwner = COMPANY_OWNER_USERS[agent.parentCompanyIndex];
      const parentUserId = createdIds.users.get(parentOwner.email);
      const agentUserId = createdIds.users.get(agent.email);
      if (parentUserId && agentUserId) {
        await prisma.user.update({
          where: { id: agentUserId },
          data: { parentCompanyId: parentUserId },
        });
      }
    }
  }

  // Track traveler and admin IDs
  for (const u of TRAVELER_USERS) {
    const id = createdIds.users.get(u.email);
    if (id) createdIds.travelerUserIds.push(id);
  }
  for (const u of ADMIN_USERS) {
    const id = createdIds.users.get(u.email);
    if (id) createdIds.adminUserIds.push(id);
  }

  // --- 2b: Generate ~144 additional users ---
  const genRoles: { role: UserRole; count: number }[] = [
    { role: UserRole.USER, count: 80 },
    { role: UserRole.COMPANY, count: 24 },
    { role: UserRole.GUIDE, count: 24 },
    { role: UserRole.DRIVER, count: 16 },
  ];

  for (const { role, count } of genRoles) {
    for (let i = 0; i < count; i++) {
      const lang = weightedRandomLanguage();
      const isMale = randomBool();
      const { firstName, lastName } = getRandomFullName(lang, isMale);
      const emailPrefix = `${firstName.toLowerCase().replace(/[^a-z]/g, '')}.${lastName.toLowerCase().replace(/[^a-z]/g, '')}`;
      const email = `${emailPrefix}.${randomInt(100, 9999)}@test.atlascaucasus.com`;

      const userId = uuid();
      await prisma.user.create({
        data: {
          id: userId,
          email,
          passwordHash,
          firstName,
          lastName,
          phoneNumber: randomPhoneNumber(),
          isActive: randomBool(0.95),
          emailVerified: randomBool(0.85),
          tokenVersion: 0,
        },
      });

      await prisma.userRoleAssignment.create({
        data: { id: uuid(), userId, role },
      });

      // Some users also get USER role
      if (role !== UserRole.USER && randomBool(0.3)) {
        await prisma.userRoleAssignment.create({
          data: { id: uuid(), userId, role: UserRole.USER },
        });
      }

      createdIds.users.set(email, userId);
      createdIds.userIds.push(userId);

      if (role === UserRole.USER) {
        createdIds.travelerUserIds.push(userId);
      }

      totalUsers++;
    }
  }

  console.log(`  ✓ Created ${totalUsers} users (48 hardcoded + ${totalUsers - 48} generated)`);
  console.log(`  ℹ️  Default password: ${DEFAULT_PASSWORD}`);
}

// ============================================================================
// PHASE 3: COMPANIES (~32 total: 8 existing + ~24 generated)
// ============================================================================

async function seedCompanies(): Promise<void> {
  console.log('\n🏢 Phase 3: Seeding Companies...');

  // --- 3a: Hardcoded companies from data files ---
  for (let i = 0; i < COMPANIES.length; i++) {
    const companyData = COMPANIES[i];
    const ownerUser = COMPANY_OWNER_USERS[i];
    const userId = createdIds.users.get(ownerUser.email);
    if (!userId) continue;

    const company = await prisma.company.create({
      data: {
        id: uuid(),
        userId,
        companyName: companyData.companyName,
        description: companyData.description,
        registrationNumber: companyData.registrationNumber,
        logoUrl: randomImageUrl(1000 + i),
        websiteUrl: companyData.websiteUrl,
        phoneNumber: companyData.phoneNumber,
        isVerified: companyData.isVerified,
      },
    });
    createdIds.companies.push(company.id);
    createdIds.companyUserIds.push(userId);
  }

  // Multi-role companies
  for (let i = 0; i < 2; i++) {
    const multiRoleUser = MULTI_ROLE_USERS[i + 2];
    const userId = createdIds.users.get(multiRoleUser.email);
    if (!userId) continue;

    const company = await prisma.company.create({
      data: {
        id: uuid(),
        userId,
        companyName: `${multiRoleUser.firstName}'s Tours`,
        description: `Boutique tour company run by ${multiRoleUser.firstName} ${multiRoleUser.lastName}.`,
        registrationNumber: `GE-2022-TR-${100000 + i}`,
        logoUrl: randomImageUrl(1010 + i),
        phoneNumber: multiRoleUser.phoneNumber,
        isVerified: true,
      },
    });
    createdIds.companies.push(company.id);
    createdIds.companyUserIds.push(userId);
  }

  // --- 3b: Generated companies from gen-COMPANY users ---
  const genCompanyUsers = Array.from(createdIds.users.entries())
    .filter(([email]) => email.includes('@test.atlascaucasus.com'));

  // Find users with COMPANY role that don't yet have a company
  const existingCompanyUserIds = new Set(createdIds.companyUserIds);
  let genCount = 0;

  for (const [email, userId] of genCompanyUsers) {
    if (existingCompanyUserIds.has(userId)) continue;

    // Check if this user has COMPANY role
    const roles = await prisma.userRoleAssignment.findMany({ where: { userId }, select: { role: true } });
    const hasCompanyRole = roles.some(r => r.role === UserRole.COMPANY);
    if (!hasCompanyRole) continue;

    const lang = weightedRandomLanguage();
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } });
    if (!user) continue;

    const companyNames = [
      `${user.firstName}'s Travel Co`, `${user.lastName} Tours`, `Caucasus ${user.firstName} Adventures`,
      `${user.firstName} & ${user.lastName} Expeditions`, `Georgia ${user.lastName} Tours`,
    ];

    const specialty = getRandomSpecialty(lang);
    const years = randomInt(2, 15);
    const companyName = randomItem(companyNames);
    const description = getRandomCompanyDescription(lang, { name: companyName, specialty, years });

    const company = await prisma.company.create({
      data: {
        id: uuid(),
        userId,
        companyName,
        description,
        registrationNumber: `GE-${randomInt(2018, 2025)}-TR-${randomInt(100000, 999999)}`,
        logoUrl: randomImageUrl(1000 + createdIds.companies.length),
        websiteUrl: randomBool(0.6) ? `https://${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.ge` : null,
        phoneNumber: randomPhoneNumber(),
        isVerified: randomBool(0.7),
      },
    });

    createdIds.companies.push(company.id);
    createdIds.companyUserIds.push(userId);
    genCount++;
  }

  console.log(`  ✓ Created ${createdIds.companies.length} companies (${createdIds.companies.length - genCount} hardcoded + ${genCount} generated)`);
}

// ============================================================================
// PHASE 4: GUIDES (~56 total: 12 existing + ~44 generated)
// ============================================================================

async function seedGuides(): Promise<void> {
  console.log('\n🎒 Phase 4: Seeding Guides...');

  // --- 4a: Hardcoded guides from data files ---
  for (let i = 0; i < GUIDE_PROFILES.length; i++) {
    const profile = GUIDE_PROFILES[i];
    const guideUser = GUIDE_USERS[profile.userIndex];
    const userId = createdIds.users.get(guideUser.email);
    if (!userId) continue;

    const guide = await prisma.guide.create({
      data: {
        id: uuid(),
        userId,
        bio: profile.bio,
        languages: profile.languages,
        yearsOfExperience: profile.yearsOfExperience,
        photoUrl: randomImageUrl(1020 + i),
        phoneNumber: guideUser.phoneNumber,
        isVerified: profile.isVerified,
        isAvailable: profile.isAvailable,
        pricePerDay: profile.pricePerDay,
        currency: profile.currency,
      },
    });
    createdIds.guides.push(guide.id);
    createdIds.guideUserIds.push(userId);

    for (let j = 0; j < profile.locationIndices.length; j++) {
      const locIndex = profile.locationIndices[j];
      if (locIndex < createdIds.locations.length) {
        await prisma.guideLocation.create({
          data: {
            guideId: guide.id,
            locationId: createdIds.locations[locIndex],
            isPrimary: locIndex === profile.primaryLocationIndex,
          },
        });
      }
    }
  }

  // Multi-role guides
  for (const profile of MULTI_ROLE_GUIDE_PROFILES) {
    const userIndex = profile.userIndex - 10;
    const multiRoleUser = MULTI_ROLE_USERS[userIndex];
    const userId = createdIds.users.get(multiRoleUser.email);
    if (!userId) continue;

    const guide = await prisma.guide.create({
      data: {
        id: uuid(),
        userId,
        bio: profile.bio,
        languages: profile.languages,
        yearsOfExperience: profile.yearsOfExperience,
        photoUrl: randomImageUrl(1040 + userIndex),
        phoneNumber: multiRoleUser.phoneNumber,
        isVerified: profile.isVerified,
        isAvailable: profile.isAvailable,
        pricePerDay: profile.pricePerDay,
        currency: profile.currency,
      },
    });
    createdIds.guides.push(guide.id);
    createdIds.guideUserIds.push(userId);

    for (let j = 0; j < profile.locationIndices.length; j++) {
      const locIndex = profile.locationIndices[j];
      if (locIndex < createdIds.locations.length) {
        await prisma.guideLocation.create({
          data: {
            guideId: guide.id,
            locationId: createdIds.locations[locIndex],
            isPrimary: locIndex === profile.primaryLocationIndex,
          },
        });
      }
    }
  }

  // --- 4b: Generated guides ---
  const existingGuideUserIds = new Set(createdIds.guideUserIds);
  let genCount = 0;

  for (const [email, userId] of Array.from(createdIds.users.entries())) {
    if (existingGuideUserIds.has(userId)) continue;

    const roles = await prisma.userRoleAssignment.findMany({ where: { userId }, select: { role: true } });
    const hasGuideRole = roles.some(r => r.role === UserRole.GUIDE);
    if (!hasGuideRole) continue;

    const lang = weightedRandomLanguage();
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true, phoneNumber: true } });
    if (!user) continue;

    const years = randomInt(1, 20);
    const languages = randomItem(LANGUAGES_POOL);
    const specialty = getRandomSpecialty(lang);
    const cityIdx = randomInt(0, Math.min(createdIds.locations.length - 1, 23));
    const city = LOCATIONS[cityIdx]?.name ?? 'Tbilisi';

    const bio = getRandomGuideBio(lang, {
      name: user.firstName,
      years,
      city,
      specialty,
      languages: languages.join(', '),
    });

    const guide = await prisma.guide.create({
      data: {
        id: uuid(),
        userId,
        bio,
        languages: JSON.stringify(languages),
        yearsOfExperience: years,
        photoUrl: randomImageUrl(1020 + createdIds.guides.length),
        phoneNumber: user.phoneNumber,
        isVerified: randomBool(0.65),
        isAvailable: randomBool(0.85),
        pricePerDay: randomDecimal(60, 400, 0),
        currency: randomItem(['GEL', 'USD', 'EUR']),
      },
    });
    createdIds.guides.push(guide.id);
    createdIds.guideUserIds.push(userId);

    // Assign 2-5 locations
    const locCount = randomInt(2, 5);
    const locIndices = randomItems(Array.from({ length: createdIds.locations.length }, (_, i) => i), locCount);
    for (let j = 0; j < locIndices.length; j++) {
      await prisma.guideLocation.create({
        data: {
          guideId: guide.id,
          locationId: createdIds.locations[locIndices[j]],
          isPrimary: j === 0,
        },
      });
    }

    genCount++;
  }

  console.log(`  ✓ Created ${createdIds.guides.length} guides (${createdIds.guides.length - genCount} hardcoded + ${genCount} generated)`);
}

// ============================================================================
// PHASE 5: DRIVERS (~40 total: 10 existing + ~30 generated)
// ============================================================================

async function seedDrivers(): Promise<void> {
  console.log('\n🚗 Phase 5: Seeding Drivers...');

  // --- 5a: Hardcoded drivers ---
  for (let i = 0; i < DRIVER_PROFILES.length; i++) {
    const profile = DRIVER_PROFILES[i];
    const driverUser = DRIVER_USERS[profile.userIndex];
    const userId = createdIds.users.get(driverUser.email);
    if (!userId) continue;

    const driver = await prisma.driver.create({
      data: {
        id: uuid(),
        userId,
        bio: profile.bio,
        vehicleType: profile.vehicleType,
        vehicleCapacity: profile.vehicleCapacity,
        vehicleMake: profile.vehicleMake,
        vehicleModel: profile.vehicleModel,
        vehicleYear: profile.vehicleYear,
        licenseNumber: profile.licenseNumber,
        photoUrl: randomImageUrl(1050 + i),
        phoneNumber: driverUser.phoneNumber,
        isVerified: profile.isVerified,
        isAvailable: profile.isAvailable,
      },
    });
    createdIds.drivers.push(driver.id);
    createdIds.driverUserIds.push(userId);

    for (let j = 0; j < profile.locationIndices.length; j++) {
      const locIndex = profile.locationIndices[j];
      if (locIndex < createdIds.locations.length) {
        await prisma.driverLocation.create({
          data: {
            driverId: driver.id,
            locationId: createdIds.locations[locIndex],
            isPrimary: locIndex === profile.primaryLocationIndex,
          },
        });
      }
    }
  }

  // Multi-role drivers
  for (const profile of MULTI_ROLE_DRIVER_PROFILES) {
    const userIndex = profile.userIndex - 10;
    const multiRoleUser = MULTI_ROLE_USERS[userIndex];
    const userId = createdIds.users.get(multiRoleUser.email);
    if (!userId) continue;

    const driver = await prisma.driver.create({
      data: {
        id: uuid(),
        userId,
        bio: profile.bio,
        vehicleType: profile.vehicleType,
        vehicleCapacity: profile.vehicleCapacity,
        vehicleMake: profile.vehicleMake,
        vehicleModel: profile.vehicleModel,
        vehicleYear: profile.vehicleYear,
        licenseNumber: profile.licenseNumber,
        photoUrl: randomImageUrl(1060 + userIndex),
        phoneNumber: multiRoleUser.phoneNumber,
        isVerified: profile.isVerified,
        isAvailable: profile.isAvailable,
      },
    });
    createdIds.drivers.push(driver.id);
    createdIds.driverUserIds.push(userId);

    for (let j = 0; j < profile.locationIndices.length; j++) {
      const locIndex = profile.locationIndices[j];
      if (locIndex < createdIds.locations.length) {
        await prisma.driverLocation.create({
          data: {
            driverId: driver.id,
            locationId: createdIds.locations[locIndex],
            isPrimary: locIndex === profile.primaryLocationIndex,
          },
        });
      }
    }
  }

  // --- 5b: Generated drivers ---
  const existingDriverUserIds = new Set(createdIds.driverUserIds);
  let genCount = 0;

  for (const [email, userId] of Array.from(createdIds.users.entries())) {
    if (existingDriverUserIds.has(userId)) continue;

    const roles = await prisma.userRoleAssignment.findMany({ where: { userId }, select: { role: true } });
    const hasDriverRole = roles.some(r => r.role === UserRole.DRIVER);
    if (!hasDriverRole) continue;

    const lang = weightedRandomLanguage();
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, phoneNumber: true } });
    if (!user) continue;

    const make = randomItem(VEHICLE_MAKES_GEN);
    const model = randomItem(VEHICLE_MODELS_GEN[make] ?? ['Standard']);
    const vehicleType = randomItem(VEHICLE_TYPES_GEN);
    const years = randomInt(2, 20);
    const cityIdx = randomInt(0, Math.min(createdIds.locations.length - 1, 23));
    const city = LOCATIONS[cityIdx]?.name ?? 'Tbilisi';

    const bio = getRandomDriverBio(lang, {
      name: user.firstName,
      years,
      vehicleType,
      city,
    });

    const driver = await prisma.driver.create({
      data: {
        id: uuid(),
        userId,
        bio,
        vehicleType,
        vehicleCapacity: randomInt(3, 16),
        vehicleMake: make,
        vehicleModel: model,
        vehicleYear: randomInt(2015, 2025),
        licenseNumber: randomLicensePlate(),
        photoUrl: randomImageUrl(1050 + createdIds.drivers.length),
        phoneNumber: user.phoneNumber,
        isVerified: randomBool(0.6),
        isAvailable: randomBool(0.85),
      },
    });
    createdIds.drivers.push(driver.id);
    createdIds.driverUserIds.push(userId);

    // Assign 2-4 locations
    const locCount = randomInt(2, 4);
    const locIndices = randomItems(Array.from({ length: createdIds.locations.length }, (_, i) => i), locCount);
    for (let j = 0; j < locIndices.length; j++) {
      await prisma.driverLocation.create({
        data: {
          driverId: driver.id,
          locationId: createdIds.locations[locIndices[j]],
          isPrimary: j === 0,
        },
      });
    }

    genCount++;
  }

  console.log(`  ✓ Created ${createdIds.drivers.length} drivers (${createdIds.drivers.length - genCount} hardcoded + ${genCount} generated)`);
}

// ============================================================================
// PHASE 6: TOURS (~200 total: 50 existing + ~150 generated)
// ============================================================================

async function seedTours(): Promise<void> {
  console.log('\n🗺️  Phase 6: Seeding Tours...');

  // --- 6a: Hardcoded tours from data files ---
  for (const tourData of ALL_TOURS) {
    let ownerId: string;
    let companyId: string | null = null;

    if (tourData.companyIndex !== null) {
      const companyOwner = COMPANY_OWNER_USERS[tourData.companyIndex];
      ownerId = createdIds.users.get(companyOwner.email)!;
      companyId = createdIds.companies[tourData.companyIndex];
    } else {
      if (tourData.ownerType === 'guide') {
        const guideUser = tourData.ownerIndex! < 10
          ? GUIDE_USERS[tourData.ownerIndex!]
          : MULTI_ROLE_USERS[tourData.ownerIndex! - 10];
        ownerId = createdIds.users.get(guideUser.email)!;
      } else {
        const agentUser = TOUR_AGENT_USERS[tourData.ownerIndex!];
        ownerId = createdIds.users.get(agentUser.email)!;
      }
    }

    if (!ownerId) continue;

    const tour = await prisma.tour.create({
      data: {
        id: uuid(),
        ownerId,
        companyId,
        title: tourData.title,
        summary: tourData.summary,
        description: tourData.description,
        price: tourData.price,
        originalPrice: tourData.originalPrice,
        currency: tourData.currency,
        city: tourData.city,
        startLocation: tourData.startLocation,
        durationMinutes: tourData.durationMinutes,
        maxPeople: tourData.maxPeople,
        difficulty: tourData.difficulty,
        category: tourData.category,
        isActive: tourData.isActive,
        isInstantBooking: tourData.isInstantBooking,
        hasFreeCancellation: tourData.hasFreeCancellation,
        isFeatured: tourData.isFeatured,
        nextAvailableDate: futureDate(randomInt(1, 30)),
        startDate: pastDate(randomInt(30, 365)),
        availabilityType: randomItem(AVAILABILITY_TYPES),
        startTime: randomItem(START_TIMES),
      },
    });

    createdIds.tours.push(tour.id);
    createdIds.tourOwnerIds.push(ownerId);
    createdIds.tourCompanyIds.push(companyId);
    createdIds.tourCategories.push(tourData.category);

    for (let j = 0; j < tourData.locationIndices.length; j++) {
      const locIndex = tourData.locationIndices[j];
      if (locIndex < createdIds.locations.length) {
        await prisma.tourLocation.create({
          data: {
            tourId: tour.id,
            locationId: createdIds.locations[locIndex],
            order: j,
          },
        });
      }
    }
  }

  // --- 6b: Generated tours (~150) ---
  const providerUserIds = [
    ...createdIds.companyUserIds,
    ...createdIds.guideUserIds,
  ];

  let genCount = 0;
  const targetGen = 150;

  for (let i = 0; i < targetGen; i++) {
    const lang = weightedRandomLanguage();
    const category = randomItem(CATEGORIES);
    const title = getRandomTourTitle(category, lang);
    const summary = getRandomTourSummary(lang);
    const description = getRandomTourDescription(lang);

    // Pick random owner (company user or guide user)
    const ownerUserId = randomItem(providerUserIds);

    // Determine companyId if owner has a company
    const companyIndex = createdIds.companyUserIds.indexOf(ownerUserId);
    const companyId = companyIndex >= 0 ? createdIds.companies[companyIndex] : null;

    const price = randomDecimal(30, 600, 0);
    const hasDiscount = randomBool(0.3);
    const difficulties: TourDifficulty[] = [TourDifficulty.easy, TourDifficulty.moderate, TourDifficulty.challenging];
    const cityIdx = randomInt(0, Math.min(createdIds.locations.length - 1, 23));

    const tour = await prisma.tour.create({
      data: {
        id: uuid(),
        ownerId: ownerUserId,
        companyId,
        title,
        summary,
        description,
        price,
        originalPrice: hasDiscount ? price + randomDecimal(20, 150, 0) : null,
        currency: randomItem(['GEL', 'USD', 'EUR']),
        city: LOCATIONS[cityIdx]?.name ?? 'Tbilisi',
        startLocation: LOCATIONS[cityIdx]?.name ?? 'Tbilisi',
        durationMinutes: randomItem([120, 180, 240, 300, 360, 480, 600, 720, 1440]),
        maxPeople: randomItem([4, 6, 8, 10, 12, 15, 20]),
        difficulty: randomItem(difficulties),
        category,
        isActive: randomBool(0.92),
        isInstantBooking: randomBool(0.25),
        hasFreeCancellation: randomBool(0.4),
        isFeatured: randomBool(0.1),
        nextAvailableDate: futureDate(randomInt(1, 60)),
        startDate: pastDate(randomInt(30, 365)),
        availabilityType: randomItem(AVAILABILITY_TYPES),
        startTime: randomItem(START_TIMES),
      },
    });

    createdIds.tours.push(tour.id);
    createdIds.tourOwnerIds.push(ownerUserId);
    createdIds.tourCompanyIds.push(companyId);
    createdIds.tourCategories.push(category);

    // Assign 1-4 locations
    const locCount = randomInt(1, 4);
    const locIndices = randomItems(Array.from({ length: createdIds.locations.length }, (_, idx) => idx), locCount);
    for (let j = 0; j < locIndices.length; j++) {
      await prisma.tourLocation.create({
        data: {
          tourId: tour.id,
          locationId: createdIds.locations[locIndices[j]],
          order: j,
        },
      });
    }

    genCount++;
  }

  console.log(`  ✓ Created ${createdIds.tours.length} tours (50 hardcoded + ${genCount} generated)`);
}

// ============================================================================
// PHASE 7: ITINERARIES (for every tour)
// ============================================================================

async function seedItineraries(): Promise<void> {
  console.log('\n📋 Phase 7: Seeding Itineraries...');

  let count = 0;
  for (let i = 0; i < createdIds.tours.length; i++) {
    const tourId = createdIds.tours[i];
    const category = createdIds.tourCategories[i] ?? 'Cultural';
    const lang = weightedRandomLanguage();
    const steps = getItinerarySteps(category, lang);

    if (steps.length === 0) continue;

    // Pick 3-6 steps from the pool
    const numSteps = Math.min(steps.length, randomInt(3, 6));
    const selectedSteps = steps.slice(0, numSteps);

    const itinerary = JSON.stringify(selectedSteps);
    await prisma.tour.update({
      where: { id: tourId },
      data: { itinerary },
    });
    count++;
  }

  console.log(`  ✓ Added itineraries to ${count} tours`);
}

// ============================================================================
// PHASE 8: REVIEWS (~580+)
// ============================================================================

async function seedReviews(): Promise<void> {
  console.log('\n⭐ Phase 8: Seeding Reviews...');

  let reviewCount = 0;
  const reviewerPool = createdIds.travelerUserIds.length > 0
    ? createdIds.travelerUserIds
    : createdIds.userIds.slice(0, 30);

  // Track existing review combos to avoid unique constraint violations
  const existingReviewKeys = new Set<string>();

  const createReview = async (userId: string, targetType: ReviewTargetType, targetId: string): Promise<void> => {
    const key = `${userId}:${targetType}:${targetId}`;
    if (existingReviewKeys.has(key)) return;
    existingReviewKeys.add(key);

    const rating = randomRating();
    const lang = weightedRandomLanguage();
    await prisma.review.create({
      data: {
        id: uuid(),
        userId,
        targetType,
        targetId,
        rating,
        comment: getRandomComment(targetType, rating, lang),
        createdAt: pastDate(randomInt(1, 180)),
      },
    });
    reviewCount++;
  };

  // Tour reviews (2-4 per tour)
  for (const tourId of createdIds.tours) {
    const numReviews = randomInt(2, 4);
    const reviewers = randomItems(reviewerPool, numReviews);
    for (const userId of reviewers) {
      await createReview(userId, ReviewTargetType.TOUR, tourId);
    }
  }

  // Guide reviews (2-4 per guide)
  for (let i = 0; i < createdIds.guides.length; i++) {
    const guideId = createdIds.guides[i];
    const guideUserId = createdIds.guideUserIds[i];
    const numReviews = randomInt(2, 4);
    const reviewers = randomItems(reviewerPool.filter(id => id !== guideUserId), numReviews);
    for (const userId of reviewers) {
      await createReview(userId, ReviewTargetType.GUIDE, guideId);
    }
  }

  // Driver reviews (1-3 per driver)
  for (let i = 0; i < createdIds.drivers.length; i++) {
    const driverId = createdIds.drivers[i];
    const driverUserId = createdIds.driverUserIds[i];
    const numReviews = randomInt(1, 3);
    const reviewers = randomItems(reviewerPool.filter(id => id !== driverUserId), numReviews);
    for (const userId of reviewers) {
      await createReview(userId, ReviewTargetType.DRIVER, driverId);
    }
  }

  // Company reviews (2-4 per company)
  for (let i = 0; i < createdIds.companies.length; i++) {
    const companyId = createdIds.companies[i];
    const companyUserId = createdIds.companyUserIds[i];
    const numReviews = randomInt(2, 4);
    const reviewers = randomItems(reviewerPool.filter(id => id !== companyUserId), numReviews);
    for (const userId of reviewers) {
      await createReview(userId, ReviewTargetType.COMPANY, companyId);
    }
  }

  console.log(`  ✓ Created ${reviewCount} reviews`);
}

// ============================================================================
// PHASE 9: UPDATE AVERAGE RATINGS
// ============================================================================

async function updateAverageRatings(): Promise<void> {
  console.log('\n📊 Phase 9: Updating average ratings...');

  const targetTypes: { type: ReviewTargetType; model: string }[] = [
    { type: ReviewTargetType.TOUR, model: 'tour' },
    { type: ReviewTargetType.GUIDE, model: 'guide' },
    { type: ReviewTargetType.DRIVER, model: 'driver' },
    { type: ReviewTargetType.COMPANY, model: 'company' },
  ];

  for (const { type, model } of targetTypes) {
    const ratings = await prisma.review.groupBy({
      by: ['targetId'],
      where: { targetType: type },
      _avg: { rating: true },
      _count: { rating: true },
    });

    for (const r of ratings) {
      await (prisma as any)[model].update({
        where: { id: r.targetId },
        data: {
          averageRating: r._avg.rating,
          reviewCount: r._count.rating,
        },
      });
    }
  }

  console.log('  ✓ Average ratings updated for all entity types');
}

// ============================================================================
// PHASE 10: CHATS & MESSAGES (~80 chats)
// ============================================================================

async function seedChats(): Promise<void> {
  console.log('\n💬 Phase 10: Seeding Chats & Messages...');

  let chatCount = 0;
  let messageCount = 0;

  const travelerIds = createdIds.travelerUserIds;
  const guideIds = createdIds.guideUserIds;
  const companyIds = createdIds.companyUserIds;
  const providerIds = [...guideIds, ...companyIds];

  // Direct chats: traveler <-> provider (60 chats)
  for (let i = 0; i < 60; i++) {
    const travelerId = randomItem(travelerIds);
    const providerId = randomItem(providerIds);
    if (travelerId === providerId) continue;

    const chat = await prisma.chat.create({
      data: { id: uuid(), type: ChatType.DIRECT, creatorId: travelerId },
    });
    createdIds.chats.push(chat.id);
    createdIds.chatParticipantMap.set(chat.id, [travelerId, providerId]);
    chatCount++;

    await prisma.chatParticipant.createMany({
      data: [
        { id: uuid(), chatId: chat.id, userId: travelerId },
        { id: uuid(), chatId: chat.id, userId: providerId },
      ],
    });

    const isGuide = guideIds.includes(providerId);
    const convType = isGuide ? 'guide' : 'company';
    const messages = generateConversation(convType as 'guide' | 'company', randomInt(3, 8));

    for (let j = 0; j < messages.length; j++) {
      const senderId = j % 2 === 0 ? travelerId : providerId;
      await prisma.chatMessage.create({
        data: {
          id: uuid(),
          chatId: chat.id,
          senderId,
          content: messages[j],
          createdAt: new Date(Date.now() - (messages.length - j) * randomInt(1800000, 7200000)),
        },
      });
      messageCount++;
    }
  }

  // Group chats (20 chats)
  for (let i = 0; i < 20; i++) {
    const memberCount = randomInt(3, 6);
    const members = randomItems(travelerIds, memberCount);
    const creatorId = members[0];

    const chat = await prisma.chat.create({
      data: {
        id: uuid(),
        type: ChatType.GROUP,
        name: `Georgia Trip ${i + 1}`,
        creatorId,
      },
    });
    createdIds.chats.push(chat.id);
    createdIds.chatParticipantMap.set(chat.id, members);
    chatCount++;

    for (const userId of members) {
      await prisma.chatParticipant.create({
        data: { id: uuid(), chatId: chat.id, userId },
      });
    }

    const numMessages = randomInt(5, 15);
    for (let j = 0; j < numMessages; j++) {
      const senderId = randomItem(members);
      await prisma.chatMessage.create({
        data: {
          id: uuid(),
          chatId: chat.id,
          senderId,
          content: randomItem(CASUAL_CHAT_MESSAGES),
          createdAt: new Date(Date.now() - (numMessages - j) * randomInt(900000, 3600000)),
        },
      });
      messageCount++;
    }
  }

  console.log(`  ✓ Created ${chatCount} chats with ${messageCount} messages`);
}

// ============================================================================
// PHASE 11: MESSAGE READ RECEIPTS
// ============================================================================

async function seedReadReceipts(): Promise<void> {
  console.log('\n✅ Phase 11: Seeding Message Read Receipts...');

  let receiptCount = 0;

  for (const [chatId, members] of Array.from(createdIds.chatParticipantMap.entries())) {
    const messages = await prisma.chatMessage.findMany({
      where: { chatId },
      select: { id: true, senderId: true },
      orderBy: { createdAt: 'asc' },
    });

    // Mark ~70% of messages as read by other participants
    for (const msg of messages) {
      for (const userId of members) {
        if (userId === msg.senderId) continue;
        if (!randomBool(0.7)) continue;

        await prisma.messageReadReceipt.create({
          data: {
            id: uuid(),
            messageId: msg.id,
            userId,
            readAt: new Date(),
          },
        });
        receiptCount++;
      }
    }
  }

  console.log(`  ✓ Created ${receiptCount} message read receipts`);
}

// ============================================================================
// PHASE 12: INQUIRIES (~60)
// ============================================================================

async function seedInquiries(): Promise<void> {
  console.log('\n📩 Phase 12: Seeding Inquiries...');

  let inquiryCount = 0;
  let responseCount = 0;

  const travelerIds = createdIds.travelerUserIds;
  const statuses = [InquiryStatus.PENDING, InquiryStatus.RESPONDED, InquiryStatus.ACCEPTED, InquiryStatus.DECLINED];

  // Tour inquiries (25)
  for (let i = 0; i < 25; i++) {
    const userId = randomItem(travelerIds);
    const numTargets = randomInt(1, 3);
    const targetTourIds = randomItems(createdIds.tours, numTargets);

    const inquiry = await prisma.inquiry.create({
      data: {
        id: uuid(),
        userId,
        targetType: InquiryTargetType.TOUR,
        targetIds: JSON.stringify(targetTourIds),
        subject: 'Tour booking inquiry',
        message: randomItem(INQUIRY_MESSAGES.tour),
        requiresPayment: numTargets > 2,
        expiresAt: futureDate(30),
      },
    });
    createdIds.inquiries.push(inquiry.id);
    inquiryCount++;

    const seenOwnerIds = new Set<string>();
    for (const tourId of targetTourIds) {
      const tourIdx = createdIds.tours.indexOf(tourId);
      const ownerId = createdIds.tourOwnerIds[tourIdx];
      if (!ownerId || seenOwnerIds.has(ownerId)) continue;
      seenOwnerIds.add(ownerId);

      const status = randomItem(statuses);
      await prisma.inquiryResponse.create({
        data: {
          id: uuid(),
          inquiryId: inquiry.id,
          recipientId: ownerId,
          status,
          message: status !== InquiryStatus.PENDING
            ? randomItem(RESPONSE_MESSAGES[status === InquiryStatus.ACCEPTED ? 'positive' : 'neutral'])
            : null,
          respondedAt: status !== InquiryStatus.PENDING ? pastDate(7) : null,
        },
      });
      responseCount++;
    }
  }

  // Guide inquiries (20)
  for (let i = 0; i < 20; i++) {
    const userId = randomItem(travelerIds);
    const numTargets = randomInt(1, 2);
    const targetGuideIds = randomItems(createdIds.guides, numTargets);

    const inquiry = await prisma.inquiry.create({
      data: {
        id: uuid(),
        userId,
        targetType: InquiryTargetType.GUIDE,
        targetIds: JSON.stringify(targetGuideIds),
        subject: 'Guide availability inquiry',
        message: randomItem(INQUIRY_MESSAGES.guide),
        requiresPayment: false,
        expiresAt: futureDate(30),
      },
    });
    createdIds.inquiries.push(inquiry.id);
    inquiryCount++;

    const seenGuideUserIds = new Set<string>();
    for (const guideId of targetGuideIds) {
      const guideIdx = createdIds.guides.indexOf(guideId);
      const guideUserId = createdIds.guideUserIds[guideIdx];
      if (!guideUserId || seenGuideUserIds.has(guideUserId)) continue;
      seenGuideUserIds.add(guideUserId);

      const status = randomItem(statuses);
      await prisma.inquiryResponse.create({
        data: {
          id: uuid(),
          inquiryId: inquiry.id,
          recipientId: guideUserId,
          status,
          message: status !== InquiryStatus.PENDING
            ? randomItem(RESPONSE_MESSAGES[status === InquiryStatus.ACCEPTED ? 'positive' : 'negative'])
            : null,
          respondedAt: status !== InquiryStatus.PENDING ? pastDate(5) : null,
        },
      });
      responseCount++;
    }
  }

  // Driver inquiries (15)
  for (let i = 0; i < 15; i++) {
    const userId = randomItem(travelerIds);
    const numTargets = randomInt(1, 2);
    const targetDriverIds = randomItems(createdIds.drivers, numTargets);

    const inquiry = await prisma.inquiry.create({
      data: {
        id: uuid(),
        userId,
        targetType: InquiryTargetType.DRIVER,
        targetIds: JSON.stringify(targetDriverIds),
        subject: 'Driver booking request',
        message: randomItem(INQUIRY_MESSAGES.driver),
        requiresPayment: false,
        expiresAt: futureDate(30),
      },
    });
    createdIds.inquiries.push(inquiry.id);
    inquiryCount++;

    const seenDriverUserIds = new Set<string>();
    for (const driverId of targetDriverIds) {
      const driverIdx = createdIds.drivers.indexOf(driverId);
      const driverUserId = createdIds.driverUserIds[driverIdx];
      if (!driverUserId || seenDriverUserIds.has(driverUserId)) continue;
      seenDriverUserIds.add(driverUserId);

      const status = randomItem(statuses);
      await prisma.inquiryResponse.create({
        data: {
          id: uuid(),
          inquiryId: inquiry.id,
          recipientId: driverUserId,
          status,
          message: status !== InquiryStatus.PENDING
            ? randomItem(RESPONSE_MESSAGES.positive)
            : null,
          respondedAt: status !== InquiryStatus.PENDING ? pastDate(3) : null,
        },
      });
      responseCount++;
    }
  }

  console.log(`  ✓ Created ${inquiryCount} inquiries with ${responseCount} responses`);
}

// ============================================================================
// PHASE 13: BOOKINGS (~100)
// ============================================================================

async function seedBookings(): Promise<void> {
  console.log('\n📅 Phase 13: Seeding Bookings...');

  let bookingCount = 0;
  const travelerIds = createdIds.travelerUserIds;
  const statusWeights: BookingStatus[] = [
    BookingStatus.PENDING, BookingStatus.PENDING,
    BookingStatus.CONFIRMED, BookingStatus.CONFIRMED, BookingStatus.CONFIRMED,
    BookingStatus.COMPLETED, BookingStatus.COMPLETED,
    BookingStatus.DECLINED,
    BookingStatus.CANCELLED,
  ];

  // Tour bookings (50)
  const tourSample = randomItems(createdIds.tours, Math.min(50, createdIds.tours.length));
  for (const tourId of tourSample) {
    const travelerId = randomItem(travelerIds);
    const tourIdx = createdIds.tours.indexOf(tourId);
    const ownerId = createdIds.tourOwnerIds[tourIdx];
    if (!ownerId || ownerId === travelerId) continue;

    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      select: { ownerId: true, price: true, currency: true, title: true, companyId: true },
    });
    if (!tour) continue;

    const status = randomItem(statusWeights);
    const guests = randomInt(1, 8);
    const price = tour.price ? Number(tour.price) * guests : randomInt(100, 800);
    const traveler = await prisma.user.findUnique({
      where: { id: travelerId },
      select: { firstName: true, lastName: true, phoneNumber: true, email: true },
    });
    const owner = await prisma.user.findUnique({
      where: { id: tour.ownerId },
      select: { firstName: true, lastName: true },
    });

    const createdAt = status === BookingStatus.COMPLETED ? pastDate(90) : pastDate(30);

    await prisma.booking.create({
      data: {
        id: uuid(),
        userId: travelerId,
        entityType: 'TOUR',
        entityId: tourId,
        status,
        date: status === BookingStatus.COMPLETED ? pastDate(60) : futureDate(30),
        guests,
        totalPrice: price,
        currency: tour.currency || 'GEL',
        notes: randomItem(BOOKING_NOTES_TEMPLATES),
        createdAt,
        cancelledAt: status === BookingStatus.CANCELLED ? pastDate(15) : null,
        confirmedAt: status === BookingStatus.CONFIRMED || status === BookingStatus.COMPLETED ? pastDate(25) : null,
        declinedAt: status === BookingStatus.DECLINED ? pastDate(20) : null,
        declinedReason: status === BookingStatus.DECLINED ? 'Fully booked for the requested date.' : null,
        completedAt: status === BookingStatus.COMPLETED ? pastDate(30) : null,
        entityName: tour.title,
        entityImage: randomImageUrl(1100 + tourIdx),
        providerUserId: tour.ownerId,
        providerName: owner ? `${owner.firstName} ${owner.lastName}` : null,
        contactPhone: traveler?.phoneNumber ?? null,
        contactEmail: traveler?.email ?? null,
        referenceNumber: generateBookingRef(),
      },
    });
    bookingCount++;
  }

  // Guide bookings (30)
  const guideSample = randomItems(createdIds.guides, Math.min(30, createdIds.guides.length));
  for (const guideId of guideSample) {
    const travelerId = randomItem(travelerIds);
    const guideIdx = createdIds.guides.indexOf(guideId);
    const guideUserId = createdIds.guideUserIds[guideIdx];
    if (!guideUserId || guideUserId === travelerId) continue;

    const guide = await prisma.guide.findUnique({
      where: { id: guideId },
      select: { userId: true, pricePerDay: true, currency: true },
    });
    if (!guide) continue;

    const guideUser = await prisma.user.findUnique({
      where: { id: guide.userId },
      select: { firstName: true, lastName: true },
    });

    const status = randomItem(statusWeights);
    const days = randomInt(1, 5);
    const pricePerDay = guide.pricePerDay ? Number(guide.pricePerDay) : randomInt(80, 300);

    await prisma.booking.create({
      data: {
        id: uuid(),
        userId: travelerId,
        entityType: 'GUIDE',
        entityId: guideId,
        status,
        date: status === BookingStatus.COMPLETED ? pastDate(45) : futureDate(21),
        guests: randomInt(1, 6),
        totalPrice: pricePerDay * days,
        currency: guide.currency || 'GEL',
        notes: randomItem(BOOKING_NOTES_TEMPLATES),
        createdAt: pastDate(status === BookingStatus.COMPLETED ? 75 : 21),
        cancelledAt: status === BookingStatus.CANCELLED ? pastDate(10) : null,
        confirmedAt: status === BookingStatus.CONFIRMED || status === BookingStatus.COMPLETED ? pastDate(18) : null,
        completedAt: status === BookingStatus.COMPLETED ? pastDate(20) : null,
        entityName: guideUser ? `Guide: ${guideUser.firstName} ${guideUser.lastName}` : 'Guide Service',
        entityImage: randomImageUrl(1020 + guideIdx),
        providerUserId: guide.userId,
        providerName: guideUser ? `${guideUser.firstName} ${guideUser.lastName}` : null,
        referenceNumber: generateBookingRef(),
      },
    });
    bookingCount++;
  }

  // Driver bookings (20)
  const driverSample = randomItems(createdIds.drivers, Math.min(20, createdIds.drivers.length));
  for (const driverId of driverSample) {
    const travelerId = randomItem(travelerIds);
    const driverIdx = createdIds.drivers.indexOf(driverId);
    const driverUserId = createdIds.driverUserIds[driverIdx];
    if (!driverUserId || driverUserId === travelerId) continue;

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: { userId: true, vehicleType: true },
    });
    if (!driver) continue;

    const driverUser = await prisma.user.findUnique({
      where: { id: driver.userId },
      select: { firstName: true, lastName: true },
    });

    const status = randomItem(statusWeights);

    await prisma.booking.create({
      data: {
        id: uuid(),
        userId: travelerId,
        entityType: 'DRIVER',
        entityId: driverId,
        status,
        date: status === BookingStatus.COMPLETED ? pastDate(30) : futureDate(14),
        guests: randomInt(1, 4),
        totalPrice: randomInt(50, 400),
        currency: randomItem(['GEL', 'USD', 'EUR']),
        notes: randomItem(BOOKING_NOTES_TEMPLATES),
        createdAt: pastDate(status === BookingStatus.COMPLETED ? 60 : 14),
        cancelledAt: status === BookingStatus.CANCELLED ? pastDate(7) : null,
        confirmedAt: status === BookingStatus.CONFIRMED || status === BookingStatus.COMPLETED ? pastDate(12) : null,
        completedAt: status === BookingStatus.COMPLETED ? pastDate(10) : null,
        entityName: driverUser
          ? `Driver: ${driverUser.firstName} ${driverUser.lastName} (${driver.vehicleType ?? 'Vehicle'})`
          : 'Driver Service',
        entityImage: randomImageUrl(1050 + driverIdx),
        providerUserId: driver.userId,
        providerName: driverUser ? `${driverUser.firstName} ${driverUser.lastName}` : null,
        referenceNumber: generateBookingRef(),
      },
    });
    bookingCount++;
  }

  console.log(`  ✓ Created ${bookingCount} bookings with denormalized entity info`);
}

// ============================================================================
// PHASE 14: FAVORITES (~200+)
// ============================================================================

async function seedFavorites(): Promise<void> {
  console.log('\n❤️  Phase 14: Seeding Favorites...');

  let favCount = 0;
  const favKeys = new Set<string>();
  const travelerIds = createdIds.travelerUserIds;

  // Tour favorites
  for (let i = 0; i < 120; i++) {
    const userId = randomItem(travelerIds);
    const entityId = randomItem(createdIds.tours);
    const key = `${userId}:TOUR:${entityId}`;
    if (favKeys.has(key)) continue;
    favKeys.add(key);

    await prisma.favorite.create({
      data: { id: uuid(), userId, entityType: 'TOUR', entityId, createdAt: pastDate(60) },
    });
    favCount++;
  }

  // Guide favorites
  for (let i = 0; i < 50; i++) {
    const userId = randomItem(travelerIds);
    const entityId = randomItem(createdIds.guides);
    const key = `${userId}:GUIDE:${entityId}`;
    if (favKeys.has(key)) continue;
    favKeys.add(key);

    await prisma.favorite.create({
      data: { id: uuid(), userId, entityType: 'GUIDE', entityId, createdAt: pastDate(60) },
    });
    favCount++;
  }

  // Driver favorites
  for (let i = 0; i < 30; i++) {
    const userId = randomItem(travelerIds);
    const entityId = randomItem(createdIds.drivers);
    const key = `${userId}:DRIVER:${entityId}`;
    if (favKeys.has(key)) continue;
    favKeys.add(key);

    await prisma.favorite.create({
      data: { id: uuid(), userId, entityType: 'DRIVER', entityId, createdAt: pastDate(60) },
    });
    favCount++;
  }

  // Company favorites
  for (let i = 0; i < 40; i++) {
    const userId = randomItem(travelerIds);
    const entityId = randomItem(createdIds.companies);
    const key = `${userId}:COMPANY:${entityId}`;
    if (favKeys.has(key)) continue;
    favKeys.add(key);

    await prisma.favorite.create({
      data: { id: uuid(), userId, entityType: 'COMPANY', entityId, createdAt: pastDate(60) },
    });
    favCount++;
  }

  console.log(`  ✓ Created ${favCount} favorites`);
}

// ============================================================================
// PHASE 15: MEDIA (~500+)
// ============================================================================

async function seedMedia(): Promise<void> {
  console.log('\n🖼️  Phase 15: Seeding Media...');

  let mediaCount = 0;
  let imageIndex = 1100;

  // Tour images (3-5 per tour)
  for (let i = 0; i < createdIds.tours.length; i++) {
    const tourId = createdIds.tours[i];
    const ownerId = createdIds.tourOwnerIds[i];
    const numImages = randomInt(3, 5);

    for (let j = 0; j < numImages; j++) {
      await prisma.media.create({
        data: {
          id: uuid(),
          filename: `tour-${tourId.slice(0, 8)}-${j}.jpg`,
          originalName: `tour-image-${j + 1}.jpg`,
          mimeType: 'image/jpeg',
          size: randomInt(100000, 500000),
          url: `/seed-assets/image-${imageIndex}.jpg`,
          entityType: 'tour',
          entityId: tourId,
          uploadedBy: ownerId,
        },
      });
      mediaCount++;
      imageIndex = ((imageIndex - 1000) % 600) + 1000;
    }
  }

  // Company logos
  for (let i = 0; i < createdIds.companies.length; i++) {
    await prisma.media.create({
      data: {
        id: uuid(),
        filename: `company-logo-${createdIds.companies[i].slice(0, 8)}.jpg`,
        originalName: 'company-logo.jpg',
        mimeType: 'image/jpeg',
        size: randomInt(50000, 150000),
        url: `/seed-assets/image-${1000 + i}.jpg`,
        entityType: 'company',
        entityId: createdIds.companies[i],
        uploadedBy: createdIds.companyUserIds[i],
      },
    });
    mediaCount++;
  }

  // Guide photos
  for (let i = 0; i < createdIds.guides.length; i++) {
    await prisma.media.create({
      data: {
        id: uuid(),
        filename: `guide-photo-${createdIds.guides[i].slice(0, 8)}.jpg`,
        originalName: 'profile-photo.jpg',
        mimeType: 'image/jpeg',
        size: randomInt(50000, 200000),
        url: `/seed-assets/image-${1020 + (i % 80)}.jpg`,
        entityType: 'guide',
        entityId: createdIds.guides[i],
        uploadedBy: createdIds.guideUserIds[i],
      },
    });
    mediaCount++;
  }

  // Driver photos
  for (let i = 0; i < createdIds.drivers.length; i++) {
    await prisma.media.create({
      data: {
        id: uuid(),
        filename: `driver-photo-${createdIds.drivers[i].slice(0, 8)}.jpg`,
        originalName: 'profile-photo.jpg',
        mimeType: 'image/jpeg',
        size: randomInt(50000, 200000),
        url: `/seed-assets/image-${1050 + (i % 50)}.jpg`,
        entityType: 'driver',
        entityId: createdIds.drivers[i],
        uploadedBy: createdIds.driverUserIds[i],
      },
    });
    mediaCount++;
  }

  console.log(`  ✓ Created ${mediaCount} media records`);
}

// ============================================================================
// PHASE 16: BLOG POSTS (~40 total: 10 EN + 10 KA + 10 RU + extras)
// ============================================================================

async function seedBlogPosts(): Promise<void> {
  console.log('\n📝 Phase 16: Seeding Blog Posts...');

  const adminId = createdIds.adminUserIds[0];
  if (!adminId) {
    console.log('  ⚠️  No admin user found, skipping blog posts');
    return;
  }

  // Use a set of author IDs (admins + some company owners)
  const authorPool = [...createdIds.adminUserIds, ...createdIds.companyUserIds.slice(0, 4)];

  const createBlogPost = async (
    title: string, excerpt: string, content: string,
    tags: string[], isPublished: boolean, viewCount: number, imageIndex: number,
    authorId: string,
  ): Promise<void> => {
    const baseSlug = slugify(title).substring(0, 250);
    const suffix = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${suffix}`;

    const textContent = content.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ');
    const wordCount = textContent.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));
    const publishedAt = pastDate(randomInt(7, 120));

    const post = await prisma.blogPost.create({
      data: {
        id: uuid(),
        authorId,
        title,
        slug,
        excerpt,
        content,
        tags: JSON.stringify(tags),
        isPublished,
        viewCount,
        readingTime,
        publishedAt: isPublished ? publishedAt : null,
        createdAt: publishedAt,
      },
    });
    createdIds.blogPosts.push(post.id);

    // Cover image
    await prisma.media.create({
      data: {
        id: uuid(),
        filename: `blog-cover-${post.id.slice(0, 8)}.jpg`,
        originalName: `blog-cover.jpg`,
        mimeType: 'image/jpeg',
        size: randomInt(150000, 400000),
        url: `/seed-assets/image-${imageIndex}.jpg`,
        entityType: 'blog',
        entityId: post.id,
        uploadedBy: authorId,
      },
    });
  };

  // --- EN blog posts from data file ---
  for (let i = 0; i < BLOG_POSTS.length; i++) {
    const b = BLOG_POSTS[i];
    await createBlogPost(b.title, b.excerpt, b.content, b.tags, b.isPublished, b.viewCount, b.imageIndex, adminId);
  }

  // --- KA blog posts from multilingual ---
  for (let i = 0; i < BLOG_POST_TEMPLATES_KA.length; i++) {
    const b = BLOG_POST_TEMPLATES_KA[i];
    await createBlogPost(
      b.title, b.excerpt, b.content, b.tags, true,
      randomInt(100, 2000), 1070 + (i % 30),
      randomItem(authorPool),
    );
  }

  // --- RU blog posts from multilingual ---
  for (let i = 0; i < BLOG_POST_TEMPLATES_RU.length; i++) {
    const b = BLOG_POST_TEMPLATES_RU[i];
    await createBlogPost(
      b.title, b.excerpt, b.content, b.tags, true,
      randomInt(100, 2000), 1070 + (i % 30),
      randomItem(authorPool),
    );
  }

  console.log(`  ✓ Created ${createdIds.blogPosts.length} blog posts with cover images`);
}

// ============================================================================
// PHASE 17: NOTIFICATIONS (~800+)
// ============================================================================

async function seedNotifications(): Promise<void> {
  console.log('\n🔔 Phase 17: Seeding Notifications...');

  let notificationCount = 0;

  // Welcome notifications for all users
  for (const userId of createdIds.userIds) {
    await prisma.notification.create({
      data: {
        id: uuid(),
        userId,
        type: NotificationType.SYSTEM,
        title: 'Welcome to Atlas Caucasus!',
        message: 'Start exploring tours, guides, and drivers in Georgia.',
        isRead: randomBool(0.7),
        createdAt: pastDate(90),
      },
    });
    notificationCount++;
  }

  // Chat message notifications (from recent messages)
  const recentMessages = await prisma.chatMessage.findMany({
    take: 80,
    orderBy: { createdAt: 'desc' },
    include: { chat: { include: { participants: true } } },
  });

  for (const message of recentMessages) {
    for (const participant of message.chat.participants) {
      if (participant.userId === message.senderId) continue;
      await prisma.notification.create({
        data: {
          id: uuid(),
          userId: participant.userId,
          type: NotificationType.CHAT_MESSAGE,
          title: 'New message',
          message: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
          data: JSON.stringify({ chatId: message.chatId, senderId: message.senderId }),
          isRead: randomBool(0.5),
          createdAt: message.createdAt,
        },
      });
      notificationCount++;
    }
  }

  // Inquiry notifications
  const inquiries = await prisma.inquiry.findMany({ take: 30 });
  for (const inquiry of inquiries) {
    const responses = await prisma.inquiryResponse.findMany({
      where: { inquiryId: inquiry.id },
    });

    for (const response of responses) {
      await prisma.notification.create({
        data: {
          id: uuid(),
          userId: response.recipientId,
          type: NotificationType.INQUIRY_RECEIVED,
          title: 'New inquiry received',
          message: inquiry.subject,
          data: JSON.stringify({ inquiryId: inquiry.id }),
          isRead: response.status !== InquiryStatus.PENDING,
          createdAt: inquiry.createdAt,
        },
      });
      notificationCount++;

      if (response.status !== InquiryStatus.PENDING) {
        await prisma.notification.create({
          data: {
            id: uuid(),
            userId: inquiry.userId,
            type: NotificationType.INQUIRY_RESPONSE,
            title: `Inquiry ${response.status.toLowerCase()}`,
            message: response.message || `Your inquiry has been ${response.status.toLowerCase()}.`,
            data: JSON.stringify({ inquiryId: inquiry.id, responseId: response.id }),
            isRead: randomBool(0.5),
            createdAt: response.respondedAt || new Date(),
          },
        });
        notificationCount++;
      }
    }
  }

  // Booking notifications
  const bookings = await prisma.booking.findMany({ take: 60 });
  for (const booking of bookings) {
    // Booking request to provider
    if (booking.providerUserId) {
      await prisma.notification.create({
        data: {
          id: uuid(),
          userId: booking.providerUserId,
          type: NotificationType.BOOKING_REQUEST,
          title: 'New booking request',
          message: `New booking for ${booking.entityName ?? booking.entityType}`,
          data: JSON.stringify({ bookingId: booking.id }),
          isRead: booking.status !== BookingStatus.PENDING,
          createdAt: booking.createdAt,
        },
      });
      notificationCount++;
    }

    // Status notification to customer
    if (booking.status === BookingStatus.CONFIRMED) {
      await prisma.notification.create({
        data: {
          id: uuid(),
          userId: booking.userId,
          type: NotificationType.BOOKING_CONFIRMED,
          title: 'Booking confirmed',
          message: `Your booking for ${booking.entityName ?? booking.entityType} has been confirmed!`,
          data: JSON.stringify({ bookingId: booking.id }),
          isRead: randomBool(0.6),
          createdAt: booking.confirmedAt ?? booking.createdAt,
        },
      });
      notificationCount++;
    }

    if (booking.status === BookingStatus.COMPLETED) {
      await prisma.notification.create({
        data: {
          id: uuid(),
          userId: booking.userId,
          type: NotificationType.BOOKING_COMPLETED,
          title: 'Booking completed',
          message: `Your booking for ${booking.entityName ?? booking.entityType} is complete. Leave a review!`,
          data: JSON.stringify({ bookingId: booking.id }),
          isRead: randomBool(0.3),
          createdAt: booking.completedAt ?? booking.createdAt,
        },
      });
      notificationCount++;
    }
  }

  // Profile verified notifications
  const verifiedGuides = await prisma.guide.findMany({ where: { isVerified: true }, take: 15, select: { userId: true } });
  for (const g of verifiedGuides) {
    await prisma.notification.create({
      data: {
        id: uuid(),
        userId: g.userId,
        type: NotificationType.PROFILE_VERIFIED,
        title: 'Profile verified!',
        message: 'Your guide profile has been verified by our team. You will now appear in verified search results.',
        isRead: true,
        createdAt: pastDate(60),
      },
    });
    notificationCount++;
  }

  console.log(`  ✓ Created ${notificationCount} notifications`);
}

// ============================================================================
// PHASE 18: AUDIT LOGS (~200+)
// ============================================================================

async function seedAuditLogs(): Promise<void> {
  console.log('\n📋 Phase 18: Seeding Audit Logs...');

  let logCount = 0;
  const adminId = createdIds.adminUserIds[0];

  // Login events for many users
  const sampleUsers = shuffle(createdIds.userIds).slice(0, 60);
  for (const userId of sampleUsers) {
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        action: AuditAction.LOGIN_SUCCESS,
        userId,
        targetType: 'user',
        targetId: userId,
        ipAddress: `192.168.${randomInt(0, 255)}.${randomInt(1, 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: JSON.stringify({ method: 'password' }),
        status: 'SUCCESS',
        createdAt: pastDate(30),
      },
    });
    logCount++;
  }

  // Failed login attempts
  for (let i = 0; i < 15; i++) {
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        action: AuditAction.LOGIN_FAILED,
        userId: null,
        targetType: 'user',
        targetId: null,
        ipAddress: `10.0.${randomInt(0, 255)}.${randomInt(1, 255)}`,
        userAgent: 'Mozilla/5.0',
        metadata: JSON.stringify({ email: `unknown${i}@test.com` }),
        status: 'FAILED',
        errorMessage: 'Invalid credentials',
        createdAt: pastDate(14),
      },
    });
    logCount++;
  }

  // Profile updates
  for (let i = 0; i < 30; i++) {
    const userId = randomItem(createdIds.userIds);
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        action: AuditAction.USER_UPDATE,
        userId,
        targetType: 'user',
        targetId: userId,
        metadata: JSON.stringify({ fields: ['firstName', 'lastName', 'phoneNumber'] }),
        status: 'SUCCESS',
        createdAt: pastDate(60),
      },
    });
    logCount++;
  }

  // Tour creations
  for (let i = 0; i < Math.min(40, createdIds.tours.length); i++) {
    const tourId = createdIds.tours[i];
    const ownerId = createdIds.tourOwnerIds[i];
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        action: AuditAction.TOUR_CREATE,
        userId: ownerId,
        targetType: 'tour',
        targetId: tourId,
        status: 'SUCCESS',
        createdAt: pastDate(90),
      },
    });
    logCount++;
  }

  // Company creation events
  for (let i = 0; i < createdIds.companies.length; i++) {
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        action: AuditAction.COMPANY_CREATE,
        userId: createdIds.companyUserIds[i],
        targetType: 'company',
        targetId: createdIds.companies[i],
        status: 'SUCCESS',
        createdAt: pastDate(120),
      },
    });
    logCount++;
  }

  // Guide/driver verification events by admin
  if (adminId) {
    for (let i = 0; i < Math.min(15, createdIds.guides.length); i++) {
      await prisma.auditLog.create({
        data: {
          id: uuid(),
          action: AuditAction.GUIDE_VERIFY,
          userId: adminId,
          targetType: 'guide',
          targetId: createdIds.guides[i],
          status: 'SUCCESS',
          createdAt: pastDate(45),
        },
      });
      logCount++;
    }

    for (let i = 0; i < Math.min(10, createdIds.drivers.length); i++) {
      await prisma.auditLog.create({
        data: {
          id: uuid(),
          action: AuditAction.DRIVER_VERIFY,
          userId: adminId,
          targetType: 'driver',
          targetId: createdIds.drivers[i],
          status: 'SUCCESS',
          createdAt: pastDate(45),
        },
      });
      logCount++;
    }
  }

  // Password changes
  for (let i = 0; i < 10; i++) {
    const userId = randomItem(createdIds.userIds);
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        action: AuditAction.PASSWORD_CHANGE,
        userId,
        targetType: 'user',
        targetId: userId,
        status: 'SUCCESS',
        createdAt: pastDate(30),
      },
    });
    logCount++;
  }

  // Email verification events
  for (let i = 0; i < 20; i++) {
    const userId = randomItem(createdIds.userIds);
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        action: AuditAction.EMAIL_VERIFICATION,
        userId,
        targetType: 'user',
        targetId: userId,
        status: 'SUCCESS',
        createdAt: pastDate(90),
      },
    });
    logCount++;
  }

  console.log(`  ✓ Created ${logCount} audit log entries`);
}

// ============================================================================
// PHASE 19: AI CREDITS & GENERATIONS
// ============================================================================

async function seedAiAndCredits(): Promise<void> {
  console.log('\n🤖 Phase 19: Seeding AI Credits & Generations...');

  // --- Template configs ---
  const templates = [
    {
      id: 'tour-description',
      name: 'Tour Description Generator',
      description: 'Generate compelling tour descriptions from key details.',
      type: AiGenerationType.TOUR_DESCRIPTION,
      creditCost: 2,
      maxOutputTokens: 1000,
      temperature: 0.7,
      systemPrompt: 'You are a professional travel copywriter. Write engaging tour descriptions for the Georgia/Caucasus region.',
      fields: JSON.stringify([
        { name: 'tourTitle', label: 'Tour Title', type: 'text', required: true },
        { name: 'highlights', label: 'Key Highlights', type: 'textarea', required: true },
        { name: 'duration', label: 'Duration', type: 'text', required: false },
      ]),
    },
    {
      id: 'tour-itinerary',
      name: 'Tour Itinerary Builder',
      description: 'Create detailed day-by-day itineraries for tours.',
      type: AiGenerationType.TOUR_ITINERARY,
      creditCost: 3,
      maxOutputTokens: 2000,
      temperature: 0.6,
      systemPrompt: 'You are a tour planning expert. Create detailed, realistic itineraries for tours in the Caucasus region.',
      fields: JSON.stringify([
        { name: 'tourTitle', label: 'Tour Title', type: 'text', required: true },
        { name: 'days', label: 'Number of Days', type: 'number', required: true },
        { name: 'locations', label: 'Locations to Visit', type: 'textarea', required: true },
      ]),
    },
    {
      id: 'marketing-copy',
      name: 'Marketing Copy Generator',
      description: 'Generate marketing text for social media and ads.',
      type: AiGenerationType.MARKETING_COPY,
      creditCost: 1,
      maxOutputTokens: 500,
      temperature: 0.8,
      systemPrompt: 'You are a tourism marketing specialist. Write compelling, concise marketing copy.',
      fields: JSON.stringify([
        { name: 'product', label: 'Product/Service', type: 'text', required: true },
        { name: 'platform', label: 'Platform (e.g., Instagram, Facebook)', type: 'text', required: false },
        { name: 'tone', label: 'Tone (e.g., adventurous, luxury)', type: 'text', required: false },
      ]),
    },
    {
      id: 'blog-content',
      name: 'Blog Content Writer',
      description: 'Generate blog articles about Georgia and travel topics.',
      type: AiGenerationType.BLOG_CONTENT,
      creditCost: 5,
      maxOutputTokens: 3000,
      temperature: 0.7,
      systemPrompt: 'You are a travel blogger specializing in Georgia and the Caucasus. Write informative, engaging blog articles.',
      fields: JSON.stringify([
        { name: 'topic', label: 'Blog Topic', type: 'text', required: true },
        { name: 'keywords', label: 'SEO Keywords', type: 'text', required: false },
        { name: 'length', label: 'Target Word Count', type: 'number', required: false },
      ]),
    },
  ];

  for (const t of templates) {
    await prisma.aiTemplateConfig.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        name: t.name,
        description: t.description,
        type: t.type,
        creditCost: t.creditCost,
        maxOutputTokens: t.maxOutputTokens,
        temperature: t.temperature,
        systemPrompt: t.systemPrompt,
        fields: t.fields,
        isActive: true,
      },
    });
  }
  console.log(`  ✓ Created ${templates.length} AI template configs`);

  // --- Credit balances for providers ---
  const providerIds = Array.from(new Set([...createdIds.companyUserIds, ...createdIds.guideUserIds]));
  let balanceCount = 0;
  let txCount = 0;
  let genCount = 0;

  for (const userId of providerIds) {
    const initialCredits = randomInt(10, 50);
    const usedCredits = randomInt(0, Math.min(initialCredits - 1, 20));
    const currentBalance = initialCredits - usedCredits;

    await prisma.creditBalance.create({
      data: { id: uuid(), userId, balance: currentBalance },
    });
    balanceCount++;

    // Initial grant transaction
    await prisma.creditTransaction.create({
      data: {
        id: uuid(),
        userId,
        amount: initialCredits,
        type: CreditTransactionType.INITIAL_GRANT,
        description: 'Welcome credits',
        balanceAfter: initialCredits,
        createdAt: pastDate(90),
      },
    });
    txCount++;

    // Debit transactions for used credits
    let runningBalance = initialCredits;
    for (let d = 0; d < usedCredits; d++) {
      const cost = 1; // simplified
      runningBalance -= cost;
      await prisma.creditTransaction.create({
        data: {
          id: uuid(),
          userId,
          amount: -cost,
          type: CreditTransactionType.GENERATION_DEBIT,
          description: `AI generation`,
          balanceAfter: runningBalance,
          createdAt: pastDate(randomInt(1, 80)),
        },
      });
      txCount++;
    }

    // Create some AI generations
    const numGenerations = randomInt(0, Math.min(5, usedCredits));
    for (let g = 0; g < numGenerations; g++) {
      const template = randomItem(templates);
      await prisma.aiGeneration.create({
        data: {
          id: uuid(),
          userId,
          type: template.type,
          templateId: template.id,
          prompt: `Generate ${template.type.toLowerCase().replace('_', ' ')} content`,
          userInputs: JSON.stringify({ tourTitle: 'Sample Tour', highlights: 'Mountains, Wine, Culture' }),
          result: randomBool(0.9) ? 'Generated content placeholder for seed data.' : null,
          status: randomBool(0.9) ? AiGenerationStatus.COMPLETED : AiGenerationStatus.FAILED,
          creditCost: template.creditCost,
          errorMessage: randomBool(0.1) ? 'Rate limit exceeded' : null,
          createdAt: pastDate(randomInt(1, 60)),
        },
      });
      genCount++;
    }
  }

  console.log(`  ✓ Created ${balanceCount} credit balances, ${txCount} transactions, ${genCount} AI generations`);
}

// ============================================================================
// PHASE 20: RESPONSE TIMES
// ============================================================================

async function seedResponseTimes(): Promise<void> {
  console.log('\n⏱️  Phase 20: Seeding Response Times...');

  // Update companies
  for (const companyId of createdIds.companies) {
    await prisma.company.update({
      where: { id: companyId },
      data: {
        avgResponseTimeMinutes: randomInt(15, 480),
        responseCount: randomInt(5, 50),
      },
    });
  }

  // Update guides
  for (const guideId of createdIds.guides) {
    await prisma.guide.update({
      where: { id: guideId },
      data: {
        avgResponseTimeMinutes: randomInt(10, 360),
        responseCount: randomInt(3, 40),
      },
    });
  }

  // Update drivers
  for (const driverId of createdIds.drivers) {
    await prisma.driver.update({
      where: { id: driverId },
      data: {
        avgResponseTimeMinutes: randomInt(10, 240),
        responseCount: randomInt(2, 30),
      },
    });
  }

  console.log(`  ✓ Updated response times for ${createdIds.companies.length} companies, ${createdIds.guides.length} guides, ${createdIds.drivers.length} drivers`);
}

// ============================================================================
// PHASE 21: VIEW COUNTS
// ============================================================================

async function seedViewCounts(): Promise<void> {
  console.log('\n👀 Phase 21: Seeding View Counts...');

  for (const tourId of createdIds.tours) {
    await prisma.tour.update({
      where: { id: tourId },
      data: { viewCount: randomInt(10, 5000) },
    });
  }

  for (const companyId of createdIds.companies) {
    await prisma.company.update({
      where: { id: companyId },
      data: { viewCount: randomInt(50, 3000) },
    });
  }

  for (const guideId of createdIds.guides) {
    await prisma.guide.update({
      where: { id: guideId },
      data: { viewCount: randomInt(20, 2000) },
    });
  }

  for (const driverId of createdIds.drivers) {
    await prisma.driver.update({
      where: { id: driverId },
      data: { viewCount: randomInt(10, 1500) },
    });
  }

  console.log(`  ✓ Updated view counts for tours, companies, guides, drivers`);
}

// ============================================================================
// PHASE 22: USER SESSIONS
// ============================================================================

async function seedUserSessions(): Promise<void> {
  console.log('\n🔑 Phase 22: Seeding User Sessions...');

  let sessionCount = 0;
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  ];

  // Active sessions for ~40 users
  const activeUsers = randomItems(createdIds.userIds, 40);
  for (const userId of activeUsers) {
    const numSessions = randomInt(1, 3);
    for (let i = 0; i < numSessions; i++) {
      await prisma.userSession.create({
        data: {
          id: uuid(),
          userId,
          refreshTokenHash: `seed-hash-${uuid().slice(0, 16)}`,
          expiresAt: futureDate(7),
          revokedAt: null,
          userAgent: randomItem(userAgents),
          ipAddress: `${randomInt(1, 223)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 255)}`,
          lastUsedAt: pastDate(1),
        },
      });
      sessionCount++;
    }
  }

  // Expired/revoked sessions for ~20 users
  const expiredUsers = randomItems(createdIds.userIds, 20);
  for (const userId of expiredUsers) {
    await prisma.userSession.create({
      data: {
        id: uuid(),
        userId,
        refreshTokenHash: `seed-expired-${uuid().slice(0, 16)}`,
        expiresAt: pastDate(1),
        revokedAt: pastDate(2),
        userAgent: randomItem(userAgents),
        ipAddress: `${randomInt(1, 223)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 255)}`,
        lastUsedAt: pastDate(3),
      },
    });
    sessionCount++;
  }

  console.log(`  ✓ Created ${sessionCount} user sessions`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           UNIFIED DATABASE SEEDER (seed-all)            ║');
  console.log('║                                                         ║');
  console.log('║   Seeds ALL 35 tables with ~4x data volume             ║');
  console.log('║   ~192 users, ~32 companies, ~56 guides, ~40 drivers   ║');
  console.log('║   ~200 tours, ~580+ reviews, ~80 chats, ~100 bookings  ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  const startTime = Date.now();
  const skipClear = process.argv.includes('--skip-clear');

  try {
    // Phase 0: Clear data (unless --skip-clear)
    if (!skipClear) {
      await clearAllData();
    } else {
      console.log('\n⏭️  Skipping data clear (--skip-clear flag)');
    }

    // Phase 1-7: Core entities
    await seedLocations();
    await seedUsers();
    await seedCompanies();
    await seedGuides();
    await seedDrivers();
    await seedTours();
    await seedItineraries();

    // Phase 8-9: Reviews & ratings
    await seedReviews();
    await updateAverageRatings();

    // Phase 10-11: Chat system
    await seedChats();
    await seedReadReceipts();

    // Phase 12-13: Inquiries & bookings
    await seedInquiries();
    await seedBookings();

    // Phase 14-16: Favorites, media, blogs
    await seedFavorites();
    await seedMedia();
    await seedBlogPosts();

    // Phase 17-18: Notifications & audit logs
    await seedNotifications();
    await seedAuditLogs();

    // Phase 19: AI credits & generations
    await seedAiAndCredits();

    // Phase 20-22: Response times, view counts, sessions
    await seedResponseTimes();
    await seedViewCounts();
    await seedUserSessions();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('✅ Database seeded successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   Locations:     ${createdIds.locations.length}`);
    console.log(`   Users:         ${createdIds.users.size}`);
    console.log(`   Companies:     ${createdIds.companies.length}`);
    console.log(`   Guides:        ${createdIds.guides.length}`);
    console.log(`   Drivers:       ${createdIds.drivers.length}`);
    console.log(`   Tours:         ${createdIds.tours.length}`);
    console.log(`   Blog Posts:    ${createdIds.blogPosts.length}`);
    console.log(`   Chats:         ${createdIds.chats.length}`);
    console.log(`   Inquiries:     ${createdIds.inquiries.length}`);
    console.log('');
    console.log(`⏱️  Completed in ${duration}s`);
    console.log('');
    console.log(`🔑 Default password for all users: ${DEFAULT_PASSWORD}`);
    console.log('');
    console.log('💡 Run "npm run prisma:studio" to view the data');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
