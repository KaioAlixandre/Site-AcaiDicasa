const express = require('express');
const router = express.Router();
const { authenticateToken, authorize, prisma } = require('../../middleware');

// POST /deliverers - Criar novo entregador
router.post('/', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Nome e telefone são obrigatórios' });
    }

    // Verificar se já existe entregador com o mesmo telefone
    const existingDeliverer = await prisma.deliverer.findFirst({
      where: { phone }
    });

    if (existingDeliverer) {
      return res.status(400).json({ message: 'Já existe um entregador com este telefone' });
    }

    const deliverer = await prisma.deliverer.create({
      data: {
        name,
        phone,
        email: email || null
      }
    });

    res.status(201).json(deliverer);
  } catch (error) {
    console.error('Erro ao criar entregador:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// DELETE /deliverers/:id - Remover entregador
router.delete('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o entregador existe
    const existingDeliverer = await prisma.deliverer.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingDeliverer) {
      return res.status(404).json({ message: 'Entregador não encontrado' });
    }

    await prisma.deliverer.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Entregador removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover entregador:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;