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

    // Construir lista de itens
    const itemsList = order.itens_pedido?.map(item => {
      const complementos = item.item_pedido_complementos?.map(ic => 
        ic.complemento?.nome
      ).filter(Boolean).join(', ');
      
      return `• ${item.quantidade}x ${item.produto?.nome || 'Produto'}${complementos ? ` (${complementos})` : ''}`;
    }).join('\n') || 'Itens não disponíveis';

    // Construir endereço da loja (pode vir de configurações)
    const storeAddress = "Rua da Loja, 123 - Centro"; // TODO: Pegar das configurações da loja

    const customerMessage = `

 Seu pedido #${order.id} está pronto para retirada!

 Retire em: ${storeAddress}
 Valor: R$ ${parseFloat(order.totalPrice || 0).toFixed(2)}
 Itens: ${itemsList}

 ${order.paymentMethod === 'CASH_ON_DELIVERY' ? 'Pagamento na retirada' : 'Pedido já pago'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
      deliverer: deliverer?.nome,
      itemsCount: order.orderItems?.length
    });

    // Construir lista de itens
    const itemsList = order.itens_pedido?.map(item => {
      const complementos = item.item_pedido_complementos?.map(ic => 
        ic.complemento?.nome
      ).filter(Boolean).join(', ');
      
      return `• ${item.quantidade}x ${item.produto?.nome || 'Produto'}${complementos ? ` (${complementos})` : ''}`;
    }).join('\n') || 'Itens não disponíveis';

    // Construir endereço
    const address = [
      order.shippingStreet,
      order.shippingNumber,
      order.shippingComplement,
      order.shippingNeighborhood
    ].filter(Boolean).join(', ');

    // Mensagem para o entregador
    const delivererMessage = `
📋 Pedido: #${order.id}

  Cliente: ${order.user?.username || 'N/A'}
  Telefone: ${order.user?.phone || order.shippingPhone || 'N/A'}
  📍Endereço: ${address || 'Endereço não informado'}
  Valor: R$ ${parseFloat(order.totalPrice || 0).toFixed(2)}
  Itens: ${itemsList}
━━━━━━━━━━━━━━━━━━━━
    `.trim();

    // Mensagem para o cliente
    const customerMessage = `
  Seu pedido #${order.id} está a caminho!

  Entregador: ${deliverer?.nome || 'N/A'}
  Contato: ${deliverer?.telefone || 'N/A'}
  📍 Endereço: ${address || 'Endereço não informado'}
  Valor: R$ ${parseFloat(order.totalPrice || 0).toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Obrigado pela preferência!
    `.trim();

    console.log('📱 Enviando notificações via Z-API...');
    console.log('📨 Para entregador:', deliverer?.nome || 'N/A', '(' + (deliverer?.telefone || 'N/A') + ')');
    console.log('📨 Para cliente:', order.user?.username || 'N/A', '(' + (order.user?.phone || order.shippingPhone || 'N/A') + ')');
    
    const results = {
      deliverer: { success: false },
      customer: { success: false }
    };

    // Enviar mensagem para o entregador
    if (deliverer?.telefone) {
      console.log('\n🚚 ENVIANDO MENSAGEM PARA ENTREGADOR:');
      console.log('📞 Telefone do entregador:', deliverer.telefone);
      console.log('📝 Mensagem:', delivererMessage);
      results.deliverer = await sendWhatsAppMessageZApi(deliverer.telefone, delivererMessage);
      console.log('📊 Resultado envio entregador:', JSON.stringify(results.deliverer, null, 2));
    } else {
      console.log('⚠️ Telefone do entregador não disponível');
      console.log('📋 Objeto deliverer:', JSON.stringify(deliverer, null, 2));
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
      precoTotal: order.precoTotal,
      usuario: order.usuario?.nomeUsuario,
      tipoEntrega: order.tipoEntrega
    });

    // Construir lista de itens
    const itemsList = order.itens_pedido?.map(item => {
      const complementos = item.complementos?.map(ic => 
        ic.complemento?.nome
      ).filter(Boolean).join(', ');
      return `• ${item.quantidade}x ${item.produto?.nome || 'Produto'}${complementos ? ` (${complementos})` : ''}`;
    }).join('\n') || 'Itens não disponíveis';

    const customerMessage = `
  Seu pagamento foi confirmado com sucesso!✅

  Pedido #${order.id}
  Valor: R$ ${parseFloat(order.precoTotal || 0).toFixed(2)}
  Itens: ${itemsList}

  Seu pedido já está em preparo!
${order.tipoEntrega === 'delivery' ? 
  `Será entregue em: ${order.ruaEntrega}, ${order.numeroEntrega}${order.complementoEntrega ? ` - ${order.complementoEntrega}` : ''} - ${order.bairroEntrega}` :
  ' Aguarde a notificação para retirada'
}

━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    console.log('📱 Enviando notificação de pagamento confirmado via Z-API...');
    // Buscar telefone do usuário (preferencial) ou telefone de entrega
    const customerPhone = order.usuario?.telefone || order.telefoneEntrega;
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

// Serviço para notificação de pedido em preparo para cozinheiro
const sendCookNotification = async (order, cook) => {
  try {
    console.log('👨‍🍳 [MessageService] Enviando notificação para cozinheiro');
    console.log('📋 [MessageService] Dados do pedido:', {
      id: order.id,
      totalPrice: order.totalPrice,
      cook: cook?.nome,
      itemsCount: order.itens_pedido?.length
    });

    // Construir lista de itens
    const itemsList = order.itens_pedido?.map(item => {
      const complementos = item.item_pedido_complementos?.map(ic => 
        ic.complemento?.nome
      ).filter(Boolean).join(', ');
      
      return `• ${item.quantidade}x ${item.produto?.nome || 'Produto'}${complementos ? ` (${complementos})` : ''}`;
    }).join('\n') || 'Itens não disponíveis';

    // Mensagem para o cozinheiro
    const cookMessage = `
 NOVO PEDIDO PARA PREPARAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Pedido: #${order.id}
 Cliente: ${order.usuario?.nomeUsuario || 'N/A'}
${order.tipoEntrega === 'delivery' ? '🚚 ENTREGA' : '🏪 RETIRADA NO LOCAL'}
💰 Valor: R$ ${parseFloat(order.precoTotal || 0).toFixed(2)}

🍽️ ITENS DO PEDIDO:
${itemsList}

${order.observacoes ? ` OBSERVAÇÕES DO CLIENTE:\n${order.observacoes}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    console.log('📱 Enviando notificação para cozinheiro via Z-API...');
    
    // Enviar mensagem para o cozinheiro
    if (cook?.telefone) {
      console.log('\n👨‍🍳 ENVIANDO MENSAGEM PARA COZINHEIRO:');
      console.log(cookMessage);
      const result = await sendWhatsAppMessageZApi(cook.telefone, cookMessage);
      
      if (result.success) {
        console.log('✅ Notificação para cozinheiro enviada com sucesso!');
      } else {
        console.log('❌ Falha ao enviar notificação para cozinheiro');
      }

      return {
        success: result.success,
        cookMessage,
        result
      };
    } else {
      console.log('⚠️ Telefone do cozinheiro não disponível');
      return {
        success: false,
        error: 'Telefone do cozinheiro não disponível'
      };
    }

  } catch (error) {
    console.error('❌ Erro ao enviar notificação para cozinheiro:', error);
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
  sendCookNotification,
  sendWhatsAppMessageZApi
};