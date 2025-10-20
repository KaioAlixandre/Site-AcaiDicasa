const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

// Middlewares de autenticação e autorização
const { authenticateToken, authorize } = require('./auth');

// 🍓 GET - Listar todos os complementos (apenas ativos por padrão)
router.get('/', async (req, res) => {
  console.log('📋 GET /complements - Listando complementos...');
  
  try {
    const { includeInactive } = req.query;
    
    const complements = await prisma.complemento.findMany({
      where: includeInactive === 'true' ? {} : { ativo: true },
      orderBy: { nome: 'asc' }
    });

    console.log(`✅ Encontrados ${complements.length} complementos`);
    res.json(complements);
  } catch (error) {
    console.error('❌ Erro ao buscar complementos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// 🔍 GET - Buscar complemento por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`🔍 GET /complements/${id} - Buscando complemento específico...`);
  
  try {
    const complement = await prisma.complemento.findUnique({
      where: { id: parseInt(id) }
    });

    if (!complement) {
      console.log('❌ Complemento não encontrado');
      return res.status(404).json({ message: 'Complemento não encontrado' });
    }

    console.log(`✅ Complemento encontrado: ${complement.nome}`);
    res.json(complement);
  } catch (error) {
    console.error('❌ Erro ao buscar complemento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ➕ POST - Criar novo complemento (APENAS ADMIN)
router.post('/', authenticateToken, authorize('admin'), async (req, res) => {
  const { nome, ativo = true } = req.body;
  console.log(`➕ POST /complements - Usuário autenticado:`, {
    id: req.user?.id,
    username: req.user?.username,
    role: req.user?.role
  });
  console.log(`➕ POST /complements - Criando complemento: ${nome}`);
  
  try {
    // Validação
    if (!nome || nome.trim().length === 0) {
      console.log('❌ Nome do complemento é obrigatório');
      return res.status(400).json({ message: 'Nome do complemento é obrigatório' });
    }

    if (nome.length > 100) {
      console.log('❌ Nome muito longo');
      return res.status(400).json({ message: 'Nome deve ter no máximo 100 caracteres' });
    }

    // Verificar se já existe um complemento com o mesmo nome
    const existingComplement = await prisma.complemento.findFirst({
      where: { nome: nome.trim() }
    });

    if (existingComplement) {
      console.log('❌ Complemento já existe');
      return res.status(409).json({ message: 'Já existe um complemento com este nome' });
    }

    // Criar o complemento
    const complement = await prisma.complemento.create({
      data: {
        nome: nome.trim(),
        ativo: Boolean(ativo)
      }
    });

    console.log(`✅ Complemento criado com ID: ${complement.id}`);
    res.status(201).json(complement);
  } catch (error) {
    console.error('❌ Erro ao criar complemento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ✏️ PUT - Atualizar complemento (APENAS ADMIN)
router.put('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  const { id } = req.params;
  const { nome, ativo } = req.body;
  console.log(`✏️ PUT /complements/${id} - Admin ${req.user.username} atualizando complemento...`);
  
  try {
    // Verificar se o complemento existe
    const existingComplement = await prisma.complemento.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingComplement) {
      console.log('❌ Complemento não encontrado');
      return res.status(404).json({ message: 'Complemento não encontrado' });
    }

    // Preparar dados para atualização
    const updateData = {};

    if (nome !== undefined) {
      if (!nome || nome.trim().length === 0) {
        console.log('❌ Nome do complemento não pode estar vazio');
        return res.status(400).json({ message: 'Nome do complemento não pode estar vazio' });
      }

      if (nome.length > 100) {
        console.log('❌ Nome muito longo');
        return res.status(400).json({ message: 'Nome deve ter no máximo 100 caracteres' });
      }

      // Verificar se já existe outro complemento com o mesmo nome
      const duplicateComplement = await prisma.complemento.findFirst({
        where: { 
          nome: nome.trim(),
          id: { not: parseInt(id) }
        }
      });

      if (duplicateComplement) {
        console.log('❌ Nome já existe em outro complemento');
        return res.status(409).json({ message: 'Já existe outro complemento com este nome' });
      }

      updateData.nome = nome.trim();
    }

    if (ativo !== undefined) {
      updateData.ativo = Boolean(ativo);
    }

    // Atualizar o complemento
    const complement = await prisma.complemento.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    console.log(`✅ Complemento atualizado: ${complement.nome}`);
    res.json(complement);
  } catch (error) {
    console.error('❌ Erro ao atualizar complemento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// 🗑️ DELETE - Deletar complemento (APENAS ADMIN)
router.delete('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ DELETE /complements/${id} - Admin ${req.user.username} deletando complemento...`);
  
  try {
    // Verificar se o complemento existe
    const existingComplement = await prisma.complemento.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingComplement) {
      console.log('❌ Complemento não encontrado');
      return res.status(404).json({ message: 'Complemento não encontrado' });
    }

    // Deletar o complemento
    await prisma.complemento.delete({
      where: { id: parseInt(id) }
    });

    console.log(`✅ Complemento deletado: ${existingComplement.nome}`);
    res.json({ message: 'Complemento deletado com sucesso', deletedComplement: existingComplement });
  } catch (error) {
    console.error('❌ Erro ao deletar complemento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// 🔄 PATCH - Alternar status ativo/inativo (APENAS ADMIN)
router.patch('/:id/toggle', authenticateToken, authorize('admin'), async (req, res) => {
  const { id } = req.params;
  console.log(`🔄 PATCH /complements/${id}/toggle - Admin ${req.user.username} alternando status...`);
  
  try {
    // Verificar se o complemento existe
    const existingComplement = await prisma.complemento.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingComplement) {
      console.log('❌ Complemento não encontrado');
      return res.status(404).json({ message: 'Complemento não encontrado' });
    }

    // Alternar o status
    const complement = await prisma.complemento.update({
      where: { id: parseInt(id) },
      data: { ativo: !existingComplement.ativo }
    });

    const status = complement.ativo ? 'ativado' : 'desativado';
    console.log(`✅ Complemento ${status}: ${complement.nome}`);
    res.json({ 
      message: `Complemento ${status} com sucesso`, 
      complement 
    });
  } catch (error) {
    console.error('❌ Erro ao alternar status do complemento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;