(function () {
  const supa = window.supabaseClient;
  const state = {
    days: 30,
    events: [],
    faltantes: [],
    danados: [],
    bajas: [],
    empleados: [],
    stock: []
  };

  function normalizeDate(value) {
    if (!value) return null;
    const raw = String(value).trim();
    if (!raw) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [year, month, day] = raw.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDate(value) {
    const date = normalizeDate(value);
    if (!date) return '–';
    return date.toLocaleDateString('es-NI');
  }

  function formatDateTime(value) {
    const date = normalizeDate(value);
    if (!date) return '–';
    return date.toLocaleString('es-NI');
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString('es-NI');
  }

  function startLiveClock() {
    const el = document.getElementById('admin-live-clock');
    if (!el) return;

    if (window._adminLiveClockInterval) {
      window.clearInterval(window._adminLiveClockInterval);
    }

    function updateClock() {
      el.textContent = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    }

    updateClock();
    window._adminLiveClockInterval = window.setInterval(updateClock, 1000);
  }

  function getEventMountDateTime(event) {
    const date = normalizeDate(event?.fecha_montaje);
    if (!date) return null;

    const mountDate = new Date(date.getTime());
    const time = String(event?.hora_montaje || '').trim();
    const match = time.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (match) {
      mountDate.setHours(Number(match[1]), Number(match[2]), Number(match[3] || 0), 0);
    } else {
      mountDate.setHours(8, 0, 0, 0);
    }

    return mountDate;
  }

  function formatCountdown(targetDate) {
    if (!targetDate) return null;
    const diff = targetDate.getTime() - Date.now();
    if (diff <= 0) return null;

    const totalMinutes = Math.floor(diff / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    const parts = [];

    if (days > 0) parts.push(`${days} ${days === 1 ? 'día' : 'días'}`);
    if (days > 0 || hours > 0) parts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`);
    parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);

    return parts.join(', ');
  }

  function dedupeBy(items, getKey) {
    const seen = new Set();
    return items.filter((item) => {
      const key = getKey(item);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function isSameLocalDay(date, reference = new Date()) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;
    return date.getFullYear() === reference.getFullYear()
      && date.getMonth() === reference.getMonth()
      && date.getDate() === reference.getDate();
  }

  function updateSectionLabel(section) {
    const label = document.getElementById('admin-current-section-name');
    if (!label) return;

    const labels = {
      resumen: 'Resumen',
      operacion: 'Operación',
      reportes: 'Reportes',
      talento: 'Talento'
    };

    label.textContent = labels[section] || 'Resumen';
  }

  function initBrandSwitcher() {
    const logo = document.getElementById('admin-brand-image-logo');
    const icon = document.getElementById('admin-brand-image-icon');
    if (!logo || !icon) return;

    const images = [logo, icon];
    const effects = ['fx-float-in', 'fx-slide-diagonal', 'fx-pop-spin', 'fx-tilt-glow'];
    let activeIndex = 0;

    function clearEffects(image) {
      image.classList.remove('fx-float-in', 'fx-slide-diagonal', 'fx-pop-spin', 'fx-tilt-glow');
    }

    function randomEffect() {
      return effects[Math.floor(Math.random() * effects.length)];
    }

    function switchImage() {
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

      const nextDelay = 2600 + Math.floor(Math.random() * 2800);
      window.setTimeout(switchImage, nextDelay);
    }

    const initialEffect = randomEffect();
    logo.classList.add(initialEffect);
    window.setTimeout(() => logo.classList.remove(initialEffect), 1300);
    window.setTimeout(switchImage, 2800 + Math.floor(Math.random() * 1800));
  }

  function daysAgo(days) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - days);
    return date;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderEmpty(message) {
    return `<div class="admin-empty">${escapeHtml(message)}</div>`;
  }

  async function queryTable(table, select, options = {}) {
    if (!supa) return [];
    let query = supa.from(table).select(select);
    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? false });
    }
    if (typeof options.limit === 'number') {
      query = query.limit(options.limit);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async function loadData() {
    const since = daysAgo(state.days);
    try {
      const results = await Promise.allSettled([
        queryTable('eventos', '*', { orderBy: 'fecha_montaje', ascending: true, limit: 200 }),
        queryTable('materiales_faltantes', 'id,material_codigo,material_nombre,cantidad_faltante,evento,numero_despacho,estado_proceso,fecha_despacho,fecha_devolucion,created_at', { orderBy: 'created_at', ascending: false, limit: 300 }),
        queryTable('materiales_danados', 'id,material_codigo,material_nombre,cantidad,evento,numero_despacho,fecha_proceso,fecha_despacho,created_at', { orderBy: 'created_at', ascending: false, limit: 300 }),
        queryTable('bajas_logistica', 'id,numero_baja,fecha_baja,estado,observaciones,creado_en', { orderBy: 'creado_en', ascending: false, limit: 150 }),
        queryTable('empleados', 'id,nombres,apellidos,codigo_empleado', { orderBy: 'nombres', ascending: true, limit: 500 }),
        queryTable('stock_actual_con_precio', 'material_codigo,material_nombre,existencia', { orderBy: 'existencia', ascending: true, limit: 300 })
      ]);

      const [events, faltantes, danados, bajas, empleados, stock] = results.map((result) => {
        if (result.status === 'fulfilled') return result.value;
        console.warn('Carga parcial en admin general:', result.reason);
        return [];
      });

      state.events = events;
      state.faltantes = faltantes.filter((item) => {
        const date = normalizeDate(item.fecha_devolucion || item.fecha_despacho || item.created_at);
        return !date || date >= since;
      });
      state.danados = danados.filter((item) => {
        const date = normalizeDate(item.fecha_proceso || item.fecha_despacho || item.created_at);
        return !date || date >= since;
      });
      state.bajas = bajas.filter((item) => {
        const date = normalizeDate(item.fecha_baja || item.creado_en);
        return !date || date >= since;
      });
      state.empleados = empleados;
      state.stock = stock;
      renderAll();
    } catch (error) {
      console.error('Error cargando admin general:', error);
      setGlobalMessage('No se pudieron cargar todos los datos del panel ejecutivo. Revisa la consola.');
    }
  }

  function setGlobalMessage(message) {
    const el = document.getElementById('admin-global-message');
    if (el) el.textContent = message;
  }

  function getUpcomingEvents() {
    const today = daysAgo(0);
    return (state.events || [])
      .map((item) => ({ ...item, __fecha: normalizeDate(item.fecha_montaje) }))
      .filter((item) => item.__fecha && item.__fecha >= today)
      .sort((a, b) => a.__fecha - b.__fecha)
      .slice(0, 6);
  }

  function getOpenMissing() {
    return (state.faltantes || [])
      .filter((item) => !['aclarado', 'resuelto', 'cerrado'].includes(String(item.estado_proceso || '').trim()))
      .slice(0, 8);
  }

  function getCriticalStock() {
    return (state.stock || [])
      .filter((item) => Number(item.existencia || 0) <= 3)
      .sort((a, b) => Number(a.existencia || 0) - Number(b.existencia || 0))
      .slice(0, 8);
  }

  function buildTickerAlerts() {
    const alerts = [];
    const today = new Date();

    getUpcomingEvents()
      .slice(0, 4)
      .forEach((event) => {
        const countdown = formatCountdown(getEventMountDateTime(event));
        if (!countdown) return;
        alerts.push({
          tone: 'warn',
          text: `Faltan ${countdown} para montar el evento ${event.nombre || 'sin nombre'}.`
        });
      });

    dedupeBy(
      [...(state.faltantes || []), ...(state.danados || [])]
        .filter((item) => {
          const recordDate = normalizeDate(item.fecha_despacho || item.created_at);
          return item.numero_despacho && isSameLocalDay(recordDate, today);
        })
        .map((item) => ({
          evento: item.evento,
          numero_despacho: item.numero_despacho,
          sortAt: normalizeDate(item.fecha_despacho || item.created_at)?.getTime() || 0
        }))
        .sort((a, b) => b.sortAt - a.sortAt),
      (item) => `${item.evento || ''}|${item.numero_despacho || ''}`
    )
      .slice(0, 3)
      .forEach((item) => {
        alerts.push({
          tone: 'ok',
          text: `Se registró un despacho para el evento ${item.evento || 'sin evento'}${item.numero_despacho ? `, despacho ${item.numero_despacho}` : ''}.`
        });
      });

    dedupeBy(
      (state.faltantes || [])
        .filter((item) => isSameLocalDay(normalizeDate(item.fecha_devolucion), today))
        .map((item) => ({
          evento: item.evento,
          numero_despacho: item.numero_despacho,
          sortAt: normalizeDate(item.fecha_devolucion)?.getTime() || 0
        }))
        .sort((a, b) => b.sortAt - a.sortAt),
      (item) => `${item.evento || ''}|${item.numero_despacho || ''}|${item.sortAt}`
    )
      .slice(0, 3)
      .forEach((item) => {
        alerts.push({
          tone: 'danger',
          text: `Se registró una devolución del evento ${item.evento || 'sin evento'}${item.numero_despacho ? `, vinculada al despacho ${item.numero_despacho}` : ''}.`
        });
      });

    dedupeBy(
      (state.events || [])
        .filter((event) => isSameLocalDay(normalizeDate(event.created_at), today))
        .map((event) => ({
          nombre: event.nombre,
          cliente: event.cliente,
          sortAt: normalizeDate(event.created_at)?.getTime() || 0
        }))
        .sort((a, b) => b.sortAt - a.sortAt),
      (event) => `${event.nombre || ''}|${event.sortAt}`
    )
      .slice(0, 2)
      .forEach((event) => {
        alerts.push({
          tone: 'ok',
          text: `Ventas registró el evento ${event.nombre || 'sin nombre'}${event.cliente ? ` para ${event.cliente}` : ''}.`
        });
      });

    if (!alerts.length) {
      alerts.push({
        tone: 'ok',
        text: 'No hay alertas registradas hoy para mostrar en este momento.'
      });
    }

    return alerts.slice(0, 12);
  }

  function renderAlertTicker() {
    const track = document.getElementById('admin-alert-ticker-track');
    if (!track) return;

    const alerts = buildTickerAlerts();
    const repeatedAlerts = [...alerts, ...alerts];
    track.style.setProperty('--ticker-duration', `${Math.max(30, alerts.length * 7)}s`);
    track.innerHTML = repeatedAlerts.map((alert) => `
      <span class="admin-ticker-item ${alert.tone ? `is-${escapeHtml(alert.tone)}` : ''}">${escapeHtml(alert.text)}</span>
    `).join('');
  }

  function startAlertTickerRefresh() {
    if (window._adminAlertTickerInterval) {
      window.clearInterval(window._adminAlertTickerInterval);
    }

    window._adminAlertTickerInterval = window.setInterval(() => {
      renderAlertTicker();
    }, 60000);
  }

  function renderHero() {
    const headlineEl = document.getElementById('admin-broadcast-headline');
    if (headlineEl) {
      const upcoming = getUpcomingEvents().length;
      const faltantes = getOpenMissing().length;
      const criticos = getCriticalStock().length;
      headlineEl.textContent = `Actualmente hay ${formatNumber(upcoming)} eventos próximos, ${formatNumber(faltantes)} faltantes abiertos y ${formatNumber(criticos)} materiales críticos en seguimiento.`;
    }

    const pills = document.getElementById('admin-hero-pills');
    if (!pills) return;

    const upcoming = getUpcomingEvents().length;
    const faltantes = getOpenMissing().length;
    const criticos = getCriticalStock().length;
    pills.innerHTML = [
      `<span class="admin-pill">${formatNumber(upcoming)} eventos próximos</span>`,
      `<span class="admin-pill">${formatNumber(faltantes)} faltantes abiertos</span>`,
      `<span class="admin-pill">${formatNumber(criticos)} materiales críticos</span>`
    ].join('');
  }

  function renderMetrics() {
    const container = document.getElementById('admin-metrics');
    if (!container) return;

    const totalFaltantes = state.faltantes.reduce((sum, item) => sum + Number(item.cantidad_faltante || 0), 0);
    const totalDanados = state.danados.reduce((sum, item) => sum + Number(item.cantidad || 0), 0);
    const proximosEventos = getUpcomingEvents().length;
    const bajasPendientes = state.bajas.filter((item) => String(item.estado || '').toLowerCase() === 'pendiente').length;

    const cards = [
      { label: 'Eventos próximos', value: proximosEventos, hint: 'Agenda comercial y logística' },
      { label: 'Unidades faltantes', value: totalFaltantes, hint: `Ventana de ${state.days} días` },
      { label: 'Materiales dañados', value: totalDanados, hint: 'Incidencias reportadas' },
      { label: 'Solicitudes de baja', value: bajasPendientes, hint: 'Pendientes de resolución' }
    ];

    container.innerHTML = cards.map((card) => `
      <article class="admin-metric-card">
        <div class="admin-metric-label">${escapeHtml(card.label)}</div>
        <div class="admin-metric-value">${escapeHtml(formatNumber(card.value))}</div>
        <div class="admin-metric-hint">${escapeHtml(card.hint)}</div>
      </article>
    `).join('');
  }

  function renderPriorityFeed() {
    const container = document.getElementById('admin-priority-feed');
    if (!container) return;
    const items = [];

    const openMissing = getOpenMissing();
    if (openMissing.length) {
      items.push({
        title: 'Materiales faltantes por aclarar',
        text: `${formatNumber(openMissing.length)} registros siguen abiertos y requieren seguimiento inmediato.`,
        badges: [`${formatNumber(openMissing.reduce((sum, item) => sum + Number(item.cantidad_faltante || 0), 0))} unidades`, 'Bodega'],
        tone: 'danger'
      });
    }

    const critical = getCriticalStock();
    if (critical.length) {
      items.push({
        title: 'Inventario bajo en materiales clave',
        text: `${formatNumber(critical.length)} referencias están en nivel crítico o agotadas.`,
        badges: ['Stock bajo', 'Atención compras'],
        tone: 'warn'
      });
    }

    const upcoming = getUpcomingEvents();
    if (upcoming.length) {
      items.push({
        title: 'Eventos cercanos a ejecución',
        text: `Hay ${formatNumber(upcoming.length)} eventos próximos visibles para coordinación comercial y logística.`,
        badges: ['Ventas', 'Logística'],
        tone: 'ok'
      });
    }

    if (!items.length) {
      container.innerHTML = renderEmpty('No se detectaron alertas prioritarias en la ventana seleccionada.');
      return;
    }

    container.innerHTML = items.map((item) => `
      <div class="admin-item">
        <div class="admin-item-title">${escapeHtml(item.title)}</div>
        <div class="admin-item-text">${escapeHtml(item.text)}</div>
        <div class="admin-item-meta">${item.badges.map((badge) => `<span class="admin-badge ${item.tone}">${escapeHtml(badge)}</span>`).join('')}</div>
      </div>
    `).join('');
  }

  function renderUpcomingEvents() {
    const container = document.getElementById('admin-upcoming-events');
    if (!container) return;
    const events = getUpcomingEvents();
    if (!events.length) {
      container.innerHTML = renderEmpty('No hay eventos futuros cargados en esta ventana de tiempo.');
      return;
    }

    container.innerHTML = events.map((event) => `
      <div class="admin-item">
        <div class="admin-item-title">${escapeHtml(event.nombre || 'Evento sin nombre')}</div>
        <div class="admin-item-text">Cliente: ${escapeHtml(event.cliente || '–')} • Lugar: ${escapeHtml(event.lugar || '–')}</div>
        <div class="admin-item-meta">
          <span class="admin-badge ok">${escapeHtml(formatDate(event.fecha_montaje))}</span>
          <span class="admin-badge">${escapeHtml(event.estado || 'sin estado')}</span>
        </div>
      </div>
    `).join('');
  }

  function renderCriticalStock() {
    const container = document.getElementById('admin-critical-stock');
    if (!container) return;
    const items = getCriticalStock();
    if (!items.length) {
      container.innerHTML = renderEmpty('No hay materiales críticos con existencia menor o igual a 3.');
      return;
    }

    container.innerHTML = items.map((item) => `
      <div class="admin-item">
        <div class="admin-item-title">${escapeHtml(item.material_codigo || '–')}</div>
        <div class="admin-item-text">${escapeHtml(item.material_nombre || 'Sin nombre')}</div>
        <div class="admin-item-meta"><span class="admin-badge danger">Existencia ${escapeHtml(formatNumber(item.existencia || 0))}</span></div>
      </div>
    `).join('');
  }

  function renderIncidents() {
    const container = document.getElementById('admin-incidents');
    if (!container) return;
    const incidents = [
      ...getOpenMissing().slice(0, 4).map((item) => ({
        title: item.material_nombre || item.material_codigo,
        text: `${item.evento || 'Sin evento'} • despacho ${item.numero_despacho || '–'}`,
        badge: `${formatNumber(item.cantidad_faltante || 0)} faltante`,
        tone: 'danger'
      })),
      ...(state.danados || []).slice(0, 4).map((item) => ({
        title: item.material_nombre || item.material_codigo,
        text: `${item.evento || 'Sin evento'} • despacho ${item.numero_despacho || '–'}`,
        badge: `${formatNumber(item.cantidad || 0)} dañado`,
        tone: 'warn'
      }))
    ].slice(0, 8);

    if (!incidents.length) {
      container.innerHTML = renderEmpty('No hay incidencias recientes de faltantes o materiales dañados.');
      return;
    }

    container.innerHTML = incidents.map((item) => `
      <div class="admin-item">
        <div class="admin-item-title">${escapeHtml(item.title || 'Incidencia')}</div>
        <div class="admin-item-text">${escapeHtml(item.text)}</div>
        <div class="admin-item-meta"><span class="admin-badge ${item.tone}">${escapeHtml(item.badge)}</span></div>
      </div>
    `).join('');
  }

  function renderBajasFeed() {
    const container = document.getElementById('admin-bajas-feed');
    if (!container) return;
    const items = (state.bajas || []).slice(0, 8);
    if (!items.length) {
      container.innerHTML = renderEmpty('No hay solicitudes de baja recientes.');
      return;
    }

    container.innerHTML = items.map((item) => `
      <div class="admin-item">
        <div class="admin-item-title">${escapeHtml(item.numero_baja || 'Baja')}</div>
        <div class="admin-item-text">${escapeHtml(item.observaciones || 'Sin observaciones registradas.')}</div>
        <div class="admin-item-meta">
          <span class="admin-badge ${String(item.estado || '').toLowerCase() === 'pendiente' ? 'warn' : 'ok'}">${escapeHtml(item.estado || 'sin estado')}</span>
          <span class="admin-badge">${escapeHtml(formatDate(item.fecha_baja || item.creado_en))}</span>
        </div>
      </div>
    `).join('');
  }

  function renderOpenMissingTable() {
    const container = document.getElementById('admin-open-missing');
    if (!container) return;
    const items = getOpenMissing();
    if (!items.length) {
      container.innerHTML = renderEmpty('No hay faltantes abiertos en el período seleccionado.');
      return;
    }
    container.innerHTML = items.map((item) => `
      <div class="admin-table-row">
        <div class="admin-table-primary">${escapeHtml(item.material_codigo || '–')} • ${escapeHtml(item.material_nombre || '–')}</div>
        <div class="admin-table-secondary">Evento: ${escapeHtml(item.evento || '–')} • Despacho: ${escapeHtml(item.numero_despacho || '–')}</div>
        <div class="admin-table-meta">
          <span class="admin-badge danger">${escapeHtml(formatNumber(item.cantidad_faltante || 0))} unidades</span>
          <span class="admin-badge">${escapeHtml(item.estado_proceso || 'pendiente_investigacion')}</span>
        </div>
      </div>
    `).join('');
  }

  function renderEventWatch() {
    const container = document.getElementById('admin-event-watch');
    if (!container) return;
    const events = getUpcomingEvents();
    if (!events.length) {
      container.innerHTML = renderEmpty('No hay eventos próximos para seguimiento.');
      return;
    }

    container.innerHTML = events.map((event) => `
      <div class="admin-table-row">
        <div class="admin-table-primary">${escapeHtml(event.nombre || 'Evento')}</div>
        <div class="admin-table-secondary">${escapeHtml(event.cliente || 'Sin cliente')} • ${escapeHtml(event.lugar || 'Sin lugar')}</div>
        <div class="admin-table-meta">
          <span class="admin-badge ok">${escapeHtml(formatDate(event.fecha_montaje))}</span>
          <span class="admin-badge">${escapeHtml(event.estado || 'sin estado')}</span>
        </div>
      </div>
    `).join('');
  }

  function renderShortcuts() {
    const container = document.getElementById('admin-shortcuts');
    if (!container) return;
    const items = [
      { module: 'bodega', title: 'Abrir Bodega', text: 'Ir a dashboards de inventario, faltantes y movimientos.' },
      { module: 'logistica', title: 'Abrir Logística', text: 'Seguimiento de solicitudes, despachos y coordinación.' },
      { module: 'ventas', title: 'Abrir Ventas', text: 'Eventos, clientes, cotizaciones y agenda comercial.' },
      { module: 'contabilidad', title: 'Abrir Contabilidad', text: 'Compras, bajas, proveedores y control financiero.' },
      { module: 'rrhh', title: 'Abrir RRHH', text: 'Personal, asistencia y reportes de talento.' }
    ];

    container.innerHTML = items.map((item) => `
      <button class="admin-shortcut-btn" data-jump-module="${escapeHtml(item.module)}">
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.text)}</span>
      </button>
    `).join('');
  }

  function renderDomainSummary() {
    const container = document.getElementById('admin-domain-summary');
    if (!container) return;
    const summaries = [
      { title: 'Bodega', text: `${formatNumber(getCriticalStock().length)} críticos • ${formatNumber(getOpenMissing().length)} faltantes abiertos` },
      { title: 'Logística', text: `${formatNumber(getUpcomingEvents().length)} eventos próximos para coordinación` },
      { title: 'Contabilidad', text: `${formatNumber(state.bajas.length)} bajas registradas en la ventana activa` },
      { title: 'RRHH', text: `${formatNumber(state.empleados.length)} empleados cargados en el directorio` }
    ];
    container.innerHTML = summaries.map((item) => `
      <div class="admin-item">
        <div class="admin-item-title">${escapeHtml(item.title)}</div>
        <div class="admin-item-text">${escapeHtml(item.text)}</div>
      </div>
    `).join('');
  }

  function renderPeopleSummary() {
    const container = document.getElementById('admin-people-summary');
    if (!container) return;
    const items = (state.empleados || []).slice(0, 8);
    if (!items.length) {
      container.innerHTML = renderEmpty('No se pudo cargar información de empleados.');
      return;
    }
    container.innerHTML = `
      <div class="admin-item">
        <div class="admin-item-title">Plantilla registrada</div>
        <div class="admin-item-text">Actualmente hay ${escapeHtml(formatNumber(state.empleados.length))} empleados en el directorio principal.</div>
      </div>
      ${items.map((item) => `
        <div class="admin-item">
          <div class="admin-item-title">${escapeHtml(`${item.nombres || ''} ${item.apellidos || ''}`.trim() || 'Empleado')}</div>
          <div class="admin-item-text">Código: ${escapeHtml(item.codigo_empleado || '–')}</div>
        </div>
      `).join('')}
    `;
  }

  function renderActivityFeed() {
    const container = document.getElementById('admin-activity-feed');
    if (!container) return;
    const feed = [
      ...(state.faltantes || []).slice(0, 4).map((item) => ({
        title: `Faltante ${item.material_codigo || '–'}`,
        text: `${item.evento || 'Sin evento'} • ${formatDateTime(item.created_at || item.fecha_despacho)}`,
        sortAt: normalizeDate(item.created_at || item.fecha_despacho)?.getTime() || 0,
        tone: 'danger'
      })),
      ...(state.danados || []).slice(0, 4).map((item) => ({
        title: `Dañado ${item.material_codigo || '–'}`,
        text: `${item.evento || 'Sin evento'} • ${formatDateTime(item.created_at || item.fecha_proceso)}`,
        sortAt: normalizeDate(item.created_at || item.fecha_proceso)?.getTime() || 0,
        tone: 'warn'
      })),
      ...(state.bajas || []).slice(0, 4).map((item) => ({
        title: `Baja ${item.numero_baja || '–'}`,
        text: `${item.estado || 'sin estado'} • ${formatDateTime(item.creado_en || item.fecha_baja)}`,
        sortAt: normalizeDate(item.creado_en || item.fecha_baja)?.getTime() || 0,
        tone: 'ok'
      }))
    ]
      .sort((a, b) => b.sortAt - a.sortAt)
      .slice(0, 10);

    if (!feed.length) {
      container.innerHTML = renderEmpty('No hay actividad reciente para mostrar.');
      return;
    }

    container.innerHTML = feed.map((item) => `
      <div class="admin-item">
        <div class="admin-item-title">${escapeHtml(item.title)}</div>
        <div class="admin-item-text">${escapeHtml(item.text)}</div>
        <div class="admin-item-meta"><span class="admin-badge ${item.tone}">${escapeHtml(item.tone === 'danger' ? 'Crítico' : item.tone === 'warn' ? 'Seguimiento' : 'Registro')}</span></div>
      </div>
    `).join('');
  }

  function renderAll() {
    renderHero();
    renderAlertTicker();
    renderMetrics();
    renderPriorityFeed();
    renderUpcomingEvents();
    renderCriticalStock();
    renderIncidents();
    renderBajasFeed();
    renderOpenMissingTable();
    renderEventWatch();
    renderShortcuts();
    renderDomainSummary();
    renderPeopleSummary();
    renderActivityFeed();
    setGlobalMessage(`Vista consolidada de los últimos ${state.days} días para seguimiento operativo, administrativo y de prioridades.`);
  }

  function bindTabs() {
    document.querySelectorAll('.admin-nav-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const section = button.dataset.section;
        document.querySelectorAll('.admin-nav-btn').forEach((btn) => btn.classList.toggle('active', btn === button));
        document.querySelectorAll('.admin-section').forEach((panel) => panel.classList.toggle('active', panel.dataset.section === section));
        updateSectionLabel(section);
      });
    });
  }

  function bindPeriods() {
    document.querySelectorAll('.admin-period-btn').forEach((button) => {
      button.addEventListener('click', async () => {
        const days = Number(button.dataset.days || 30);
        state.days = days;
        document.querySelectorAll('.admin-period-btn').forEach((btn) => btn.classList.toggle('active', btn === button));
        await loadData();
      });
    });
  }

  function bindShortcuts() {
    document.getElementById('admin-shortcuts')?.addEventListener('click', (event) => {
      const target = event.target.closest('[data-jump-module]');
      if (!target) return;
      if (typeof window.loadModule === 'function') {
        window.loadModule(target.dataset.jumpModule);
      }
    });
  }

  function bindRefresh() {
    document.getElementById('admin-refresh-btn')?.addEventListener('click', loadData);
  }

  async function init() {
    initBrandSwitcher();
    startLiveClock();
    startAlertTickerRefresh();
    updateSectionLabel('resumen');
    bindTabs();
    bindPeriods();
    bindShortcuts();
    bindRefresh();
    await loadData();
  }

  init();
})();