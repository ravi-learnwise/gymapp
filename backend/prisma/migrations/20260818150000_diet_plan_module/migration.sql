-- V3: Diet plan module

-- CreateTable
CREATE TABLE `diet_plans` (
    `id` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `objective` ENUM('GENERAL_FITNESS', 'WEIGHT_MANAGEMENT', 'FAT_LOSS', 'MUSCLE_GAIN', 'STRENGTH_PERFORMANCE', 'HEALTHY_EATING', 'SPORTS_ATHLETIC', 'MEDICAL_SPECIAL', 'OTHER') NOT NULL DEFAULT 'GENERAL_FITNESS',
    `description` TEXT NULL,
    `hydrationGoal` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'SUPERSEDED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `version` INTEGER NOT NULL DEFAULT 1,
    `effectiveFrom` DATETIME(3) NULL,
    `reviewDate` DATETIME(3) NULL,
    `previousVersionId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `diet_plans_memberId_status_idx`(`memberId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diet_plan_days` (
    `id` VARCHAR(191) NOT NULL,
    `dietPlanId` VARCHAR(191) NOT NULL,
    `weekday` INTEGER NOT NULL,
    `dayType` ENUM('PLAN_AVAILABLE', 'REST_RECOVERY', 'NO_SPECIFIC_PLAN') NOT NULL DEFAULT 'PLAN_AVAILABLE',
    `notes` TEXT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `diet_plan_days_dietPlanId_weekday_idx`(`dietPlanId`, `weekday`),
    UNIQUE INDEX `diet_plan_days_dietPlanId_weekday_key`(`dietPlanId`, `weekday`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diet_plan_meals` (
    `id` VARCHAR(191) NOT NULL,
    `dayId` VARCHAR(191) NOT NULL,
    `mealType` ENUM('EARLY_MORNING', 'BREAKFAST', 'MID_MORNING', 'LUNCH', 'EVENING_HIGH_TEA', 'PRE_WORKOUT', 'POST_WORKOUT', 'DINNER', 'BEDTIME', 'SUPPLEMENT', 'HYDRATION', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `title` VARCHAR(191) NULL,
    `approximateTime` VARCHAR(191) NULL,
    `timingNote` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `diet_plan_meals_dayId_displayOrder_idx`(`dayId`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diet_plan_food_items` (
    `id` VARCHAR(191) NOT NULL,
    `mealId` VARCHAR(191) NOT NULL,
    `foodName` VARCHAR(191) NOT NULL,
    `quantity` VARCHAR(191) NULL,
    `unit` VARCHAR(191) NULL,
    `preparation` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `diet_plan_food_items_mealId_displayOrder_idx`(`mealId`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diet_food_alternatives` (
    `id` VARCHAR(191) NOT NULL,
    `foodItemId` VARCHAR(191) NOT NULL,
    `alternativeFoodName` VARCHAR(191) NOT NULL,
    `quantity` VARCHAR(191) NULL,
    `unit` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `diet_food_alternatives_foodItemId_displayOrder_idx`(`foodItemId`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `diet_plans` ADD CONSTRAINT `diet_plans_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diet_plans` ADD CONSTRAINT `diet_plans_previousVersionId_fkey` FOREIGN KEY (`previousVersionId`) REFERENCES `diet_plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diet_plans` ADD CONSTRAINT `diet_plans_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diet_plans` ADD CONSTRAINT `diet_plans_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diet_plan_days` ADD CONSTRAINT `diet_plan_days_dietPlanId_fkey` FOREIGN KEY (`dietPlanId`) REFERENCES `diet_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diet_plan_meals` ADD CONSTRAINT `diet_plan_meals_dayId_fkey` FOREIGN KEY (`dayId`) REFERENCES `diet_plan_days`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diet_plan_food_items` ADD CONSTRAINT `diet_plan_food_items_mealId_fkey` FOREIGN KEY (`mealId`) REFERENCES `diet_plan_meals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diet_food_alternatives` ADD CONSTRAINT `diet_food_alternatives_foodItemId_fkey` FOREIGN KEY (`foodItemId`) REFERENCES `diet_plan_food_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
