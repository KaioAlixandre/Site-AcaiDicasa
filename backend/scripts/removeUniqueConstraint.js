const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeUniqueConstraint() {
  try {
    console.log('🔄 Tentando remover a constraint única...');
    
    // Executar SQL diretamente para remover o índice único
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`itens_carrinho\` DROP INDEX \`CartItem_cartId_productId_key\`
    `);
    
    console.log('✅ Constraint única removida com sucesso!');
  } catch (error) {
    if (error.message.includes('does not exist') || error.message.includes('Unknown key')) {
      console.log('ℹ️ A constraint já não existe no banco de dados.');
    } else {
      console.error('❌ Erro ao remover constraint:', error.message);
      console.error('💡 Tente executar manualmente no MySQL:');
      console.error('   ALTER TABLE `itens_carrinho` DROP INDEX `CartItem_cartId_productId_key`;');
    }
  } finally {
    await prisma.$disconnect();
  }
}

removeUniqueConstraint();

