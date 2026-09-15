-- V2: RBAC enrollment types, membership audit, exercise library, training cards

-- Program enrollment type
ALTER TABLE `programs` ADD COLUMN `enrollmentType` ENUM('INDEPENDENT', 'ADD_ON') NOT NULL DEFAULT 'INDEPENDENT';

-- Membership enrolled-by audit
ALTER TABLE `memberships` ADD COLUMN `enrolledById` VARCHAR(191) NULL;
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_enrolledById_fkey` FOREIGN KEY (`enrolledById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Exercise library
CREATE TABLE `exercises` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `muscleGroups` TEXT NULL,
    `equipment` VARCHAR(191) NULL,
    `type` ENUM('STRENGTH', 'CARDIO', 'FLEXIBILITY', 'BODYWEIGHT', 'OTHER') NOT NULL DEFAULT 'STRENGTH',
    `imageUrl` VARCHAR(191) NULL,
    `technique` TEXT NULL,
    `safetyNotes` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `exercises_name_idx`(`name`),
    INDEX `exercises_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `exercises` ADD CONSTRAINT `exercises_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Training cards
CREATE TABLE `training_cards` (
    `id` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'SUPERSEDED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `version` INTEGER NOT NULL DEFAULT 1,
    `effectiveFrom` DATETIME(3) NULL,
    `reviewDate` DATETIME(3) NULL,
    `previousVersionId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `training_cards_memberId_status_idx`(`memberId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `training_cards` ADD CONSTRAINT `training_cards_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `training_cards` ADD CONSTRAINT `training_cards_previousVersionId_fkey` FOREIGN KEY (`previousVersionId`) REFERENCES `training_cards`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `training_cards` ADD CONSTRAINT `training_cards_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `training_cards` ADD CONSTRAINT `training_cards_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `training_card_days` (
    `id` VARCHAR(191) NOT NULL,
    `trainingCardId` VARCHAR(191) NOT NULL,
    `weekday` INTEGER NOT NULL,
    `dayType` ENUM('WORKOUT', 'REST', 'RECOVERY', 'NOT_ASSIGNED') NOT NULL DEFAULT 'NOT_ASSIGNED',
    `notes` TEXT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `training_card_days_trainingCardId_weekday_idx`(`trainingCardId`, `weekday`),
    UNIQUE INDEX `training_card_days_trainingCardId_weekday_key`(`trainingCardId`, `weekday`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `training_card_days` ADD CONSTRAINT `training_card_days_trainingCardId_fkey` FOREIGN KEY (`trainingCardId`) REFERENCES `training_cards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `training_card_exercises` (
    `id` VARCHAR(191) NOT NULL,
    `dayId` VARCHAR(191) NOT NULL,
    `exerciseId` VARCHAR(191) NOT NULL,
    `sectionName` VARCHAR(191) NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `restSeconds` INTEGER NULL,
    `notes` TEXT NULL,

    INDEX `training_card_exercises_dayId_displayOrder_idx`(`dayId`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `training_card_exercises` ADD CONSTRAINT `training_card_exercises_dayId_fkey` FOREIGN KEY (`dayId`) REFERENCES `training_card_days`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `training_card_exercises` ADD CONSTRAINT `training_card_exercises_exerciseId_fkey` FOREIGN KEY (`exerciseId`) REFERENCES `exercises`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE `training_card_sets` (
    `id` VARCHAR(191) NOT NULL,
    `trainingCardExerciseId` VARCHAR(191) NOT NULL,
    `setNumber` INTEGER NOT NULL,
    `repMin` INTEGER NOT NULL,
    `repMax` INTEGER NULL,
    `weight` DECIMAL(8, 2) NULL,
    `weightUnit` ENUM('KG', 'LB') NULL,
    `durationSeconds` INTEGER NULL,
    `notes` TEXT NULL,

    INDEX `training_card_sets_trainingCardExerciseId_setNumber_idx`(`trainingCardExerciseId`, `setNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `training_card_sets` ADD CONSTRAINT `training_card_sets_trainingCardExerciseId_fkey` FOREIGN KEY (`trainingCardExerciseId`) REFERENCES `training_card_exercises`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE `_schema_version` SET `version` = 'phase-v2', `updatedAt` = CURRENT_TIMESTAMP(3) WHERE `id` = 1;
