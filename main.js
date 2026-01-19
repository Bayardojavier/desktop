// desktop/main.js
const { app, BrowserWindow, Menu, ipcMain, session, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let splashWindow;

// Export: guardar PDF generado en renderer (registrado una vez)
ipcMain.handle('save-pdf', async (event, payload) => {
  try {
    const filename = (payload && payload.filename) ? String(payload.filename) : 'export.pdf';
    const dataBase64 = (payload && payload.dataBase64) ? String(payload.dataBase64) : '';
    if (!dataBase64) return { canceled: true };

    const win = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Guardar PDF',
      defaultPath: filename,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    });

    if (canceled || !filePath) return { canceled: true };

    const buf = Buffer.from(dataBase64, 'base64');
    fs.writeFileSync(filePath, buf);
    return { canceled: false, filePath };
  } catch (err) {
    console.error('save-pdf error:', err);
    return { canceled: true, error: err && err.message ? err.message : String(err) };
  }
});

function createWindow() {
  // === Ventana de Splash ===
  splashWindow = new BrowserWindow({
    width: 464,
    height: 688,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    backgroundColor: '#000000',
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: false // Splash no necesita DevTools
    }
  });

  splashWindow.webContents.on('context-menu', (e) => e.preventDefault());
  splashWindow.loadFile('splash.html');

  // === Ventana Principal ===
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    frame: false, // Sin barra de Windows
    show: false,  // Oculta hasta que el splash termine
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // ✅ Habilitar DevTools solo en desarrollo
      devTools: !app.isPackaged
    }
  });

  mainWindow.webContents.on('context-menu', (e) => e.preventDefault());

  // Cargar la app principal
  mainWindow.loadFile('index.html');
  

  // ✅ Abrir DevTools automáticamente en modo desarrollo (opcional, comenta si no lo deseas)
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: 'right' });
  }

  // Configurar auto-updater
  autoUpdater.checkForUpdatesAndNotify();

  // === IPC Handlers ===
  // Cerrar splash
  ipcMain.on('close-splash', () => {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show();
    }
  });

  // Controles de ventana
  ipcMain.on('window-minimize', () => mainWindow?.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow) {
      mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
    }
  });
  ipcMain.on('window-close', () => mainWindow?.close());

  // Desarrollo: isPackaged (sincrónico)
  ipcMain.on('is-packaged', (event) => {
    event.returnValue = app.isPackaged;
  });

  // Desarrollo: limpiar caché (asincrónico)
  ipcMain.handle('clear-cache', async () => {
    await session.defaultSession.clearCache();
    console.log('🧹 Caché limpiada.');
  });

  // Actualización manual
  ipcMain.handle('check-for-updates', async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      if (result.updateInfo.version !== app.getVersion()) {
        await autoUpdater.downloadUpdate();
        autoUpdater.quitAndInstall();
      } else {
        return { message: 'La aplicación está actualizada.' };
      }
    } catch (error) {
      return { error: error.message };
    }
  });
}

// === Inicialización de la app ===
app.whenReady().then(() => {
  createWindow();
  Menu.setApplicationMenu(null); // Elimina menú nativo

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Export: renderizar HTML y generar PDF nativo (evita PDFs en blanco con html2canvas)
ipcMain.handle('render-html-to-pdf', async (event, payload) => {
  let win;
  try {
    const filename = (payload && payload.filename) ? String(payload.filename) : 'export.pdf';
    const html = (payload && payload.html) ? String(payload.html) : '';
    const baseUrl = (payload && payload.baseUrl) ? String(payload.baseUrl) : '';
    if (!html.trim()) return { canceled: true, error: 'HTML vacío' };

    win = new BrowserWindow({
      show: false,
      width: 900,
      height: 1200,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        devTools: false,
      }
    });

    const dataUrl = 'data:text/html;charset=UTF-8,' + encodeURIComponent(html);
    await win.loadURL(dataUrl, baseUrl ? { baseURLForDataURL: baseUrl } : undefined);

    // Esperar a layout + imágenes + fuentes (con timeout)
    try {
      await win.webContents.executeJavaScript(`(async () => {
        const wait = (ms) => new Promise(r => setTimeout(r, ms));
        const waitImages = async () => {
          const imgs = Array.from(document.images || []);
          await Promise.all(imgs.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(res => {
              img.addEventListener('load', res, { once: true });
              img.addEventListener('error', res, { once: true });
            });
          }));
        };
        const timeoutMs = 2000;
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
          try { await waitImages(); } catch (_) {}
          try { if (document.fonts && document.fonts.status !== 'loaded') await document.fonts.ready; } catch (_) {}
          await new Promise(r => requestAnimationFrame(() => r()));
          // Si ya no hay imágenes pendientes, salimos
          const pending = Array.from(document.images || []).some(i => !i.complete);
          if (!pending) break;
          await wait(50);
        }
      })();`, true);
    } catch (_) {
      // no bloquear
      await new Promise(r => setTimeout(r, 200));
    }

    const pdfBuffer = await win.webContents.printToPDF({
      printBackground: true,
      margins: { marginType: 'default' },
      pageSize: 'Letter',
    });

    const owner = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePath } = await dialog.showSaveDialog(owner, {
      title: 'Guardar PDF',
      defaultPath: filename,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    });
    if (canceled || !filePath) return { canceled: true };

    fs.writeFileSync(filePath, pdfBuffer);
    return { canceled: false, filePath };
  } catch (err) {
    console.error('render-html-to-pdf error:', err);
    return { canceled: true, error: err && err.message ? err.message : String(err) };
  } finally {
    try { win?.destroy(); } catch (_) {}
  }
});