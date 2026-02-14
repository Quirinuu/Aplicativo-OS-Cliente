// BACKEND MODIFICADO PARA REDE LOCAL
// backend/src/index.js

// ============== CONFIGURAÇÃO DE AMBIENTE ==============
if (process.env.NODE_ENV !== 'production') {
  console.log('🔧 Modo desenvolvimento - carregando .env');
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
}

// LOG DE CONFIGURAÇÃO INICIAL
console.log('🔍 Configuração do Ambiente:');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('   PORT:', process.env.PORT || '3001 (padrão)');
console.log('   DATABASE_URL:', process.env.DATABASE_URL || 'Não definido');
console.log('   Diretório atual:', __dirname);

// Função para obter IP local da máquina
function getLocalIpAddress() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Pular endereços internos (lo) e não-IPv4
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`🌐 IP Local detectado: ${iface.address} (interface: ${name})`);
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

const LOCAL_IP = getLocalIpAddress();

process.on('uncaughtException', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Porta ${process.env.PORT || 3001} já está em uso!`);
    console.error('   Tentando outra porta automaticamente...');
  } else {
    console.error('💥 Erro não tratado:', err);
  }
});

try {
  require('cors');
  console.log('✅ cors carregado');
} catch (error) {
  console.error('❌ ERRO: cors não encontrado');
  process.exit(1);
}

try {
  require('socket.io');
  console.log('✅ socket.io carregado');
} catch (error) {
  console.error('❌ ERRO: socket.io não encontrado');
  process.exit(1);
}

console.log('✅ Todos os módulos necessários foram carregados');

const express = require("express");
const path = require('path');  
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const frontendPath = process.env.FRONTEND_PATH || path.join(__dirname, '../../frontend/dist');
console.log('📁 Servindo frontend de:', frontendPath);
app.use(express.static(frontendPath));

// ============== CONFIGURAÇÃO CORS PARA REDE LOCAL ==============
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Permitir localhost e IPs da rede local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  const isLocalNetwork = origin && (
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    /192\.168\.\d+\.\d+/.test(origin) ||
    /10\.\d+\.\d+\.\d+/.test(origin) ||
    /172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+/.test(origin)
  );
  
  if (isLocalNetwork || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use(express.json());

// Log de todas as requisições com IP
app.use((req, res, next) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(`📡 ${req.method} ${req.path} - Cliente: ${clientIp}`);
  next();
});

// Socket.IO com CORS para rede local
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Permitir requisições sem origin (Electron, mobile apps, etc)
      if (!origin) return callback(null, true);
      
      // Permitir localhost e rede local
      const isLocalNetwork = 
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        /192\.168\.\d+\.\d+/.test(origin) ||
        /10\.\d+\.\d+\.\d+/.test(origin) ||
        /172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+/.test(origin);
      
      if (isLocalNetwork) {
        callback(null, true);
      } else {
        callback(new Error('Não permitido pelo CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Exportar io para uso nos controllers
module.exports = { io };

// Dados mock em memória (compartilhados entre todas as conexões)
let mockUsers = [
  {
    id: 1,
    username: "admin",
    fullName: "Administrador",
    email: "admin@example.com",
    role: "admin",
    password: "admin123"
  },
  {
    id: 2,
    username: "tecnico",
    fullName: "Técnico João",
    email: "tecnico@example.com",
    role: "technician",
    password: "tecnico123"
  }
];

let mockOrders = [
  {
    id: 1,
    clientName: "Maria Silva",
    clientPhone: "(11) 98765-4321",
    equipmentName: "Notebook Dell",
    equipmentSerial: "DL123456",
    defect: "Não liga",
    status: "pending",
    priority: "high",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignedToId: 2,
    createdById: 1,
    comments: []
  }
];

// Middleware simples de autenticação
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || token === 'null') {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  
  req.userId = 1; // Simula usuário logado
  next();
}

// ============== ROTAS DE AUTENTICAÇÃO ==============

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  
  console.log("🔐 Tentativa de login:", username);
  
  const user = mockUsers.find(u => u.username === username);
  
  if (!user || user.password !== password) {
    return res.status(401).json({ 
      error: "Credenciais inválidas" 
    });
  }
  
  const { password: _, ...userWithoutPassword } = user;
  
  res.json({
    success: true,
    token: `token-${user.id}-${Date.now()}`,
    user: userWithoutPassword
  });
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  console.log("👤 Obtendo usuário atual");
  
  const user = mockUsers.find(u => u.id === req.userId);
  
  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }
  
  const { password: _, ...userWithoutPassword } = user;
  
  res.json({
    user: userWithoutPassword
  });
});

// ============== ROTAS DE USUÁRIOS ==============

app.get("/api/users", authMiddleware, (req, res) => {
  console.log("👥 Listando usuários");
  
  const usersWithoutPassword = mockUsers.map(({ password, ...user }) => user);
  
  res.json({
    users: usersWithoutPassword
  });
});

app.get("/api/users/:id", authMiddleware, (req, res) => {
  const userId = parseInt(req.params.id);
  const user = mockUsers.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }
  
  const { password: _, ...userWithoutPassword } = user;
  
  res.json({
    user: userWithoutPassword
  });
});

app.post("/api/users", authMiddleware, (req, res) => {
  const { username, fullName, email, role, password } = req.body;
  
  const newUser = {
    id: mockUsers.length + 1,
    username,
    fullName,
    email,
    role,
    password
  };
  
  mockUsers.push(newUser);
  
  const { password: _, ...userWithoutPassword } = newUser;
  
  console.log("✅ Usuário criado:", username);
  
  res.json({
    user: userWithoutPassword
  });
});

app.put("/api/users/:id", authMiddleware, (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }
  
  mockUsers[userIndex] = {
    ...mockUsers[userIndex],
    ...req.body,
    id: userId
  };
  
  const { password: _, ...userWithoutPassword } = mockUsers[userIndex];
  
  console.log("✏️ Usuário atualizado:", userId);
  
  res.json({
    user: userWithoutPassword
  });
});

app.delete("/api/users/:id", authMiddleware, (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }
  
  mockUsers.splice(userIndex, 1);
  
  console.log("🗑️ Usuário deletado:", userId);
  
  res.json({
    message: "Usuário deletado com sucesso"
  });
});

// ============== ROTAS DE ORDENS DE SERVIÇO ==============

app.get("/api/os", authMiddleware, (req, res) => {
  console.log("📋 Listando OS");
  
  let filtered = [...mockOrders];
  
  if (req.query.status && req.query.status !== 'all') {
    filtered = filtered.filter(o => o.status === req.query.status);
  }
  
  if (req.query.priority && req.query.priority !== 'all') {
    filtered = filtered.filter(o => o.priority === req.query.priority);
  }
  
  if (req.query.clientName) {
    filtered = filtered.filter(o => 
      o.clientName.toLowerCase().includes(req.query.clientName.toLowerCase())
    );
  }
  
  if (req.query.equipmentName) {
    filtered = filtered.filter(o => 
      o.equipmentName.toLowerCase().includes(req.query.equipmentName.toLowerCase())
    );
  }
  
  res.json({
    orders: filtered
  });
});

app.get("/api/os/history", authMiddleware, (req, res) => {
  console.log("📜 Obtendo histórico");
  
  let filtered = mockOrders.filter(o => 
    o.status === 'completed' || o.status === 'cancelled'
  );
  
  if (req.query.startDate) {
    filtered = filtered.filter(o => 
      new Date(o.createdAt) >= new Date(req.query.startDate)
    );
  }
  
  if (req.query.endDate) {
    filtered = filtered.filter(o => 
      new Date(o.createdAt) <= new Date(req.query.endDate)
    );
  }
  
  res.json({
    orders: filtered
  });
});

app.get("/api/os/:id", authMiddleware, (req, res) => {
  const osId = parseInt(req.params.id);
  const order = mockOrders.find(o => o.id === osId);
  
  if (!order) {
    return res.status(404).json({ error: "OS não encontrada" });
  }
  
  res.json({
    order
  });
});

app.post("/api/os", authMiddleware, (req, res) => {
  const newOrder = {
    id: mockOrders.length + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdById: req.userId,
    comments: []
  };
  
  mockOrders.push(newOrder);
  
  console.log("✅ OS criada:", newOrder.id);
  
  // Emitir evento via WebSocket para TODOS os clientes
  io.emit('os:created', { order: newOrder });
  console.log("📡 Evento 'os:created' emitido para todos os clientes");
  
  res.json({
    order: newOrder
  });
});

app.put("/api/os/:id", authMiddleware, (req, res) => {
  const osId = parseInt(req.params.id);
  const orderIndex = mockOrders.findIndex(o => o.id === osId);
  
  if (orderIndex === -1) {
    return res.status(404).json({ error: "OS não encontrada" });
  }
  
  mockOrders[orderIndex] = {
    ...mockOrders[orderIndex],
    ...req.body,
    id: osId,
    updatedAt: new Date().toISOString()
  };
  
  console.log("✏️ OS atualizada:", osId);
  
  // Emitir evento via WebSocket para TODOS os clientes
  io.emit('os:updated', { order: mockOrders[orderIndex] });
  console.log("📡 Evento 'os:updated' emitido para todos os clientes");
  
  res.json({
    order: mockOrders[orderIndex]
  });
});

app.delete("/api/os/:id", authMiddleware, (req, res) => {
  const osId = parseInt(req.params.id);
  const orderIndex = mockOrders.findIndex(o => o.id === osId);
  
  if (orderIndex === -1) {
    return res.status(404).json({ error: "OS não encontrada" });
  }
  
  mockOrders.splice(orderIndex, 1);
  
  console.log("🗑️ OS deletada:", osId);
  
  // Emitir evento via WebSocket para TODOS os clientes
  io.emit('os:deleted', { orderId: osId });
  console.log("📡 Evento 'os:deleted' emitido para todos os clientes");
  
  res.json({
    message: "OS deletada com sucesso"
  });
});

app.post("/api/os/:id/comments", authMiddleware, (req, res) => {
  const osId = parseInt(req.params.id);
  const order = mockOrders.find(o => o.id === osId);
  
  if (!order) {
    return res.status(404).json({ error: "OS não encontrada" });
  }
  
  const newComment = {
    id: order.comments.length + 1,
    osId,
    userId: req.userId,
    comment: req.body.comment,
    createdAt: new Date().toISOString()
  };
  
  order.comments.push(newComment);
  order.updatedAt = new Date().toISOString();
  
  console.log("💬 Comentário adicionado à OS:", osId);
  
  // Emitir evento via WebSocket para TODOS os clientes
  io.emit('os:comment', { osId, comment: newComment });
  console.log("📡 Evento 'os:comment' emitido para todos os clientes");
  
  res.json({
    comment: newComment
  });
});

// Rota para obter informações de rede (útil para debug)
app.get("/api/network/info", (req, res) => {
  res.json({
    serverIp: LOCAL_IP,
    port: PORT,
    hostname: require('os').hostname()
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Backend funcionando",
    timestamp: new Date().toISOString(),
    ip: LOCAL_IP,
    port: PORT
  });
});

// Rota raiz
app.get("/", (req, res) => {
  res.json({ 
    message: "OS Manager Backend API - Rede Local",
    version: "2.0.0",
    serverIp: LOCAL_IP,
    port: PORT,
    endpoints: {
      health: "/health",
      networkInfo: "/api/network/info",
      auth: "/api/auth/:action",
      users: "/api/users/:id?",
      os: "/api/os/:id?"   
    }
  });
});

// ============== WEBSOCKET ==============

io.on('connection', (socket) => {
  const clientIp = socket.handshake.address;
  console.log('🔌 Cliente conectado:', socket.id, '- IP:', clientIp);
  
  // Enviar informações do servidor ao conectar
  socket.emit('server:info', {
    serverIp: LOCAL_IP,
    port: PORT,
    message: 'Conectado ao servidor OS Manager'
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado:', socket.id, '- IP:', clientIp);
  });
  
  socket.on('os:subscribe', (osId) => {
    socket.join(`os:${osId}`);
    console.log(`📡 Cliente ${socket.id} inscrito na OS ${osId}`);
  });
  
  socket.on('os:unsubscribe', (osId) => {
    socket.leave(`os:${osId}`);
    console.log(`📡 Cliente ${socket.id} desinscrito da OS ${osId}`);
  });
  
  // Ping/Pong para manter conexão viva
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

// ============== INICIAR SERVIDOR ==============

const PORT = parseInt(process.env.PORT) || 5000;

// IMPORTANTE: Escutar em 0.0.0.0 para aceitar conexões de QUALQUER IP da rede
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════╗
║     🚀 OS Manager Backend - REDE LOCAL        ║
╠════════════════════════════════════════════════╣
║  Servidor Local: http://localhost:${PORT.toString().padEnd(18)}║
║  IP da Rede:     http://${LOCAL_IP}:${PORT.toString().padEnd(18)}║
║  WebSocket:      ws://${LOCAL_IP}:${PORT.toString().padEnd(22)}║
╠════════════════════════════════════════════════╣
║  ✅ Aceitando conexões de toda a rede local   ║
║  🔌 Sincronização em tempo real ativada       ║
╚════════════════════════════════════════════════╝
  `);
  
  console.log('\n📱 Para conectar outros dispositivos:');
  console.log(`   1. Use o IP: ${LOCAL_IP}`);
  console.log(`   2. Porta: ${PORT}`);
  console.log(`   3. URL completa: http://${LOCAL_IP}:${PORT}\n`);
});

// ============== MIDDLEWARE CATCH-ALL PARA SPA ==============
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path === '/health') {
    return next();
  }
  
  const frontendPath = process.env.FRONTEND_PATH || path.join(__dirname, '../../frontend/dist');
  res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
    if (err) {
      console.error('Erro ao servir index.html:', err);
      res.status(500).json({ error: 'Erro ao carregar aplicação' });
    }
  });
});
