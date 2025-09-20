const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateToken, authorize, prisma } = require('../../middleware');

const JWT_SECRET = process.env.JWT_SECRET;

// POST /auth/register - Registrar novo usuário
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    console.log(`📝 [POST /auth/register] Tentativa de registro para: ${email}`);

    if (!username || !email || !password) {
        console.warn('⚠️ [POST /auth/register] Dados obrigatórios não fornecidos.');
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    try {
        // Verificar se o usuário já existe
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { username: username }
                ]
            }
        });

        if (existingUser) {
            console.warn(`⚠️ [POST /auth/register] Usuário já existe: ${email}`);
            return res.status(409).json({ message: 'Usuário com este email ou nome de usuário já existe.' });
        }

        // Criptografar a senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Criar o usuário
        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword
            }
        });

        console.log(`✅ [POST /auth/register] Usuário registrado com sucesso: ID ${newUser.id}`);
        res.status(201).json({ message: 'Usuário registrado com sucesso!', userId: newUser.id });
    } catch (err) {
        console.error('❌ [POST /auth/register] Erro interno:', err);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// POST /auth/login - Login de usuário
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`🔐 [POST /auth/login] Tentativa de login para: ${email}`);

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            console.warn(`⚠️ [POST /auth/login] Credenciais inválidas para: ${email}`);
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        console.log(`✅ [POST /auth/login] Login bem-sucedido para usuário ID: ${user.id}`);
        res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (err) {
        console.error('❌ [POST /auth/login] Erro interno:', err);
        res.status(500).json({ message: 'Erro interno do servidor.' });
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

        console.log(`✅ [POST /auth/profile/address] Endereço criado com sucesso: ID ${newAddress.id}`);
        res.status(201).json(newAddress);
    } catch (err) {
        console.error('❌ [POST /auth/profile/address] Erro interno:', err);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

module.exports = router;