const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authenticateToken = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Listar todas as categorias de sabores
router.get('/', async (req, res) => {
  console.log('📂 GET /api/flavor-categories: Requisição para listar todas as categorias de sabores.');
  try {
    const categories = await prisma.categoria_sabor.findMany({
      orderBy: { nome: 'asc' },
      include: {
        _count: {
          select: { sabores: true }
        }
      }
    });
    
    const transformedCategories = categories.map(cat => ({
      id: cat.id,
      name: cat.nome,
      flavorsCount: cat._count.sabores,
      createdAt: cat.criadoEm,
      updatedAt: cat.atualizadoEm
    }));
    
    console.log(`✅ GET /api/flavor-categories: ${categories.length} categorias listadas com sucesso.`);
    res.status(200).json(transformedCategories);
  } catch (err) {
    console.error('❌ GET /api/flavor-categories: Erro ao buscar categorias:', err.message);
    res.status(500).json({ message: 'Erro ao buscar categorias.', error: err.message });
  }
});

// Criar nova categoria de sabor (admin)
router.post('/', authenticateToken, authorize('admin'), async (req, res) => {
  const { name } = req.body;
  console.log(`✨ POST /api/flavor-categories: Requisição para criar categoria: ${name}.`);
  
  if (!name || !name.trim()) {
    console.warn('⚠️ POST /api/flavor-categories: Nome da categoria ausente.');
    return res.status(400).json({ message: 'Nome da categoria é obrigatório.' });
  }

  try {
    const newCategory = await prisma.categoria_sabor.create({
      data: { nome: name.trim() }
    });
    
    console.log(`✅ POST /api/flavor-categories: Categoria criada com sucesso: ${newCategory.nome}.`);
    res.status(201).json({
      id: newCategory.id,
      name: newCategory.nome,
      createdAt: newCategory.criadoEm,
      updatedAt: newCategory.atualizadoEm
    });
  } catch (err) {
    console.error('❌ POST /api/flavor-categories: Erro ao criar categoria:', err.message);
    
    if (err.code === 'P2002') {
      return res.status(400).json({ message: 'Já existe uma categoria com este nome.' });
    }
    
    res.status(500).json({ message: 'Erro ao criar categoria.', error: err.message });
  }
});

// Atualizar categoria de sabor (admin)
router.put('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  console.log(`🔄 PUT /api/flavor-categories/${id}: Requisição para atualizar categoria.`);
  
  if (!name || !name.trim()) {
    console.warn('⚠️ PUT /api/flavor-categories: Nome da categoria ausente.');
    return res.status(400).json({ message: 'Nome da categoria é obrigatório.' });
  }

  try {
    const updatedCategory = await prisma.categoria_sabor.update({
      where: { id: parseInt(id) },
      data: { nome: name.trim() }
    });
    
    console.log(`✅ PUT /api/flavor-categories/${id}: Categoria atualizada com sucesso.`);
    res.status(200).json({
      id: updatedCategory.id,
      name: updatedCategory.nome,
      createdAt: updatedCategory.criadoEm,
      updatedAt: updatedCategory.atualizadoEm
    });
  } catch (err) {
    console.error(`❌ PUT /api/flavor-categories/${id}: Erro ao atualizar categoria:`, err.message);
    
    if (err.code === 'P2002') {
      return res.status(400).json({ message: 'Já existe uma categoria com este nome.' });
    }
    
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Categoria não encontrada.' });
    }
    
    res.status(500).json({ message: 'Erro ao atualizar categoria.', error: err.message });
  }
});

// Deletar categoria de sabor (admin)
router.delete('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ DELETE /api/flavor-categories/${id}: Requisição para deletar categoria.`);
  
  try {
    // Verificar se há sabores nesta categoria
    const flavorsCount = await prisma.sabor.count({
      where: { categoriaId: parseInt(id) }
    });
    
    if (flavorsCount > 0) {
      console.warn(`⚠️ DELETE /api/flavor-categories/${id}: Categoria possui ${flavorsCount} sabores.`);
      return res.status(400).json({ 
        message: `Não é possível deletar. Esta categoria possui ${flavorsCount} sabor(es) associado(s).` 
      });
    }
    
    await prisma.categoria_sabor.delete({
      where: { id: parseInt(id) }
    });
    
    console.log(`✅ DELETE /api/flavor-categories/${id}: Categoria deletada com sucesso.`);
    res.status(200).json({ message: 'Categoria deletada com sucesso.' });
  } catch (err) {
    console.error(`❌ DELETE /api/flavor-categories/${id}: Erro ao deletar categoria:`, err.message);
    
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Categoria não encontrada.' });
    }
    
    res.status(500).json({ message: 'Erro ao deletar categoria.', error: err.message });
  }
});

module.exports = router;

