import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import http from 'node:http';
import { startServer } from '../server/server';
import { NetworkService } from '../server/services/network.service';
import { getDatabaseManager } from '../server/db/database';

let mainWindow: BrowserWindow | null = null;
let httpServer: http.Server | null = null;
const SERVER_PORT = Number(process.env.PORT || 3000);

/**
 * Creates the primary coordinator desktop window.
 */
function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    title: 'GymScore Local — Sport-Assessment-Manager',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  win.on('closed', () => {
    mainWindow = null;
  });

  return win;
}

/**
 * IPC handler registrations for desktop coordination.
 */
function registerIpcHandlers(): void {
  ipcMain.handle('get-server-port', () => SERVER_PORT);

  ipcMain.handle('get-network-info', async () => {
    return NetworkService.getNetworkInfo(SERVER_PORT);
  });
}

/**
 * Application startup lifecycle orchestration.
 */
app.whenReady().then(async () => {
  try {
    httpServer = await startServer(SERVER_PORT);
    registerIpcHandlers();
    mainWindow = createMainWindow();
  } catch (error) {
    console.error('Failed to start GymScore Local application:', error);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    }
  });
});

/**
 * Graceful cleanup of background servers and database locks.
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (httpServer) {
    httpServer.close();
  }

  getDatabaseManager().close();
});
