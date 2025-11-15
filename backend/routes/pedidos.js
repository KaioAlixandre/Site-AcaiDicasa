const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken, authorize } = require('./auth');
const { sendDeliveryNotifications, sendPickupNotification, sendPaymentConfirmationNotification } = require('../services/messageService');
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
    const { paymentMethod, tipoEntrega = 'delivery', taxaEntrega = 0 } = req.body;
    if (!paymentMethod) {
        return res.status(400).json({ message: 'Forma de pagamento não informada.' });
    }
    console.log(`[POST /api/orders] Recebida requisição para criar um pedido. Usuário ID: ${userId}, Tipo: ${tipoEntrega}`);

    try {
        // Encontrar o carrinho e o usuário com seus endereços em uma única busca
        const [cart, user] = await Promise.all([
            prisma.carrinho.findUnique({
                where: { usuarioId: userId },
                include: {
                    itens: {
                        include: {
                            produto: true
                        }
                    }
                }
            }),
            prisma.usuario.findUnique({
                where: { id: userId },
                include: {
                    enderecos: true
                }
            })
        ]);

        if (!cart || cart.itens.length === 0) {
            console.warn(`[POST /api/orders] Carrinho do usuário ${userId} está vazio.`);
            return res.status(400).json({ message: 'Carrinho vazio. Adicione itens antes de criar um pedido.' });
        }

        // Para entrega, verificar se tem endereço
        let shippingAddress = null;
        if (tipoEntrega === 'delivery') {
            shippingAddress = user.enderecos.find(addr => addr.padrao) || user.enderecos[0];
            
            if (!shippingAddress) {
                console.warn(`[POST /api/orders] Usuário ${userId} não possui endereço de entrega cadastrado.`);
                return res.status(400).json({
                    message: 'Nenhum endereço de entrega encontrado. Por favor, cadastre um para continuar.',
                    redirectPath: '/api/auth/profile/enderecos'
                });
            }
        }
        
        // Calcular o preço total do pedido (incluindo taxa de entrega)
        const subprecoTotal = cart.itens.reduce((acc, item) => {
            // Verificar se é produto personalizado
            let itemPrice = item.produto.preco;
            if (item.opcoesSelecionadas) {
                if (item.opcoesSelecionadas.customAcai) {
                    itemPrice = item.opcoesSelecionadas.customAcai.value;
                } else if (item.opcoesSelecionadas.customSorvete) {
                    itemPrice = item.opcoesSelecionadas.customSorvete.value;
                } else if (item.opcoesSelecionadas.customProduct) {
                    itemPrice = item.opcoesSelecionadas.customProduct.value;
                }
            }
            return acc + (item.quantidade * itemPrice);
        }, 0);
        
        const precoTotal = subprecoTotal + (tipoEntrega === 'delivery' ? taxaEntrega : 0);

        console.log(`[POST /api/orders] Criando pedido para o usuário ${userId} com preço total de ${precoTotal.toFixed(2)} (${tipoEntrega}).`);

        // Iniciar uma transação para garantir que tudo seja feito ou nada seja feito
        const newOrder = await prisma.$transaction(async (tx) => {
            // 1. Criar o pedido, incluindo o telefone e o endereço de entrega
            // Se for cartão de crédito ou dinheiro na entrega, já inicia como "being_prepared", senão "pending_payment"
            const initialStatus = (paymentMethod === 'CREDIT_CARD' || paymentMethod === 'CASH_ON_DELIVERY') ? 'being_prepared' : 'pending_payment';
            
            const order = await tx.pedido.create({
                data: {
                    usuarioId: userId,
                    precoTotal: precoTotal,
                    status: initialStatus,
                    tipoEntrega: tipoEntrega,
                    taxaEntrega: tipoEntrega === 'delivery' ? taxaEntrega : 0,
                    atualizadoEm: new Date(),
                    ruaEntrega: shippingAddress?.rua || null,
                    numeroEntrega: shippingAddress?.numero || null,
                    complementoEntrega: shippingAddress?.complemento || null,
                    bairroEntrega: shippingAddress?.bairro || null,
                    itens_pedido: {
                        createMany: {
                            data: cart.itens.map(item => {
                                // Verificar se é produto personalizado
                                let itemPrice = item.produto.preco;
                                if (item.opcoesSelecionadas) {
                                    if (item.opcoesSelecionadas.customAcai) {
                                        itemPrice = item.opcoesSelecionadas.customAcai.value;
                                    } else if (item.opcoesSelecionadas.customSorvete) {
                                        itemPrice = item.opcoesSelecionadas.customSorvete.value;
                                    } else if (item.opcoesSelecionadas.customProduct) {
                                        itemPrice = item.opcoesSelecionadas.customProduct.value;
                                    }
                                }
                                
                                return {
                                    produtoId: item.produtoId,
                                    quantidade: item.quantidade,
                                    precoNoPedido: itemPrice,
                                    opcoesSelecionadasSnapshot: item.opcoesSelecionadas
                                };
                            })
                        }
                    }
                },
                include: {
                    itens_pedido: true
                }
            });

            // 2. Esvaziar o carrinho do usuário
            await tx.item_carrinho.deleteMany({
                where: { carrinhoId: cart.id }
            });

            return order;
        });

        console.log(`[POST /api/orders] Pedido ID ${newOrder.id} criado com sucesso para o usuário ${userId}.`);
        
        // Enviar mensagem via WhatsApp para PIX, Cartão de Crédito ou Dinheiro na Entrega
        const userData = await prisma.usuario.findUnique({ where: { id: req.user.id } });

        if ((paymentMethod === 'PIX' || paymentMethod === 'CREDIT_CARD' || paymentMethod === 'CASH_ON_DELIVERY') && userData.telefone) {
            const itens = cart.itens.map(item =>
                `• ${item.produto.nome} x ${item.quantidade}`
            ).join('\n');
            
            // Informações de entrega/retirada
            const deliveryInfo = tipoEntrega === 'pickup' 
                ? `📍 *Retirada no local*\n🏪 Endereço da loja: [SEU ENDEREÇO AQUI]\n⏰ Horário: Segunda a Domingo, 8h às 22h`
                : `🚚 *Entrega em casa*\n📍 Endereço: ${shippingAddress.rua}, ${shippingAddress.numero}${shippingAddress.complemento ? ` - ${shippingAddress.complemento}` : ''}\n🏘️ Bairro: ${shippingAddress.bairro}`;
            
            let message;
            
            if (paymentMethod === 'CREDIT_CARD') {
                message =
                    `🎉 *Pedido Confirmado!* 🎉\n\n` +
                    `📋 *Pedido Nº:* ${newOrder.id}\n\n` +
                    `🛍️ *Itens:*\n${itens}\n\n` +
                    `💰 *Subtotal:* R$ ${Number(subprecoTotal).toFixed(2)}\n` +
                    (tipoEntrega === 'delivery' ? `🚚 *Taxa de entrega:* R$ ${Number(taxaEntrega).toFixed(2)}\n` : '') +
                    `💰 *Total:* R$ ${Number(newOrder.precoTotal).toFixed(2)}\n` +
                    `💳 *Forma de pagamento:* Cartão de Crédito\n\n` +
                    `${deliveryInfo}\n\n` +
                    `📍 *Para pagamento via PIX (opcional):*\n` +
                    `🔑 *Chave PIX:* chave-pix@seudominio.com\n\n` +
                    `⏰ *Seu pedido já está sendo preparado!*\n` +
                    (tipoEntrega === 'pickup' ? `🏪 Você pode retirar em breve!` : `🚚 Em breve será enviado para entrega.`) + `\n\n` +
                    `💜 *Obrigado por escolher a gente!*\n` +
                    `Qualquer dúvida, estamos aqui! 😊`;
            } else if (paymentMethod === 'CASH_ON_DELIVERY') {
                message =
                    `🎉 *Pedido Confirmado!* 🎉\n\n` +
                    `📋 *Pedido Nº:* ${newOrder.id}\n\n` +
                    `🛍️ *Itens:*\n${itens}\n\n` +
                    `💰 *Subtotal:* R$ ${Number(subprecoTotal).toFixed(2)}\n` +
                    (tipoEntrega === 'delivery' ? `🚚 *Taxa de entrega:* R$ ${Number(taxaEntrega).toFixed(2)}\n` : '') +
                    `💰 *Total:* R$ ${Number(newOrder.precoTotal).toFixed(2)}\n` +
                    `💵 *Forma de pagamento:* Dinheiro ${tipoEntrega === 'pickup' ? 'na Retirada' : 'na Entrega'}\n\n` +
                    `${deliveryInfo}\n\n` +
                    `📍 *Para pagamento via PIX (opcional):*\n` +
                    `🔑 *Chave PIX:* chave-pix@seudominio.com\n\n` +
                    `⏰ *Seu pedido já está sendo preparado!*\n` +
                    (tipoEntrega === 'pickup' ? `� Tenha o dinheiro trocado em mãos na retirada.` : `💵 Tenha o dinheiro trocado em mãos na entrega.`) + `\n\n` +
                    `💜 *Obrigado por escolher a gente!*\n` +
                    `Qualquer dúvida, estamos aqui! 😊`;
            } else {
                message =
                    `🎉 *Pedido Confirmado!* 🎉\n\n` +
                    `📋 *Pedido Nº:* ${newOrder.id}\n\n` +
                    `🛍️ *Itens:*\n${itens}\n\n` +
                    `💰 *Subtotal:* R$ ${Number(subprecoTotal).toFixed(2)}\n` +
                    (tipoEntrega === 'delivery' ? `🚚 *Taxa de entrega:* R$ ${Number(taxaEntrega).toFixed(2)}\n` : '') +
                    `💰 *Total:* R$ ${Number(newOrder.precoTotal).toFixed(2)}\n` +
                    `💸 *Forma de pagamento:* PIX\n` +
                    `🔑 *Chave PIX:* chave-pix@seudominio.com\n\n` +
                    `${deliveryInfo}\n\n` +
                    `📸 *Após o pagamento, por favor envie o comprovante aqui.*\n\n` +
                    `💜 *Obrigado por escolher a gente!*\n` +
                    `Qualquer dúvida, estamos aqui! 😊`;
            }

            try {
              await sendWhatsAppMessageZApi(userData.telefone, message);
              console.log('Mensagem enviada para:', userData.telefone);
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
        const orders = await prisma.pedido.findMany({
            where: { usuarioId: userId },
            include: {
                itens_pedido: {
                    include: {
                        produto: {
                            include: {
                                imagens_produto: true
                            }
                        }
                    }
                },
                pagamento: true
            },
            orderBy: {
                criadoEm: 'desc'
            }
        });

        // Transformar os dados para o formato esperado pelo frontend
        const transformedOrders = orders.map(order => ({
            id: order.id,
            userId: order.usuarioId,
            totalPrice: order.precoTotal,
            status: order.status,
            deliveryType: order.tipoEntrega,
            createdAt: order.criadoEm,
            shippingStreet: order.ruaEntrega,
            shippingNumber: order.numeroEntrega,
            shippingComplement: order.complementoEntrega,
            shippingNeighborhood: order.bairroEntrega,
            shippingPhone: order.telefoneEntrega,
            deliveryFee: order.taxaEntrega,
            orderitem: order.itens_pedido.map(item => ({
                id: item.id,
                orderId: item.pedidoId,
                productId: item.produtoId,
                quantity: item.quantidade,
                priceAtOrder: item.precoNoPedido,
                selectedOptionsSnapshot: item.opcoesSelecionadasSnapshot,
                product: {
                    id: item.produto.id,
                    name: item.produto.nome,
                    price: item.produto.preco,
                    description: item.produto.descricao,
                    isActive: item.produto.ativo,
                    createdAt: item.produto.criadoEm,
                    categoryId: item.produto.categoriaId,
                    images: item.produto.imagens_produto?.map(img => ({
                        id: img.id,
                        url: img.urlImagem,
                        altText: img.textoAlternativo,
                        productId: img.produtoId
                    })) || []
                }
            })),
            payment: order.pagamento ? {
                id: order.pagamento.id,
                amount: order.pagamento.valor,
                method: order.pagamento.metodo,
                status: order.pagamento.status,
                transactionId: order.pagamento.idTransacao,
                createdAt: order.pagamento.criadoEm,
                updatedAt: order.pagamento.atualizadoEm,
                orderId: order.pagamento.pedidoId
            } : null
        }));

        console.log(`[GET /api/orders/history] Histórico de pedidos do usuário ${userId} buscado com sucesso. Total de pedidos: ${transformedOrders.length}`);
        res.status(200).json(transformedOrders);
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
        // Buscar o pedido atual primeiro para comparar o status
        const currentOrder = await prisma.pedido.findUnique({
            where: { id: orderId },
            include: {
                pagamento: {
                    select: {
                        metodo: true
                    }
                }
            }
        });

        if (!currentOrder) {
            console.error(`[PUT /api/orders/status/${orderId}] Erro: Pedido não encontrado.`);
            return res.status(404).json({ message: 'Pedido não encontrado.' });
        }

        // Verificar se o entregador existe e está ativo (se fornecido)
        if (delivererId) {
            const deliverer = await prisma.entregador.findUnique({
                where: { id: parseInt(delivererId) }
            });
            
            if (!deliverer || !deliverer.ativo) {
                console.warn(`[PUT /api/orders/status/${orderId}] Entregador não encontrado ou inativo. ID: ${delivererId}`);
                return res.status(400).json({ message: 'Entregador não encontrado ou inativo' });
            }
        }

        const updatedOrder = await prisma.pedido.update({
            where: { id: orderId },
            data: { 
                status: status,
                entregadorId: delivererId ? parseInt(delivererId) : undefined,
                atualizadoEm: new Date()
            },
            include: {
                itens_pedido: {
                    include: {
                        produto: true
                    }
                },
                usuario: {
                    select: {
                        id: true,
                        nomeUsuario: true,
                        email: true,
                        telefone: true
                    }
                },
                entregador: {
                    select: {
                        id: true,
                        nome: true,
                        telefone: true
                    }
                }
            }
        });

        // Enviar notificação de pagamento confirmado se mudou de "pending_payment" para "being_prepared" (PIX)
        if (currentOrder.status === 'pending_payment' && status === 'being_prepared') {
            try {
                console.log('💳 Enviando notificação de pagamento confirmado...');
                await sendPaymentConfirmationNotification(updatedOrder);
            } catch (error) {
                console.error('❌ Erro ao enviar notificação de pagamento confirmado:', error);
                // Não falha a operação se as notificações falharem
            }
        }

        // Enviar notificações se o status mudou para "on_the_way" e há um entregador
        if (status === 'on_the_way' && updatedOrder.entregador) {
            try {
                console.log('📱 Enviando notificações de entrega...');
                await sendDeliveryNotifications(updatedOrder, updatedOrder.entregador);
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
        const existingOrder = await prisma.pedido.findUnique({
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
            const deliverer = await prisma.entregador.findUnique({
                where: { id: parseInt(delivererId) }
            });
            
            if (!deliverer || !deliverer.ativo) {
                console.warn(`[PUT /api/orders/${orderId}] Entregador não encontrado ou inativo. ID: ${delivererId}`);
                return res.status(400).json({ message: 'Entregador não encontrado ou inativo' });
            }
        }

        // Atualizar pedido
        const order = await prisma.pedido.update({
            where: { id: orderId },
            data: {
                status: dbStatus || existingOrder.status,
                entregadorId: delivererId !== undefined ? (delivererId ? parseInt(delivererId) : null) : existingOrder.entregadorId,
                atualizadoEm: new Date()
            },
            include: {
                itens_pedido: {
                    include: {
                        produto: true
                    }
                },
                usuario: {
                    select: {
                        id: true,
                        nomeUsuario: true,
                        email: true,
                        telefone: true
                    }
                },
                entregador: {
                    select: {
                        id: true,
                        nome: true,
                        telefone: true
                    }
                }
            }
        });

        // Enviar notificação de pagamento confirmado se mudou de "pending_payment" para "being_prepared" (PIX)
        if (existingOrder.status === 'pending_payment' && dbStatus === 'being_prepared') {
            try {
                console.log('💳 Enviando notificação de pagamento confirmado...');
                await sendPaymentConfirmationNotification(order);
            } catch (error) {
                console.error('❌ Erro ao enviar notificação de pagamento confirmado:', error);
                // Não falha a operação se as notificações falharem
            }
        }

        // Enviar notificações baseadas no tipo de pedido e status
        if (dbStatus === 'on_the_way' && order.entregador && order.tipoEntrega === 'delivery') {
            // Notificação para entrega com entregador
            try {
                console.log('📱 Enviando notificações de entrega...');
                await sendDeliveryNotifications(order, order.entregador);
            } catch (error) {
                console.error('❌ Erro ao enviar notificações de entrega:', error);
            }
        } else if (dbStatus === 'ready_for_pickup' && order.tipoEntrega === 'pickup') {
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
        const order = await prisma.pedido.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            console.warn(`[PUT /api/orders/cancel/${orderId}] Pedido não encontrado.`);
            return res.status(404).json({ message: 'Pedido não encontrado.' });
        }

        // Verifica se o usuário é o dono do pedido ou um administrador
        if (order.usuarioId !== userId && userRole !== 'admin') {
            console.warn(`[PUT /api/orders/cancel/${orderId}] Acesso negado. Usuário ID ${userId} tentou cancelar pedido que não lhe pertence.`);
            return res.status(403).json({ message: 'Acesso negado: você não tem permissão para cancelar este pedido.' });
        }
        
        // Verifica se o status do pedido permite o cancelamento
        if (order.status === 'on_the_way' || order.status === 'delivered' || order.status === 'canceled') {
            console.warn(`[PUT /api/orders/cancel/${orderId}] Não é possível cancelar. Status atual: "${order.status}".`);
            return res.status(400).json({ message: `Não é possível cancelar um pedido com o status "${order.status}".` });
        }

        const updatedOrder = await prisma.pedido.update({
            where: { id: orderId },
            data: { 
                status: 'canceled',
                atualizadoEm: new Date()
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
    const orders = await prisma.pedido.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            nomeUsuario: true,
            email: true,
            telefone: true
          }
        },
        itens_pedido: {
          include: { 
            produto: {
              include: {
                imagens_produto: true
              }
            }
          }
        },
        pagamento: true
      },
      orderBy: {
        criadoEm: 'desc'
      }
    });

    // Transformar os dados para o formato esperado pelo frontend
    const transformedOrders = orders.map(order => ({
      id: order.id,
      userId: order.usuarioId,
      totalPrice: order.precoTotal,
      status: order.status,
      deliveryType: order.tipoEntrega,
      createdAt: order.criadoEm,
      shippingStreet: order.ruaEntrega,
      shippingNumber: order.numeroEntrega,
      shippingComplement: order.complementoEntrega,
      shippingNeighborhood: order.bairroEntrega,
      shippingPhone: order.telefoneEntrega,
      deliveryFee: order.taxaEntrega,
      user: order.usuario ? {
        id: order.usuario.id,
        username: order.usuario.nomeUsuario,
        email: order.usuario.email,
        phone: order.usuario.telefone
      } : null,
      orderitem: order.itens_pedido.map(item => ({
        id: item.id,
        orderId: item.pedidoId,
        productId: item.produtoId,
        quantity: item.quantidade,
        priceAtOrder: item.precoNoPedido,
        selectedOptionsSnapshot: item.opcoesSelecionadas,
        product: item.produto ? {
          id: item.produto.id,
          name: item.produto.nome,
          description: item.produto.descricao,
          price: item.produto.preco,
          categoryId: item.produto.categoriaId,
          isActive: item.produto.ativo,
          images: item.produto.imagens_produto ? item.produto.imagens_produto.map(img => ({
            id: img.id,
            productId: img.produtoId,
            url: img.url,
            isPrimary: img.principal
          })) : []
        } : null
      })),
      payment: order.pagamento ? {
        id: order.pagamento.id,
        orderId: order.pagamento.pedidoId,
        method: order.pagamento.metodoPagamento,
        status: order.pagamento.statusPagamento,
        amount: order.pagamento.valor,
        paidAt: order.pagamento.pagoEm
      } : null
    }));

    res.json(transformedOrders);
  } catch (err) {
    console.error('Erro ao buscar pedidos:', err);
    res.status(500).json({ error: 'Erro ao buscar pedidos.' });
  }
});

router.get('/pending-count', authenticateToken, authorize('admin'), async (req, res) => {
  const count = await prisma.pedido.count({
    where: {
      status: { in: ['pending_payment', 'being_prepared'] }
    }
  });
  res.json({ count });
});

module.exports = router;
