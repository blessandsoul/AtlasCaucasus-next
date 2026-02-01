-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `action` ENUM('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'TOKEN_REFRESH', 'PASSWORD_CHANGE', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_COMPLETE', 'EMAIL_VERIFICATION', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_RESTORE', 'USER_ROLE_ADD', 'USER_ROLE_REMOVE', 'ACCOUNT_LOCK', 'ACCOUNT_UNLOCK', 'COMPANY_CREATE', 'COMPANY_UPDATE', 'COMPANY_VERIFY', 'GUIDE_CREATE', 'GUIDE_UPDATE', 'GUIDE_VERIFY', 'DRIVER_CREATE', 'DRIVER_UPDATE', 'DRIVER_VERIFY', 'TOUR_CREATE', 'TOUR_UPDATE', 'TOUR_DELETE', 'MEDIA_UPLOAD', 'MEDIA_DELETE', 'ADMIN_ACTION') NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `target_type` VARCHAR(50) NULL,
    `target_id` VARCHAR(255) NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(512) NULL,
    `metadata` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    `error_message` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `audit_logs_action_created_at_idx`(`action`, `created_at`),
    INDEX `audit_logs_target_type_target_id_idx`(`target_type`, `target_id`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    INDEX `audit_logs_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
