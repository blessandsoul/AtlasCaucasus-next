/**
 * Realistic Database Seeder
 *
 * Creates a complete, logically consistent database with:
 * - 48 users across all roles
 * - 6 companies with tour agents
 * - 12 guides, 10 drivers
 * - 50 tours with locations
 * - 145+ reviews
 * - Chats, messages, inquiries, notifications
 * - Media records
 * - Audit logs
 *
 * Usage: npx tsx scripts/db/seed-realistic.ts
 */

import { PrismaClient, UserRole, ChatType, NotificationType, InquiryTargetType, InquiryStatus, ReviewTargetType, AuditAction, TourDifficulty, BookingStatus } from '@prisma/client';
import { getHashedPassword, DEFAULT_PASSWORD } from './utils/password.js';
import { uuid, randomItem, randomItems, randomInt, randomBool, randomImageUrl, randomRating, pastDate, futureDate, createProgressLogger, slugify } from './utils/helpers.js';
import { ALL_USERS, ADMIN_USERS, COMPANY_OWNER_USERS, TOUR_AGENT_USERS, GUIDE_USERS, DRIVER_USERS, TRAVELER_USERS, MULTI_ROLE_USERS } from './data/users.js';
import { COMPANIES } from './data/companies.js';
import { GUIDE_PROFILES, MULTI_ROLE_GUIDE_PROFILES, ALL_GUIDE_PROFILES } from './data/guides.js';
import { DRIVER_PROFILES, MULTI_ROLE_DRIVER_PROFILES, ALL_DRIVER_PROFILES } from './data/drivers.js';
import { ALL_TOURS, COMPANY_TOURS, INDIVIDUAL_TOURS } from './data/tours.js';
import { getRandomComment } from './data/reviews.js';
import { INQUIRY_MESSAGES, RESPONSE_MESSAGES, FOLLOW_UP_MESSAGES, CASUAL_CHAT_MESSAGES, generateConversation } from './data/messages.js';
import { BLOG_POSTS } from './data/blogs.js';

// Define UserData type based on usage
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

// Georgian locations data (same as existing seed)
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

// Store created IDs for relationships
interface CreatedIds {
  locations: string[];
  users: Map<string, string>; // email -> id
  companies: string[];
  guides: string[];
  drivers: string[];
  tours: string[];
  chats: string[];
  blogPosts: string[];
}

const createdIds: CreatedIds = {
  locations: [],
  users: new Map(),
  companies: [],
  guides: [],
  drivers: [],
  tours: [],
  chats: [],
  blogPosts: [],
};

// ============================================================================
// PHASE 1: LOCATIONS
// ============================================================================

async function seedLocations(): Promise<void> {
  console.log('\n📍 Phase 1: Seeding Locations...');

  // Check if locations exist
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
// PHASE 2: USERS
// ============================================================================

async function seedUsers(): Promise<void> {
  console.log('\n👥 Phase 2: Seeding Users...');

  const passwordHash = await getHashedPassword();
  const progress = createProgressLogger(ALL_USERS.length, 'Users');

  // First, create all users without parentCompanyId
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

    // Create role assignments
    for (const role of userData.roles) {
      await prisma.userRoleAssignment.create({
        data: {
          id: uuid(),
          userId,
          role,
        },
      });
    }

    createdIds.users.set(userData.email, userId);
    progress.increment();
  }

  // Now update tour agents with parentCompanyId
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

  progress.done();
  console.log(`  ℹ️  Default password for all users: ${DEFAULT_PASSWORD}`);
}

// ============================================================================
// PHASE 3: COMPANIES
// ============================================================================

async function seedCompanies(): Promise<void> {
  console.log('\n🏢 Phase 3: Seeding Companies...');

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
        averageRating: null, // Will be calculated from reviews
        reviewCount: 0,
      },
    });

    createdIds.companies.push(company.id);
  }

  // Also create companies for multi-role users with COMPANY role
  for (let i = 0; i < 2; i++) {
    const multiRoleUser = MULTI_ROLE_USERS[i + 2]; // indices 2-3 are Company+Guide
    const userId = createdIds.users.get(multiRoleUser.email);

    if (!userId) continue;

    const company = await prisma.company.create({
      data: {
        id: uuid(),
        userId,
        companyName: `${multiRoleUser.firstName}'s Tours`,
        description: `Boutique tour company run by ${multiRoleUser.firstName} ${multiRoleUser.lastName}, offering personalized experiences.`,
        registrationNumber: `GE-2022-TR-${100000 + i}`,
        logoUrl: randomImageUrl(1010 + i),
        phoneNumber: multiRoleUser.phoneNumber,
        isVerified: true,
        averageRating: null,
        reviewCount: 0,
      },
    });

    createdIds.companies.push(company.id);
  }

  console.log(`  ✓ Created ${createdIds.companies.length} companies`);
}

// ============================================================================
// PHASE 4: GUIDES
// ============================================================================

async function seedGuides(): Promise<void> {
  console.log('\n🎒 Phase 4: Seeding Guides...');

  // Regular guide users
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
        averageRating: null,
        reviewCount: 0,
      },
    });

    createdIds.guides.push(guide.id);

    // Create guide-location assignments
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
    const userIndex = profile.userIndex - 10; // Adjust index
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
        averageRating: null,
        reviewCount: 0,
      },
    });

    createdIds.guides.push(guide.id);

    // Create guide-location assignments
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

  console.log(`  ✓ Created ${createdIds.guides.length} guides with location assignments`);
}

// ============================================================================
// PHASE 5: DRIVERS
// ============================================================================

async function seedDrivers(): Promise<void> {
  console.log('\n🚗 Phase 5: Seeding Drivers...');

  // Regular driver users
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
        averageRating: null,
        reviewCount: 0,
      },
    });

    createdIds.drivers.push(driver.id);

    // Create driver-location assignments
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

  // Multi-role drivers (indices 0-1 from MULTI_ROLE_USERS)
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
        averageRating: null,
        reviewCount: 0,
      },
    });

    createdIds.drivers.push(driver.id);

    // Create driver-location assignments
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

  console.log(`  ✓ Created ${createdIds.drivers.length} drivers with location assignments`);
}

// ============================================================================
// PHASE 6: TOURS
// ============================================================================

async function seedTours(): Promise<void> {
  console.log('\n🗺️  Phase 6: Seeding Tours...');

  let imageCounter = 1100;

  for (const tourData of ALL_TOURS) {
    let ownerId: string;
    let companyId: string | null = null;

    if (tourData.companyIndex !== null) {
      // Company tour
      const companyOwner = COMPANY_OWNER_USERS[tourData.companyIndex];
      ownerId = createdIds.users.get(companyOwner.email)!;
      companyId = createdIds.companies[tourData.companyIndex];
    } else {
      // Individual tour
      if (tourData.ownerType === 'guide') {
        const guideUser = tourData.ownerIndex! < 10
          ? GUIDE_USERS[tourData.ownerIndex!]
          : MULTI_ROLE_USERS[tourData.ownerIndex! - 10];
        ownerId = createdIds.users.get(guideUser.email)!;
      } else {
        // Tour agent
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
        averageRating: null,
        reviewCount: 0,
      },
    });

    createdIds.tours.push(tour.id);

    // Create tour-location assignments
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

    imageCounter++;
  }

  console.log(`  ✓ Created ${createdIds.tours.length} tours with location assignments`);
}

// ============================================================================
// PHASE 7: REVIEWS
// ============================================================================

async function seedReviews(): Promise<void> {
  console.log('\n⭐ Phase 7: Seeding Reviews...');

  const travelerEmails = TRAVELER_USERS.map((u: UserData) => u.email);
  let reviewCount = 0;

  // Tour reviews (2-4 reviews per tour)
  for (const tourId of createdIds.tours) {
    const numReviews = randomInt(2, 4);
    const reviewerEmails = randomItems(travelerEmails, numReviews);

    for (const email of reviewerEmails) {
      const userId = createdIds.users.get(email);
      if (!userId) continue;

      const rating = randomRating();
      await prisma.review.create({
        data: {
          id: uuid(),
          userId,
          targetType: ReviewTargetType.TOUR,
          targetId: tourId,
          rating,
          comment: getRandomComment(ReviewTargetType.TOUR, rating),
          createdAt: pastDate(randomInt(1, 180)),
        },
      });
      reviewCount++;
    }
  }

  // Guide reviews (2-3 reviews per guide)
  for (const guideId of createdIds.guides) {
    const numReviews = randomInt(2, 3);
    const reviewerEmails = randomItems(travelerEmails, numReviews);

    for (const email of reviewerEmails) {
      const userId = createdIds.users.get(email);
      if (!userId) continue;

      // Get the guide's userId to avoid self-review
      const guide = await prisma.guide.findUnique({ where: { id: guideId } });
      if (guide && guide.userId === userId) continue;

      const rating = randomRating();
      await prisma.review.create({
        data: {
          id: uuid(),
          userId,
          targetType: ReviewTargetType.GUIDE,
          targetId: guideId,
          rating,
          comment: getRandomComment(ReviewTargetType.GUIDE, rating),
          createdAt: pastDate(randomInt(1, 180)),
        },
      });
      reviewCount++;
    }
  }

  // Driver reviews (1-3 reviews per driver)
  for (const driverId of createdIds.drivers) {
    const numReviews = randomInt(1, 3);
    const reviewerEmails = randomItems(travelerEmails, numReviews);

    for (const email of reviewerEmails) {
      const userId = createdIds.users.get(email);
      if (!userId) continue;

      const driver = await prisma.driver.findUnique({ where: { id: driverId } });
      if (driver && driver.userId === userId) continue;

      const rating = randomRating();
      await prisma.review.create({
        data: {
          id: uuid(),
          userId,
          targetType: ReviewTargetType.DRIVER,
          targetId: driverId,
          rating,
          comment: getRandomComment(ReviewTargetType.DRIVER, rating),
          createdAt: pastDate(randomInt(1, 180)),
        },
      });
      reviewCount++;
    }
  }

  // Company reviews (2-3 reviews per company)
  for (const companyId of createdIds.companies) {
    const numReviews = randomInt(2, 3);
    const reviewerEmails = randomItems(travelerEmails, numReviews);

    for (const email of reviewerEmails) {
      const userId = createdIds.users.get(email);
      if (!userId) continue;

      const company = await prisma.company.findUnique({ where: { id: companyId } });
      if (company && company.userId === userId) continue;

      const rating = randomRating();
      await prisma.review.create({
        data: {
          id: uuid(),
          userId,
          targetType: ReviewTargetType.COMPANY,
          targetId: companyId,
          rating,
          comment: getRandomComment(ReviewTargetType.COMPANY, rating),
          createdAt: pastDate(randomInt(1, 180)),
        },
      });
      reviewCount++;
    }
  }

  console.log(`  ✓ Created ${reviewCount} reviews`);

  // Update average ratings
  await updateAverageRatings();
}

async function updateAverageRatings(): Promise<void> {
  console.log('  Updating average ratings...');

  // Update tour ratings
  const tourRatings = await prisma.review.groupBy({
    by: ['targetId'],
    where: { targetType: ReviewTargetType.TOUR },
    _avg: { rating: true },
    _count: { rating: true },
  });

  for (const tr of tourRatings) {
    await prisma.tour.update({
      where: { id: tr.targetId },
      data: {
        averageRating: tr._avg.rating,
        reviewCount: tr._count.rating,
      },
    });
  }

  // Update guide ratings
  const guideRatings = await prisma.review.groupBy({
    by: ['targetId'],
    where: { targetType: ReviewTargetType.GUIDE },
    _avg: { rating: true },
    _count: { rating: true },
  });

  for (const gr of guideRatings) {
    await prisma.guide.update({
      where: { id: gr.targetId },
      data: {
        averageRating: gr._avg.rating,
        reviewCount: gr._count.rating,
      },
    });
  }

  // Update driver ratings
  const driverRatings = await prisma.review.groupBy({
    by: ['targetId'],
    where: { targetType: ReviewTargetType.DRIVER },
    _avg: { rating: true },
    _count: { rating: true },
  });

  for (const dr of driverRatings) {
    await prisma.driver.update({
      where: { id: dr.targetId },
      data: {
        averageRating: dr._avg.rating,
        reviewCount: dr._count.rating,
      },
    });
  }

  // Update company ratings
  const companyRatings = await prisma.review.groupBy({
    by: ['targetId'],
    where: { targetType: ReviewTargetType.COMPANY },
    _avg: { rating: true },
    _count: { rating: true },
  });

  for (const cr of companyRatings) {
    await prisma.company.update({
      where: { id: cr.targetId },
      data: {
        averageRating: cr._avg.rating,
        reviewCount: cr._count.rating,
      },
    });
  }

  console.log('  ✓ Average ratings updated');
}

// ============================================================================
// PHASE 8: CHATS & MESSAGES
// ============================================================================

async function seedChats(): Promise<void> {
  console.log('\n💬 Phase 8: Seeding Chats & Messages...');

  let chatCount = 0;
  let messageCount = 0;

  const travelerEmails = TRAVELER_USERS.map((u: UserData) => u.email);
  const guideEmails = GUIDE_USERS.map((u: UserData) => u.email);
  const companyEmails = COMPANY_OWNER_USERS.map((u: UserData) => u.email);

  // Create direct chats between travelers and guides/companies
  for (let i = 0; i < 15; i++) {
    const travelerEmail = randomItem(travelerEmails);
    const providerEmail = randomBool() ? randomItem(guideEmails) : randomItem(companyEmails);

    const travelerId = createdIds.users.get(travelerEmail);
    const providerId = createdIds.users.get(providerEmail);

    if (!travelerId || !providerId) continue;

    const chat = await prisma.chat.create({
      data: {
        id: uuid(),
        type: ChatType.DIRECT,
        creatorId: travelerId,
      },
    });

    createdIds.chats.push(chat.id);
    chatCount++;

    // Add participants
    await prisma.chatParticipant.createMany({
      data: [
        { id: uuid(), chatId: chat.id, userId: travelerId },
        { id: uuid(), chatId: chat.id, userId: providerId },
      ],
    });

    // Add messages
    const conversationType = guideEmails.includes(providerEmail) ? 'guide' : 'company';
    const messages = generateConversation(conversationType as 'guide' | 'company', randomInt(3, 6));

    for (let j = 0; j < messages.length; j++) {
      const senderId = j % 2 === 0 ? travelerId : providerId;
      await prisma.chatMessage.create({
        data: {
          id: uuid(),
          chatId: chat.id,
          senderId,
          content: messages[j],
          createdAt: new Date(Date.now() - (messages.length - j) * 3600000),
        },
      });
      messageCount++;
    }
  }

  // Create a few group chats
  for (let i = 0; i < 5; i++) {
    const groupMembers = randomItems(travelerEmails, randomInt(3, 5));
    const creatorEmail = groupMembers[0];
    const creatorId = createdIds.users.get(creatorEmail);

    if (!creatorId) continue;

    const chat = await prisma.chat.create({
      data: {
        id: uuid(),
        type: ChatType.GROUP,
        name: `Georgia Trip ${i + 1}`,
        creatorId,
      },
    });

    createdIds.chats.push(chat.id);
    chatCount++;

    // Add participants
    for (const email of groupMembers) {
      const userId = createdIds.users.get(email);
      if (userId) {
        await prisma.chatParticipant.create({
          data: { id: uuid(), chatId: chat.id, userId },
        });
      }
    }

    // Add casual messages
    const numMessages = randomInt(5, 10);
    for (let j = 0; j < numMessages; j++) {
      const senderEmail = randomItem(groupMembers);
      const senderId = createdIds.users.get(senderEmail);
      if (senderId) {
        await prisma.chatMessage.create({
          data: {
            id: uuid(),
            chatId: chat.id,
            senderId,
            content: randomItem(CASUAL_CHAT_MESSAGES),
            createdAt: new Date(Date.now() - (numMessages - j) * 1800000),
          },
        });
        messageCount++;
      }
    }
  }

  console.log(`  ✓ Created ${chatCount} chats with ${messageCount} messages`);
}

// ============================================================================
// PHASE 9: INQUIRIES
// ============================================================================

async function seedInquiries(): Promise<void> {
  console.log('\n📩 Phase 9: Seeding Inquiries...');

  let inquiryCount = 0;
  let responseCount = 0;

  const travelerEmails = TRAVELER_USERS.map((u: UserData) => u.email);
  const statuses = [InquiryStatus.PENDING, InquiryStatus.RESPONDED, InquiryStatus.ACCEPTED, InquiryStatus.DECLINED];

  // Tour inquiries
  for (let i = 0; i < 5; i++) {
    const userId = createdIds.users.get(randomItem(travelerEmails))!;
    const targetTours = randomItems(createdIds.tours, randomInt(1, 3));

    const inquiry = await prisma.inquiry.create({
      data: {
        id: uuid(),
        userId,
        targetType: InquiryTargetType.TOUR,
        targetIds: JSON.stringify(targetTours),
        subject: 'Tour booking inquiry',
        message: randomItem(INQUIRY_MESSAGES.tour),
        requiresPayment: targetTours.length > 2,
        expiresAt: futureDate(30),
      },
    });
    inquiryCount++;

    // Get tour owner IDs and create responses
    for (const tourId of targetTours) {
      const tour = await prisma.tour.findUnique({ where: { id: tourId } });
      if (tour) {
        const status = randomItem(statuses);
        await prisma.inquiryResponse.create({
          data: {
            id: uuid(),
            inquiryId: inquiry.id,
            recipientId: tour.ownerId,
            status,
            message: status !== InquiryStatus.PENDING
              ? randomItem(RESPONSE_MESSAGES[status === InquiryStatus.ACCEPTED ? 'positive' : 'neutral'])
              : null,
            respondedAt: status !== InquiryStatus.PENDING ? new Date() : null,
          },
        });
        responseCount++;
      }
    }
  }

  // Guide inquiries
  for (let i = 0; i < 5; i++) {
    const userId = createdIds.users.get(randomItem(travelerEmails))!;
    const targetGuides = randomItems(createdIds.guides, randomInt(1, 2));

    // Get guide user IDs
    const guideUserIds: string[] = [];
    for (const guideId of targetGuides) {
      const guide = await prisma.guide.findUnique({ where: { id: guideId } });
      if (guide) guideUserIds.push(guide.userId);
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        id: uuid(),
        userId,
        targetType: InquiryTargetType.GUIDE,
        targetIds: JSON.stringify(targetGuides),
        subject: 'Guide availability inquiry',
        message: randomItem(INQUIRY_MESSAGES.guide),
        requiresPayment: targetGuides.length > 2,
        expiresAt: futureDate(30),
      },
    });
    inquiryCount++;

    for (const recipientId of guideUserIds) {
      const status = randomItem(statuses);
      await prisma.inquiryResponse.create({
        data: {
          id: uuid(),
          inquiryId: inquiry.id,
          recipientId,
          status,
          message: status !== InquiryStatus.PENDING
            ? randomItem(RESPONSE_MESSAGES[status === InquiryStatus.ACCEPTED ? 'positive' : 'negative'])
            : null,
          respondedAt: status !== InquiryStatus.PENDING ? new Date() : null,
        },
      });
      responseCount++;
    }
  }

  // Driver inquiries
  for (let i = 0; i < 5; i++) {
    const userId = createdIds.users.get(randomItem(travelerEmails))!;
    const targetDrivers = randomItems(createdIds.drivers, randomInt(1, 2));

    const driverUserIds: string[] = [];
    for (const driverId of targetDrivers) {
      const driver = await prisma.driver.findUnique({ where: { id: driverId } });
      if (driver) driverUserIds.push(driver.userId);
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        id: uuid(),
        userId,
        targetType: InquiryTargetType.DRIVER,
        targetIds: JSON.stringify(targetDrivers),
        subject: 'Driver booking request',
        message: randomItem(INQUIRY_MESSAGES.driver),
        requiresPayment: false,
        expiresAt: futureDate(30),
      },
    });
    inquiryCount++;

    for (const recipientId of driverUserIds) {
      const status = randomItem(statuses);
      await prisma.inquiryResponse.create({
        data: {
          id: uuid(),
          inquiryId: inquiry.id,
          recipientId,
          status,
          message: status !== InquiryStatus.PENDING
            ? randomItem(RESPONSE_MESSAGES.positive)
            : null,
          respondedAt: status !== InquiryStatus.PENDING ? new Date() : null,
        },
      });
      responseCount++;
    }
  }

  console.log(`  ✓ Created ${inquiryCount} inquiries with ${responseCount} responses`);
}

// ============================================================================
// PHASE 10: MEDIA
// ============================================================================

async function seedMedia(): Promise<void> {
  console.log('\n🖼️  Phase 10: Seeding Media...');

  let mediaCount = 0;
  let imageIndex = 1100;

  // Tour images (3-5 per tour)
  for (const tourId of createdIds.tours) {
    const tour = await prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour) continue;

    const numImages = randomInt(3, 5);
    for (let i = 0; i < numImages; i++) {
      await prisma.media.create({
        data: {
          id: uuid(),
          filename: `tour-${tourId.slice(0, 8)}-${i}.jpg`,
          originalName: `tour-image-${i + 1}.jpg`,
          mimeType: 'image/jpeg',
          size: randomInt(100000, 500000),
          url: `/seed-assets/image-${imageIndex}.jpg`,
          entityType: 'tour',
          entityId: tourId,
          uploadedBy: tour.ownerId,
        },
      });
      mediaCount++;
      imageIndex = (imageIndex % 600) + 1000;
    }
  }

  // Company logos (1 per company)
  for (let i = 0; i < createdIds.companies.length; i++) {
    const companyId = createdIds.companies[i];
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) continue;

    await prisma.media.create({
      data: {
        id: uuid(),
        filename: `company-logo-${companyId.slice(0, 8)}.jpg`,
        originalName: 'company-logo.jpg',
        mimeType: 'image/jpeg',
        size: randomInt(50000, 150000),
        url: `/seed-assets/image-${1000 + i}.jpg`,
        entityType: 'company',
        entityId: companyId,
        uploadedBy: company.userId,
      },
    });
    mediaCount++;
  }

  // Guide photos (1 per guide)
  for (let i = 0; i < createdIds.guides.length; i++) {
    const guideId = createdIds.guides[i];
    const guide = await prisma.guide.findUnique({ where: { id: guideId } });
    if (!guide) continue;

    await prisma.media.create({
      data: {
        id: uuid(),
        filename: `guide-photo-${guideId.slice(0, 8)}.jpg`,
        originalName: 'profile-photo.jpg',
        mimeType: 'image/jpeg',
        size: randomInt(50000, 200000),
        url: `/seed-assets/image-${1020 + i}.jpg`,
        entityType: 'guide',
        entityId: guideId,
        uploadedBy: guide.userId,
      },
    });
    mediaCount++;
  }

  // Driver photos (1 per driver)
  for (let i = 0; i < createdIds.drivers.length; i++) {
    const driverId = createdIds.drivers[i];
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) continue;

    await prisma.media.create({
      data: {
        id: uuid(),
        filename: `driver-photo-${driverId.slice(0, 8)}.jpg`,
        originalName: 'profile-photo.jpg',
        mimeType: 'image/jpeg',
        size: randomInt(50000, 200000),
        url: `/seed-assets/image-${1050 + i}.jpg`,
        entityType: 'driver',
        entityId: driverId,
        uploadedBy: driver.userId,
      },
    });
    mediaCount++;
  }

  console.log(`  ✓ Created ${mediaCount} media records`);
}

// ============================================================================
// PHASE 11: NOTIFICATIONS
// ============================================================================

async function seedNotifications(): Promise<void> {
  console.log('\n🔔 Phase 11: Seeding Notifications...');

  let notificationCount = 0;

  // Welcome notifications for all users
  for (const [email, userId] of createdIds.users) {
    await prisma.notification.create({
      data: {
        id: uuid(),
        userId,
        type: NotificationType.SYSTEM,
        title: 'Welcome to Atlas Caucasus!',
        message: 'Start exploring tours, guides, and drivers in Georgia. Complete your profile to get personalized recommendations.',
        isRead: randomBool(0.7),
        createdAt: pastDate(90),
      },
    });
    notificationCount++;
  }

  // Chat message notifications for recent chats
  const recentMessages = await prisma.chatMessage.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: { chat: { include: { participants: true } } },
  });

  for (const message of recentMessages) {
    for (const participant of message.chat.participants) {
      if (participant.userId !== message.senderId) {
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
  }

  // Inquiry notifications
  const inquiries = await prisma.inquiry.findMany({ take: 10 });
  for (const inquiry of inquiries) {
    const responses = await prisma.inquiryResponse.findMany({
      where: { inquiryId: inquiry.id },
    });

    for (const response of responses) {
      // Notification to recipient about new inquiry
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

      // Notification to sender about response
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

  console.log(`  ✓ Created ${notificationCount} notifications`);
}

// ============================================================================
// PHASE 12: AUDIT LOGS
// ============================================================================

async function seedAuditLogs(): Promise<void> {
  console.log('\n📋 Phase 12: Seeding Audit Logs...');

  let logCount = 0;

  // Sample login events
  const sampleUsers = Array.from(createdIds.users.entries()).slice(0, 15);
  for (const [email, userId] of sampleUsers) {
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        action: AuditAction.LOGIN_SUCCESS,
        userId,
        targetType: 'user',
        targetId: userId,
        ipAddress: `192.168.1.${randomInt(1, 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: JSON.stringify({ email }),
        status: 'SUCCESS',
        createdAt: pastDate(30),
      },
    });
    logCount++;
  }

  // Sample profile updates
  for (let i = 0; i < 10; i++) {
    const [email, userId] = randomItem(Array.from(createdIds.users.entries()));
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

  // Sample tour creations
  for (let i = 0; i < createdIds.tours.length && i < 15; i++) {
    const tourId = createdIds.tours[i];
    const tour = await prisma.tour.findUnique({ where: { id: tourId } });
    if (tour) {
      await prisma.auditLog.create({
        data: {
          id: uuid(),
          action: AuditAction.TOUR_CREATE,
          userId: tour.ownerId,
          targetType: 'tour',
          targetId: tourId,
          metadata: JSON.stringify({ title: tour.title }),
          status: 'SUCCESS',
          createdAt: tour.createdAt,
        },
      });
      logCount++;
    }
  }

  // Sample verification events
  const adminEmail = ADMIN_USERS[0].email;
  const adminId = createdIds.users.get(adminEmail)!;

  for (let i = 0; i < 5; i++) {
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        action: AuditAction.GUIDE_VERIFY,
        userId: adminId,
        targetType: 'guide',
        targetId: createdIds.guides[i] || createdIds.guides[0],
        status: 'SUCCESS',
        createdAt: pastDate(45),
      },
    });
    logCount++;
  }

  console.log(`  ✓ Created ${logCount} audit log entries`);
}

// ============================================================================
// PHASE 13: BOOKINGS
// ============================================================================

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
  null,
  null,
  null,
  null,
  null,
];

async function seedBookings(): Promise<void> {
  console.log('\n📅 Phase 13: Seeding Bookings...');

  let bookingCount = 0;
  const travelerEmails = TRAVELER_USERS.map((u: UserData) => u.email);
  const currencies = ['GEL', 'USD', 'EUR'];
  const statusWeights: BookingStatus[] = [
    BookingStatus.CONFIRMED,
    BookingStatus.CONFIRMED,
    BookingStatus.CONFIRMED,
    BookingStatus.COMPLETED,
    BookingStatus.COMPLETED,
    BookingStatus.CANCELLED,
  ];

  // Tour bookings (10-12)
  const tourCount = Math.min(12, createdIds.tours.length);
  const selectedTourIds = randomItems(createdIds.tours, tourCount);

  for (const tourId of selectedTourIds) {
    const travelerEmail = randomItem(travelerEmails);
    const travelerId = createdIds.users.get(travelerEmail);
    if (!travelerId) continue;

    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      select: { ownerId: true, price: true, currency: true },
    });
    if (!tour || tour.ownerId === travelerId) continue;

    const status = randomItem(statusWeights);
    const guests = randomInt(1, 8);
    const price = tour.price ? Number(tour.price) * guests : randomInt(100, 800);

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
        createdAt: pastDate(status === BookingStatus.COMPLETED ? 90 : 30),
        cancelledAt: status === BookingStatus.CANCELLED ? pastDate(15) : null,
      },
    });
    bookingCount++;
  }

  // Guide bookings (5-8)
  const guideCount = Math.min(8, createdIds.guides.length);
  const selectedGuideIds = randomItems(createdIds.guides, guideCount);

  for (const guideId of selectedGuideIds) {
    const travelerEmail = randomItem(travelerEmails);
    const travelerId = createdIds.users.get(travelerEmail);
    if (!travelerId) continue;

    const guide = await prisma.guide.findUnique({
      where: { id: guideId },
      select: { userId: true, pricePerDay: true, currency: true },
    });
    if (!guide || guide.userId === travelerId) continue;

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
      },
    });
    bookingCount++;
  }

  // Driver bookings (4-6)
  const driverCount = Math.min(6, createdIds.drivers.length);
  const selectedDriverIds = randomItems(createdIds.drivers, driverCount);

  for (const driverId of selectedDriverIds) {
    const travelerEmail = randomItem(travelerEmails);
    const travelerId = createdIds.users.get(travelerEmail);
    if (!travelerId) continue;

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: { userId: true },
    });
    if (!driver || driver.userId === travelerId) continue;

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
        currency: randomItem(currencies),
        notes: randomItem(BOOKING_NOTES_TEMPLATES),
        createdAt: pastDate(status === BookingStatus.COMPLETED ? 60 : 14),
        cancelledAt: status === BookingStatus.CANCELLED ? pastDate(7) : null,
      },
    });
    bookingCount++;
  }

  console.log(`  ✓ Created ${bookingCount} bookings (tours, guides, drivers)`);
}

// ============================================================================
// PHASE 14: BLOG POSTS
// ============================================================================

async function seedBlogPosts(): Promise<void> {
  console.log('\n📝 Phase 14: Seeding Blog Posts...');

  // Find an admin user to be the author
  const adminEmail = ADMIN_USERS[0].email;
  const authorId = createdIds.users.get(adminEmail);

  if (!authorId) {
    console.log('  ⚠️  No admin user found, skipping blog posts');
    return;
  }

  for (let i = 0; i < BLOG_POSTS.length; i++) {
    const blogData = BLOG_POSTS[i];

    // Generate slug from title with random suffix
    const baseSlug = slugify(blogData.title).substring(0, 250);
    const suffix = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${suffix}`;

    // Calculate reading time (strip HTML, count words, 200 wpm)
    const textContent = blogData.content.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ');
    const wordCount = textContent.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    const publishedAt = pastDate(randomInt(7, 120));

    const post = await prisma.blogPost.create({
      data: {
        id: uuid(),
        authorId,
        title: blogData.title,
        slug,
        excerpt: blogData.excerpt,
        content: blogData.content,
        tags: JSON.stringify(blogData.tags),
        isPublished: blogData.isPublished,
        viewCount: blogData.viewCount,
        readingTime,
        publishedAt: blogData.isPublished ? publishedAt : null,
        createdAt: publishedAt,
      },
    });

    createdIds.blogPosts.push(post.id);

    // Create cover image media record
    await prisma.media.create({
      data: {
        id: uuid(),
        filename: `blog-cover-${post.id.slice(0, 8)}.jpg`,
        originalName: `blog-cover-${i + 1}.jpg`,
        mimeType: 'image/jpeg',
        size: randomInt(150000, 400000),
        url: `/seed-assets/image-${blogData.imageIndex}.jpg`,
        entityType: 'blog',
        entityId: post.id,
        uploadedBy: authorId,
      },
    });
  }

  console.log(`  ✓ Created ${createdIds.blogPosts.length} blog posts with cover images`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           REALISTIC DATABASE SEEDER                      ║');
  console.log('║                                                          ║');
  console.log('║   Creates a complete, production-like database           ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  const startTime = Date.now();

  try {
    await seedLocations();
    await seedUsers();
    await seedCompanies();
    await seedGuides();
    await seedDrivers();
    await seedTours();
    await seedReviews();
    await seedChats();
    await seedInquiries();
    await seedMedia();
    await seedNotifications();
    await seedAuditLogs();
    await seedBookings();
    await seedBlogPosts();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('✅ Database seeded successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   • Locations: ${createdIds.locations.length}`);
    console.log(`   • Users: ${createdIds.users.size}`);
    console.log(`   • Companies: ${createdIds.companies.length}`);
    console.log(`   • Guides: ${createdIds.guides.length}`);
    console.log(`   • Drivers: ${createdIds.drivers.length}`);
    console.log(`   • Tours: ${createdIds.tours.length}`);
    console.log(`   • Blog Posts: ${createdIds.blogPosts.length}`);
    console.log(`   • Chats: ${createdIds.chats.length}`);
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
