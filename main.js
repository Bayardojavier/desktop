// desktop/main.js
const { app, BrowserWindow, Menu, ipcMain, session, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let splashWindow;

// Función para cargar configuración de ventana
async function getWindowConfig() {
  try {
    const configPath = path.join(app.getPath('userData'), 'window-config.json');
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    }
    // Configuración por defecto
    return { mode: 'fixed', width: 1200, height: 800 };
  } catch (error) {
    console.error('Error loading window config:', error);
    return { mode: 'fixed', width: 1200, height: 800 };
  }
}

// Función para calcular dimensiones de ventana según configuración
function getWindowDimensions(config) {
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  if (config.mode === 'responsive') {
    // Modo responsivo: 80% de la pantalla, con límites razonables
    const responsiveWidth = Math.min(screenWidth * 0.8, 1600);
    const responsiveHeight = Math.min(screenHeight * 0.8, 1000);
    return {
      width: Math.max(responsiveWidth, 1000), // Mínimo 1000px
      height: Math.max(responsiveHeight, 700)  // Mínimo 700px
    };
  } else {
    // Modo fijo: dimensiones guardadas o por defecto
    return {
      width: config.width || 1200,
      height: config.height || 800
    };
  }
}

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

async function createWindow() {
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
  // Cargar configuración de ventana
  const windowConfig = await getWindowConfig();
  const dimensions = getWindowDimensions(windowConfig);

  mainWindow = new BrowserWindow({
    ...dimensions,
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
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'Bayardojavier',
    repo: 'desktop'
  });

  // Eventos de auto-updater
  autoUpdater.on('update-available', () => {
    console.log('Actualización disponible');
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Actualización lista',
      message: 'La actualización ha sido descargada. ¿Desea reiniciar la aplicación ahora?',
      buttons: ['Sí', 'No']
    }).then(result => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on('error', (error) => {
    dialog.showErrorBox('Error en actualización', error.message);
  });

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
        autoUpdater.downloadUpdate();
        return { message: 'Nueva versión disponible. Descargando actualización...' };
      } else {
        return { message: 'La aplicación está actualizada.' };
      }
    } catch (error) {
      return { error: error.message };
    }
  });

  // === Configuración de ventana ===
  ipcMain.handle('get-window-config', async () => {
    try {
      const configPath = path.join(app.getPath('userData'), 'window-config.json');
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(configData);
      }
      // Configuración por defecto
      return { mode: 'fixed', width: 1200, height: 800 };
    } catch (error) {
      console.error('Error loading window config:', error);
      return { mode: 'fixed', width: 1200, height: 800 };
    }
  });

  ipcMain.handle('set-window-config', async (event, config) => {
    try {
      const configPath = path.join(app.getPath('userData'), 'window-config.json');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      return { success: true };
    } catch (error) {
      console.error('Error saving window config:', error);
      return { error: error.message };
    }
  });

  // Reiniciar aplicación
  ipcMain.on('restart-app', () => {
    app.relaunch();
    app.exit(0);
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