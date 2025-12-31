-- Script para remover a constraint única do carrinho
-- Execute este comando diretamente no MySQL

USE acai_db;

-- Remover a constraint única que impede múltiplos itens do mesmo produto no carrinho
ALTER TABLE `itens_carrinho` DROP INDEX `CartItem_cartId_productId_key`;

