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
  Object.assign(MFP, { on: true, t0: performance.now(), dur: seg * 1000, ultimo: 0, inter: [], gasto: [], longas: [], vitorias: [], mapas: new Set(), janelas: 0, quadrosJanela: 0 });
  try {
    MFP.obs = new PerformanceObserver(l => { for (const e of l.getEntries()) MFP.longas.push([e.startTime, e.duration]); });
    MFP.obs.observe({ type: 'longtask', buffered: false });
  } catch (e) { MFP.obs = null; }
  if (typeof log === 'function') log(`📊 Medindo o desempenho por ${seg} s... jogue normalmente (lute, ande). O resultado aparece sozinho.`, 'l-lvl');
  if (typeof fechaModal === 'function') try { fechaModal(); } catch (e) { }
}
{
  const _loopMf = loop;
  loop = function (ts) {
    if (!MFP.on) return _loopMf.apply(this, arguments);
    const a = performance.now();
    if (MFP.ultimo) MFP.inter.push(a - MFP.ultimo);
    MFP.ultimo = a;
    const r = _loopMf.apply(this, arguments);
    MFP.gasto.push(performance.now() - a);
    try { if (G.mapa) MFP.mapas.add(G.mapa.id); const m = document.getElementById('modal'); if (m && !m.hidden) MFP.quadrosJanela++; } catch (e) { }
    if (a - MFP.t0 >= MFP.dur) mfpTermina();
    return r;
  };
  const _matarMf = typeof matar === 'function' ? matar : null;
  if (_matarMf) matar = function () { if (MFP.on) MFP.vitorias.push(performance.now()); return _matarMf.apply(this, arguments); };
}
function mfpPct(arr, p) { if (!arr.length) return 0; const s = arr.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p / 100 * s.length))]; }
function mfpTermina() {
  MFP.on = false; try { MFP.obs && MFP.obs.disconnect(); } catch (e) { }
  const I = MFP.inter, Gt = MFP.gasto, n = I.length || 1, seg = (MFP.dur / 1000);
  const alvo = (typeof LFPS_MAX !== 'undefined' && LFPS_MAX > 0) ? 1000 / LFPS_MAX : mfpPct(I, 50);
  const eng = I.filter(x => x > Math.max(alvo * 1.8, 12)).length, eng33 = I.filter(x => x > 33).length, eng50 = I.filter(x => x > 50).length;
  // engasgos perto de uma vitória (até 300 ms depois)
  let t = MFP.t0, perto = 0; const tempos = []; for (const x of I) { t += x; tempos.push([t, x]); }
  for (const [tt, x] of tempos) if (x > 33 && MFP.vitorias.some(v => tt - v >= 0 && tt - v <= 300)) perto++;
  const longas = MFP.longas, somaLongas = longas.reduce((s, [, d]) => s + d, 0);
  const R = {
    'FPS médio': Math.round(1000 / (I.reduce((s, x) => s + x, 0) / n)),
    'Limite de FPS': (typeof LFPS_MAX !== 'undefined' && LFPS_MAX) ? LFPS_MAX : 'sem limite',
    'Quadros medidos': I.length,
    'Intervalo típico (ms)': mfpPct(I, 50).toFixed(1),
    'Pior 1% (ms)': mfpPct(I, 99).toFixed(1),
    'Pior quadro (ms)': Math.max(0, ...I).toFixed(1),
    'Engasgos (quadro ≥ 1,8× o normal)': eng,
    'Quadros > 33 ms': eng33,
    'Quadros > 50 ms': eng50,
    'Código do jogo por quadro (ms): típico / pior 1% / pior': `${mfpPct(Gt, 50).toFixed(2)} / ${mfpPct(Gt, 99).toFixed(2)} / ${Math.max(0, ...Gt).toFixed(1)}`,
    'Tarefas longas do navegador': `${longas.length} (somando ${Math.round(somaLongas)} ms)`,
    'Vitórias durante a medição': MFP.vitorias.length,
    'Quadros > 33 ms logo depois de uma vitória': perto,
    'Quadros com janela aberta': MFP.quadrosJanela,
    'Mapas': [...MFP.mapas].join(', '),
    'Tela': `${innerWidth}×${innerHeight} · ${devicePixelRatio}x`,
  };
  const txt = 'Lenda do Campinho — medição de desempenho (' + seg + ' s)\n' + Object.entries(R).map(([k, v]) => `${k}: ${v}`).join('\n');
  // leitura simples para o jogador
  const codigoPesa = mfpPct(Gt, 99) > alvo * 0.8;
  const veredito = eng33 <= 2 ? '✅ Está liso: quase nenhum quadro passou do tempo.' :
    codigoPesa ? '⚠️ O código do jogo está pesando em alguns quadros (mande o resultado para o desenvolvedor).' :
    '⚠️ Os engasgos não vêm do código do jogo: provavelmente a placa de vídeo ou outro programa aberto (tente "Efeitos e partículas" desligado ou um limite de FPS menor).';
  if (typeof abreModal === 'function' && typeof el === 'function') {
    const pre = el('pre', { style: 'white-space:pre-wrap;font-size:13px;max-height:52vh;overflow:auto;background:#fff8e6;padding:10px;border-radius:8px' }, txt);
    abreModal(el('h2', {}, '📊 Medição de desempenho'), el('p', {}, veredito), pre,
      el('div', { class: 'opcoes' },
        el('button', { class: 'btn amarelo', type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(txt); if (typeof avisoJogo === 'function') avisoJogo('Copiado! Cole na conversa.'); } catch (e) { const s = getSelection(); const r = document.createRange(); r.selectNodeContents(pre); s.removeAllRanges(); s.addRange(r); } } }, '📋 Copiar resultado'),
        el('button', { class: 'btn', type: 'button', onclick: () => fechaModal() }, 'Fechar')));
  }
  try { console.log(txt); } catch (e) { }
}
