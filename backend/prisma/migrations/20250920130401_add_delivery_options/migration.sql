-- AlterTable
ALTER TABLE `order` ADD COLUMN `deliveryFee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `deliveryType` VARCHAR(191) NOT NULL DEFAULT 'delivery',
    MODIFY `shippingNeighborhood` VARCHAR(191) NULL,
    MODIFY `shippingNumber` VARCHAR(191) NULL,
    MODIFY `shippingStreet` VARCHAR(191) NULL;
