const express = require('express');
const router = express.Router();
const { authenticateToken, authorize, prisma } = require('../../middleware');

// GET /orders - Listar pedidos
router.get('/', authenticateToken, async (req, res) => {
  try {
    let whereClause = {};
    
    // Se não for admin, mostrar apenas pedidos do próprio usuário
    if (req.user.role !== 'admin') {
      whereClause.userId = req.user.id;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(orders);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /orders - Criar novo pedido
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { items, total, address, paymentMethod, deliveryOption, notes } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Itens do pedido são obrigatórios' });
    }

    if (!total || !address || !paymentMethod) {
      return res.status(400).json({ message: 'Total, endereço e método de pagamento são obrigatórios' });
    }

    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        total: parseFloat(total),
        status: 'PENDING',
        address,
        paymentMethod,
        deliveryOption: deliveryOption || 'DELIVERY',
        notes,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: parseFloat(item.price),
            options: item.options
          }))
        }
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
        }
      }
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;