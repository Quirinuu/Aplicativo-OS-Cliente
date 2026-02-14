import express from 'express';
import {
  list,
  getById,
  create,
  update,
  remove,
  addComment,
  history
} from '../controllers/os.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// GET /api/os - Lista OS abertas (com filtros)
router.get('/', list);

// GET /api/os/history - Lista OS concluídas
router.get('/history', history);

// GET /api/os/:id - Busca OS específica
router.get('/:id', getById);

// POST /api/os - Cria OS (apenas ADMIN)
router.post('/', requireAdmin, create);

// PUT /api/os/:id - Atualiza OS (apenas ADMIN)
router.put('/:id', requireAdmin, update);

// DELETE /api/os/:id - Deleta OS (apenas ADMIN)
router.delete('/:id', requireAdmin, remove);

// POST /api/os/:id/comments - Adiciona comentário (qualquer usuário)
router.post('/:id/comments', addComment);

export default router;