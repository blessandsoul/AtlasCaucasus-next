# Step 12 Summary: Background Media Cleanup Job

## What Was Implemented

Step 12 added a background cleanup job to automatically clean up orphaned media files and database records. This ensures the system stays clean even if edge cases occur where media isn't properly deleted.

## Problem Solved

**Before Step 12:**
- If entity deletion failed partway, orphaned media records could remain
- If file deletion failed, orphaned files could accumulate on disk
- Manual cleanup required to maintain data integrity
- No automated maintenance

**After Step 12:**
- Automated cleanup job removes orphaned records
- Automated cleanup removes orphaned files
- Can run on schedule (daily/weekly) or manually on demand
- Comprehensive statistics and logging

## Files Created

### 1. Media Cleanup Job
**File:** `server/src/jobs/media-cleanup.job.ts`

**Features:**
```typescript
// Main cleanup function
export async function runMediaCleanupJob(): Promise<CleanupStats>

// Two-phase cleanup:
// Phase 1: Clean database records where entity doesn't exist
async function cleanupOrphanedRecords(): Promise<number>

// Phase 2: Clean files on disk without database records
async function cleanupOrphanedFiles(): Promise<number>

// CLI wrapper for manual execution
export async function runMediaCleanupJobCLI(): Promise<void>
```

**Cleanup Logic:**

1. **Orphaned Records** - Database record exists but entity is gone:
   ```typescript
   // For each media record:
   // 1. Check if entity exists (tour, company, guide, driver, user)
   // 2. If entity missing:
   //    - Delete file from disk
   //    - Delete database record
   ```

2. **Orphaned Files** - File exists but no database record:
   ```typescript
   // For each entity type:
   // 1. List all files in directory
   // 2. Check if database record exists
   // 3. If no record:
   //    - Delete file from disk
   ```

### 2. CLI Script
**File:** `server/src/scripts/cleanup-media.ts`

**Purpose:** Manual execution of cleanup job

**Usage:**
```bash
npm run cleanup:media
```

**Example Output:**
```
[MediaCleanup] Starting media cleanup job...
[MediaCleanup] Phase 1: Cleaning orphaned database records...
[MediaCleanup] Found media record with missing tour entity: media-uuid-1
[MediaCleanup] Deleted file: /uploads/tours/abc123-image.jpg
[MediaCleanup] Deleted media record: media-uuid-1
[MediaCleanup] Phase 1 complete: Deleted 3 orphaned records

[MediaCleanup] Phase 2: Cleaning orphaned files...
[MediaCleanup] Found orphaned file: /uploads/companies/xyz789-logo.jpg
[MediaCleanup] Phase 2 complete: Deleted 2 orphaned files

[MediaCleanup] Cleanup Statistics:
  - Orphaned Records Deleted: 3
  - Orphaned Files Deleted: 2
  - Errors: 0
  - Duration: 1.2s

[MediaCleanup] Job completed successfully.
```

### 3. Job Scheduler
**File:** `server/src/jobs/scheduler.ts`

**Purpose:** Schedule cleanup job to run automatically

**Setup Required:**
```typescript
// 1. Import in server.ts
import { startScheduler } from "./jobs/scheduler.js";

// 2. Start after server initialization
await fastify.listen({ port: 3000, host: '0.0.0.0' });
startScheduler(); // Start background jobs
```

**Schedule Configuration:**
```typescript
// Example: Run daily at 3:00 AM Tbilisi time
cron.schedule('0 3 * * *', async () => {
  logger.info('[Scheduler] Running media cleanup job...');

  try {
    const stats = await runMediaCleanupJob();
    logger.info(`[Scheduler] Media cleanup completed: ${stats.orphanedRecords} records, ${stats.orphanedFiles} files deleted`);
  } catch (err) {
    logger.error('[Scheduler] Media cleanup job failed:', err);
  }
}, {
  timezone: 'Europe/Tbilisi'
});
```

## How It Works

### Cleanup Process Flow

```
┌─────────────────────────────────────────┐
│   Start Media Cleanup Job               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Phase 1: Orphaned Database Records    │
│                                         │
│   For each media record in database:   │
│   1. Check if entity exists             │
│   2. If missing:                        │
│      - Delete file from disk            │
│      - Delete database record           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Phase 2: Orphaned Files on Disk      │
│                                         │
│   For each file in uploads/:            │
│   1. Check if database record exists    │
│   2. If missing:                        │
│      - Delete file from disk            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Return Statistics                     │
│   - orphanedRecords: number             │
│   - orphanedFiles: number               │
│   - errors: string[]                    │
└─────────────────────────────────────────┘
```

### Entity Verification

The job checks each entity type differently:

```typescript
switch (media.entityType) {
  case "tour":
    entityExists = !!(await prisma.tour.findUnique({
      where: { id: media.entityId },
      select: { id: true }
    }));
    break;

  case "company":
    entityExists = !!(await prisma.company.findUnique({
      where: { id: media.entityId },
      select: { id: true }
    }));
    break;

  // ... similar for guide, driver, user
}
```

## Usage Examples

### Manual Execution

Run cleanup immediately:
```bash
npm run cleanup:media
```

### Scheduled Execution (Recommended)

1. **Enable in `src/server.ts`:**
```typescript
import { startScheduler } from "./jobs/scheduler.js";

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    logger.info('Server started successfully');

    // Start background jobs
    startScheduler();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
```

2. **Uncomment schedule in `src/jobs/scheduler.ts`:**
```typescript
// Daily at 3:00 AM
cron.schedule('0 3 * * *', async () => {
  logger.info('[Scheduler] Running media cleanup job...');

  try {
    const stats = await runMediaCleanupJob();
    logger.info(
      `[Scheduler] Media cleanup completed: ${stats.orphanedRecords} records, ${stats.orphanedFiles} files deleted`
    );
  } catch (err) {
    logger.error('[Scheduler] Media cleanup job failed:', err);
  }
}, {
  timezone: 'Europe/Tbilisi'
});
```

### Schedule Options

```typescript
// Every day at 3:00 AM
cron.schedule('0 3 * * *', handler);

// Every Sunday at 2:00 AM
cron.schedule('0 2 * * 0', handler);

// Every 6 hours
cron.schedule('0 */6 * * *', handler);

// Every Monday at 9:00 AM
cron.schedule('0 9 * * 1', handler);
```

## When Cleanup is Needed

### Scenarios That Create Orphaned Media

1. **Failed Entity Deletion:**
   - Entity deletion succeeds
   - Media deletion fails (network error, permission issue)
   - Result: Database record exists but entity is gone

2. **Race Conditions:**
   - Multiple requests deleting same entity
   - Media deletion happens twice
   - Result: File deleted but record remains

3. **Manual Database Operations:**
   - Developer deletes entity via SQL
   - Media cleanup not triggered
   - Result: Orphaned records and files

4. **Application Crashes:**
   - Server crashes during deletion
   - Partial cleanup completed
   - Result: Inconsistent state

5. **Development/Testing:**
   - Database reset but files remain
   - Manual file deletion but records remain
   - Result: Orphaned files or records

## Safety Features

### Error Handling
```typescript
try {
  stats.orphanedRecords = await cleanupOrphanedRecords();
  stats.orphanedFiles = await cleanupOrphanedFiles();
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : String(err);
  stats.errors.push(errorMessage);
  logger.error('[MediaCleanup] Job failed:', err);
}
```

### Non-Blocking Execution
- Job runs asynchronously
- Doesn't block main application
- Failed cleanup doesn't crash server

### Comprehensive Logging
```typescript
logger.info(`[MediaCleanup] Found media record with missing ${entityType} entity: ${media.id}`);
logger.info(`[MediaCleanup] Deleted file: ${media.url}`);
logger.info(`[MediaCleanup] Deleted media record: ${media.id}`);
```

### Statistics Tracking
```typescript
interface CleanupStats {
  orphanedRecords: number;  // Database records deleted
  orphanedFiles: number;    // Files deleted from disk
  errors: string[];         // Any errors encountered
}
```

## Performance Considerations

### Database Queries
- Uses `select: { id: true }` for minimal data transfer
- Separate queries per entity (could be optimized with joins)
- Batch operations where possible

### File System Operations
- Reads directory once per entity type
- Parallel file deletion with Promise.all (if implemented)
- Minimal I/O operations

### Execution Time
- Depends on number of orphaned items
- Typical: < 5 seconds for small datasets
- Large cleanup: may take 1-2 minutes

### Resource Usage
- Low CPU usage (I/O bound)
- Minimal memory footprint
- Network: None (all local operations)

## Monitoring & Alerts

### Success Monitoring
```typescript
// Log statistics after each run
logger.info(
  `[Scheduler] Media cleanup completed: ${stats.orphanedRecords} records, ${stats.orphanedFiles} files deleted`
);
```

### Failure Detection
```typescript
// Alert on errors
if (stats.errors.length > 0) {
  logger.error('[MediaCleanup] Job completed with errors:', stats.errors);
  // TODO: Send alert to monitoring service (Sentry, etc.)
}
```

### Metrics to Track
- Number of orphaned records per run
- Number of orphaned files per run
- Job execution time
- Error frequency
- Disk space freed

## Testing the Cleanup Job

### Test Manual Execution

1. Create orphaned record (entity deleted but media remains):
```bash
# 1. Create tour with image
POST /api/v1/tours
POST /api/v1/tours/{tourId}/images

# 2. Delete tour via SQL (bypassing media cleanup)
DELETE FROM tours WHERE id = '{tourId}';

# 3. Run cleanup
npm run cleanup:media

# 4. Verify media deleted
GET /api/v1/media/tour/{tourId}  # Should return empty
```

2. Create orphaned file (file exists but no record):
```bash
# 1. Manually place file in uploads/tours/
cp test-image.jpg uploads/tours/orphaned-file.jpg

# 2. Run cleanup
npm run cleanup:media

# 3. Verify file deleted
ls uploads/tours/  # orphaned-file.jpg should be gone
```

### Test Scheduled Execution

1. Set short schedule for testing:
```typescript
// Run every minute (testing only!)
cron.schedule('* * * * *', async () => {
  const stats = await runMediaCleanupJob();
  logger.info('Test cleanup:', stats);
});
```

2. Monitor logs:
```bash
npm run dev
# Watch for cleanup logs every minute
```

## Production Recommendations

### Scheduling
- **Frequency:** Daily during off-peak hours (3-4 AM)
- **Timezone:** Match server timezone (Europe/Tbilisi)
- **Avoid:** Peak traffic times

### Monitoring
- Track cleanup statistics
- Alert if errors occur
- Monitor disk space trends

### Backup
- Backup database before cleanup (optional)
- Keep media files for 30 days in archive (optional)

### Resource Limits
- Limit concurrent cleanup jobs (use lock mechanism)
- Add timeout for long-running cleanups
- Throttle file operations if needed

## Future Enhancements (Optional)

### Archive Before Delete
```typescript
// Move files to archive instead of deleting
const archivePath = `/uploads/archive/${entityType}s/${filename}`;
await moveFile(currentPath, archivePath);
```

### Soft Delete for Media
```typescript
// Add deletedAt field to Media model
model Media {
  // ...
  deletedAt DateTime?
}

// Clean after 30 days
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
await prisma.media.deleteMany({
  where: {
    deletedAt: { lt: thirtyDaysAgo }
  }
});
```

### Detailed Statistics Dashboard
```typescript
interface DetailedStats {
  totalRecordsChecked: number;
  totalFilesChecked: number;
  orphanedRecords: number;
  orphanedFiles: number;
  diskSpaceFreed: number;  // in bytes
  executionTime: number;    // in ms
  errors: string[];
}
```

## Status

✅ **Step 12 Complete**

**Implemented:**
- ✅ Media cleanup job with two-phase approach
- ✅ CLI script for manual execution
- ✅ Scheduler setup with node-cron examples
- ✅ Comprehensive logging and statistics
- ✅ Error handling and safety features
- ✅ npm script for easy execution

**Remaining (from original plan):**
- Step 13: Environment variables
- Step 14: Update .gitignore (COMPLETED earlier)
- Step 15: Create migration & seed data (migration COMPLETED, seed data optional)

**Optional Extensions (user will request explicitly):**
- Extend media to other entities (companies, guides, drivers)
- Archive media before deletion
- Soft delete with retention period
- Cloud storage migration

---

**Last Updated**: January 14, 2026
