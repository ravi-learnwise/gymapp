-- V4: Training and diet plan templates

-- AlterTable
ALTER TABLE `training_cards` ADD COLUMN `sourceTemplateId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `diet_plans` ADD COLUMN `sourceTemplateId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `training_cards_sourceTemplateId_idx` ON `training_cards`(`sourceTemplateId`);

-- CreateIndex
CREATE INDEX `diet_plans_sourceTemplateId_idx` ON `diet_plans`(`sourceTemplateId`);

-- CreateTable
CREATE TABLE `training_plan_templates` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `training_plan_templates_isActive_idx`(`isActive`),
    INDEX `training_plan_templates_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `training_plan_template_days` (
    `id` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `weekday` INTEGER NOT NULL,
    `dayType` ENUM('WORKOUT', 'REST', 'RECOVERY', 'NOT_ASSIGNED') NOT NULL DEFAULT 'NOT_ASSIGNED',
    `notes` TEXT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `training_plan_template_days_templateId_weekday_idx`(`templateId`, `weekday`),
    UNIQUE INDEX `training_plan_template_days_templateId_weekday_key`(`templateId`, `weekday`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `training_plan_template_exercises` (
    `id` VARCHAR(191) NOT NULL,
    `dayId` VARCHAR(191) NOT NULL,
    `exerciseId` VARCHAR(191) NOT NULL,
    `sectionName` VARCHAR(191) NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `restSeconds` INTEGER NULL,
    `notes` TEXT NULL,

    INDEX `training_plan_template_exercises_dayId_displayOrder_idx`(`dayId`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `training_plan_template_sets` (
    `id` VARCHAR(191) NOT NULL,
    `templateExerciseId` VARCHAR(191) NOT NULL,
    `setNumber` INTEGER NOT NULL,
    `repMin` INTEGER NOT NULL,
    `repMax` INTEGER NULL,
    `weight` DECIMAL(8, 2) NULL,
    `weightUnit` ENUM('KG', 'LB') NULL,
    `durationSeconds` INTEGER NULL,
    `notes` TEXT NULL,

    INDEX `training_plan_template_sets_templateExerciseId_setNumber_idx`(`templateExerciseId`, `setNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diet_plan_templates` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `objective` ENUM('GENERAL_FITNESS', 'WEIGHT_MANAGEMENT', 'FAT_LOSS', 'MUSCLE_GAIN', 'STRENGTH_PERFORMANCE', 'HEALTHY_EATING', 'SPORTS_ATHLETIC', 'MEDICAL_SPECIAL', 'OTHER') NOT NULL DEFAULT 'GENERAL_FITNESS',
    `description` TEXT NULL,
    `hydrationGoal` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `diet_plan_templates_isActive_idx`(`isActive`),
    INDEX `diet_plan_templates_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diet_plan_template_days` (
    `id` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `weekday` INTEGER NOT NULL,
    `dayType` ENUM('PLAN_AVAILABLE', 'REST_RECOVERY', 'NO_SPECIFIC_PLAN') NOT NULL DEFAULT 'PLAN_AVAILABLE',
    `notes` TEXT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `diet_plan_template_days_templateId_weekday_idx`(`templateId`, `weekday`),
    UNIQUE INDEX `diet_plan_template_days_templateId_weekday_key`(`templateId`, `weekday`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diet_plan_template_meals` (
    `id` VARCHAR(191) NOT NULL,
    `dayId` VARCHAR(191) NOT NULL,
    `mealType` ENUM('EARLY_MORNING', 'BREAKFAST', 'MID_MORNING', 'LUNCH', 'EVENING_HIGH_TEA', 'PRE_WORKOUT', 'POST_WORKOUT', 'DINNER', 'BEDTIME', 'SUPPLEMENT', 'HYDRATION', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `title` VARCHAR(191) NULL,
    `approximateTime` VARCHAR(191) NULL,
    `timingNote` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `diet_plan_template_meals_dayId_displayOrder_idx`(`dayId`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diet_plan_template_food_items` (
    `id` VARCHAR(191) NOT NULL,
    `mealId` VARCHAR(191) NOT NULL,
    `foodName` VARCHAR(191) NOT NULL,
    `quantity` VARCHAR(191) NULL,
    `unit` VARCHAR(191) NULL,
    `preparation` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `diet_plan_template_food_items_mealId_displayOrder_idx`(`mealId`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diet_plan_template_food_alternatives` (
    `id` VARCHAR(191) NOT NULL,
    `foodItemId` VARCHAR(191) NOT NULL,
    `alternativeFoodName` VARCHAR(191) NOT NULL,
    `quantity` VARCHAR(191) NULL,
    `unit` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `diet_plan_template_food_alternatives_foodItemId_displayOrder_idx`(`foodItemId`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `training_plan_templates` ADD CONSTRAINT `training_plan_templates_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_plan_templates` ADD CONSTRAINT `training_plan_templates_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_plan_template_days` ADD CONSTRAINT `training_plan_template_days_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `training_plan_templates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_plan_template_exercises` ADD CONSTRAINT `training_plan_template_exercises_dayId_fkey` FOREIGN KEY (`dayId`) REFERENCES `training_plan_template_days`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_plan_template_exercises` ADD CONSTRAINT `training_plan_template_exercises_exerciseId_fkey` FOREIGN KEY (`exerciseId`) REFERENCES `exercises`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_plan_template_sets` ADD CONSTRAINT `training_plan_template_sets_templateExerciseId_fkey` FOREIGN KEY (`templateExerciseId`) REFERENCES `training_plan_template_exercises`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diet_plan_templates` ADD CONSTRAINT `diet_plan_templates_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diet_plan_templates` ADD CONSTRAINT `diet_plan_templates_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diet_plan_template_days` ADD CONSTRAINT `diet_plan_template_days_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `diet_plan_templates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diet_plan_template_meals` ADD CONSTRAINT `diet_plan_template_meals_dayId_fkey` FOREIGN KEY (`dayId`) REFERENCES `diet_plan_template_days`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diet_plan_template_food_items` ADD CONSTRAINT `diet_plan_template_food_items_mealId_fkey` FOREIGN KEY (`mealId`) REFERENCES `diet_plan_template_meals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diet_plan_template_food_alternatives` ADD CONSTRAINT `diet_plan_template_food_alternatives_foodItemId_fkey` FOREIGN KEY (`foodItemId`) REFERENCES `diet_plan_template_food_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_cards` ADD CONSTRAINT `training_cards_sourceTemplateId_fkey` FOREIGN KEY (`sourceTemplateId`) REFERENCES `training_plan_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diet_plans` ADD CONSTRAINT `diet_plans_sourceTemplateId_fkey` FOREIGN KEY (`sourceTemplateId`) REFERENCES `diet_plan_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
