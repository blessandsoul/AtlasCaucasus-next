import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Setting up test accounts...\n');

  // Define test accounts
  const testAccounts = [
    { email: 'user@test.com', role: UserRole.USER, firstName: 'Test', lastName: 'User' },
    { email: 'admin@test.com', role: UserRole.ADMIN, firstName: 'Admin', lastName: 'User' },
    { email: 'company@test.com', role: UserRole.COMPANY, firstName: 'Company', lastName: 'Owner' },
    { email: 'guide@test.com', role: UserRole.GUIDE, firstName: 'Guide', lastName: 'User' },
    { email: 'driver@test.com', role: UserRole.DRIVER, firstName: 'Driver', lastName: 'User' },
    { email: 'unverified@test.com', role: UserRole.USER, firstName: 'Unverified', lastName: 'User', verified: false },
  ];

  const password = 'Test@123!';
  const passwordHash = await argon2.hash(password);

  for (const account of testAccounts) {
    const existingUser = await prisma.user.findUnique({
      where: { email: account.email },
      include: { roles: true }
    });

    if (existingUser) {
      // Update existing user - verify email and ensure role
      console.log(`Updating existing account: ${account.email}`);

      // Verify email (except for unverified test account)
      await prisma.user.update({
        where: { email: account.email },
        data: {
          emailVerified: account.verified !== false,
          verificationToken: null,
          verificationTokenExpiresAt: null,
        }
      });

      // Check if role exists
      const hasRole = existingUser.roles.some(r => r.role === account.role);
      if (!hasRole) {
        await prisma.userRoleAssignment.create({
          data: {
            userId: existingUser.id,
            role: account.role,
          }
        });
        console.log(`  Added role: ${account.role}`);
      }

      console.log(`  Email verified: ${account.verified !== false}`);
    } else {
      // Create new user
      console.log(`Creating new account: ${account.email}`);

      const user = await prisma.user.create({
        data: {
          email: account.email,
          passwordHash,
          firstName: account.firstName,
          lastName: account.lastName,
          emailVerified: account.verified !== false,
          roles: {
            create: {
              role: account.role
            }
          }
        }
      });

      // Create associated profiles for GUIDE/DRIVER
      if (account.role === UserRole.GUIDE) {
        await prisma.guide.create({
          data: {
            userId: user.id,
            bio: 'Test guide bio',
            yearsOfExperience: 5,
          }
        });
        console.log('  Created guide profile');
      }

      if (account.role === UserRole.DRIVER) {
        await prisma.driver.create({
          data: {
            userId: user.id,
            bio: 'Test driver bio',
            vehicleType: 'SUV',
            vehicleCapacity: 7,
          }
        });
        console.log('  Created driver profile');
      }

      if (account.role === UserRole.COMPANY) {
        await prisma.company.create({
          data: {
            userId: user.id,
            companyName: 'Test Tours Company',
            description: 'Test company for testing purposes',
            registrationNumber: '123456789',
            phoneNumber: '+995555123456',
            websiteUrl: 'https://testtours.com',
            isVerified: true,
          }
        });
        console.log('  Created company profile');
      }
    }
  }

  // Create additional test companies for pagination testing
  console.log('\nCreating additional test companies for pagination...');

  const companyNames = [
    'Adventure Georgia Tours',
    'Caucasus Explorers',
    'Tbilisi Travel Agency',
    'Batumi Beach Tours',
    'Mountain Trekking Co',
    'Wine Country Tours',
    'Georgia Heritage Tours',
    'Svaneti Adventures',
    'Kazbegi Expeditions',
    'Kutaisi Discovery',
    'Mtskheta Tours',
    'Black Sea Vacations',
    'Telavi Wine Tours',
    'Kakheti Experiences',
  ];

  for (let i = 0; i < companyNames.length; i++) {
    const email = `company${i + 2}@test.com`;
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (!existingUser) {
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName: companyNames[i].split(' ')[0],
          lastName: 'Owner',
          emailVerified: true,
          roles: {
            create: {
              role: UserRole.COMPANY
            }
          }
        }
      });

      await prisma.company.create({
        data: {
          userId: user.id,
          companyName: companyNames[i],
          description: `${companyNames[i]} - A premier tourism company offering unique experiences in Georgia.`,
          registrationNumber: `REG${100000 + i}`,
          phoneNumber: `+9955551234${(i + 10).toString().padStart(2, '0')}`,
          websiteUrl: `https://${companyNames[i].toLowerCase().replace(/\s+/g, '')}.ge`,
          isVerified: true,
        }
      });

      console.log(`  Created: ${companyNames[i]}`);
    } else {
      console.log(`  Skipping: ${companyNames[i]} (already exists)`);
    }
  }

  console.log('\n✅ Test accounts setup complete!');
  console.log('\nTest accounts:');
  console.log('  - user@test.com (USER, verified)');
  console.log('  - admin@test.com (ADMIN, verified)');
  console.log('  - company@test.com (COMPANY, verified)');
  console.log('  - guide@test.com (GUIDE, verified)');
  console.log('  - driver@test.com (DRIVER, verified)');
  console.log('  - unverified@test.com (USER, NOT verified)');
  console.log('\nPassword for all: Test@123!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
