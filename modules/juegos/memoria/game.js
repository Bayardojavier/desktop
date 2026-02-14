// modules/juegos/memoria/game.js

(function () {
  const PAIRS = [
    { term: 'Bodega', def: 'Lugar físico donde se almacena inventario.' },
    { term: 'Kardex', def: 'Registro de movimientos de un producto.' },
    { term: 'Despacho', def: 'Salida de mercancía para entrega o traslado.' },
    { term: 'Stock', def: 'Cantidad disponible en existencia.' },
    { term: 'Consumible', def: 'Material que se gasta con el uso.' },
    { term: 'Factura', def: 'Documento que respalda una venta y cobro.' },
    { term: 'Truss', def: 'Estructura modular para colgar luces y pantallas.' },
    { term: 'Cuploc', def: 'Sistema modular de andamio/estructura para montaje.' },
    { term: 'ParLED', def: 'Luminaria LED tipo PAR para iluminación.' },
    { term: 'Cabeza móvil', def: 'Luminaria motorizada con movimientos.' },
    { term: 'Consola', def: 'Equipo para mezclar audio (mesa de sonido).' },
    { term: 'Micrófono', def: 'Convierte sonido en señal para amplificación.' },
    { term: 'Proyector', def: 'Equipo para proyectar imagen en una pantalla.' },
    { term: 'Switcher', def: 'Conmutador de señales de video (realización).' },
    { term: 'HDMI', def: 'Interfaz para transmitir audio y video digital.' },
    { term: 'SDI', def: 'Señal de video profesional por cable coaxial.' },
    { term: 'XLR', def: 'Conector típico de audio balanceado.' },
    { term: 'Montaje', def: 'Proceso de armar equipos y estructuras.' },
    { term: 'Desmontaje', def: 'Proceso de desarmar al finalizar el evento.' },
    { term: 'Escenario', def: 'Plataforma principal de un evento.' },
    { term: 'Backstage', def: 'Zona detrás del escenario para operación.' }
  ];

  const els = {
    grid: document.getElementById('mem-grid'),
    newBtn: document.getElementById('mem-new'),
    moves: document.getElementById('mem-moves'),
    pairs: document.getElementById('mem-pairs'),
    found: document.getElementById('mem-found'),
    msg: document.getElementById('mem-msg')
  };

  let deck = [];
  let open = [];
  let locked = false;
  let moves = 0;
  let matched = 0;

  function setMsg(text) {
    if (els.msg) els.msg.textContent = text || '';
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function updateMetrics() {
    if (els.moves) els.moves.textContent = String(moves);
    if (els.pairs) els.pairs.textContent = String(PAIRS.length);
    if (els.found) els.found.textContent = String(matched);
  }

  function buildDeck() {
    const cards = [];
    let id = 0;

    for (const p of PAIRS) {
      const pairId = `p${id++}`;
      cards.push({ pairId, type: 'Concepto', text: p.term });
      cards.push({ pairId, type: 'Definición', text: p.def });
    }

    deck = shuffle(cards);
  }

  function render() {
    if (!els.grid) return;

    els.grid.innerHTML = '';

    deck.forEach((card, idx) => {
      const div = document.createElement('div');
      div.className = 'card';
      div.setAttribute('data-idx', String(idx));

      const badge = document.createElement('div');
      badge.className = 'card-type';
      badge.textContent = card.type;

      const text = document.createElement('div');
      text.className = 'card-text';
      text.textContent = '¿?';

      div.appendChild(badge);
      div.appendChild(text);

      div.addEventListener('click', () => onPick(idx));
      els.grid.appendChild(div);
    });
  }

  function flipUp(idx) {
    const cardEl = els.grid?.querySelector(`.card[data-idx="${idx}"]`);
    if (!cardEl) return;

    const card = deck[idx];
    cardEl.classList.add('faceup');

    const text = cardEl.querySelector('.card-text');
    if (text) text.textContent = card.text;
  }

  function flipDown(idx) {
    const cardEl = els.grid?.querySelector(`.card[data-idx="${idx}"]`);
    if (!cardEl) return;

    cardEl.classList.remove('faceup');

    const text = cardEl.querySelector('.card-text');
    if (text) text.textContent = '¿?';
  }

  function markMatched(a, b) {
    [a, b].forEach(idx => {
      const cardEl = els.grid?.querySelector(`.card[data-idx="${idx}"]`);
      cardEl?.classList.add('matched');
    });
  }

  function isMatched(idx) {
    const cardEl = els.grid?.querySelector(`.card[data-idx="${idx}"]`);
    return !!cardEl?.classList.contains('matched');
  }

  function onPick(idx) {
    if (locked) return;
    if (open.includes(idx)) return;
    if (isMatched(idx)) return;

    flipUp(idx);
    open.push(idx);

    if (open.length < 2) return;

    moves += 1;
    updateMetrics();

    const [a, b] = open;
    const ca = deck[a];
    const cb = deck[b];

    if (ca.pairId === cb.pairId && ca.type !== cb.type) {
      // match
      markMatched(a, b);
      open = [];
      matched += 1;
      updateMetrics();
      setMsg('✅ ¡Pareja encontrada!');

      if (matched === PAIRS.length) {
        setMsg(`🏁 ¡Completado! Movimientos: ${moves}.`);
      }
      return;
    }

    // mismatch
    locked = true;
    setMsg('❌ No coincide.');
    setTimeout(() => {
      flipDown(a);
      flipDown(b);
      open = [];
      locked = false;
      setMsg('');
    }, 700);
  }

  function newGame() {
    open = [];
    locked = false;
    moves = 0;
    matched = 0;

    buildDeck();
    render();
    updateMetrics();
    setMsg('');
  }

  function wire() {
    els.newBtn?.addEventListener('click', newGame);
  }

  wire();
  newGame();

  window.__JUEGOS_CLEANUP__ = () => {
    // timers del mismatch se limpian por sí solos; no global listeners
  };
})();
