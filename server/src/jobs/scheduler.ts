/**
 * Job scheduler using node-cron
 *
 * This file sets up scheduled jobs for background tasks.
 * Import and call `startScheduler()` in your server.ts to enable scheduled jobs.
 *
 * NOTE: To use this, you need to install node-cron:
 *   npm install node-cron
 *   npm install --save-dev @types/node-cron
 */

import { logger } from "../libs/logger.js";
import { runMediaCleanupJob } from "./media-cleanup.job.js";

// Uncomment when node-cron is installed
// import cron from 'node-cron';

/**
 * Start all scheduled jobs
 */
export function startScheduler(): void {
  logger.info("[Scheduler] Starting job scheduler...");

  // ==========================================
  // Media Cleanup Job
  // ==========================================
  // Runs daily at 3:00 AM
  // Cleans up orphaned media files and database records

  /*
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
  */

  // ==========================================
  // Other Scheduled Jobs (Examples)
  // ==========================================

  /*
  // Send daily digest emails at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    logger.info('[Scheduler] Sending daily digest emails...');
    // await sendDailyDigestEmails();
  });

  // Process pending bookings every 15 minutes
  cron.schedule('*\/15 * * * *', async () => {
    logger.info('[Scheduler] Processing pending bookings...');
    // await processPendingBookings();
  });

  // Weekly backup at Sunday 2:00 AM
  cron.schedule('0 2 * * 0', async () => {
    logger.info('[Scheduler] Running weekly backup...');
    // await runWeeklyBackup();
  });
  */

  logger.info("[Scheduler] All scheduled jobs initialized");
}

/**
 * Cron schedule format:
 *
 * ┌───────────── second (optional, 0-59)
 * │ ┌───────────── minute (0-59)
 * │ │ ┌───────────── hour (0-23)
 * │ │ │ ┌───────────── day of month (1-31)
 * │ │ │ │ ┌───────────── month (1-12)
 * │ │ │ │ │ ┌───────────── day of week (0-7, 0 and 7 are Sunday)
 * │ │ │ │ │ │
 * │ │ │ │ │ │
 * * * * * * *
 *
 * Examples:
 * - '0 3 * * *'      = Every day at 3:00 AM
 * - '0 0 * * 0'      = Every Sunday at midnight
 * - '*\/15 * * * *'  = Every 15 minutes
 * - '0 9-17 * * 1-5' = Every hour from 9 AM to 5 PM, Monday to Friday
 * - '0 0 1 * *'      = First day of every month at midnight
 */

/**
 * Manual job execution (for testing)
 */
export async function runJobManually(jobName: string): Promise<void> {
  logger.info(`[Scheduler] Manually running job: ${jobName}`);

  switch (jobName) {
    case "media-cleanup":
      await runMediaCleanupJob();
      break;

    default:
      logger.warn(`[Scheduler] Unknown job: ${jobName}`);
  }
}
