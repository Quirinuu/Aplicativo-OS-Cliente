// frontend/src/api/client.js
// Gerenciador de porta do backend
let backendPort = null;

// Função para obter a porta do backend
async function getBackendPort() {
  if (backendPort) return backendPort;
  
  // Se estiver no Electron, pegar porta dinâmica
  if (window.electronAPI) {
    try {
      backendPort = await window.electronAPI.getBackendPort();
      console.log('🔌 Porta do backend (Electron):', backendPort);
      return backendPort;
    } catch (error) {
      console.error('Erro ao obter porta do Electron:', error);
    }
  }
  
  // Fallback para desenvolvimento (navegador)
  backendPort = 3001;
  console.log('🔌 Porta do backend (Browser):', backendPort);
  return backendPort;
}

// Função para obter URL da API
async function getApiUrl() {
  const port = await getBackendPort();
  return `http://localhost:${port}/api`;
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

  console.log(`📡 Fazendo requisição: ${API_URL}${endpoint}`);
  
  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || 'Erro na requisição');
  }

  return response.json();
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

export default { auth, users, serviceOrders };