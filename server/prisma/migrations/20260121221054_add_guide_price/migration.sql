-- AlterTable
ALTER TABLE `guides` ADD COLUMN `currency` VARCHAR(3) NOT NULL DEFAULT 'GEL',
    ADD COLUMN `price_per_day` DECIMAL(10, 2) NULL;
