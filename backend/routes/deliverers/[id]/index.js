const express = require('express');
const router = express.Router();
const { authenticateToken, authorize, prisma } = require('../../../middleware');

// GET /deliverers - Listar todos os entregadores
router.get('/', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const deliverers = await prisma.deliverer.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(deliverers);
  } catch (error) {
    console.error('Erro ao buscar entregadores:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// PUT /deliverers/:id - Atualizar entregador
router.put('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, isActive } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Nome e telefone são obrigatórios' });
    }

    // Verificar se o entregador existe
    const existingDeliverer = await prisma.deliverer.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingDeliverer) {
      return res.status(404).json({ message: 'Entregador não encontrado' });
    }

    // Verificar se outro entregador já tem o mesmo telefone
    const delivererWithSamePhone = await prisma.deliverer.findFirst({
      where: { 
        phone,
        id: { not: parseInt(id) }
      }
    });

    if (delivererWithSamePhone) {
      return res.status(400).json({ message: 'Já existe um entregador com este telefone' });
    }

    const deliverer = await prisma.deliverer.update({
      where: { id: parseInt(id) },
      data: {
        name,
        phone,
        email: email || null,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.json(deliverer);
  } catch (error) {
    console.error('Erro ao atualizar entregador:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// PATCH /deliverers/:id/toggle - Ativar/Desativar entregador
router.patch('/:id/toggle', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const deliverer = await prisma.deliverer.findUnique({
      where: { id: parseInt(id) }
    });

    if (!deliverer) {
      return res.status(404).json({ message: 'Entregador não encontrado' });
    }

    const updatedDeliverer = await prisma.deliverer.update({
      where: { id: parseInt(id) },
      data: { isActive: !deliverer.isActive }
    });

    res.json(updatedDeliverer);
  } catch (error) {
    console.error('Erro ao alterar status do entregador:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;