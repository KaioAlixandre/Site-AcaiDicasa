const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken, authorize } = require('./authRoutes');

// Buscar configuração da loja
router.get('/', authenticateToken, authorize('admin'), async (req, res) => {
  let config = await prisma.storeConfig.findFirst();
  if (!config) {
    config = await prisma.storeConfig.create({
      data: {
        isOpen: true,
        openingTime: '08:00',
        closingTime: '18:00',
        openDays: '2,3,4,5,6,0'
      }
    });
  }
  res.json(config);
});

// Atualizar configuração da loja
router.put('/', authenticateToken, authorize('admin'), async (req, res) => {
  const { isOpen, openingTime, closingTime, openDays } = req.body;
  const config = await prisma.storeConfig.upsert({
    where: { id: 1 },
    update: { isOpen, openingTime, closingTime, openDays },
    create: { isOpen, openingTime, closingTime, openDays }
  });
  res.json(config);
});

module.exports = router;