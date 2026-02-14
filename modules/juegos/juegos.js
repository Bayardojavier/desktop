// modules/juegos/juegos.js

(function () {
  const GAMES = {
    ahorcado: {
      title: 'Ahorcado',
      description: 'Adivina palabras con pistas (temas de negocio e inventario).',
      tags: ['Lenguaje', 'Vocabulario'],
      folder: 'modules/juegos/ahorcado',
      icon: 'hangman'
    },
    crucigrama: {
      title: 'Crucigrama',
      description: 'Crucigrama corto y guiado para practicar conceptos.',
      tags: ['Ortografía', 'Conceptos'],
      folder: 'modules/juegos/crucigrama',
      icon: 'crossword'
    },
    matematicas: {
      title: 'Cálculo de Trusses',
      description: 'Calcula cuántas trusses de 6m necesitas para armar cuadrantes de diferentes tamaños.',
      tags: ['Cálculo', 'Trusses'],
      folder: 'modules/juegos/matematicas',
      icon: 'math'
    },
    memoria: {
      title: 'Memoria',
      description: 'Empareja conceptos con definiciones (modo educativo).',
      tags: ['Atención', 'Aprendizaje'],
      folder: 'modules/juegos/memoria',
      icon: 'cards'
    }
  };

  let currentGameId = null;

  function el(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function cleanupPreviousGameAssets() {
    // Script del juego anterior
    document.getElementById('juegos-game-script')?.remove();

    // CSS del juego anterior
    document.getElementById('juegos-game-style')?.remove();

    // Limpiar timers / listeners globales si algún juego los dejó
    window.__JUEGOS_CLEANUP__?.();
    window.__JUEGOS_CLEANUP__ = null;
  }

  function iconSvg(kind) {
    // SVGs simples (sin dependencias)
    const common = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
    if (kind === 'hangman') {
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M4 20h16"/><path ${common} d="M6 20V5h8l2 2v3"/><path ${common} d="M16 10a4 4 0 1 1-8 0"/><path ${common} d="M12 14v4"/></svg>`;
    }
    if (kind === 'crossword') {
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M4 4h16v16H4z"/><path ${common} d="M4 10h16"/><path ${common} d="M4 16h16"/><path ${common} d="M10 4v16"/><path ${common} d="M16 4v16"/></svg>`;
    }
    if (kind === 'math') {
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M6 4h12v16H6z"/><path ${common} d="M8.5 8h7"/><path ${common} d="M9 12h6"/><path ${common} d="M9 16h6"/></svg>`;
    }
    if (kind === 'cards') {
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M7 7h11v14H7z"/><path ${common} d="M6 5h11v2"/><path ${common} d="M9.5 11h2"/><path ${common} d="M12.5 11h2"/></svg>`;
    }
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M4 12h16"/></svg>`;
  }

  function renderTopGameNav() {
    const nav = el('juegos-game-nav');
    if (!nav) return;

    nav.innerHTML = Object.entries(GAMES)
      .map(([gameId, game]) => {
        const active = currentGameId === gameId ? 'active' : '';
        return `
          <button
            class="juegos-game-btn ${active}"
            type="button"
            data-switch-game="${escapeHtml(gameId)}"
            title="${escapeHtml(game.title)}"
            aria-label="Ir a ${escapeHtml(game.title)}"
          >${iconSvg(game.icon)}</button>
        `;
      })
      .join('');

    nav.querySelectorAll('button[data-switch-game]').forEach(btn => {
      btn.addEventListener('click', () => {
        const nextId = btn.getAttribute('data-switch-game');
        if (!nextId) return;
        loadGame(nextId);
      });
    });
  }

  function renderDashboard() {
    currentGameId = null;
    renderTopGameNav();

    const view = el('juegos-view');
    if (!view) return;

    const cards = Object.entries(GAMES)
      .map(([gameId, game]) => {
        const tags = (game.tags || []).map(t => `<span>${escapeHtml(t)}</span>`).join(' ');
        const icon = iconSvg(game.icon);
        return `
          <div class="juegos-card">
            <div class="juegos-tag">🧩 ${tags}</div>
            <h3>${escapeHtml(game.title)}</h3>
            <p>${escapeHtml(game.description)}</p>
            <div class="juegos-open">
              <button class="juegos-open-btn" data-juego="${escapeHtml(gameId)}" title="Abrir" aria-label="Abrir ${escapeHtml(game.title)}">
                <span class="juegos-open-figure" aria-hidden="true">${icon}</span>
                <span class="juegos-open-label">Abrir</span>
              </button>
            </div>
          </div>
        `;
      })
      .join('');

    view.innerHTML = `
      <div class="juegos-view-header">
        <h3 class="juegos-view-title">Dashboard</h3>
        <p class="juegos-muted">Elige un juego para abrirlo.</p>
      </div>
      <div class="juegos-sep"></div>
      <div class="juegos-grid">${cards}</div>
    `;

    view.querySelectorAll('button[data-juego]').forEach(btn => {
      btn.addEventListener('click', () => {
        loadGame(btn.getAttribute('data-juego'));
      });
    });
  }

  async function loadGame(gameId) {
    const game = GAMES[gameId];
    if (!game) return;

    cleanupPreviousGameAssets();
    currentGameId = gameId;
    renderTopGameNav();

    const view = el('juegos-view');
    if (!view) return;

    view.innerHTML = `
      <div class="juegos-view-header">
        <h3 class="juegos-view-title"><span class="juegos-title-icon" aria-hidden="true">${iconSvg(game.icon)}</span>${escapeHtml(game.title)}</h3>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="juegos-btn icon" id="juegos-back" title="Dashboard" aria-label="Dashboard">🏠</button>
          <button class="juegos-btn icon" id="juegos-reload" title="Reiniciar" aria-label="Reiniciar">↻</button>
        </div>
      </div>
      <p class="juegos-muted">${escapeHtml(game.description)}</p>
      <div class="juegos-sep"></div>
      <div id="juegos-game-container"></div>
    `;

    el('juegos-back')?.addEventListener('click', renderDashboard);
    el('juegos-reload')?.addEventListener('click', () => loadGame(gameId));

    try {
      // 1) HTML
      const htmlRes = await fetch(`${game.folder}/index.html`);
      if (!htmlRes.ok) throw new Error('No se encontró el HTML del juego');
      const html = await htmlRes.text();
      const container = el('juegos-game-container');
      if (!container) return;
      container.innerHTML = html;

      // 2) CSS (opcional)
      const cssRes = await fetch(`${game.folder}/style.css`);
      if (cssRes.ok) {
        const css = await cssRes.text();
        const style = document.createElement('style');
        style.id = 'juegos-game-style';
        style.textContent = css;
        document.head.appendChild(style);
      }

      // 3) JS
      const script = document.createElement('script');
      script.id = 'juegos-game-script';
      script.src = `${game.folder}/game.js`;
      document.body.appendChild(script);
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      view.innerHTML = `<div class="juegos-error">❌ Error al cargar el juego: ${escapeHtml(msg)}</div>`;
    }
  }

  function loadRandomGame() {
    const ids = Object.keys(GAMES);
    if (!ids.length) return;
    const pick = ids[Math.floor(Math.random() * ids.length)];
    loadGame(pick);
  }

  function wireTopbar() {
    el('juegos-btn-dashboard')?.addEventListener('click', renderDashboard);
    el('juegos-btn-random')?.addEventListener('click', loadRandomGame);
    renderTopGameNav();
  }

  function init() {
    wireTopbar();
    renderDashboard();
  }

  init();
})();
