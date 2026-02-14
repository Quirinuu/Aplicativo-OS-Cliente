// backend/src/controllers/auth.controller.js
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { generateToken } from '../utils/jwt.js';

/**
 * POST /api/auth/login
 * Faz login e retorna token JWT
 */
export async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    // Validar campos
    if (!username || !password) {
      return res.status(400).json({
        error: 'Username e senha são obrigatórios'
      });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Credenciais inválidas'
      });
    }

    // Verificar se está ativo
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Usuário inativo'
      });
    }

    // Verificar senha
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!passwordValid) {
      return res.status(401).json({
        error: 'Credenciais inválidas'
      });
    }

    // Gerar token
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role
    });

    // Retornar dados
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });

  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Retorna dados do usuário logado
 */
export async function me(req, res, next) {
  try {
    // req.user já foi preenchido pelo middleware authenticate
    res.json({
      user: req.user
    });
  } catch (error) {
    next(error);
  }
}