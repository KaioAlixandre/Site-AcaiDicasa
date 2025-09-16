/*
  Warnings:

  - You are about to drop the column `shippingCity` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `shippingState` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `shippingZipCode` on the `order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `order` DROP COLUMN `shippingCity`,
    DROP COLUMN `shippingState`,
    DROP COLUMN `shippingZipCode`;
