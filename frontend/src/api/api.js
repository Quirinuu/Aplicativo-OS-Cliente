import backendConfig from '../config/backend';

// Configuração base da API
const API_BASE_URL = backendConfig.getBaseURL();

// Função fetch com configuração dinâmica
export async function fetchAPI(endpoint, options = {}) {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint}`;
  
  console.log('📡 API Request:', url);
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  };
  
  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ API Error:', error.message, 'at', url);
    throw error;
  }
}

// WebSocket com configuração dinâmica
export function createWebSocket(path = '') {
  const wsUrl = `${backendConfig.getWsURL()}${path}`;
  console.log('🔌 Criando WebSocket:', wsUrl);
  return new WebSocket(wsUrl);
}