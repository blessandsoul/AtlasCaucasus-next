-- DropForeignKey
ALTER TABLE `chat_messages` DROP FOREIGN KEY `chat_messages_sender_id_fkey`;

-- DropForeignKey
ALTER TABLE `chats` DROP FOREIGN KEY `chats_creator_id_fkey`;

-- DropForeignKey
ALTER TABLE `message_read_receipts` DROP FOREIGN KEY `message_read_receipts_user_id_fkey`;

-- AddForeignKey
ALTER TABLE `chats` ADD CONSTRAINT `chats_creator_id_fkey` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_read_receipts` ADD CONSTRAINT `message_read_receipts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
