import cron from "node-cron";
import { bookingRepo } from "../modules/bookings/booking.repo.js";
import { notificationService } from "../modules/notifications/notification.service.js";
import { sendBookingDeclinedEmail } from "../libs/email.js";
import { prisma } from "../libs/prisma.js";
import { logger } from "../libs/logger.js";

let expirationJob: cron.ScheduledTask | null = null;

const EXPIRATION_HOURS = 48;
const AUTO_DECLINE_REASON = "Expired — provider did not respond in time";

/**
 * Start the booking expiration job
 * Runs every hour to auto-decline PENDING bookings older than 48 hours
 */
export function startBookingExpiration(): void {
    // Run every hour at minute 30
    expirationJob = cron.schedule("30 * * * *", async () => {
        try {
            const cutoffDate = new Date();
            cutoffDate.setHours(cutoffDate.getHours() - EXPIRATION_HOURS);

            const expiredBookings = await bookingRepo.findExpiredPendingBookings(cutoffDate);

            if (expiredBookings.length === 0) {
                return;
            }

            logger.info(
                { count: expiredBookings.length },
                "Found expired PENDING bookings to auto-decline"
            );

            for (const booking of expiredBookings) {
                try {
                    // Auto-decline the booking
                    await bookingRepo.declineBooking(booking.id, AUTO_DECLINE_REASON);

                    // Notify customer
                    const providerName = booking.providerName ?? "The provider";

                    await notificationService.notifyBookingDeclined(
                        booking.userId,
                        booking.id,
                        providerName,
                        booking.entityName ?? booking.entityType
                    );

                    // Send email to customer
                    const customer = await prisma.user.findUnique({
                        where: { id: booking.userId },
                        select: { email: true, firstName: true, emailNotifications: true },
                    });

                    if (customer && customer.emailNotifications !== false) {
                        await sendBookingDeclinedEmail(
                            customer.email,
                            customer.firstName,
                            providerName,
                            booking.entityName ?? booking.entityType,
                            AUTO_DECLINE_REASON
                        );
                    }

                    logger.info(
                        { bookingId: booking.id, referenceNumber: booking.referenceNumber },
                        "Auto-declined expired booking"
                    );
                } catch (err) {
                    logger.error(
                        { err, bookingId: booking.id },
                        "Failed to auto-decline expired booking"
                    );
                }
            }

            logger.info(
                { expiredCount: expiredBookings.length },
                "Booking expiration job completed"
            );
        } catch (error) {
            logger.error({ error }, "Failed to run booking expiration job");
        }
    });

    logger.info("Booking expiration job started (runs every hour at :30)");
}

/**
 * Stop the booking expiration job
 */
export function stopBookingExpiration(): void {
    if (expirationJob) {
        expirationJob.stop();
        expirationJob = null;
        logger.info("Booking expiration job stopped");
    }
}
