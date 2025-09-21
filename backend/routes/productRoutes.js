const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken, authorize } = require('./authRoutes');
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
        const products = await prisma.product.findMany({
            include: { productimage: true, productcategory: true }
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
  const { name, price, description, categoryId } = req.body;
  console.log('Categoria recebida:', categoryId);
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  console.log(`✨ POST /api/products/add: Requisição para adicionar novo produto: ${name}.`);
  console.log('Arquivo recebido:', req.file);
  try {
        const newProduct = await prisma.product.create({
            data: {
                name,
                price: parseFloat(price),
                description,
                categoryId:  parseInt(categoryId),
                images: imageUrl
                  ? { create: [{ url: imageUrl }] }
                  : undefined
            },
            include: {
                productimage: true,
                productcategory: true
            }
        });
        console.log(`✅ POST /api/products/add: Novo produto adicionado com sucesso: ${newProduct.name}.`);
        res.status(201).json(newProduct);
    } catch (err) {
        console.error('❌ POST /api/products/add: Erro ao adicionar produto:', err.message);
        res.status(500).json({ message: 'Erro ao adicionar produto.', error: err.message });
    }
});

// Rota para atualizar um produto existente (apenas para administradores)
router.put('/update/:id', authenticateToken, authorize('admin'), upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { name, price, description, categoryId, isActive } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    console.log(`🔄 PUT /api/products/update/${id}: Requisição para atualizar produto.`);
    console.log('Dados recebidos:', { name, price, description, categoryId, isActive });
    console.log('Arquivo de imagem:', req.file);
    
    try {
        // Prepare the update data
        const updateData = {
            name,
            price: parseFloat(price),
            description,
            isActive: isActive === 'true' || isActive === true
        };

        // Add categoryId if provided
        if (categoryId) {
            updateData.categoryId = parseInt(categoryId);
        }

        const updatedProduct = await prisma.product.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                productimage: true,
                productcategory: true
            }
        });

        // If new image is uploaded, update the product images
        if (imageUrl) {
            // Delete existing images
            await prisma.productImage.deleteMany({
                where: { productId: parseInt(id) }
            });
            
            // Create new image
            await prisma.productImage.create({
                data: {
                    url: imageUrl,
                    productId: parseInt(id)
                }
            });
        }

        // Fetch the updated product with all relations
        const finalProduct = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            include: {
                productimage: true,
                productcategory: true
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
        await prisma.product.delete({
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
router.get('/category/:categoryId', async (req, res) => {
    const { categoryId } = req.params;
    console.log(`📂 GET /api/products/category/${categoryId}: Requisição para buscar produtos por categoria.`);
    try {
        const products = await prisma.product.findMany({
            where: {
                categoryId: parseInt(categoryId)
            },
            include: {
                category: true,
                images: true,
                options: {
                    include: {
                        values: true,
                    },
                },
            },
        });
        if (products.length === 0) {
            console.warn(`⚠️ GET /api/products/category/${categoryId}: Nenhum produto encontrado para a categoria: ${categoryId}.`);
            return res.status(404).json({ message: "Nenhum produto encontrado para esta categoria." });
        }
        console.log(`✅ GET /api/products/category/${categoryId}: Produtos da categoria ${categoryId} listados com sucesso (${products.length} encontrados).`);
        res.status(200).json(products);
    } catch (err) {
        console.error(`❌ GET /api/products/category/${categoryId}: Erro ao buscar produtos por categoria:`, err.message);
        res.status(500).json({ message: "Erro ao buscar produtos por categoria.", error: err.message });
    }
});

// Rota para adicionar uma nova categoria (apenas para administradores)
router.post('/categories/add', authenticateToken, authorize('admin'), async (req, res) => {
    const { name } = req.body;
    console.log(`✨ POST /api/products/categories/add: Requisição para adicionar nova categoria: ${name}.`);
    // Validação básica
    if (!name) {
        console.warn('⚠️ POST /api/products/categories/add: Nome da categoria ausente.');
        return res.status(400).json({ message: 'Nome da categoria é obrigatório.' });
    }
    try {
        const newCategory = await prisma.productcategory.create({
            data: { name },
        });
        console.log(`✅ POST /api/products/categories/add: Nova categoria adicionada com sucesso: ${newCategory.name}.`);
        res.status(201).json(newCategory);
    } catch (err) {
        console.error('❌ POST /api/products/categories/add: Erro ao adicionar categoria:', err.message);
        res.status(500).json({ message: 'Erro ao adicionar categoria.', error: err.message });
    }
});

router.get('/categories', async (req, res) => {
    console.log('📂 GET /api/products/categories: Requisição para listar todas as categorias de produtos.');
    try {
        const categories = await prisma.productcategory.findMany();
        console.log(`✅ GET /api/products/categories: Categorias listadas com sucesso (${categories.length} encontradas).`);
        res.status(200).json(categories);
    } catch (err) {
        console.error('❌ GET /api/products/categories: Erro ao buscar categorias:', err.message);
        res.status(500).json({ message: 'Erro ao buscar categorias.', error: err.message });
    }
});

module.exports = router;
