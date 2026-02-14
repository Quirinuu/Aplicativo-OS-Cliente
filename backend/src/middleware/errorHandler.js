/**
 * Middleware global de tratamento de erros
 */
export default function errorHandler(err, req, res, next) {
  console.error('❌ Erro:', err);

  // Erro de validação do Prisma
  if (err.code === 'P2002') {
    return res.status(400).json({
      error: 'Já existe um registro com esses dados únicos',
      field: err.meta?.target
    });
  }

  // Erro de registro não encontrado
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Registro não encontrado'
    });
  }

  // Erro genérico
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor'
  });
}