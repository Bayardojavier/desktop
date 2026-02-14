// desktop/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Exponer solo lo necesario al renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // === Controles de ventana ===
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // === Splash screen ===
  closeSplash: () => ipcRenderer.send('close-splash'),

  // === Desarrollo ===
  isPackaged: ipcRenderer.sendSync('is-packaged'),
  clearCache: () => ipcRenderer.invoke('clear-cache'),

  // === Exportaciones ===
  savePdf: (payload) => ipcRenderer.invoke('save-pdf', payload),
  renderHtmlToPdf: (payload) => ipcRenderer.invoke('render-html-to-pdf', payload),
  getAssetDataUrl: (payload) => ipcRenderer.invoke('get-asset-data-url', payload),

  // === Actualizaciones ===
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

  // === Información de la app ===
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // === Configuración de ventana ===
  getWindowConfig: () => ipcRenderer.invoke('get-window-config'),
  setWindowConfig: (config) => ipcRenderer.invoke('set-window-config', config),
  restartApp: () => ipcRenderer.send('restart-app'),
  // === Utilitarios de red (scripts elevables) ===
  runSetDns: () => ipcRenderer.invoke('run-set-dns'),
  runRestoreDns: () => ipcRenderer.invoke('run-restore-dns'),
  openToolsFolder: () => ipcRenderer.invoke('open-tools-dir'),
});