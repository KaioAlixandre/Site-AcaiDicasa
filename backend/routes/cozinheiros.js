const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken, authorize } = require('./auth');

console.log('🚀 [CozinheirosRoutes] Módulo de rotas de cozinheiros carregado');

// Função para remover máscara do telefone (garantir apenas dígitos)
const removePhoneMask = (phone) => {
    if (!phone) return phone;
    return phone.toString().replace(/\D/g, '');
};

// Listar todos os cozinheiros
router.get('/', authenticateToken, authorize('admin'), async (req, res) => {
  console.log('🔍 [GET /api/cozinheiros] Buscando cozinheiros');
  
  try {
    const cozinheiros = await prisma.cozinheiro.findMany({
      orderBy: {
        criadoEm: 'desc'
      }
    });
    
    console.log(`✅ [GET /api/cozinheiros] ${cozinheiros.length} cozinheiros encontrados`);
    res.json(cozinheiros);
  } catch (error) {
    console.error('❌ [GET /api/cozinheiros] Erro:', error);
    res.status(500).json({ error: 'Erro ao buscar cozinheiros' });
  }
});

// Criar novo cozinheiro
router.post('/', authenticateToken, authorize('admin'), async (req, res) => {
  console.log('➕ [POST /api/cozinheiros] Criando novo cozinheiro');
  console.log('📥 Dados recebidos:', req.body);
  
  const { nome, telefone, ativo } = req.body;
  
  if (!nome || !telefone) {
    return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
  }
  
  // Remover máscara do telefone antes de salvar
  const telefoneLimpo = removePhoneMask(telefone);
  
  try {
    const cozinheiro = await prisma.cozinheiro.create({
      data: {
        nome,
        telefone: telefoneLimpo,
        ativo: ativo !== undefined ? ativo : true
      }
    });
    
    console.log(`✅ [POST /api/cozinheiros] Cozinheiro criado: ${cozinheiro.nome} (ID: ${cozinheiro.id})`);
    res.status(201).json(cozinheiro);
  } catch (error) {
    console.error('❌ [POST /api/cozinheiros] Erro:', error);
    res.status(500).json({ error: 'Erro ao criar cozinheiro' });
  }
});

// Atualizar cozinheiro
router.put('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  const { id } = req.params;
  console.log(`🔄 [PUT /api/cozinheiros/${id}] Atualizando cozinheiro`);
  console.log('📥 Dados recebidos:', req.body);
  
  const { nome, telefone, ativo } = req.body;
  
  // Remover máscara do telefone antes de salvar
  const telefoneLimpo = removePhoneMask(telefone);
  
  try {
    const cozinheiro = await prisma.cozinheiro.update({
      where: { id: parseInt(id) },
      data: {
        nome,
        telefone: telefoneLimpo,
        ativo
      }
    });
    
    console.log(`✅ [PUT /api/cozinheiros/${id}] Cozinheiro atualizado: ${cozinheiro.nome}`);
    res.json(cozinheiro);
  } catch (error) {
    console.error(`❌ [PUT /api/cozinheiros/${id}] Erro:`, error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Cozinheiro não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao atualizar cozinheiro' });
  }
});

// Excluir cozinheiro
router.delete('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ [DELETE /api/cozinheiros/${id}] Excluindo cozinheiro`);
  
  try {
    await prisma.cozinheiro.delete({
      where: { id: parseInt(id) }
    });
    
    console.log(`✅ [DELETE /api/cozinheiros/${id}] Cozinheiro excluído com sucesso`);
    res.json({ message: 'Cozinheiro excluído com sucesso' });
  } catch (error) {
    console.error(`❌ [DELETE /api/cozinheiros/${id}] Erro:`, error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Cozinheiro não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao excluir cozinheiro' });
  }
});

module.exports = router;
