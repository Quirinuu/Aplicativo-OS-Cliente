// backend/src/config/database.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

// Testar conexão
prisma.$connect()
  .then(() => console.log('✅ Conectado ao PostgreSQL'))
  .catch((err) => {
    console.error('❌ Erro ao conectar ao banco:', err);
    process.exit(1);
  });

export default prisma;