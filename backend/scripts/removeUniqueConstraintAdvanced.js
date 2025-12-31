const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeUniqueConstraintAdvanced() {
  try {
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
    console.error('💡 Você pode precisar executar manualmente no MySQL:');
    console.error('   1. ALTER TABLE `itens_carrinho` DROP FOREIGN KEY `CartItem_cartId_fkey`;');
    console.error('   2. ALTER TABLE `itens_carrinho` DROP INDEX `CartItem_cartId_productId_key`;');
    console.error('   3. ALTER TABLE `itens_carrinho` ADD CONSTRAINT `CartItem_cartId_fkey` FOREIGN KEY (`carrinhoId`) REFERENCES `carrinhos`(`id`) ON DELETE CASCADE;');
  } finally {
    await prisma.$disconnect();
  }
}

removeUniqueConstraintAdvanced();

