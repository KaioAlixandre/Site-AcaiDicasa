-- Remove a constraint única que impede múltiplos itens do mesmo produto no carrinho
-- Este comando remove o índice único que impede ter múltiplos itens do mesmo produto no carrinho
-- IMPORTANTE: Se este comando falhar com erro de foreign key, você precisará executar manualmente:
-- ALTER TABLE `itens_carrinho` DROP INDEX `CartItem_cartId_productId_key`;

-- Verificar se o índice existe antes de tentar removê-lo
SELECT COUNT(*) INTO @index_count
FROM information_schema.statistics 
WHERE table_schema = DATABASE() 
AND table_name = 'itens_carrinho' 
AND index_name = 'CartItem_cartId_productId_key';

-- Se o índice existir, tentar removê-lo
-- Nota: Se houver erro de foreign key, será necessário verificar as dependências primeiro
SET @sql = IF(@index_count > 0,
    'ALTER TABLE `itens_carrinho` DROP INDEX `CartItem_cartId_productId_key`',
    'SELECT 1 as "Index does not exist"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

