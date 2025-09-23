const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCustomAcaiPricing() {
  try {
    console.log('🧪 Testando preços do açaí personalizado...');
    
    // Buscar usuário para teste (pode ser qualquer um)
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ Nenhum usuário encontrado para teste');
      return;
    }
    
    // Buscar carrinho do usuário
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        cartitem: {
          include: {
            product: true
          }
        }
      }
    });
    
    if (!cart || cart.cartitem.length === 0) {
      console.log('🛒 Carrinho vazio ou não encontrado. Para testar:');
      console.log('1. Acesse o site no browser');
      console.log('2. Faça login');
      console.log('3. Adicione um açaí personalizado ao carrinho');
      console.log('4. Execute este script novamente');
      return;
    }
    
    console.log(`\n📋 Analisando carrinho do usuário: ${user.username}`);
    console.log(`📦 Total de itens no carrinho: ${cart.cartitem.length}\n`);
    
    let totalCalculadoCorreto = 0;
    
    cart.cartitem.forEach((item, index) => {
      console.log(`--- Item ${index + 1} ---`);
      console.log(`Produto: ${item.product.name}`);
      console.log(`Preço base do produto: R$ ${item.product.price}`);
      console.log(`Quantidade: ${item.quantity}`);
      
      let precoUsado = item.product.price;
      
      if (item.selectedOptions && item.selectedOptions.customAcai) {
        console.log(`🎨 AÇAÍ PERSONALIZADO DETECTADO!`);
        console.log(`Valor escolhido pelo usuário: R$ ${item.selectedOptions.customAcai.value}`);
        
        if (item.selectedOptions.customAcai.complementNames) {
          console.log(`Complementos: ${item.selectedOptions.customAcai.complementNames.join(', ')}`);
        }
        
        precoUsado = item.selectedOptions.customAcai.value;
        console.log(`✅ Usando valor personalizado: R$ ${precoUsado}`);
      } else {
        console.log(`📦 Produto normal - usando preço base`);
      }
      
      const totalItem = item.quantity * precoUsado;
      totalCalculadoCorreto += totalItem;
      
      console.log(`Total do item: ${item.quantity} x R$ ${precoUsado} = R$ ${totalItem.toFixed(2)}\n`);
    });
    
    console.log(`💰 TOTAL CALCULADO CORRETAMENTE: R$ ${totalCalculadoCorreto.toFixed(2)}`);
    
    // Verificar o que a API retorna
    console.log('\n🔍 Testando API do carrinho...');
    
    // Simular cálculo da API
    const cartItemsWithTotals = cart.cartitem.map(item => {
      let itemPrice = item.product.price;
      
      if (item.selectedOptions && item.selectedOptions.customAcai) {
        itemPrice = item.selectedOptions.customAcai.value;
      }
      
      return {
        ...item,
        totalPrice: item.quantity * itemPrice
      };
    });
    
    const cartTotal = cartItemsWithTotals.reduce((total, item) => total + item.totalPrice, 0);
    
    console.log(`📊 Total calculado pela API: R$ ${cartTotal.toFixed(2)}`);
    
    if (Math.abs(cartTotal - totalCalculadoCorreto) < 0.01) {
      console.log('✅ SUCESSO! Os valores estão corretos!');
    } else {
      console.log('❌ ERRO! Há diferença nos cálculos!');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCustomAcaiPricing();