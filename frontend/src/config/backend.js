// Configuração dinâmica do backend
class BackendConfig {
  constructor() {
    this.config = window.BACKEND_CONFIG || this.getDefaultConfig();
    console.log('⚙️ Backend Config:', this.config);
  }
  
  getDefaultConfig() {
    // Modo desenvolvimento vs produção
    const isDev = import.meta.env.DEV;
    const isElectron = !!window.electronAPI;
    
    if (isElectron && window.electronAPI) {
      // Electron fornecerá a porta via IPC
      return {
        baseURL: 'http://localhost:5001', // Temporário até receber do Electron
        wsURL: 'ws://localhost:5001',
        isElectron: true
      };
    }
    
    // Desenvolvimento web padrão
    return {
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
      wsURL: import.meta.env.VITE_WS_URL || 'ws://localhost:5001',
      isElectron: false
    };
  }
  
  getBaseURL() {
    return this.config.baseURL;
  }
  
  getWsURL() {
    return this.config.wsURL;
  }
  
  updatePort(port) {
    if (port && port !== this.config.port) {
      this.config.port = port;
      this.config.baseURL = `http://localhost:${port}`;
      this.config.wsURL = `ws://localhost:${port}`;
      console.log('🔄 Backend config atualizado:', this.config);
    }
  }
}

// Instância global
const backendConfig = new BackendConfig();
export default backendConfig;