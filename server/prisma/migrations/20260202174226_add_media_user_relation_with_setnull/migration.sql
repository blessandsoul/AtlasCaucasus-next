-- AlterTable
ALTER TABLE `media` MODIFY `uploaded_by` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `media` ADD CONSTRAINT `media_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
