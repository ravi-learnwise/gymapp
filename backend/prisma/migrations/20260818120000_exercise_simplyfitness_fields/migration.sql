-- Exercise metadata fields for SimplyFitness import

ALTER TABLE `exercises` ADD COLUMN `slug` VARCHAR(191) NULL;
ALTER TABLE `exercises` ADD COLUMN `bodyPart` VARCHAR(191) NULL;
ALTER TABLE `exercises` ADD COLUMN `primaryMuscle` VARCHAR(191) NULL;
ALTER TABLE `exercises` ADD COLUMN `secondaryMuscles` TEXT NULL;
ALTER TABLE `exercises` ADD COLUMN `sourceUrl` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `exercises_slug_key` ON `exercises`(`slug`);
CREATE INDEX `exercises_bodyPart_idx` ON `exercises`(`bodyPart`);
