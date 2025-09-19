const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken, authorize } = require('./authRoutes'); // Importa o middleware 'authorize'

// Rota para criar um pedido a partir do carrinho
router.post('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    console.log(`[POST /api/orders] Recebida requisição para criar um pedido. Usuário ID: ${userId}`);

    try {
        // Encontrar o carrinho e o usuário com seus endereços em uma única busca
        const [cart, user] = await Promise.all([
            prisma.cart.findUnique({
                where: { userId: userId },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            }),
            prisma.user.findUnique({
                where: { id: userId },
                include: {
                    addresses: true
                }
            })
        ]);

        if (!cart || cart.items.length === 0) {
            console.warn(`[POST /api/orders] Carrinho do usuário ${userId} está vazio.`);
            return res.status(400).json({ message: 'Carrinho vazio. Adicione itens antes de criar um pedido.' });
        }

        // Encontrar o endereço padrão (ou o primeiro, se não houver um padrão)
        const shippingAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0];
        
        if (!shippingAddress) {
            console.warn(`[POST /api/orders] Usuário ${userId} não possui endereço de entrega cadastrado.`);
            return res.status(400).json({
                message: 'Nenhum endereço de entrega encontrado. Por favor, cadastre um para continuar.',
                redirectPath: '/api/auth/profile/address'
            });
        }
        
        // Calcular o preço total do pedido
        const totalPrice = cart.items.reduce((acc, item) => {
            return acc + (item.quantity * item.product.price);
        }, 0);

        console.log(`[POST /api/orders] Criando pedido para o usuário ${userId} com preço total de ${totalPrice.toFixed(2)}.`);

        // Iniciar uma transação para garantir que tudo seja feito ou nada seja feito
        const newOrder = await prisma.$transaction(async (tx) => {
            // 1. Criar o pedido, incluindo o telefone e o endereço de entrega
            const order = await tx.order.create({
                data: {
                    userId: userId,
                    totalPrice: totalPrice,
                    status: 'pending_payment',
                    shippingStreet: shippingAddress.street,
                    shippingNumber: shippingAddress.number,
                    shippingComplement: shippingAddress.complement,
                    shippingNeighborhood: shippingAddress.neighborhood,
                    orderItems: {
                        createMany: {
                            data: cart.items.map(item => ({
                                productId: item.productId,
                                quantity: item.quantity,
                                priceAtOrder: item.product.price,
                            }))
                        }
                    }
                },
                include: {
                    orderItems: true
                }
            });

            // 2. Esvaziar o carrinho do usuário
            await tx.cartItem.deleteMany({
                where: { cartId: cart.id }
            });

            return order;
        });

        console.log(`[POST /api/orders] Pedido ID ${newOrder.id} criado com sucesso para o usuário ${userId}.`);
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
                orderItems: {
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
    const { status } = req.body;
    console.log(`[PUT /api/orders/status/${orderId}] Recebida requisição de admin para atualizar status para: "${status}"`);

    // Adicione uma validação para garantir que o status é válido
    const validStatuses = ['pending_payment', 'being_prepared', 'on_the_way', 'delivered', 'canceled'];
    if (!validStatuses.includes(status)) {
        console.warn(`[PUT /api/orders/status/${orderId}] Tentativa de usar status inválido: "${status}".`);
        return res.status(400).json({ message: 'Status inválido. Por favor, use um dos seguintes: ' + validStatuses.join(', ') });
    }

    try {
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status: status },
        });

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
            data: { status: 'canceled' },
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
        user: true,
        orderItems: {
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
