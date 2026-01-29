import cron from "node-cron";
import { inquiryRepo } from "../modules/inquiries/inquiry.repo.js";
import { logger } from "../libs/logger.js";

let expirationJob: cron.ScheduledTask | null = null;

/**
 * Start the inquiry expiration job
 * Runs daily at 4:00 AM to mark expired inquiries
 */
export function startInquiryExpiration() {
    // Run daily at 4:00 AM
    expirationJob = cron.schedule("0 4 * * *", async () => {
        try {
            const result = await inquiryRepo.markExpiredInquiries();

            logger.info(
                { expiredCount: result.count },
                "Marked expired inquiries"
            );
        } catch (error) {
            logger.error({ error }, "Failed to mark expired inquiries");
        }
    });

    logger.info("Inquiry expiration job started (runs daily at 4:00 AM)");
}

/**
 * Stop the inquiry expiration job
 */
export function stopInquiryExpiration() {
    if (expirationJob) {
        expirationJob.stop();
        expirationJob = null;
        logger.info("Inquiry expiration job stopped");
    }
}
