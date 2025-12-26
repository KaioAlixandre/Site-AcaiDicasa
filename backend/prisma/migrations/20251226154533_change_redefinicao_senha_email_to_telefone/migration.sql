-- AlterTable
-- Alterar a coluna email para telefone na tabela redefinicoes_senha

-- Remover a coluna email (o índice será removido automaticamente)
ALTER TABLE `redefinicoes_senha` DROP COLUMN `email`;

-- Adicionar coluna telefone
ALTER TABLE `redefinicoes_senha` ADD COLUMN `telefone` VARCHAR(20) NOT NULL AFTER `id`;

-- Adicionar índice na nova coluna telefone
CREATE INDEX `redefinicoes_senha_telefone_idx` ON `redefinicoes_senha`(`telefone`);

