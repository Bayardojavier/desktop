// desktop/renderer.js

// =============================
// UTILIDADES DE SESIÓN
// =============================

function parseRoles(rawRol) {
  return String(rawRol || '')
    .split(/[,|;]+/)
    .map(r => r.trim().toLowerCase())
    .filter(Boolean);
}

function userHasRole(user, role) {
  const roles = user?.roles || parseRoles(user?.rol);
  const normalizedRole = String(role || '').trim().toLowerCase();
  return roles.includes('admin') || (normalizedRole ? roles.includes(normalizedRole) : false);
}

function getCurrentUser() {
  const rolRaw = localStorage.getItem('usuario_rol');
  const roles = parseRoles(rolRaw);
  return {
    id: localStorage.getItem('usuario_id'),
    nombre: localStorage.getItem('usuario_nombre'),
    rol: rolRaw,
    roles,
    puede_crear_usuarios: localStorage.getItem('usuario_puede_crear') === 'true'
  };
}

// Set global currentUser
window.currentUser = getCurrentUser();

function isLoggedIn() {
  return (getCurrentUser().roles || []).length > 0;
}

// Función auxiliar para crear sesión de auth para usuarios existentes (simplificada)
async function createAuthSessionForUser(userData) {
  // Por ahora, solo guardar los datos (sin auth compleja)
  localStorage.setItem('usuario_id', userData.id);
  localStorage.setItem('usuario_nombre', userData.nombre);
  localStorage.setItem('usuario_rol', userData.rol);
  localStorage.setItem('usuario_puede_crear', userData.puede_crear_usuarios);
  return true;
}

// Verificar estado de autenticación al cargar (se ejecuta después de que supabaseClient esté disponible)
function initAuthStateListener() {
  // Función simplificada - por ahora no necesitamos listener complejo
  console.log('Auth state listener inicializado (simplificado)');
}

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
  location.reload();
}

// =============================
// NOTIFICACIONES DEL SISTEMA
// =============================

// Solicitar permisos para notificaciones del sistema operativo
async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Permisos de notificación concedidos');
    } else {
      console.log('Permisos de notificación denegados');
    }
    return permission;
  }
  return 'denied';
}

// Mostrar notificación del sistema operativo
function showSystemNotification(title, body, icon = null) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body: body,
      icon: icon || '/assets/icon.png', // Icono por defecto
      silent: false,
      requireInteraction: false // Se cierra automáticamente
    });

    // Cerrar automáticamente después de 3 segundos
    setTimeout(() => {
      notification.close();
    }, 3000);

    return notification;
  } else {
    console.log('Notificaciones no soportadas o permisos no concedidos');
    return null;
  }
}

// Inicializar notificaciones al cargar la app
document.addEventListener('DOMContentLoaded', async () => {
  await requestNotificationPermission();
});

async function loadLogin() {
  const contentArea = document.querySelector('.content-area');
  if (!contentArea) return;

  // El login ya está en index.html, solo configurar estilos
  contentArea.className = 'content-area';
  Object.assign(contentArea.style, {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    minHeight: '0',
    height: '100%'
    
  });

  // No hacer fetch, el login ya está cargado
}

// =============================
// CREAR USUARIO (solo para administradores)
// =============================

function loadCreateUser() {
  const user = getCurrentUser();
  if (!userHasRole(user, 'admin') && !user.puede_crear_usuarios) {
    alert('No tienes permisos para crear usuarios');
    return;
  }

  const contentArea = document.querySelector('.content-area');
  if (!contentArea) return;

  contentArea.className = 'content-area';
  contentArea.style.cssText = ''; // Limpiar estilos inline
  // Limpiar estilos de login del head
  document.head.querySelectorAll('style[data-login-style]').forEach(style => style.remove());
  Object.assign(contentArea.style, {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    minHeight: '0',
    height: '100%'
    
  });

  contentArea.innerHTML = `
    <style>
      .create-user-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        width: 100%;
        max-width: 450px;
        padding: 32px;
      }
      .create-user-card h2 {
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
      .input-group input, .input-group select {
        width: 100%;
        padding: 12px 14px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 15px;
      }
      .btn-create {
        width: 100%;
        padding: 12px;
        background: #10b981;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        margin-bottom: 12px;
      }
      .btn-create:hover {
        background: #059669;
      }
      .btn-cancel {
        width: 100%;
        padding: 12px;
        background: #6b7280;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
      }
      .btn-cancel:hover {
        background: #4b5563;
      }
    </style>

    <div class="create-user-card">
      <h2>Crear Nuevo Usuario</h2>
      <form id="formCreateUser">
        <div class="input-group">
          <label>Nombre Completo</label>
          <input type="text" id="nombre" required />
        </div>
        <div class="input-group">
          <label>Usuario</label>
          <input type="text" id="usuario" required />
        </div>
        <div class="input-group">
          <label>Contraseña</label>
          <input type="password" id="contrasena" required />
        </div>
        <div class="input-group">
          <label>Rol</label>
          <select id="rol" required>
            <option value="">Seleccionar rol...</option>
            <option value="admin">Administrador</option>
            <option value="ventas">Ventas</option>
            <option value="bodega">Bodega</option>
            <option value="rrhh">Recursos Humanos</option>
            <option value="logistica">Logística</option>
            <option value="contabilidad">Contabilidad</option>
          </select>
        </div>
        <div class="input-group">
          <label>
            <input type="checkbox" id="puede_crear_usuarios" />
            Puede crear usuarios
          </label>
        </div>
        <button type="submit" class="btn-create">Crear Usuario</button>
        <button type="button" class="btn-cancel" onclick="loadDashboard()">Cancelar</button>
      </form>
    </div>
  `;

  const script = document.createElement('script');
  script.textContent = `
    document.getElementById('formCreateUser')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nombre = document.getElementById('nombre').value.trim();
      const usuario = document.getElementById('usuario').value.trim();
      const contrasena = document.getElementById('contrasena').value;
      const rol = document.getElementById('rol').value;
      const puedeCrear = document.getElementById('puede_crear_usuarios').checked;

      if (!nombre || !usuario || !contrasena || !rol) {
        alert('Por favor complete todos los campos');
        return;
      }

      try {
        const { data, error } = await window.supabaseClient
          .from('usuarios')
          .insert([{
            nombre,
            usuario,
            contrasena,
            rol,
            puede_crear_usuarios: puedeCrear
          }])
          .select()
          .single();

        if (error) throw error;

        alert('✅ Usuario creado exitosamente');
        loadDashboard(); // Regresar al dashboard
      } catch (err) {
        console.warn('Error creando usuario:', err);
        if (err.code === '23505') {
          alert('❌ El nombre de usuario ya existe');
        } else {
          alert('❌ Error al crear usuario: ' + err.message);
        }
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
  contentArea.style.cssText = ''; // Limpiar estilos inline
  // Limpiar estilos de login del head
  document.head.querySelectorAll('style[data-login-style]').forEach(style => style.remove());

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
  if (userHasRole(user, 'bodega')) {
    modules.push('<button class="dashboard-btn" data-module="bodega">📦 Bodega</button>');
  }
  if (userHasRole(user, 'logistica')) {
    modules.push('<button class="dashboard-btn" data-module="logistica">🚚 Logística</button>');
  }
  if (userHasRole(user, 'contabilidad')) {
    modules.push('<button class="dashboard-btn" data-module="contabilidad">📊 Contabilidad</button>');
  }
  if (userHasRole(user, 'rrhh')) {
    modules.push('<button class="dashboard-btn" data-module="rrhh">👥 RRHH</button>');
  }
  if (userHasRole(user, 'ventas')) {
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
    contabilidad: { path: 'modules/contabilidad/contabilidad.html', script: 'modules/contabilidad/contabilidad.js', style: 'contabilidad-bg' },
    juegos: { path: 'modules/juegos/juegos.html', script: 'modules/juegos/juegos.js', style: '' }
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
      contentArea.style.cssText = ''; // Limpiar estilos inline
      // Limpiar estilos de login del head
      document.head.querySelectorAll('style[data-login-style]').forEach(style => style.remove());
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
// MANUAL DE USUARIO
// =============================

function loadManualUsuario() {
  const contentArea = document.querySelector('.content-area');
  if (!contentArea) return;

  contentArea.className = 'content-area';
  contentArea.style.cssText = ''; // Limpiar estilos inline
  // Limpiar estilos de login del head
  document.head.querySelectorAll('style[data-login-style]').forEach(style => style.remove());

  // Inyectar estilos del manual (una sola vez)
  if (!document.getElementById('manual-styles')) {
    const style = document.createElement('style');
    style.id = 'manual-styles';
    style.textContent = `
      .manual-container {
        width: 100%;
        height: 92%;
        border: none;
        background: white;
      }
      .manual-nav {
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        padding: 12px 20px;
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .manual-nav-btn {
        padding: 8px 16px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
      }
      .manual-nav-btn:hover {
        background: #2563eb;
      }
      .manual-title {
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
        margin: 0;
      }
    `;
    document.head.appendChild(style);
  }

  contentArea.innerHTML = `
    <div class="manual-nav">
      <button class="manual-nav-btn" onclick="loadDashboard()">← Volver al Dashboard</button>
      <h3 class="manual-title">Manual de Usuario - Absolute de Nicaragua</h3>
    </div>
    <iframe class="manual-container" src="./manual_usuario/index.html" title="Manual de Usuario"></iframe>
  `;
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

  // ✅ Botones de inicio: siempre disponibles
  document.getElementById('btn-login')?.addEventListener('click', (e) => {
    e.preventDefault();
    loadLogin();
  });

  document.getElementById('btn-crear-usuario')?.addEventListener('click', (e) => {
    e.preventDefault();
    const user = getCurrentUser();
    if (user.rol !== 'admin' && !user.puede_crear_usuarios) {
      alert('No tienes permisos para crear usuarios');
      return;
    }
    loadCreateUser();
  });

  // 🎮 Juegos (Ayuda): disponible incluso sin sesión
  document.getElementById('btn-juegos')?.addEventListener('click', (e) => {
    e.preventDefault();
    loadModule('juegos');
  });

  // 🔒 App principal: solo si hay sesión
  if (isLoggedIn()) {
    const user = getCurrentUser();

    // Ocultar/mostrar botones de inicio según sesión
    document.getElementById('btn-login').style.display = 'none';
    document.getElementById('btn-cerrar-sesion').style.display = 'flex';
    if (user.rol !== 'admin' && !user.puede_crear_usuarios) {
      document.getElementById('btn-crear-usuario').style.display = 'none';
    }

    // Ocultar botones de módulos según rol
    const rolePermissions = {
      'btn-ventas': ['ventas', 'admin'],
      'btn-bodega': ['bodega', 'admin'],
      'btn-rrhh': ['rrhh', 'admin'],
      'btn-logistica': ['logistica', 'admin'],
      'btn-contabilidad': ['contabilidad', 'admin']
    };

    Object.entries(rolePermissions).forEach(([btnId, allowedRoles]) => {
      if (!allowedRoles.includes(user.rol)) {
        document.getElementById(btnId).style.display = 'none';
      }
    });

    // Activar listeners de menú SOLO tras login
    const menuMap = {
      'btn-ventas': { module: 'ventas', roles: ['ventas', 'admin'] },
      'btn-rrhh': { module: 'rrhh', roles: ['rrhh', 'admin'] },
      'btn-bodega': { module: 'bodega', roles: ['bodega', 'admin'] },
      'btn-logistica': { module: 'logistica', roles: ['logistica', 'admin'] },
      'btn-contabilidad': { module: 'contabilidad', roles: ['contabilidad', 'admin'] }
    };

    Object.entries(menuMap).forEach(([btnId, config]) => {
      document.getElementById(btnId)?.addEventListener('click', (e) => {
        e.preventDefault();
        if (config.roles.includes(user.rol)) {
          loadModule(config.module);
        } else {
          alert('No tienes permisos para acceder a este módulo');
        }
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

    // Botón de acerca de
    document.getElementById('btn-acerca')?.addEventListener('click', async () => {
      let version = '1.3.0';
      try {
        const v = await window.electronAPI?.getAppVersion?.();
        if (v) version = String(v);
      } catch {
        // noop: fallback a versión hardcodeada
      }

      alert(
        'Absolute de Nicaragua' +
        '\nVersión ' + version +
        '\n\nSistema de escritorio para la gestión empresarial:' +
        '\n- Inventario y bodegas' +
        '\n- Logística y despachos' +
        '\n- Ventas, RRHH y contabilidad' +
        '\n\nDesarrollado para apoyar las operaciones internas y el control de existencias.'
      );
    });

    // Botón de soporte (Manual de Usuario)
    document.getElementById('btn-soporte')?.addEventListener('click', () => {
      loadManualUsuario();
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
    // Sin sesión: mostrar botones apropiados
    document.getElementById('btn-login').style.display = 'flex';
    document.getElementById('btn-crear-usuario').style.display = 'none';
    document.getElementById('btn-cerrar-sesion').style.display = 'none';
    loadLogin();
  }

  // Inicializar listener de estado de autenticación
  initAuthStateListener();
});