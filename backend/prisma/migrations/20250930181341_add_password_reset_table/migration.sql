/*
  Warnings:

  - You are about to drop the column `price` on the `complement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `complement` DROP COLUMN `price`;

-- CreateTable
CREATE TABLE `passwordreset` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `code` VARCHAR(6) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,

    INDEX `passwordreset_email_idx`(`email`),
    INDEX `passwordreset_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
