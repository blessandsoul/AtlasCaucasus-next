-- AlterTable
ALTER TABLE `tours` ADD COLUMN `city` VARCHAR(100) NULL,
    ADD COLUMN `has_free_cancellation` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_instant_booking` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `next_available_date` DATETIME(3) NULL,
    ADD COLUMN `original_price` DECIMAL(10, 2) NULL,
    ADD COLUMN `start_date` DATETIME(3) NULL,
    ADD COLUMN `start_location` VARCHAR(100) NULL;

-- CreateIndex
CREATE INDEX `tours_city_idx` ON `tours`(`city`);
