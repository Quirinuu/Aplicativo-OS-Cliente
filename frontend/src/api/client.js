// frontend/src/api/client.js - MODIFICADO PARA REDE LOCAL
// Gerenciador de conexão com backend via rede local

let backendPort = null;
let backendHost = null;

// Função para obter configuração do servidor (IP + porta)
async function getBackendConfig() {
  // Se já temos configuração, retornar
  if (backendHost && backendPort) {
    return { host: backendHost, port: backendPort };
  }
  
  // 1. Tentar obter do Electron (quando rodando empacotado)
  if (window.electronAPI) {
    try {
      backendPort = await window.electronAPI.getBackendPort();
      backendHost = 'localhost'; // Electron sempre usa localhost
      console.log('🔌 Conectando via Electron:', `${backendHost}:${backendPort}`);
      return { host: backendHost, port: backendPort };
    } catch (error) {
      console.error('Erro ao obter porta do Electron:', error);
    }
  }
  
  // 2. Tentar obter do localStorage (configuração manual de rede)
  const savedHost = localStorage.getItem('backend_host');
  const savedPort = localStorage.getItem('backend_port');
  
  if (savedHost && savedPort) {
    backendHost = savedHost;
    backendPort = parseInt(savedPort);
    console.log('🌐 Usando servidor salvo:', `${backendHost}:${backendPort}`);
    return { host: backendHost, port: backendPort };
  }
  
  // 3. Fallback para desenvolvimento local
  backendHost = 'localhost';
  backendPort = 3001;
  console.log('💻 Modo desenvolvimento:', `${backendHost}:${backendPort}`);
  return { host: backendHost, port: backendPort };
}

// Função para configurar servidor manualmente (para rede local)
export async function configureBackendServer(host, port) {
  console.log('⚙️ Configurando servidor:', `${host}:${port}`);
  
  // Testar conexão
  try {
    const response = await fetch(`http://${host}:${port}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error('Servidor não respondeu corretamente');
    }
    
    const data = await response.json();
    console.log('✅ Servidor acessível:', data);
    
    // Salvar configuração
    localStorage.setItem('backend_host', host);
    localStorage.setItem('backend_port', port.toString());
    
    // Atualizar variáveis globais
    backendHost = host;
    backendPort = port;
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erro ao conectar:', error);
    throw new Error(`Não foi possível conectar ao servidor ${host}:${port}`);
  }
}

// Função para obter URL da API
async function getApiUrl() {
  const { host, port } = await getBackendConfig();
  return `http://${host}:${port}/api`;
}

// Função para obter URL do WebSocket
export async function getSocketUrl() {
  const { host, port } = await getBackendConfig();
  return `http://${host}:${port}`;
}

// Helper para fazer requisições
async function fetchAPI(endpoint, options = {}) {
  const API_URL = await getApiUrl();
  const token = localStorage.getItem('token');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log(`📡 Requisição: ${API_URL}${endpoint}`);
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(error.error || 'Erro na requisição');
    }

    return response.json();
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    throw error;
  }
}

// API de Autenticação
export const auth = {
  login: async (username, password) => {
    const data = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  me: async () => {
    const data = await fetchAPI('/auth/me');
    return data.user;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// API de Usuários
export const users = {
  list: async () => {
    const data = await fetchAPI('/users');
    return data.users;
  },

  getById: async (id) => {
    const data = await fetchAPI(`/users/${id}`);
    return data.user;
  },

  create: async (userData) => {
    const data = await fetchAPI('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return data.user;
  },

  update: async (id, userData) => {
    const data = await fetchAPI(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return data.user;
  },

  delete: async (id) => {
    return fetchAPI(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// API de OS
export const serviceOrders = {
  list: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority);
    if (filters.clientName) params.append('clientName', filters.clientName);
    if (filters.equipmentName) params.append('equipmentName', filters.equipmentName);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/os?${queryString}` : '/os';
    
    const data = await fetchAPI(endpoint);
    return data.orders;
  },

  getById: async (id) => {
    const data = await fetchAPI(`/os/${id}`);
    return data.order;
  },

  create: async (osData) => {
    const data = await fetchAPI('/os', {
      method: 'POST',
      body: JSON.stringify(osData),
    });
    return data.order;
  },

  update: async (id, osData) => {
    const data = await fetchAPI(`/os/${id}`, {
      method: 'PUT',
      body: JSON.stringify(osData),
    });
    return data.order;
  },

  delete: async (id) => {
    return fetchAPI(`/os/${id}`, {
      method: 'DELETE',
    });
  },

  addComment: async (osId, commentData) => {
    const data = await fetchAPI(`/os/${osId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
    return data.comment;
  },

  history: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.clientName) params.append('clientName', filters.clientName);
    if (filters.equipmentName) params.append('equipmentName', filters.equipmentName);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/os/history?${queryString}` : '/os/history';
    
    const data = await fetchAPI(endpoint);
    return data.orders;
  },
};

// API de informações de rede (útil para debug)
export const network = {
  getInfo: async () => {
    const data = await fetchAPI('/network/info');
    return data;
  }
};

export default { auth, users, serviceOrders, network, configureBackendServer, getSocketUrl };
