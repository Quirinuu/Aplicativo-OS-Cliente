const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Rota de login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Aqui você deve verificar no banco de dados
  // Por enquanto, aceita qualquer usuário
  if (username && password) {
    const token = jwt.sign(
      { userId: 1, username: username },
      process.env.JWT_SECRET || 'segredo-temporario',
      { expiresIn: '24h' }
    );
    
    return res.json({
      success: true,
      token: token,
      user: {
        id: 1,
        username: username,
        role: 'admin'
      }
    });
  }
  
  res.status(401).json({
    success: false,
    message: 'Credenciais inválidas'
  });
});

// Rota de verificação de token
router.post('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'segredo-temporario');
    res.json({ success: true, user: decoded });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token inválido' });
  }
});

module.exports = router;
