import express from 'express';
import { list, getById, create, update, remove } from '../controllers/users.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Todas as rotas de usuários requerem autenticação
router.use(authenticate);

// GET /api/users - Lista usuários (qualquer usuário autenticado)
router.get('/', list);

// GET /api/users/:id - Busca usuário específico
router.get('/:id', getById);

// As rotas abaixo requerem ADMIN
router.post('/', requireAdmin, create);
router.put('/:id', requireAdmin, update);
router.delete('/:id', requireAdmin, remove);

export default router;