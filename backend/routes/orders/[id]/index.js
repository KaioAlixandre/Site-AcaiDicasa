const express = require('express');
const router = express.Router();
const { authenticateToken, authorize, prisma } = require('../../../middleware');
const { sendDeliveryNotifications } = require('../../../services/messageService');

// GET /orders/:id - Buscar pedido específico
router.get('/', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    
    let whereClause = { id: orderId };
    
    // Se não for admin, verificar se o pedido pertence ao usuário
    if (req.user.role !== 'admin') {
      whereClause.userId = req.user.id;
    }

    const order = await prisma.order.findFirst({
      where: whereClause,
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
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

    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    res.json(order);
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// PUT /orders/:id - Atualizar status do pedido
router.put('/', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status, delivererId } = req.body;

    // Verificar se o pedido existe
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!existingOrder) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    // Validar status se fornecido
    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }

    // Validar entregador se fornecido
    if (delivererId) {
      const deliverer = await prisma.deliverer.findUnique({
        where: { id: parseInt(delivererId) }
      });
      
      if (!deliverer || !deliverer.active) {
        return res.status(400).json({ message: 'Entregador não encontrado ou inativo' });
      }
    }

    // Atualizar pedido
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: status || existingOrder.status,
        delivererId: delivererId !== undefined ? (delivererId ? parseInt(delivererId) : null) : existingOrder.delivererId,
        updatedAt: new Date()
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
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

    // Enviar notificações se o status mudou para "OUT_FOR_DELIVERY" e há um entregador
    if (status === 'OUT_FOR_DELIVERY' && order.deliverer) {
      try {
        console.log('📱 Enviando notificações de entrega...');
        await sendDeliveryNotifications(order, order.deliverer);
      } catch (error) {
        console.error('❌ Erro ao enviar notificações:', error);
        // Não falha a operação se as notificações falharem
      }
    }

    res.json(order);
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;