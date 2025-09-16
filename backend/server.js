const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Instancie o PrismaClient
const prisma = new PrismaClient();
const app = express();
const PORT = 3001;

// Importar as rotas
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

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
    // Conectar as rotas
    app.use('/api/auth', authRoutes.router);
    app.use('/api/products', productRoutes);
    app.use('/api/cart', cartRoutes);
    app.use('/api/orders', orderRoutes);

    // Rota de teste
    app.get('/', (req, res) => {
        console.log('➡️ [GET /] Rota de teste acessada.');
        res.send('API da Açaíteria funcionando!');
    });

    app.listen(PORT, () => {
        console.log(`🚀 Servidor da API rodando na porta http://localhost:${PORT}`);
    });
});
