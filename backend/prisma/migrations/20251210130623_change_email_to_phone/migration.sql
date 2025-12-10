-- Primeiro, atualizar registros com telefone NULL
UPDATE `usuarios` 
SET `telefone` = CONCAT('TEMP_', LPAD(id, 10, '0'))
WHERE `telefone` IS NULL;

-- Tornar email opcional e telefone obrigatório
ALTER TABLE `usuarios` MODIFY `email` VARCHAR(100) NULL;
ALTER TABLE `usuarios` MODIFY `telefone` VARCHAR(20) NOT NULL;

-- Criar índice único para telefone
CREATE UNIQUE INDEX `User_telefone_key` ON `usuarios`(`telefone`);
