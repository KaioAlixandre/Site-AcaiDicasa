// Serviço para envio de mensagens (WhatsApp/SMS)

const sendDeliveryNotifications = async (order, deliverer) => {
  try {
    console.log('📱 [MessageService] Iniciando envio de notificações');
    console.log('📋 [MessageService] Dados do pedido:', {
      id: order.id,
      totalPrice: order.totalPrice,
      user: order.user?.username,
      deliverer: deliverer?.name,
      itemsCount: order.orderItems?.length
    });

    // Construir endereço
    const address = [
      order.shippingStreet,
      order.shippingNumber,
      order.shippingComplement,
      order.shippingNeighborhood
    ].filter(Boolean).join(', ');

    // Mensagem para o entregador
    const delivererMessage = `
🚚 NOVA ENTREGA ATRIBUÍDA
━━━━━━━━━━━━━━━━━━━━━━
📋 Pedido: #${order.id}
👤 Cliente: ${order.user?.username || 'N/A'}
📞 Telefone: ${order.user?.phone || order.shippingPhone || 'N/A'}
📍 Endereço: ${address || 'Endereço não informado'}
💰 Valor: R$ ${parseFloat(order.totalPrice || 0).toFixed(2)}
🍽️ Itens: ${order.orderItems?.map(item => `${item.quantity}x ${item.product?.name || 'Produto'}`).join(', ') || 'Itens não disponíveis'}
━━━━━━━━━━━━━━━━━━━━━━
⏰ Prepare-se para a entrega!
    `.trim();

    // Mensagem para o cliente
    const customerMessage = `
🍋 AÇAÍ DA CASA - Pedido Saiu Para Entrega! 🚚
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Seu pedido #${order.id} está a caminho!

🚚 Entregador: ${deliverer?.name || 'N/A'}
📞 Contato: ${deliverer?.phone || 'N/A'}
📍 Endereço: ${address || 'Endereço não informado'}
💰 Valor: R$ ${parseFloat(order.totalPrice || 0).toFixed(2)}

⏱️ Tempo estimado: 30-45 minutos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Obrigado pela preferência! 🍋✨
    `.trim();

    console.log('📱 Enviando notificações...');
    console.log('📨 Para entregador:', deliverer?.name || 'N/A', '(' + (deliverer?.phone || 'N/A') + ')');
    console.log('📨 Para cliente:', order.user?.username || 'N/A', '(' + (order.user?.phone || 'N/A') + ')');
    
    // TODO: Implementar integração real com WhatsApp API ou SMS
    // Por enquanto, apenas loga as mensagens
    console.log('\n🚚 MENSAGEM PARA ENTREGADOR:');
    console.log(delivererMessage);
    console.log('\n👤 MENSAGEM PARA CLIENTE:');
    console.log(customerMessage);
    console.log('\n✅ Notificações "enviadas" com sucesso!');

    return {
      success: true,
      delivererMessage,
      customerMessage
    };

  } catch (error) {
    console.error('❌ Erro ao enviar notificações:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendDeliveryNotifications
};