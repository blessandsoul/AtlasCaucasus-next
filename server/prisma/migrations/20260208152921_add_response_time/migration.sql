-- AlterTable
ALTER TABLE `companies` ADD COLUMN `avg_response_time_minutes` INTEGER NULL,
    ADD COLUMN `response_count` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `drivers` ADD COLUMN `avg_response_time_minutes` INTEGER NULL,
    ADD COLUMN `response_count` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `guides` ADD COLUMN `avg_response_time_minutes` INTEGER NULL,
    ADD COLUMN `response_count` INTEGER NOT NULL DEFAULT 0;
