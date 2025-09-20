const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function testAdminLogin() {
    try {
        const email = 'kaioalexandre2681@gmail.com';
        const password = 'Kt.61424';

        // Buscar o usuário no banco
        const user = await prisma.user.findUnique({ 
            where: { email },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                password: true
            }
        });

        if (!user) {
            console.log('❌ Usuário não encontrado!');
            return;
        }

        console.log('👤 Usuário encontrado:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Password Hash: ${user.password.substring(0, 20)}...`);

        // Testar a senha
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (isPasswordValid) {
            console.log('✅ Senha correta! Login deveria funcionar.');
        } else {
            console.log('❌ Senha incorreta! Vou resetar a senha...');
            
            // Resetar a senha
            const newHashedPassword = await bcrypt.hash(password, 10);
            await prisma.user.update({
                where: { email },
                data: { password: newHashedPassword }
            });
            
            console.log('🔄 Senha resetada com sucesso!');
            console.log(`   Nova senha: ${password}`);
        }

    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testAdminLogin();