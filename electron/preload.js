const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getBackendPort: () => ipcRenderer.invoke('get-backend-port'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  onBackendPort: (callback) => {
    ipcRenderer.on('backend-port', (event, port) => callback(port));
  }
});