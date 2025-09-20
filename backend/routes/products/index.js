const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateToken, authorize, prisma } = require('../../middleware');

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // pasta onde as imagens serão salvas
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // nome único
  }
});
const upload = multer({ storage });

// GET /products - Listar produtos
router.get('/', async (req, res) => {
    console.log('📦 GET /api/products: Requisição para listar todos os produtos.');
    try {
        const products = await prisma.product.findMany({
            include: { images: true, category: true }
        });
        console.log(products); // Veja no terminal se category está preenchido
        res.json(products);
    } catch (err) {
        console.error('❌ GET /api/products: Erro ao buscar produtos:', err.message);
        res.status(500).json({ message: 'Erro ao buscar produtos.', error: err.message });
    }
});

// POST /products - Criar novo produto
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
                images: true,
                category: true
            }
        });
        console.log(`✅ POST /api/products/add: Novo produto adicionado com sucesso: ${newProduct.name}.`);
        res.status(201).json(newProduct);
    } catch (err) {
        console.error('❌ POST /api/products/add: Erro ao adicionar produto:', err.message);
        res.status(500).json({ message: 'Erro ao adicionar produto.', error: err.message });
    }
});

// DELETE /products/:id - Remover produto
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

module.exports = router;