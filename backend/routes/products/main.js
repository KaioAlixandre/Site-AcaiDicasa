const express = require('express');
const router = express.Router();

// Importar rotas organizadas
const productBaseRoutes = require('./index');
const productIdRoutes = require('./[id]');

// Usar as rotas
router.use('/', productBaseRoutes);
router.use('/:id', productIdRoutes);

module.exports = router;