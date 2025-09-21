const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authModule = require('./authRoutes');
const { authenticateToken, authorize } = authModule;

console.log('🚀 [StoreConfigRoutes] Módulo de rotas de configuração da loja carregado');

// Buscar configuração da loja - Acessível para todos (não requer admin)
router.get('/', async (req, res) => {
  console.log('🔍 [GET /api/store-config] Iniciando busca da configuração da loja');
  console.log('🔑 [GET /api/store-config] Headers recebidos:', req.headers);
  console.log('🔐 [GET /api/store-config] Authorization header:', req.headers.authorization);
  console.log('🔧 [GET /api/store-config] Verificando instância do prisma:', !!prisma);
  console.log('🔧 [GET /api/store-config] Verificando modelo storeconfig:', !!prisma.storeconfig);
  
  try {
    console.log('📋 [GET /api/store-config] Procurando configuração existente no banco...');
    let config = await prisma.storeconfig.findFirst();
    
    if (!config) {
      console.log('⚠️ [GET /api/store-config] Nenhuma configuração encontrada, criando configuração padrão...');
      config = await prisma.storeconfig.create({
        data: {
          isOpen: true,
          openingTime: '08:00',
          closingTime: '18:00',
          openDays: '2,3,4,5,6,0'
        }
      });
      console.log('✨ [GET /api/store-config] Configuração padrão criada:', config);
    } else {
      console.log('✅ [GET /api/store-config] Configuração encontrada:', config);
    }
    
    console.log('📤 [GET /api/store-config] Enviando resposta com configuração');
    res.json(config);
  } catch (error) {
    console.error('❌ [GET /api/store-config] Erro ao buscar configuração:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar configuração da loja
router.put('/', authenticateToken, authorize('admin'), async (req, res) => {
  console.log('🔄 [PUT /api/store-config] Iniciando atualização da configuração da loja');
  console.log('📥 [PUT /api/store-config] Dados recebidos:', req.body);
  
  // Aceitar tanto os nomes do frontend (openTime/closeTime) quanto do backend (openingTime/closingTime)
  const { 
    isOpen, 
    openingTime: backendOpeningTime, 
    closingTime: backendClosingTime, 
    openTime: frontendOpenTime,
    closeTime: frontendCloseTime,
    openDays 
  } = req.body;
  
  // Usar os valores do frontend se disponíveis, senão usar os do backend
  const openingTime = frontendOpenTime || backendOpeningTime;
  const closingTime = frontendCloseTime || backendClosingTime;
  
  console.log('📝 [PUT /api/store-config] Dados extraídos e mapeados:', {
    isOpen,
    openingTime,
    closingTime,
    openDays,
    'fonte-openingTime': frontendOpenTime ? 'frontend (openTime)' : 'backend (openingTime)',
    'fonte-closingTime': frontendCloseTime ? 'frontend (closeTime)' : 'backend (closingTime)'
  });
  
  try {
    console.log('💾 [PUT /api/store-config] Executando upsert no banco de dados...');
    const config = await prisma.storeconfig.upsert({
      where: { id: 1 },
      update: { isOpen, openingTime, closingTime, openDays },
      create: { isOpen, openingTime, closingTime, openDays }
    });
    
    console.log('✅ [PUT /api/store-config] Configuração atualizada com sucesso:', config);
    console.log('📤 [PUT /api/store-config] Enviando resposta');
    res.json(config);
  } catch (error) {
    console.error('❌ [PUT /api/store-config] Erro ao atualizar configuração:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

module.exports = router;