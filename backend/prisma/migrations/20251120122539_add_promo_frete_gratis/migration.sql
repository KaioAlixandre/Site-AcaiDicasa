-- AlterTable
ALTER TABLE `configuracoes_loja` ADD COLUMN `promocaoDias` VARCHAR(20) NULL,
    ADD COLUMN `promocaoTaxaAtiva` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `promocaoValorMinimo` DECIMAL(10, 2) NULL;
