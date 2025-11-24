const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken, authorize } = require('./auth');
const { sendDeliveryNotifications, sendPickupNotification, sendPaymentConfirmationNotification, sendCookNotification, sendDeliveredConfirmationNotification } = require('../services/messageService');
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
    const { paymentMethod, tipoEntrega, deliveryType, taxaEntrega, deliveryFee, notes } = req.body;
    
    // Aceitar tanto deliveryType (do frontend) quanto tipoEntrega
    const tipo = deliveryType || tipoEntrega || 'delivery';
    
    // Aceitar tanto deliveryFee (do frontend) quanto taxaEntrega
    let taxa = deliveryFee || taxaEntrega || 0;
    
    if (!paymentMethod) {
        return res.status(400).json({ message: 'Forma de pagamento não informada.' });
    }
    console.log(`[POST /api/orders] Recebida requisição para criar um pedido. Usuário ID: ${userId}, Tipo: ${tipo}, Taxa: R$ ${taxa}${notes ? ', Observações: Sim' : ''}`);

    try {
        // Encontrar o carrinho e o usuário com seus endereços em uma única busca
        const [cart, user] = await Promise.all([
            prisma.carrinho.findUnique({
                where: { usuarioId: userId },
                include: {
                    itens: {
                        include: {
                            produto: true,
                            complementos: {
                                include: {
                                    complemento: true
                                }
                            }
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
        if (tipo === 'delivery') {
            shippingAddress = user.enderecos.find(addr => addr.padrao) || user.enderecos[0];
            
            if (!shippingAddress) {
                console.warn(`[POST /api/orders] Usuário ${userId} não possui endereço de entrega cadastrado.`);
                return res.status(400).json({
                    message: 'Nenhum endereço de entrega encontrado. Por favor, cadastre um para continuar.',
                    redirectPath: '/api/auth/profile/enderecos'
                });
            }
        }
        
        // Calcular o preço total do pedido (SEM taxa de entrega ainda)
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
        
        // Verificar se há promoção de frete grátis ativa
        let freteGratis = false;
        if (tipo === 'delivery' && taxa > 0) {
            const storeConfig = await prisma.configuracao_loja.findFirst();
            if (storeConfig && storeConfig.promocaoTaxaAtiva) {
                const hoje = new Date().getDay().toString(); // 0 = domingo, 1 = segunda, etc.
                const diasPromo = storeConfig.promocaoDias ? storeConfig.promocaoDias.split(',') : [];
                
                // Verificar se hoje é um dia de promoção
                if (diasPromo.includes(hoje)) {
                    const valorMinimo = parseFloat(storeConfig.promocaoValorMinimo || 0);
                    // Verificar se o subtotal atinge o valor mínimo
                    if (subprecoTotal >= valorMinimo) {
                        taxa = 0; // Frete grátis!
                        freteGratis = true;
                        console.log(`🎉 [POST /api/orders] PROMOÇÃO APLICADA! Frete grátis para pedido acima de R$ ${valorMinimo.toFixed(2)}. Subtotal: R$ ${subprecoTotal.toFixed(2)}`);
                    }
                }
            }
        }
        
        const precoTotal = subprecoTotal + (tipo === 'delivery' ? taxa : 0);

        console.log(`[POST /api/orders] Criando pedido para o usuário ${userId} com preço total de ${precoTotal.toFixed(2)} (${tipo}, Taxa: R$ ${taxa}${freteGratis ? ' - FRETE GRÁTIS' : ''}).`);

        // Determinar status inicial antes da transação
        const initialStatus = (paymentMethod === 'CREDIT_CARD' || paymentMethod === 'CASH_ON_DELIVERY') ? 'being_prepared' : 'pending_payment';
        
        // Iniciar uma transação para garantir que tudo seja feito ou nada seja feito
        const newOrder = await prisma.$transaction(async (tx) => {
            // 1. Criar o pedido, incluindo o telefone e o endereço de entrega
            // Se for cartão de crédito ou dinheiro na entrega, já inicia como "being_prepared", senão "pending_payment"
            
            const order = await tx.pedido.create({
                data: {
                    usuarioId: userId,
                    precoTotal: precoTotal,
                    status: initialStatus,
                    tipoEntrega: tipo,
                    taxaEntrega: tipo === 'delivery' ? taxa : 0,
                    metodoPagamento: paymentMethod,
                    observacoes: notes && notes.trim() ? notes.trim() : null,
                    atualizadoEm: new Date(),
                    ruaEntrega: shippingAddress?.rua || null,
                    numeroEntrega: shippingAddress?.numero || null,
                    complementoEntrega: shippingAddress?.complemento || null,
                    bairroEntrega: shippingAddress?.bairro || null,
                },
                include: {
                    itens_pedido: true
                }
            });

            // 2. Criar os itens do pedido com seus complementos
            for (const item of cart.itens) {
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

                // Criar item do pedido
                const orderItem = await tx.item_pedido.create({
                    data: {
                        pedidoId: order.id,
                        produtoId: item.produtoId,
                        quantidade: item.quantidade,
                        precoNoPedido: itemPrice,
                        opcoesSelecionadasSnapshot: item.opcoesSelecionadas
                    }
                });

                // Adicionar complementos ao item do pedido
                if (item.complementos && item.complementos.length > 0) {
                    const complementData = item.complementos.map(c => ({
                        itemPedidoId: orderItem.id,
                        complementoId: c.complementoId,
                    }));

                    await tx.item_pedido_complemento.createMany({
                        data: complementData,
                    });

                    console.log(`🍓 [POST /api/orders] ${complementData.length} complementos adicionados ao item do pedido ${orderItem.id}.`);
                }
            }

            // 3. Criar o registro de pagamento
            await tx.pagamento.create({
                data: {
                    pedidoId: order.id,
                    valor: precoTotal,
                    metodo: paymentMethod,
                    status: (paymentMethod === 'CREDIT_CARD' || paymentMethod === 'CASH_ON_DELIVERY') ? 'PAID' : 'PENDING',
                    atualizadoEm: new Date()
                }
            });

            console.log(`💳 [POST /api/orders] Pagamento criado para o pedido ${order.id} com método ${paymentMethod}.`);

            // 4. Esvaziar o carrinho do usuário
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
            const deliveryInfo = tipo === 'pickup' 
                ? `📍 *Retirada no local*\n🏪 Endereço da loja: Açaidicasa, praça Geraldo Sá.`+
                `Localizaçao maps: https://maps.app.goo.gl/LGe84k24KogZWXMt6?g_st=ipc`
                : `*Entrega em casa*\n📍 Endereço: ${shippingAddress.rua}, ${shippingAddress.numero}${shippingAddress.complemento ? ` - ${shippingAddress.complemento}` : ''}\nBairro: ${shippingAddress.bairro}`;
            
            // Adicionar observações se houver
            const notesSection = notes && notes.trim() ? `\n\n📝 *Observações:*\n${notes.trim()}` : '';
            
            let message;
            
            if (paymentMethod === 'CREDIT_CARD') {
                message =
                    ` *Pedido Confirmado!* 🎉\n\n` +
                    ` *Pedido Nº:* ${newOrder.id}\n\n` +
                    ` *Itens:*\n${itens}\n\n` +
                    `💰 *Total:* R$ ${Number(newOrder.precoTotal).toFixed(2)}\n` +
                    `💳 *Forma de pagamento:* Cartão de Crédito\n\n` +
                    `${deliveryInfo}` +
                    notesSection + `\n\n` +
                    ` *Seu pedido já está sendo preparado!*\n` +
                    (tipo === 'pickup' ? ` Você pode retirar em breve!` : ` Em breve será enviado para entrega.`) + `\n\n` +
                    ` *Obrigado por escolher a gente! 💜*\n`;
            } else if (paymentMethod === 'CASH_ON_DELIVERY') {
                message =
                    ` *Pedido Confirmado!* 🎉\n\n` +
                    ` *Pedido Nº:* ${newOrder.id}\n\n` +
                    ` *Itens:*\n${itens}\n\n` +
                    `💰 *Total:* R$ ${Number(newOrder.precoTotal).toFixed(2)}\n` +
                    `💵 *Forma de pagamento:* Dinheiro ${tipo === 'pickup' ? 'na Retirada' : 'na Entrega'}\n\n` +
                    `${deliveryInfo}` +
                    notesSection + `\n\n` +
                    ` *Seu pedido já está sendo preparado!*\n` +
                    (tipo === 'pickup' ? `� Tenha o dinheiro trocado em mãos na retirada.` : ` Tenha o dinheiro trocado em mãos na entrega.`) + `\n\n` +
                    ` *Obrigado por escolher a gente! 💜*\n`;
            } else {
                message =
                    ` *Pedido Confirmado!* 🎉\n\n` +
                    ` *Pedido Nº:* ${newOrder.id}\n\n` +
                    ` *Itens:*\n${itens}\n\n` +
                    `💰 *Total:* R$ ${Number(newOrder.precoTotal).toFixed(2)}\n` +
                    `💸 *Forma de pagamento:* PIX\n` +
                    `🔑 *Chave PIX:* 99984959718\n\n` +
                    `${deliveryInfo}` +
                    notesSection + `\n\n` +
                    `📸 *Após o pagamento, por favor envie o comprovante aqui.*\n\n` +
                    ` *Obrigado por escolher a gente! 💜*\n`;
            }

            try {
              await sendWhatsAppMessageZApi(userData.telefone, message);
              console.log('Mensagem enviada para:', userData.telefone);
            } catch (err) {
              console.error('Erro ao enviar mensagem via Z-API:', err.response?.data || err.message);
            }
        }

        // Se o pedido já está em preparo (cartão ou dinheiro), notificar cozinheiro
        if (initialStatus === 'being_prepared') {
            try {
                // Buscar um cozinheiro ativo
                const cozinheiroAtivo = await prisma.cozinheiro.findFirst({
                    where: { ativo: true },
                    orderBy: { criadoEm: 'asc' } // Pega o mais antigo (FIFO)
                });

                if (cozinheiroAtivo) {
                    // Buscar pedido completo com relacionamentos
                    const pedidoCompleto = await prisma.pedido.findUnique({
                        where: { id: newOrder.id },
                        include: {
                            usuario: true,
                            itens_pedido: {
                                include: {
                                    produto: true,
                                    complementos: {
                                        include: {
                                            complemento: true
                                        }
                                    }
                                }
                            }
                        }
                    });

                    console.log(`👨‍🍳 Notificando cozinheiro: ${cozinheiroAtivo.nome}`);
                    await sendCookNotification(pedidoCompleto, cozinheiroAtivo);
                } else {
                    console.log('⚠️ Nenhum cozinheiro ativo encontrado para notificar');
                }
            } catch (err) {
                console.error('❌ Erro ao notificar cozinheiro:', err);
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
                        },
                        complementos: {
                            include: {
                                complemento: true
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
            notes: order.observacoes,
            orderitem: order.itens_pedido.map(item => ({
                id: item.id,
                orderId: item.pedidoId,
                productId: item.produtoId,
                quantity: item.quantidade,
                priceAtOrder: item.precoNoPedido,
                selectedOptionsSnapshot: item.opcoesSelecionadasSnapshot,
                complements: item.complementos ? item.complementos.map(c => ({
                    id: c.complemento.id,
                    name: c.complemento.nome,
                    imageUrl: c.complemento.imagemUrl,
                    isActive: c.complemento.ativo
                })) : [],
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
                        produto: true,
                        complementos: {
                            include: {
                                complemento: true
                            }
                        }
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
                
                // Notificar cozinheiro quando pedido entra em preparo
                const cozinheiroAtivo = await prisma.cozinheiro.findFirst({
                    where: { ativo: true },
                    orderBy: { criadoEm: 'asc' }
                });

                if (cozinheiroAtivo) {
                    console.log(`👨‍🍳 Notificando cozinheiro: ${cozinheiroAtivo.nome}`);
                    await sendCookNotification(updatedOrder, cozinheiroAtivo);
                } else {
                    console.log('⚠️ Nenhum cozinheiro ativo encontrado para notificar');
                }
            } catch (error) {
                console.error('❌ Erro ao enviar notificação de pagamento confirmado:', error);
                // Não falha a operação se as notificações falharem
            }
        }

        // Enviar notificações se o status mudou para "on_the_way" e há um entregador
        if (status === 'on_the_way' && updatedOrder.entregador) {
            try {
                console.log('📱 Enviando notificações de entrega...');
                // Mapear campos para compatibilidade com messageService
                const orderForNotification = {
                    ...updatedOrder,
                    totalPrice: updatedOrder.precoTotal,
                    user: updatedOrder.usuario ? {
                        username: updatedOrder.usuario.nomeUsuario,
                        phone: updatedOrder.usuario.telefone
                    } : null,
                    orderItems: updatedOrder.itens_pedido.map(item => ({
                        ...item,
                        product: item.produto // garantir campo 'product' (inglês)
                    })),
                    shippingStreet: updatedOrder.ruaEntrega,
                    shippingNumber: updatedOrder.numeroEntrega,
                    shippingComplement: updatedOrder.complementoEntrega,
                    shippingNeighborhood: updatedOrder.bairroEntrega,
                    shippingPhone: updatedOrder.usuario?.telefone
                };
                await sendDeliveryNotifications(orderForNotification, updatedOrder.entregador);
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
                // Notificar cozinheiro quando pedido entra em preparo
                const cozinheiroAtivo = await prisma.cozinheiro.findFirst({
                    where: { ativo: true },
                    orderBy: { criadoEm: 'asc' }
                });
                if (cozinheiroAtivo) {
                    console.log(`👨‍🍳 Notificando cozinheiro: ${cozinheiroAtivo.nome}`);
                    await sendCookNotification(order, cozinheiroAtivo);
                } else {
                    console.log('⚠️ Nenhum cozinheiro ativo encontrado para notificar');
                }
            } catch (error) {
                console.error('❌ Erro ao enviar notificação de pagamento confirmado:', error);
                // Não falha a operação se as notificações falharem
            }
        }

        // Enviar confirmação de entrega ao cliente se status for 'delivered'
        if (dbStatus === 'delivered') {
            try {
                console.log('📦 Enviando confirmação de entrega ao cliente...');
                await sendDeliveredConfirmationNotification(order);
            } catch (error) {
                console.error('❌ Erro ao enviar confirmação de entrega:', error);
            }
        }

        // Enviar notificações baseadas no tipo de pedido e status
        if (dbStatus === 'on_the_way' && order.entregador && order.tipoEntrega === 'delivery') {
            // Notificação para entrega com entregador
            try {
                console.log('📱 Enviando notificações de entrega...');
                // Mapear campos para compatibilidade com messageService
                const orderForNotification = {
                    ...order,
                    totalPrice: order.precoTotal,
                    user: order.usuario ? {
                        username: order.usuario.nomeUsuario,
                        phone: order.usuario.telefone
                    } : null,
                    orderItems: order.itens_pedido.map(item => ({
                        ...item,
                        product: item.produto // garantir campo 'product' (inglês)
                    })),
                    shippingStreet: order.ruaEntrega,
                    shippingNumber: order.numeroEntrega,
                    shippingComplement: order.complementoEntrega,
                    shippingNeighborhood: order.bairroEntrega,
                    shippingPhone: order.usuario?.telefone
                };
                await sendDeliveryNotifications(orderForNotification, order.entregador);
            } catch (error) {
                console.error('❌ Erro ao enviar notificações de entrega:', error);
            }
        } else if (dbStatus === 'ready_for_pickup' && order.tipoEntrega === 'pickup') {
                        // Notificação para retirada
                        try {
                                console.log('🏪 Enviando notificação de retirada...');
                                // Mapear campos para compatibilidade com messageService
                                const orderForNotification = {
                                    ...order,
                                    totalPrice: order.precoTotal,
                                    deliveryType: order.tipoEntrega,
                                    paymentMethod: order.metodoPagamento,
                                    user: order.usuario ? {
                                        username: order.usuario.nomeUsuario,
                                        phone: order.usuario.telefone
                                    } : null,
                                    orderItems: order.itens_pedido,
                                    shippingStreet: order.ruaEntrega,
                                    shippingNumber: order.numeroEntrega,
                                    shippingComplement: order.complementoEntrega,
                                    shippingNeighborhood: order.bairroEntrega,
                                    shippingPhone: order.usuario?.telefone
                                };
                                await sendPickupNotification(orderForNotification);
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
            telefone: true,
            enderecos: {
              where: {
                padrao: true
              },
              select: {
                id: true,
                rua: true,
                numero: true,
                complemento: true,
                bairro: true,
                padrao: true
              }
            }
          }
        },
        itens_pedido: {
          include: { 
            produto: {
              include: {
                imagens_produto: true
              }
            },
            complementos: {
              include: {
                complemento: {
                  select: {
                    id: true,
                    nome: true,
                    imagemUrl: true
                  }
                }
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
      paymentMethod: order.metodoPagamento,
      createdAt: order.criadoEm,
      shippingStreet: order.ruaEntrega,
      shippingNumber: order.numeroEntrega,
      shippingComplement: order.complementoEntrega,
      shippingNeighborhood: order.bairroEntrega,
      shippingPhone: order.telefoneEntrega,
      deliveryFee: order.taxaEntrega,
      notes: order.observacoes,
      user: order.usuario ? {
        id: order.usuario.id,
        username: order.usuario.nomeUsuario,
        email: order.usuario.email,
        phone: order.usuario.telefone,
        enderecos: order.usuario.enderecos ? order.usuario.enderecos.map(addr => ({
          id: addr.id,
          street: addr.rua,
          number: addr.numero,
          complement: addr.complemento,
          neighborhood: addr.bairro,
          isDefault: addr.padrao
        })) : []
      } : null,
      orderitem: order.itens_pedido.map(item => ({
        id: item.id,
        orderId: item.pedidoId,
        productId: item.produtoId,
        quantity: item.quantidade,
        priceAtOrder: item.precoNoPedido,
        selectedOptionsSnapshot: item.opcoesSelecionadas,
        complements: item.complementos ? item.complementos.map(comp => ({
          id: comp.complemento.id,
          name: comp.complemento.nome,
          imageUrl: comp.complemento.imagemUrl
        })) : [],
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
        method: order.pagamento.metodo,
        status: order.pagamento.status,
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
