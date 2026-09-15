-- CreateTable
-- IF NOT EXISTS: baseline 20260723000000 already creates this table on fresh databases.
CREATE TABLE IF NOT EXISTS `_schema_version` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `version` VARCHAR(191) NOT NULL DEFAULT 'phase-0',
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
