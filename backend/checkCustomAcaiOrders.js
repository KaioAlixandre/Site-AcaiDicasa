const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCustomAcaiOrders() {
  try {
    console.log('🔍 Verificando pedidos com açaí personalizado...');
    
    // Buscar pedidos que podem ter açaí personalizado
    const orders = await prisma.order.findMany({
      include: {
        orderitem: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Últimos 20 pedidos
    });
    
    console.log(`📋 Encontrados ${orders.length} pedidos para análise\n`);
    
    let customAcaiCount = 0;
    
    for (const order of orders) {
      const hasCustomAcai = order.orderitem.some(item => 
        item.selectedOptionsSnapshot?.customAcai
      );
      
      if (hasCustomAcai) {
        customAcaiCount++;
        console.log(`--- Pedido #${order.id} (${order.user?.username}) ---`);
        console.log(`Data: ${new Date(order.createdAt).toLocaleString('pt-BR')}`);
        console.log(`Status: ${order.status}`);
        console.log(`Total: R$ ${Number(order.totalPrice).toFixed(2)}\n`);
        
        order.orderitem.forEach((item, index) => {
          if (item.selectedOptionsSnapshot?.customAcai) {
            const customData = item.selectedOptionsSnapshot.customAcai;
            console.log(`  🎨 Item ${index + 1}: ${item.product.name}`);
            console.log(`     Quantidade: ${item.quantity}`);
            console.log(`     Valor personalizado: R$ ${Number(customData.value).toFixed(2)}`);
            console.log(`     Preço no pedido: R$ ${Number(item.priceAtOrder).toFixed(2)}`);
            
            if (customData.complementNames && customData.complementNames.length > 0) {
              console.log(`     Complementos: ${customData.complementNames.join(', ')}`);
            } else {
              console.log(`     Complementos: Nenhum`);
            }
            console.log('');
          }
        });
      }
    }
    
    if (customAcaiCount === 0) {
      console.log('❌ Nenhum pedido com açaí personalizado encontrado.');
      console.log('\n💡 Para testar a exibição dos complementos:');
      console.log('1. Acesse o site e faça login');
      console.log('2. Adicione um açaí personalizado ao carrinho');
      console.log('3. Finalize o pedido');
      console.log('4. Verifique na aba "Pedidos" (cliente) e "Pedidos" (admin)');
    } else {
      console.log(`✅ Encontrados ${customAcaiCount} pedidos com açaí personalizado!`);
      console.log('\n🎯 Agora você pode:');
      console.log('- Ver os pedidos na página do cliente: /orders');
      console.log('- Ver os pedidos no painel admin: /admin (aba Pedidos)');
      console.log('- Os complementos aparecerão listados com badges verdes 🍓');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCustomAcaiOrders();