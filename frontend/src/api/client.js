// frontend/src/api/client.js
// Versão cliente: conecta a servidor remoto configurado pelo usuário

// Retorna a URL base do servidor (ex: http://192.168.0.100:5000)
export function getServerBaseURL() {
  // 1. Prioridade: variável de ambiente (útil em dev)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }

  // 2. Config salva no localStorage (definida pelo usuário na tela de configuração)
  try {
    const saved = localStorage.getItem('serverConfig');
    if (saved) {
      const config = JSON.parse(saved);
      if (config?.baseURL) return config.baseURL.replace(/\/$/, '');
    }
  } catch {}

  // 3. Fallback para dev local
  return 'http://localhost:5000';
}

async function fetchAPI(endpoint, options = {}) {
  const BASE = getServerBaseURL();
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

  const url = `${BASE}/api${endpoint}`;
  console.log(`📡 ${options.method || 'GET'} ${url}`);

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro ${response.status}`);
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

    if (data.token) localStorage.setItem('token', data.token);
    if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

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
    return fetchAPI(`/users/${id}`, { method: 'DELETE' });
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

    const qs = params.toString();
    const data = await fetchAPI(qs ? `/os?${qs}` : '/os');
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
    return fetchAPI(`/os/${id}`, { method: 'DELETE' });
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

    const qs = params.toString();
    const data = await fetchAPI(qs ? `/os/history?${qs}` : '/os/history');
    return data.orders;
  },
};

export default { auth, users, serviceOrders };