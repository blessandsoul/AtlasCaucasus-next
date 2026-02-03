/**
 * Clear Data Script
 *
 * Clears all data from database tables while preserving:
 * - Table structure (columns, types)
 * - Foreign key constraints
 * - Indexes
 *
 * Usage:
 *   npx tsx scripts/db/clear-data.ts              # Preserve locations
 *   npx tsx scripts/db/clear-data.ts --include-locations  # Clear everything
 *   npx tsx scripts/db/clear-data.ts --dry-run    # Show what would be deleted
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tables in reverse dependency order (delete children before parents)
const TABLES_TO_CLEAR = [
  // No dependencies - can delete anytime
  'audit_logs',
  'notifications',

  // Chat system (messages → participants → chats)
  'message_read_receipts',
  'chat_messages',
  'chat_participants',
  'chats',

  // Inquiry system
  'inquiry_responses',
  'inquiries',

  // Reviews
  'reviews',

  // Media
  'media',

  // Tour locations junction
  'tour_locations',

  // Tours (depends on users, companies)
  'tours',

  // Profile location junctions
  'guide_locations',
  'driver_locations',

  // Profiles (depend on users)
  'guides',
  'drivers',
  'companies',

  // User system
  'user_sessions',
  'user_roles',
  'users',
];

// Location table is optional (reference data)
const LOCATION_TABLE = 'locations';

interface ClearOptions {
  includeLocations: boolean;
  dryRun: boolean;
}

async function clearTable(tableName: string, dryRun: boolean): Promise<number> {
  if (dryRun) {
    const result = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    return Number(result[0].count);
  }

  const result = await prisma.$executeRawUnsafe(`DELETE FROM ${tableName}`);
  return result;
}

async function clearData(options: ClearOptions): Promise<void> {
  const { includeLocations, dryRun } = options;

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║               DATABASE CLEAR DATA SCRIPT                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No data will be deleted\n');
  }

  const tablesToClear = [...TABLES_TO_CLEAR];
  if (includeLocations) {
    tablesToClear.push(LOCATION_TABLE);
  }

  console.log(`Tables to clear: ${tablesToClear.length}`);
  console.log(`Include locations: ${includeLocations ? 'Yes' : 'No (preserved)'}`);
  console.log('');

  try {
    // Disable foreign key checks for MySQL
    if (!dryRun) {
      await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
      console.log('✓ Foreign key checks disabled\n');
    }

    let totalRows = 0;
    const tableResults: { table: string; rows: number }[] = [];

    for (const table of tablesToClear) {
      const rows = await clearTable(table, dryRun);
      tableResults.push({ table, rows });
      totalRows += rows;

      const action = dryRun ? 'would delete' : 'deleted';
      const status = rows > 0 ? '🗑️ ' : '✓  ';
      console.log(`${status}${table}: ${rows} rows ${action}`);
    }

    // Re-enable foreign key checks
    if (!dryRun) {
      await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
      console.log('\n✓ Foreign key checks re-enabled');
    }

    // Reset auto-increment for tables with auto-increment columns (if any)
    // Note: Our tables use UUID, so this is not typically needed

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total: ${totalRows} rows ${dryRun ? 'would be deleted' : 'deleted'}`);

    if (!includeLocations) {
      const locationCount = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(*) as count FROM ${LOCATION_TABLE}`
      );
      console.log(`Locations preserved: ${Number(locationCount[0].count)} rows`);
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    if (dryRun) {
      console.log('💡 Run without --dry-run to actually delete data');
    } else {
      console.log('✅ Database cleared successfully!');
    }

  } catch (error) {
    // Re-enable foreign key checks even on error
    try {
      await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
    } catch {
      // Ignore errors when re-enabling
    }

    console.error('\n❌ Error clearing data:', error);
    process.exit(1);
  }
}

// Parse CLI arguments
function parseArgs(): ClearOptions {
  const args = process.argv.slice(2);
  return {
    includeLocations: args.includes('--include-locations'),
    dryRun: args.includes('--dry-run'),
  };
}

// Main execution
async function main() {
  const options = parseArgs();

  try {
    await clearData(options);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
