-- Baseline for a empty database. Must run before 20260724 v2 ALTERs.
-- Creates core CRM tables that were originally applied with `db push` and never checked in.

CREATE TABLE `_schema_version` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `version` VARCHAR(191) NOT NULL DEFAULT 'phase-0',
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `_schema_version` (`id`, `version`, `updatedAt`)
VALUES (1, 'phase-0', CURRENT_TIMESTAMP(3));

CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'MANAGER', 'TRAINER') NOT NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `resetToken` VARCHAR(191) NULL,
    `resetTokenExp` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gym_config` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT 'My Gym',
    `address` TEXT NULL,
    `gstNumber` VARCHAR(191) NULL,
    `logoUrl` VARCHAR(191) NULL,
    `attendanceEnabled` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `programs` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `program_durations` (
    `id` VARCHAR(191) NOT NULL,
    `programId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `months` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `discount_categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `percentage` DECIMAL(5, 2) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `offer_categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `enquiries` (
    `id` VARCHAR(191) NOT NULL,
    `enquiryNumber` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `age` INTEGER NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY') NULL,
    `profession` VARCHAR(191) NULL,
    `familyDetails` TEXT NULL,
    `mobileNumber` VARCHAR(191) NOT NULL,
    `alternateContact` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `dateOfEnquiry` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `preferredContactTime` VARCHAR(191) NULL,
    `leadSource` ENUM('WALK_IN', 'REFERRAL', 'SOCIAL_MEDIA', 'ADVERTISEMENT', 'CORPORATE', 'ONLINE_SEARCH', 'OTHER') NOT NULL,
    `offeredProgramId` VARCHAR(191) NULL,
    `offeredDiscountId` VARCHAR(191) NULL,
    `offerCategoryId` VARCHAR(191) NULL,
    `offerValidTill` DATETIME(3) NULL,
    `status` ENUM('NEW', 'CONTACTED', 'FOLLOW_UP', 'TRIAL', 'CONVERTED', 'LOST') NOT NULL DEFAULT 'NEW',
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `enquiries_enquiryNumber_key`(`enquiryNumber`),
    INDEX `enquiries_status_idx`(`status`),
    INDEX `enquiries_leadSource_idx`(`leadSource`),
    INDEX `enquiries_dateOfEnquiry_idx`(`dateOfEnquiry`),
    INDEX `enquiries_mobileNumber_idx`(`mobileNumber`),
    INDEX `enquiries_fullName_idx`(`fullName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `enquiry_notes` (
    `id` VARCHAR(191) NOT NULL,
    `enquiryId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `enquiry_notes_enquiryId_idx`(`enquiryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `enquiry_status_history` (
    `id` VARCHAR(191) NOT NULL,
    `enquiryId` VARCHAR(191) NOT NULL,
    `fromStatus` ENUM('NEW', 'CONTACTED', 'FOLLOW_UP', 'TRIAL', 'CONVERTED', 'LOST') NULL,
    `toStatus` ENUM('NEW', 'CONTACTED', 'FOLLOW_UP', 'TRIAL', 'CONVERTED', 'LOST') NOT NULL,
    `changedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `enquiry_status_history_enquiryId_idx`(`enquiryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `enquiry_reminders` (
    `id` VARCHAR(191) NOT NULL,
    `enquiryId` VARCHAR(191) NOT NULL,
    `remindAt` DATETIME(3) NOT NULL,
    `note` TEXT NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `enquiry_reminders_enquiryId_idx`(`enquiryId`),
    INDEX `enquiry_reminders_remindAt_idx`(`remindAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `members` (
    `id` VARCHAR(191) NOT NULL,
    `memberNumber` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `mobileNumber` VARCHAR(191) NOT NULL,
    `alternateContact` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY') NULL,
    `profession` VARCHAR(191) NULL,
    `familyDetails` TEXT NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `height` DECIMAL(5, 2) NULL,
    `weight` DECIMAL(5, 2) NULL,
    `bmi` DECIMAL(4, 1) NULL,
    `medicalHistory` TEXT NULL,
    `allergies` TEXT NULL,
    `dietType` VARCHAR(191) NULL,
    `sportsParticipation` TEXT NULL,
    `fitnessGoals` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sourceEnquiryId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `members_memberNumber_key`(`memberNumber`),
    UNIQUE INDEX `members_sourceEnquiryId_key`(`sourceEnquiryId`),
    INDEX `members_mobileNumber_idx`(`mobileNumber`),
    INDEX `members_fullName_idx`(`fullName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `memberships` (
    `id` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `programId` VARCHAR(191) NOT NULL,
    `programDurationId` VARCHAR(191) NOT NULL,
    `trainerId` VARCHAR(191) NULL,
    `isTrial` BOOLEAN NOT NULL DEFAULT false,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `status` ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `memberships_memberId_idx`(`memberId`),
    INDEX `memberships_trainerId_idx`(`trainerId`),
    INDEX `memberships_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `enrollments` (
    `id` VARCHAR(191) NOT NULL,
    `enrollmentNumber` VARCHAR(191) NOT NULL,
    `enquiryId` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `membershipId` VARCHAR(191) NOT NULL,
    `enrolledById` VARCHAR(191) NOT NULL,
    `enrolledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `enrollments_enrollmentNumber_key`(`enrollmentNumber`),
    UNIQUE INDEX `enrollments_enquiryId_key`(`enquiryId`),
    UNIQUE INDEX `enrollments_memberId_key`(`memberId`),
    UNIQUE INDEX `enrollments_membershipId_key`(`membershipId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `payment_commitments` (
    `id` VARCHAR(191) NOT NULL,
    `membershipId` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `totalFee` DECIMAL(10, 2) NOT NULL,
    `discountAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `finalAmount` DECIMAL(10, 2) NOT NULL,
    `amountPaid` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `pendingAmount` DECIMAL(10, 2) NOT NULL,
    `gstPercent` DECIMAL(5, 2) NULL,
    `gstAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `status` ENUM('PAID', 'PARTIAL', 'PENDING') NOT NULL DEFAULT 'PENDING',
    `commitmentDate` DATETIME(3) NULL,
    `commitmentNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payment_commitments_membershipId_key`(`membershipId`),
    INDEX `payment_commitments_memberId_idx`(`memberId`),
    INDEX `payment_commitments_status_idx`(`status`),
    INDEX `payment_commitments_pendingAmount_idx`(`pendingAmount`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `payment_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `commitmentId` VARCHAR(191) NOT NULL,
    `receiptNumber` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `paymentMode` ENUM('CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'OTHER') NOT NULL,
    `paymentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` TEXT NULL,
    `recordedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `payment_transactions_receiptNumber_key`(`receiptNumber`),
    INDEX `payment_transactions_commitmentId_idx`(`commitmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `payment_reminders` (
    `id` VARCHAR(191) NOT NULL,
    `commitmentId` VARCHAR(191) NOT NULL,
    `remindAt` DATETIME(3) NOT NULL,
    `note` TEXT NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payment_reminders_commitmentId_idx`(`commitmentId`),
    INDEX `payment_reminders_remindAt_idx`(`remindAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `program_durations` ADD CONSTRAINT `program_durations_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `programs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `enquiries` ADD CONSTRAINT `enquiries_offeredProgramId_fkey` FOREIGN KEY (`offeredProgramId`) REFERENCES `programs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `enquiries` ADD CONSTRAINT `enquiries_offeredDiscountId_fkey` FOREIGN KEY (`offeredDiscountId`) REFERENCES `discount_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `enquiries` ADD CONSTRAINT `enquiries_offerCategoryId_fkey` FOREIGN KEY (`offerCategoryId`) REFERENCES `offer_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `enquiries` ADD CONSTRAINT `enquiries_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `enquiry_notes` ADD CONSTRAINT `enquiry_notes_enquiryId_fkey` FOREIGN KEY (`enquiryId`) REFERENCES `enquiries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `enquiry_notes` ADD CONSTRAINT `enquiry_notes_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `enquiry_status_history` ADD CONSTRAINT `enquiry_status_history_enquiryId_fkey` FOREIGN KEY (`enquiryId`) REFERENCES `enquiries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `enquiry_status_history` ADD CONSTRAINT `enquiry_status_history_changedById_fkey` FOREIGN KEY (`changedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `enquiry_reminders` ADD CONSTRAINT `enquiry_reminders_enquiryId_fkey` FOREIGN KEY (`enquiryId`) REFERENCES `enquiries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `enquiry_reminders` ADD CONSTRAINT `enquiry_reminders_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `members` ADD CONSTRAINT `members_sourceEnquiryId_fkey` FOREIGN KEY (`sourceEnquiryId`) REFERENCES `enquiries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `memberships` ADD CONSTRAINT `memberships_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `programs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_programDurationId_fkey` FOREIGN KEY (`programDurationId`) REFERENCES `program_durations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_trainerId_fkey` FOREIGN KEY (`trainerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_enquiryId_fkey` FOREIGN KEY (`enquiryId`) REFERENCES `enquiries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_membershipId_fkey` FOREIGN KEY (`membershipId`) REFERENCES `memberships`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_enrolledById_fkey` FOREIGN KEY (`enrolledById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `payment_commitments` ADD CONSTRAINT `payment_commitments_membershipId_fkey` FOREIGN KEY (`membershipId`) REFERENCES `memberships`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `payment_commitments` ADD CONSTRAINT `payment_commitments_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `payment_transactions` ADD CONSTRAINT `payment_transactions_commitmentId_fkey` FOREIGN KEY (`commitmentId`) REFERENCES `payment_commitments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `payment_transactions` ADD CONSTRAINT `payment_transactions_recordedById_fkey` FOREIGN KEY (`recordedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `payment_reminders` ADD CONSTRAINT `payment_reminders_commitmentId_fkey` FOREIGN KEY (`commitmentId`) REFERENCES `payment_commitments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `payment_reminders` ADD CONSTRAINT `payment_reminders_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
