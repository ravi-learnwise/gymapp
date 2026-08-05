-- Phase 5-7: Fitness assessments, attendance, schema version bump

CREATE TABLE `fitness_assessments` (
    `id` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `height` DECIMAL(5, 2) NULL,
    `weight` DECIMAL(5, 2) NULL,
    `bmi` DECIMAL(4, 1) NULL,
    `bodyFat` DECIMAL(5, 2) NULL,
    `waist` DECIMAL(5, 2) NULL,
    `chest` DECIMAL(5, 2) NULL,
    `hip` DECIMAL(5, 2) NULL,
    `arm` DECIMAL(5, 2) NULL,
    `thigh` DECIMAL(5, 2) NULL,
    `medicalHistory` TEXT NULL,
    `fitnessGoals` TEXT NULL,
    `notes` TEXT NULL,
    `assessedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `assessedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fitness_assessments_memberId_idx`(`memberId`),
    INDEX `fitness_assessments_assessedAt_idx`(`assessedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `attendance_records` (
    `id` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `checkIn` DATETIME(3) NOT NULL,
    `checkOut` DATETIME(3) NULL,
    `sessionMinutes` INTEGER NULL,
    `batch` VARCHAR(191) NULL,
    `recordedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `attendance_records_memberId_idx`(`memberId`),
    INDEX `attendance_records_checkIn_idx`(`checkIn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `fitness_assessments` ADD CONSTRAINT `fitness_assessments_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `fitness_assessments` ADD CONSTRAINT `fitness_assessments_assessedById_fkey` FOREIGN KEY (`assessedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_recordedById_fkey` FOREIGN KEY (`recordedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

UPDATE `_schema_version` SET `version` = 'phase-7' WHERE `id` = 1;
