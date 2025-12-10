-- Corrigir constraint do email para permitir NULL
ALTER TABLE `usuarios` MODIFY `email` VARCHAR(100) NULL;

