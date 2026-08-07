-- Pre-module improvements: enquiry duration, flat discount

ALTER TABLE `enquiries` ADD COLUMN `offeredProgramDurationId` VARCHAR(191) NULL;
ALTER TABLE `enquiries` ADD COLUMN `offeredFlatDiscount` DECIMAL(10, 2) NULL;

ALTER TABLE `enquiries` ADD CONSTRAINT `enquiries_offeredProgramDurationId_fkey` FOREIGN KEY (`offeredProgramDurationId`) REFERENCES `program_durations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX `enquiries_offeredProgramDurationId_idx` ON `enquiries`(`offeredProgramDurationId`);
