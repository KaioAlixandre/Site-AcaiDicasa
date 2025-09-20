const express = require('express');
const router = express.Router();
const { authenticateToken, authorize, prisma } = require('../../../middleware');

// GET /auth/users - Listar usuários (apenas admin)
router.get('/users', authenticateToken, authorize('admin'), async (req, res) => {
    console.log('📋 [GET /auth/users] Buscando lista de usuários (admin).');
    
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
                addresses: true,
                orders: {
                    select: {
                        totalPrice: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        console.log(`✅ [GET /auth/users] ${users.length} usuários encontrados.`);
        res.json(users);
    } catch (err) {
        console.error('❌ [GET /auth/users] Erro interno:', err);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// GET /auth/profile - Obter perfil do usuário logado
router.get('/profile', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    console.log(`👤 [GET /auth/profile] Buscando perfil do usuário ID: ${userId}`);

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
                addresses: {
                    orderBy: { isDefault: 'desc' }
                }
            }
        });

        if (!user) {
            console.warn(`⚠️ [GET /auth/profile] Usuário não encontrado: ID ${userId}`);
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        console.log(`✅ [GET /auth/profile] Perfil encontrado para usuário ID: ${userId}`);
        res.json(user);
    } catch (err) {
        console.error('❌ [GET /auth/profile] Erro interno:', err);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// GET /auth/profile/addresses - Listar endereços do usuário
router.get('/profile/addresses', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    console.log(`📍 [GET /auth/profile/addresses] Buscando endereços do usuário ID: ${userId}`);

    try {
        const addresses = await prisma.address.findMany({
            where: { userId },
            orderBy: [
                { isDefault: 'desc' },
                { id: 'asc' }
            ]
        });

        console.log(`✅ [GET /auth/profile/addresses] ${addresses.length} endereços encontrados.`);
        res.json(addresses);
    } catch (err) {
        console.error('❌ [GET /auth/profile/addresses] Erro interno:', err);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// PUT /auth/profile/address/:addressId - Atualizar endereço
router.put('/profile/address/:addressId', authenticateToken, async (req, res) => {
    const { addressId } = req.params;
    const { street, number, complement, neighborhood, isDefault } = req.body;
    const userId = req.user.id;

    console.log(`✏️ [PUT /auth/profile/address/${addressId}] Atualizando endereço para usuário ID: ${userId}`);

    if (!street || !number || !neighborhood) {
        console.warn('⚠️ [PUT /auth/profile/address] Dados obrigatórios não fornecidos.');
        return res.status(400).json({ message: 'Rua, número e bairro são obrigatórios.' });
    }

    try {
        // Verificar se o endereço pertence ao usuário
        const existingAddress = await prisma.address.findFirst({
            where: { id: parseInt(addressId), userId }
        });

        if (!existingAddress) {
            console.warn(`⚠️ [PUT /auth/profile/address] Endereço não encontrado: ID ${addressId}`);
            return res.status(404).json({ message: 'Endereço não encontrado.' });
        }

        // Se isDefault é verdadeiro, definir outros endereços como não padrão
        if (isDefault) {
            await prisma.address.updateMany({
                where: { userId, id: { not: parseInt(addressId) } },
                data: { isDefault: false }
            });
        }

        const updatedAddress = await prisma.address.update({
            where: { id: parseInt(addressId) },
            data: {
                street,
                number,
                complement: complement || null,
                neighborhood,
                isDefault: isDefault || false
            }
        });

        console.log(`✅ [PUT /auth/profile/address] Endereço atualizado: ID ${addressId}`);
        res.json(updatedAddress);
    } catch (err) {
        console.error('❌ [PUT /auth/profile/address] Erro interno:', err);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// PUT /auth/profile/phone - Atualizar telefone
router.put('/profile/phone', authenticateToken, async (req, res) => {
    const { phone } = req.body;
    const userId = req.user.id;

    console.log(`📱 [PUT /auth/profile/phone] Atualizando telefone para usuário ID: ${userId}`);

    if (!phone) {
        console.warn('⚠️ [PUT /auth/profile/phone] Telefone não fornecido.');
        return res.status(400).json({ message: 'Telefone é obrigatório.' });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { phone },
            select: {
                id: true,
                username: true,
                email: true,
                phone: true,
                role: true
            }
        });

        console.log(`✅ [PUT /auth/profile/phone] Telefone atualizado para usuário ID: ${userId}`);
        res.json(updatedUser);
    } catch (err) {
        console.error('❌ [PUT /auth/profile/phone] Erro interno:', err);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

module.exports = router;