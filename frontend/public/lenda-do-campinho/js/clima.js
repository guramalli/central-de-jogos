/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   RUMO AO CRAQUE — ESTAÇÕES DO ANO E CLIMA
   Ano de 20 dias do jogo (4 estações x 5 dias). Hemisfério sul
   (Brasil) tem as estações invertidas. O clima muda a cada 6h
   do jogo, de forma determinística por cidade e dia.
   Carregar DEPOIS de game.js e cidades.js.
   ============================================================ */
const DIAS_ESTACAO = 5;
const ESTACOES = ['Primavera', 'Verão', 'Outono', 'Inverno']; // do hemisfério norte
const ICONE_ESTACAO = { Primavera: '🌸', 'Verão': '☀️', Outono: '🍂', Inverno: '❄️' };
const CLIMA_CIDADE = {
  vila: 'tropical', praia: 'tropical', cidade: 'tropical', ct: 'tropical', estadio: 'tropical', miami: 'tropical',
  cairo: 'deserto', doha: 'deserto',
  lisboa: 'temperado', madri: 'temperado', milao: 'temperado',
  londres: 'frio', munique: 'frio', toquio: 'frio',
};
const HEMISFERIO_SUL = new Set(['vila', 'praia', 'cidade', 'ct', 'estadio']);
// pesos de cada tempo por clima e estação
const TABELA_CLIMA = {
  tropical: { 'Verão': { sol: 4, chuva: 3, tempestade: 2 }, Outono: { sol: 5, nublado: 2, chuva: 2 }, Inverno: { sol: 5, nublado: 3, chuva: 1, neblina: 1 }, Primavera: { sol: 5, chuva: 2, nublado: 2 } },
  deserto: { 'Verão': { sol: 4, calor: 6, areia: 1 }, Outono: { sol: 6, calor: 2, areia: 1, nublado: 1 }, Inverno: { sol: 7, nublado: 2, chuva: 1 }, Primavera: { sol: 5, calor: 2, areia: 2 } },
  temperado: { 'Verão': { sol: 7, calor: 2 }, Outono: { chuva: 4, nublado: 3, sol: 2, neblina: 1 }, Inverno: { chuva: 3, nublado: 3, neve: 2, neblina: 2 }, Primavera: { sol: 5, chuva: 2, nublado: 2 } },
  frio: { 'Verão': { sol: 5, chuva: 2, nublado: 2 }, Outono: { chuva: 4, neblina: 3, nublado: 2 }, Inverno: { neve: 5, nublado: 2, neblina: 2 }, Primavera: { chuva: 3, sol: 3, nublado: 2 } },
};
const TEMPO = {
  sol: { nome: 'Sol', icone: '☀️', efeito: '' },
  nublado: { nome: 'Nublado', icone: '☁️', efeito: '' },
  chuva: { nome: 'Chuva', icone: '🌧️', efeito: '−5% velocidade', vel: 0.95 },
  tempestade: { nome: 'Tempestade', icone: '⛈️', efeito: '−8% velocidade', vel: 0.92 },
  neve: { nome: 'Neve', icone: '🌨️', efeito: '−12% velocidade e fôlego volta mais devagar', vel: 0.88, regen: 0.8 },
  neblina: { nome: 'Neblina', icone: '🌫️', efeito: 'adversários enxergam menos você', aggro: -2 },
  calor: { nome: 'Calor forte', icone: '🥵', efeito: 'fôlego e foco voltam mais devagar', regen: 0.85, regenFoco: 0.75 },
  areia: { nome: 'Tempestade de areia', icone: '🌪️', efeito: '−10% velocidade, adversários enxergam menos', vel: 0.9, aggro: -2 },
};

function estacaoDe(mapaId, dia) {
  const idx = Math.floor((Math.max(1, dia) - 1) / DIAS_ESTACAO) % 4;
  return ESTACOES[HEMISFERIO_SUL.has(mapaId) ? (idx + 2) % 4 : idx];
}
function climaDe(mapaId, dia, hora) {
  const tipo = CLIMA_CIDADE[mapaId]; if (!tipo) return null;
  const est = estacaoDe(mapaId, dia); const tab = TABELA_CLIMA[tipo][est];
  const turno = Math.floor(((hora || 0) % 1440) / 360);
  const r = hash2(dia * 7 + turno, mapaId.length * 131 + mapaId.charCodeAt(0) * 17 + mapaId.charCodeAt(1));
  const tot = Object.values(tab).reduce((a, b) => a + b, 0); let acc = 0;
  for (const [k, p] of Object.entries(tab)) { acc += p / tot; if (r < acc) return { tempo: k, estacao: est }; }
  return { tempo: 'sol', estacao: est };
}
function climaAtual() {
  if (!G.mapa || !G.save) return null;
  const id = G.mapa.interior ? null : G.mapa.id;
  if (!id) return null;
  return climaDe(id, G.save.dia, G.save.hora);
}

/* ---------- efeitos no jogo ---------- */
const _statsBase = stats;
stats = function () {
  const st = _statsBase();
  const c = G.climaCache; if (!c) return st;
  const t = TEMPO[c.tempo];
  if (t.vel) st.vel *= t.vel;
  if (t.regen) st.regenHp *= t.regen;
  if (t.regenFoco) st.regenFoco *= t.regenFoco;
  return st;
};
const _atualizaBase = atualiza;
atualiza = function (dt) {
  const c = climaAtual();
  const antes = G.climaCache;
  G.climaCache = c; G.climaAggro = c ? (TEMPO[c.tempo].aggro || 0) : 0;
  if (c && (!antes || antes.tempo !== c.tempo || G.climaMapa !== G.mapa.id)) {
    const t = TEMPO[c.tempo];
    if (antes && G.climaMapa === G.mapa.id) { log(`${t.icone} O tempo mudou: ${t.nome}${t.efeito ? ' (' + t.efeito + ')' : ''}.`, 'l-sis'); if (c.tempo === 'neve' || c.tempo === 'tempestade' || c.tempo === 'areia') banner(`${t.icone} ${t.nome}!`, t.efeito); }
    else if (t.efeito) log(`${t.icone} ${t.nome} em ${G.mapa.nome.split(' —')[0]}: ${t.efeito}.`, 'l-sis');
    if (antes && antes.estacao !== c.estacao && G.climaMapa === G.mapa.id) { banner(`${ICONE_ESTACAO[c.estacao]} Chegou ${c.estacao === 'Primavera' ? 'a' : 'o'} ${c.estacao}!`, 'Uma nova estação começou'); log(`${ICONE_ESTACAO[c.estacao]} Nova estação: ${c.estacao}.`, 'l-lvl'); }
    G.climaMapa = G.mapa.id;
    if (c.tempo !== 'sol' && c.tempo !== 'nublado') dica('clima', 'O clima muda com o tempo e com a estação do ano! Chuva, neve, calor e tempestades de areia mudam um pouco a sua velocidade e recuperação. Veja o tempo atual no topo da tela.');
  }
  _atualizaBase(dt);
  climaParticulas(dt);
};
const _barrasBase = atualizaBarras;
atualizaBarras = function () {
  _barrasBase();
  const c = G.climaCache; const el = $('#relogio'); if (!el) return;
  if (c) { const t = TEMPO[c.tempo]; el.textContent = `${t.icone} ${t.nome} · ${ICONE_ESTACAO[c.estacao]} ${c.estacao} · ` + el.textContent; el.title = t.efeito || 'Sem efeito no jogo'; }
};

/* ---------- partículas e visual ---------- */
const PART = { lista: [], tipo: null, relampago: 0 };
function climaParticulas(dt) {
  const c = G.climaCache; const W = CV ? CV.width : 800, H = CV ? CV.height : 600;
  let tipo = null, n = 0;
  if (c) {
    if (c.tempo === 'chuva') { tipo = 'chuva'; n = 140; } else if (c.tempo === 'tempestade') { tipo = 'chuva'; n = 260; }
    else if (c.tempo === 'neve') { tipo = 'neve'; n = 160; } else if (c.tempo === 'areia') { tipo = 'areia'; n = 220; }
    else if (c.estacao === 'Outono' && (c.tempo === 'sol' || c.tempo === 'nublado' || c.tempo === 'neblina') && CLIMA_CIDADE[G.mapa.id] !== 'deserto') { tipo = 'folha'; n = 26; }
    else if (c.estacao === 'Primavera' && (c.tempo === 'sol' || c.tempo === 'nublado') && CLIMA_CIDADE[G.mapa.id] !== 'deserto') { tipo = 'petala'; n = G.mapa.id === 'toquio' ? 60 : 22; }
  }
  const s = G.dpr || 1;
  if (tipo !== PART.tipo) { PART.lista = []; PART.tipo = tipo; }
  while (PART.lista.length < n) PART.lista.push(novaParticula(tipo, W, H, true));
  if (PART.lista.length > n) PART.lista.length = n;
  const k = dt / 16;
  for (const p of PART.lista) {
    p.x += p.vx * k * s; p.y += p.vy * k * s; p.fase += 0.05 * k;
    if (tipo === 'neve' || tipo === 'folha' || tipo === 'petala') p.x += Math.sin(p.fase) * 0.6 * k * s;
    if (p.y > H + 20 || p.x > W + 40 || p.x < -40) Object.assign(p, novaParticula(tipo, W, H, false));
  }
  if (c && c.tempo === 'tempestade' && Math.random() < 0.002 * k) { PART.relampago = 1; setTimeout(() => { if (G.somOn) somNota(55, 0.9); }, 250); }
  PART.relampago = Math.max(0, PART.relampago - 0.04 * k);
}
function novaParticula(tipo, W, H, inicio) {
  const r = Math.random;
  const y = inicio ? r() * H : -20 - r() * 40;
  switch (tipo) {
    case 'chuva': return { x: r() * (W + 200) - 100, y, vx: -2.2, vy: 16 + r() * 6, fase: 0, tam: 1 };
    case 'neve': return { x: r() * W, y, vx: -0.3 + r() * 0.6, vy: 0.9 + r() * 1.3, fase: r() * 6, tam: 1.5 + r() * 2.5 };
    case 'areia': return { x: inicio ? r() * W : -30, y: r() * H, vx: 9 + r() * 7, vy: 0.5 + r(), fase: 0, tam: 1 + r() * 2 };
    case 'folha': return { x: r() * W, y, vx: 0.8 + r(), vy: 1 + r() * 1.2, fase: r() * 6, tam: 4 + r() * 3, cor: ['#e07a2a', '#c8502a', '#e8b030', '#a8602a'][(r() * 4) | 0] };
    case 'petala': return { x: r() * W, y, vx: 0.6 + r() * 0.8, vy: 0.8 + r(), fase: r() * 6, tam: 3 + r() * 2.5, cor: ['#ffb8d8', '#ffd0e4', '#ff9ec7'][(r() * 3) | 0] };
    default: return { x: 0, y: H + 100, vx: 0, vy: 0, fase: 0, tam: 0 };
  }
}
function desenhaClima(ctx) {
  const c = G.climaCache; if (!c) return;
  const W = CV.width, H = CV.height, s = G.dpr || 1;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  // tons do tempo
  const tint = { chuva: 'rgba(40,60,100,0.18)', tempestade: 'rgba(20,30,60,0.3)', neve: 'rgba(235,245,255,0.22)', neblina: null, nublado: 'rgba(90,100,120,0.12)', calor: 'rgba(255,170,60,0.12)', areia: 'rgba(220,150,70,0.28)', sol: null }[c.tempo];
  if (tint) { ctx.fillStyle = tint; ctx.fillRect(0, 0, W, H); }
  if (c.estacao === 'Inverno' && c.tempo !== 'neve') { ctx.fillStyle = 'rgba(150,190,255,0.08)'; ctx.fillRect(0, 0, W, H); }
  if (c.estacao === 'Outono') { ctx.fillStyle = 'rgba(230,140,50,0.06)'; ctx.fillRect(0, 0, W, H); }
  if (c.tempo === 'sol' || c.tempo === 'calor') { // raios de sol
    const g = ctx.createRadialGradient(W * 0.1, -H * 0.1, 10, W * 0.1, -H * 0.1, H * 1.1); g.addColorStop(0, 'rgba(255,240,180,0.28)'); g.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,240,200,0.04)';
    for (let i = 0; i < 4; i++) { const x = W * (0.15 + i * 0.22) + Math.sin(G.agora / 3000 + i) * 20 * s; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 60 * s, 0); ctx.lineTo(x - 140 * s, H); ctx.lineTo(x - 260 * s, H); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
  }
  if (c.tempo === 'neblina') { for (let i = 0; i < 3; i++) { const y = H * (0.25 + i * 0.3) + Math.sin(G.agora / 2500 + i * 2) * 20 * s; const g = ctx.createLinearGradient(0, y - 120 * s, 0, y + 120 * s); g.addColorStop(0, 'rgba(235,240,245,0)'); g.addColorStop(0.5, 'rgba(235,240,245,0.35)'); g.addColorStop(1, 'rgba(235,240,245,0)'); ctx.fillStyle = g; ctx.fillRect(0, y - 120 * s, W, 240 * s); } }
  if (c.tempo === 'neve') { const g = ctx.createLinearGradient(0, H * 0.6, 0, H); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0.22)'); ctx.fillStyle = g; ctx.fillRect(0, H * 0.6, W, H * 0.4); }
  // partículas
  for (const p of PART.lista) {
    if (PART.tipo === 'chuva') { ctx.strokeStyle = 'rgba(200,220,255,0.55)'; ctx.lineWidth = 1.3 * s; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.vx * 1.4 * s, p.y + p.vy * 1.4 * s); ctx.stroke(); }
    else if (PART.tipo === 'neve') { ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.tam * s, 0, 7); ctx.fill(); }
    else if (PART.tipo === 'areia') { ctx.fillStyle = 'rgba(240,200,130,0.6)'; ctx.fillRect(p.x, p.y, p.tam * 3 * s, p.tam * s); }
    else if (PART.tipo === 'folha' || PART.tipo === 'petala') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.fase); ctx.fillStyle = p.cor; ctx.beginPath(); ctx.ellipse(0, 0, p.tam * s, p.tam * 0.55 * s, 0, 0, 7); ctx.fill(); ctx.restore(); }
  }
  if (PART.tipo === 'chuva') { ctx.strokeStyle = 'rgba(220,235,255,0.5)'; ctx.lineWidth = 1 * s; for (let i = 0; i < 8; i++) { const x = hash2(i, Math.floor(G.agora / 200)) * W, y = hash2(Math.floor(G.agora / 200), i) * H, r = ((G.agora / 200) % 1) * 8 * s; ctx.beginPath(); ctx.ellipse(x, y, r + 2, (r + 2) * 0.4, 0, 0, 7); ctx.stroke(); } }
  if (PART.relampago > 0) { ctx.fillStyle = `rgba(255,255,255,${PART.relampago * 0.6})`; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
}
const _noiteBase = desenhaNoite;
desenhaNoite = function (ctx, cam, vw, vh, x0, y0, x1, y1) { desenhaClima(ctx); _noiteBase(ctx, cam, vw, vh, x0, y0, x1, y1); };

/* previsão do tempo no aeroporto */
function previsaoTxt(id) {
  const c = climaDe(id, G.save.dia, G.save.hora); if (!c) return '';
  const t = TEMPO[c.tempo]; return ` · ${ICONE_ESTACAO[c.estacao]} ${c.estacao}, agora: ${t.icone} ${t.nome}`;
}

/* chão coberto de neve (acumula aos poucos) e molhado na chuva */
function desenhaChaoClima(ctx, sx, sy, sw, sh) {
  const c = G.climaCache; if (!c || sw <= 0) return;
  const alvoNeve = c.tempo === 'neve' ? 0.62 : (c.estacao === 'Inverno' && CLIMA_CIDADE[G.mapa.id] === 'frio' ? 0.22 : 0);
  if (G.climaMapa !== G._neveMapa) { G._neveMapa = G.climaMapa; G.neveAcum = alvoNeve; }
  G.neveAcum = (G.neveAcum || 0) + (alvoNeve - (G.neveAcum || 0)) * 0.004;
  if (G.neveAcum > 0.01) { ctx.fillStyle = `rgba(246,250,255,${G.neveAcum.toFixed(3)})`; ctx.fillRect(sx, sy, sw, sh); }
  if (c.tempo === 'chuva' || c.tempo === 'tempestade') { ctx.fillStyle = 'rgba(30,45,80,0.14)'; ctx.fillRect(sx, sy, sw, sh); }
  if (c.tempo === 'areia') { ctx.fillStyle = 'rgba(225,180,110,0.22)'; ctx.fillRect(sx, sy, sw, sh); }
}
