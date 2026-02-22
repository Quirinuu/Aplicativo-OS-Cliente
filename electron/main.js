// electron/main.js — APP CLIENTE (sem backend)
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs   = require('fs');
const Store = require('electron-store');
const { shoClient } = require('./shoficina-client');

const store = new Store();
let mainWindow;

function createWindow() {
  const isDev = !app.isPackaged;

  let iconPath;
  if (isDev) {
    iconPath = path.join(__dirname, '..', 'build', 'icon.ico');
  } else {
    iconPath = path.join(process.resourcesPath, 'build', 'icon.ico');
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    autoHideMenuBar: true,
    backgroundColor: '#f5f5f5',
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(process.resourcesPath, 'frontend', 'dist', 'index.html');
    console.log(`📂 Carregando frontend de: ${indexPath}`);
    mainWindow.loadFile(indexPath);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('✅ Janela pronta');
  });

  // Tenta iniciar o sync SHOficina quando a página carrega
  // (caso o usuário já estava logado antes de fechar o app)
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      JSON.stringify({
        token: localStorage.getItem('token'),
        serverConfig: localStorage.getItem('serverConfig')
      })
    `).then(result => {
      try {
        const { token, serverConfig } = JSON.parse(result);
        const config = serverConfig ? JSON.parse(serverConfig) : null;
        if (token && config?.baseURL) {
          console.log('[SHOficina-C] Token encontrado — iniciando sync automático');
          shoClient.start({ serverUrl: config.baseURL, token });
        }
      } catch (e) {
        console.error('[SHOficina-C] Erro ao ler localStorage:', e.message);
      }
    }).catch(() => {});
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`❌ Falha ao carregar (${errorCode}): ${errorDescription}`);
  });
}

// ── IPC: configuração do servidor ─────────────────────────────────────────────
ipcMain.handle('get-server-config', () => store.get('serverConfig', null));
ipcMain.handle('set-server-config', (event, config) => { store.set('serverConfig', config); return true; });
ipcMain.handle('get-app-version', () => app.getVersion());

// ── IPC: sync SHOficina (chamado pelo Login após autenticação) ─────────────────
ipcMain.on('sho:update-auth', (event, { serverUrl, token }) => {
  console.log('[SHOficina-C] Auth atualizado via login');
  shoClient.updateServerUrl(serverUrl);
  shoClient.updateToken(token);

  // Se o sync ainda não iniciou (primeiro login), inicia agora
  if (!shoClient.timer) {
    shoClient.start({ serverUrl, token });
  }
});

// ── Instância única ────────────────────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  console.log('🚀 OS Manager Cliente iniciando...');
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    shoClient.stop();
    app.quit();
  }
});

process.on('uncaughtException', (error) => {
  console.error('💥 Exceção não capturada:', error.message);
});