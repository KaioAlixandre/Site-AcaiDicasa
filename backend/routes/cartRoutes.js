const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken } = require('./authRoutes');

// Rota para adicionar um produto ao carrinho
router.post('/add', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { produtoId, quantity } = req.body;

    console.log(`➡️ [POST /api/cart/add] Requisição para adicionar item. Usuário ID: ${userId}, Produto ID: ${produtoId}, Quantidade: ${quantity}.`);

    if (!produtoId || !quantity) {
        console.warn('⚠️ [POST /api/cart/add] Falha ao adicionar item: ID do produto ou quantidade ausente.');
        return res.status(400).json({ message: 'ID do produto e quantidade são obrigatórios.' });
    }

    try {
        let cart = await prisma.carrinho.findUnique({
            where: { usuarioId: userId },
            include: { itens: true }
        });

        if (!cart) {
            console.log(`🛒 [POST /api/cart/add] Carrinho não encontrado para o usuário ${userId}. Criando novo carrinho.`);
            cart = await prisma.carrinho.create({
                data: {
                    usuarioId: userId,
                },
            });
        }

        const existingCartItem = await prisma.item_carrinho.findFirst({
            where: {
                carrinhoId: cart.id,
                produtoId: produtoId,
            },
        });

        if (existingCartItem) {
            const updatedItem = await prisma.item_carrinho.update({
                where: { id: existingCartItem.id },
                data: { quantidade: existingCartItem.quantidade + quantity },
            });
            console.log(`🔄 [POST /api/cart/add] Quantidade do item no carrinho atualizada. Item ID: ${updatedItem.id}`);
            return res.status(200).json({ message: 'Quantidade do item atualizada com sucesso.', cartItem: updatedItem });
        } else {
            const newCartItem = await prisma.item_carrinho.create({
                data: {
                    carrinhoId: cart.id,
                    produtoId: produtoId,
                    quantidade: quantity,
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
        const cart = await prisma.carrinho.findUnique({
            where: { usuarioId: userId },
            include: {
                itens: {
                    include: {
                        produto: true
                    }
                }
            }
        });

        if (!cart) {
            console.warn(`⚠️ [GET /api/cart] Carrinho não encontrado para o usuário ${userId}. Retornando carrinho vazio.`);
            return res.status(200).json({ items: [], cartTotal: 0 });
        }

        const cartItemsWithTotals = cart.itens.map(item => {
            // Verificar se é produto personalizado
            let itemPrice = item.produto.preco; // Preço padrão
            
            if (item.opcoesSelecionadas) {
                // Verificar açaí personalizado
                if (item.opcoesSelecionadas.customAcai) {
                    itemPrice = item.opcoesSelecionadas.customAcai.value;
                    console.log(`🎨 Açaí personalizado encontrado: ${item.produto.nome} - Valor customizado: R$ ${itemPrice}`);
                }
                // Verificar sorvete personalizado
                else if (item.opcoesSelecionadas.customSorvete) {
                    itemPrice = item.opcoesSelecionadas.customSorvete.value;
                    console.log(`🍦 Sorvete personalizado encontrado: ${item.produto.nome} - Valor customizado: R$ ${itemPrice}`);
                }
                // Verificar outros produtos personalizados
                else if (item.opcoesSelecionadas.customProduct) {
                    itemPrice = item.opcoesSelecionadas.customProduct.value;
                    console.log(`🎨 Produto personalizado encontrado: ${item.produto.nome} - Valor customizado: R$ ${itemPrice}`);
                }
            }
            
            return {
                ...item,
                totalPrice: item.quantidade * itemPrice
            };
        });

        const cartTotal = cartItemsWithTotals.reduce((total, item) => total + item.totalPrice, 0);

        console.log(`✅ [GET /api/cart] Carrinho do usuário ${userId} encontrado com ${cart.itens.length} itens.`);
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
        const updatedItem = await prisma.item_carrinho.update({
            where: { id: parseInt(cartItemId) },
            data: { quantidade: parseInt(quantity) },
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
        await prisma.item_carrinho.delete({
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
        const cart = await prisma.carrinho.findUnique({
            where: { usuarioId: userId },
        });

        if (!cart) {
            console.warn(`⚠️ [DELETE /api/cart/clear] Carrinho não encontrado para o usuário ${userId}. Nada a ser esvaziado.`);
            return res.status(200).json({ message: 'Carrinho já está vazio.' });
        }

        await prisma.item_carrinho.deleteMany({
            where: { carrinhoId: cart.id },
        });

        console.log(`🧹 [DELETE /api/cart/clear] Carrinho do usuário ${userId} esvaziado com sucesso.`);
        res.status(200).json({ message: 'Carrinho esvaziado com sucesso.' });
    } catch (err) {
        console.error(`❌ [DELETE /api/cart/clear] Erro ao esvaziar o carrinho para o usuário ${userId}:`, err.message);
        res.status(500).json({ message: 'Erro ao esvaziar o carrinho.', error: err.message });
    }
});

// Rota para adicionar açaí personalizado ao carrinho
router.post('/add-custom-acai', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { value, selectedComplements, complementNames, quantity } = req.body;

    console.log(`➡️ [POST /api/cart/add-custom-acai] Requisição para adicionar açaí personalizado. Usuário ID: ${userId}, Valor: R$${value}, Quantidade: ${quantity}.`);

    if (!value || !quantity) {
        console.warn('⚠️ [POST /api/cart/add-custom-acai] Falha: Valor ou quantidade ausente.');
        return res.status(400).json({ message: 'Valor e quantidade são obrigatórios.' });
    }

    try {
        // Buscar o produto "Açaí Personalizado"
        const customAcaiProduct = await prisma.produto.findFirst({
            where: { nome: 'Açaí Personalizado' }
        });

        if (!customAcaiProduct) {
            console.error('❌ [POST /api/cart/add-custom-acai] Produto "Açaí Personalizado" não encontrado.');
            return res.status(404).json({ message: 'Produto açaí personalizado não encontrado.' });
        }

        // Buscar ou criar carrinho
        let cart = await prisma.carrinho.findUnique({
            where: { usuarioId: userId },
            include: { itens: true }
        });

        if (!cart) {
            console.log(`🛒 [POST /api/cart/add-custom-acai] Criando novo carrinho para usuário ${userId}.`);
            cart = await prisma.carrinho.create({
                data: { usuarioId: userId },
            });
        }

        // Criar estrutura de opções personalizadas
        const opcoesSelecionadas = {
            customAcai: {
                value: value,
                selectedComplements: selectedComplements || [],
                complementNames: complementNames || []
            }
        };

        // Adicionar item do açaí personalizado ao carrinho
        // Cada açaí personalizado é único, então sempre criar novo item
        const cartItem = await prisma.item_carrinho.create({
            data: {
                carrinhoId: cart.id,
                produtoId: customAcaiProduct.id,
                quantidade: quantity,
                opcoesSelecionadas: opcoesSelecionadas
            }
        });

        console.log(`✅ [POST /api/cart/add-custom-acai] Açaí personalizado adicionado com sucesso. Item ID: ${cartItem.id}`);
        res.status(201).json({ 
            message: 'Açaí personalizado adicionado ao carrinho com sucesso.', 
            cartItem: cartItem 
        });

    } catch (err) {
        console.error(`❌ [POST /api/cart/add-custom-acai] Erro ao adicionar açaí personalizado para o usuário ${userId}:`, err.message);
        res.status(500).json({ message: 'Erro ao adicionar açaí personalizado ao carrinho.', error: err.message });
    }
});

// Rota genérica para adicionar produtos personalizados ao carrinho
router.post('/add-custom-produto', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { produtoName, value, selectedComplements, complementNames, quantity } = req.body;

    console.log(`➡️ [POST /api/cart/add-custom-produto] Requisição para adicionar ${produtoName}. Usuário ID: ${userId}, Valor: R$${value}, Quantidade: ${quantity}.`);

    if (!produtoName || !value || !quantity) {
        console.warn('⚠️ [POST /api/cart/add-custom-produto] Falha: Nome do produto, valor ou quantidade ausente.');
        return res.status(400).json({ message: 'Nome do produto, valor e quantidade são obrigatórios.' });
    }

    try {
        // Buscar o produto personalizado
        const customProduct = await prisma.produto.findFirst({
            where: { nome: produtoName }
        });

        if (!customProduct) {
            console.error(`❌ [POST /api/cart/add-custom-produto] Produto "${produtoName}" não encontrado.`);
            return res.status(404).json({ message: `Produto ${produtoName} não encontrado.` });
        }

        // Buscar ou criar carrinho
        let cart = await prisma.carrinho.findUnique({
            where: { usuarioId: userId },
            include: { itens: true }
        });

        if (!cart) {
            console.log(`🛒 [POST /api/cart/add-custom-produto] Criando novo carrinho para usuário ${userId}.`);
            cart = await prisma.carrinho.create({
                data: { usuarioId: userId },
            });
        }

        // Determinar o tipo de produto para o opcoesSelecionadas
        const produtoType = produtoName.toLowerCase().includes('açaí') ? 'customAcai' : 
                           produtoName.toLowerCase().includes('sorvete') ? 'customSorvete' : 'customProduct';

        // Criar estrutura de opções personalizadas
        const opcoesSelecionadas = {
            [produtoType]: {
                value: value,
                selectedComplements: selectedComplements || [],
                complementNames: complementNames || []
            }
        };

        // Adicionar item do produto personalizado ao carrinho
        // Cada produto personalizado é único, então sempre criar novo item
        const cartItem = await prisma.item_carrinho.create({
            data: {
                carrinhoId: cart.id,
                produtoId: customProduct.id,
                quantidade: quantity,
                opcoesSelecionadas: opcoesSelecionadas
            }
        });

        console.log(`✅ [POST /api/cart/add-custom-produto] ${produtoName} adicionado com sucesso. Item ID: ${cartItem.id}`);
        res.status(201).json({ 
            message: `${produtoName} adicionado ao carrinho com sucesso.`, 
            cartItem: cartItem 
        });

    } catch (err) {
        console.error(`❌ [POST /api/cart/add-custom-produto] Erro ao adicionar ${produtoName} para o usuário ${userId}:`, err.message);
        res.status(500).json({ message: `Erro ao adicionar ${produtoName} ao carrinho.`, error: err.message });
    }
});

// Rota para adicionar açaí personalizado ao carrinho (mantida para compatibilidade)
router.post('/add-custom-acai', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { value, selectedComplements, complementNames, quantity } = req.body;

    console.log(`➡️ [POST /api/cart/add-custom-acai] Requisição para adicionar açaí personalizado. Usuário ID: ${userId}, Valor: R$${value}, Quantidade: ${quantity}.`);

    if (!value || !quantity) {
        console.warn('⚠️ [POST /api/cart/add-custom-acai] Falha: Valor ou quantidade ausente.');
        return res.status(400).json({ message: 'Valor e quantidade são obrigatórios.' });
    }

    try {
        // Buscar o produto "Açaí Personalizado"
        const customAcaiProduct = await prisma.produto.findFirst({
            where: { nome: 'Açaí Personalizado' }
        });

        if (!customAcaiProduct) {
            console.error('❌ [POST /api/cart/add-custom-acai] Produto "Açaí Personalizado" não encontrado.');
            return res.status(404).json({ message: 'Produto açaí personalizado não encontrado.' });
        }

        // Buscar ou criar carrinho
        let cart = await prisma.carrinho.findUnique({
            where: { usuarioId: userId },
            include: { itens: true }
        });

        if (!cart) {
            console.log(`🛒 [POST /api/cart/add-custom-acai] Criando novo carrinho para usuário ${userId}.`);
            cart = await prisma.carrinho.create({
                data: { usuarioId: userId },
            });
        }

        // Criar estrutura de opções personalizadas
        const opcoesSelecionadas = {
            customAcai: {
                value: value,
                selectedComplements: selectedComplements || [],
                complementNames: complementNames || []
            }
        };

        // Adicionar item do açaí personalizado ao carrinho
        // Cada açaí personalizado é único, então sempre criar novo item
        const cartItem = await prisma.item_carrinho.create({
            data: {
                carrinhoId: cart.id,
                produtoId: customAcaiProduct.id,
                quantidade: quantity,
                opcoesSelecionadas: opcoesSelecionadas
            }
        });

        console.log(`✅ [POST /api/cart/add-custom-acai] Açaí personalizado adicionado com sucesso. Item ID: ${cartItem.id}`);
        res.status(201).json({ 
            message: 'Açaí personalizado adicionado ao carrinho com sucesso.', 
            cartItem: cartItem 
        });

    } catch (err) {
        console.error(`❌ [POST /api/cart/add-custom-acai] Erro ao adicionar açaí personalizado para o usuário ${userId}:`, err.message);
        res.status(500).json({ message: 'Erro ao adicionar açaí personalizado ao carrinho.', error: err.message });
    }
});

module.exports = router;
