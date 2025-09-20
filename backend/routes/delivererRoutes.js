const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken, authorize } = require('./authRoutes');

// GET - Listar todos os entregadores
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

// POST - Criar novo entregador
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

// PUT - Atualizar entregador
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

// DELETE - Remover entregador
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

// PATCH - Ativar/Desativar entregador
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