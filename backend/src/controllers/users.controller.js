import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';

/**
 * GET /api/users - Lista todos os usuários
 */
export async function list(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ users });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/users/:id - Busca um usuário específico
 */
export async function getById(req, res, next) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/users - Cria um novo usuário
 */
export async function create(req, res, next) {
  try {
    const { username, email, fullName, password, role } = req.body;

    // Validar campos obrigatórios
    if (!username || !email || !fullName || !password) {
      return res.status(400).json({
        error: 'Campos obrigatórios: username, email, fullName, password'
      });
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        username,
        email,
        fullName,
        passwordHash,
        role: role || 'tech',
        isActive: true
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/users/:id - Atualiza um usuário
 */
export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { username, email, fullName, password, role, isActive } = req.body;

    // Construir dados para atualização
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (fullName) updateData.fullName = fullName;
    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    
    // Atualizar senha se fornecida
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/users/:id - Deleta um usuário (soft delete)
 */
export async function remove(req, res, next) {
  try {
    const { id } = req.params;

    // Soft delete: apenas desativa
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      message: 'Usuário desativado com sucesso',
      userId: id
    });
  } catch (error) {
    next(error);
  }
}