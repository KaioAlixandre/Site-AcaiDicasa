const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const emailService = require('../services/emailService');
const messageService = require('../services/messageService');

const prisma = new PrismaClient();

// Função para remover máscara do telefone
const removePhoneMask = (phone) => {
    if (!phone) return phone;
    return phone.toString().replace(/\D/g, '');
};

// Rota para solicitar redefinição de senha
router.post('/forgot-password', async (req, res) => {
    const { telefone } = req.body;

    if (!telefone) {
        console.warn('⚠️ [POST /api/auth/forgot-password] Telefone não fornecido');
        return res.status(400).json({ message: 'Telefone é obrigatório.' });
    }

    const telefoneLimpo = removePhoneMask(telefone);
    console.log(`➡️ [POST /api/auth/forgot-password] Solicitação de redefinição de senha para telefone: ${telefoneLimpo}`);

    try {
        // Verificar se o usuário existe
        const user = await prisma.usuario.findUnique({
            where: { telefone: telefoneLimpo }
        });

        if (!user) {
            console.warn(`⚠️ [POST /api/auth/forgot-password] Usuário não encontrado: ${telefoneLimpo}`);
            // Por segurança, retornamos sucesso mesmo se o telefone não existir
            return res.status(200).json({ 
                message: 'Se o telefone estiver cadastrado, você receberá um código de verificação.' 
            });
        }

        // Gerar código de verificação
        const verificationCode = emailService.generateVerificationCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

        // Invalidar códigos anteriores para este telefone
        await prisma.redefinicao_senha.updateMany({
            where: { 
                telefone: telefoneLimpo,
                usado: false 
            },
            data: { usado: true }
        });

        // Criar novo registro de reset
        await prisma.redefinicao_senha.create({
            data: {
                telefone: telefoneLimpo,
                codigo: verificationCode,
                expiraEm: expiresAt,
                usado: false
            }
        });

        // Enviar código por email (se tiver email) ou WhatsApp
        let emailResult = { success: false };
        let whatsappResult = { success: false };
        
        if (user.email) {
            emailResult = await emailService.sendPasswordResetEmail(user.email, verificationCode);
        } else {
            // Tentar verificar se o número possui WhatsApp (opcional, mas pode ajudar)
            const phoneCheck = await messageService.checkPhoneExistsWhatsApp(user.telefone);
            
            // Se a verificação falhar ou indicar que não tem WhatsApp, ainda tentamos enviar
            // porque a Z-API pode ter limitações na verificação, mas consegue enviar
            if (phoneCheck.success && phoneCheck.exists) {
                console.log(`✅ [POST /api/auth/forgot-password] Número confirmado como tendo WhatsApp: ${telefoneLimpo}`);
            } else if (phoneCheck.success && !phoneCheck.exists) {
                console.warn(`⚠️ [POST /api/auth/forgot-password] Verificação indica que número pode não ter WhatsApp: ${telefoneLimpo}, mas tentando enviar mesmo assim`);
            } else {
                console.warn(`⚠️ [POST /api/auth/forgot-password] Verificação falhou para: ${telefoneLimpo}, tentando enviar mesmo assim`);
            }
            
            // Enviar por WhatsApp se não tiver email (Z-API não suporta SMS)
            const whatsappMessage = `🍓 *Açaí di Casa*\n\n` +
                `*Redefinição de Senha*\n\n` +
                `Você solicitou a redefinição de sua senha. Use o código abaixo para continuar:\n\n` +
                `*${verificationCode}*\n\n` +
                `Este código expira em 15 minutos.\n` +
                `Se você não solicitou esta redefinição, ignore esta mensagem.`;
            
            whatsappResult = await messageService.sendWhatsAppMessageZApi(user.telefone, whatsappMessage);
        }

        if (emailResult.success) {
            console.log(`✅ [POST /api/auth/forgot-password] Código enviado por email para: ${user.email}`);
            
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
        } else if (whatsappResult.success) {
            console.log(`✅ [POST /api/auth/forgot-password] Código enviado por WhatsApp para: ${telefoneLimpo}`);
            res.status(200).json({ 
                message: 'Código de verificação enviado por WhatsApp.' 
            });
        } else {
            console.error(`❌ [POST /api/auth/forgot-password] Erro ao enviar código para: ${telefoneLimpo}`);
            res.status(500).json({ 
                message: 'Erro ao enviar código. Tente novamente mais tarde.' 
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
    const { telefone, code, newPassword } = req.body;

    if (!telefone || !code || !newPassword) {
        console.warn('⚠️ [POST /api/auth/reset-password] Dados incompletos');
        return res.status(400).json({ 
            message: 'Telefone, código e nova senha são obrigatórios.' 
        });
    }

    const telefoneLimpo = removePhoneMask(telefone);
    console.log(`➡️ [POST /api/auth/reset-password] Tentativa de redefinição para telefone: ${telefoneLimpo}`);

    if (newPassword.length < 6) {
        console.warn('⚠️ [POST /api/auth/reset-password] Senha muito curta');
        return res.status(400).json({ 
            message: 'A nova senha deve ter pelo menos 6 caracteres.' 
        });
    }

    try {
        // Verificar se o código existe e é válido
        const resetRecord = await prisma.redefinicao_senha.findFirst({
            where: {
                telefone: telefoneLimpo,
                codigo: code,
                usado: false,
                expiraEm: {
                    gt: new Date()
                }
            }
        });

        if (!resetRecord) {
            console.warn(`⚠️ [POST /api/auth/reset-password] Código inválido ou expirado para: ${telefoneLimpo}`);
            return res.status(400).json({ 
                message: 'Código de verificação inválido ou expirado.' 
            });
        }

        // Verificar se o usuário ainda existe
        const user = await prisma.usuario.findUnique({
            where: { telefone: telefoneLimpo }
        });

        if (!user) {
            console.warn(`⚠️ [POST /api/auth/reset-password] Usuário não encontrado: ${telefoneLimpo}`);
            return res.status(404).json({ 
                message: 'Usuário não encontrado.' 
            });
        }

        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Atualizar senha do usuário
        await prisma.usuario.update({
            where: { telefone: telefoneLimpo },
            data: { senha: hashedPassword }
        });

        // Marcar o código como usado
        await prisma.redefinicao_senha.update({
            where: { id: resetRecord.id },
            data: { usado: true }
        });

        // Invalidar todos os outros códigos pendentes para este telefone
        await prisma.redefinicao_senha.updateMany({
            where: {
                telefone: telefoneLimpo,
                usado: false,
                id: { not: resetRecord.id }
            },
            data: { usado: true }
        });

        console.log(`✅ [POST /api/auth/reset-password] Senha redefinida com sucesso para: ${telefoneLimpo}`);
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
    const { telefone, code } = req.body;

    if (!telefone || !code) {
        return res.status(400).json({ 
            message: 'Telefone e código são obrigatórios.' 
        });
    }

    const telefoneLimpo = removePhoneMask(telefone);
    console.log(`➡️ [POST /api/auth/verify-reset-code] Verificação de código para telefone: ${telefoneLimpo}`);

    try {
        const resetRecord = await prisma.redefinicao_senha.findFirst({
            where: {
                telefone: telefoneLimpo,
                codigo: code,
                usado: false,
                expiraEm: {
                    gt: new Date()
                }
            }
        });

        if (resetRecord) {
            console.log(`✅ [POST /api/auth/verify-reset-code] Código válido para: ${telefoneLimpo}`);
            res.status(200).json({ valid: true });
        } else {
            console.warn(`⚠️ [POST /api/auth/verify-reset-code] Código inválido para: ${telefoneLimpo}`);
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