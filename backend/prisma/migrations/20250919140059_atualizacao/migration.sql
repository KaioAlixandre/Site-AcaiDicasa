-- CreateTable
CREATE TABLE `StoreConfig` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `isOpen` BOOLEAN NOT NULL DEFAULT true,
    `openingTime` VARCHAR(5) NOT NULL,
    `closingTime` VARCHAR(5) NOT NULL,
    `openDays` VARCHAR(20) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
