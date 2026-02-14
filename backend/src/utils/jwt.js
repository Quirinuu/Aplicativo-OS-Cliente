// backend/src/utils/jwt.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret_padrao_inseguro';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Gera um token JWT
 * @param {Object} payload - Dados do usuário (id, username, role)
 * @returns {String} Token JWT
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

/**
 * Verifica e decodifica um token JWT
 * @param {String} token - Token JWT
 * @returns {Object} Payload decodificado
 * @throws {Error} Se token inválido
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido ou expirado');
  }
}