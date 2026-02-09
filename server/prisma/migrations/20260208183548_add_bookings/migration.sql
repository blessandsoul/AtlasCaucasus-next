-- CreateTable
CREATE TABLE `bookings` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` VARCHAR(191) NOT NULL,
    `inquiry_id` VARCHAR(191) NULL,
    `status` ENUM('CONFIRMED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
    `booking_date` DATETIME(3) NULL,
    `guests` INTEGER NULL,
    `total_price` DECIMAL(10, 2) NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'GEL',
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `cancelled_at` DATETIME(3) NULL,

    INDEX `bookings_user_id_status_idx`(`user_id`, `status`),
    INDEX `bookings_entity_type_entity_id_idx`(`entity_type`, `entity_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_inquiry_id_fkey` FOREIGN KEY (`inquiry_id`) REFERENCES `inquiries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
