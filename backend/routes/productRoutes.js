const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken, authorize } = require('./authRoutes');

// Rota para listar todos os produtos
router.get('/', async (req, res) => {
    console.log('📦 GET /api/products: Requisição para listar todos os produtos.');
    try {
        const products = await prisma.product.findMany();
        console.log(`✅ GET /api/products: Produtos listados com sucesso (${products.length} encontrados).`);
        res.json(products);
    } catch (err) {
        console.error('❌ GET /api/products: Erro ao buscar produtos:', err.message);
        res.status(500).json({ message: 'Erro ao buscar produtos.', error: err.message });
    }
});

// Rota para adicionar um novo produto (apenas para usuários administradores)
router.post('/add', authenticateToken, authorize('admin'), async (req, res) => {
    const { name, price, description } = req.body;
    console.log(`✨ POST /api/products/add: Requisição para adicionar novo produto: ${name}.`);
    try {
        const newProduct = await prisma.product.create({
            data: { name, price, description }
        });
        console.log(`✅ POST /api/products/add: Novo produto adicionado com sucesso: ${newProduct.name}.`);
        res.status(201).json(newProduct);
    } catch (err) {
        console.error('❌ POST /api/products/add: Erro ao adicionar produto:', err.message);
        res.status(500).json({ message: 'Erro ao adicionar produto.', error: err.message });
    }
});

// Rota para atualizar um produto existente (apenas para administradores)
router.put('/update/:id', authenticateToken, authorize('admin'), async (req, res) => {
    const { id } = req.params;
    const { name, price, description } = req.body;
    console.log(`🔄 PUT /api/products/update/${id}: Requisição para atualizar produto.`);
    try {
        const updatedProduct = await prisma.product.update({
            where: { id: parseInt(id) },
            data: { name, price, description }
        });
        console.log(`✅ PUT /api/products/update/${id}: Produto ${id} atualizado com sucesso.`);
        res.json(updatedProduct);
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

module.exports = router;
