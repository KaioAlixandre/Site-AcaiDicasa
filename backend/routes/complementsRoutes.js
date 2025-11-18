const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Middlewares de autenticação e autorização
const { authenticateToken, authorize } = require('./auth');

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/complements';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

// 🍓 GET - Listar todos os complementos (apenas ativos por padrão)
router.get('/', async (req, res) => {
  console.log('📋 GET /complements - Listando complementos...');
  
  try {
    const { includeInactive } = req.query;
    
    const complements = await prisma.complemento.findMany({
      where: includeInactive === 'true' ? {} : { ativo: true },
      orderBy: { nome: 'asc' },
      include: {
        categoria: true
      }
    });

    // Transformar campos do português para inglês
    const transformedComplements = complements.map(complement => ({
      id: complement.id,
      name: complement.nome,
      imageUrl: complement.imagemUrl,
      isActive: complement.ativo,
      categoryId: complement.categoriaId,
      category: complement.categoria ? {
        id: complement.categoria.id,
        name: complement.categoria.nome
      } : null,
      createdAt: complement.criadoEm,
      updatedAt: complement.atualizadoEm
    }));

    console.log(`✅ Encontrados ${complements.length} complementos`);
    res.json(transformedComplements);
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
      where: { id: parseInt(id) },
      include: {
        categoria: true
      }
    });

    if (!complement) {
      console.log('❌ Complemento não encontrado');
      return res.status(404).json({ message: 'Complemento não encontrado' });
    }

    // Transformar campos do português para inglês
    const transformedComplement = {
      id: complement.id,
      name: complement.nome,
      imageUrl: complement.imagemUrl,
      isActive: complement.ativo,
      categoryId: complement.categoriaId,
      category: complement.categoria ? {
        id: complement.categoria.id,
        name: complement.categoria.nome
      } : null,
      createdAt: complement.criadoEm,
      updatedAt: complement.atualizadoEm
    };

    console.log(`✅ Complemento encontrado: ${complement.nome}`);
    res.json(transformedComplement);
  } catch (error) {
    console.error('❌ Erro ao buscar complemento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ➕ POST - Criar novo complemento (APENAS ADMIN)
router.post('/', authenticateToken, authorize('admin'), upload.single('image'), async (req, res) => {
  const { nome, ativo = true, categoriaId } = req.body;
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

    // Processar imagem se foi enviada
    let imagemUrl = null;
    if (req.file) {
      imagemUrl = `/uploads/complements/${req.file.filename}`;
    }

    // Criar o complemento
    const complement = await prisma.complemento.create({
      data: {
        nome: nome.trim(),
        imagemUrl: imagemUrl,
        ativo: Boolean(ativo),
        categoriaId: categoriaId ? parseInt(categoriaId) : null
      },
      include: {
        categoria: true
      }
    });

    // Transformar campos do português para inglês
    const transformedComplement = {
      id: complement.id,
      name: complement.nome,
      imageUrl: complement.imagemUrl,
      isActive: complement.ativo,
      categoryId: complement.categoriaId,
      category: complement.categoria ? {
        id: complement.categoria.id,
        name: complement.categoria.nome
      } : null,
      createdAt: complement.criadoEm,
      updatedAt: complement.atualizadoEm
    };

    console.log(`✅ Complemento criado com ID: ${complement.id}`);
    res.status(201).json(transformedComplement);
  } catch (error) {
    console.error('❌ Erro ao criar complemento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ✏️ PUT - Atualizar complemento (APENAS ADMIN)
router.put('/:id', authenticateToken, authorize('admin'), upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { nome, ativo, categoriaId } = req.body;
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

    // Processar nova imagem se foi enviada
    if (req.file) {
      // Deletar imagem antiga se existir
      if (existingComplement.imagemUrl) {
        const oldImagePath = path.join(__dirname, '..', existingComplement.imagemUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.imagemUrl = `/uploads/complements/${req.file.filename}`;
    }

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

    if (categoriaId !== undefined) {
      updateData.categoriaId = categoriaId ? parseInt(categoriaId) : null;
    }

    // Atualizar o complemento
    const complement = await prisma.complemento.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        categoria: true
      }
    });

    // Transformar campos do português para inglês
    const transformedComplement = {
      id: complement.id,
      name: complement.nome,
      imageUrl: complement.imagemUrl,
      isActive: complement.ativo,
      categoryId: complement.categoriaId,
      category: complement.categoria ? {
        id: complement.categoria.id,
        name: complement.categoria.nome
      } : null,
      createdAt: complement.criadoEm,
      updatedAt: complement.atualizadoEm
    };

    console.log(`✅ Complemento atualizado: ${complement.nome}`);
    res.json(transformedComplement);
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

    // Deletar imagem se existir
    if (existingComplement.imagemUrl) {
      const imagePath = path.join(__dirname, '..', existingComplement.imagemUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Deletar o complemento
    await prisma.complemento.delete({
      where: { id: parseInt(id) }
    });

    // Transformar campos do português para inglês
    const transformedComplement = {
      id: existingComplement.id,
      name: existingComplement.nome,
      imageUrl: existingComplement.imagemUrl,
      isActive: existingComplement.ativo,
      createdAt: existingComplement.criadoEm,
      updatedAt: existingComplement.atualizadoEm
    };

    console.log(`✅ Complemento deletado: ${existingComplement.nome}`);
    res.json({ message: 'Complemento deletado com sucesso', deletedComplement: transformedComplement });
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

    // Transformar campos do português para inglês
    const transformedComplement = {
      id: complement.id,
      name: complement.nome,
      imageUrl: complement.imagemUrl,
      isActive: complement.ativo,
      createdAt: complement.criadoEm,
      updatedAt: complement.atualizadoEm
    };

    const status = complement.ativo ? 'ativado' : 'desativado';
    console.log(`✅ Complemento ${status}: ${complement.nome}`);
    res.json({ 
      message: `Complemento ${status} com sucesso`, 
      complement: transformedComplement 
    });
  } catch (error) {
    console.error('❌ Erro ao alternar status do complemento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;