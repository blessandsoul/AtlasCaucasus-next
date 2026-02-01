-- AlterTable
ALTER TABLE `users` ADD COLUMN `invitation_token` VARCHAR(64) NULL,
    ADD COLUMN `invitation_token_expires_at` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `users_invitation_token_idx` ON `users`(`invitation_token`);
