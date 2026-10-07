/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📊 MEDIDOR — parte que carrega PRIMEIRO (v410.5). A medição do dono mostrou que o código do quadro é leve
   (pior 1% = 3 ms), mas houve 6 "tarefas longas" de ~54 ms FORA do quadro. Para dar nome a elas, este arquivo
   cronometra cada cronômetro (setTimeout/setInterval/requestIdleCallback) e cada evento (teclado, rede, socket)
   — mas só guarda algo enquanto a medição está ligada (window.__MFP_ON). Fora da medição custa ~nada.
   ============================================================ */
(function () {
  const AG = {}; window.__MFP_AG = AG; window.__MFP_ON = false;
  const rotulo = (fn, tipo) => {
    let s = fn && fn.name ? fn.name : '';
    if (!s && fn) { try { s = String(fn).replace(/\s+/g, ' ').slice(0, 70); } catch (e) { s = '?'; } }
    return tipo + ': ' + (s || '?');
  };
  const anota = (fn, tipo, ms) => {
    if (ms < 4) return; // só o que pesa
    const k = rotulo(fn, tipo), a = AG[k] || (AG[k] = { n: 0, total: 0, max: 0 });
    a.n++; a.total += ms; if (ms > a.max) a.max = ms;
    if (window.__MFP_MARCA) window.__MFP_MARCA(k, ms); // (v410.6: marca no quadro, para a lista dos piores)
  };
  const embrulha = (fn, tipo) => function () {
    if (!window.__MFP_ON) return fn.apply(this, arguments);
    const t = performance.now();
    try { return fn.apply(this, arguments); } finally { anota(fn, tipo, performance.now() - t); }
  };
  for (const [nome, tipo] of [['setTimeout', 'timer'], ['setInterval', 'repetidor'], ['requestIdleCallback', 'folga']]) {
    const orig = window[nome]; if (typeof orig !== 'function') continue;
    window[nome] = function (fn, ...r) { return orig.call(this, typeof fn === 'function' ? embrulha(fn, tipo) : fn, ...r); };
  }
  // eventos (teclado, mouse, rede, WebSocket do online): mapa para o removeEventListener continuar funcionando
  const mapa = new WeakMap(), addO = EventTarget.prototype.addEventListener, remO = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.addEventListener = function (tipo, fn, op) {
    if (typeof fn !== 'function') return addO.call(this, tipo, fn, op);
    let w = mapa.get(fn); if (!w) { w = embrulha(fn, 'evento ' + tipo); mapa.set(fn, w); }
    return addO.call(this, tipo, w, op);
  };
  EventTarget.prototype.removeEventListener = function (tipo, fn, op) { return remO.call(this, tipo, (typeof fn === 'function' && mapa.get(fn)) || fn, op); };
})();
