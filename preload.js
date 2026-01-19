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

  // === Actualizaciones ===
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
});