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
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao fazer login.' });
    }
});

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'E-mail já cadastrado.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: { username, email, password: hashedPassword }
        });
        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao cadastrar usuário.' });
    }
});

router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                phone: true,
                addresses: true
            }
        });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar perfil.' });
    }
});

router.get('/users', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true
            }
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar usuários.' });
    }
});

module.exports = {
    router,
    authenticateToken,
    authorize
};