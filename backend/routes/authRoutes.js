const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// A "chave secreta" para assinar o token. Mantenha em um arquivo de variáveis de ambiente.
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware para verificar o token e adicionar o usuário à requisição
const authenticateToken = async (req, res, next) => {
    console.log('🔗 [Middleware: authenticateToken] Verificando token de autenticação...');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        console.warn('⚠️ [Middleware: authenticateToken] Token não fornecido. Acesso negado.');
        return res.status(401).json({ message: 'Token não fornecido.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, role: true } // Seleciona apenas o id e o papel
        });

        if (!user) {
            console.error('❌ [Middleware: authenticateToken] Usuário não encontrado para o token fornecido.');
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        req.user = user;
        console.log(`✅ [Middleware: authenticateToken] Autenticação bem-sucedida para o usuário ID: ${req.user.id}.`);
        next();
    } catch (err) {
        console.error('🚫 [Middleware: authenticateToken] Token inválido:', err.message);
        return res.status(403).json({ message: 'Token inválido.' });
    }
};

// Middleware para verificar o papel do usuário (admin, user, etc.)
const authorize = (role) => {
    return (req, res, next) => {
        console.log(`🔗 [Middleware: authorize] Verificando se o usuário tem o papel '${role}'.`);
        if (!req.user || req.user.role !== role) {
            console.warn(`🚫 [Middleware: authorize] Acesso negado. Papel necessário: '${role}', Papel do usuário: '${req.user ? req.user.role : 'não autenticado'}'`);
            return res.status(403).json({ message: 'Acesso negado: você não tem permissão para realizar esta ação.' });
        }
        console.log(`👍 [Middleware: authorize] Permissão concedida para o usuário com papel '${req.user.role}'.`);
        next();
    };
};

// Rota de Cadastro de Usuário
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    console.log(`➡️ [POST /api/auth/register] Requisição de cadastro recebida para o e-mail: ${email}.`);
    try {
        // 1. Validar a entrada
        if (!username || !email || !password) {
            console.warn('⚠️ [POST /api/auth/register] Dados de cadastro incompletos.');
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }

        // 2. Verificar se o usuário já existe
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            console.warn(`🚨 [POST /api/auth/register] Tentativa de cadastro com e-mail já existente: ${email}.`);
            return res.status(409).json({ message: 'E-mail já cadastrado.' });
        }

        const existingUsername = await prisma.user.findUnique({ where: { username } });
        if (existingUsername) {
            console.warn(`🚨 [POST /api/auth/register] Tentativa de cadastro com nome de usuário já existente: ${username}.`);
            return res.status(409).json({ message: 'Nome de usuário já cadastrado.' });
        }

        // 3. Hash da senha e criação do usuário
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: { username, email, password: hashedPassword }
        });
        console.log(`✨ [POST /api/auth/register] Novo usuário cadastrado com sucesso. ID: ${newUser.id}`);
        res.status(201).json({ message: 'Usuário cadastrado com sucesso!', user: newUser });
    } catch (err) {
        console.error('❌ [POST /api/auth/register] Erro ao cadastrar usuário:', err.message);
        res.status(500).json({ message: 'Erro ao cadastrar usuário.', error: err.message });
    }
});

// Rota de Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`➡️ [POST /api/auth/login] Requisição de login recebida para o e-mail: ${email}.`);
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            console.warn('⚠️ [POST /api/auth/login] Tentativa de login com credenciais inválidas.');
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        console.log(`👍 [POST /api/auth/login] Login bem-sucedido para o usuário ID: ${user.id}. Token gerado.`);
        res.status(200).json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
        console.error('❌ [POST /api/auth/login] Erro ao fazer login:', err.message);
        res.status(500).json({ message: 'Erro ao fazer login.', error: err.message });
    }
});

// Rota para obter o perfil do usuário autenticado
router.get('/profile', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    console.log(`🔍 [GET /api/auth/profile] Requisição para obter o perfil do usuário ID: ${userId}.`);
    try {
        const userProfile = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                addresses: true,
                phone: true,
            },
        });
        if (!userProfile) {
            console.error(`🚨 [GET /api/auth/profile] Perfil do usuário ${userId} não encontrado.`);
            return res.status(404).json({ message: 'Perfil não encontrado.' });
        }
        console.log(`✅ [GET /api/auth/profile] Perfil do usuário ${userId} obtido com sucesso.`);
        res.status(200).json(userProfile);
    } catch (err) {
        console.error(`❌ [GET /api/auth/profile] Erro ao buscar o perfil do usuário ${userId}:`, err.message);
        res.status(500).json({ message: 'Erro ao buscar o perfil.', error: err.message });
    }
});

// Rota para cadastrar um novo endereço para o usuário autenticado
router.post('/profile/address', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { street, number, complement, neighborhood, city, state, zipCode, isDefault } = req.body;
    console.log(`➡️ [POST /api/auth/profile/address] Requisição para cadastrar novo endereço para o usuário ID: ${userId}.`);

    try {
        const newAddress = await prisma.address.create({
            data: {
                street,
                number,
                complement,
                neighborhood,
                isDefault,
                userId: userId,
            },
        });
        console.log(`✨ [POST /api/auth/profile/address] Novo endereço cadastrado com sucesso. ID: ${newAddress.id}`);
        res.status(201).json({ message: 'Endereço cadastrado com sucesso!', address: newAddress });
    } catch (err) {
        console.error(`❌ [POST /api/auth/profile/address] Erro ao cadastrar o endereço para o usuário ${userId}:`, err.message);
        res.status(500).json({ message: 'Erro ao cadastrar o endereço.', error: err.message });
    }
});

// Rota para listar endereços do usuário autenticado
router.get('/profile/addresses', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    console.log(`🔍 [GET /api/auth/profile/addresses] Requisição para listar endereços do usuário ID: ${userId}.`);
    try {
        const addresses = await prisma.address.findMany({
            where: { userId: userId },
            orderBy: { isDefault: 'desc' }, // Garante que o endereço padrão venha primeiro
        });
        console.log(`✅ [GET /api/auth/profile/addresses] Encontrados ${addresses.length} endereços para o usuário ${userId}.`);
        res.status(200).json(addresses);
    } catch (err) {
        console.error(`❌ [GET /api/auth/profile/addresses] Erro ao buscar endereços para o usuário ${userId}:`, err.message);
        res.status(500).json({ message: 'Erro ao buscar endereços.', error: err.message });
    }
});

// Rota para atualizar um endereço existente do usuário autenticado
router.put('/profile/address/:addressId', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const addressId = parseInt(req.params.addressId);
    const { street, number, complement, neighborhood, city, state, zipCode, isDefault } = req.body;
    console.log(`🔄 [PUT /api/auth/profile/address/${addressId}] Requisição para atualizar endereço para o usuário ID: ${userId}.`);

    try {
        let updatedAddress;
        if (isDefault) {
            await prisma.$transaction(async (tx) => {
                // Remove o "padrão" de qualquer outro endereço do usuário
                await tx.address.updateMany({
                    where: { userId: userId, isDefault: true },
                    data: { isDefault: false }
                });

                // Atualiza o endereço com os novos dados e define como padrão
                updatedAddress = await tx.address.update({
                    where: { id: addressId },
                    data: {
                        street,
                        number,
                        complement,
                        neighborhood,
                        isDefault: true,
                    }
                });
            });
        } else {
            updatedAddress = await prisma.address.update({
                where: { id: addressId },
                data: {
                    street,
                    number,
                    complement,
                    neighborhood,
                    isDefault: false,
                }
            });
        }

        console.log(`✅ [PUT /api/auth/profile/address/${addressId}] Endereço atualizado com sucesso. ID: ${updatedAddress.id}`);
        res.status(200).json({ message: 'Endereço atualizado com sucesso!', address: updatedAddress });
    } catch (err) {
        console.error(`❌ [PUT /api/auth/profile/address/${addressId}] Erro ao atualizar o endereço:`, err.message);
        res.status(500).json({ message: 'Erro ao atualizar o endereço.', error: err.message });
    }
});

// Rota para atualizar o número de telefone do usuário autenticado
router.put('/profile/phone', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { phone } = req.body;
    console.log(`🔄 [PUT /api/auth/profile/phone] Requisição para atualizar telefone. Usuário ID: ${userId}`);

    if (!phone) {
        console.warn(`⚠️ [PUT /api/auth/profile/phone] Tentativa de atualizar telefone sem o campo 'phone'.`);
        return res.status(400).json({ message: 'Número de telefone é obrigatório.' });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { phone },
        });
        console.log(`✅ [PUT /api/auth/profile/phone] Telefone do usuário ${userId} atualizado com sucesso.`);
        res.status(200).json({ message: 'Número de telefone atualizado com sucesso!', user: updatedUser });
    } catch (err) {
        console.error(`❌ [PUT /api/auth/profile/phone] Erro ao atualizar o telefone para o usuário ${userId}:`, err.message);
        res.status(500).json({ message: 'Erro ao atualizar o telefone.', error: err.message });
    }
});

module.exports = {
    router,
    authenticateToken,
    authorize
};
