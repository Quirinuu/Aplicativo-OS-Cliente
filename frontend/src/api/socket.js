// frontend/src/api/socket.js
import { io } from 'socket.io-client';
import { toast } from 'sonner';

// Função para obter a porta do backend
async function getBackendPort() {
  // Se estiver no Electron, pegar porta dinâmica
  if (window.electronAPI) {
    try {
      const port = await window.electronAPI.getBackendPort();
      console.log('🔌 Socket - Porta do backend (Electron):', port);
      return port;
    } catch (error) {
      console.error('Erro ao obter porta do Electron:', error);
    }
  }
  
  // Fallback para desenvolvimento (navegador)
  console.log('🔌 Socket - Porta do backend (Browser): 3001');
  return 3001;
}

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.backendPort = null;
  }

  async connect(token) {
    if (this.socket?.connected) {
      console.log('Socket já conectado');
      return;
    }

    // Obter porta do backend
    if (!this.backendPort) {
      this.backendPort = await getBackendPort();
    }

    const SOCKET_URL = `http://localhost:${this.backendPort}`;
    console.log('🔌 Conectando socket em:', SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket conectado:', this.socket.id);
      toast.success('Sincronização em tempo real ativada', {
        duration: 2000
      });
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
      toast.warning('Sincronização pausada', {
        duration: 2000
      });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erro na conexão WebSocket:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  trigger(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }
}

export const socketService = new SocketService();