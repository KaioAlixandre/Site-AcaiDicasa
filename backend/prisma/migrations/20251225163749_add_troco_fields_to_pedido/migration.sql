-- AlterTable
ALTER TABLE `pedidos` ADD COLUMN `precisaTroco` BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN `valorTroco` DECIMAL(10, 2) NULL;

