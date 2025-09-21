const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken, authorize } = require('./authRoutes');
const { sendDeliveryNotifications, sendPickupNotification } = require('../services/messageService');
const axios = require('axios');

// Função para enviar mensagem via WhatsApp usando a Z-API (com client-token no header)
async function sendWhatsAppMessageZApi(phone, message) {
  const cleanPhone = phone.replace(/\D/g, '');
  const zapApiToken = process.env.zapApiToken // SEU TOKEN
  const zapApiInstance = process.env.zapApiInstance // SUA INSTANCIA
  const zapApiClientToken = process.env.zapApiClientToken// Usando o token como client-token
  const zapApiUrl = `https://api.z-api.io/instances/${zapApiInstance}/token/${zapApiToken}/send-text`;

  await axios.post(
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
}

// Rota para criar um pedido a partir do carrinho
router.post('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { paymentMethod, deliveryType = 'delivery', deliveryFee = 0 } = req.body;
    if (!paymentMethod) {
        return res.status(400).json({ message: 'Forma de pagamento não informada.' });
    }
    console.log(`[POST /api/orders] Recebida requisição para criar um pedido. Usuário ID: ${userId}, Tipo: ${deliveryType}`);

    try {
        // Encontrar o carrinho e o usuário com seus endereços em uma única busca
        const [cart, user] = await Promise.all([
            prisma.cart.findUnique({
                where: { userId: userId },
                include: {
                    cartitem: {
                        include: {
                            product: true
                        }
                    }
                }
            }),
            prisma.user.findUnique({
                where: { id: userId },
                include: {
                    address: true
                }
            })
        ]);

        if (!cart || cart.cartitem.length === 0) {
            console.warn(`[POST /api/orders] Carrinho do usuário ${userId} está vazio.`);
            return res.status(400).json({ message: 'Carrinho vazio. Adicione itens antes de criar um pedido.' });
        }

        // Para entrega, verificar se tem endereço
        let shippingAddress = null;
        if (deliveryType === 'delivery') {
            shippingAddress = user.address.find(addr => addr.isDefault) || user.address[0];
            
            if (!shippingAddress) {
                console.warn(`[POST /api/orders] Usuário ${userId} não possui endereço de entrega cadastrado.`);
                return res.status(400).json({
                    message: 'Nenhum endereço de entrega encontrado. Por favor, cadastre um para continuar.',
                    redirectPath: '/api/auth/profile/address'
                });
            }
        }
        
        // Calcular o preço total do pedido (incluindo taxa de entrega)
        const subtotalPrice = cart.cartitem.reduce((acc, item) => {
            return acc + (item.quantity * item.product.price);
        }, 0);
        
        const totalPrice = subtotalPrice + (deliveryType === 'delivery' ? deliveryFee : 0);

        console.log(`[POST /api/orders] Criando pedido para o usuário ${userId} com preço total de ${totalPrice.toFixed(2)} (${deliveryType}).`);

        // Iniciar uma transação para garantir que tudo seja feito ou nada seja feito
        const newOrder = await prisma.$transaction(async (tx) => {
            // 1. Criar o pedido, incluindo o telefone e o endereço de entrega
            // Se for cartão de crédito ou dinheiro na entrega, já inicia como "being_prepared", senão "pending_payment"
            const initialStatus = (paymentMethod === 'CREDIT_CARD' || paymentMethod === 'CASH_ON_DELIVERY') ? 'being_prepared' : 'pending_payment';
            
            const order = await tx.order.create({
                data: {
                    userId: userId,
                    totalPrice: totalPrice,
                    status: initialStatus,
                    deliveryType: deliveryType,
                    deliveryFee: deliveryType === 'delivery' ? deliveryFee : 0,
                    updatedAt: new Date(),
                    shippingStreet: shippingAddress?.street || null,
                    shippingNumber: shippingAddress?.number || null,
                    shippingComplement: shippingAddress?.complement || null,
                    shippingNeighborhood: shippingAddress?.neighborhood || null,
                    orderitem: {
                        createMany: {
                            data: cart.cartitem.map(item => ({
                                productId: item.productId,
                                quantity: item.quantity,
                                priceAtOrder: item.product.price,
                            }))
                        }
                    }
                },
                include: {
                    orderitem: true
                }
            });

            // 2. Esvaziar o carrinho do usuário
            await tx.cartitem.deleteMany({
                where: { cartId: cart.id }
            });

            return order;
        });

        console.log(`[POST /api/orders] Pedido ID ${newOrder.id} criado com sucesso para o usuário ${userId}.`);
        
        // Enviar mensagem via WhatsApp para PIX, Cartão de Crédito ou Dinheiro na Entrega
        const userData = await prisma.user.findUnique({ where: { id: req.user.id } });

        if ((paymentMethod === 'PIX' || paymentMethod === 'CREDIT_CARD' || paymentMethod === 'CASH_ON_DELIVERY') && userData.phone) {
            const itens = cart.cartitem.map(item =>
                `• ${item.product.name} x ${item.quantity}`
            ).join('\n');
            
            // Informações de entrega/retirada
            const deliveryInfo = deliveryType === 'pickup' 
                ? `📍 *Retirada no local*\n🏪 Endereço da loja: [SEU ENDEREÇO AQUI]\n⏰ Horário: Segunda a Domingo, 8h às 22h`
                : `🚚 *Entrega em casa*\n📍 Endereço: ${shippingAddress.street}, ${shippingAddress.number}${shippingAddress.complement ? ` - ${shippingAddress.complement}` : ''}\n🏘️ Bairro: ${shippingAddress.neighborhood}`;
            
            let message;
            
            if (paymentMethod === 'CREDIT_CARD') {
                message =
                    `🎉 *Pedido Confirmado!* 🎉\n\n` +
                    `📋 *Pedido Nº:* ${newOrder.id}\n\n` +
                    `🛍️ *Itens:*\n${itens}\n\n` +
                    `💰 *Subtotal:* R$ ${Number(subtotalPrice).toFixed(2)}\n` +
                    (deliveryType === 'delivery' ? `🚚 *Taxa de entrega:* R$ ${Number(deliveryFee).toFixed(2)}\n` : '') +
                    `💰 *Total:* R$ ${Number(newOrder.totalPrice).toFixed(2)}\n` +
                    `💳 *Forma de pagamento:* Cartão de Crédito\n\n` +
                    `${deliveryInfo}\n\n` +
                    `📍 *Para pagamento via PIX (opcional):*\n` +
                    `🔑 *Chave PIX:* chave-pix@seudominio.com\n\n` +
                    `⏰ *Seu pedido já está sendo preparado!*\n` +
                    (deliveryType === 'pickup' ? `🏪 Você pode retirar em breve!` : `🚚 Em breve será enviado para entrega.`) + `\n\n` +
                    `💜 *Obrigado por escolher a gente!*\n` +
                    `Qualquer dúvida, estamos aqui! 😊`;
            } else if (paymentMethod === 'CASH_ON_DELIVERY') {
                message =
                    `🎉 *Pedido Confirmado!* 🎉\n\n` +
                    `📋 *Pedido Nº:* ${newOrder.id}\n\n` +
                    `🛍️ *Itens:*\n${itens}\n\n` +
                    `💰 *Subtotal:* R$ ${Number(subtotalPrice).toFixed(2)}\n` +
                    (deliveryType === 'delivery' ? `🚚 *Taxa de entrega:* R$ ${Number(deliveryFee).toFixed(2)}\n` : '') +
                    `💰 *Total:* R$ ${Number(newOrder.totalPrice).toFixed(2)}\n` +
                    `💵 *Forma de pagamento:* Dinheiro ${deliveryType === 'pickup' ? 'na Retirada' : 'na Entrega'}\n\n` +
                    `${deliveryInfo}\n\n` +
                    `📍 *Para pagamento via PIX (opcional):*\n` +
                    `🔑 *Chave PIX:* chave-pix@seudominio.com\n\n` +
                    `⏰ *Seu pedido já está sendo preparado!*\n` +
                    (deliveryType === 'pickup' ? `� Tenha o dinheiro trocado em mãos na retirada.` : `💵 Tenha o dinheiro trocado em mãos na entrega.`) + `\n\n` +
                    `💜 *Obrigado por escolher a gente!*\n` +
                    `Qualquer dúvida, estamos aqui! 😊`;
            } else {
                message =
                    `🎉 *Pedido Confirmado!* 🎉\n\n` +
                    `📋 *Pedido Nº:* ${newOrder.id}\n\n` +
                    `🛍️ *Itens:*\n${itens}\n\n` +
                    `💰 *Subtotal:* R$ ${Number(subtotalPrice).toFixed(2)}\n` +
                    (deliveryType === 'delivery' ? `🚚 *Taxa de entrega:* R$ ${Number(deliveryFee).toFixed(2)}\n` : '') +
                    `💰 *Total:* R$ ${Number(newOrder.totalPrice).toFixed(2)}\n` +
                    `💸 *Forma de pagamento:* PIX\n` +
                    `🔑 *Chave PIX:* chave-pix@seudominio.com\n\n` +
                    `${deliveryInfo}\n\n` +
                    `📸 *Após o pagamento, por favor envie o comprovante aqui.*\n\n` +
                    `💜 *Obrigado por escolher a gente!*\n` +
                    `Qualquer dúvida, estamos aqui! 😊`;
            }

            try {
              await sendWhatsAppMessageZApi(userData.phone, message);
              console.log('Mensagem enviada para:', userData.phone);
            } catch (err) {
              console.error('Erro ao enviar mensagem via Z-API:', err.response?.data || err.message);
            }
        }

        res.status(201).json({ message: 'Pedido criado com sucesso!', order: newOrder });
    } catch (err) {
        console.error(`[POST /api/orders] Erro ao criar o pedido para o usuário ${userId}:`, err.message);
        res.status(500).json({ message: 'Erro ao criar o pedido.', error: err.message });
    }
});

// Rota para ver o histórico de pedidos do usuário
router.get('/history', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    console.log(`[GET /api/orders/history] Recebida requisição para o histórico de pedidos. Usuário ID: ${userId}`);
    
    try {
        const orders = await prisma.order.findMany({
            where: { userId: userId },
            include: {
                orderitem: {
                    include: {
                        product: true
                    }
                },
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log(`[GET /api/orders/history] Histórico de pedidos do usuário ${userId} buscado com sucesso. Total de pedidos: ${orders.length}`);
        res.status(200).json(orders);
    } catch (err) {
        console.error(`[GET /api/orders/history] Erro ao buscar o histórico de pedidos para o usuário ${userId}:`, err.message);
        res.status(500).json({ message: 'Erro ao buscar o histórico de pedidos.', error: err.message });
    }
});

// Rota para atualizar o status de um pedido (apenas para administradores)
router.put('/status/:orderId', authenticateToken, authorize('admin'), async (req, res) => {
    const orderId = parseInt(req.params.orderId);
    const { status, delivererId } = req.body;
    console.log(`[PUT /api/orders/status/${orderId}] Recebida requisição de admin para atualizar status para: "${status}"`);

    // Adicione uma validação para garantir que o status é válido
    const validStatuses = ['pending_payment', 'being_prepared', 'ready_for_pickup', 'on_the_way', 'delivered', 'canceled'];
    if (!validStatuses.includes(status)) {
        console.warn(`[PUT /api/orders/status/${orderId}] Tentativa de usar status inválido: "${status}".`);
        return res.status(400).json({ message: 'Status inválido. Por favor, use um dos seguintes: ' + validStatuses.join(', ') });
    }

    try {
        // Verificar se o entregador existe e está ativo (se fornecido)
        if (delivererId) {
            const deliverer = await prisma.deliverer.findUnique({
                where: { id: parseInt(delivererId) }
            });
            
            if (!deliverer || !deliverer.isActive) {
                console.warn(`[PUT /api/orders/status/${orderId}] Entregador não encontrado ou inativo. ID: ${delivererId}`);
                return res.status(400).json({ message: 'Entregador não encontrado ou inativo' });
            }
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { 
                status: status,
                delivererId: delivererId ? parseInt(delivererId) : undefined,
                updatedAt: new Date()
            },
            include: {
                orderitem: {
                    include: {
                        product: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        phone: true
                    }
                },
                deliverer: {
                    select: {
                        id: true,
                        name: true,
                        phone: true
                    }
                }
            }
        });

        // Enviar notificações se o status mudou para "on_the_way" e há um entregador
        if (status === 'on_the_way' && updatedOrder.deliverer) {
            try {
                console.log('📱 Enviando notificações de entrega...');
                await sendDeliveryNotifications(updatedOrder, updatedOrder.deliverer);
            } catch (error) {
                console.error('❌ Erro ao enviar notificações:', error);
                // Não falha a operação se as notificações falharem
            }
        }

        console.log(`[PUT /api/orders/status/${orderId}] Status do pedido atualizado com sucesso para "${updatedOrder.status}".`);
        res.status(200).json({ message: 'Status do pedido atualizado com sucesso!', order: updatedOrder });
    } catch (err) {
        if (err.code === 'P2025') { // Erro de registro não encontrado
            console.error(`[PUT /api/orders/status/${orderId}] Erro: Pedido não encontrado.`);
            return res.status(404).json({ message: 'Pedido não encontrado.' });
        }
        console.error(`[PUT /api/orders/status/${orderId}] Erro ao atualizar o status do pedido:`, err.message);
        res.status(500).json({ message: 'Erro ao atualizar o status do pedido.', error: err.message });
    }
});

// Nova rota PUT para compatibilidade com o frontend (/orders/:orderId)
router.put('/:orderId', authenticateToken, authorize('admin'), async (req, res) => {
    const orderId = parseInt(req.params.orderId);
    const { status, delivererId } = req.body;
    console.log(`[PUT /api/orders/${orderId}] Recebida requisição de admin para atualizar pedido. Status: "${status}", Entregador: ${delivererId}`);

    try {
        // Verificar se o pedido existe
        const existingOrder = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!existingOrder) {
            console.error(`[PUT /api/orders/${orderId}] Erro: Pedido não encontrado.`);
            return res.status(404).json({ message: 'Pedido não encontrado' });
        }

        // Mapear status do frontend para formato do banco
        const statusMapping = {
            'pending_payment': 'pending_payment',
            'being_prepared': 'being_prepared', 
            'on_the_way': 'on_the_way',
            'delivered': 'delivered',
            'canceled': 'canceled'
        };

        let dbStatus = status;
        if (status && statusMapping[status]) {
            dbStatus = statusMapping[status];
            console.log(`[PUT /api/orders/${orderId}] Status validado: "${status}" -> "${dbStatus}"`);
        }

        // Validar status se fornecido
        const validStatuses = ['pending_payment', 'being_prepared', 'ready_for_pickup', 'on_the_way', 'delivered', 'canceled'];
        if (dbStatus && !validStatuses.includes(dbStatus)) {
            console.warn(`[PUT /api/orders/${orderId}] Status inválido: "${dbStatus}".`);
            return res.status(400).json({ message: 'Status inválido' });
        }

        // Validar entregador se fornecido
        if (delivererId) {
            const deliverer = await prisma.deliverer.findUnique({
                where: { id: parseInt(delivererId) }
            });
            
            if (!deliverer || !deliverer.isActive) {
                console.warn(`[PUT /api/orders/${orderId}] Entregador não encontrado ou inativo. ID: ${delivererId}`);
                return res.status(400).json({ message: 'Entregador não encontrado ou inativo' });
            }
        }

        // Atualizar pedido
        const order = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: dbStatus || existingOrder.status,
                delivererId: delivererId !== undefined ? (delivererId ? parseInt(delivererId) : null) : existingOrder.delivererId,
                updatedAt: new Date()
            },
            include: {
                orderitem: {
                    include: {
                        product: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        phone: true
                    }
                },
                deliverer: {
                    select: {
                        id: true,
                        name: true,
                        phone: true
                    }
                }
            }
        });

        // Enviar notificações baseadas no tipo de pedido e status
        if (dbStatus === 'on_the_way' && order.deliverer && order.deliveryType === 'delivery') {
            // Notificação para entrega com entregador
            try {
                console.log('📱 Enviando notificações de entrega...');
                await sendDeliveryNotifications(order, order.deliverer);
            } catch (error) {
                console.error('❌ Erro ao enviar notificações de entrega:', error);
            }
        } else if (dbStatus === 'ready_for_pickup' && order.deliveryType === 'pickup') {
            // Notificação para retirada
            try {
                console.log('🏪 Enviando notificação de retirada...');
                await sendPickupNotification(order);
            } catch (error) {
                console.error('❌ Erro ao enviar notificação de retirada:', error);
            }
        }

        console.log(`[PUT /api/orders/${orderId}] Pedido atualizado com sucesso.`);
        res.json(order);
    } catch (error) {
        console.error(`[PUT /api/orders/${orderId}] Erro ao atualizar pedido:`, error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Rota para cancelar um pedido
router.put('/cancel/:orderId', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const orderId = parseInt(req.params.orderId);
    console.log(`[PUT /api/orders/cancel/${orderId}] Recebida requisição para cancelar pedido. Usuário ID: ${userId}`);

    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            console.warn(`[PUT /api/orders/cancel/${orderId}] Pedido não encontrado.`);
            return res.status(404).json({ message: 'Pedido não encontrado.' });
        }

        // Verifica se o usuário é o dono do pedido ou um administrador
        if (order.userId !== userId && userRole !== 'admin') {
            console.warn(`[PUT /api/orders/cancel/${orderId}] Acesso negado. Usuário ID ${userId} tentou cancelar pedido que não lhe pertence.`);
            return res.status(403).json({ message: 'Acesso negado: você não tem permissão para cancelar este pedido.' });
        }
        
        // Verifica se o status do pedido permite o cancelamento
        if (order.status === 'on_the_way' || order.status === 'delivered' || order.status === 'canceled') {
            console.warn(`[PUT /api/orders/cancel/${orderId}] Não é possível cancelar. Status atual: "${order.status}".`);
            return res.status(400).json({ message: `Não é possível cancelar um pedido com o status "${order.status}".` });
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { 
                status: 'canceled',
                updatedAt: new Date()
            },
        });

        console.log(`[PUT /api/orders/cancel/${orderId}] Pedido cancelado com sucesso. Pedido ID: ${updatedOrder.id}`);
        res.status(200).json({ message: 'Pedido cancelado com sucesso!', order: updatedOrder });
    } catch (err) {
        console.error(`[PUT /api/orders/cancel/${orderId}] Erro ao cancelar o pedido:`, err.message);
        res.status(500).json({ message: 'Erro ao cancelar o pedido.', error: err.message });
    }
});

// Listar todos os pedidos (apenas admin)
router.get('/orders', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            phone: true
          }
        },
        orderitem: {
          include: { product: true }
        }
      }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar pedidos.' });
  }
});

router.get('/pending-count', authenticateToken, authorize('admin'), async (req, res) => {
  const count = await prisma.order.count({
    where: {
      status: { in: ['pending_payment', 'being_prepared'] }
    }
  });
  res.json({ count });
});

module.exports = router;
