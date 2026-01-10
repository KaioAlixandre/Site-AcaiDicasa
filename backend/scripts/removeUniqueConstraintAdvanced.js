// Carregar variáveis de ambiente
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeUniqueConstraintAdvanced() {
  try {
    // Verificar conexão com o banco de dados
    console.log('🔌 Verificando conexão com o banco de dados...');
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados com sucesso!');
    
    console.log('🔄 Removendo foreign key temporariamente...');
    
    // Passo 1: Remover a foreign key (se existir)
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`itens_carrinho\` 
        DROP FOREIGN KEY \`CartItem_cartId_fkey\`
      `);
      console.log('✅ Foreign key removida temporariamente.');
    } catch (error) {
      if (error.message.includes('does not exist') || error.message.includes('Unknown key')) {
        console.log('ℹ️ Foreign key não encontrada ou já removida.');
      } else {
        throw error;
      }
    }
    
    // Passo 2: Remover o índice único
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`itens_carrinho\` 
        DROP INDEX \`CartItem_cartId_productId_key\`
      `);
      console.log('✅ Índice único removido com sucesso!');
    } catch (error) {
      if (error.message.includes('does not exist') || error.message.includes('Unknown key')) {
        console.log('ℹ️ Índice único não encontrado ou já removido.');
      } else {
        throw error;
      }
    }
    
    // Passo 3: Recriar a foreign key
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`itens_carrinho\` 
        ADD CONSTRAINT \`CartItem_cartId_fkey\` 
        FOREIGN KEY (\`carrinhoId\`) 
        REFERENCES \`carrinhos\`(\`id\`) 
        ON DELETE CASCADE
      `);
      console.log('✅ Foreign key recriada com sucesso!');
    } catch (error) {
      if (error.message.includes('Duplicate key') || error.message.includes('already exists')) {
        console.log('ℹ️ Foreign key já existe.');
      } else {
        throw error;
      }
    }
    
    console.log('✅ Processo concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao remover constraint:', error.message);
    
    // Verificar se é erro de conexão ou autenticação
    if (error.message.includes('Can\'t reach database') || 
        error.message.includes('P1001') ||
        error.message.includes('connection')) {
      console.error('💡 Erro de conexão com o banco de dados.');
      console.error('   Verifique se:');
      console.error('   - A variável DATABASE_URL está configurada no arquivo .env');
      console.error('   - O banco de dados está acessível');
      console.error('   - As credenciais estão corretas');
    } else if (error.message.includes('Authentication failed') || 
               error.message.includes('not valid') ||
               error.message.includes('Access denied')) {
      console.error('💡 Erro de autenticação - Credenciais do banco de dados incorretas!');
      console.error('   Verifique o arquivo .env e atualize a DATABASE_URL:');
      console.error('   DATABASE_URL="mysql://usuario:senha@host:porta/nome_banco"');
      console.error('');
      console.error('   Exemplo:');
      console.error('   DATABASE_URL="mysql://root:SUA_SENHA_AQUI@localhost:3306/acai_db"');
      console.error('');
      console.error('   No servidor, edite o arquivo:');
      console.error('   nano .env');
      console.error('   ou');
      console.error('   vi .env');
    } else {
      console.error('💡 Você pode precisar executar manualmente no MySQL:');
      console.error('   1. ALTER TABLE `itens_carrinho` DROP FOREIGN KEY `CartItem_cartId_fkey`;');
      console.error('   2. ALTER TABLE `itens_carrinho` DROP INDEX `CartItem_cartId_productId_key`;');
      console.error('   3. ALTER TABLE `itens_carrinho` ADD CONSTRAINT `CartItem_cartId_fkey` FOREIGN KEY (`carrinhoId`) REFERENCES `carrinhos`(`id`) ON DELETE CASCADE;');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

removeUniqueConstraintAdvanced();

