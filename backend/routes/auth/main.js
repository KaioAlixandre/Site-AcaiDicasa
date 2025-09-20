const express = require('express');
const router = express.Router();

// Importar rotas organizadas
const authBaseRoutes = require('./index');
const authIdRoutes = require('./[id]');

// Usar as rotas
router.use('/', authBaseRoutes);
router.use('/', authIdRoutes);

// Exportar também os middlewares para compatibilidade
const { authenticateToken, authorize } = require('../../middleware');

module.exports = {
    router,
    authenticateToken,
    authorize
};