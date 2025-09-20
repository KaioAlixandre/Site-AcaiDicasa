const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateToken, authorize, prisma } = require('../../../middleware');

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// GET /products/:id - Buscar produto específico
router.get('/', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: true,
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    res.json(product);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// PUT /products/:id - Atualizar produto
router.put('/', authenticateToken, authorize('admin'), upload.array('images'), async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { name, price, description, categoryId } = req.body;

    // Verificar se o produto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    // Atualizar produto
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name: name || existingProduct.name,
        price: price ? parseFloat(price) : existingProduct.price,
        description: description !== undefined ? description : existingProduct.description,
        categoryId: categoryId !== undefined ? (categoryId ? parseInt(categoryId) : null) : existingProduct.categoryId
      }
    });

    // Upload de novas imagens se fornecidas
    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map(file => 
        prisma.productImage.create({
          data: {
            url: `/uploads/${file.filename}`,
            productId: product.id
          }
        })
      );
      await Promise.all(imagePromises);
    }

    // Buscar produto atualizado com imagens
    const updatedProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: true,
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;