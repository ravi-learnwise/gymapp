-- AlterTable
ALTER TABLE `members` ADD COLUMN `firebaseUid` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `members_firebaseUid_key` ON `members`(`firebaseUid`);
CREATE INDEX `members_email_idx` ON `members`(`email`);

-- AlterTable
ALTER TABLE `attendance_records` ADD COLUMN `source` ENUM('STAFF', 'MEMBER') NOT NULL DEFAULT 'STAFF';
ALTER TABLE `attendance_records` DROP FOREIGN KEY `attendance_records_recordedById_fkey`;
ALTER TABLE `attendance_records` MODIFY `recordedById` VARCHAR(191) NULL;
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_recordedById_fkey` FOREIGN KEY (`recordedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
