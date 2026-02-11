-- AlterTable
ALTER TABLE `companies` ADD COLUMN `view_count` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `drivers` ADD COLUMN `view_count` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `guides` ADD COLUMN `view_count` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `tours` ADD COLUMN `view_count` INTEGER NOT NULL DEFAULT 0;
