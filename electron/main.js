const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const Store = require('electron-store');
const crypto = require('crypto');

const store = new Store();

let mainWindow;
let backendProcess;
let backendPort = 5000;

const userDataPath = app.getPath('userData');
const databasePath = path.join(userDataPath, 'database');
const logsPath = path.join(userDataPath, 'logs');

function ensureDirectories() {
  [databasePath, logsPath].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  console.log(`📁 Pastas criadas em: ${userDataPath}`);
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.once('error', () => {
      server.close();
      resolve(false);
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port, '127.0.0.1');
  });
}

async function findAvailablePort() {
  const ports = [5000, 5001, 5002, 5003, 5004];
  
  for (const port of ports) {
    const available = await isPortAvailable(port);
    if (available) {
      console.log(`✅ Porta ${port} disponível`);
      return port;
    }
    console.log(`⏳ Porta ${port} ocupada, tentando próxima...`);
  }
  
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close();
      console.log(`🔍 Usando porta dinâmica: ${port}`);
      resolve(port);
    });
  });
}

async function waitForBackend(port, maxAttempts = 15) {
  const net = require('net');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const socket = new net.Socket();
        
        socket.setTimeout(1000);
        socket.once('connect', () => {
          socket.destroy();
          resolve();
        });
        
        socket.once('timeout', () => {
          socket.destroy();
          reject(new Error('Timeout'));
        });
        
        socket.once('error', (err) => {
          socket.destroy();
          reject(err);
        });
        
        socket.connect(port, '127.0.0.1');
      });
      
      console.log(`✅ Backend respondendo na porta ${port}`);
      return true;
    } catch (error) {
      console.log(`⏳ Aguardando backend... (tentativa ${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('❌ Backend não respondeu');
  return false;
}

function getNodePath() {
  const isDev = !app.isPackaged;
  
  if (isDev) {
    return process.platform === 'win32' ? 'node.exe' : 'node';
  }
  
  const possiblePaths = [
    path.join(process.resourcesPath, 'node.exe'),
    path.join(process.resourcesPath, 'app', 'node.exe'),
    path.join(process.resourcesPath, 'bin', 'node.exe'),
    'node.exe'
  ];
  
  for (const nodePath of possiblePaths) {
    if (fs.existsSync(nodePath)) {
      console.log(`✅ Node.js encontrado: ${nodePath}`);
      return nodePath;
    }
  }
  
  console.log('⚠️ Node.js empacotado não encontrado, usando node do sistema');
  return process.platform === 'win32' ? 'node.exe' : 'node';
}

async function startBackend() {
  try {
    backendPort = await findAvailablePort();
    console.log(`🔌 Usando porta: ${backendPort}`);
    
    const isDev = !app.isPackaged;
    
    let backendPath;
    if (isDev) {
      backendPath = path.join(process.cwd(), 'backend', 'src', 'index.js');
    } else {
      backendPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'src', 'index.js');
      
      if (!fs.existsSync(backendPath)) {
        console.error('❌ Backend não encontrado em app.asar.unpacked');
        console.log('Tentando caminho alternativo...');
        backendPath = path.join(process.resourcesPath, 'app', 'backend', 'src', 'index.js');
      }
      
      if (!fs.existsSync(backendPath)) {
        console.error('❌ Backend não encontrado em nenhum caminho');
        throw new Error('Backend não encontrado');
      }
    }
    
    console.log(`✅ Backend encontrado: ${backendPath}`);

    const dbPath = path.join(databasePath, 'osmanager.db');
    
    if (!fs.existsSync(path.dirname(dbPath))) {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    }

    const frontendDistPath = isDev 
      ? path.join(process.cwd(), 'frontend', 'dist')
      : path.join(process.resourcesPath, 'app', 'frontend', 'dist');

    const env = {
      ...process.env,
      PORT: backendPort.toString(),
      DATABASE_URL: `file:${dbPath}`,
      JWT_SECRET: store.get('jwtSecret') || crypto.randomBytes(64).toString('hex'),
      NODE_ENV: isDev ? 'development' : 'production',
      ELECTRON_RUN_AS_NODE: '1',
      FRONTEND_PATH: frontendDistPath
    };

    if (!store.get('jwtSecret')) {
      store.set('jwtSecret', env.JWT_SECRET);
    }

    console.log('🚀 Iniciando backend...');
    console.log('   Porta:', backendPort);
    console.log('   Database:', dbPath);
    console.log('   Frontend:', frontendDistPath);

    const nodePath = getNodePath();
    console.log(`📦 Usando Node.js: ${nodePath}`);

    const backendNodeModules = path.join(path.dirname(backendPath), '..', 'node_modules');
if (!fs.existsSync(backendNodeModules)) {
  console.log('📦 Instalando dependências do backend...');
  const npmPath = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const installProcess = spawn(npmPath, ['install', '--omit=dev'], {
    cwd: path.dirname(path.dirname(backendPath)),
    stdio: 'inherit'
  });
  
  await new Promise((resolve) => {
    installProcess.on('close', resolve);
  });
}

    backendProcess = spawn(nodePath, [backendPath], {
      env: env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      cwd: path.dirname(backendPath),
      detached: false
    });

    backendProcess.stdout.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        console.log(`[Backend] ${message}`);
      }
    });

    backendProcess.stderr.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        console.error(`[Backend Error] ${message}`);
      }
    });

    backendProcess.on('close', (code) => {
      console.log(`❌ Backend encerrado (código ${code})`);
    });

    backendProcess.on('error', (error) => {
      console.error('❌ Erro ao iniciar backend:', error.message);
    });

    const backendStarted = await waitForBackend(backendPort, 15);
    
    if (!backendStarted) {
      throw new Error('Backend não iniciou após 15 tentativas');
    }
    
    console.log('✅ Backend iniciado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao iniciar backend:', error.message);
    
    dialog.showErrorBox(
      'Erro ao Iniciar Backend',
      `Não foi possível iniciar o backend:\n\n${error.message}\n\n` +
      'Verifique se:\n' +
      '1. Node.js está instalado no sistema\n' +
      '2. Não há outra instância do OS Manager aberta\n' +
      '3. A porta 5000 não está sendo usada'
    );
    
    throw error;
  }
}

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
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
    backgroundColor: '#f5f5f5',
    show: false
  });

  // SEMPRE carregar via HTTP (tanto dev quanto produção)
  const url = isDev ? 'http://localhost:3000' : `http://localhost:${backendPort}`;
  console.log(`🌐 Carregando aplicação de: ${url}`);
  
  mainWindow.loadURL(url);

  // DevTools apenas em desenvolvimento
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    console.log('✅ Janela pronta');
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`❌ Falha ao carregar: ${validatedURL}`);
    console.error(`   Código: ${errorCode}`);
    console.error(`   Descrição: ${errorDescription}`);
    
    // Se falhar ao carregar, tenta recarregar após 2 segundos
    if (errorCode === -102 || errorCode === -6) {
      console.log('⏳ Tentando recarregar em 2 segundos...');
      setTimeout(() => {
        mainWindow.loadURL(url);
      }, 2000);
    }
  });
}

ipcMain.handle('get-backend-port', () => {
  return backendPort;
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('⚠️ Outra instância já está rodando. Saindo...');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(async () => {
  try {
    console.log('🚀 Iniciando OS Manager...');
    console.log(`📍 isDev: ${!app.isPackaged}`);
    console.log(`📍 resourcesPath: ${process.resourcesPath}`);
    
    ensureDirectories();
    await startBackend();
    
    // Aguardar 2 segundos adicionais para garantir que o backend está servindo arquivos
    console.log('⏳ Aguardando backend ficar pronto...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  console.log('🛑 Encerrando backend...');
  if (backendProcess) {
    backendProcess.kill();
  }
});

process.on('uncaughtException', (error) => {
  console.error('💥 Exceção não capturada:', error.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Promise rejeitada:', reason);
});