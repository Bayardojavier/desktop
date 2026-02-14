
> <script>
  (function () {
    const root = document.getElementById('fe-preview-ficha');
    if (!root) return;
    if (root.dataset.feInit === '1') return;
    root.dataset.feInit = '1';
  
    const supa = window.supabaseClient;
    const FICHA_KEY = 'bodega_ficha_layout_v1';
    const ETIQ_KEY  = 'bodega_etiqueta_layout_v1';
  
    const THEMES = [
      { key: 'AUTO', name: 'Auto (por bodega)', start: null, end: null, 
accent: null },
      { key: 'AZUL', name: 'Azul', start: 'mediumblue', end: 'skyblue', 
accent: 'mediumblue' },
      { key: 'MORADO', name: 'Morado', start: 'mediumpurple', end: 'hotpink', 
accent: 'mediumpurple' },
      { key: 'VERDE', name: 'Verde', start: 'teal', end: 'limegreen', accent: 
'teal' },
      { key: 'NARANJA', name: 'Naranja', start: 'chocolate', end: 
'darkorange', accent: 'chocolate' },
      { key: 'ROJO', name: 'Rojo', start: 'crimson', end: 'red', accent: 
'crimson' },
      { key: 'GRIS', name: 'Gris', start: 'darkslategray', end: 'slategray', 
accent: 'darkslategray' }
    ];
  
    const ALLOWED = [
      { value: 'NADA', label: 'Nada (vacÃ­o)' },
      { value: 'NOMBRE', label: 'Nombre' },
      { value: 'CODIGO', label: 'CÃ³digo' },
      { value: 'UBICACION', label: 'UbicaciÃ³n (Principal/Secundaria)' },
      { value: 'PRINCIPAL', label: 'Bodega Principal' },
      { value: 'SECUNDARIA', label: 'Bodega Secundaria' },
      { value: 'CONTENEDOR', label: 'Contenedor/Lote' },
      { value: 'TIPO_USO', label: 'Tipo de uso' },
      { value: 'TIPO_MATERIAL', label: 'Tipo de material' },
      { value: 'COLOR', label: 'Color' },
      { value: 'UNIDAD', label: 'Unidad' },
      { value: 'DIMENSIONES', label: 'Medidas/Dimensiones' },
      { value: 'MARCA', label: 'Marca' },
      { value: 'MODELO', label: 'Modelo' },
  
      { value: 'ESTADO', label: 'Estado (FabricaciÃ³n Local/Original)' },
  
      { value: 'FECHA', label: 'Fecha' }
    ];
  
    const DEFAULT_FICHA = {
      principal: 'NOMBRE',
      secundario: 'CODIGO',
      fotoPos: 'left',
      campos: ['NOMBRE', 'CODIGO', 'UBICACION', 'COLOR', 'TIPO_USO', 
'TIPO_MATERIAL', 'UNIDAD', 'DIMENSIONES', 'MARCA', 'MODELO', 'ESTADO', 
'FECHA'],
      themeKey: 'AUTO'
    };
  
    const DEFAULT_ETIQ = {
      principal: 'CODIGO',
      secundario: 'NOMBRE',
      fotoPos: 'hide',
      campos: ['COLOR', 'UBICACION', 'NADA'],
      themeKey: 'AUTO'
    };
  
    const state = {
      bodegaKey: null,
      buscarTipo: 'MATERIAL',
      material: null,
      hijos: [],
      ficha: null,
      etiq: null,
      allCodes: [],
      currentIndex: -1
    };
  
    const BUSCAR_TIPO_STORAGE_KEY = 'bodega_ficha_etiqueta_buscar_tipo_v1';
  
    const BODEGA_STORAGE_KEY = 'bodega_ficha_etiqueta_bodega_v1';
    const BODEGAS = [
      { key: 'AUDIOVISUAL', label: 'Audiovisual', catalogo: 
'catalogo_audiovisual', movimientos: 'movimientos_bodega_audiovisual', stock: 
'stock_audiovisual' },
      { key: 'HIERROS', label: 'Hierros', catalogo: 'catalogo_hierros', 
movimientos: 'movimientos_bodega_hierros', stock: 'stock_hierros' },
      { key: 'CONSUMIBLES', label: 'Consumibles', catalogo: 
'catalogo_consumibles', movimientos: 'movimientos_bodega_consumibles', stock: 
'stock_consumibles' }
    ];
  
    function normalizeBodegaKey(k) {
      const kk = (k || '').toString().trim().toUpperCase();
      return BODEGAS.some(b => b.key === kk) ? kk : null;
    }
  
    function inferBodegaKeyFromContext() {
      const ctxCatalogo = window.__UA_CONTEXT?.tableOverrides?.catalogo;
      if (!ctxCatalogo) return null;
      const hit = BODEGAS.find(b => b.catalogo === ctxCatalogo);
      return hit?.key || null;
    }
  
    function loadBodegaKey() {
      try {
        const stored = 
normalizeBodegaKey(localStorage.getItem(BODEGA_STORAGE_KEY));
        if (stored) return stored;
      } catch (_) {}
      const inferred = inferBodegaKeyFromContext();
      if (inferred) return inferred;
      return 'AUDIOVISUAL';
    }
  
    function getActiveBodega() {
      const k = normalizeBodegaKey(state.bodegaKey) || 'AUDIOVISUAL';
      return BODEGAS.find(b => b.key === k) || BODEGAS[0];
    }
  
    function getActiveTables() {
      const b = getActiveBodega();
      return { catalogo: b.catalogo, movimientos: b.movimientos, stock: 
b.stock };
    }
  
    function setActiveBodega(key, opts = {}) {
      const { persist = true, clearMaterial = true } = opts;
      const k = normalizeBodegaKey(key) || 'AUDIOVISUAL';
      state.bodegaKey = k;
      if (persist) {
        try { localStorage.setItem(BODEGA_STORAGE_KEY, k); } catch (_) {}
      }
      if (clearMaterial) {
        state.material = null;
        state.hijos = [];
        state.currentIndex = -1;
        state.allCodes = [];
        loadAllCodes();
        const status = document.getElementById('fe-status');
        if (status) status.textContent = `(sin material cargado) â€” Bodega: 
${getActiveBodega().label}`;
        renderAll();
      }
    }
  
    function normalizeBuscarTipo(v) {
      const t = (v || '').toString().trim().toUpperCase();
      return (t === 'CONTENEDOR' || t === 'MATERIAL') ? t : 'MATERIAL';
    }
  
    function normalizeTipoAlta(v) {
      const t = (v || '').toString().trim().toUpperCase();
      if (t.includes('CONTEN')) return 'CONTENEDOR';
      if (t.includes('MATER')) return 'MATERIAL';
      return '';
    }
    function asBool(v) {
      if (v === true) return true;
      if (v === false || v == null) return false;
      if (v === 1 || v === '1') return true;
      if (typeof v === 'string') {
        const t = v.trim().toLowerCase();
        return t === 't' || t === 'true' || t === 'yes' || t === 'si' || t === 
'sÃ';
      }
      return false;
    }
  
    function loadBuscarTipo() {
      try {
        return 
normalizeBuscarTipo(localStorage.getItem(BUSCAR_TIPO_STORAGE_KEY));
      } catch (_) {
        return 'MATERIAL';
      }
    }
  
    function setBuscarTipo(v, opts = {}) {
      const { persist = true, clearMaterial = false } = opts;
      state.buscarTipo = normalizeBuscarTipo(v);
      if (persist) {
        try { localStorage.setItem(BUSCAR_TIPO_STORAGE_KEY, state.buscarTipo); 
} catch (_) {}
      }
      if (clearMaterial) {
        state.material = null;
        state.hijos = [];
        const status = document.getElementById('fe-status');
        if (status) status.textContent = `(sin material cargado) â€” Bodega: 
${getActiveBodega().label}`;
        renderAll();
      }
    }
  
    // ----------------------------
    // Modal buscador de material
    // ----------------------------
    const modal = document.getElementById('fe-modal-buscador');
    const modalQ = document.getElementById('fe-modal-q');
    const modalResultados = document.getElementById('fe-modal-resultados');
    const btnAbrirBuscador = document.getElementById('fe-btn-abrir-buscador');
    const btnModalBuscar = document.getElementById('fe-modal-buscar');
    const btnModalCancel = document.getElementById('fe-modal-cancel');
    const btnModalX = document.getElementById('fe-modal-x');
  
    function abrirModalBuscador() {
      if (!modal) return;
      modal.style.display = 'flex';
      if (modalResultados) modalResultados.innerHTML = '<div 
style="color:slategray; font-size:12px;">Escribe para buscar...</div>';
      setTimeout(() => modalQ?.focus(), 0);
    }
  
    function cerrarModalBuscador() {
      if (!modal) return;
      modal.style.display = 'none';
    }
  
    function escapeHtml(s) {
      return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  
    function hashStringToIndex(str, mod) {
      const s = String(str || '');
      let h = 0;
      for (let i = 0; i < s.length; i++) {
        h = ((h << 5) - h) + s.charCodeAt(i);
        h |= 0;
      }
      const n = Math.abs(h);
      return mod ? (n % mod) : n;
    }
  
    function normalizeThemeKey(key) {
      const k = (key || 'AUTO').toString().toUpperCase();
      return THEMES.some(t => t.key === k) ? k : 'AUTO';
    }
  
    function getGradienteYColor(bodegaActual, themeKey) {
      const k = normalizeThemeKey(themeKey);
      if (k === 'AUTO') {
        // Paleta estable por nombre de bodega
        const palette = ['mediumblue', 'mediumpurple', 'teal', 'chocolate', 
'crimson', 'skyblue'];
        const idx = hashStringToIndex(bodegaActual, palette.length);
        const base = palette[idx];
        return { gradienteStart: base, gradienteEnd: `${base}99`, colorAcento: 
base };
      }
  
      const t = THEMES.find(x => x.key === k);
      return {
        gradienteStart: t?.start || 'mediumblue',
        gradienteEnd: t?.end || 'skyblue',
        colorAcento: t?.accent || 'mediumblue'
      };
    }
  
    function getColorHex(colorNombre) {
      const c = String(colorNombre || '').trim().toLowerCase();
      const map = {
        'sin color': 'slategray',
        'negro': 'black',
        'blanco': 'white',
        'rojo': 'red',
        'rojo oscuro': 'darkred',
        'azul': 'blue',
        'azul oscuro': 'mediumblue',
        'celeste': 'blue',
        'verde': 'limegreen',
        'verde lima': 'limegreen',
        'verde oscuro': 'darkgreen',
        'amarillo': 'yellow',
        'naranja': 'darkorange',
        'gris': 'gray',
        'gris oscuro': 'darkgray',
        'violeta': 'violet',
        'fucsia': 'hotpink'
      };
      return map[c] || 'slategray';
    }
  
    function hexToColorName(hex) {
      const map = {
        '#94a3b8': 'sin color',
        '#000000': 'negro',
        '#ffffff': 'blanco',
        '#ef4444': 'rojo',
        '#b91c1c': 'rojo oscuro',
        '#3b82f6': 'azul',
        '#1e40af': 'azul oscuro',
        '#3b82f6': 'celeste',
        '#22c55e': 'verde',
        '#22c55e': 'verde lima',
        '#166534': 'verde oscuro',
        '#fde047': 'amarillo',
        '#f97316': 'naranja',
        '#9ca3af': 'gris',
        '#4b5563': 'gris oscuro',
        '#8b5cf6': 'violeta',
        '#d946ef': 'fucsia',
        '#0f172a': 'gris oscuro'
      };
      return map[hex] || hex;
    }
  
    function buildDimensionesStr(m) {
      const unidad = (m?.unidad_medida || 'SIN').toString();
      if (unidad === 'SIN') return 'Sin Medida';
      const dims = m?.dimensiones && typeof m.dimensiones === 'object' ? 
m.dimensiones : {};
      const ancho = (dims.ancho ?? dims.width ?? dims.ANCHO);
      const largo = (dims.largo ?? dims.length ?? dims.LARGO);
      const grosor = (dims.grosor ?? dims.alto ?? dims.height ?? dims.GROSOR);
      const uLabel = (unidad === 'PUL') ? 'pulg' : 'cm';
      const a = (ancho ?? 'â€“');
      const l = (largo ?? 'â€“');
      const g = (grosor ?? 'â€“');
      return `${a} Ã— ${l} Ã— ${g} ${uLabel}`;
    }
  
    async function buscarMateriales(q) {
      if (!supa) throw new Error('Supabase no estÃ¡ inicializado.');
      const clean = String(q || '').trim();
      if (!clean) return [];
  
      const { catalogo } = getActiveTables();
      const isConsumibles = (catalogo === 'catalogo_consumibles');
  
      // Limita caracteres problemÃ¡ticos en el filtro OR
      const safe = clean.replace(/[,]/g, ' ').slice(0, 80);
      const like = `%${safe}%`;
  
      const wantContainers = (state.buscarTipo === 'CONTENEDOR');
  
      // No mezclar contenedores en bÃºsquedas de materiales.
      // IMPORTANTE: en tu data actual, los contenedores pueden tener 
es_contenedor=false,
      // asÃ que la fuente de verdad aquÃ es tipo_alta (y es_contenedor solo 
ayuda si estÃ¡ bien).
      const selectBusqueda = isConsumibles
  
        ? 'codigo, nombre, bodega_principal, bodega_secundaria, foto_url, 
campos_personalizados, contenedor, contenedor_tipo'
        : 'codigo, nombre, bodega_principal, bodega_secundaria, foto_url, 
es_contenedor, tipo_alta, campos_personalizados, contenedor, contenedor_tipo';
  
  
      let { data, error } = await supa
        .from(catalogo)
        .select(selectBusqueda)
  
        .or(`codigo.ilike.${like},nombre.ilike.${like},contenedor.ilike.${like}
,contenedor_tipo.ilike.${like}`)
  
        .order('nombre', { ascending: true })
        .limit(80);
  
      if (error) {
        const msg = (error.message || '').toLowerCase();
        const missingKnown = (msg.includes('does not exist') && 
(msg.includes('es_contenedor') || msg.includes('tipo_alta'))) || error.code 
=== '42703';
        if (!missingKnown) throw error;
  
        const retry = await supa
          .from(catalogo)
  
          .select('codigo, nombre, bodega_principal, bodega_secundaria, 
foto_url, campos_personalizados, contenedor, contenedor_tipo')
          .or(`codigo.ilike.${like},nombre.ilike.${like},contenedor.ilike.${lik
e},contenedor_tipo.ilike.${like}`)
  
          .order('nombre', { ascending: true })
          .limit(80);
        if (retry.error) throw retry.error;
        data = retry.data || [];
      }
  
      const rows = Array.isArray(data) ? data : [];
      const filtered = rows.filter(r => {
        const rowIsCont = asBool(r?.es_contenedor) || 
(normalizeTipoAlta(r?.tipo_alta || r?.campos_personalizados?.tipo_alta) === 
'CONTENEDOR');
        return wantContainers ? rowIsCont : !rowIsCont;
      });
      return filtered.slice(0, 30);
    }
  
    function renderResultados(items) {
      if (!modalResultados) return;
      if (!items.length) {
        modalResultados.innerHTML = '<div style="color:slategray; 
font-size:12px;">Sin resultados.</div>';
        return;
      }
  
      modalResultados.innerHTML = '';
      items.forEach((it) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'bodega-export-pdf-btn';
        btn.style.textAlign = 'left';
        btn.style.padding = '10px 10px';
        btn.style.border = '1px solid rgba(148,163,184,0.18)';
        btn.style.background = 'rgba(15,23,42,0.18)';
        btn.innerHTML = `
          <div style="display:flex; justify-content:space-between; gap:10px;">
            <div style="font-weight:900; 
color:lightgray;">${escapeHtml(it.nombre || '')}</div>
            <div style="color:lightsteelblue; 
font-weight:800;">${escapeHtml(it.codigo || '')}</div>
          </div>
          <div style="margin-top:4px; color:slategray; font-size:12px;">
            ${escapeHtml(it.bodega_principal || '')} / 
${escapeHtml(it.bodega_secundaria || '')}
          </div>
        `;
        btn.onclick = async () => {
          const codigo = (it.codigo || '').toString();
          const inputCodigo = document.getElementById('fe-codigo-buscar');
          if (inputCodigo) inputCodigo.value = codigo;
          cerrarModalBuscador();
          try {
            await cargarMaterial(codigo);
          } catch (err) {
            console.error(err);
            alert('âŒ No se pudo cargar: ' + (err.message || err));
          }
        };
        modalResultados.appendChild(btn);
      });
    }
  
    async function ejecutarBusquedaModal() {
      const q = (modalQ?.value || '').toString().trim();
      if (!q) {
        renderResultados([]);
        return;
      }
      if (modalResultados) modalResultados.innerHTML = '<div 
style="color:slategray; font-size:12px;">Buscando...</div>';
      const items = await buscarMateriales(q);
      renderResultados(items);
    }
  
    function loadCfg(key, fallback) {
      try {
        const raw = JSON.parse(localStorage.getItem(key) || 'null');
        if (!raw || typeof raw !== 'object') return { ...fallback };
        return {
          principal: raw.principal || fallback.principal,
          secundario: raw.secundario || fallback.secundario,
          fotoPos: raw.fotoPos || fallback.fotoPos,
          campos: Array.isArray(raw.campos) ? raw.campos.slice(0, 
fallback.campos.length) : fallback.campos.slice(),
          themeKey: normalizeThemeKey(raw.themeKey || fallback.themeKey || 
'AUTO')
        };
      } catch {
        return { ...fallback };
      }
    }
  
    function saveCfg() {
      localStorage.setItem(FICHA_KEY, JSON.stringify(state.ficha));
      localStorage.setItem(ETIQ_KEY, JSON.stringify(state.etiq));
    }
  
    function optHtml() {
      return ALLOWED.map(o => `<option 
value="${o.value}">${o.label}</option>`).join('');
    }
  
    function setSelectOptions(selectEl) {
      selectEl.innerHTML = optHtml();
    }
  
    function getValue(field, material) {
      const m = material || {};
      switch (field) {
        case 'NADA': return '';
        case 'NOMBRE': return (m.nombre || '').toString();
        case 'CODIGO': return (m.codigo || '').toString();
        case 'UBICACION': {
          const p = (m.bodega_principal || '').toString();
          const s = (m.bodega_secundaria || '').toString();
          if (p && s) return `${p} / ${s}`;
          return p || s || '';
        }
        case 'PRINCIPAL': return (m.bodega_principal || '').toString();
        case 'SECUNDARIA': return (m.bodega_secundaria || '').toString();
        case 'CONTENEDOR': return (m.__contenedores_str || m.contenedor_nombre 
|| '').toString();
        case 'TIPO_USO': return (m.tipo_uso || '').toString();
        case 'TIPO_MATERIAL': return (m.tipo_material || '').toString();
        case 'COLOR': {
          const colorValue = (m.color || '').toString();
          return /^#[0-9a-fA-F]{6}$/.test(colorValue) ? 
hexToColorName(colorValue) : colorValue;
        }
        case 'UNIDAD': return (m.unidad_medida || '').toString();
        case 'DIMENSIONES': return (m.__dimensiones_str || '').toString();
        case 'MARCA': return (m.marca || '').toString();
        case 'MODELO': return (m.modelo || '').toString();
        case 'ESTADO': return (m.__estado_str || '').toString();
        case 'FECHA': return (m.__fecha_str || '').toString();
        default: return '';
      }
    }
  
    function buildContenedoresStr(rows) {
      const list = Array.isArray(rows) ? rows : [];
      const cleaned = list
        .map(r => ({
          nombre: (r?.ubicacion_nombre ?? '').toString().trim(),
          existencia: Number(r?.cantidad ?? 0)
        }))
        .filter(x => x.nombre && isFinite(x.existencia) && x.existencia !== 0);
  
      if (!cleaned.length) return '';
      return cleaned
        .map(x => `${x.nombre}: ${x.existencia}`)
        .join(' | ');
    }
  
    function labelOf(field) {
      return ALLOWED.find(a => a.value === field)?.label || field;
    }
  
    function renderFieldsList(container, values, max) {
      container.innerHTML = '';
      for (let i = 0; i < max; i++) {
        const select = document.createElement('select');
        select.className = 'audiovisual-input';
        setSelectOptions(select);
        select.value = values[i] || 'NADA';
        container.appendChild(select);
      }
    }
  
    function readFieldsList(container) {
      const selects = Array.from(container.querySelectorAll('select'));
      return selects.map(s => (s.value || '').toString()).filter(Boolean);
    }
  
    function renderPreviewFicha() {
      const m = state.material;
      const cfg = state.ficha;
  
      const printArea = document.getElementById('fe-ficha-print-area');
      if (!printArea) return;
  
      const material = m || {};
      const principalText = getValue(cfg.principal, material) || 'â€”';
      const secundarioText = getValue(cfg.secundario, material) || '';
  
      const bodegaActual = (material.bodega_principal || 
material.bodega_secundaria || 'Bodega').toString();
      const { gradienteStart, gradienteEnd, colorAcento } = 
getGradienteYColor(bodegaActual, cfg.themeKey);
  
      const codigoFooter = (material.codigo || '').toString() || 'â€”';
  
      const fotoUrl = material.foto_url ? String(material.foto_url) : '';
      const fotoBlock = (cfg.fotoPos === 'hide')
        ? ''
        : `
          <div class="fe-photo" style="order:${cfg.fotoPos === 'right' ? 2 : 
0};">
            ${fotoUrl
              ? `<img src="${fotoUrl}" style="width:100%; height:100%; 
object-fit:cover;" />`
              : `<div class="fe-photo-placeholder">ðŸ“·</div>`
            }
          </div>
        `;
  
      const campos = Array.isArray(cfg.campos) ? cfg.campos.slice(0, 12) : [];
      const gridItems = campos.map(f => {
        const v = getValue(f, material);
        if (!v) return '';
  
        if (f === 'COLOR') {
          const hex = getColorHex(String(v));
          return `
            <div class="fe-item">
              <span class="fe-label" 
style="color:${colorAcento};">${labelOf(f)}:</span><br>
              <span style="display:inline-block;width:12px;height:12px;backgrou
nd:${hex};border:1px solid 
slategray;border-radius:2px;margin-right:5px;"></span>
              ${escapeHtml(String(v))}
            </div>
          `;
        }
  
        return `
          <div class="fe-item">
            <span class="fe-label" 
style="color:${colorAcento};">${labelOf(f)}:</span><br>
            ${escapeHtml(String(v))}
          </div>
        `;
      }).filter(Boolean).join('');
  
      const hijos = Array.isArray(state.hijos) ? state.hijos : [];
      const totalItems = hijos.reduce((acc, h) => {
        const q = Number(h?.__cantidad);
        if (!isFinite(q)) return acc + 1;
        return acc + q;
      }, 0);
      const totalItemsStr = Number.isInteger(totalItems) ? String(totalItems) 
: String(Math.round(totalItems * 100) / 100);
  
      const hijosBlock = (material.__es_contenedor && hijos.length)
        ? `
          <div style="margin-top: 14px;">
            <div style="font-weight:900; margin: 0 0 6px 0; 
color:${colorAcento};">Hijos dentro del contenedor (${hijos.length}) â€” Total 
items: ${escapeHtml(totalItemsStr)}</div>
            <table class="fe-hijos-table">
              <thead>
                <tr>
                  <th style="width:190px;">CÃ³digo</th>
                  <th>Nombre</th>
                  <th style="width:90px; text-align:right;">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                ${hijos.map(h => {
                  return `
                    <tr>
                      <td 
style="font-weight:900;">${escapeHtml(String(h.codigo || ''))}</td>
                      <td>${escapeHtml(String(h.nombre || ''))}</td>
                      <td style="text-align:right; 
font-weight:900;">${escapeHtml(String(h.__cantidad ?? ''))}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `
        : '';
  
      printArea.innerHTML = `
        <div class="fe-ficha">
          <div class="fe-ficha-header" style="background: 
linear-gradient(135deg, ${gradienteStart}, ${gradienteEnd});">
            <div>
              <h1>FICHA TÃ‰CNICA DE MATERIAL</h1>
              <p>BODEGA: ${escapeHtml(bodegaActual.toUpperCase())}</p>
            </div>
            <div class="fe-logo-box">
              <img class="fe-logo" src="./assets/logo.png" alt="Logo" />
            </div>
          </div>
  
          <div class="fe-ficha-content" style="flex-direction:${cfg.fotoPos 
=== 'right' ? 'row-reverse' : 'row'};">
            ${fotoBlock}
            <div class="fe-grid">
              <div class="fe-item"><span class="fe-label" style="color:${colorA
cento};">${escapeHtml(labelOf(cfg.principal))}:</span><br>${escapeHtml(String(p
rincipalText))}</div>
              <div class="fe-item"><span class="fe-label" style="color:${colorA
cento};">${escapeHtml(labelOf(cfg.secundario))}:</span><br>${escapeHtml(String(
secundarioText))}</div>
              ${gridItems}
            </div>
          </div>
  
          ${hijosBlock}
          <div class="fe-footer" style="border-top: 5px solid ${colorAcento}; 
color:${colorAcento};">
            <div>${escapeHtml(codigoFooter)}</div>
            ${!m?.__es_contenedor ? `<div class="fe-cantidad-indicator" 
style="background: ${colorAcento}; position: relative; margin-left: 
20px;">${escapeHtml((m?.cantidad ?? 1).toString())}</div>` : ''}
          </div>
        </div>
      `;
  
    function renderPreviewEtiq() {
      const m = state.material;
      const cfg = state.etiq;
  
      const printArea = document.getElementById('fe-etiq-print-area');
      if (!printArea) return;
  
      const material = m || {};
      const bodegaActual = (material.bodega_principal || 
material.bodega_secundaria || 'Bodega').toString();
      const { colorAcento } = getGradienteYColor(bodegaActual, cfg.themeKey);
  
      function renderEtiquetaDeItem(item) {
        const principalCfg = (cfg.principal || '').toString().toUpperCase();
        // Siempre mostrar el cÃ³digo real del Ãtem como fallback (para que 
nunca quede vacÃo)
        const codigo = (principalCfg === 'NADA')
          ? (item.codigo || 'â€”')
          : (getValue(cfg.principal, item) || (item.codigo || 'â€”'));
        const nombre = getValue(cfg.secundario, item) || (item.nombre || 
'Producto');
        const campos = Array.isArray(cfg.campos) ? cfg.campos.slice(0, 3) : [];
        const detalleParts = campos
          .map(f => getValue(f, item))
          .map(v => (v || '').toString().trim())
          .filter(Boolean)
          .slice(0, 3);
        const detalle = detalleParts.length ? detalleParts.join(' | ') : '';
  
        const fotoUrl = item.foto_url ? String(item.foto_url) : '';
        const showFoto = (cfg.fotoPos && cfg.fotoPos !== 'hide');
        const fotoBlock = (!showFoto)
          ? ''
          : `
            <div class="fe-etiq-photo" style="order:${cfg.fotoPos === 'right' 
? 2 : 0};">
              ${fotoUrl ? `<img src="${fotoUrl}" />` : `<div 
class="fe-etiq-photo-placeholder">ðŸ“·</div>`}
            </div>
          `;
  
        const qrBlock = '';
  
        return `
  
          <div class="fe-etiq" style="border-color:${colorAcento}; width: 
384px; position: relative;">
  
            <div class="fe-etiq-row" style="flex-direction:${cfg.fotoPos === 
'right' ? 'row-reverse' : 'row'};">
              ${fotoBlock}
              <div class="fe-etiq-right">
                <div style="display:flex; align-items:flex-start; 
justify-content:space-between; gap:10px;">
                  <div style="flex:1; min-width:0;">
  
  
                    <div 
class="fe-etiq-nombre">${escapeHtml(String(nombre))}</div>
                    <div class="fe-etiq-detalle">${escapeHtml(detalle)}</div>
                  </div>
                  ${qrBlock}
                </div>
                <div class="fe-etiq-footer" 
style="border-top-color:${colorAcento};">
  
                  <div class="fe-etiq-codigo" 
style="border-bottom-color:${colorAcento}; color:${colorAcento}; font-size: 
18px; font-weight: bold;">${escapeHtml(String(codigo))}</div>
                  <div class="fe-cantidad-indicator" style="background: 
${colorAcento}; position: relative; margin-top: 
10px;">${escapeHtml((item.cantidad || item.__cantidad || 1).toString())}</div>
                </div>
          </div>
  
          </div>
        `;
      }
  
      if (material.__es_contenedor) {
        const hijos = Array.isArray(state.hijos) ? state.hijos : [];
        if (!hijos.length) {
          printArea.innerHTML = `
            <div style="padding: 10px; color:darkslategray; font-size: 13px;">
              (Contenedor cargado sin hijos)
            </div>
          `;
          return;
        }
        printArea.innerHTML = `
          <div class="fe-etiq-grid">
            ${hijos.map(h => renderEtiquetaDeItem(h)).join('')}
          </div>
        `;
        return;
      }
  
      printArea.innerHTML = renderEtiquetaDeItem(material);
    }
  
    function renderAll() {
      renderPreviewFicha();
      renderPreviewEtiq();
    }
  
    function wireUI() {
      const bodegaSelect = document.getElementById('fe-bodega-select');
      const buscarTipo = document.getElementById('fe-buscar-tipo');
      const fichaPrincipal = document.getElementById('fe-ficha-principal');
      const fichaSec = document.getElementById('fe-ficha-secundario');
      const fichaFoto = document.getElementById('fe-ficha-foto-pos');
      const fichaTheme = document.getElementById('fe-ficha-theme');
      const fichaCampos = document.getElementById('fe-ficha-campos');
  
      const etiqPrincipal = document.getElementById('fe-etiq-principal');
      const etiqSec = document.getElementById('fe-etiq-secundario');
      const etiqFoto = document.getElementById('fe-etiq-foto-pos');
      const etiqTheme = document.getElementById('fe-etiq-theme');
      const etiqCampos = document.getElementById('fe-etiq-campos');
  
      if (bodegaSelect) {
        bodegaSelect.innerHTML = BODEGAS.map(b => `<option 
value="${b.key}">${b.label}</option>`).join('');
        bodegaSelect.value = normalizeBodegaKey(state.bodegaKey) || 
'AUDIOVISUAL';
        bodegaSelect.addEventListener('change', () => {
          setActiveBodega(bodegaSelect.value, { persist: true, clearMaterial: 
true });
        });
      }
  
      if (buscarTipo) {
        buscarTipo.value = normalizeBuscarTipo(state.buscarTipo);
        buscarTipo.addEventListener('change', () => {
          setBuscarTipo(buscarTipo.value, { persist: true, clearMaterial: true 
});
        });
      }
  
      [fichaPrincipal, fichaSec, etiqPrincipal, 
etiqSec].forEach(setSelectOptions);
  
      if (fichaTheme) {
        fichaTheme.innerHTML = THEMES.map(t => `<option 
value="${t.key}">${t.name}</option>`).join('');
      }
      if (etiqTheme) {
        etiqTheme.innerHTML = THEMES.map(t => `<option 
value="${t.key}">${t.name}</option>`).join('');
      }
  
      fichaPrincipal.value = state.ficha.principal;
      fichaSec.value = state.ficha.secundario;
      fichaFoto.value = state.ficha.fotoPos;
      if (fichaTheme) fichaTheme.value = 
normalizeThemeKey(state.ficha.themeKey);
  
      etiqPrincipal.value = state.etiq.principal;
      etiqSec.value = state.etiq.secundario;
      etiqFoto.value = state.etiq.fotoPos;
      if (etiqTheme) etiqTheme.value = normalizeThemeKey(state.etiq.themeKey);
  
      renderFieldsList(fichaCampos, state.ficha.campos, 12);
      renderFieldsList(etiqCampos, state.etiq.campos, 3);
  
      const onChange = () => {
        state.ficha.principal = fichaPrincipal.value;
        state.ficha.secundario = fichaSec.value;
        state.ficha.fotoPos = fichaFoto.value;
        state.ficha.campos = readFieldsList(fichaCampos).slice(0, 12);
        state.ficha.themeKey = normalizeThemeKey(fichaTheme?.value || 
state.ficha.themeKey);
  
        state.etiq.principal = etiqPrincipal.value;
        state.etiq.secundario = etiqSec.value;
        state.etiq.fotoPos = etiqFoto.value;
        state.etiq.campos = readFieldsList(etiqCampos).slice(0, 3);
        state.etiq.themeKey = normalizeThemeKey(etiqTheme?.value || 
state.etiq.themeKey);
  
        renderAll();
      };
  
      [fichaPrincipal, fichaSec, fichaFoto, fichaTheme, etiqPrincipal, 
etiqSec, etiqFoto, etiqTheme]
        .filter(Boolean)
        .forEach(el => el.addEventListener('change', onChange));
      fichaCampos.addEventListener('change', onChange);
      etiqCampos.addEventListener('change', onChange);
  
      document.getElementById('fe-btn-guardar').addEventListener('click', () 
=> {
        onChange();
        saveCfg();
        alert('âœ… ConfiguraciÃ³n guardada.');
      });
  
      document.getElementById('fe-btn-reset').addEventListener('click', () => {
        state.ficha = { ...DEFAULT_FICHA, campos: DEFAULT_FICHA.campos.slice() 
};
        state.etiq = { ...DEFAULT_ETIQ, campos: DEFAULT_ETIQ.campos.slice() };
        saveCfg();
        wireUI();
        renderAll();
      });
  
      document.getElementById('fe-btn-limpiar').addEventListener('click', () 
=> {
        state.material = null;
        state.currentIndex = -1;
        document.getElementById('fe-status').textContent = `(sin material 
cargado) â€” Bodega: ${getActiveBodega().label}`;
        state.hijos = [];
        renderAll();
      });
  
      document.getElementById('fe-btn-buscar').addEventListener('click', () => 
{
        const codigo = (document.getElementById('fe-codigo-buscar').value || 
'').trim();
        if (!codigo) { alert('Ingrese un cÃ³digo.'); return; }
        cargarMaterial(codigo).catch(err => {
          console.error(err);
          alert('âŒ No se pudo cargar: ' + (err.message || err));
        });
      });
  
      // Modal buscador
      btnAbrirBuscador?.addEventListener('click', () => {
        if (!supa) {
          alert('âŒ Supabase no estÃ¡ inicializado.');
          return;
        }
        abrirModalBuscador();
      });
      btnModalBuscar?.addEventListener('click', () => {
        ejecutarBusquedaModal().catch(err => {
          console.error(err);
          alert('âŒ Error buscando: ' + (err.message || err));
        });
      });
      btnModalCancel?.addEventListener('click', cerrarModalBuscador);
      btnModalX?.addEventListener('click', cerrarModalBuscador);
  
      modal?.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModalBuscador();
      });
  
      modalQ?.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          cerrarModalBuscador();
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          ejecutarBusquedaModal().catch(err => {
            console.error(err);
            alert('âŒ Error buscando: ' + (err.message || err));
          });
        }
      });
  
      document.getElementById('fe-btn-export-pdf')?.addEventListener('click', 
() => {
        exportarPDF().catch(err => {
          console.error(err);
          alert('âŒ No se pudo exportar a PDF: ' + (err.message || err));
        });
      });
  
  
      
document.getElementById('fe-btn-export-ficha-png')?.addEventListener('click', 
async () => {
        if (!state.material) {
          alert('âŒ Primero carga un material o contenedor.');
          return;
        }
        try {
          await exportarPNG('ficha', state.material.codigo);
          alert('âœ… Ficha PNG exportada correctamente.');
        } catch (err) {
          alert('âŒ Error al exportar ficha PNG: ' + (err.message || err));
        }
      });
  
      
document.getElementById('fe-btn-export-etiq-png')?.addEventListener('click', 
async () => {
        if (!state.material) {
          alert('âŒ Primero carga un material o contenedor.');
          return;
        }
        try {
          await exportarPNG('etiqueta', state.material.codigo);
          alert('âœ… Etiqueta PNG exportada correctamente.');
        } catch (err) {
          alert('âŒ Error al exportar etiqueta PNG: ' + (err.message || err));
        }
      });
  
      // Navigation buttons
      document.getElementById('fe-btn-prev')?.addEventListener('click', () => {
        if (state.allCodes.length === 0) {
          loadAllCodes().then(() => {
            if (state.currentIndex > 0) navigateToCode(state.currentIndex - 1);
          });
        } else {
          if (state.currentIndex > 0) navigateToCode(state.currentIndex - 1);
        }
      });
  
      document.getElementById('fe-btn-next')?.addEventListener('click', () => {
        if (state.allCodes.length === 0) {
          loadAllCodes().then(() => {
            if (state.currentIndex < state.allCodes.length - 1) 
navigateToCode(state.currentIndex + 1);
          });
        } else {
          if (state.currentIndex < state.allCodes.length - 1) 
navigateToCode(state.currentIndex + 1);
        }
      });
  
    }
  
    function arrayBufferToBase64(buffer) {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 
chunk));
      }
      return btoa(binary);
    }
  
    async function waitForImages(rootEl) {
      const imgs = Array.from(rootEl.querySelectorAll('img'));
      await Promise.all(imgs.map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise(resolve => {
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
        });
      }));
    }
  
    async function exportarPDF() {
      if (!state.material) throw new Error('Primero carga un material o 
contenedor.');
      if (!window.electronAPI || typeof window.electronAPI.renderHtmlToPdf !== 
'function') {
        throw new Error('PDF nativo de Electron no estÃ¡ disponible.');
      }
  
      // Mostrar modal de espera
      document.getElementById('fe-modal-espera').style.display = 'flex';
  
      try {
  
      const fichaEl = document.getElementById('fe-ficha-print-area');
      const etiqEl = document.getElementById('fe-etiq-print-area');
      if (!fichaEl || !etiqEl) throw new Error('No se encontrÃ³ el Ã¡rea de 
exportaciÃ³n.');
  
      const fichaHtml = (fichaEl.innerHTML || '').trim();
      const etiqHtml = (etiqEl.innerHTML || '').trim();
      if (!fichaHtml && !etiqHtml) throw new Error('La ficha/etiquetas estÃ¡n 
vacÃas (no hay nada que exportar).');
  
      const codigo = String(state.material.codigo || 'material');
      const filename = `${codigo}-ficha-etiquetas.pdf`;
  
      // Tomar el src ABSOLUTO del logo tal cual estÃ¡ cargando bien en la UI
      // (en export PDF, el HTML va en data URL y las rutas relativas suelen 
romperse).
      const logoSrcAbs = (() => {
        try {
          const img = document.querySelector('img.fe-logo') || 
document.querySelector('img.fe-etiq-logo');
          const src = img && img.src ? String(img.src) : '';
          return src;
        } catch (_) {
          return '';
        }
      })();
  
      const normalizeLogoInHtml = (html) => {
        if (!logoSrcAbs) return html;
        const safe = logoSrcAbs.replace(/"/g, '&quot;');
        return String(html)
          .replaceAll('src="./assets/logo.png"', `src="${safe}"`)
          .replaceAll("src='./assets/logo.png'", `src='${safe}'`)
          .replaceAll('src="assets/logo.png"', `src="${safe}"`)
          .replaceAll("src='assets/logo.png'", `src='${safe}'`);
      };
  
      const fichaHtmlFixed = normalizeLogoInHtml(fichaHtml);
      const etiqHtmlFixed = normalizeLogoInHtml(etiqHtml);
  
      const cssText = Array.from(document.querySelectorAll('style'))
        .map(s => s.textContent || '')
        .join('\n');
  
      const baseHref = (() => {
        try {
          const href = String(window.location.href || '');
          return new URL('../../../', href).href;
        } catch (_) {
          try {
            const href = String(window.location.href || '');
            return href.replace(/[^/]*$/, '');
          } catch (_2) {
            return '';
          }
        }
      })();
  
      const htmlDoc = `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    ${baseHref ? `<base href="${baseHref}">` : ''}
    <style>
      ${cssText}
      html, body { margin: 0; padding: 0; background: white; }
  
      /* Override de impresiÃ³n para export PDF multi-pÃ¡gina:
         La app usa .fe-print-root fixed para impresiÃ³n â€œpor Ã¡reaâ€, pero 
eso rompe el flujo del PDF.
         En esta ventana de export solo existe nuestro contenido, asÃ que lo 
hacemos visible y estÃ¡tico. */
      @media print {
        body * { visibility: visible !important; }
        .fe-print-root { position: static !important; left: auto !important; 
top: auto !important; width: auto !important; }
      }
    </style>
  </head>
  <body>
    <div class="fe-print-root" style="padding: 10px;">
      ${fichaHtmlFixed}
      <div class="fe-pagebreak"></div>
      ${etiqHtmlFixed}
    </div>
  </body>
  </html>`;
  
      const res = await window.electronAPI.renderHtmlToPdf({ filename, html: 
htmlDoc, baseUrl: baseHref });
      if (res && res.canceled) return;
      if (res && res.filePath) {
        alert('âœ… PDF guardado: ' + res.filePath);
        return;
      }
      throw new Error('Error al generar el PDF');
      } finally {
        // Ocultar modal de espera
        document.getElementById('fe-modal-espera').style.display = 'none';
      }
    }
  
  
    async function exportarPNG(tipo, selectedCode) {
      if (!state.material) throw new Error('Primero carga un material o 
contenedor.');
      if (!window.html2canvas) throw new Error('html2canvas no estÃ¡ 
disponible.');
  
      let elementId, filename;
      if (tipo === 'ficha') {
        elementId = 'fe-ficha-print-area';
        filename = `${selectedCode}-ficha.png`;
      } else {
        elementId = 'fe-etiq-print-area';
        filename = `${selectedCode}-etiqueta.png`;
      }
  
      const el = document.getElementById(elementId);
      if (!el) throw new Error(`No se encontrÃ³ el Ã¡rea de ${tipo}.`);
  
      const html = (el.innerHTML || '').trim();
      if (!html) throw new Error(`La ${tipo} estÃ¡ vacÃa (no hay nada que 
exportar).`);
  
      try {
        // Capturar directamente el elemento visible
        const canvas = await window.html2canvas(el, {
          scale: 2, // Alta resoluciÃ³n
          useCORS: true,
          allowTaint: true,
          backgroundColor: 'white'
        });
  
        // Convertir a blob y descargar
        canvas.toBlob((blob) => {
          if (!blob) {
            alert('âŒ Error generando la imagen PNG.');
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          alert('âœ… PNG exportado correctamente.');
        }, 'image/png');
      } catch (error) {
        throw new Error('Error capturando la imagen: ' + error.message);
      }
    }
  
  
    async function cargarMaterial(codigo) {
      if (!supa) throw new Error('Supabase no estÃ¡ inicializado.');
  
      const { catalogo, movimientos, stock } = getActiveTables();
      const isConsumibles = (catalogo === 'catalogo_consumibles');
  
      // 1) CatÃ¡logo
      let data = null;
      try {
        const res = await supa
          .from(catalogo)
          // Nota: apodo/nombre_base/nombre_numero/contenedor ayudan a 
identificar contenedores
          // (p.ej. "CASE 02") y a deducir hijos/ubicaciÃ³n.
          // En consumibles, muchas de estas columnas NO existen; ahÃ usamos 
campos_personalizados.
          .select(isConsumibles
            ? 'codigo, nombre, bodega_principal, bodega_secundaria, tipo_uso, 
tipo_material, color, unidad_medida, dimensiones, es_hechizo, marca, modelo, 
foto_url, campos_personalizados'
            : 'codigo, nombre, apodo, nombre_base, nombre_numero, contenedor, 
bodega_principal, bodega_secundaria, tipo_uso, tipo_material, color, 
unidad_medida, dimensiones, es_hechizo, marca, modelo, foto_url, 
es_contenedor, tipo_alta, campos_personalizados')
          .eq('codigo', codigo)
          .maybeSingle();
        if (res.error) throw res.error;
        data = res.data;
      } catch (e1) {
        const msg = (e1?.message || '').toLowerCase();
        const missingCol = (msg.includes('does not exist') && (
          msg.includes('es_contenedor') ||
          msg.includes('tipo_alta') ||
          msg.includes('apodo') ||
          msg.includes('nombre_base') ||
          msg.includes('nombre_numero') ||
          msg.includes('contenedor')
        )) || e1?.code === '42703';
        if (!missingCol) throw e1;
  
        const res2 = await supa
          .from(catalogo)
          .select('codigo, nombre, bodega_principal, bodega_secundaria, 
tipo_uso, tipo_material, color, unidad_medida, dimensiones, es_hechizo, marca, 
modelo, foto_url, campos_personalizados')
          .eq('codigo', codigo)
          .maybeSingle();
        if (res2.error) throw res2.error;
        data = res2.data;
      }
  
      if (!data) throw new Error('No encontrado en catÃ¡logo.');
  
      const isContenedor = asBool(data.es_contenedor) || 
(normalizeTipoAlta(data.tipo_alta || data.campos_personalizados?.tipo_alta) 
=== 'CONTENEDOR');
  
      function computeContenedorKeys(row) {
        const r = row || {};
        const cp = (r && typeof r === 'object') ? (r.campos_personalizados || 
{}) : {};
  
        const nb = String(r.nombre_base || cp.nombre_base || '').trim();
        const nn = String(r.nombre_numero || cp.nombre_numero || '').trim();
        const c3 = `${nb} ${nn}`.trim();
  
        const keys = [
          String(r.codigo || '').trim(),
          String(r.contenedor || '').trim(),
          String(cp.contenedor || '').trim(),
          String(r.apodo || '').trim(),
          String(cp.apodo || '').trim(),
          (c3 && c3 !== '-') ? c3 : '',
          String(r.nombre || '').trim()
        ].filter(Boolean);
  
        // Ãºnicos, en orden
        return Array.from(new Set(keys));
      }
  
      // 2) Si es contenedor: traer hijos por el campo "contenedor" (llave del 
contenedor, p.ej "CASE 01").
      // Si NO es contenedor: deducir ubicaciÃ³n por RPC/Ãºltimo movimiento 
(comportamiento actual).
      let contenedor_nombre = '';
      let __contenedores_str = '';
      let stockTotal = 0;
      let hijos = [];
  
      if (isContenedor) {
        try {
          const contKeys = computeContenedorKeys(data);
          const selfCodigo = String(data.codigo || '');
  
          const hijosSelect = isConsumibles
            ? 'codigo, nombre, foto_url, bodega_principal, bodega_secundaria, 
campos_personalizados'
            : 'codigo, nombre, foto_url, bodega_principal, bodega_secundaria, 
es_contenedor, tipo_alta, campos_personalizados';
  
          let rows = [];
          for (const contKey of contKeys) {
            if (!contKey) continue;
  
            // En consumibles no existe columna "contenedor": vamos directo 
por JSON.
            let res;
            if (isConsumibles) {
              res = await supa
                .from(catalogo)
                .select(hijosSelect)
                .eq('campos_personalizados->>contenedor', contKey)
                .neq('codigo', selfCodigo)
                .order('codigo', { ascending: true })
                .limit(300);
              if (res.error) continue;
            } else {
              // 1) intentar por columna directa "contenedor"
              res = await supa
                .from(catalogo)
                .select(hijosSelect)
                .eq('contenedor', contKey)
                .neq('codigo', selfCodigo)
                .order('codigo', { ascending: true })
                .limit(300);
  
              // Si la columna no existe o falla, intentar por JSON
              if (res.error) {
                res = await supa
                  .from(catalogo)
                  .select(hijosSelect)
                  .eq('campos_personalizados->>contenedor', contKey)
                  .neq('codigo', selfCodigo)
                  .order('codigo', { ascending: true })
                  .limit(300);
              }
              if (res.error) continue;
            }
  
            rows = Array.isArray(res.data) ? res.data : [];
            if (rows.length) break;
          }
  
          // Fallback: si el catÃ¡logo no guarda "contenedor" en la fila del 
hijo,
          // intentamos deducir hijos por movimientos cuya ubicaciÃ³n coincide 
con este contenedor.
          if (!rows.length) {
            function stripConsecutivoPrefix(code) {
              return String(code || '').trim().toUpperCase().replace(/^\d+\-/, 
'');
            }
  
            const movCodes = new Set();
  
            for (const key of contKeys) {
              if (!key) continue;
              const rMov = await supa
                .from(movimientos)
                .select('material_codigo, ubicacion_nombre')
                .ilike('ubicacion_nombre', `%${key}%`)
                .limit(5000);
              if (rMov.error) continue;
              const movRows = Array.isArray(rMov.data) ? rMov.data : [];
              for (const m of movRows) {
                const mc = String(m?.material_codigo || '').trim();
                if (mc && mc !== selfCodigo) movCodes.add(mc);
              }
            }
  
            const parentBase = stripConsecutivoPrefix(selfCodigo);
            const allCodes = Array.from(movCodes);
            const apellidoFiltered = allCodes.filter((c) => {
              const childBase = stripConsecutivoPrefix(c);
              return parentBase && childBase && childBase !== parentBase && 
childBase.startsWith(parentBase + '-');
            });
  
            // Si el filtro por apellido aplica y devuelve algo, Ãºsalo.
            // Si no devuelve nada (por catÃ¡logos con otro esquema), cae al 
set original.
            const codes = (apellidoFiltered.length ? apellidoFiltered : 
allCodes).slice(0, 300);
  
            if (codes.length) {
              const rCat = await supa
                .from(catalogo)
                .select(hijosSelect)
                .in('codigo', codes)
                .order('codigo', { ascending: true });
              if (!rCat.error) rows = Array.isArray(rCat.data) ? rCat.data : 
[];
            }
          }
  
          hijos = rows.filter(r => normalizeTipoAlta(r?.tipo_alta || 
r?.campos_personalizados?.tipo_alta) !== 'CONTENEDOR');
        } catch (e) {
          // si falla la carga de hijos, dejar vacÃ­o
          hijos = [];
        }
  
        // Cargar stock para hijos
        if (hijos.length > 0) {
          try {
            const stockMap = {};
            for (const cod of hijosCodigos) {
              const { data: movRows, error: err } = await supa
                .from(movimientos)
                .select('cantidad')
                .eq('material_codigo', cod)
                .eq('tipo_movimiento', 'INGRESO');
              if (!err && movRows) {
                const sum = movRows.reduce((s, r) => s + 
(parseFloat(r.cantidad) || 0), 0);
                stockMap[cod] = sum;
              }
            }
            hijos = hijos.map(h => ({ ...h, __cantidad: stockMap[h.codigo] || 
0 }));
          } catch (e) {
            // si falla, dejar __cantidad como 0
          }
        }
  
        // Cantidad por hijo (por movimientos dentro de este contenedor)
        try {
          const contKey = computeContenedorKeys(data)[0] || '';
          const codes = hijos.map(h => String(h.codigo || 
'').trim()).filter(Boolean);
          if (!codes.length) {
            hijos = hijos.map(h => ({ ...h, __cantidad: 1 }));
          } else {
            const keysToTry = Array.from(new Set([
              contKey,
              String(data?.apodo || '').trim(),
              `${String(data?.nombre_base || '').trim()} 
${String(data?.nombre_numero || '').trim()}`.trim(),
              String(data?.nombre || '').trim()
            ].filter(Boolean)));
  
            async function fetchMovsByUbicacion(key) {
              // ilike sin % funciona como match case-insensitive (y tolera 
variaciones de mayÃºsculas)
              const r1 = await supa
                .from(movimientos)
                .select('material_codigo, cantidad, signo, ubicacion_nombre')
                .ilike('ubicacion_nombre', `%${key}%`)
                .in('material_codigo', codes)
                .limit(5000);
              if (r1.error) throw r1.error;
              return Array.isArray(r1.data) ? r1.data : [];
            }
  
            let movRows = [];
            for (const key of keysToTry) {
              movRows = await fetchMovsByUbicacion(key);
              if (movRows.length) break;
            }
  
            // Fallback: si no pudimos filtrar por ubicaciÃ³n (o no coincide), 
sumamos por material_codigo.
            // Esto cubre bien accesorios que entran con cantidad>1 en un solo 
movimiento.
            if (!movRows.length) {
              const rAny = await supa
                .from(movimientos)
                .select('material_codigo, cantidad, signo')
                .in('material_codigo', codes)
                .limit(8000);
              if (rAny.error) throw rAny.error;
              movRows = Array.isArray(rAny.data) ? rAny.data : [];
            }
  
            const qtyByCode = Object.create(null);
            movRows.forEach(r => {
              const c = String(r?.material_codigo || '').trim();
              if (!c) return;
              const qty = Number(r?.cantidad ?? 0);
              const sign = Number(r?.signo ?? 1);
              const delta = (isFinite(qty) ? qty : 0) * (isFinite(sign) ? sign 
: 1);
              qtyByCode[c] = (qtyByCode[c] || 0) + delta;
            });
  
            hijos = hijos.map(h => {
              const c = String(h.codigo || '').trim();
              let q = qtyByCode[c];
              if (!isFinite(q)) q = 1;
              const qOut = Number.isInteger(q) ? q : Math.round(q * 100) / 100;
              return { ...h, __cantidad: qOut };
            });
          }
        } catch (_) {
          // Si falla, mostramos 1 por defecto (hijos individuales)
          hijos = hijos.map(h => ({ ...h, __cantidad: 1 }));
        }
      }
      else {
        // Soporta multi-lote
        try {
          const { data: movRows, error: movErr } = await supa
            .from(movimientos)
            .select('ubicacion_nombre, cantidad')
            .eq('material_codigo', codigo)
            .eq('tipo_movimiento', 'INGRESO');
          if (movErr) throw movErr;
  
          // Agrupar por ubicacion_nombre y sumar cantidades
          const ubicaciones = {};
          (movRows || []).forEach(row => {
            const ubi = row.ubicacion_nombre || '';
            ubicaciones[ubi] = (ubicaciones[ubi] || 0) + 
(parseFloat(row.cantidad) || 0);
          });
          const rows = Object.entries(ubicaciones).map(([ubi, cant]) => ({ 
ubicacion_nombre: ubi, cantidad: cant }));
  
          __contenedores_str = buildContenedoresStr(rows);
          stockTotal = Array.isArray(rows) ? rows.reduce((sum, r) => sum + 
r.cantidad, 0) : 0;
          if (Array.isArray(rows) && rows.length === 1) {
            contenedor_nombre = (rows[0]?.ubicacion_nombre || '').toString();
          } else if (Array.isArray(rows) && rows.length > 1) {
            contenedor_nombre = 'Varios';
          }
        } catch (_) {
          // Fallback: deducir ubicaciÃ³n por el Ãºltimo movimiento 
(comportamiento actual)
          try {
            const { data: movs } = await supa
              .from(movimientos)
              .select('ubicacion_nombre')
              .eq('material_codigo', codigo)
              .order('fecha_movimiento', { ascending: false })
              .limit(1);
            contenedor_nombre = (movs && movs[0] && movs[0].ubicacion_nombre) 
? movs[0].ubicacion_nombre : '';
          } catch (_) {
            // si no existe columna o vista, lo ignoramos
          }
        }
      }
  
      const esHechizo = !!data.es_hechizo;
      const hoy = new Date().toLocaleDateString('es-NI');
      state.material = {
        ...data,
        __es_contenedor: isContenedor,
        contenedor_nombre,
        __contenedores_str,
        __stock_total: stockTotal,
        __dimensiones_str: buildDimensionesStr(data),
  
        __estado_str: esHechizo ? 'FabricaciÃ³n Local' : 'Original',
  
        __fecha_str: hoy
      };
      state.hijos = hijos;
      state.currentIndex = state.allCodes.indexOf(codigo);
      const positionStr = state.allCodes.length > 0 ? ` (${state.currentIndex 
+ 1}/${state.allCodes.length})` : '';
      document.getElementById('fe-status').textContent = isContenedor
        ? `âœ… Contenedor cargado: ${data.nombre} 
(${data.codigo})${positionStr} â€” Hijos: ${hijos.length}`
        : `âœ… Cargado: ${data.nombre} (${data.codigo})${positionStr}`;
      renderAll();
    }
  
    function imprimirArea(areaId) {
      const el = document.getElementById(areaId);
      if (!el) return;
  
      // Marcar como raÃ­z de impresiÃ³n
      document.querySelectorAll('.fe-print-root').forEach(n => 
n.classList.remove('fe-print-root'));
      el.classList.add('fe-print-root');
  
      window.print();
  
      // Limpieza (despuÃ©s de imprimir)
      setTimeout(() => {
        el.classList.remove('fe-print-root');
      }, 250);
    }
  
    async function loadAllCodes() {
      if (!supa) return;
      try {
        const bodega = getActiveBodega();
        const res = await supa
          .from(bodega.catalogo)
          .select('codigo')
          .order('codigo', { ascending: true });
        if (res.error) throw res.error;
        state.allCodes = (res.data || []).map(row => 
row.codigo).filter(Boolean);
      } catch (err) {
        console.error('Error loading all codes:', err);
        state.allCodes = [];
      }
    }
  
    function navigateToCode(index) {
      if (index < 0 || index >= state.allCodes.length) return;
      const codigo = state.allCodes[index];
      state.currentIndex = index;
      document.getElementById('fe-codigo-buscar').value = codigo;
      cargarMaterial(codigo).catch(err => {
        console.error(err);
        alert('âŒ No se pudo cargar: ' + (err.message || err));
      });
    }
  
    // Init
    state.bodegaKey = loadBodegaKey();
    state.buscarTipo = loadBuscarTipo();
    state.ficha = loadCfg(FICHA_KEY, DEFAULT_FICHA);
    state.etiq = loadCfg(ETIQ_KEY, DEFAULT_ETIQ);
    wireUI();
    setActiveBodega(state.bodegaKey, { persist: false, clearMaterial: true });
    renderAll();
    loadAllCodes();
  
  })();
  </script>
  


