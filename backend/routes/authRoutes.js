const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Token não fornecido.' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, role: true }
        });
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Token inválido.' });
    }
};

const authorize = (role) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }
        next();
    };
};

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`🔐 [POST /auth/login] Tentativa de login para email: ${email}`);
    
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            console.warn(`⚠️ [POST /auth/login] Credenciais inválidas para email: ${email}`);
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        console.log(`✅ [POST /auth/login] Login realizado com sucesso para usuário: ${user.username} (ID: ${user.id})`);
        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
        console.error('❌ [POST /auth/login] Erro interno ao fazer login:', err);
        res.status(500).json({ message: 'Erro ao fazer login.' });
    }
});

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    console.log(`👤 [POST /auth/register] Tentativa de registro para usuário: ${username}, email: ${email}`);
    
    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            console.warn(`⚠️ [POST /auth/register] Email já existe: ${email}`);
            return res.status(400).json({ message: 'E-mail já cadastrado.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: { username, email, password: hashedPassword }
        });
        console.log(`✅ [POST /auth/register] Usuário cadastrado com sucesso: ${username} (ID: ${newUser.id})`);
        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    } catch (err) {
        console.error('❌ [POST /auth/register] Erro interno ao cadastrar usuário:', err);
        res.status(500).json({ message: 'Erro ao cadastrar usuário.' });
    }
});

router.get('/profile', authenticateToken, async (req, res) => {
    console.log(`👤 [GET /auth/profile] Buscando perfil do usuário ID: ${req.user.id}`);
    
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                phone: true,
                address: {
                    select: {
                        id: true,
                        street: true,
                        number: true,
                        complement: true,
                        neighborhood: true,
                        isDefault: true
                    },
                    orderBy: {
                        isDefault: 'desc'
                    }
                }
            }
        });
        console.log(`✅ [GET /auth/profile] Perfil encontrado para usuário: ${user.username}`);
        res.json(user);
    } catch (err) {
        console.error('❌ [GET /auth/profile] Erro interno ao buscar perfil:', err);
        res.status(500).json({ message: 'Erro ao buscar perfil.' });
    }
});

router.get('/users', authenticateToken, authorize('admin'), async (req, res) => {
    console.log(`👥 [GET /auth/users] Admin ${req.user.id} solicitando lista de usuários`);
    
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                phone: true,
                createdAt: true,
                order: {
                    select: {
                        id: true,
                        totalPrice: true,
                        status: true,
                        createdAt: true
                    }
                }
            }
        });
        console.log(`✅ [GET /auth/users] ${users.length} usuários encontrados`);
        res.json(users);
    } catch (err) {
        console.error('❌ [GET /auth/users] Erro interno ao buscar usuários:', err);
        res.status(500).json({ error: 'Erro ao buscar usuários.' });
    }
});

// GET /auth/profile/addresses - Listar endereços do usuário
router.get('/profile/addresses', authenticateToken, async (req, res) => {
    console.log(`🏠 [GET /auth/profile/addresses] Buscando endereços do usuário ID: ${req.user.id}`);
    
    try {
        const addresses = await prisma.address.findMany({
            where: { userId: req.user.id },
            orderBy: { isDefault: 'desc' }
        });
        console.log(`✅ [GET /auth/profile/addresses] ${addresses.length} endereços encontrados`);
        res.json(addresses);
    } catch (err) {
        console.error('❌ [GET /auth/profile/addresses] Erro interno ao buscar endereços:', err);
        res.status(500).json({ error: 'Erro ao buscar endereços.' });
    }
});

// POST /auth/profile/address - Adicionar endereço
router.post('/profile/address', authenticateToken, async (req, res) => {
    const { street, number, complement, neighborhood, isDefault } = req.body;
    const userId = req.user.id;

    console.log(`📍 [POST /auth/profile/address] Adicionando endereço para usuário ID: ${userId}`);

    if (!street || !number || !neighborhood) {
        console.warn('⚠️ [POST /auth/profile/address] Dados obrigatórios do endereço não fornecidos.');
        return res.status(400).json({ message: 'Rua, número e bairro são obrigatórios.' });
    }

    try {
        // Se isDefault é verdadeiro, definir outros endereços como não padrão
        if (isDefault) {
            await prisma.address.updateMany({
                where: { userId },
                data: { isDefault: false }
            });
        }

        const newAddress = await prisma.address.create({
            data: {
                street,
                number,
                complement: complement || null,
                neighborhood,
                isDefault: isDefault || false,
                userId
            }
        });

        // Buscar o usuário atualizado com endereços para resposta
        const updatedUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { 
                address: true
            }
        });

        console.log(`✅ [POST /auth/profile/address] Endereço criado com sucesso: ID ${newAddress.id}`);
        res.status(201).json({ user: updatedUser });
    } catch (err) {
        console.error('❌ [POST /auth/profile/address] Erro interno:', err);
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
                role: true,
                address: true
            }
        });

        console.log(`✅ [PUT /auth/profile/phone] Telefone atualizado para usuário ID: ${userId}`);
        res.json({ success: true, user: updatedUser });
    } catch (err) {
        console.error('❌ [PUT /auth/profile/phone] Erro interno:', err);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// DELETE /auth/profile/address/:addressId - Excluir endereço
router.delete('/profile/address/:addressId', authenticateToken, async (req, res) => {
    const { addressId } = req.params;
    const userId = req.user.id;

    console.log(`🗑️ [DELETE /auth/profile/address/${addressId}] Excluindo endereço para usuário ID: ${userId}`);

    try {
        // Verificar se o endereço existe e pertence ao usuário
        const existingAddress = await prisma.address.findFirst({
            where: { 
                id: parseInt(addressId), 
                userId 
            }
        });

        if (!existingAddress) {
            console.warn(`⚠️ [DELETE /auth/profile/address] Endereço não encontrado ou não pertence ao usuário: ID ${addressId}`);
            return res.status(404).json({ message: 'Endereço não encontrado.' });
        }

        // Verificar se é o último endereço do usuário
        const userAddressCount = await prisma.address.count({
            where: { userId }
        });

        if (userAddressCount === 1) {
            console.warn(`⚠️ [DELETE /auth/profile/address] Tentativa de excluir último endereço: ID ${addressId}`);
            return res.status(400).json({ 
                message: 'Não é possível excluir o último endereço. Adicione outro endereço antes de excluir este.' 
            });
        }

        // Excluir o endereço
        await prisma.address.delete({
            where: { id: parseInt(addressId) }
        });

        // Se o endereço excluído era o padrão, definir outro como padrão
        if (existingAddress.isDefault) {
            const firstRemainingAddress = await prisma.address.findFirst({
                where: { userId },
                orderBy: { id: 'asc' }
            });

            if (firstRemainingAddress) {
                await prisma.address.update({
                    where: { id: firstRemainingAddress.id },
                    data: { isDefault: true }
                });
                console.log(`🔄 [DELETE /auth/profile/address] Novo endereço padrão definido: ID ${firstRemainingAddress.id}`);
            }
        }

        // Buscar endereços atualizados do usuário
        const updatedAddresses = await prisma.address.findMany({
            where: { userId },
            orderBy: [
                { isDefault: 'desc' },
                { id: 'asc' }
            ]
        });

        console.log(`✅ [DELETE /auth/profile/address] Endereço excluído com sucesso: ID ${addressId}`);
        res.json({ 
            message: 'Endereço excluído com sucesso.',
            addresses: updatedAddresses
        });
    } catch (err) {
        console.error('❌ [DELETE /auth/profile/address] Erro interno:', err);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

module.exports = {
    router,
    authenticateToken,
    authorize
};