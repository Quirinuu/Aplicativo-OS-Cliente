// frontend/src/api/socket.js
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { getServerBaseURL } from './client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket?.connected) return;

    const SERVER_URL = getServerBaseURL();
    console.log('🔌 Conectando socket em:', SERVER_URL);

    this.socket = io(SERVER_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket conectado:', this.socket.id);
      toast.success('Sincronização em tempo real ativada', { duration: 2000 });
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
      toast.warning('Sincronização pausada', { duration: 2000 });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erro WebSocket:', error.message);
    });

    // Repassar eventos do servidor para os listeners registrados
    ['os:created', 'os:updated', 'os:deleted', 'os:comment', 'server:info'].forEach(event => {
      this.socket.on(event, (data) => {
        this._emit(event, data);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  // Registrar listener de evento
  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const cbs = this.listeners.get(event);
      const i = cbs.indexOf(callback);
      if (i > -1) cbs.splice(i, 1);
    }
  }

  _emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => cb(data));
    }
  }

  get isConnected() {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();