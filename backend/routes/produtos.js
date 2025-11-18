const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken, authorize } = require('./auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração do destino e nome do arquivo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // pasta onde as imagens serão salvas
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // nome único
  }
});
const upload = multer({ storage });

// ========== ROTAS ESPECÍFICAS (devem vir antes de rotas com parâmetros dinâmicos) ==========

// Rota para listar todas as categorias
router.get('/categories', async (req, res) => {
    console.log('📂 GET /api/products/categories: Requisição para listar todas as categorias de produtos.');
    try {
        const categories = await prisma.categoria_produto.findMany();
        // Transformar o campo 'nome' para 'name' para compatibilidade com o frontend
        const transformedCategories = categories.map(cat => ({
            id: cat.id,
            name: cat.nome
        }));
        console.log(`✅ GET /api/products/categories: Categorias listadas com sucesso (${categories.length} encontradas).`);
        res.status(200).json(transformedCategories);
    } catch (err) {
        console.error('❌ GET /api/products/categories: Erro ao buscar categorias:', err.message);
        res.status(500).json({ message: 'Erro ao buscar categorias.', error: err.message });
    }
});

// Rota para adicionar uma nova categoria (apenas para administradores)
router.post('/categories/add', authenticateToken, authorize('admin'), async (req, res) => {
    const { nome } = req.body;
    console.log(`✨ POST /api/products/categories/add: Requisição para adicionar nova categoria: ${nome}.`);
    // Validação básica
    if (!nome) {
        console.warn('⚠️ POST /api/products/categories/add: Nome da categoria ausente.');
        return res.status(400).json({ message: 'Nome da categoria é obrigatório.' });
    }
    try {
        const newCategory = await prisma.categoria_produto.create({
            data: { nome },
        });
        console.log(`✅ POST /api/products/categories/add: Nova categoria adicionada com sucesso: ${newCategory.nome}.`);
        // Transformar o campo 'nome' para 'name' para compatibilidade com o frontend
        const transformedCategory = {
            id: newCategory.id,
            name: newCategory.nome
        };
        res.status(201).json(transformedCategory);
    } catch (err) {
        console.error('❌ POST /api/products/categories/add: Erro ao adicionar categoria:', err.message);
        res.status(500).json({ message: 'Erro ao adicionar categoria.', error: err.message });
    }
});

// Rota para buscar produtos por categoria
router.get('/category/:categoriaId', async (req, res) => {
    const { categoriaId } = req.params;
    console.log(`📂 GET /api/products/category/${categoriaId}: Requisição para buscar produtos por categoria.`);
    try {
        const products = await prisma.produto.findMany({
            where: {
                categoriaId: parseInt(categoriaId)
            },
            include: {
                categoria: true,
                imagens_produto: {
                    orderBy: { id: 'asc' }
                },
                opcoes_produto: {
                    include: {
                        valores_opcao: true,
                    },
                },
            },
        });
        if (products.length === 0) {
            console.warn(`⚠️ GET /api/products/category/${categoriaId}: Nenhum produto encontrado para a categoria: ${categoriaId}.`);
            return res.status(404).json({ message: "Nenhum produto encontrado para esta categoria." });
        }
        
        // Transformar campos do português para inglês
        const transformedProducts = products.map(product => ({
            id: product.id,
            name: product.nome,
            description: product.descricao || '',
            price: product.preco,
            categoryId: product.categoriaId,
            isActive: product.ativo,
            isFeatured: product.destaque || false,
            createdAt: product.criadoEm || new Date(),
            updatedAt: product.atualizadoEm || new Date(),
            category: product.categoria ? {
                id: product.categoria.id,
                name: product.categoria.nome
            } : null,
            images: (product.imagens_produto || []).map(img => ({
                id: img.id,
                url: img.url,
                productId: img.produtoId
            })),
            mainImage: product.imagens_produto?.[0]?.url || null,
            options: product.opcoes_produto || []
        }));
        
        console.log(`✅ GET /api/products/category/${categoriaId}: Produtos da categoria ${categoriaId} listados com sucesso (${products.length} encontrados).`);
        res.status(200).json(transformedProducts);
    } catch (err) {
        console.error(`❌ GET /api/products/category/${categoriaId}: Erro ao buscar produtos por categoria:`, err.message);
        res.status(500).json({ message: "Erro ao buscar produtos por categoria.", error: err.message });
    }
});

// Rota para adicionar um novo produto (apenas para usuários administradores)
router.post('/add', authenticateToken, authorize('admin'), upload.array('images', 5), async (req, res) => {
  const { nome, preco, descricao, categoriaId, isFeatured } = req.body;
  console.log('Categoria recebida:', categoriaId);
  console.log('Destaque:', isFeatured);
  const imageFiles = req.files || [];
  console.log(`✨ POST /api/products/add: Requisição para adicionar novo produto: ${nome}.`);
  console.log('Arquivos recebidos:', imageFiles.length);
  console.log('Arquivos detalhes:', imageFiles.map(f => f.filename));
  
  try {
        // Criar array de imagens
        const imagesData = imageFiles.map((file) => ({
          url: `/uploads/${file.filename}`
        }));
        
        console.log('Imagens a serem criadas:', imagesData);

        const newProduct = await prisma.produto.create({
            data: {
                nome,
                preco: parseFloat(preco),
                descricao,
                categoriaId: parseInt(categoriaId),
                destaque: isFeatured === 'true' || isFeatured === true,
                imagens_produto: imagesData.length > 0
                  ? { create: imagesData }
                  : undefined
            },
            include: {
              imagens_produto: true
            }
        });
        console.log(`✅ POST /api/products/add: Novo produto adicionado com sucesso: ${newProduct.nome}.`);
        console.log('🖼️ Imagens criadas:', newProduct.imagens_produto);
        res.status(201).json({ 
          message: 'Produto adicionado com sucesso.', 
          product: newProduct 
        });
    } catch (err) {
        console.error('❌ POST /api/products/add: Erro ao adicionar produto:', err.message);
        res.status(500).json({ message: 'Erro ao adicionar produto.', error: err.message });
    }
});

// Rota para atualizar um produto existente (apenas para administradores)
router.put('/update/:id', authenticateToken, authorize('admin'), upload.array('images', 5), async (req, res) => {
    const { id } = req.params;
    const { nome, preco, descricao, categoriaId, ativo, isFeatured } = req.body;
    const imageFiles = req.files || [];
    console.log(`🔄 PUT /api/products/update/${id}: Requisição para atualizar produto.`);
    console.log('📝 Dados recebidos:', { nome, preco, descricao, categoriaId, ativo });
    console.log('🖼️ Arquivos de imagem recebidos:', imageFiles.length);
    if (imageFiles.length > 0) {
      console.log('🖼️ Detalhes das imagens:', imageFiles.map(f => ({ filename: f.filename, path: f.path })));
    }
    
    try {
        // Verificar se o produto existe
        const existingProduct = await prisma.produto.findUnique({
            where: { id: parseInt(id) },
            include: { imagens_produto: true }
        });
        
        if (!existingProduct) {
            console.warn(`⚠️ PUT /api/products/update/${id}: Produto não encontrado.`);
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        
        // Preparar os dados de atualização
        const updateData = {
            nome,
            preco: parseFloat(preco),
            descricao,
            categoriaId: parseInt(categoriaId),
            ativo: ativo === 'true' || ativo === true,
            destaque: isFeatured === 'true' || isFeatured === true
        };
        
        // Se houver novas imagens, deletar as antigas e adicionar as novas
        if (imageFiles.length > 0) {
            console.log(`🗑️ Deletando ${existingProduct.imagens_produto.length} imagens antigas...`);
            
            // Deletar arquivos físicos das imagens antigas
            existingProduct.imagens_produto.forEach(img => {
                const filePath = path.join(__dirname, '..', img.url);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️ Arquivo deletado: ${filePath}`);
                }
            });
            
            // Deletar registros de imagens antigas no banco
            await prisma.imagem_produto.deleteMany({
                where: { produtoId: parseInt(id) }
            });
            
            // Criar novos registros de imagens
            const imagesData = imageFiles.map((file) => ({
                url: `/uploads/${file.filename}`
            }));
            
            updateData.imagens_produto = { create: imagesData };
            console.log(`✨ ${imageFiles.length} novas imagens serão adicionadas`);
        }
        
        // Atualizar o produto
        const updatedProduct = await prisma.produto.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: { imagens_produto: true }
        });
        
        console.log(`✅ PUT /api/products/update/${id}: Produto atualizado com sucesso: ${updatedProduct.nome}.`);
        console.log('🖼️ Imagens atuais:', updatedProduct.imagens_produto);
        res.status(200).json({ 
            message: 'Produto atualizado com sucesso.', 
            product: updatedProduct 
        });
    } catch (err) {
        console.error(`❌ PUT /api/products/update/${id}: Erro ao atualizar produto:`, err.message);
        res.status(500).json({ message: 'Erro ao atualizar produto.', error: err.message });
    }
});

// Rota para deletar um produto (apenas para administradores)
router.delete('/delete/:id', authenticateToken, authorize('admin'), async (req, res) => {
    const { id } = req.params;
    console.log(`🗑️ DELETE /api/products/delete/${id}: Requisição para deletar produto.`);
    try {
        await prisma.produto.delete({ where: { id: parseInt(id) } });
        console.log(`✅ DELETE /api/products/delete/${id}: Produto deletado com sucesso.`);
        res.status(200).json({ message: 'Produto deletado com sucesso.' });
    } catch (err) {
        console.error(`❌ DELETE /api/products/delete/${id}: Erro ao deletar produto:`, err.message);
        res.status(500).json({ message: 'Erro ao deletar produto.', error: err.message });
    }
});

// ========== ROTAS GENÉRICAS (devem vir por último) ==========

// Rota para listar todos os produtos
router.get('/', async (req, res) => {
    console.log('📦 GET /api/products: Requisição para listar todos os produtos.');
    try {
        const products = await prisma.produto.findMany({
            include: { 
                imagens_produto: {
                    orderBy: { id: 'asc' } // Primeira imagem inserida será a principal
                }, 
                categoria: true 
            }
        });
        
        // Transformar campos do português para inglês
        const transformedProducts = products.map(product => ({
            id: product.id,
            name: product.nome,
            description: product.descricao || '',
            price: product.preco,
            categoryId: product.categoriaId,
            isActive: product.ativo,
            isFeatured: product.destaque || false,
            createdAt: product.criadoEm || new Date(),
            updatedAt: product.atualizadoEm || new Date(),
            category: product.categoria ? {
                id: product.categoria.id,
                name: product.categoria.nome
            } : null,
            images: (product.imagens_produto || []).map(img => ({
                id: img.id,
                url: img.url,
                productId: img.produtoId
            })),
            // Adicionar campo para facilitar acesso à imagem principal
            mainImage: product.imagens_produto?.[0]?.url || null
        }));
        
        console.log(`✅ Retornando ${transformedProducts.length} produtos com imagens`);
        if (transformedProducts.length > 0) {
            console.log('🖼️ Exemplo produto:', {
                id: transformedProducts[0].id,
                name: transformedProducts[0].name,
                images: transformedProducts[0].images,
                mainImage: transformedProducts[0].mainImage
            });
        }
        res.json(transformedProducts);
    } catch (err) {
        console.error('❌ GET /api/products: Erro ao buscar produtos:', err.message);
        res.status(500).json({ message: 'Erro ao buscar produtos.', error: err.message });
    }
});

// Rota para buscar um produto específico por ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`🔍 GET /api/products/${id}: Requisição para buscar produto específico.`);
    
    try {
        const product = await prisma.produto.findUnique({
            where: { id: parseInt(id) },
            include: { 
                imagens_produto: {
                    orderBy: { id: 'asc' }
                }, 
                categoria: true 
            }
        });

        if (!product) {
            console.warn(`⚠️ GET /api/products/${id}: Produto não encontrado.`);
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        // Transformar campos do português para inglês
        const transformedProduct = {
            id: product.id,
            name: product.nome,
            description: product.descricao || '',
            price: product.preco,
            categoryId: product.categoriaId,
            isActive: product.ativo,
            isFeatured: product.destaque || false,
            createdAt: product.criadoEm || new Date(),
            updatedAt: product.atualizadoEm || new Date(),
            category: product.categoria ? {
                id: product.categoria.id,
                name: product.categoria.nome
            } : null,
            images: (product.imagens_produto || []).map(img => ({
                id: img.id,
                url: img.url,
                productId: img.produtoId
            })),
            mainImage: product.imagens_produto?.[0]?.url || null
        };

        console.log(`✅ Produto ${id} encontrado:`, transformedProduct.name);
        res.json(transformedProduct);
    } catch (err) {
        console.error(`❌ GET /api/products/${id}: Erro ao buscar produto:`, err.message);
        res.status(500).json({ message: 'Erro ao buscar produto.', error: err.message });
    }
});

module.exports = router;
