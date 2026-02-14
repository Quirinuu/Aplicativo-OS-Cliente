const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes
  await prisma.auditLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.serviceOrderTechnician.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.systemConfig.deleteMany();
  await prisma.user.deleteMany();

  // Criar usuários
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
  const hashedPasswordTech = await bcrypt.hash('tech123', 10);
  const hashedPasswordReception = await bcrypt.hash('recep123', 10);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@osmanager.com',
      passwordHash: hashedPasswordAdmin,
      fullName: 'Administrador do Sistema',
      role: 'admin',
      isActive: true
    }
  });

  const tech1 = await prisma.user.create({
    data: {
      username: 'tecnico1',
      email: 'tecnico1@osmanager.com',
      passwordHash: hashedPasswordTech,
      fullName: 'João Silva - Técnico',
      role: 'tech',
      isActive: true
    }
  });

  const reception1 = await prisma.user.create({
    data: {
      username: 'recepcao1',
      email: 'recepcao@osmanager.com',
      passwordHash: hashedPasswordReception,
      fullName: 'Maria Santos - Recepção',
      role: 'reception',
      isActive: true
    }
  });

  console.log('✅ Usuários criados');

  // Configurações do sistema (individualmente, pois SQLite não tem createMany)
  await prisma.systemConfig.create({
    data: {
      key: 'priorities',
      value: JSON.stringify([
        { value: 'BAIXA', label: 'Baixa', color: 'green' },
        { value: 'MEDIA', label: 'Média', color: 'yellow' },
        { value: 'ALTA', label: 'Alta', color: 'orange' },
        { value: 'URGENTE', label: 'Urgente', color: 'red' }
      ]),
      description: 'Níveis de prioridade das ordens de serviço'
    }
  });

  await prisma.systemConfig.create({
    data: {
      key: 'statuses',
      value: JSON.stringify([
        { value: 'PENDING', label: 'Pendente', color: 'gray' },
        { value: 'IN_PROGRESS', label: 'Em Andamento', color: 'blue' },
        { value: 'WAITING_PARTS', label: 'Aguardando Peças', color: 'yellow' },
        { value: 'TESTING', label: 'Em Teste', color: 'purple' },
        { value: 'COMPLETED', label: 'Concluída', color: 'green' }
      ]),
      description: 'Status possíveis das ordens de serviço'
    }
  });

  await prisma.systemConfig.create({
    data: {
      key: 'equipmentClasses',
      value: JSON.stringify([
        { value: 'ELETROMEDICO', label: 'Eletromédico' },
        { value: 'INFORMATICA', label: 'Informática' },
        { value: 'MOBILIARIO', label: 'Mobiliário' },
        { value: 'HIDRAULICA', label: 'Hidráulica' },
        { value: 'ELETRICA', label: 'Elétrica' },
        { value: 'CLIMATIZACAO', label: 'Climatização' },
        { value: 'OUTROS', label: 'Outros' }
      ]),
      description: 'Classificações de equipamentos'
    }
  });

  console.log('✅ Configurações do sistema criadas');

  // Permissões (criar individualmente)
  const permissions = [
    // Admin - tudo
    { role: 'admin', action: 'CREATE_OS', allowed: true },
    { role: 'admin', action: 'EDIT_OS', allowed: true },
    { role: 'admin', action: 'DELETE_OS', allowed: true },
    { role: 'admin', action: 'VIEW_OS', allowed: true },
    { role: 'admin', action: 'COMPLETE_OS', allowed: true },
    { role: 'admin', action: 'REOPEN_OS', allowed: true },
    { role: 'admin', action: 'MANAGE_USERS', allowed: true },
    { role: 'admin', action: 'VIEW_AUDIT', allowed: true },
    { role: 'admin', action: 'MANAGE_CONFIG', allowed: true },
    { role: 'admin', action: 'ADD_COMMENT', allowed: true },
    { role: 'admin', action: 'ASSIGN_TECHS', allowed: true },
    
    // Reception
    { role: 'reception', action: 'CREATE_OS', allowed: true },
    { role: 'reception', action: 'EDIT_OS', allowed: true },
    { role: 'reception', action: 'DELETE_OS', allowed: false },
    { role: 'reception', action: 'VIEW_OS', allowed: true },
    { role: 'reception', action: 'COMPLETE_OS', allowed: false },
    { role: 'reception', action: 'REOPEN_OS', allowed: false },
    { role: 'reception', action: 'MANAGE_USERS', allowed: false },
    { role: 'reception', action: 'VIEW_AUDIT', allowed: false },
    { role: 'reception', action: 'MANAGE_CONFIG', allowed: false },
    { role: 'reception', action: 'ADD_COMMENT', allowed: true },
    { role: 'reception', action: 'ASSIGN_TECHS', allowed: true },
    
    // Tech
    { role: 'tech', action: 'CREATE_OS', allowed: false },
    { role: 'tech', action: 'EDIT_OS', allowed: true },
    { role: 'tech', action: 'DELETE_OS', allowed: false },
    { role: 'tech', action: 'VIEW_OS', allowed: true },
    { role: 'tech', action: 'COMPLETE_OS', allowed: true },
    { role: 'tech', action: 'REOPEN_OS', allowed: false },
    { role: 'tech', action: 'MANAGE_USERS', allowed: false },
    { role: 'tech', action: 'VIEW_AUDIT', allowed: false },
    { role: 'tech', action: 'MANAGE_CONFIG', allowed: false },
    { role: 'tech', action: 'ADD_COMMENT', allowed: true },
    { role: 'tech', action: 'ASSIGN_TECHS', allowed: false }
  ];

  // Criar cada permissão individualmente
  for (const permission of permissions) {
    await prisma.permission.create({
      data: permission
    });
  }

  console.log('✅ Permissões configuradas');

  // OS de exemplo
  const today = new Date();
  const osNumber = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}-0001`;

  const exampleOS = await prisma.serviceOrder.create({
    data: {
      osNumber,
      equipmentName: 'Monitor Multiparamétrico',
      clientName: 'UTI - Leito 03',
      priority: 'ALTA',
      accessories: 'Cabo de ECG, sensor de SpO2',
      serialNumber: 'MON-2023-1547',
      hasPreviousDefect: true,
      previousDefectDescription: 'Já apresentou problema no display anteriormente',
      currentStatus: 'IN_PROGRESS',
      equipmentClass: 'ELETROMEDICO',
      optionalDescription: 'Display apresentando falhas intermitentes',
      createdByUserId: reception1.id
    }
  });

  // Atribuir técnico
  await prisma.serviceOrderTechnician.create({
    data: {
      serviceOrderId: exampleOS.id,
      userId: tech1.id
    }
  });

  // Adicionar comentário
  await prisma.comment.create({
    data: {
      serviceOrderId: exampleOS.id,
      userId: tech1.id,
      commentType: 'DIAGNOSTIC',
      content: 'Display com conector solto. Necessário ressolda.'
    }
  });

  console.log('✅ Ordem de serviço de exemplo criada');

  // Log de auditoria
  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: 'SYSTEM_INIT',
      entityType: 'SYSTEM',
      description: 'Sistema inicializado com dados padrão',
      ipAddress: '127.0.0.1'
    }
  });

  console.log('✅ Log de auditoria criado');

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📝 Usuários criados:');
  console.log('   Admin: admin / admin123');
  console.log('   Técnico: tecnico1 / tech123');
  console.log('   Recepção: recepcao1 / recep123');
  console.log('\n💾 Banco de dados: osmanager.db');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });