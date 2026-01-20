// desktop/renderer.js

// =============================
// UTILIDADES DE SESIÓN
// =============================

function getCurrentUser() {
  return {
    id: localStorage.getItem('usuario_id'),
    nombre: localStorage.getItem('usuario_nombre'),
    rol: localStorage.getItem('usuario_rol')
  };
}

function isLoggedIn() {
  return !!getCurrentUser().rol;
}

// =============================
// CONTROLES DE VENTANA (siempre activos)
// =============================

function initWindowControls() {
  document.getElementById('minimize-btn')?.addEventListener('click', () => {
    window.electronAPI?.minimize();
  });
  document.getElementById('maximize-btn')?.addEventListener('click', () => {
    window.electronAPI?.maximize();
  });
  document.getElementById('close-btn')?.addEventListener('click', () => {
    window.electronAPI?.close();
  });
}

// Cierre de sesión global
function logoutAndReload() {
  localStorage.clear();
  loadLogin();
}

// =============================
// LOGIN (público)
// =============================

function loadLogin() {
  const contentArea = document.querySelector('.content-area');
  if (!contentArea) return;

  contentArea.className = 'content-area';
  Object.assign(contentArea.style, {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    minHeight: 'calc(100vh - 60px)'
  });

  contentArea.innerHTML = `
    <style>
      .login-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        width: 100%;
        max-width: 400px;
        padding: 32px;
      }
      .login-card h2 {
        text-align: center;
        color: #1e40af;
        margin-bottom: 24px;
        font-size: 24px;
      }
      .input-group {
        margin-bottom: 18px;
      }
      .input-group label {
        display: block;
        margin-bottom: 6px;
        color: #374151;
        font-weight: 600;
        font-size: 14px;
      }
      .input-group input {
        width: 100%;
        padding: 12px 14px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 15px;
      }
      .btn-login {
        width: 100%;
        padding: 12px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
      }
      .btn-login:hover {
        background: #2563eb;
      }
    </style>

    <div class="login-card">
      <h2>Iniciar Sesión</h2>
      <form id="formLogin">
        <div class="input-group">
          <label>Usuario</label>
          <input type="text" id="usuario" required />
        </div>
        <div class="input-group">
          <label>Contraseña</label>
          <input type="password" id="contrasena" required />
        </div>
        <button type="submit" class="btn-login">Ingresar</button>
      </form>
    </div>
  `;

  const script = document.createElement('script');
  script.textContent = `
    document.getElementById('formLogin')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usuario = document.getElementById('usuario').value.trim();
      const contrasena = document.getElementById('contrasena').value;

      try {
          const { data, error } = await supabaseClient
           .from('usuarios')
           .select('id, nombre, rol')
           .eq('usuario', usuario)
           .eq('contrasena', contrasena)
           .maybeSingle(); // evita 406 si hay más de un match

        if (error || !data) throw new Error('Credenciales inválidas');

        localStorage.setItem('usuario_id', data.id);
        localStorage.setItem('usuario_nombre', data.nombre);
        localStorage.setItem('usuario_rol', data.rol);
        location.reload();
      } catch (err) {
          console.warn('Login fallido:', err);
          alert('❌ Usuario o contraseña incorrectos');
      }
    });
  `;
  document.body.appendChild(script);
}

// =============================
// APP AUTORIZADA (solo tras login)
// =============================

function loadDashboard() {
  const user = getCurrentUser();
  const contentArea = document.querySelector('.content-area');
  if (!contentArea || !user.rol) return;

  contentArea.className = 'content-area';
  contentArea.style.cssText = ''; // Limpiar estilos de login

  // Inyectar estilos del dashboard (una sola vez)
  if (!document.getElementById('dashboard-styles')) {
    const style = document.createElement('style');
    style.id = 'dashboard-styles';
    style.textContent = `
      .dashboard-container {
        max-width: 800px;
        margin: 40px auto;
        padding: 24px;
        text-align: center;
      }
      .dashboard-container h2 {
        color: #1e40af;
        margin-bottom: 24px;
        font-size: 28px;
        font-weight: 700;
      }
      .logout-btn {
        padding: 8px 16px;
        background: #dc2626;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
      }
      .modules-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-top: 30px;
      }
      .dashboard-btn {
        padding: 16px;
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        font-weight: 600;
        color: #1e40af;
        cursor: pointer;
        transition: all 0.2s;
        height: 100px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .dashboard-btn:hover {
        background: #e2e8f0;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }
    `;
    document.head.appendChild(style);
  }

  const modules = [];
  if (['bodega', 'admin'].includes(user.rol)) {
    modules.push('<button class="dashboard-btn" data-module="bodega">📦 Bodega</button>');
  }
  if (['logistica', 'admin'].includes(user.rol)) {
    modules.push('<button class="dashboard-btn" data-module="logistica">🚚 Logística</button>');
  }
  if (['contabilidad', 'admin'].includes(user.rol)) {
    modules.push('<button class="dashboard-btn" data-module="contabilidad">📊 Contabilidad</button>');
  }
  if (['rrhh', 'admin'].includes(user.rol)) {
    modules.push('<button class="dashboard-btn" data-module="rrhh">👥 RRHH</button>');
  }
  if (['ventas', 'admin'].includes(user.rol)) {
    modules.push('<button class="dashboard-btn" data-module="ventas">💰 Ventas</button>');
  }

  contentArea.innerHTML = `
    <div class="dashboard-container">
      <h2>Bienvenido, ${user.nombre}</h2>
      <p><button id="logout-btn" class="logout-btn">Cerrar Sesión</button></p>
      <div class="modules-grid">${modules.join('')}</div>
    </div>
  `;

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    logoutAndReload();
  });

  document.querySelectorAll('.dashboard-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      loadModule(e.currentTarget.dataset.module);
    });
  });
}

function loadModule(moduleName) {
  const config = {
    ventas: { path: 'modules/ventas/ventas.html', script: 'modules/ventas/ventas.js', style: 'ventas-bg' },
    rrhh: { path: 'modules/rrhh/rrhh.html', script: 'modules/rrhh/rrhh.js', style: '' },
    bodega: { path: 'modules/bodega/bodega.html', script: 'modules/bodega/bodega.js', style: '' },
    logistica: { path: 'modules/logistica/logistica.html', script: 'modules/logistica/logistica.js', style: '' },
    contabilidad: { path: 'modules/contabilidad/contabilidad.html', script: 'modules/contabilidad/contabilidad.js', style: 'contabilidad-bg' }
  }[moduleName];

  if (!config) {
    console.error('Módulo desconocido:', moduleName);
    return;
  }

  fetch(config.path)
    .then(res => res.ok ? res.text() : Promise.reject(new Error('Archivo no encontrado')))
    .then(html => {
      const contentArea = document.querySelector('.content-area');
      contentArea.className = `content-area ${config.style || ''}`;
      contentArea.innerHTML = html;

      // Eliminar script anterior
      const oldScript = document.getElementById(`${moduleName}-script`);
      if (oldScript) oldScript.remove();

      // Cargar nuevo script
      const script = document.createElement('script');
      script.id = `${moduleName}-script`;
      script.src = config.script;
      document.body.appendChild(script);

      // Cargar CSS de logística si es necesario
      if (moduleName === 'logistica') {
        const styleId = 'logistica-style';
        document.getElementById(styleId)?.remove();
        const link = document.createElement('link');
        link.id = styleId;
        link.rel = 'stylesheet';
        link.href = './modules/logistica/logistica.css';
        document.head.appendChild(link);
      }
    })
    .catch(err => {
      document.querySelector('.content-area').innerHTML = `
        <p style="color:red; text-align:center; margin-top:40px;">
          ❌ Error al cargar "${moduleName}": ${err.message}
        </p>
      `;
    });
}

// =============================
// INICIALIZACIÓN
// =============================

document.addEventListener('DOMContentLoaded', () => {
  // ✅ Controles de ventana: SIEMPRE activos
  initWindowControls();

  // ✅ DevTools: SIEMPRE disponibles en desarrollo
  if (!window.electronAPI?.isPackaged) {
    document.querySelectorAll('.dev-btn').forEach(btn => btn.style.display = 'flex');
    document.getElementById('reload-btn')?.addEventListener('click', () => location.reload());
    document.getElementById('clear-cache-btn')?.addEventListener('click', async () => {
      if (window.electronAPI?.clearCache) await window.electronAPI.clearCache();
      location.reload();
    });
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        location.reload();
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'r') {
        e.preventDefault();
        if (window.electronAPI?.clearCache) {
          window.electronAPI.clearCache().then(() => location.reload());
        } else {
          location.reload(true);
        }
      }
    });
  }

  // 🔒 App principal: solo si hay sesión
  if (isLoggedIn()) {
    // Activar listeners de menú SOLO tras login
    const menuMap = {
      'btn-ventas': 'ventas',
      'btn-rrhh': 'rrhh',
      'btn-bodega': 'bodega',
      'btn-logistica': 'logistica',
      'btn-contabilidad': 'contabilidad'
    };

    Object.entries(menuMap).forEach(([btnId, module]) => {
      document.getElementById(btnId)?.addEventListener('click', (e) => {
        e.preventDefault();
        loadModule(module);
      });
    });

    // Botón de cinta "Cerrar sesión"
    document.getElementById('btn-cerrar-sesion')?.addEventListener('click', (e) => {
      e.preventDefault();
      logoutAndReload();
    });

    // Tabs (si los usas)
    document.querySelectorAll('.tab')?.forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('panel-' + tab.dataset.tab)?.classList.add('active');
      });
    });

    // Botón de actualizaciones
    document.getElementById('btn-actualizaciones')?.addEventListener('click', async () => {
      try {
        const result = await window.electronAPI?.checkForUpdates();
        if (result?.error) {
          alert('Error al buscar actualizaciones: ' + result.error);
        } else if (result?.message) {
          alert(result.message);
        } else {
          alert('Actualización descargada. La aplicación se reiniciará.');
        }
      } catch (error) {
        alert('Error al actualizar: ' + error.message);
      }
    });

    // === CONFIGURACIÓN DE VENTANA ===
    const btnConfigVentana = document.getElementById('btn-config-ventana');
    const modalConfigVentana = document.getElementById('modal-config-ventana');
    const btnCerrarConfig = document.getElementById('btn-cerrar-config-ventana');
    const btnGuardarConfig = document.getElementById('btn-guardar-config-ventana');
    const btnCancelarConfig = document.getElementById('btn-cancelar-config-ventana');

    if (btnConfigVentana) {
      btnConfigVentana.addEventListener('click', async () => {
        try {
          // Cargar configuración actual
          const config = await window.electronAPI.getWindowConfig();

          // Marcar el radio button correspondiente
          const radios = document.getElementsByName('window-mode');
          radios.forEach(radio => {
            radio.checked = radio.value === config.mode;
          });

          // Mostrar modal
          modalConfigVentana.style.display = 'flex';
        } catch (error) {
          console.error('Error loading window config:', error);
          alert('Error al cargar la configuración');
        }
      });
    }

    // Cerrar modal
    if (btnCerrarConfig) {
      btnCerrarConfig.addEventListener('click', () => {
        modalConfigVentana.style.display = 'none';
      });
    }

    if (btnCancelarConfig) {
      btnCancelarConfig.addEventListener('click', () => {
        modalConfigVentana.style.display = 'none';
      });
    }

    // Cerrar modal al hacer click fuera
    if (modalConfigVentana) {
      modalConfigVentana.addEventListener('click', (e) => {
        if (e.target === modalConfigVentana) {
          modalConfigVentana.style.display = 'none';
        }
      });
    }

    // Guardar configuración
    if (btnGuardarConfig) {
      btnGuardarConfig.addEventListener('click', async () => {
        try {
          const selectedMode = document.querySelector('input[name="window-mode"]:checked').value;
          const config = { mode: selectedMode };

          // Si es modo fijo, mantener las dimensiones actuales
          if (selectedMode === 'fixed') {
            config.width = 1200;
            config.height = 800;
          }

          // Guardar configuración
          const result = await window.electronAPI.setWindowConfig(config);
          if (result.success) {
            alert('Configuración guardada. La aplicación se reiniciará.');
            modalConfigVentana.style.display = 'none';
            // Reiniciar aplicación
            window.electronAPI.restartApp();
          } else {
            alert('Error al guardar la configuración: ' + result.error);
          }
        } catch (error) {
          console.error('Error saving window config:', error);
          alert('Error al guardar la configuración');
        }
      });
    }

    // Cargar dashboard
    loadDashboard();
  } else {
    // Sin sesión: solo login
    loadLogin();
  }
});