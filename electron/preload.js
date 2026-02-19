const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Configuração do servidor remoto
  getServerConfig: () => ipcRenderer.invoke('get-server-config'),
  setServerConfig: (config) => ipcRenderer.invoke('set-server-config', config),
});