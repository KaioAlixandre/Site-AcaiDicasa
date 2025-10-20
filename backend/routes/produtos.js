const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken, authorize } = require('./auth');
const multer = require('multer');
const path = require('path');

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

// Rota para listar todos os produtos
router.get('/', async (req, res) => {
    console.log('📦 GET /api/products: Requisição para listar todos os produtos.');
    try {
        const products = await prisma.produto.findMany({
            include: { imagens_produto: true, categoria: true }
        });
        console.log(products); // Veja no terminal se category está preenchido
        res.json(products);
    } catch (err) {
        console.error('❌ GET /api/products: Erro ao buscar produtos:', err.message);
        res.status(500).json({ message: 'Erro ao buscar produtos.', error: err.message });
    }
});

// Rota para adicionar um novo produto (apenas para usuários administradores)
router.post('/add', authenticateToken, authorize('admin'), upload.single('image'), async (req, res) => {
  const { nome, preco, descricao, categoriaId } = req.body;
  console.log('Categoria recebida:', categoriaId);
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  console.log(`✨ POST /api/products/add: Requisição para adicionar novo produto: ${nome}.`);
  console.log('Arquivo recebido:', req.file);
  try {
        const newProduct = await prisma.produto.create({
            data: {
                nome,
                preco: parseFloat(preco),
                descricao,
                categoriaId:  parseInt(categoriaId),
                imagens_produto: imageUrl
                  ? { create: [{ url: imageUrl }] }
                  : undefined
            },
            include: {
                imagens_produto: true,
                categoria: true
            }
        });
        console.log(`✅ POST /api/products/add: Novo produto adicionado com sucesso: ${newProduct.nome}.`);
        res.status(201).json(newProduct);
    } catch (err) {
        console.error('❌ POST /api/products/add: Erro ao adicionar produto:', err.message);
        res.status(500).json({ message: 'Erro ao adicionar produto.', error: err.message });
    }
});

// Rota para atualizar um produto existente (apenas para administradores)
router.put('/update/:id', authenticateToken, authorize('admin'), upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { nome, preco, descricao, categoriaId, ativo } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    console.log(`🔄 PUT /api/products/update/${id}: Requisição para atualizar produto.`);
    console.log('Dados recebidos:', { nome, preco, descricao, categoriaId, ativo });
    console.log('Arquivo de imagem:', req.file);
    
    try {
        // Prepare the update data
        const updateData = {
            nome,
            preco: parseFloat(preco),
            descricao,
            ativo: ativo === 'true' || ativo === true
        };

        // Add categoriaId if provided
        if (categoriaId) {
            updateData.categoriaId = parseInt(categoriaId);
        }

        const updatedProduct = await prisma.produto.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                imagens_produto: true,
                categoria: true
            }
        });

        // If new image is uploaded, update the product images
        if (imageUrl) {
            // Delete existing images
            await prisma.imagem_produto.deleteMany({
                where: { produtoId: parseInt(id) }
            });
            
            // Create new image
            await prisma.imagem_produto.create({
                data: {
                    url: imageUrl,
                    produtoId: parseInt(id)
                }
            });
        }

        // Fetch the updated product with all relations
        const finalProduct = await prisma.produto.findUnique({
            where: { id: parseInt(id) },
            include: {
                imagens_produto: true,
                categoria: true
            }
        });

        console.log(`✅ PUT /api/products/update/${id}: Produto ${id} atualizado com sucesso.`);
        res.json(finalProduct);
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
        await prisma.produto.delete({
            where: { id: parseInt(id) }
        });
        console.log(`✅ DELETE /api/products/delete/${id}: Produto ${id} deletado com sucesso.`);
        res.json({ message: 'Produto deletado com sucesso.' });
    } catch (err) {
        console.error(`❌ DELETE /api/products/delete/${id}: Erro ao deletar produto:`, err.message);
        res.status(500).json({ message: 'Erro ao deletar produto.', error: err.message });
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
                imagens_produto: true,
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
        console.log(`✅ GET /api/products/category/${categoriaId}: Produtos da categoria ${categoriaId} listados com sucesso (${products.length} encontrados).`);
        res.status(200).json(products);
    } catch (err) {
        console.error(`❌ GET /api/products/category/${categoriaId}: Erro ao buscar produtos por categoria:`, err.message);
        res.status(500).json({ message: "Erro ao buscar produtos por categoria.", error: err.message });
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
        res.status(201).json(newCategory);
    } catch (err) {
        console.error('❌ POST /api/products/categories/add: Erro ao adicionar categoria:', err.message);
        res.status(500).json({ message: 'Erro ao adicionar categoria.', error: err.message });
    }
});

router.get('/categories', async (req, res) => {
    console.log('📂 GET /api/products/categories: Requisição para listar todas as categorias de produtos.');
    try {
        const categories = await prisma.categoria_produto.findMany();
        console.log(`✅ GET /api/products/categories: Categorias listadas com sucesso (${categories.length} encontradas).`);
        res.status(200).json(categories);
    } catch (err) {
        console.error('❌ GET /api/products/categories: Erro ao buscar categorias:', err.message);
        res.status(500).json({ message: 'Erro ao buscar categorias.', error: err.message });
    }
});

module.exports = router;
