/*
  Warnings:

  - You are about to drop the column `category` on the `complement` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `complement` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `complement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `complement` DROP COLUMN `category`,
    DROP COLUMN `description`,
    DROP COLUMN `price`;
