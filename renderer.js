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
        position: relative;
        max-width: 1320px;
        margin: 18px auto;
        padding: 18px;
        color: #f6f7fb;
        background:
          radial-gradient(circle at top left, rgba(255, 79, 163, 0.16), transparent 28%),
          radial-gradient(circle at bottom right, rgba(255, 155, 77, 0.14), transparent 24%),
          linear-gradient(180deg, #070912 0%, #0a0f1d 100%);
        border-radius: 30px;
        overflow: hidden;
        box-shadow: 0 24px 56px rgba(0,0,0,0.28);
      }
      .dashboard-scanline {
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: linear-gradient(180deg, transparent, rgba(89, 167, 255, 0.05), transparent);
        mix-blend-mode: screen;
        animation: dashboard-scanline 7s linear infinite;
      }
      .dashboard-topbar,
      .dashboard-newsbar,
      .dashboard-grid,
      .dashboard-side,
      .dashboard-strip,
      .dashboard-btn,
      .dashboard-live-card,
      .dashboard-module-note,
      .logout-btn {
        position: relative;
        z-index: 1;
      }
      .dashboard-topbar,
      .dashboard-newsbar,
      .dashboard-strip,
      .dashboard-side-card,
      .dashboard-btn,
      .dashboard-live-card {
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 24px;
        background: rgba(19, 22, 38, 0.86);
        backdrop-filter: blur(16px);
        box-shadow: 0 18px 42px rgba(0, 0, 0, 0.28);
      }
      .dashboard-topbar {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) auto;
        gap: 18px;
        padding: 18px 20px;
      }
      .dashboard-brand-block {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 16px;
        align-items: center;
      }
      .dashboard-brand-switcher {
        position: relative;
        width: 260px;
        height: 88px;
        overflow: hidden;
      }
      .dashboard-brand-image {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        opacity: 0;
        transform: scale(0.92);
        filter: drop-shadow(0 12px 26px rgba(89, 167, 255, 0.24));
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      .dashboard-brand-image.is-active {
        opacity: 1;
        transform: scale(1);
      }
      .dashboard-brand-image.fx-float-in {
        animation: dashboard-brand-float-in 1.2s ease;
      }
      .dashboard-brand-image.fx-slide-diagonal {
        animation: dashboard-brand-slide-diagonal 1.1s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .dashboard-brand-image.fx-pop-spin {
        animation: dashboard-brand-pop-spin 1s cubic-bezier(0.2, 0.9, 0.2, 1);
      }
      .dashboard-brand-image.fx-tilt-glow {
        animation: dashboard-brand-tilt-glow 1.25s ease;
      }
      .dashboard-kicker,
      .dashboard-card-kicker {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: #ff4fa3;
      }
      .dashboard-title {
        margin: 10px 0 8px;
        font-size: clamp(34px, 5vw, 58px);
        line-height: 0.94;
        letter-spacing: -0.06em;
        color: #f6f7fb;
      }
      .dashboard-subtitle {
        margin: 0;
        max-width: 70ch;
        font-size: 15px;
        line-height: 1.7;
        color: #9ea7c0;
      }
      .dashboard-live-side {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .dashboard-live-card {
        min-width: 156px;
        padding: 12px 14px;
      }
      .dashboard-live-label {
        display: block;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: #ff4fa3;
      }
      .dashboard-live-value {
        display: block;
        margin-top: 10px;
        font-size: 22px;
        font-weight: 800;
        color: #f6f7fb;
      }
      .dashboard-newsbar {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 14px;
        align-items: center;
        padding: 12px 16px;
        margin-top: 14px;
      }
      .dashboard-news-message {
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #c7d3ef;
      }
      .dashboard-roles {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .dashboard-role-pill {
        display: inline-flex;
        align-items: center;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.05);
        color: #f1f5ff;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .dashboard-body {
        display: grid;
        grid-template-columns: 220px minmax(0, 1fr) 300px;
        gap: 14px;
        margin-top: 14px;
      }
      .dashboard-strip,
      .dashboard-side {
        display: grid;
        gap: 12px;
        align-content: start;
      }
      .dashboard-strip {
        padding: 14px;
      }
      .dashboard-strip-head strong,
      .dashboard-side-card h3 {
        display: block;
        margin-top: 8px;
        font-size: 18px;
        letter-spacing: -0.04em;
        color: #f6f7fb;
      }
      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
        gap: 14px;
      }
      .dashboard-btn {
        padding: 18px;
        min-height: 170px;
        text-align: left;
        color: #f6f7fb;
        transition: transform 0.22s ease, border-color 0.22s ease, background 0.22s ease;
      }
      .dashboard-btn:hover {
        transform: translateY(-4px);
        background: rgba(255,255,255,0.06);
        border-color: rgba(89, 167, 255, 0.16);
      }
      .dashboard-btn-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 54px;
        height: 54px;
        border-radius: 18px;
        background: rgba(255,255,255,0.05);
        font-size: 28px;
        margin-bottom: 16px;
      }
      .dashboard-btn-title {
        display: block;
        font-size: 22px;
        font-weight: 800;
        letter-spacing: -0.04em;
      }
      .dashboard-btn-text {
        display: block;
        margin-top: 10px;
        font-size: 13px;
        line-height: 1.65;
        color: #9ea7c0;
      }
      .dashboard-module-note,
      .dashboard-side-card {
        padding: 16px;
      }
      .dashboard-module-note {
        border-radius: 18px;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.06);
      }
      .dashboard-module-note p,
      .dashboard-side-card p {
        margin: 0;
        color: #9ea7c0;
        line-height: 1.7;
        font-size: 13px;
      }
      .logout-btn {
        padding: 12px 16px;
        background: linear-gradient(135deg, #ff4fa3, #ff9b4d);
        color: white;
        border: none;
        border-radius: 16px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      @keyframes dashboard-scanline {
        from { transform: translateY(-100%); }
        to { transform: translateY(100%); }
      }
      @keyframes dashboard-brand-float-in {
        0% { opacity: 0; transform: translateY(10px) scale(0.84); }
        60% { opacity: 1; transform: translateY(-2px) scale(1.02); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes dashboard-brand-slide-diagonal {
        0% { opacity: 0; transform: translate(-16px, 12px) scale(0.9); }
        55% { opacity: 1; transform: translate(4px, -3px) scale(1.03); }
        100% { opacity: 1; transform: translate(0, 0) scale(1); }
      }
      @keyframes dashboard-brand-pop-spin {
        0% { opacity: 0; transform: rotate(-12deg) scale(0.72); }
        65% { opacity: 1; transform: rotate(5deg) scale(1.04); }
        100% { opacity: 1; transform: rotate(0deg) scale(1); }
      }
      @keyframes dashboard-brand-tilt-glow {
        0% { opacity: 0; transform: perspective(300px) rotateX(18deg) scale(0.88); }
        55% { opacity: 1; transform: perspective(300px) rotateX(-6deg) scale(1.03); }
        100% { opacity: 1; transform: perspective(300px) rotateX(0deg) scale(1); }
      }
      @media (max-width: 1240px) {
        .dashboard-body {
          grid-template-columns: 1fr;
        }
        .dashboard-strip,
        .dashboard-side {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 920px) {
        .dashboard-topbar,
        .dashboard-newsbar {
          grid-template-columns: 1fr;
        }
        .dashboard-brand-block {
          grid-template-columns: 1fr;
        }
        .dashboard-live-side,
        .dashboard-roles {
          justify-content: flex-start;
        }
        .dashboard-brand-switcher {
          width: 200px;
          height: 68px;
        }
        .dashboard-strip,
        .dashboard-side {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  const modules = [];
  if (userHasRole(user, 'bodega')) {
    modules.push({ module: 'bodega', icon: '📦', title: 'Bodega', text: 'Inventario, faltantes, movimientos y dashboards operativos.' });
  }
  if (userHasRole(user, 'logistica')) {
    modules.push({ module: 'logistica', icon: '🚚', title: 'Logística', text: 'Solicitudes, despachos, coordinación y seguimiento de rutas.' });
  }
  if (userHasRole(user, 'contabilidad')) {
    modules.push({ module: 'contabilidad', icon: '📊', title: 'Contabilidad', text: 'Compras, bajas, proveedores y control financiero.' });
  }
  if (userHasRole(user, 'rrhh')) {
    modules.push({ module: 'rrhh', icon: '👥', title: 'RRHH', text: 'Personal, asistencia, reportes y seguimiento de talento.' });
  }
  if (userHasRole(user, 'ventas')) {
    modules.push({ module: 'ventas', icon: '💰', title: 'Ventas', text: 'Eventos, clientes, agenda comercial y cotizaciones.' });
  }
  if (userHasRole(user, 'admin')) {
    modules.push({ module: 'admin', icon: '🧭', title: 'Admin General', text: 'Vista ejecutiva transversal para revisar el sistema completo.' });
  }

  const roles = (user.roles || []).map(role => `<span class="dashboard-role-pill">${role}</span>`).join('');
  const moduleCards = modules.map(item => `
    <button class="dashboard-btn" data-module="${item.module}">
      <span class="dashboard-btn-icon">${item.icon}</span>
      <span class="dashboard-btn-title">${item.title}</span>
      <span class="dashboard-btn-text">${item.text}</span>
    </button>
  `).join('');

  contentArea.innerHTML = `
    <div class="dashboard-container">
      <div class="dashboard-scanline" aria-hidden="true"></div>
      <section class="dashboard-topbar">
        <div class="dashboard-brand-block">
          <div class="dashboard-brand-switcher" aria-hidden="true">
            <img id="dashboard-brand-image-logo" class="dashboard-brand-image is-active" src="assets/logo.png" alt="Absolute logo">
            <img id="dashboard-brand-image-icon" class="dashboard-brand-image" src="assets/icon.png" alt="Absolute icono">
          </div>
          <div>
            <span class="dashboard-kicker">Panel principal de navegación</span>
            <h2 class="dashboard-title">Bienvenido, ${user.nombre}</h2>
            <p class="dashboard-subtitle">Desde aquí puedes entrar rápidamente a cada módulo con una vista unificada de la aplicación. El panel está pensado para llevarte directo a la operación, al seguimiento administrativo o al control general.</p>
          </div>
        </div>
        <div class="dashboard-live-side">
          <div class="dashboard-live-card"><span class="dashboard-live-label">Hora local</span><span class="dashboard-live-value" id="dashboard-live-clock">--:--:--</span></div>
          <button id="logout-btn" class="logout-btn">Cerrar Sesión</button>
        </div>
      </section>
      <section class="dashboard-newsbar">
        <div class="dashboard-news-message">${modules.length} módulos disponibles para este usuario con acceso directo según sus permisos.</div>
        <div class="dashboard-roles">${roles}</div>
      </section>
      <section class="dashboard-body">
        <aside class="dashboard-strip">
          <div class="dashboard-strip-head">
            <span class="dashboard-card-kicker">Resumen rápido</span>
            <strong>Acceso inmediato</strong>
          </div>
          <div class="dashboard-module-note"><span class="dashboard-card-kicker">Módulos activos</span><p>${modules.length} accesos visibles según el rol actual.</p></div>
          <div class="dashboard-module-note"><span class="dashboard-card-kicker">Ruta sugerida</span><p>Entra primero a Admin General si necesitas una vista consolidada, o ve directo al módulo operativo que requiere atención.</p></div>
        </aside>
        <div class="dashboard-grid">${moduleCards}</div>
        <aside class="dashboard-side">
          <div class="dashboard-side-card"><span class="dashboard-card-kicker">Lectura ejecutiva</span><h3>Vista principal</h3><p>El tablero principal mantiene el mismo criterio visual del resto del sistema para que la navegación siga siendo consistente al volver desde cualquier módulo.</p></div>
          <div class="dashboard-side-card"><span class="dashboard-card-kicker">Contexto</span><h3>Roles cargados</h3><p>${(user.roles || []).join(', ') || user.rol}</p></div>
          <div class="dashboard-side-card"><span class="dashboard-card-kicker">Acción</span><h3>Navegación rápida</h3><p>Selecciona una tarjeta y la app te lleva directamente al módulo correspondiente sin pasar por menús adicionales.</p></div>
        </aside>
      </section>
    </div>
  `;

  if (window._dashboardBrandTimeout) {
    window.clearTimeout(window._dashboardBrandTimeout);
    window._dashboardBrandTimeout = null;
  }
  if (window._dashboardClockInterval) {
    window.clearInterval(window._dashboardClockInterval);
    window._dashboardClockInterval = null;
  }

  const dashboardLogo = document.getElementById('dashboard-brand-image-logo');
  const dashboardIcon = document.getElementById('dashboard-brand-image-icon');
  if (dashboardLogo && dashboardIcon) {
    const images = [dashboardLogo, dashboardIcon];
    const effects = ['fx-float-in', 'fx-slide-diagonal', 'fx-pop-spin', 'fx-tilt-glow'];
    let activeIndex = 0;
    const randomEffect = () => effects[Math.floor(Math.random() * effects.length)];
    const clearEffects = (image) => image.classList.remove('fx-float-in', 'fx-slide-diagonal', 'fx-pop-spin', 'fx-tilt-glow');
    const switchDashboardBrand = () => {
      const current = images[activeIndex];
      activeIndex = activeIndex === 0 ? 1 : 0;
      const next = images[activeIndex];
      current.classList.remove('is-active');
      clearEffects(current);
      clearEffects(next);
      next.classList.add('is-active');
      const effect = randomEffect();
      next.classList.add(effect);
      window.setTimeout(() => next.classList.remove(effect), 1300);
      window._dashboardBrandTimeout = window.setTimeout(switchDashboardBrand, 2800 + Math.floor(Math.random() * 2200));
    };
    const firstEffect = randomEffect();
    dashboardLogo.classList.add(firstEffect);
    window.setTimeout(() => dashboardLogo.classList.remove(firstEffect), 1300);
    window._dashboardBrandTimeout = window.setTimeout(switchDashboardBrand, 2600 + Math.floor(Math.random() * 1200));
  }

  const clockEl = document.getElementById('dashboard-live-clock');
  if (clockEl) {
    const updateDashboardClock = () => {
      clockEl.textContent = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      });
    };
    updateDashboardClock();
    window._dashboardClockInterval = window.setInterval(updateDashboardClock, 1000);
  }

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
    admin: { path: 'modules/admin/admin.html', script: 'modules/admin/admin.js', style: '' },
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
    if (!userHasRole(user, 'admin') && !user.puede_crear_usuarios) {
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
    if (!userHasRole(user, 'admin') && !user.puede_crear_usuarios) {
      document.getElementById('btn-crear-usuario').style.display = 'none';
    }

    // Ocultar botones de módulos según rol
    const rolePermissions = {
      'btn-ventas': ['ventas', 'admin'],
      'btn-bodega': ['bodega', 'admin'],
      'btn-rrhh': ['rrhh', 'admin'],
      'btn-logistica': ['logistica', 'admin'],
      'btn-contabilidad': ['contabilidad', 'admin'],
      'btn-admin': ['admin']
    };

    Object.entries(rolePermissions).forEach(([btnId, allowedRoles]) => {
      const el = document.getElementById(btnId);
      if (!el) return;
      const allowed = allowedRoles.some(r => user.roles.includes(r));
      if (!allowed) el.style.display = 'none';
    });

    // Activar listeners de menú SOLO tras login
    const menuMap = {
      'btn-admin': { module: 'admin', roles: ['admin'] },
      'btn-ventas': { module: 'ventas', roles: ['ventas', 'admin'] },
      'btn-rrhh': { module: 'rrhh', roles: ['rrhh', 'admin'] },
      'btn-bodega': { module: 'bodega', roles: ['bodega', 'admin'] },
      'btn-logistica': { module: 'logistica', roles: ['logistica', 'admin'] },
      'btn-contabilidad': { module: 'contabilidad', roles: ['contabilidad', 'admin'] }
    };

    Object.entries(menuMap).forEach(([btnId, config]) => {
      document.getElementById(btnId)?.addEventListener('click', (e) => {
        e.preventDefault();
        const allowed = config.roles.some(r => user.roles.includes(r));
        if (allowed) {
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