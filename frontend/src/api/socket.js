// frontend/src/api/socket.js - MODIFICADO PARA REDE LOCAL
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { getSocketUrl } from './client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect(token) {
    if (this.socket?.connected) {
      console.log('✅ Socket já conectado');
      return;
    }

    try {
      // Obter URL do WebSocket (suporta localhost e rede local)
      const SOCKET_URL = await getSocketUrl();
      console.log('🔌 Conectando WebSocket em:', SOCKET_URL);

      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 10000
      });

      this.setupEventHandlers();
      
    } catch (error) {
      console.error('❌ Erro ao conectar WebSocket:', error);
      toast.error('Erro ao conectar sincronização em tempo real');
    }
  }

  setupEventHandlers() {
    // Evento: Conexão estabelecida
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('✅ WebSocket conectado:', this.socket.id);
      
      toast.success('🔄 Sincronização em tempo real ativada', {
        duration: 2000
      });
    });

    // Evento: Desconexão
    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('❌ WebSocket desconectado:', reason);
      
      if (reason === 'io server disconnect') {
        // Servidor desconectou, tentar reconectar manualmente
        this.socket.connect();
      }
      
      toast.warning('⏸️ Sincronização pausada', {
        duration: 2000
      });
    });

    // Evento: Erro de conexão
    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;
      console.error(`❌ Erro na conexão WebSocket (tentativa ${this.reconnectAttempts}):`, error.message);
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        toast.error('Não foi possível conectar ao servidor. Verifique a configuração de rede.', {
          duration: 5000
        });
      }
    });

    // Evento: Reconexão bem-sucedida
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconectado após ${attemptNumber} tentativa(s)`);
      this.reconnectAttempts = 0;
      
      toast.success('🔄 Reconectado ao servidor', {
        duration: 2000
      });
    });

    // Evento: Informações do servidor
    this.socket.on('server:info', (data) => {
      console.log('📡 Informações do servidor:', data);
    });

    // Evento: Pong (resposta ao ping)
    this.socket.on('pong', () => {
      console.log('🏓 Pong recebido');
    });

    // ============== EVENTOS DE NEGÓCIO ==============
    
    // OS criada
    this.socket.on('os:created', (data) => {
      console.log('📥 Nova OS criada via WebSocket:', data);
      this.trigger('os:created', data);
    });

    // OS atualizada
    this.socket.on('os:updated', (data) => {
      console.log('📝 OS atualizada via WebSocket:', data);
      this.trigger('os:updated', data);
    });

    // OS deletada
    this.socket.on('os:deleted', (data) => {
      console.log('🗑️ OS deletada via WebSocket:', data);
      this.trigger('os:deleted', data);
    });

    // Comentário adicionado
    this.socket.on('os:comment', (data) => {
      console.log('💬 Novo comentário via WebSocket:', data);
      this.trigger('os:comment', data);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Desconectando WebSocket...');
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }

  // Subscrever a uma OS específica
  subscribeToOS(osId) {
    if (this.socket?.connected) {
      this.socket.emit('os:subscribe', osId);
      console.log(`📡 Inscrito na OS ${osId}`);
    }
  }

  // Desinscrever de uma OS
  unsubscribeFromOS(osId) {
    if (this.socket?.connected) {
      this.socket.emit('os:unsubscribe', osId);
      console.log(`📡 Desinscrito da OS ${osId}`);
    }
  }

  // Enviar ping para manter conexão viva
  ping() {
    if (this.socket?.connected) {
      this.socket.emit('ping');
    }
  }

  // Registrar listener customizado
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remover listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Disparar evento para listeners registrados
  trigger(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erro ao executar listener para ${event}:`, error);
        }
      });
    }
  }

  // Verificar se está conectado
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  // Obter ID do socket
  getSocketId() {
    return this.socket?.id;
  }
}

// Exportar instância singleton
export const socketService = new SocketService();

// Iniciar ping periódico (manter conexão viva)
setInterval(() => {
  if (socketService.isSocketConnected()) {
    socketService.ping();
  }
}, 30000); // A cada 30 segundos
