-- AlterTable
ALTER TABLE `bookings` ADD COLUMN `completed_at` DATETIME(3) NULL,
    ADD COLUMN `confirmed_at` DATETIME(3) NULL,
    ADD COLUMN `contact_email` VARCHAR(255) NULL,
    ADD COLUMN `contact_phone` VARCHAR(20) NULL,
    ADD COLUMN `declined_at` DATETIME(3) NULL,
    ADD COLUMN `declined_reason` TEXT NULL,
    ADD COLUMN `entity_image` VARCHAR(512) NULL,
    ADD COLUMN `entity_name` VARCHAR(255) NULL,
    ADD COLUMN `provider_name` VARCHAR(255) NULL,
    ADD COLUMN `provider_notes` TEXT NULL,
    ADD COLUMN `provider_user_id` VARCHAR(191) NULL,
    ADD COLUMN `reference_number` VARCHAR(20) NULL,
    MODIFY `status` ENUM('PENDING', 'CONFIRMED', 'DECLINED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED';

-- AlterTable
ALTER TABLE `notifications` MODIFY `type` ENUM('CHAT_MESSAGE', 'CHAT_MENTION', 'INQUIRY_RECEIVED', 'INQUIRY_RESPONSE', 'BOOKING_REQUEST', 'BOOKING_CONFIRMED', 'BOOKING_DECLINED', 'BOOKING_CANCELLED', 'BOOKING_COMPLETED', 'PROFILE_VERIFIED', 'SYSTEM') NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `bookings_reference_number_key` ON `bookings`(`reference_number`);

-- CreateIndex
CREATE INDEX `bookings_provider_user_id_status_idx` ON `bookings`(`provider_user_id`, `status`);

-- CreateIndex
CREATE INDEX `bookings_reference_number_idx` ON `bookings`(`reference_number`);
