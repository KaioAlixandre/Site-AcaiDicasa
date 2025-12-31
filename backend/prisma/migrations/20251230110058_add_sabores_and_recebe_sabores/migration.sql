-- AlterTable
ALTER TABLE `produtos` ADD COLUMN `recebeSabores` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `sabores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `imagemUrl` VARCHAR(255) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `categoriaId` INTEGER NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    INDEX `Flavor_categoryId_fkey`(`categoriaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categorias_sabor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FlavorCategory_name_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `produto_categoria_sabor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `produtoId` INTEGER NOT NULL,
    `categoriaSaborId` INTEGER NOT NULL,
    `quantidade` INTEGER NOT NULL DEFAULT 1,

    INDEX `ProductFlavorCategory_productId_fkey`(`produtoId`),
    INDEX `ProductFlavorCategory_categoriaSaborId_fkey`(`categoriaSaborId`),
    UNIQUE INDEX `ProductFlavorCategory_productId_categoriaSaborId_key`(`produtoId`, `categoriaSaborId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sabores` ADD CONSTRAINT `Flavor_categoryId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `categorias_sabor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `produto_categoria_sabor` ADD CONSTRAINT `ProductFlavorCategory_productId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `produtos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `produto_categoria_sabor` ADD CONSTRAINT `ProductFlavorCategory_categoriaSaborId_fkey` FOREIGN KEY (`categoriaSaborId`) REFERENCES `categorias_sabor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

