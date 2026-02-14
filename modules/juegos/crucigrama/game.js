// modules/juegos/crucigrama/game.js

(function () {
  // Cuadrícula 9x9 (row, col: 0..8). Usamos un crucigrama pequeño predefinido.
  // Palabras:
  // H1 (1): BODEGA   en fila 1 col 1..6
  // H2 (2): RUTA     en fila 3 col 2..5
  // H3 (3): FACTURA  en fila 5 col 1..7
  // V1 (4): STOCK    en col 4 fila 1..5
  // V2 (5): COSTO    en col 6 fila 1..4
  // V3 (6): KARDEX   en col 2 fila 3..8

  const SIZE = 9;

  const PUZZLES = [
    {
      id: 'inventario',
      title: 'Inventario (básico)',
      h: [
        { num: 1, row: 1, col: 1, answer: 'BODEGA', clue: 'Lugar donde se almacena mercancía.' },
        { num: 2, row: 3, col: 2, answer: 'RUTA', clue: 'Recorrido de entrega o despacho.' },
        { num: 3, row: 5, col: 1, answer: 'FACTURA', clue: 'Documento que respalda una venta.' }
      ],
      v: [
        { num: 4, row: 1, col: 4, answer: 'STOCK', clue: 'Existencia disponible de un producto.' },
        { num: 5, row: 1, col: 6, answer: 'COSTO', clue: 'Valor o gasto asociado a un producto.' },
        { num: 6, row: 3, col: 2, answer: 'KARDEX', clue: 'Control de entradas y salidas.' }
      ]
    },
    {
      id: 'eventos-audiovisual',
      title: 'Eventos / Audiovisual',
      h: [
        { num: 1, row: 1, col: 1, answer: 'TRUSS', clue: 'Estructura modular para colgar equipos.' },
        { num: 2, row: 3, col: 3, answer: 'LUCES', clue: 'Iluminación de un montaje.' },
        { num: 3, row: 5, col: 3, answer: 'CAMARA', clue: 'Equipo para capturar video.' }
      ],
      v: [
        { num: 4, row: 0, col: 3, answer: 'CUPLOC', clue: 'Sistema modular de andamio/estructura.' }
      ]
    }
  ];

  const els = {
    board: document.getElementById('cw-board'),
    cluesH: document.getElementById('cw-clues-h'),
    cluesV: document.getElementById('cw-clues-v'),
    status: document.getElementById('cw-status'),
    puzzle: document.getElementById('cw-puzzle'),
    newBtn: document.getElementById('cw-new'),
    check: document.getElementById('cw-check'),
    reset: document.getElementById('cw-reset')
  };

  const expected = new Map(); // key "r,c" -> letter
  const numbers = new Map(); // key -> num
  const inputs = new Map(); // key -> input element

  let activeKey = null;

  function keyOf(r, c) {
    return `${r},${c}`;
  }

  function setStatus(text) {
    if (els.status) els.status.textContent = text;
  }

  function normalizeLetter(ch) {
    return String(ch || '')
      .toUpperCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^A-ZÑ]/g, '');
  }

  let activePuzzleIndex = 0;

  function getActivePuzzle() {
    return PUZZLES[Math.max(0, Math.min(activePuzzleIndex, PUZZLES.length - 1))];
  }

  function buildExpected() {
    expected.clear();
    numbers.clear();

    const puzzle = getActivePuzzle();

    for (const w of puzzle.h) {
      numbers.set(keyOf(w.row, w.col), w.num);
      for (let i = 0; i < w.answer.length; i++) {
        expected.set(keyOf(w.row, w.col + i), w.answer[i]);
      }
    }

    for (const w of puzzle.v) {
      numbers.set(keyOf(w.row, w.col), w.num);
      for (let i = 0; i < w.answer.length; i++) {
        expected.set(keyOf(w.row + i, w.col), w.answer[i]);
      }
    }
  }

  function renderClues() {
    const puzzle = getActivePuzzle();
    if (els.cluesH) els.cluesH.innerHTML = puzzle.h.map(w => `<li><strong>${w.num}.</strong> ${w.clue}</li>`).join('');
    if (els.cluesV) els.cluesV.innerHTML = puzzle.v.map(w => `<li><strong>${w.num}.</strong> ${w.clue}</li>`).join('');
  }

  function clearActive() {
    els.board?.querySelectorAll('.cell.active').forEach(c => c.classList.remove('active'));
  }

  function setActive(r, c) {
    const k = keyOf(r, c);
    if (!inputs.has(k)) return;

    activeKey = k;
    clearActive();
    const cell = inputs.get(k)?.closest('.cell');
    if (cell) cell.classList.add('active');
    inputs.get(k)?.focus();
  }

  function moveNext(r, c) {
    // Avanza hacia la derecha; si no hay, baja.
    for (let rr = r; rr < SIZE; rr++) {
      for (let cc = rr === r ? c + 1 : 0; cc < SIZE; cc++) {
        const k = keyOf(rr, cc);
        if (inputs.has(k)) return setActive(rr, cc);
      }
    }
  }

  function movePrev(r, c) {
    for (let rr = r; rr >= 0; rr--) {
      for (let cc = rr === r ? c - 1 : SIZE - 1; cc >= 0; cc--) {
        const k = keyOf(rr, cc);
        if (inputs.has(k)) return setActive(rr, cc);
      }
    }
  }

  function onCellInput(r, c, e) {
    const input = e.target;
    const ch = normalizeLetter(input.value).slice(0, 1);
    input.value = ch;

    if (ch) moveNext(r, c);
  }

  function onCellKeyDown(r, c, e) {
    if (e.key === 'Backspace') {
      const input = e.target;
      if (input.value) return; // borra dentro del mismo
      e.preventDefault();
      movePrev(r, c);
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveNext(r, c);
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      movePrev(r, c);
    }
  }

  function renderBoard() {
    if (!els.board) return;
    inputs.clear();

    els.board.innerHTML = '';

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const k = keyOf(r, c);
        const isPlayable = expected.has(k);

        const cell = document.createElement('div');
        cell.className = 'cell' + (isPlayable ? '' : ' block');

        if (isPlayable) {
          const input = document.createElement('input');
          input.maxLength = 1;
          input.autocomplete = 'off';
          input.spellcheck = false;

          input.addEventListener('input', (e) => onCellInput(r, c, e));
          input.addEventListener('keydown', (e) => onCellKeyDown(r, c, e));
          input.addEventListener('focus', () => setActive(r, c));

          const n = numbers.get(k);
          if (n) {
            const num = document.createElement('div');
            num.className = 'cell-num';
            num.textContent = String(n);
            cell.appendChild(num);
          }

          cell.appendChild(input);
          inputs.set(k, input);
        }

        els.board.appendChild(cell);
      }
    }

    // Activar primer celda
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (inputs.has(keyOf(r, c))) {
          setActive(r, c);
          return;
        }
      }
    }
  }

  function resetBoard() {
    els.board?.querySelectorAll('.cell').forEach(cell => {
      cell.classList.remove('good', 'bad');
    });
    inputs.forEach(i => (i.value = ''));
    setStatus('Reiniciado.');

    // focus first
    const first = inputs.keys().next().value;
    if (first) {
      const [r, c] = first.split(',').map(Number);
      setActive(r, c);
    }
  }

  function loadPuzzle(index) {
    activePuzzleIndex = Math.max(0, Math.min(index, PUZZLES.length - 1));

    if (els.puzzle) {
      els.puzzle.value = String(activePuzzleIndex);
    }

    buildExpected();
    renderClues();
    renderBoard();
    resetBoard();
    setStatus(`Crucigrama: ${getActivePuzzle().title}`);
  }

  function loadRandomPuzzle() {
    const next = Math.floor(Math.random() * PUZZLES.length);
    loadPuzzle(next);
  }

  function checkBoard() {
    let filled = 0;
    let correct = 0;

    inputs.forEach((input, k) => {
      const exp = expected.get(k);
      const got = normalizeLetter(input.value).slice(0, 1);
      const cell = input.closest('.cell');
      cell?.classList.remove('good', 'bad');

      if (got) {
        filled++;
        if (got === exp) {
          correct++;
          cell?.classList.add('good');
        } else {
          cell?.classList.add('bad');
        }
      }
    });

    const total = inputs.size;
    if (filled === 0) {
      setStatus('Escribe algunas letras primero.');
      return;
    }

    if (correct === total && filled === total) {
      setStatus('✅ ¡Crucigrama completo!');
    } else {
      setStatus(`Progreso: ${correct}/${total} correctas (llenadas ${filled}/${total}).`);
    }
  }

  function wire() {
    els.check?.addEventListener('click', checkBoard);
    els.reset?.addEventListener('click', resetBoard);
    els.newBtn?.addEventListener('click', loadRandomPuzzle);
    els.puzzle?.addEventListener('change', () => {
      const idx = Number(els.puzzle.value || 0);
      loadPuzzle(idx);
    });

    // Click en tablero para activar celda
    els.board?.addEventListener('click', (e) => {
      const input = e.target?.closest('input');
      if (input) input.focus();
    });
  }

  wire();
  loadPuzzle(0);

  window.__JUEGOS_CLEANUP__ = () => {
    // no listeners globales que limpiar
  };
})();
