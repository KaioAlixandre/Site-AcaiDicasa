const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createCustomIceCreamProduct() {
  try {
    console.log('🍦 Criando produto sorvete personalizado...');
    
    // Verificar se já existe
    const existing = await prisma.product.findFirst({
      where: { name: 'Sorvete Personalizado' }
    });
    
    if (existing) {
      console.log('✅ Produto sorvete personalizado já existe:', existing);
      return existing;
    }
    
    // Buscar ou criar categoria "Sorvetes"
    let category = await prisma.productcategory.findFirst({
      where: { name: 'Sorvetes' }
    });
    
    if (!category) {
      category = await prisma.productcategory.create({
        data: { name: 'Sorvetes' }
      });
      console.log('✅ Categoria Sorvetes criada:', category);
    }
    
    // Criar o produto sorvete personalizado
    const customIceCream = await prisma.product.create({
      data: {
        name: 'Sorvete Personalizado',
        price: 6.00, // Preço base menor que açaí
        description: 'Monte seu sorvete ideal! Escolha o valor e todos os complementos que desejar.',
        categoryId: category.id,
        isActive: true
      }
    });
    
    console.log('✅ Produto sorvete personalizado criado com sucesso!');
    console.log('📋 Detalhes:', customIceCream);
    
    // Listar todos os complementos disponíveis (os mesmos do açaí)
    const allComplements = await prisma.complement.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    
    console.log(`\n📋 Total de complementos disponíveis: ${allComplements.length}`);
    console.log('🍓🍦 Para açaí e sorvete: ', allComplements.map(c => c.name).join(', '));
    
    return customIceCream;
    
  } catch (error) {
    console.error('❌ Erro ao criar produto sorvete personalizado:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createCustomIceCreamProduct();