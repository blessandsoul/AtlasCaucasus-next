-- AlterTable
ALTER TABLE `tours` ADD COLUMN `availability_type` VARCHAR(50) NOT NULL DEFAULT 'BY_REQUEST',
    ADD COLUMN `available_dates` TEXT NULL,
    ADD COLUMN `start_time` VARCHAR(10) NULL;
