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
  window.__MFP_ON = true; window.__MFP_MARCA = (k, ms) => { if (MFP.on) MFP.tag.add(k.slice(0, 60) + ' ' + ms.toFixed(0) + ' ms'); }; for (const k in (window.__MFP_AG || {})) delete window.__MFP_AG[k];
  Object.assign(MFP, { on: true, t0: performance.now(), dur: seg * 1000, ultimo: 0, inter: [], gasto: [], pain: 0, painMs: [], ultPain: false, aposPain: 0, tag: new Set(), piores: [], modalAntes: false, mapaUlt: G.mapa && G.mapa.id, longas: [], vitorias: [], mapas: new Set(), janelas: 0, quadrosJanela: 0, partesAnt: null, partesTot: {} });
  mfpInstalaPartes(); // v411.2: tempo por parte (chão, bonecos, efeitos...) — só durante a medição
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
    const a = performance.now(), antes = G.ult;
    MFPP.cur = {}; mfpMapa(); const prev = MFP.tag; MFP.tag = new Set(); // v410.6: o que aconteceu desde o quadro anterior (o quadro lento "paga" por isso)
    const r = _loopMf.apply(this, arguments);
    mfpMapa();
    if (G.ult !== antes) { // v410.5: quadro de verdade (com o limite de FPS, as chamadas puladas não contam)
      if (MFP.ultimo) {
        const iv = a - MFP.ultimo; MFP.inter.push(iv); if (iv > 33 && MFP.ultPain) MFP.aposPain++; // (o quadro lento "paga" o redesenho da página do quadro anterior)
        if (iv > 33) MFP.piores.push([iv, MFP.ultimo, a, [...prev], MFP.partesAnt]);
      }
      const g = performance.now() - a;
      MFP.ultimo = a; MFP.gasto.push(g); MFP.ultPain = MFP.pain > 0; MFP.pain = 0;
      { const P = MFPP.cur || {}; let soma = 0; for (const k in P) soma += P[k]; P['outros'] = Math.max(0, g - soma); for (const k in P) MFP.partesTot[k] = (MFP.partesTot[k] || 0) + P[k]; MFP.partesAnt = P; }
      if (g > 8) MFP.tag.add('código do jogo ' + g.toFixed(1) + ' ms');
    } else for (const x of prev) MFP.tag.add(x); // (chamada pulada pelo limite: guarda para o próximo quadro)
    try { if (G.mapa) MFP.mapas.add(G.mapa.id); const m = document.getElementById('modal'), ab = !!(m && !m.hidden); if (ab) MFP.quadrosJanela++; if (ab !== MFP.modalAntes) { MFP.tag.add(ab ? 'abriu janela' : 'fechou janela'); MFP.modalAntes = ab; } } catch (e) { }
    if (a - MFP.t0 >= MFP.dur) mfpTermina();
    return r;
  };
  const _apMf = atualizaPaineis; // v410.5: quantas vezes os painéis (mochila, barras, registro) foram refeitos
  atualizaPaineis = function () { if (!MFP.on) return _apMf.apply(this, arguments); const a = performance.now(); try { return _apMf.apply(this, arguments); } finally { const d = performance.now() - a; MFP.pain++; MFP.painMs.push(d); if (d > 2) MFP.tag.add('painéis refeitos ' + d.toFixed(1) + ' ms'); } };
  const _matarMf = typeof matar === 'function' ? matar : null;
  if (_matarMf) matar = function () { if (MFP.on) { MFP.vitorias.push(performance.now()); MFP.tag.add('vitória'); } return _matarMf.apply(this, arguments); };
}
function mfpMapa() { const id = G.mapa && G.mapa.id; if (id !== MFP.mapaUlt) { if (MFP.mapaUlt) MFP.tag.add('trocou de mapa → ' + id); MFP.mapaUlt = id; } } // (a troca pode vir de fora do quadro: porta, viagem, janela)
/* v411.2 — TEMPO POR PARTE. Durante a medição (e só nela), as funções de desenho e de lógica são embrulhadas com um
   cronômetro que conta o tempo PRÓPRIO de cada parte (o tempo de uma função chamada por dentro vai para a parte dela, não
   para a de fora). No fim da medição tudo volta a ser como era (fora da medição não custa nada). */
const MFPP = { cur: null, pilha: [], inst: [] };
const MFP_PARTES = [
  ['chão', [[() => typeof CHAO_BLOCOS !== 'undefined' && CHAO_BLOCOS.ChaoBlocos.prototype, 'desenhaEm'], 'renderChao', 'desenhaChaoClima', 'drawAguaBrilho']],
  ['bonecos e prédios', ['desenhaEnt', 'desenhaObj', 'desenhaPredio', 'desenhaSaida']],
  ['efeitos', ['desenhaEfeito', 'desenhaProjetil', 'desenhaDrops', 'desenhaNoite']],
  ['nomes e números', ['rotulo', 'placaNPC', 'barraVida', 'balao', 'desenhaTitulos']],
  ['minimapa', ['desenhaMini']],
  ['guia e buffs', ['desenhaGuia', 'desenhaBuffs']],
  ['painéis', ['atualizaPaineis']],
  ['lógica', ['atualiza']],
  ['resto do desenho', ['desenha']],
];
function mfpEmbrulha(obj, nome, parte) {
  const orig = obj && obj[nome]; if (typeof orig !== 'function') return;
  const w = function () {
    const t0 = performance.now(); MFPP.pilha.push(0);
    try { return orig.apply(this, arguments); }
    finally {
      const filhos = MFPP.pilha.pop(), d = performance.now() - t0, P = MFPP.cur;
      if (P) P[parte] = (P[parte] || 0) + Math.max(0, d - filhos);
      if (MFPP.pilha.length) MFPP.pilha[MFPP.pilha.length - 1] += d;
    }
  };
  obj[nome] = w; MFPP.inst.push([obj, nome, orig, w]);
}
function mfpInstalaPartes() {
  if (MFPP.inst.length) return;
  for (const [parte, fns] of MFP_PARTES) for (const f of fns) {
    try {
      if (Array.isArray(f)) mfpEmbrulha(f[0](), f[1], parte); // (CHAO_BLOCOS é const: não fica em window)
      else mfpEmbrulha(window, f, parte);
    } catch (e) { }
  }
}
function mfpTiraPartes() { // (só desfaz se ninguém embrulhou de novo por cima durante a medição)
  for (const [obj, nome, orig, w] of MFPP.inst.reverse()) { try { if (obj[nome] === w) obj[nome] = orig; } catch (e) { } }
  MFPP.inst = []; MFPP.cur = null; MFPP.pilha = [];
}
function mfpPct(arr, p) { if (!arr.length) return 0; const s = arr.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p / 100 * s.length))]; }
function mfpTermina() {
  MFP.on = false; window.__MFP_ON = false; try { MFP.obs && MFP.obs.disconnect(); } catch (e) { }
  mfpTiraPartes();
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
    'Painéis refeitos: vezes / típico / pior (ms)': `${MFP.painMs.length} / ${mfpPct(MFP.painMs, 50).toFixed(1)} / ${Math.max(0, ...MFP.painMs).toFixed(1)}`,
    'Quadros > 33 ms logo depois de refazer os painéis': MFP.aposPain,
    'Tempo por parte no minuto (ms)': Object.entries(MFP.partesTot).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k} ${Math.round(v)}`).join(', '),
    'Mapas': [...MFP.mapas].join(', '),
    'Tela': `${innerWidth}×${innerHeight} · ${devicePixelRatio}x`,
  };
  const ag = Object.entries(window.__MFP_AG || {}).sort((x, y) => y[1].max - x[1].max).slice(0, 6);
  const fora = ag.length ? '\nFora do quadro (≥4 ms), os mais pesados:\n' + ag.map(([k, v]) => `- ${k} → ${v.n}x, pior ${v.max.toFixed(1)} ms, total ${Math.round(v.total)} ms`).join('\n') : '\nFora do quadro: nada passou de 4 ms.';
  // v410.6: os 8 piores quadros e o que veio logo antes de cada um (tarefa longa = trabalho do navegador no meio)
  const piores = MFP.piores.sort((x, y) => y[0] - x[0]).slice(0, 8).map(([iv, de, ate, tags, P]) => {
    const tl = longas.filter(([s, d]) => s < ate && s + d > de).map(([, d]) => 'tarefa longa ' + Math.round(d) + ' ms');
    const o = [...tags, ...tl];
    const pt = P ? Object.entries(P).filter(([, v]) => v >= 1).sort((x, y) => y[1] - x[1]).slice(0, 4).map(([k, v]) => `${k} ${v.toFixed(1)}`).join(', ') : ''; // (v411.2: onde o código do quadro gastou)
    return `- ${iv.toFixed(1)} ms ← ` + (o.length ? o.join(', ') : 'nada do jogo (o navegador: desenho, memória ou outro programa)') + (pt ? ' · partes: ' + pt : '');
  });
  const lista = piores.length ? '\nOs piores quadros e o que veio logo antes:\n' + piores.join('\n') : '';
  const txt = 'Lenda do Campinho — medição de desempenho (' + seg + ' s)\n' + Object.entries(R).map(([k, v]) => `${k}: ${v}`).join('\n') + fora + lista;
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
