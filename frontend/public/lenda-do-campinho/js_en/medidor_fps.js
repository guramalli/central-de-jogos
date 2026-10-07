/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📊 MEDIR DESEMPENHO (v410.4). O dono sente "pequenas travadas" em lutas, mas a gravação de tela não separa
   o que é do jogo e o que é do gravador (os dois disputam a placa de vídeo). Este medidor roda DENTRO do jogo,
   por 60 s, e mede: o intervalo real entre os quadros (o que a pessoa vê), o tempo que o código do jogo gasta por
   quadro, as "tarefas longas" do navegador e o que estava acontecendo (vitórias, mapa, janelas).
   No fim mostra um resumo com botão "Copiar" para colar na conversa. Fica em ⚙️ › 🖥️ Vídeo.
   Carregar no FIM (depois de limite_fps.js), para medir o laço inteiro.
   ============================================================ */
const MFP = { on: false };
function mfpComeca(seg = 60) {
  if (MFP.on) return;
  window.__MFP_ON = true; for (const k in (window.__MFP_AG || {})) delete window.__MFP_AG[k];
  Object.assign(MFP, { on: true, t0: performance.now(), dur: seg * 1000, ultimo: 0, inter: [], gasto: [], pain: 0, painMs: [], ultPain: false, aposPain: 0, longas: [], vitorias: [], mapas: new Set(), janelas: 0, quadrosJanela: 0 });
  try {
    MFP.obs = new PerformanceObserver(l => { for (const e of l.getEntries()) MFP.longas.push([e.startTime, e.duration]); });
    MFP.obs.observe({ type: 'longtask', buffered: false });
  } catch (e) { MFP.obs = null; }
  if (typeof log === 'function') log(`📊 Measuring performance for ${seg} s... play normally (fight, walk). The result shows up by itself.`, 'l-lvl');
  if (typeof fechaModal === 'function') try { fechaModal(); } catch (e) { }
}
{
  const _loopMf = loop;
  loop = function (ts) {
    if (!MFP.on) return _loopMf.apply(this, arguments);
    const a = performance.now(), antes = G.ult;
    const r = _loopMf.apply(this, arguments);
    if (G.ult !== antes) { // v410.5: quadro de verdade (com o limite de FPS, as chamadas puladas não contam)
      if (MFP.ultimo) { const iv = a - MFP.ultimo; MFP.inter.push(iv); if (iv > 33 && MFP.ultPain) MFP.aposPain++; } // (o quadro lento "paga" o redesenho da página do quadro anterior)
      MFP.ultimo = a; MFP.gasto.push(performance.now() - a); MFP.ultPain = MFP.pain > 0; MFP.pain = 0;
    }
    try { if (G.mapa) MFP.mapas.add(G.mapa.id); const m = document.getElementById('modal'); if (m && !m.hidden) MFP.quadrosJanela++; } catch (e) { }
    if (a - MFP.t0 >= MFP.dur) mfpTermina();
    return r;
  };
  const _apMf = atualizaPaineis; // v410.5: quantas vezes os painéis (mochila, barras, registro) foram refeitos
  atualizaPaineis = function () { if (!MFP.on) return _apMf.apply(this, arguments); const a = performance.now(); try { return _apMf.apply(this, arguments); } finally { MFP.pain++; MFP.painMs.push(performance.now() - a); } };
  const _matarMf = typeof matar === 'function' ? matar : null;
  if (_matarMf) matar = function () { if (MFP.on) MFP.vitorias.push(performance.now()); return _matarMf.apply(this, arguments); };
}
function mfpPct(arr, p) { if (!arr.length) return 0; const s = arr.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p / 100 * s.length))]; }
function mfpTermina() {
  MFP.on = false; window.__MFP_ON = false; try { MFP.obs && MFP.obs.disconnect(); } catch (e) { }
  const I = MFP.inter, Gt = MFP.gasto, n = I.length || 1, seg = (MFP.dur / 1000);
  const alvo = (typeof LFPS_MAX !== 'undefined' && LFPS_MAX > 0) ? 1000 / LFPS_MAX : mfpPct(I, 50);
  const eng = I.filter(x => x > Math.max(alvo * 1.8, 12)).length, eng33 = I.filter(x => x > 33).length, eng50 = I.filter(x => x > 50).length;
  // engasgos perto de uma vitória (até 300 ms depois)
  let t = MFP.t0, perto = 0; const tempos = []; for (const x of I) { t += x; tempos.push([t, x]); }
  for (const [tt, x] of tempos) if (x > 33 && MFP.vitorias.some(v => tt - v >= 0 && tt - v <= 300)) perto++;
  const longas = MFP.longas, somaLongas = longas.reduce((s, [, d]) => s + d, 0);
  const R = {
    'Average FPS': Math.round(1000 / (I.reduce((s, x) => s + x, 0) / n)),
    'FPS limit': (typeof LFPS_MAX !== 'undefined' && LFPS_MAX) ? LFPS_MAX : 'no limit',
    'Frames measured': I.length,
    'Typical interval (ms)': mfpPct(I, 50).toFixed(1),
    'Worst 1% (ms)': mfpPct(I, 99).toFixed(1),
    'Worst frame (ms)': Math.max(0, ...I).toFixed(1),
    'Hitches (frame ≥ 1.8× normal)': eng,
    'Frames > 33 ms': eng33,
    'Frames > 50 ms': eng50,
    'Game code per frame (ms): typical / worst 1% / worst': `${mfpPct(Gt, 50).toFixed(2)} / ${mfpPct(Gt, 99).toFixed(2)} / ${Math.max(0, ...Gt).toFixed(1)}`,
    'Browser long tasks': `${longas.length} (total ${Math.round(somaLongas)} ms)`,
    'Wins during the measurement': MFP.vitorias.length,
    'Frames > 33 ms right after a win': perto,
    'Frames with a window open': MFP.quadrosJanela,
    'Panels redrawn: times / typical / worst (ms)': `${MFP.painMs.length} / ${mfpPct(MFP.painMs, 50).toFixed(1)} / ${Math.max(0, ...MFP.painMs).toFixed(1)}`,
    'Frames > 33 ms right after redrawing the panels': MFP.aposPain,
    'Maps': [...MFP.mapas].join(', '),
    'Screen': `${innerWidth}×${innerHeight} · ${devicePixelRatio}x`,
  };
  const ag = Object.entries(window.__MFP_AG || {}).sort((x, y) => y[1].max - x[1].max).slice(0, 6);
  const fora = ag.length ? '\nOutside the frame (≥4 ms), the heaviest:\n' + ag.map(([k, v]) => `- ${k} → ${v.n}x, worst ${v.max.toFixed(1)} ms, total ${Math.round(v.total)} ms`).join('\n') : '\nOutside the frame: nothing went over 4 ms.';
  const txt = 'Lenda do Campinho — performance measurement (' + seg + ' s)\n' + Object.entries(R).map(([k, v]) => `${k}: ${v}`).join('\n') + fora;
  // leitura simples para o jogador
  const codigoPesa = mfpPct(Gt, 99) > alvo * 0.8;
  const veredito = eng33 <= 2 ? '✅ It\'s smooth: almost no frame went over time.' :
    codigoPesa ? '⚠️ The game code is heavy on some frames (send the result to the developer).' :
    '⚠️ The hitches don\'t come from the game code: probably the graphics card or another open program (try turning off "Effects and particles" or a lower FPS limit).';
  if (typeof abreModal === 'function' && typeof el === 'function') {
    const pre = el('pre', { style: 'white-space:pre-wrap;font-size:13px;max-height:52vh;overflow:auto;background:#fff8e6;padding:10px;border-radius:8px' }, txt);
    abreModal(el('h2', {}, '📊 Performance measurement'), el('p', {}, veredito), pre,
      el('div', { class: 'opcoes' },
        el('button', { class: 'btn amarelo', type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(txt); if (typeof avisoJogo === 'function') avisoJogo('Copied! Paste it in the chat.'); } catch (e) { const s = getSelection(); const r = document.createRange(); r.selectNodeContents(pre); s.removeAllRanges(); s.addRange(r); } } }, '📋 Copy result'),
        el('button', { class: 'btn', type: 'button', onclick: () => fechaModal() }, 'Close')));
  }
  try { console.log(txt); } catch (e) { }
}
