// modules/juegos/matematicas/game.js

(function () {
  const DURATION_SECONDS = 60;
  const BASE_URL = 'modules/juegos/matematicas/base.json';

  const CORE_ITEMS = [
    'Lona 10x10',
    'Truss Ancha 6 mts',
    'Truss Ancha 3 mts',
    'Truss delgadas 6 mts',
    'Truss delgadas 3 mts',
    'Dados 50x50',
    'Pernos 24',
    'Pernos 19',
    'Bridas Tipo U',
    'Cruzados',
    'Esquineros',
    'Caidas',
    'Ruff/ Caballete'
  ];

  const MAT_PRETTY = {
    'Truss Ancha 6 mts': 'truss ancha de 6 mts',
    'Truss Ancha 3 mts': 'truss ancha de 3 mts',
    'Truss delgadas 6 mts': 'truss delgada de 6 mts',
    'Truss delgadas 3 mts': 'truss delgada de 3 mts',
    'Dados 50x50': 'dados 50x50',
    'Dados 30x30': 'dados 30x30',
    'Dados de 45x45': 'dados 45x45',
    'Bridas Tipo U': 'bridas tipo U',
    'Pernos 24': 'pernos #24',
    'Pernos 19': 'pernos #19',
    'Lona 10x10': 'lona 10x10'
  };

  const els = {
    diff: document.getElementById('mq-diff'),
    mode: document.getElementById('mq-mode'),
    start: document.getElementById('mq-start'),
    stop: document.getElementById('mq-stop'),
    time: document.getElementById('mq-time'),
    score: document.getElementById('mq-score'),
    streak: document.getElementById('mq-streak'),
    problem: document.getElementById('mq-problem'),
    input: document.getElementById('mq-input'),
    submit: document.getElementById('mq-submit'),
    msg: document.getElementById('mq-msg')
  };

  let timer = null;
  let remaining = DURATION_SECONDS;
  let score = 0;
  let streak = 0;
  let currentAnswer = null;
  let baseRows = null;
  let basePromise = null;
  let runToken = 0;

  function setMsg(text) {
    if (els.msg) els.msg.textContent = text || '';
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pickWeighted(options) {
    // options: [{ value, w }]
    const list = Array.isArray(options) ? options.filter(o => o && o.w > 0) : [];
    if (!list.length) return null;
    const total = list.reduce((acc, o) => acc + o.w, 0);
    let r = Math.random() * total;
    for (const o of list) {
      r -= o.w;
      if (r <= 0) return o.value;
    }
    return list[list.length - 1].value;
  }

  function ensureBaseLoaded() {
    if (baseRows) return Promise.resolve(baseRows);
    if (basePromise) return basePromise;

    basePromise = fetch(BASE_URL)
      .then(res => {
        if (!res.ok) throw new Error('No se pudo cargar la base de despiece');
        return res.json();
      })
      .then(json => {
        baseRows = Array.isArray(json?.rows) ? json.rows : [];
        if (!baseRows.length) throw new Error('Base vacía');
        return baseRows;
      })
      .catch(err => {
        basePromise = null;
        throw err;
      });

    return basePromise;
  }

  function pickRow(diff) {
    const list = Array.isArray(baseRows) ? baseRows : [];
    if (!list.length) return null;

    const maxSide = r => Math.max(Number(r?.ancho || 0), Number(r?.largo || 0));
    let candidates = list;

    if (diff === 1) {
      candidates = list.filter(r => maxSide(r) <= 20);
    } else if (diff === 2) {
      candidates = list.filter(r => maxSide(r) <= 40);
    }

    if (!candidates.length) candidates = list;
    return candidates[randInt(0, candidates.length - 1)];
  }

  function pickItemList(row) {
    const items = row?.items && typeof row.items === 'object' ? row.items : {};
    return Object.entries(items)
      .map(([k, v]) => {
        const n = typeof v === 'number' ? v : Number(v);
        return [String(k), Number.isFinite(n) ? n : null];
      })
      .filter(([, v]) => v !== null && v > 0);
  }

  function getDadoType(row) {
    const tipo = String(row?.tipo || '');
    const medidas = String(row?.medidas || '');
    const s = `${tipo} ${medidas}`.toLowerCase();
    if (s.includes('corredizo')) return 'corredizo';
    if (s.includes('fijo')) return 'fijo';
    return null;
  }

  function formatSizeLabel(row) {
    // Extrae solo el 10x10 de "10x10 Dado Fijo" o "10x10 Dado Corredizo 50"
    const medidas = row?.medidas ? String(row.medidas).trim() : '';
    const m = medidas.match(/(\d+\s*x\s*\d+)/i);
    if (m) return m[1].replace(/\s*/g, '');

    const hasSize = [row?.ancho, row?.largo].every(x => Number.isFinite(Number(x)));
    if (hasSize) return `${Number(row.ancho)}x${Number(row.largo)}`;

    return '';
  }

  function fmtMat(mat, row) {
    const pretty = String(MAT_PRETTY[mat] || mat);
    // Si el material es "Dados ...", especificar fijo/corredizo según la fila.
    if (/^dados\b/i.test(String(mat))) {
      const tipo = getDadoType(row);
      const size = String(mat).match(/(\d+\s*x\s*\d+)/i)?.[1]?.replace(/\s*/g, '') || '';
      if (tipo) return size ? `dado ${tipo} ${size}` : `dado ${tipo}`;
    }
    return pretty;
  }

  function fmtTecho(ctxLabel) {
    return ctxLabel ? `techo ${ctxLabel}` : 'techo';
  }

  function fmtNTechos(n, ctxLabel) {
    return ctxLabel ? `${n} techos ${ctxLabel}` : `${n} techos`;
  }

  function pickItem(items, { preferCore = true } = {}) {
    if (!Array.isArray(items) || !items.length) return null;
    const coreSet = new Set(CORE_ITEMS);
    const weighted = items.map(([mat, qty]) => {
      const isCore = coreSet.has(mat);
      const w = (preferCore && isCore ? 6 : 1) + (qty >= 8 ? 1 : 0);
      return { value: [mat, qty], w };
    });
    return pickWeighted(weighted);
  }

  function pickDistinct(items, count) {
    const pool = items.slice();
    const out = [];
    while (pool.length && out.length < count) {
      const picked = pickItem(pool, { preferCore: true });
      if (!picked) break;
      out.push(picked);
      const idx = pool.findIndex(([m]) => m === picked[0]);
      if (idx >= 0) pool.splice(idx, 1);
    }
    return out;
  }

  function structuresCountForDiff(diff) {
    if (diff === 1) return randInt(1, 2);
    if (diff === 2) return randInt(2, 3);
    return randInt(2, 4);
  }

  function buildQuestion(diff, row) {
    const ctxLabel = formatSizeLabel(row);
    const techo = fmtTecho(ctxLabel);
    const items = pickItemList(row);
    if (!items.length) return null;

    // NOTA: para que sea “alcanzable”, el enunciado incluye los números base.
    // El jugador calcula (multiplica/suma/resta), no adivina el despiece.

    const n = structuresCountForDiff(diff);
    const nTechos = fmtNTechos(n, ctxLabel);
    const dadoType = getDadoType(row);
    const dado = dadoType ? ` con dado ${dadoType}` : '';

    // Pesos simples duplicando entradas (más variedad sin hacer preguntas largas)
    const typePool = [];
    if (items.length >= 1) {
      // directas de 1 techo salen mucho
      typePool.push('one', 'one');
      typePool.push('multi', 'multi', 'multi');
      typePool.push('faltan');
      if (diff >= 2) typePool.push('sobran');
      if (diff >= 2) typePool.push('alcanza');
    }
    if (items.length >= 2) typePool.push('sum2');

    const chosenType = typePool[randInt(0, typePool.length - 1)] || 'multi';

    if (chosenType === 'one') {
      const one = pickItem(items, { preferCore: true }) || items[0];
      if (!one) return null;
      const [mat0, qty] = one;
      const mat = fmtMat(mat0, row);
      const templates = [
        () => `Un ${techo}${dado}: ¿cuántas ${mat} necesita?`,
        () => `Para un ${techo}${dado}, ¿cuántas ${mat} se usan?`,
        () => `En un ${techo}${dado}, ¿cuántas ${mat} van?`,
        () => `¿Cuántas ${mat} lleva un ${techo}${dado}?`
      ];
      const tt = templates[randInt(0, templates.length - 1)];
      return { text: tt(), answer: qty };
    }

    if (chosenType === 'sum2') {
      const picked = pickDistinct(items, 2);
      if (picked.length < 2) return null;
      const [aMat0, aQty] = picked[0];
      const [bMat0, bQty] = picked[1];
      const aMat = fmtMat(aMat0, row);
      const bMat = fmtMat(bMat0, row);
      const total = (aQty + bQty) * n;
      const templates = [
        () => `Para ${nTechos}${dado}: por 1 ${techo} se usa ${aQty} ${aMat} y ${bQty} ${bMat}. ¿Total combinado?`,
        () => `${nTechos}${dado}. Por ${techo}: ${aMat}=${aQty} y ${bMat}=${bQty}. ¿Total de ambos materiales?`,
        () => `Vas a armar ${nTechos}${dado}. Por techo: ${aQty} ${aMat} + ${bQty} ${bMat}. ¿Total?`
      ];
      const tt = templates[randInt(0, templates.length - 1)];
      return { text: tt(), answer: total };
    }

    const one = pickItem(items, { preferCore: true }) || items[0];
    if (!one) return null;
    const [mat0, qty] = one;
    const mat = fmtMat(mat0, row);

    if (chosenType === 'faltan') {
      const required = qty * n;
      const have = required <= 1 ? 0 : randInt(0, required - 1);
      const templates = [
        () => `Si tienes ${have} ${mat} y para ${nTechos}${dado} necesitas ${required}, ¿cuántas te faltan?`,
        () => `${nTechos}${dado}: necesito ${required} ${mat}. Tengo ${have}. ¿Faltan cuántas?`,
        () => `Para ${nTechos}${dado} se ocupan ${required} ${mat}. Con ${have} en bodega, ¿cuántas faltan?`
      ];
      const tt = templates[randInt(0, templates.length - 1)];
      return { text: tt(), answer: required - have };
    }

    if (chosenType === 'sobran') {
      const required = qty * n;
      const extra = randInt(1, Math.max(2, qty));
      const have = required + extra;
      const templates = [
        () => `Para ${nTechos}${dado} necesitas ${required} ${mat}. Si tienes ${have}, ¿cuántas sobran?`,
        () => `${nTechos}${dado}: necesito ${required} ${mat}. Tengo ${have}. ¿Sobran cuántas?`,
        () => `En bodega hay ${have} ${mat}. Para ${nTechos}${dado} se ocupan ${required}. ¿Cuántas sobran?`
      ];
      const tt = templates[randInt(0, templates.length - 1)];
      return { text: tt(), answer: have - required };
    }

    if (chosenType === 'alcanza') {
      const k = randInt(1, diff >= 3 ? 5 : 4);
      const have = qty * k;
      const templates = [
        () => `Si tienes ${have} ${mat} y un ${techo}${dado} usa ${qty}, ¿para cuántos techos te alcanza?`,
        () => `Tengo ${have} ${mat}. Si por ${techo}${dado} se usan ${qty}, ¿cuántos techos puedo armar?`,
        () => `Con ${have} ${mat} y ${qty} por ${techo}${dado}, ¿para cuántos techos alcanza?`
      ];
      const tt = templates[randInt(0, templates.length - 1)];
      return { text: tt(), answer: k };
    }

    // multi (multiplicación simple)
    {
      const total = qty * n;
      const templates = [
        () => `Vas a armar ${nTechos}${dado}. Si un ${techo} usa ${qty} ${mat}, ¿cuántas necesitas en total?`,
        () => `Para ${nTechos}${dado}: ${qty} ${mat} por techo. ¿Total?`,
        () => `${nTechos}${dado}. ${qty} ${mat} por techo. ¿Cuántas ocupas?`,
        () => `Si montas ${nTechos}${dado} y por techo van ${qty} ${mat}, ¿cuál es el total?`
      ];
      const tt = templates[randInt(0, templates.length - 1)];
      return { text: tt(), answer: total };
    }
  }

  function newProblem() {
    const diff = Number(els.diff?.value || 1);
    const row = pickRow(diff);
    const q = row ? buildQuestion(diff, row) : null;

    if (!q) {
      currentAnswer = null;
      if (els.problem) els.problem.textContent = 'No hay base cargada.';
      setMsg('No se pudo generar el ejercicio.');
      return;
    }

    currentAnswer = q.answer;
    if (els.problem) els.problem.textContent = q.text;

    if (els.input) {
      els.input.value = '';
      els.input.focus();
    }

    setMsg('');
  }

  function setRunning(running) {
    els.start && (els.start.disabled = running);
    els.stop && (els.stop.disabled = !running);
    els.input && (els.input.disabled = !running);
    els.submit && (els.submit.disabled = !running);
  }

  function tick() {
    remaining -= 1;
    if (els.time) els.time.textContent = String(remaining);

    if (remaining <= 0) {
      stopGame();
      setMsg(`⏱️ Tiempo. Puntos: ${score}.`);
    }
  }

  function startGame() {
    stopGame();
    const token = ++runToken;

    remaining = DURATION_SECONDS;
    score = 0;
    streak = 0;
    currentAnswer = null;

    if (els.time) els.time.textContent = String(remaining);
    if (els.score) els.score.textContent = String(score);
    if (els.streak) els.streak.textContent = String(streak);

    setRunning(true);
    setMsg('Cargando base…');
    if (els.problem) els.problem.textContent = 'Preparando ejercicio…';

    void ensureBaseLoaded()
      .then(() => {
        if (token !== runToken) return;
        setMsg('');
        newProblem();
        timer = setInterval(tick, 1000);
      })
      .catch(() => {
        if (token !== runToken) return;
        setRunning(false);
        currentAnswer = null;
        if (els.problem) els.problem.textContent = 'No se pudo cargar la base.';
        setMsg('Revisa que exista base.json/base.xlsx.');
      });
  }

  function stopGame() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    setRunning(false);

    if (els.problem) els.problem.textContent = 'Presiona Iniciar';
    currentAnswer = null;
    runToken += 1;
  }

  function submit() {
    if (currentAnswer === null) return;

    const raw = String(els.input?.value || '').trim();
    const got = raw === '' ? null : Number(raw);
    if (got === null || Number.isNaN(got)) {
      setMsg('Escribe un número.');
      return;
    }

    if (got === currentAnswer) {
      streak += 1;
      const gained = 10 + Math.max(0, streak - 1) * 2;
      score += gained;

      if (els.score) els.score.textContent = String(score);
      if (els.streak) els.streak.textContent = String(streak);

      setMsg(`✅ Correcto (+${gained})`);
      newProblem();
    } else {
      streak = 0;
      if (els.streak) els.streak.textContent = String(streak);
      setMsg('❌ Incorrecto. Intenta el siguiente.');
      newProblem();
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  }

  function wire() {
    els.start?.addEventListener('click', startGame);
    els.stop?.addEventListener('click', stopGame);
    els.submit?.addEventListener('click', submit);
    els.input?.addEventListener('keydown', onKeyDown);
  }

  wire();
  setRunning(false);

  window.__JUEGOS_CLEANUP__ = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    // listeners locales se pierden al reemplazar el DOM del juego
  };
})();
