const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const emailService = require('../services/emailService');

const prisma = new PrismaClient();

// Rota para solicitar redefinição de senha
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    console.log(`➡️ [POST /api/auth/forgot-password] Solicitação de redefinição de senha para: ${email}`);

    if (!email) {
        console.warn('⚠️ [POST /api/auth/forgot-password] Email não fornecido');
        return res.status(400).json({ message: 'Email é obrigatório.' });
    }

    try {
        // Verificar se o usuário existe
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.warn(`⚠️ [POST /api/auth/forgot-password] Usuário não encontrado: ${email}`);
            // Por segurança, retornamos sucesso mesmo se o email não existir
            return res.status(200).json({ 
                message: 'Se o email estiver cadastrado, você receberá um código de verificação.' 
            });
        }

        // Gerar código de verificação
        const verificationCode = emailService.generateVerificationCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

        // Invalidar códigos anteriores para este email
        await prisma.passwordreset.updateMany({
            where: { 
                email,
                used: false 
            },
            data: { used: true }
        });

        // Criar novo registro de reset
        await prisma.passwordreset.create({
            data: {
                email,
                code: verificationCode,
                expiresAt,
                used: false
            }
        });

        // Enviar email
        const emailResult = await emailService.sendPasswordResetEmail(email, verificationCode);

        if (emailResult.success) {
            console.log(`✅ [POST /api/auth/forgot-password] Código enviado para: ${email}`);
            
            if (emailResult.development) {
                res.status(200).json({ 
                    message: 'Código de verificação gerado com sucesso.',
                    development: true,
                    code: verificationCode,
                    notice: 'Modo de desenvolvimento: O código foi exibido no console do servidor.'
                });
            } else {
                res.status(200).json({ 
                    message: 'Código de verificação enviado para seu email.' 
                });
            }
        } else {
            console.error(`❌ [POST /api/auth/forgot-password] Erro ao enviar email para: ${email}`);
            res.status(500).json({ 
                message: 'Erro ao enviar email. Tente novamente mais tarde.' 
            });
        }

    } catch (error) {
        console.error(`❌ [POST /api/auth/forgot-password] Erro interno:`, error);
        res.status(500).json({ 
            message: 'Erro interno do servidor.' 
        });
    }
});

// Rota para redefinir senha com código
router.post('/reset-password', async (req, res) => {
    const { email, code, newPassword } = req.body;

    console.log(`➡️ [POST /api/auth/reset-password] Tentativa de redefinição para: ${email}`);

    if (!email || !code || !newPassword) {
        console.warn('⚠️ [POST /api/auth/reset-password] Dados incompletos');
        return res.status(400).json({ 
            message: 'Email, código e nova senha são obrigatórios.' 
        });
    }

    if (newPassword.length < 6) {
        console.warn('⚠️ [POST /api/auth/reset-password] Senha muito curta');
        return res.status(400).json({ 
            message: 'A nova senha deve ter pelo menos 6 caracteres.' 
        });
    }

    try {
        // Verificar se o código existe e é válido
        const resetRecord = await prisma.passwordreset.findFirst({
            where: {
                email,
                code,
                used: false,
                expiresAt: {
                    gt: new Date()
                }
            }
        });

        if (!resetRecord) {
            console.warn(`⚠️ [POST /api/auth/reset-password] Código inválido ou expirado para: ${email}`);
            return res.status(400).json({ 
                message: 'Código de verificação inválido ou expirado.' 
            });
        }

        // Verificar se o usuário ainda existe
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.warn(`⚠️ [POST /api/auth/reset-password] Usuário não encontrado: ${email}`);
            return res.status(404).json({ 
                message: 'Usuário não encontrado.' 
            });
        }

        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Atualizar senha do usuário
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });

        // Marcar o código como usado
        await prisma.passwordreset.update({
            where: { id: resetRecord.id },
            data: { used: true }
        });

        // Invalidar todos os outros códigos pendentes para este email
        await prisma.passwordreset.updateMany({
            where: {
                email,
                used: false,
                id: { not: resetRecord.id }
            },
            data: { used: true }
        });

        console.log(`✅ [POST /api/auth/reset-password] Senha redefinida com sucesso para: ${email}`);
        res.status(200).json({ 
            message: 'Senha redefinida com sucesso.' 
        });

    } catch (error) {
        console.error(`❌ [POST /api/auth/reset-password] Erro interno:`, error);
        res.status(500).json({ 
            message: 'Erro interno do servidor.' 
        });
    }
});

// Rota para verificar se um código é válido (opcional)
router.post('/verify-reset-code', async (req, res) => {
    const { email, code } = req.body;

    console.log(`➡️ [POST /api/auth/verify-reset-code] Verificação de código para: ${email}`);

    if (!email || !code) {
        return res.status(400).json({ 
            message: 'Email e código são obrigatórios.' 
        });
    }

    try {
        const resetRecord = await prisma.passwordreset.findFirst({
            where: {
                email,
                code,
                used: false,
                expiresAt: {
                    gt: new Date()
                }
            }
        });

        if (resetRecord) {
            console.log(`✅ [POST /api/auth/verify-reset-code] Código válido para: ${email}`);
            res.status(200).json({ valid: true });
        } else {
            console.warn(`⚠️ [POST /api/auth/verify-reset-code] Código inválido para: ${email}`);
            res.status(400).json({ valid: false, message: 'Código inválido ou expirado.' });
        }

    } catch (error) {
        console.error(`❌ [POST /api/auth/verify-reset-code] Erro interno:`, error);
        res.status(500).json({ 
            message: 'Erro interno do servidor.' 
        });
    }
});

module.exports = router;