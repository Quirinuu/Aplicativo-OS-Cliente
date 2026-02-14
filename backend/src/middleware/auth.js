import { verifyToken } from '../utils/jwt.js';
import prisma from '../config/database.js';

/**
 * Middleware para verificar autenticação
 * Verifica se o token JWT é válido e adiciona o usuário ao req
 */
export async function authenticate(req, res, next) {
  try {
    // Pegar token do header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token não fornecido'
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // Verificar token
    const decoded = verifyToken(token);

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Usuário inválido ou inativo'
      });
    }

    // Adicionar usuário ao request
    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({
      error: 'Token inválido ou expirado'
    });
  }
}

/**
 * Middleware para verificar se é ADMIN
 */
export function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Acesso negado: apenas administradores'
    });
  }
  next();
}

/**
 * Middleware para verificar se é ADMIN ou o próprio usuário
 */
export function requireAdminOrSelf(req, res, next) {
  const targetUserId = req.params.id;
  
  if (req.user.role !== 'admin' && req.user.id !== targetUserId) {
    return res.status(403).json({
      error: 'Acesso negado'
    });
  }
  next();
}