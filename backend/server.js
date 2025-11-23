require('dotenv').config();
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Instancie o PrismaClient
const prisma = new PrismaClient();
const app = express();
const PORT = 3001;

// Importar as rotas organizadas (principais)
const authRoutes = require('./routes/auth'); // Ajustado para importar o diretório
const productRoutes = require('./routes/produtos');
const orderRoutes = require('./routes/pedidos');
const delivererRoutes = require('./routes/delivererRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Rotas ainda não organizadas
const cartRoutes = require('./routes/cartRoutes'); // TODO: Organizar
const insightsRoutes = require('./routes/insiths'); // TODO: Organizar
const storeConfigRoutes = require('./routes/configuracao'); // TODO: Organizar
const complementsRoutes = require('./routes/complementsRoutes'); // TODO: Organizar
const passwordResetRoutes = require('./routes/passwordResetRoutes');
const cozinheirosRoutes = require('./routes/cozinheiros');

// Middlewares
app.use(cors());
app.use(express.json());

// Função para testar a conexão com o banco de dados
const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log('✅ Conectado com sucesso ao banco de dados!');
    } catch (err) {
        console.error('❌ Erro ao conectar ao banco de dados:', err);
        process.exit(1); // Sai da aplicação em caso de erro de conexão
    }
};

// Conectar ao banco de dados e iniciar o servidor
connectDB().then(() => {
    // Conectar as rotas organizadas
    app.use('/api/auth', authRoutes.router);
    app.use('/api/auth', passwordResetRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/deliverers', delivererRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/cart', cartRoutes);
    app.use('/api/insights', insightsRoutes);
    app.use('/api/store-config', storeConfigRoutes);
    app.use('/api/complements', complementsRoutes);
    app.use('/api/complement-categories', require('./routes/complementCategoriesRoutes'));
    app.use('/api/cozinheiros', cozinheirosRoutes);
    
    // Rota de debug temporária
    const debugRoutes = require('./routes/debug');
    app.use('/api', debugRoutes);
    
    // Servir arquivos estáticos da pasta uploads
    app.use('/uploads', express.static('uploads'));

    // Rota de teste
    app.get('/', (req, res) => {
        console.log('➡️ [GET /] Rota de teste acessada.');
        res.send('API da Açaíteria funcionando!');
    });

    app.listen(PORT, () => {
        console.log(`🚀 Servidor da API rodando na porta http://localhost:${PORT}`);
    });
});
