const express = require('express');
const router = express.Router();

// Importar rotas organizadas
const deliverersBaseRoutes = require('./index');
const deliverersIdRoutes = require('./[id]');

// Usar as rotas
router.use('/', deliverersBaseRoutes);
router.use('/', deliverersIdRoutes);

module.exports = router;