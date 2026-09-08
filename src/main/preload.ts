import { contextBridge, ipcRenderer } from 'electron';

/**
 * Expose secure IPC bridge to renderer process.
 */
contextBridge.exposeInMainWorld('gymScoreApi', {
  getServerPort: (): Promise<number> => ipcRenderer.invoke('get-server-port'),
  getNetworkInfo: (): Promise<unknown> => ipcRenderer.invoke('get-network-info')
});
