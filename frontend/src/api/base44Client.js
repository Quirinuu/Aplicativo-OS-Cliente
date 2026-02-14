// src/api/base44Client.js

// Mock de dados para desenvolvimento
let mockServiceOrders = [
  {
    id: '1',
    os_number: 'OS-2026-001',
    equipment_name: 'Monitor Multiparamétrico',
    client_name: 'Hospital São Lucas',
    priority: 'URGENT',
    current_status: 'ANALYSIS',
    accessories: 'Cabo de energia, sensor SPO2',
    serial_number: 'MON-12345',
    has_previous_defect: true,
    previous_defect_description: 'Tela piscando intermitentemente',
    equipment_class: 'MONITORING',
    optional_description: 'Equipamento crítico da UTI',
    assigned_to_user_id: '2',
    created_date: new Date('2026-01-25').toISOString(),
    updated_at: new Date('2026-01-28').toISOString(),
    completed_at: null,
  },
  {
    id: '2',
    os_number: 'OS-2026-002',
    equipment_name: 'Ventilador Pulmonar',
    client_name: 'Clínica Respirare',
    priority: 'HIGH',
    current_status: 'MAINTENANCE',
    accessories: 'Circuito respiratório, filtros',
    serial_number: 'VENT-67890',
    has_previous_defect: false,
    previous_defect_description: '',
    equipment_class: 'LIFE_SUPPORT',
    optional_description: '',
    assigned_to_user_id: '2',
    created_date: new Date('2026-01-26').toISOString(),
    updated_at: new Date('2026-01-27').toISOString(),
    completed_at: null,
  },
  {
    id: '3',
    os_number: 'OS-2026-003',
    equipment_name: 'Desfibrilador',
    client_name: 'Hospital São Lucas',
    priority: 'MEDIUM',
    current_status: 'COMPLETED',
    accessories: 'Pás adulto e pediátrico',
    serial_number: 'DEF-11111',
    has_previous_defect: false,
    previous_defect_description: '',
    equipment_class: 'EMERGENCY',
    optional_description: 'Revisão preventiva',
    assigned_to_user_id: '2',
    created_date: new Date('2026-01-20').toISOString(),
    updated_at: new Date('2026-01-24').toISOString(),
    completed_at: new Date('2026-01-24').toISOString(),
  },
];

let mockUsers = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@systemos.com',
    role: 'admin',
    full_name: 'Administrador',
    is_active: true,
  },
  {
    id: '2',
    username: 'joao.silva',
    email: 'joao.silva@systemos.com',
    role: 'tech',
    full_name: 'João Silva',
    is_active: true,
    created_at: new Date('2026-01-15').toISOString(),
    updated_at: new Date('2026-01-15').toISOString(),
  },
];

let mockComments = [
  {
    id: '1',
    service_order_id: '1',
    author_user_id: '2',
    comment_type: 'DIAGNOSIS',
    body: 'Verificado problema na placa de vídeo. Componentes oxidados.',
    created_at: new Date('2026-01-25T10:30:00').toISOString(),
  },
  {
    id: '2',
    service_order_id: '1',
    author_user_id: '2',
    comment_type: 'REPAIR',
    body: 'Substituída placa de vídeo. Aguardando testes.',
    created_at: new Date('2026-01-26T14:15:00').toISOString(),
  },
];

// Listeners para real-time simulation
let listeners = [];

// Simular delay de rede
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Base44 Client
export const base44 = {
  // Authentication
  auth: {
    me: async () => {
      await delay(300);
      return mockUsers[0]; // Sempre retorna admin para desenvolvimento
    },
    login: async (username, password) => {
      await delay(500);
      const user = mockUsers.find((u) => u.username === username);
      if (user) {
        return { success: true, user };
      }
      throw new Error('Credenciais inválidas');
    },
    logout: () => {
      console.log('Logout chamado');
      // Em produção, limpar token/session
      window.location.href = '/login';
    },
  },

  // Entities
  entities: {
    // Service Orders
    ServiceOrder: {
      list: async (sort = '-created_date') => {
        await delay(400);
        let orders = [...mockServiceOrders];
        
        // Simple sorting
        if (sort === '-created_date') {
          orders.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        }
        
        return orders;
      },

      get: async (id) => {
        await delay(300);
        const order = mockServiceOrders.find((o) => o.id === id);
        if (!order) {
          throw new Error('OS não encontrada');
        }
        return order;
      },

      create: async (data) => {
        await delay(500);
        const newOrder = {
          id: String(mockServiceOrders.length + 1),
          ...data,
          created_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          completed_at: null,
        };
        mockServiceOrders.push(newOrder);
        
        // Notify listeners
        listeners.forEach((listener) => {
          listener({ type: 'create', data: newOrder });
        });
        
        return newOrder;
      },

      update: async (id, data) => {
        await delay(400);
        const index = mockServiceOrders.findIndex((o) => o.id === id);
        if (index === -1) {
          throw new Error('OS não encontrada');
        }
        
        mockServiceOrders[index] = {
          ...mockServiceOrders[index],
          ...data,
          updated_at: new Date().toISOString(),
        };
        
        // Notify listeners
        listeners.forEach((listener) => {
          listener({ type: 'update', data: mockServiceOrders[index] });
        });
        
        return mockServiceOrders[index];
      },

      delete: async (id) => {
        await delay(300);
        const index = mockServiceOrders.findIndex((o) => o.id === id);
        if (index === -1) {
          throw new Error('OS não encontrada');
        }
        
        const deleted = mockServiceOrders.splice(index, 1)[0];
        
        // Notify listeners
        listeners.forEach((listener) => {
          listener({ type: 'delete', data: deleted });
        });
        
        return { success: true };
      },

      subscribe: (callback) => {
        listeners.push(callback);
        
        // Return unsubscribe function
        return () => {
          listeners = listeners.filter((l) => l !== callback);
        };
      },
    },

    // Users
    User: {
      list: async () => {
        await delay(300);
        return [...mockUsers];
      },

      get: async (id) => {
        await delay(200);
        const user = mockUsers.find((u) => u.id === id);
        if (!user) {
          throw new Error('Usuário não encontrado');
        }
        return user;
      },

      create: async (data) => {
        await delay(400);
        const newUser = {
          id: String(mockUsers.length + 1),
          ...data,
          is_active: true,
        };
        mockUsers.push(newUser);
        return newUser;
      },

      update: async (id, data) => {
        await delay(300);
        const index = mockUsers.findIndex((u) => u.id === id);
        if (index === -1) {
          throw new Error('Usuário não encontrado');
        }
        
        mockUsers[index] = {
          ...mockUsers[index],
          ...data,
        };
        
        return mockUsers[index];
      },

      delete: async (id) => {
        await delay(300);
        const index = mockUsers.findIndex((u) => u.id === id);
        if (index === -1) {
          throw new Error('Usuário não encontrado');
        }
        
        mockUsers.splice(index, 1);
        return { success: true };
      },
    },

    // Comments
    Comment: {
      list: async (serviceOrderId) => {
        await delay(200);
        return mockComments.filter((c) => c.service_order_id === serviceOrderId);
      },

      create: async (data) => {
        await delay(300);
        const newComment = {
          id: String(mockComments.length + 1),
          ...data,
          created_at: new Date().toISOString(),
        };
        mockComments.push(newComment);
        
        // Notify listeners about comment
        listeners.forEach((listener) => {
          listener({ type: 'comment_added', data: newComment });
        });
        
        return newComment;
      },
    },
  },
};

// Exportar como default também para compatibilidade
export default base44;