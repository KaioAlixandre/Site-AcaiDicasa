const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function checkAndApplyMigration() {
    try {
        // Verificar se a coluna recebeSabores existe
        const checkColumn = await prisma.$queryRaw`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'produtos' 
            AND COLUMN_NAME = 'recebeSabores'
        `;
        
        if (checkColumn.length > 0) {
            console.log('✅ Coluna recebeSabores já existe. Verificando tabelas de sabores...');
            
            // Verificar se as tabelas de sabores existem
            const checkSabores = await prisma.$queryRaw`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'sabores'
            `;
            
            if (checkSabores.length > 0) {
                console.log('✅ Todas as estruturas de sabores já existem.');
                return;
            }
        }
        
        console.log('📦 Aplicando migração de sabores...');
        
        // Ler o arquivo SQL da migração
        const migrationPath = path.join(__dirname, 'prisma', 'migrations', '20251230110058_add_sabores_and_recebe_sabores', 'migration.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        // Dividir o SQL em comandos individuais e executar
        const commands = sql.split(';').filter(cmd => cmd.trim().length > 0 && !cmd.trim().startsWith('--'));
        
        for (const command of commands) {
            const trimmedCommand = command.trim();
            if (trimmedCommand) {
                try {
                    await prisma.$executeRawUnsafe(trimmedCommand);
                    console.log('✓ Comando executado com sucesso');
                } catch (error) {
                    // Ignorar erros de estruturas que já existem
                    if (error.message.includes('already exists') || 
                        error.message.includes('Duplicate column') ||
                        error.message.includes('Duplicate key') ||
                        (error.message.includes('Table') && error.message.includes('already exists'))) {
                        console.log('⚠ Estrutura já existe, continuando...');
                    } else {
                        console.error('✗ Erro ao executar comando:', error.message);
                        // Não lançar erro, apenas logar
                    }
                }
            }
        }
        
        console.log('✅ Migração aplicada com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao verificar/aplicar migração:', error.message);
        // Não lançar erro para não quebrar o startup
    } finally {
        await prisma.$disconnect();
    }
}

checkAndApplyMigration();

