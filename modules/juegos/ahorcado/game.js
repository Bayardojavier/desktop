// modules/juegos/ahorcado/game.js

(function () {
  const GAME_ID = 'ahorcado';
  const TOPICS = {
    inventario: [
      { word: 'BODEGA', hint: 'Lugar donde se almacena mercancía.' },
      { word: 'INVENTARIO', hint: 'Registro de existencias.' },
      { word: 'KARDEX', hint: 'Control de entradas y salidas.' },
      { word: 'CONTEO', hint: 'Proceso para verificar cantidades físicas.' },
      { word: 'UBICACION', hint: 'Zona/estante donde se coloca un producto.' },
      { word: 'CONSUMIBLE', hint: 'Material que se gasta con el uso.' },
      { word: 'ETIQUETA', hint: 'Identificador impreso para un producto.' },
      { word: 'CODIGO', hint: 'Identificador de un item o material.' },
      { word: 'TRAZABILIDAD', hint: 'Capacidad de seguir el historial de un producto.' },
      { word: 'REPOSICION', hint: 'Acción de reabastecer existencias.' },
      { word: 'MINIMO', hint: 'Nivel mínimo permitido de stock.' },
      { word: 'MAXIMO', hint: 'Nivel máximo recomendado de stock.' },
      { word: 'Lote', hint: 'Grupo de productos con características comunes.' }
    ],
    logistica: [
      { word: 'DESPACHO', hint: 'Salida de productos hacia un destino.' },
      { word: 'RUTA', hint: 'Camino o recorrido de entrega.' },
      { word: 'FLETE', hint: 'Costo asociado al transporte.' },
      { word: 'ENTREGA', hint: 'Acción de llevar al cliente su pedido.' },
      { word: 'PAQUETE', hint: 'Unidad embalada para transporte.' },
      { word: 'GUIA', hint: 'Documento de transporte o referencia de envío.' },
      { word: 'BULTOS', hint: 'Unidades físicas transportadas.' },
      { word: 'DESTINO', hint: 'Lugar de entrega.' },
      { word: 'CARGA', hint: 'Mercancía que se transporta.' },
      { word: 'DESCARGA', hint: 'Acción de bajar mercancía.' }
    ],
    ventas: [
      { word: 'COTIZACION', hint: 'Propuesta de precio antes de vender.' },
      { word: 'FACTURA', hint: 'Documento de cobro/venta.' },
      { word: 'CLIENTE', hint: 'Persona o empresa que compra.' },
      { word: 'DESCUENTO', hint: 'Reducción del precio.' },
      { word: 'COMISION', hint: 'Pago por ventas logradas.' },
      { word: 'RECIBO', hint: 'Comprobante de pago.' },
      { word: 'CREDITO', hint: 'Venta con pago diferido.' },
      { word: 'COBRO', hint: 'Acción de solicitar pago.' },
      { word: 'MARGEN', hint: 'Diferencia entre costo y precio.' }
    ],
    eventos: [
      { word: 'EVENTO', hint: 'Actividad planificada con montaje y operación.' },
      { word: 'MONTAJE', hint: 'Proceso de armar estructura y equipos.' },
      { word: 'DESMONTAJE', hint: 'Proceso de desarmar al finalizar.' },
      { word: 'ESCENARIO', hint: 'Plataforma principal donde ocurre el show.' },
      { word: 'BACKSTAGE', hint: 'Zona detrás del escenario.' },
      { word: 'CRONOGRAMA', hint: 'Plan de tiempos de un evento.' },
      { word: 'BRIEFING', hint: 'Reunión rápida de coordinación.' },
      { word: 'SEGURIDAD', hint: 'Medidas para evitar riesgos.' },
      { word: 'ACCESO', hint: 'Entrada o control de ingreso.' },
      { word: 'PRODUCCION', hint: 'Organización y ejecución del evento.' }
    ],
    audiovisual: [
      { word: 'AUDIOVISUAL', hint: 'Área que integra audio y video.' },
      { word: 'PROYECTOR', hint: 'Equipo que proyecta imagen.' },
      { word: 'PANTALLA', hint: 'Superficie para mostrar proyección.' },
      { word: 'CAMARA', hint: 'Equipo para capturar video.' },
      { word: 'TRIPODE', hint: 'Soporte de cámara de tres patas.' },
      { word: 'MICROFONO', hint: 'Convierte sonido en señal.' },
      { word: 'CONSOLA', hint: 'Mesa para mezclar audio.' },
      { word: 'ALTAVOZ', hint: 'Equipo que reproduce sonido.' },
      { word: 'PARLED', hint: 'Luminaria LED tipo PAR.' },
      { word: 'CABEZAMOVIL', hint: 'Luminaria motorizada (moving head).' },
      { word: 'SWITCHER', hint: 'Conmutador de señales de video.' },
      { word: 'HDMI', hint: 'Interfaz común para video/sonido digital.' },
      { word: 'SDI', hint: 'Señal de video profesional por coaxial.' },
      { word: 'XLR', hint: 'Conector balanceado típico de audio.' }
    ],
    estructuras: [
      { word: 'TRUSS', hint: 'Estructura modular para luces y pantallas.' },
      { word: 'CUPLOC', hint: 'Sistema modular de andamio/estructura.' },
      { word: 'ANDAMIO', hint: 'Estructura temporal de trabajo en altura.' },
      { word: 'ABRAZADERA', hint: 'Pieza para fijar tubos/estructura.' },
      { word: 'ESLINGA', hint: 'Elemento para izaje o amarre.' },
      { word: 'GRILLETE', hint: 'Conector metálico en forma de U.' },
      { word: 'PASADOR', hint: 'Pieza que asegura uniones.' },
      { word: 'BASEPLATE', hint: 'Base de apoyo para postes.' },
      { word: 'PLATAFORMA', hint: 'Superficie modular para tarimas.' },
      { word: 'NIVELADOR', hint: 'Permite ajustar altura y estabilidad.' }
    ],
    general: [
      { word: 'CALIDAD', hint: 'Cumplimiento de estándares.' },
      { word: 'PROCESO', hint: 'Conjunto de pasos para lograr algo.' },
      { word: 'SEGURIDAD', hint: 'Prevención de riesgos.' },
      { word: 'EQUIPO', hint: 'Personas que trabajan juntas.' },
      { word: 'MEJORA', hint: 'Hacer algo mejor con el tiempo.' },
      { word: 'CAPACITACION', hint: 'Aprendizaje para mejorar habilidades.' },
      { word: 'COORDINACION', hint: 'Trabajo organizado entre áreas.' },
      { word: 'RESPONSABILIDAD', hint: 'Compromiso con tareas y resultados.' }
    ]
  };

  const ALPHABET = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
  const MAX_FAILS = 6;
  const SESSION_START_SECONDS = 120;
  const TIME_BONUS_SECONDS = 60;
  const SCORE_PER_WIN = 10;

  const els = {
    newBtn: document.getElementById('hangman-new'),
    drawing: document.getElementById('hangman-drawing'),
    fails: document.getElementById('hangman-fails'),
    time: document.getElementById('hangman-time'),
    score: document.getElementById('hangman-score'),
    streak: document.getElementById('hangman-streak'),
    bestScore: document.getElementById('hangman-best-score'),
    elapsed: document.getElementById('hangman-elapsed'),
    lastSolve: document.getElementById('hangman-last-solve'),
    bestSolve: document.getElementById('hangman-best-solve'),
    word: document.getElementById('hangman-word'),
    hint: document.getElementById('hangman-hint'),
    kbd: document.getElementById('hangman-kbd'),
    msg: document.getElementById('hangman-msg')
  };

  let current = null;
  let guessed = new Set();
  let failCount = 0;
  let tryCount = 0;
  let ended = false;
  let locked = false;

  let score = 0;
  let streak = 0;
  let bestScore = 0;
  let elapsedSeconds = 0;
  let lastSolveSeconds = null;
  let bestSolveSeconds = null;

  let timer = null;
  let remaining = SESSION_START_SECONDS;
  let wordStartRemaining = SESSION_START_SECONDS;

  let deck = [];
  let deckIndex = 0;

  function lsKey(suffix) {
    return `juegos.${GAME_ID}.${suffix}`;
  }

  function loadPersisted() {
    bestScore = Number(localStorage.getItem(lsKey('bestScore')) || 0) || 0;
    score = Number(localStorage.getItem(lsKey('lastScore')) || 0) || 0;
    streak = Number(localStorage.getItem(lsKey('lastStreak')) || 0) || 0;
    const rawBestSolve = localStorage.getItem(lsKey('bestSolveSeconds'));
    bestSolveSeconds = rawBestSolve === null ? null : Number(rawBestSolve);
    if (Number.isNaN(bestSolveSeconds)) bestSolveSeconds = null;
  }

  function persist() {
    localStorage.setItem(lsKey('bestScore'), String(bestScore));
    localStorage.setItem(lsKey('lastScore'), String(score));
    localStorage.setItem(lsKey('lastStreak'), String(streak));
    localStorage.setItem(lsKey('bestSolveSeconds'), bestSolveSeconds === null ? '' : String(bestSolveSeconds));
  }

  function flash(el) {
    if (!el) return;
    el.classList.remove('record-hit');
    // force reflow
    void el.offsetWidth;
    el.classList.add('record-hit');
    setTimeout(() => el.classList.remove('record-hit'), 750);
  }

  function renderScoreboard() {
    if (els.bestScore) els.bestScore.textContent = String(bestScore || 0);
    if (els.elapsed) els.elapsed.textContent = `${Math.max(0, elapsedSeconds)}s`;
    if (els.lastSolve) els.lastSolve.textContent = lastSolveSeconds === null ? '—' : `${Math.max(0, lastSolveSeconds)}s`;
    if (els.bestSolve) els.bestSolve.textContent = bestSolveSeconds === null ? '—' : `${Math.max(0, bestSolveSeconds)}s`;
  }

  function normalizeLetter(ch) {
    return String(ch || '')
      .toUpperCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^A-ZÑ]/g, '');
  }

  function getDrawing(fails) {
    const f = Math.max(0, Math.min(MAX_FAILS, Number(fails || 0)));
    const on = n => (f >= n ? 'on' : '');
    const stroke = f >= 5 ? '#fb7185' : '#e5e7eb';
    const wood = '#cbd5e1';
    const rope = '#fbbf24';
    const ground = 'rgba(148,163,184,.35)';

    return `
      <svg viewBox="0 0 360 260" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="hmShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,.45)"/>
          </filter>
          <linearGradient id="hmBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="rgba(15,23,42,.35)"/>
            <stop offset="1" stop-color="rgba(2,6,23,.15)"/>
          </linearGradient>
        </defs>

        <rect x="8" y="8" width="344" height="244" rx="16" fill="url(#hmBg)" stroke="rgba(148,163,184,.22)"/>
        <path d="M60 226H300" stroke="${ground}" stroke-width="3" stroke-linecap="round"/>

        <!-- Gallows -->
        <g filter="url(#hmShadow)">
          <path d="M95 226V55" stroke="${wood}" stroke-width="10" stroke-linecap="round"/>
          <path d="M92 55H228" stroke="${wood}" stroke-width="10" stroke-linecap="round"/>
          <path d="M220 55V80" stroke="${wood}" stroke-width="10" stroke-linecap="round"/>
          <path d="M95 85L132 55" stroke="rgba(148,163,184,.55)" stroke-width="6" stroke-linecap="round"/>
        </g>

        <!-- Rope -->
        <path d="M220 80V102" stroke="${rope}" stroke-width="5" stroke-linecap="round"/>
        <circle cx="220" cy="106" r="4" fill="${rope}"/>

        <!-- Person (parts appear with fails) -->
        <g stroke="${stroke}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none">
          <circle class="hm-part ${on(1)}" cx="220" cy="128" r="18"/>
          <path class="hm-part ${on(2)}" d="M220 146V188"/>
          <path class="hm-part ${on(3)}" d="M220 160L194 176"/>
          <path class="hm-part ${on(4)}" d="M220 160L246 176"/>
          <path class="hm-part ${on(5)}" d="M220 188L198 214"/>
          <path class="hm-part ${on(6)}" d="M220 188L242 214"/>
        </g>

        <!-- Face when close to lose -->
        <g class="hm-part ${f >= 5 ? 'on' : ''}" stroke="${stroke}" stroke-width="3" stroke-linecap="round">
          <path d="M213 124l-4 4"/>
          <path d="M209 124l4 4"/>
          <path d="M227 124l-4 4"/>
          <path d="M223 124l4 4"/>
          <path d="M212 138c5 4 11 4 16 0"/>
        </g>
      </svg>
    `;
  }

  function normalizeWord(raw) {
    const upper = String(raw || '').toUpperCase().trim();
    // Aceptar palabras con espacios (ej: "MESA DE AUDIO")
    return upper.replace(/\s+/g, ' ');
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildDeck() {
    const items = [];
    for (const [topic, list] of Object.entries(TOPICS)) {
      for (const item of list || []) {
        const word = normalizeWord(item.word);
        if (!word) continue;
        items.push({ topic, word, hint: String(item.hint || '') });
      }
    }
    deck = shuffle(items);
    deckIndex = 0;
  }

  function pickWord() {
    if (!deck || deck.length === 0) buildDeck();
    if (deckIndex >= deck.length) buildDeck();
    const item = deck[deckIndex++];
    return { word: item.word, hint: item.hint, topic: item.topic };
  }

  function renderTimer() {
    if (els.time) els.time.textContent = String(Math.max(0, remaining));
  }

  function renderScore() {
    if (els.score) els.score.textContent = String(score);
    if (els.streak) els.streak.textContent = String(streak);
    renderScoreboard();
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function startTimer(reset) {
    if (reset) {
      remaining = SESSION_START_SECONDS;
      wordStartRemaining = remaining;
      elapsedSeconds = 0;
      renderTimer();
      renderScoreboard();
    }

    if (timer) return;

    timer = setInterval(() => {
      if (ended) return;
      remaining -= 1;
      elapsedSeconds += 1;
      renderTimer();
      renderScoreboard();
      if (remaining <= 0) {
        stopTimer();
        endGame(false, '⏱️ Tiempo terminado.');
      }
    }, 1000);
  }

  function computeWon() {
    if (!current) return false;
    const letters = Array.from(current.word);
    return letters.every(ch => ch === ' ' || guessed.has(ch));
  }

  function renderWord() {
    if (!els.word || !current) return;

    const html = Array.from(current.word)
      .map(ch => {
        if (ch === ' ') return '<span class="hangman-letter" style="border-bottom:none;min-width:10px"> </span>';
        const visible = guessed.has(ch) || ended || locked;
        return `<span class="hangman-letter">${visible ? ch : '&nbsp;'}</span>`;
      })
      .join('');

    els.word.innerHTML = html;
  }

  function renderKeyboard() {
    if (!els.kbd) return;

    els.kbd.innerHTML = '';
    for (const letter of ALPHABET) {
      const btn = document.createElement('div');
      btn.className = 'key';
      btn.textContent = letter;

      if (guessed.has(letter) || ended || locked) {
        btn.classList.add('disabled');
        if (guessed.has(letter)) {
          btn.classList.add(current.word.includes(letter) ? 'good' : 'bad');
        }
      }

      btn.addEventListener('click', () => guess(letter));
      els.kbd.appendChild(btn);
    }
  }

  function renderStats() {
    if (els.fails) els.fails.textContent = String(failCount) + ' / ' + MAX_FAILS;
    if (els.drawing) els.drawing.innerHTML = getDrawing(failCount);
    if (els.hint && current) els.hint.textContent = 'PISTA: ' + current.hint;
    renderTimer();
    renderScore();
  }

  function setMessage(text) {
    if (els.msg) els.msg.textContent = text || '';
  }

  async function maybeSyncBestToSupabase() {
    try {
      const supa = window.supabaseClient;
      if (!supa) return;

      const usuario_id = window.currentUser?.id || localStorage.getItem('usuario_id');
      const usuario_nombre = window.currentUser?.nombre || localStorage.getItem('usuario_nombre');
      if (!usuario_id) return;

      const { data: existing, error: selError } = await supa
        .from('juegos_records')
        .select('score')
        .eq('juego', GAME_ID)
        .eq('usuario_id', String(usuario_id))
        .maybeSingle();

      if (selError) return;
      if (existing && Number(existing.score || 0) >= bestScore) return;

      await supa
        .from('juegos_records')
        .upsert(
          {
            juego: GAME_ID,
            usuario_id: String(usuario_id),
            usuario_nombre: usuario_nombre ? String(usuario_nombre) : null,
            score: bestScore
          },
          { onConflict: 'juego,usuario_id' }
        );
    } catch {
      // silencioso (offline / sin permisos)
    }
  }

  function awardScore(won, timeSpentSeconds) {
    if (won) {
      const spent = Math.max(0, Number(timeSpentSeconds || 0));
      const speedBonus = Math.max(0, TIME_BONUS_SECONDS - spent);
      score += SCORE_PER_WIN + Math.floor(speedBonus / 3);
      streak += 1;
    } else {
      streak = 0;
    }

    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem(lsKey('bestScore'), String(bestScore));
      flash(els.bestScore);
      void maybeSyncBestToSupabase();
    }
  }

  function endGame(won, reasonText) {
    ended = true;
    locked = false;
    stopTimer();
    renderWord();
    renderKeyboard();

    awardScore(!!won, 0);
    persist();
    renderScore();

    if (won) return setMessage('✅ ¡Correcto! +Puntos');
    setMessage(reasonText || '❌ Se terminaron los intentos.');
  }

  function handleWin() {
    locked = true;
    renderWord();
    renderKeyboard();

    const timeSpent = Math.max(0, wordStartRemaining - remaining);
    lastSolveSeconds = timeSpent;
    if (bestSolveSeconds === null || timeSpent < bestSolveSeconds) {
      bestSolveSeconds = timeSpent;
      flash(els.bestSolve);
    }
    awardScore(true, timeSpent);

    remaining += TIME_BONUS_SECONDS;
    renderTimer();
    persist();
    renderScore();

    flash(els.lastSolve);

    setMessage(`✅ ¡Correcto! +${TIME_BONUS_SECONDS}s`);

    setTimeout(() => {
      if (ended) return;
      locked = false;
      newWord(false);
    }, 650);
  }

  function guess(raw) {
    if (!current || ended || locked) return;

    const letter = normalizeLetter(raw);
    if (!letter || letter.length !== 1) return;
    if (!ALPHABET.includes(letter)) return;
    if (guessed.has(letter)) return;

    guessed.add(letter);
    tryCount += 1;

    if (!current.word.includes(letter)) {
      failCount += 1;
    }

    renderStats();
    renderWord();
    renderKeyboard();

    const won = computeWon();
    if (won) return handleWin();
    if (failCount >= MAX_FAILS) return endGame(false);

    setMessage('');
  }

  function newWord(resetTimer) {
    current = pickWord();
    guessed = new Set();
    failCount = 0;
    tryCount = 0;
    ended = false;
    locked = false;

    startTimer(!!resetTimer);
    wordStartRemaining = remaining;

    renderStats();
    renderWord();
    renderKeyboard();
    setMessage('');
  }

  function newGame() {
    // Si la sesión terminó, reinicia a 120s. Si no, solo cambia de palabra.
    const resetTimer = ended || !timer;
    if (resetTimer) stopTimer();
    newWord(resetTimer);
  }

  function onKeyDown(e) {
    if (!e) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    guess(e.key);
  }

  function wire() {
    els.newBtn?.addEventListener('click', newGame);
    document.addEventListener('keydown', onKeyDown);
  }

  function cleanup() {
    // No-op: los listeners los limpiaremos con __JUEGOS_CLEANUP__
  }

  wire();
  loadPersisted();
  renderScore();
  newWord(true);

  window.__JUEGOS_CLEANUP__ = () => {
    document.removeEventListener('keydown', onKeyDown);
    stopTimer();
  };
})();
