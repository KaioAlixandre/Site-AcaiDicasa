const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');

// Endpoint temporário para debug - verificar usuário atual
router.get('/debug/user', authenticateToken, (req, res) => {
  console.log('🔍 Debug - Usuário atual:', req.user);
  res.json({
    user: req.user,
    timestamp: new Date()
  });
});

module.exports = router;