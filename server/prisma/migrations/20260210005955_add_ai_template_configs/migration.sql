-- CreateTable
CREATE TABLE `ai_template_configs` (
    `id` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `type` ENUM('TOUR_DESCRIPTION', 'TOUR_ITINERARY', 'MARKETING_COPY', 'BLOG_CONTENT') NOT NULL,
    `credit_cost` INTEGER NOT NULL,
    `max_output_tokens` INTEGER NOT NULL,
    `temperature` DECIMAL(3, 2) NOT NULL DEFAULT 0.7,
    `top_p` DECIMAL(3, 2) NULL,
    `system_prompt` LONGTEXT NOT NULL,
    `fields` LONGTEXT NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `updated_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ai_template_configs_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
