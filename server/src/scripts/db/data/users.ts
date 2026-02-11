/**
 * User data for seeding
 * Realistic Georgian names with various roles
 */

import { UserRole } from '@prisma/client';

import { weightedRandomLanguage, getRandomFullName, type SeedLanguage } from './multilingual.js';
import { randomItem, randomPhoneNumber } from '../utils/helpers.js';

export interface UserSeedData {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roles: UserRole[];
  emailVerified: boolean;
  isActive: boolean;
  // For tour agents - which company they belong to (by index)
  parentCompanyIndex?: number;
}

// Georgian first names
const MALE_FIRST_NAMES = [
  'Giorgi', 'Nikoloz', 'Davit', 'Aleksandre', 'Luka', 'Irakli', 'Tornike',
  'Levan', 'Giga', 'Zurab', 'Vakhtang', 'Beka', 'Shota', 'Temuri', 'Nika',
  'Archil', 'Revaz', 'Mikheil', 'Sandro', 'Gio', 'Dato', 'Lasha', 'Mamuka',
  'Akaki', 'Konstantine', 'Zaza', 'Sergi', 'Guram', 'Nodar', 'Dimitri'
];

const FEMALE_FIRST_NAMES = [
  'Nino', 'Mari', 'Ana', 'Mariam', 'Tamari', 'Elene', 'Salome', 'Ketevan',
  'Nana', 'Eka', 'Tamar', 'Lika', 'Natia', 'Tako', 'Lela', 'Maka',
  'Sopho', 'Natalia', 'Manana', 'Maia', 'Neli', 'Irma', 'Medea', 'Rusudan'
];

// Georgian last names
const LAST_NAMES = [
  'Beridze', 'Kapanadze', 'Lomidze', 'Chkhaidze', 'Gvenetadze', 'Tsitskishvili',
  'Gelashvili', 'Kvaratskhelia', 'Bakradze', 'Gorgadze', 'Janelidze', 'Maisuradze',
  'Gogichaishvili', 'Kiknadze', 'Kobakhidze', 'Lortkipanidze', 'Merabishvili',
  'Nozadze', 'Okhanashvili', 'Papava', 'Qavtaradze', 'Rurua', 'Salukvadze',
  'Topuria', 'Ugulava', 'Vardiashvili', 'Zhvania', 'Avalishvili', 'Basilashvili',
  'Chikhladze', 'Dolidze', 'Elbakidze', 'Gabashvili', 'Javakhishvili'
];

// Admin users
export const ADMIN_USERS: UserSeedData[] = [
  {
    email: 'admin@atlascaucasus.com',
    firstName: 'Super',
    lastName: 'Admin',
    phoneNumber: '+995 555 00 00 01',
    roles: [UserRole.ADMIN],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'support@atlascaucasus.com',
    firstName: 'Support',
    lastName: 'Team',
    phoneNumber: '+995 555 00 00 02',
    roles: [UserRole.ADMIN],
    emailVerified: true,
    isActive: true,
  },
];

// Company owner users (these will have Company profiles)
export const COMPANY_OWNER_USERS: UserSeedData[] = [
  {
    email: 'info@georgiatours.ge',
    firstName: 'Giorgi',
    lastName: 'Beridze',
    phoneNumber: '+995 555 10 20 30',
    roles: [UserRole.COMPANY],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'contact@explorecaucasus.com',
    firstName: 'Nino',
    lastName: 'Kapanadze',
    phoneNumber: '+995 577 20 30 40',
    roles: [UserRole.COMPANY],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'booking@mountainadventures.ge',
    firstName: 'Davit',
    lastName: 'Lomidze',
    phoneNumber: '+995 568 30 40 50',
    roles: [UserRole.COMPANY],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'hello@winetours.ge',
    firstName: 'Mariam',
    lastName: 'Chkhaidze',
    phoneNumber: '+995 591 40 50 60',
    roles: [UserRole.COMPANY],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'tours@batumiadventure.com',
    firstName: 'Levan',
    lastName: 'Gvenetadze',
    phoneNumber: '+995 593 50 60 70',
    roles: [UserRole.COMPANY],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'info@caucasusexpeditions.ge',
    firstName: 'Elene',
    lastName: 'Tsitskishvili',
    phoneNumber: '+995 597 60 70 80',
    roles: [UserRole.COMPANY],
    emailVerified: false, // Not verified yet
    isActive: true,
  },
];

// Tour agent users (sub-accounts of companies)
export const TOUR_AGENT_USERS: UserSeedData[] = [
  // Company 0 agents (Georgia Tours)
  {
    email: 'agent1@georgiatours.ge',
    firstName: 'Tornike',
    lastName: 'Gelashvili',
    phoneNumber: '+995 555 11 11 11',
    roles: [UserRole.TOUR_AGENT],
    emailVerified: true,
    isActive: true,
    parentCompanyIndex: 0,
  },
  {
    email: 'agent2@georgiatours.ge',
    firstName: 'Salome',
    lastName: 'Bakradze',
    phoneNumber: '+995 555 11 11 12',
    roles: [UserRole.TOUR_AGENT],
    emailVerified: true,
    isActive: true,
    parentCompanyIndex: 0,
  },
  // Company 1 agents (Explore Caucasus)
  {
    email: 'booking@explorecaucasus.com',
    firstName: 'Irakli',
    lastName: 'Gorgadze',
    phoneNumber: '+995 577 22 22 21',
    roles: [UserRole.TOUR_AGENT],
    emailVerified: true,
    isActive: true,
    parentCompanyIndex: 1,
  },
  // Company 2 agents (Mountain Adventures)
  {
    email: 'sales@mountainadventures.ge',
    firstName: 'Ketevan',
    lastName: 'Janelidze',
    phoneNumber: '+995 568 33 33 31',
    roles: [UserRole.TOUR_AGENT],
    emailVerified: true,
    isActive: true,
    parentCompanyIndex: 2,
  },
  {
    email: 'support@mountainadventures.ge',
    firstName: 'Beka',
    lastName: 'Maisuradze',
    phoneNumber: '+995 568 33 33 32',
    roles: [UserRole.TOUR_AGENT],
    emailVerified: true,
    isActive: true,
    parentCompanyIndex: 2,
  },
  // Company 3 agents (Wine Tours)
  {
    email: 'reservations@winetours.ge',
    firstName: 'Ana',
    lastName: 'Gogichaishvili',
    phoneNumber: '+995 591 44 44 41',
    roles: [UserRole.TOUR_AGENT],
    emailVerified: true,
    isActive: true,
    parentCompanyIndex: 3,
  },
  // Company 4 agents (Batumi Adventure)
  {
    email: 'team@batumiadventure.com',
    firstName: 'Nika',
    lastName: 'Kiknadze',
    phoneNumber: '+995 593 55 55 51',
    roles: [UserRole.TOUR_AGENT],
    emailVerified: true,
    isActive: true,
    parentCompanyIndex: 4,
  },
  // Company 5 agents (Caucasus Expeditions)
  {
    email: 'booking@caucasusexpeditions.ge',
    firstName: 'Tamari',
    lastName: 'Kobakhidze',
    phoneNumber: '+995 597 66 66 61',
    roles: [UserRole.TOUR_AGENT],
    emailVerified: true,
    isActive: true,
    parentCompanyIndex: 5,
  },
];

// Guide users (independent professionals)
export const GUIDE_USERS: UserSeedData[] = [
  {
    email: 'giorgi.guide@example.com',
    firstName: 'Giorgi',
    lastName: 'Lortkipanidze',
    phoneNumber: '+995 599 70 70 01',
    roles: [UserRole.GUIDE],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'nino.guide@example.com',
    firstName: 'Nino',
    lastName: 'Merabishvili',
    phoneNumber: '+995 599 70 70 02',
    roles: [UserRole.GUIDE],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'dato.guide@example.com',
    firstName: 'Dato',
    lastName: 'Nozadze',
    phoneNumber: '+995 599 70 70 03',
    roles: [UserRole.GUIDE],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'mari.guide@example.com',
    firstName: 'Mari',
    lastName: 'Okhanashvili',
    phoneNumber: '+995 599 70 70 04',
    roles: [UserRole.GUIDE],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'luka.guide@example.com',
    firstName: 'Luka',
    lastName: 'Papava',
    phoneNumber: '+995 599 70 70 05',
    roles: [UserRole.GUIDE],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'tamar.guide@example.com',
    firstName: 'Tamar',
    lastName: 'Qavtaradze',
    phoneNumber: '+995 599 70 70 06',
    roles: [UserRole.GUIDE],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'sandro.guide@example.com',
    firstName: 'Sandro',
    lastName: 'Rurua',
    phoneNumber: '+995 599 70 70 07',
    roles: [UserRole.GUIDE],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'eka.guide@example.com',
    firstName: 'Eka',
    lastName: 'Salukvadze',
    phoneNumber: '+995 599 70 70 08',
    roles: [UserRole.GUIDE],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'archil.guide@example.com',
    firstName: 'Archil',
    lastName: 'Topuria',
    phoneNumber: '+995 599 70 70 09',
    roles: [UserRole.GUIDE],
    emailVerified: false, // Not verified
    isActive: true,
  },
  {
    email: 'maia.guide@example.com',
    firstName: 'Maia',
    lastName: 'Ugulava',
    phoneNumber: '+995 599 70 70 10',
    roles: [UserRole.GUIDE],
    emailVerified: true,
    isActive: false, // Inactive
  },
];

// Driver users (independent professionals)
export const DRIVER_USERS: UserSeedData[] = [
  {
    email: 'vakhtang.driver@example.com',
    firstName: 'Vakhtang',
    lastName: 'Vardiashvili',
    phoneNumber: '+995 598 80 80 01',
    roles: [UserRole.DRIVER],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'giga.driver@example.com',
    firstName: 'Giga',
    lastName: 'Zhvania',
    phoneNumber: '+995 598 80 80 02',
    roles: [UserRole.DRIVER],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'zurab.driver@example.com',
    firstName: 'Zurab',
    lastName: 'Avalishvili',
    phoneNumber: '+995 598 80 80 03',
    roles: [UserRole.DRIVER],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'shota.driver@example.com',
    firstName: 'Shota',
    lastName: 'Basilashvili',
    phoneNumber: '+995 598 80 80 04',
    roles: [UserRole.DRIVER],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'temuri.driver@example.com',
    firstName: 'Temuri',
    lastName: 'Chikhladze',
    phoneNumber: '+995 598 80 80 05',
    roles: [UserRole.DRIVER],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'revaz.driver@example.com',
    firstName: 'Revaz',
    lastName: 'Dolidze',
    phoneNumber: '+995 598 80 80 06',
    roles: [UserRole.DRIVER],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'mamuka.driver@example.com',
    firstName: 'Mamuka',
    lastName: 'Elbakidze',
    phoneNumber: '+995 598 80 80 07',
    roles: [UserRole.DRIVER],
    emailVerified: false, // Not verified
    isActive: true,
  },
  {
    email: 'konstantine.driver@example.com',
    firstName: 'Konstantine',
    lastName: 'Gabashvili',
    phoneNumber: '+995 598 80 80 08',
    roles: [UserRole.DRIVER],
    emailVerified: true,
    isActive: false, // Inactive
  },
];

// Regular users (travelers)
export const TRAVELER_USERS: UserSeedData[] = [
  {
    email: 'john.smith@gmail.com',
    firstName: 'John',
    lastName: 'Smith',
    roles: [UserRole.USER],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'emma.wilson@gmail.com',
    firstName: 'Emma',
    lastName: 'Wilson',
    roles: [UserRole.USER],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'michael.brown@outlook.com',
    firstName: 'Michael',
    lastName: 'Brown',
    roles: [UserRole.USER],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'sophia.garcia@yahoo.com',
    firstName: 'Sophia',
    lastName: 'Garcia',
    roles: [UserRole.USER],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'david.miller@gmail.com',
    firstName: 'David',
    lastName: 'Miller',
    roles: [UserRole.USER],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'olivia.jones@hotmail.com',
    firstName: 'Olivia',
    lastName: 'Jones',
    roles: [UserRole.USER],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'james.taylor@gmail.com',
    firstName: 'James',
    lastName: 'Taylor',
    roles: [UserRole.USER],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'ava.anderson@gmail.com',
    firstName: 'Ava',
    lastName: 'Anderson',
    roles: [UserRole.USER],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'william.thomas@outlook.com',
    firstName: 'William',
    lastName: 'Thomas',
    roles: [UserRole.USER],
    emailVerified: false, // Not verified
    isActive: true,
  },
  {
    email: 'isabella.martin@gmail.com',
    firstName: 'Isabella',
    lastName: 'Martin',
    roles: [UserRole.USER],
    emailVerified: true,
    isActive: false, // Inactive
  },
];

// Multi-role users
export const MULTI_ROLE_USERS: UserSeedData[] = [
  // Guide + Driver
  {
    email: 'lasha.multiservice@example.com',
    firstName: 'Lasha',
    lastName: 'Javakhishvili',
    phoneNumber: '+995 595 90 90 01',
    roles: [UserRole.GUIDE, UserRole.DRIVER],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'guram.multiservice@example.com',
    firstName: 'Guram',
    lastName: 'Beridze',
    phoneNumber: '+995 595 90 90 02',
    roles: [UserRole.GUIDE, UserRole.DRIVER],
    emailVerified: true,
    isActive: true,
  },
  // Company + Guide (owner who also guides tours)
  {
    email: 'nodar.owner-guide@example.com',
    firstName: 'Nodar',
    lastName: 'Kapanadze',
    phoneNumber: '+995 595 90 90 03',
    roles: [UserRole.COMPANY, UserRole.GUIDE],
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'medea.owner-guide@example.com',
    firstName: 'Medea',
    lastName: 'Lomidze',
    phoneNumber: '+995 595 90 90 04',
    roles: [UserRole.COMPANY, UserRole.GUIDE],
    emailVerified: true,
    isActive: true,
  },
];

/**
 * Generate additional users for 4x data volume
 * Creates ~144 additional users with EN/RU/KA names
 */
export function generateAdditionalUsers(): UserSeedData[] {
  const additional: UserSeedData[] = [];
  let counter = 0;

  // 18 more COMPANY owners
  for (let i = 0; i < 18; i++) {
    const lang = weightedRandomLanguage();
    const isMale = Math.random() > 0.5;
    const { firstName, lastName } = getRandomFullName(lang, isMale);
    additional.push({
      email: `company${i + 7}@example.com`,
      firstName,
      lastName,
      phoneNumber: randomPhoneNumber(),
      roles: [UserRole.COMPANY],
      emailVerified: Math.random() > 0.15,
      isActive: Math.random() > 0.1,
    });
    counter++;
  }

  // 24 more TOUR_AGENT users (3 per new company roughly)
  for (let i = 0; i < 24; i++) {
    const lang = weightedRandomLanguage();
    const isMale = Math.random() > 0.5;
    const { firstName, lastName } = getRandomFullName(lang, isMale);
    additional.push({
      email: `agent.gen${i + 1}@example.com`,
      firstName,
      lastName,
      phoneNumber: randomPhoneNumber(),
      roles: [UserRole.TOUR_AGENT],
      emailVerified: true,
      isActive: true,
      parentCompanyIndex: 6 + Math.floor(i / 3), // Spread across new companies (indices 6+)
    });
    counter++;
  }

  // 32 more GUIDE users
  for (let i = 0; i < 32; i++) {
    const lang = weightedRandomLanguage();
    const isMale = Math.random() > 0.5;
    const { firstName, lastName } = getRandomFullName(lang, isMale);
    additional.push({
      email: `guide.gen${i + 1}@example.com`,
      firstName,
      lastName,
      phoneNumber: randomPhoneNumber(),
      roles: [UserRole.GUIDE],
      emailVerified: Math.random() > 0.1,
      isActive: Math.random() > 0.08,
    });
    counter++;
  }

  // 22 more DRIVER users
  for (let i = 0; i < 22; i++) {
    const lang = weightedRandomLanguage();
    const isMale = Math.random() > 0.5;
    const { firstName, lastName } = getRandomFullName(lang, isMale);
    additional.push({
      email: `driver.gen${i + 1}@example.com`,
      firstName,
      lastName,
      phoneNumber: randomPhoneNumber(),
      roles: [UserRole.DRIVER],
      emailVerified: Math.random() > 0.1,
      isActive: Math.random() > 0.08,
    });
    counter++;
  }

  // 30 more TRAVELER users
  for (let i = 0; i < 30; i++) {
    const lang = weightedRandomLanguage();
    const isMale = Math.random() > 0.5;
    const { firstName, lastName } = getRandomFullName(lang, isMale);
    additional.push({
      email: `traveler.gen${i + 1}@example.com`,
      firstName,
      lastName,
      roles: [UserRole.USER],
      emailVerified: Math.random() > 0.15,
      isActive: Math.random() > 0.05,
    });
    counter++;
  }

  // 8 more MULTI_ROLE users
  const multiRoleCombos: [UserRole, UserRole][] = [
    [UserRole.GUIDE, UserRole.DRIVER],
    [UserRole.GUIDE, UserRole.DRIVER],
    [UserRole.GUIDE, UserRole.DRIVER],
    [UserRole.GUIDE, UserRole.DRIVER],
    [UserRole.COMPANY, UserRole.GUIDE],
    [UserRole.COMPANY, UserRole.GUIDE],
    [UserRole.COMPANY, UserRole.GUIDE],
    [UserRole.COMPANY, UserRole.GUIDE],
  ];
  for (let i = 0; i < multiRoleCombos.length; i++) {
    const lang = weightedRandomLanguage();
    const isMale = Math.random() > 0.5;
    const { firstName, lastName } = getRandomFullName(lang, isMale);
    additional.push({
      email: `multi.gen${i + 1}@example.com`,
      firstName,
      lastName,
      phoneNumber: randomPhoneNumber(),
      roles: multiRoleCombos[i],
      emailVerified: true,
      isActive: true,
    });
    counter++;
  }

  return additional;
}

// Combine all users
export const ALL_USERS: UserSeedData[] = [
  ...ADMIN_USERS,
  ...COMPANY_OWNER_USERS,
  ...TOUR_AGENT_USERS,
  ...GUIDE_USERS,
  ...DRIVER_USERS,
  ...TRAVELER_USERS,
  ...MULTI_ROLE_USERS,
];

// Export name arrays for random generation
export const GEORGIAN_MALE_NAMES = MALE_FIRST_NAMES;
export const GEORGIAN_FEMALE_NAMES = FEMALE_FIRST_NAMES;
export const GEORGIAN_LAST_NAMES = LAST_NAMES;
