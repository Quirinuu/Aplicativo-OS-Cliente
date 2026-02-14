// backend/src/controllers/os.controller.js
import prisma from '../config/database.js';
import { io } from '../index.js';

/**
 * GET /api/os - Lista todas as OS
 * Query params: status, priority, clientName, equipmentName
 */
export async function list(req, res, next) {
  try {
    const { status, priority, clientName, equipmentName } = req.query;

    // Construir filtros
    const where = {};
    
    if (status && status !== 'all') {
      where.currentStatus = status;
    }
    
    if (priority && priority !== 'all') {
      where.priority = priority;
    }
    
    if (clientName) {
      where.clientName = {
        contains: clientName,
        mode: 'insensitive'
      };
    }
    
    if (equipmentName) {
      where.equipmentName = {
        contains: equipmentName,
        mode: 'insensitive'
      };
    }

    // Buscar OS
    const orders = await prisma.serviceOrder.findMany({
      where,
      include: {
        assignedToUser: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        },
        createdByUser: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: [
        { priority: 'asc' }, // URGENT primeiro (assumindo enum ordenado)
        { createdAt: 'asc' } // Mais antigas primeiro
      ]
    });

    // Mapear prioridade para ordem correta
    const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    orders.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    res.json({ orders });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/os/:id - Busca uma OS específica
 */
export async function getById(req, res, next) {
  try {
    const { id } = req.params;

    const order = await prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        assignedToUser: {
          select: {
            id: true,
            fullName: true,
            username: true,
            role: true
          }
        },
        createdByUser: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        error: 'OS não encontrada'
      });
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/os - Cria uma nova OS
 */
export async function create(req, res, next) {
  try {
    const {
      osNumber,
      equipmentName,
      clientName,
      priority,
      accessories,
      serialNumber,
      hasPreviousDefect,
      previousDefectDescription,
      currentStatus,
      equipmentClass,
      optionalDescription,
      assignedToUserId
    } = req.body;

    // Validações
    if (!osNumber || !equipmentName || !clientName) {
      return res.status(400).json({
        error: 'Campos obrigatórios: osNumber, equipmentName, clientName'
      });
    }

    if (hasPreviousDefect && !previousDefectDescription) {
      return res.status(400).json({
        error: 'Se tem defeito prévio, descrição é obrigatória'
      });
    }

    // Criar OS
    const order = await prisma.serviceOrder.create({
      data: {
        osNumber,
        equipmentName,
        clientName,
        priority: priority || 'MEDIUM',
        accessories,
        serialNumber,
        hasPreviousDefect: hasPreviousDefect || false,
        previousDefectDescription,
        currentStatus: currentStatus || 'RECEIVED',
        equipmentClass,
        optionalDescription,
        assignedToUserId,
        createdByUserId: req.user.id
      },
      include: {
        assignedToUser: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        },
        createdByUser: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        }
      }
    });

    // Emitir evento WebSocket
    io.emit('os:created', { order });

    res.status(201).json({ order });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/os/:id - Atualiza uma OS
 */
export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const {
      osNumber,
      equipmentName,
      clientName,
      priority,
      accessories,
      serialNumber,
      hasPreviousDefect,
      previousDefectDescription,
      currentStatus,
      equipmentClass,
      optionalDescription,
      assignedToUserId
    } = req.body;

    // Validações
    if (hasPreviousDefect && !previousDefectDescription) {
      return res.status(400).json({
        error: 'Se tem defeito prévio, descrição é obrigatória'
      });
    }

    // Construir dados para atualização
    const updateData = {};
    if (osNumber !== undefined) updateData.osNumber = osNumber;
    if (equipmentName !== undefined) updateData.equipmentName = equipmentName;
    if (clientName !== undefined) updateData.clientName = clientName;
    if (priority !== undefined) updateData.priority = priority;
    if (accessories !== undefined) updateData.accessories = accessories;
    if (serialNumber !== undefined) updateData.serialNumber = serialNumber;
    if (hasPreviousDefect !== undefined) updateData.hasPreviousDefect = hasPreviousDefect;
    if (previousDefectDescription !== undefined) updateData.previousDefectDescription = previousDefectDescription;
    if (currentStatus !== undefined) updateData.currentStatus = currentStatus;
    if (equipmentClass !== undefined) updateData.equipmentClass = equipmentClass;
    if (optionalDescription !== undefined) updateData.optionalDescription = optionalDescription;
    if (assignedToUserId !== undefined) updateData.assignedToUserId = assignedToUserId;

    // Se mudou para COMPLETED, setar completedAt
    if (currentStatus === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const order = await prisma.serviceOrder.update({
      where: { id },
      data: updateData,
      include: {
        assignedToUser: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        },
        createdByUser: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    // Emitir evento WebSocket
    io.emit('os:updated', { order });

    res.json({ order });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/os/:id - Soft delete de uma OS
 */
export async function remove(req, res, next) {
  try {
    const { id } = req.params;

    // Por enquanto vamos apenas marcar como COMPLETED
    const order = await prisma.serviceOrder.update({
      where: { id },
      data: {
        currentStatus: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // Emitir evento WebSocket
    io.emit('os:deleted', { orderId: id });

    res.json({
      message: 'OS finalizada',
      orderId: id
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/os/:id/comments - Adiciona comentário a uma OS
 */
export async function addComment(req, res, next) {
  try {
    const { id } = req.params;
    const { commentType, content } = req.body;

    if (!commentType || !content) {
      return res.status(400).json({
        error: 'Campos obrigatórios: commentType, content'
      });
    }

    // Validar tipo
    const validTypes = ['DIAGNOSIS', 'REPAIR', 'NOTE', 'FINAL'];
    if (!validTypes.includes(commentType)) {
      return res.status(400).json({
        error: 'Tipo inválido. Use: DIAGNOSIS, REPAIR, NOTE ou FINAL'
      });
    }

    const comment = await prisma.comment.create({
      data: {
        serviceOrderId: id,
        userId: req.user.id,
        commentType,
        content
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        }
      }
    });

    // Emitir evento WebSocket
    io.emit('comment:added', { comment, orderId: id });

    res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/os/history - Lista OS concluídas
 */
export async function history(req, res, next) {
  try {
    const { startDate, endDate, clientName, equipmentName } = req.query;

    // Construir filtros
    const where = {
      currentStatus: 'COMPLETED',
      completedAt: { not: null }
    };
    
    if (startDate || endDate) {
      where.completedAt = {};
      if (startDate) where.completedAt.gte = new Date(startDate);
      if (endDate) where.completedAt.lte = new Date(endDate);
    }
    
    if (clientName) {
      where.clientName = {
        contains: clientName,
        mode: 'insensitive'
      };
    }
    
    if (equipmentName) {
      where.equipmentName = {
        contains: equipmentName,
        mode: 'insensitive'
      };
    }

    const orders = await prisma.serviceOrder.findMany({
      where,
      include: {
        assignedToUser: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        },
        createdByUser: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { completedAt: 'desc' }
    });

    res.json({ orders });
  } catch (error) {
    next(error);
  }
}