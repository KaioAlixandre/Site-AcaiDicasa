const express = require('express');
const router = express.Router();

// Importar rotas organizadas
const orderBaseRoutes = require('./index');
const orderIdRoutes = require('./[id]');

// Usar as rotas
router.use('/', orderBaseRoutes);
router.use('/:id', orderIdRoutes);

module.exports = router;