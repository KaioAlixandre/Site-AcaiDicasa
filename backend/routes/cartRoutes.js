const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken } = require('./authRoutes');

// Rota para adicionar um produto ao carrinho
router.post('/add', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    console.log(`➡️ [POST /api/cart/add] Requisição para adicionar item. Usuário ID: ${userId}, Produto ID: ${productId}, Quantidade: ${quantity}.`);

    if (!productId || !quantity) {
        console.warn('⚠️ [POST /api/cart/add] Falha ao adicionar item: ID do produto ou quantidade ausente.');
        return res.status(400).json({ message: 'ID do produto e quantidade são obrigatórios.' });
    }

    try {
        let cart = await prisma.cart.findUnique({
            where: { userId: userId },
            include: { items: true }
        });

        if (!cart) {
            console.log(`🛒 [POST /api/cart/add] Carrinho não encontrado para o usuário ${userId}. Criando novo carrinho.`);
            cart = await prisma.cart.create({
                data: {
                    userId: userId,
                },
            });
        }

        const existingCartItem = await prisma.cartItem.findUnique({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId: productId,
                },
            },
        });

        if (existingCartItem) {
            const updatedItem = await prisma.cartItem.update({
                where: { id: existingCartItem.id },
                data: { quantity: existingCartItem.quantity + quantity },
            });
            console.log(`🔄 [POST /api/cart/add] Quantidade do item no carrinho atualizada. Item ID: ${updatedItem.id}`);
            return res.status(200).json({ message: 'Quantidade do item atualizada com sucesso.', cartItem: updatedItem });
        } else {
            const newCartItem = await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId: productId,
                    quantity: quantity,
                },
            });
            console.log(`✅ [POST /api/cart/add] Novo item adicionado ao carrinho. Item ID: ${newCartItem.id}`);
            return res.status(201).json({ message: 'Item adicionado ao carrinho com sucesso.', cartItem: newCartItem });
        }
    } catch (err) {
        console.error('❌ [POST /api/cart/add] Erro ao adicionar produto ao carrinho:', err.message);
        res.status(500).json({ message: 'Erro ao adicionar produto ao carrinho.', error: err.message });
    }
});

// Rota para buscar o carrinho do usuário
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    console.log(`🔍 [GET /api/cart] Requisição para buscar o carrinho do usuário ID: ${userId}.`);

    try {
        const cart = await prisma.cart.findUnique({
            where: { userId: userId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!cart) {
            console.warn(`⚠️ [GET /api/cart] Carrinho não encontrado para o usuário ${userId}. Retornando carrinho vazio.`);
            return res.status(200).json({ items: [], cartTotal: 0 });
        }

        const cartItemsWithTotals = cart.items.map(item => ({
            ...item,
            totalPrice: item.quantity * item.product.price
        }));

        const cartTotal = cartItemsWithTotals.reduce((total, item) => total + item.totalPrice, 0);

        console.log(`✅ [GET /api/cart] Carrinho do usuário ${userId} encontrado com ${cart.items.length} itens.`);
        res.status(200).json({
            items: cartItemsWithTotals,
            cartTotal: cartTotal
        });
    } catch (err) {
        console.error(`❌ [GET /api/cart] Erro ao buscar o carrinho do usuário ${userId}:`, err.message);
        res.status(500).json({ message: 'Erro ao buscar o carrinho.', error: err.message });
    }
});

// Rota para atualizar a quantidade de um item no carrinho
router.put('/update/:cartItemId', authenticateToken, async (req, res) => {
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    console.log(`🔄 [PUT /api/cart/update/${cartItemId}] Requisição para atualizar item. Item ID: ${cartItemId}, Nova Quantidade: ${quantity}.`);

    if (quantity === undefined) {
        console.warn('⚠️ [PUT /api/cart/update] Quantidade não fornecida.');
        return res.status(400).json({ message: 'A quantidade é obrigatória.' });
    }

    try {
        const updatedItem = await prisma.cartItem.update({
            where: { id: parseInt(cartItemId) },
            data: { quantity: parseInt(quantity) },
        });
        console.log(`✅ [PUT /api/cart/update/${cartItemId}] Quantidade do item atualizada com sucesso. Item ID: ${updatedItem.id}`);
        res.status(200).json({ message: 'Quantidade do item atualizada com sucesso.', cartItem: updatedItem });
    } catch (err) {
        console.error(`❌ [PUT /api/cart/update/${cartItemId}] Erro ao atualizar a quantidade do item:`, err.message);
        res.status(500).json({ message: 'Erro ao atualizar a quantidade do item.', error: err.message });
    }
});

// Rota para remover um item do carrinho
router.delete('/remove/:cartItemId', authenticateToken, async (req, res) => {
    const { cartItemId } = req.params;
    console.log(`🗑️ [DELETE /api/cart/remove/${cartItemId}] Requisição para remover item. Item ID: ${cartItemId}.`);

    try {
        await prisma.cartItem.delete({
            where: { id: parseInt(cartItemId) },
        });
        console.log(`✅ [DELETE /api/cart/remove/${cartItemId}] Item removido do carrinho com sucesso.`);
        res.status(200).json({ message: 'Item removido do carrinho com sucesso.' });
    } catch (err) {
        console.error(`❌ [DELETE /api/cart/remove/${cartItemId}] Erro ao remover item do carrinho:`, err.message);
        res.status(500).json({ message: 'Erro ao remover o item do carrinho.', error: err.message });
    }
});

// Rota para esvaziar o carrinho
router.delete('/clear', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    console.log(`➡️ [DELETE /api/cart/clear] Requisição para esvaziar carrinho. Usuário ID: ${userId}.`);

    try {
        const cart = await prisma.cart.findUnique({
            where: { userId: userId },
        });

        if (!cart) {
            console.warn(`⚠️ [DELETE /api/cart/clear] Carrinho não encontrado para o usuário ${userId}. Nada a ser esvaziado.`);
            return res.status(200).json({ message: 'Carrinho já está vazio.' });
        }

        await prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
        });

        console.log(`🧹 [DELETE /api/cart/clear] Carrinho do usuário ${userId} esvaziado com sucesso.`);
        res.status(200).json({ message: 'Carrinho esvaziado com sucesso.' });
    } catch (err) {
        console.error(`❌ [DELETE /api/cart/clear] Erro ao esvaziar o carrinho para o usuário ${userId}:`, err.message);
        res.status(500).json({ message: 'Erro ao esvaziar o carrinho.', error: err.message });
    }
});

module.exports = router;
