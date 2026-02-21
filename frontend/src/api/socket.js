import { io } from 'socket.io-client';
import { toast } from 'sonner';

function getBackendURL() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  try {
    const saved = localStorage.getItem('serverConfig');
    if (saved) {
      const config = JSON.parse(saved);
      if (config?.baseURL) return config.baseURL.replace(/\/$/, '');
    }
  } catch {}

  // Sem config: usa o mesmo host (funciona para o servidor)
  const { protocol, hostname, port } = window.location;
  const p = port || (protocol === 'https:' ? '443' : '80');
  return `${protocol}//${hostname}:${p}`;
}

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this._connectionListeners = [];
  }

  connect(token) {
    if (this.socket?.connected) return;

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    const SERVER_URL = getBackendURL();
    if (!SERVER_URL) return;

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
      this._notifyConnection(true);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
      toast.warning('Sincronização offline', { duration: 3000 });
      this._notifyConnection(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erro WebSocket:', error.message);
      this._notifyConnection(false);
    });

    ['os:created', 'os:updated', 'os:deleted', 'os:comment', 'server:info'].forEach(event => {
      this.socket.on(event, (data) => {
        console.log(`📨 ${event}`, data);
        this._fire(event, data);
      });
    });
  }

  // Desconecta o socket MAS mantém os listeners de conexão registrados
  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
    // NÃO limpa _connectionListeners aqui — isso quebrava o badge de status
  }

  // Destroi completamente (usar só no logout real)
  destroy() {
    this.disconnect();
    this._connectionListeners = [];
  }

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

  onConnectionChange(callback) {
    this._connectionListeners.push(callback);
    return () => {
      this._connectionListeners = this._connectionListeners.filter(c => c !== callback);
    };
  }

  get isConnected() {
    return this.socket?.connected ?? false;
  }

  _fire(event, data) {
    (this.listeners.get(event) || []).forEach(cb => {
      try { cb(data); } catch (e) { console.error(`Listener ${event}:`, e); }
    });
  }

  _notifyConnection(status) {
    this._connectionListeners.forEach(cb => { try { cb(status); } catch (e) {} });
  }
}

export const socketService = new SocketService();