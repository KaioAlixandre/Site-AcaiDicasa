// Serviço para envio de mensagens (WhatsApp/SMS)
const axios = require('axios');

// Função para enviar mensagem via WhatsApp usando a Z-API
async function sendWhatsAppMessageZApi(phone, message) {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const zapApiToken = process.env.zapApiToken; // SEU TOKEN
    const zapApiInstance = process.env.zapApiInstance; // SUA INSTANCIA
    const zapApiClientToken = process.env.zapApiClientToken; // Token do cliente
    const zapApiUrl = `https://api.z-api.io/instances/${zapApiInstance}/token/${zapApiToken}/send-text`;

    console.log(`📱 [Z-API] Enviando mensagem para: 55${cleanPhone}`);

    const response = await axios.post(
      zapApiUrl,
      {
        phone: `55${cleanPhone}`,
        message
      },
      {
        headers: {
          'client-token': zapApiClientToken
        }
      }
    );

    console.log('✅ [Z-API] Mensagem enviada com sucesso:', response.status);
    return { success: true, response: response.data };
  } catch (error) {
    console.error('❌ [Z-API] Erro ao enviar mensagem:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

// Serviço para notificação de pedido pronto para retirada
const sendPickupNotification = async (order) => {
  try {
    console.log('🏪 [MessageService] Enviando notificação de retirada');
    console.log('📋 [MessageService] Dados do pedido:', {
      id: order.id,
      totalPrice: order.totalPrice,
      user: order.user?.username,
      deliveryType: order.deliveryType
    });

    // Construir endereço da loja (pode vir de configurações)
    const storeAddress = "Rua da Loja, 123 - Centro"; // TODO: Pegar das configurações da loja

    const customerMessage = `
🍋 AÇAÍ DA CASA - Pedido Pronto para Retirada! 🏪
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Seu pedido #${order.id} está pronto!

📍 Retire em: ${storeAddress}
💰 Valor: R$ ${parseFloat(order.totalPrice || 0).toFixed(2)}
🍽️ Itens: ${order.orderItems?.map(item => `${item.quantity}x ${item.product?.name || 'Produto'}`).join(', ') || 'Itens não disponíveis'}

⏰ Horário de funcionamento: 8h às 18h
💵 ${order.paymentMethod === 'CASH_ON_DELIVERY' ? 'Pagamento na retirada' : 'Pedido já pago'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 Dúvidas? Entre em contato conosco!
Obrigado pela preferência! 🍋✨
    `.trim();

    console.log('📱 Enviando notificação de retirada via Z-API...');
    
    // Enviar mensagem para o cliente
    const customerPhone = order.user?.phone || order.shippingPhone;
    if (customerPhone) {
      console.log('\n🏪 ENVIANDO NOTIFICAÇÃO DE RETIRADA:');
      console.log(customerMessage);
      const result = await sendWhatsAppMessageZApi(customerPhone, customerMessage);
      
      if (result.success) {
        console.log('✅ Notificação de retirada enviada com sucesso!');
      } else {
        console.log('❌ Falha ao enviar notificação de retirada');
      }

      return {
        success: result.success,
        customerMessage,
        result
      };
    } else {
      console.log('⚠️ Telefone do cliente não disponível para notificação de retirada');
      return {
        success: false,
        error: 'Telefone do cliente não disponível'
      };
    }

  } catch (error) {
    console.error('❌ Erro ao enviar notificação de retirada:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

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

    console.log('📱 Enviando notificações via Z-API...');
    console.log('📨 Para entregador:', deliverer?.name || 'N/A', '(' + (deliverer?.phone || 'N/A') + ')');
    console.log('📨 Para cliente:', order.user?.username || 'N/A', '(' + (order.user?.phone || order.shippingPhone || 'N/A') + ')');
    
    const results = {
      deliverer: { success: false },
      customer: { success: false }
    };

    // Enviar mensagem para o entregador
    if (deliverer?.phone) {
      console.log('\n🚚 ENVIANDO MENSAGEM PARA ENTREGADOR:');
      console.log(delivererMessage);
      results.deliverer = await sendWhatsAppMessageZApi(deliverer.phone, delivererMessage);
    } else {
      console.log('⚠️ Telefone do entregador não disponível');
    }

    // Enviar mensagem para o cliente
    const customerPhone = order.user?.phone || order.shippingPhone;
    if (customerPhone) {
      console.log('\n👤 ENVIANDO MENSAGEM PARA CLIENTE:');
      console.log(customerMessage);
      results.customer = await sendWhatsAppMessageZApi(customerPhone, customerMessage);
    } else {
      console.log('⚠️ Telefone do cliente não disponível');
    }

    // Log dos resultados
    if (results.deliverer.success) {
      console.log('✅ Mensagem para entregador enviada com sucesso!');
    } else {
      console.log('❌ Falha ao enviar mensagem para entregador');
    }

    if (results.customer.success) {
      console.log('✅ Mensagem para cliente enviada com sucesso!');
    } else {
      console.log('❌ Falha ao enviar mensagem para cliente');
    }

    return {
      success: results.deliverer.success || results.customer.success,
      delivererMessage,
      customerMessage,
      results
    };

  } catch (error) {
    console.error('❌ Erro ao enviar notificações:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Serviço para notificação de pagamento confirmado (PIX)
const sendPaymentConfirmationNotification = async (order) => {
  try {
    console.log('💳 [MessageService] Enviando notificação de pagamento confirmado');
    console.log('📋 [MessageService] Dados do pedido:', {
      id: order.id,
      totalPrice: order.totalPrice,
      user: order.user?.username,
      deliveryType: order.deliveryType
    });

    const customerMessage = `
🍋 AÇAÍ DA CASA - Pagamento Confirmado! ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Seu PIX foi confirmado com sucesso!

📋 Pedido #${order.id}
💰 Valor: R$ ${parseFloat(order.totalPrice || 0).toFixed(2)}
🍽️ Itens: ${order.orderitem?.map(item => `${item.quantity}x ${item.product?.name || 'Produto'}`).join(', ') || 'Itens não disponíveis'}

👨‍🍳 Seu pedido já está em preparo!
${order.deliveryType === 'delivery' ? 
  `🚚 Será entregue em: ${order.shippingStreet}, ${order.shippingNumber}${order.shippingComplement ? ` - ${order.shippingComplement}` : ''} - ${order.shippingNeighborhood}` :
  '🏪 Aguarde a notificação para retirada'
}

⏰ Tempo estimado: 30-45 minutos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 Dúvidas? Entre em contato conosco!
Obrigado pela preferência! 🍋✨
    `.trim();

    console.log('📱 Enviando notificação de pagamento confirmado via Z-API...');
    
    // Enviar mensagem para o cliente
    const customerPhone = order.user?.phone || order.shippingPhone;
    if (customerPhone) {
      console.log('\n💳 ENVIANDO NOTIFICAÇÃO DE PAGAMENTO CONFIRMADO:');
      console.log(customerMessage);
      const result = await sendWhatsAppMessageZApi(customerPhone, customerMessage);
      
      if (result.success) {
        console.log('✅ Notificação de pagamento confirmado enviada com sucesso!');
      } else {
        console.log('❌ Falha ao enviar notificação de pagamento confirmado');
      }

      return {
        success: result.success,
        customerMessage,
        result
      };
    } else {
      console.log('⚠️ Telefone do cliente não disponível para notificação de pagamento');
      return {
        success: false,
        error: 'Telefone do cliente não disponível'
      };
    }

  } catch (error) {
    console.error('❌ Erro ao enviar notificação de pagamento confirmado:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendDeliveryNotifications,
  sendPickupNotification,
  sendPaymentConfirmationNotification,
  sendWhatsAppMessageZApi
};