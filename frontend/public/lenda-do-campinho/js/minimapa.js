/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   RUMO AO CRAQUE — MINIMAPA E MAPA GRANDE
   Base "pintada" (chão suave, copas de árvore, telhados, água),
   minimapa que acompanha o jogador e ícones com significado:
   NPCs por função, missões (! e ?), rivais (vermelho = vêm te
   desafiar, laranja = só se você desafiar), chefões, saídas,
   objetivo da seta amarela e você (seta para onde está virado).
   Carregar DEPOIS de game.js, world.js e ui.js.
   ============================================================ */
const MINI_S = 8;          // pixels por tile na base pintada
const MINI_VISTA = 28;     // tiles na largura do minimapa lateral
const ARVORES_MINI = { arvore: '#3f8a3a', mangueira: '#3a7f34', coqueiro: '#4fae4a', coqueiro2: '#4fae4a', arbusto: '#4a9a3e', pinheiro: '#2f6a3a', cerejeira: '#f29ac4', cipreste: '#2f5a34', palmeira_real: '#4fae4a', palmeira: '#4fae4a' };
const TELHADOS = ['#c8643c', '#b5523a', '#3a6ea8', '#6a8a3a', '#8a5a9a', '#c89a3a', '#5a6a7a'];

function renderMiniHD(m) {
  if (m._miniHD) return m._miniHD;
  const S = MINI_S, W = m.w, H = m.h;
  const r = mulberry((m.seed || 7) + W * 131 + H);
  // 1) chão: pixel por tile, depois ampliado com e sem suavização (bordas macias, mas com textura)
  const baixo = mkCanvas(W, H), bx = baixo.getContext('2d');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { bx.fillStyle = CH_MINI[m.chao[y * W + x]] || '#86c75a'; bx.fillRect(x, y, 1, 1); }
  const c = mkCanvas(W * S, H * S), x = c.getContext('2d');
  x.imageSmoothingEnabled = false; x.drawImage(baixo, 0, 0, c.width, c.height);
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.globalAlpha = 0.7; x.drawImage(baixo, 0, 0, c.width, c.height); x.globalAlpha = 1;
  // textura: pontinhos e ondas na água
  for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
    const t = m.chao[y * W + xx];
    if (t === CH.AGUA) { if (r() < 0.35) { x.strokeStyle = 'rgba(255,255,255,0.45)'; x.lineWidth = 1.2; x.beginPath(); const px = xx * S + r() * S, py = y * S + r() * S; x.arc(px, py, 2.5, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); } continue; }
    for (let k = 0; k < 2; k++) { x.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.08)'; x.fillRect(xx * S + r() * S, y * S + r() * S, 1.5, 1.5); }
  }
  // 2) zonas de torcida
  for (const z of (m.zonas || [])) {
    x.save(); x.fillStyle = 'rgba(220,40,40,0.16)'; x.fillRect(z.x * S, z.y * S, z.w * S, z.h * S);
    x.beginPath(); x.rect(z.x * S, z.y * S, z.w * S, z.h * S); x.clip(); x.strokeStyle = 'rgba(200,30,30,0.28)'; x.lineWidth = 2;
    for (let d = -z.h * S; d < z.w * S; d += 9) { x.beginPath(); x.moveTo(z.x * S + d, z.y * S + z.h * S); x.lineTo(z.x * S + d + z.h * S, z.y * S); x.stroke(); }
    x.restore(); x.strokeStyle = 'rgba(180,20,20,0.6)'; x.lineWidth = 2; x.setLineDash([5, 4]); x.strokeRect(z.x * S + 1, z.y * S + 1, z.w * S - 2, z.h * S - 2); x.setLineDash([]);
  }
  // 3) objetos: árvores viram copas redondas, obstáculos viram pedrinhas/volumes
  for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
    const o = m.obj[y * W + xx]; if (!o || o.predio || o.t === 'x') continue;
    const cx = (xx + 0.5) * S, cy = (y + 0.5) * S;
    if (ARVORES_MINI[o.t]) {
      x.fillStyle = 'rgba(0,0,0,0.18)'; x.beginPath(); x.ellipse(cx + 1.5, cy + 2.5, S * 0.55, S * 0.4, 0, 0, 7); x.fill();
      x.fillStyle = ARVORES_MINI[o.t]; x.strokeStyle = 'rgba(30,50,20,0.7)'; x.lineWidth = 1; x.beginPath(); x.arc(cx, cy, S * 0.55, 0, 7); x.fill(); x.stroke();
      x.fillStyle = 'rgba(255,255,255,0.22)'; x.beginPath(); x.arc(cx - 1.5, cy - 1.5, S * 0.22, 0, 7); x.fill();
    } else if (o.t === 'gol') { x.fillStyle = '#ffffff'; x.fillRect(cx - S * 0.35, cy - S * 0.35, S * 0.7, S * 0.7); }
    else if (OBJ_BLOQUEIA.has(o.t) || OBJ_MINI[o.t]) {
      x.fillStyle = OBJ_MINI[o.t] || '#8a7a6a'; x.strokeStyle = 'rgba(40,30,30,0.55)'; x.lineWidth = 1;
      x.beginPath(); x.roundRect(xx * S + 1, y * S + 1, S - 2, S - 2, 2); x.fill(); x.stroke();
    }
  }
  // 4) prédios: sombra, telhado com cumeeira e porta
  (m.predios || []).forEach((b, i) => {
    const px = b.x * S, py = b.y * S, pw = b.w * S, ph = b.h * S;
    const cor = TELHADOS[(Math.abs(hash2(b.x, b.y) * 1000) | 0) % TELHADOS.length];
    x.fillStyle = 'rgba(0,0,0,0.25)'; x.beginPath(); x.roundRect(px + 3, py + 4, pw, ph, 4); x.fill();
    x.fillStyle = cor; x.strokeStyle = '#3d2b3a'; x.lineWidth = 1.6; x.beginPath(); x.roundRect(px + 1, py + 1, pw - 2, ph - 2, 4); x.fill(); x.stroke();
    x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(px + 2, py + 2, pw - 4, (ph - 4) / 2);
    x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 1; x.beginPath(); x.moveTo(px + 3, py + ph / 2); x.lineTo(px + pw - 3, py + ph / 2); x.stroke();
    if (b.porta) { x.fillStyle = '#4a2e1a'; x.fillRect(b.porta.x * S + 2, b.porta.y * S + 1, S - 4, S - 2); x.fillStyle = '#ffd23f'; x.fillRect(b.porta.x * S + S / 2 - 1, b.porta.y * S + S / 2, 1.5, 1.5); }
  });
  // 5) moldura suave nas bordas
  const g = x.createRadialGradient(c.width / 2, c.height / 2, Math.min(c.width, c.height) * 0.35, c.width / 2, c.height / 2, Math.max(c.width, c.height) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(40,20,10,0.28)'); x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
  m._miniHD = c; return c;
}

/* ---------- o que cada NPC faz (ícone) ---------- */
function iconeNPC(n) {
  const d = n.d || NPCS[n.id] || {};
  if (d.quadro) return '📋';
  if (d.aviao) return '✈️';
  if (d.onibus) return '🚌';
  if (d.refino) return '🔨';
  if (d.loja) return '🛒';
  if (d.professor) return '🎓';
  if (d.quiz) return '📰';
  if (d.prof) return '📘';
  if (d.empresario) return '💼';
  if (d.cura) return '❤️';
  if (n.id === 'almanaque') return '🏆';
  return null;
}
function marcaMissaoNPC(n) {
  const qs = MISSOES.filter(q => q.npc === n.id);
  if (qs.some(q => statusMissao(q) === 'pronta')) return '?';
  if (qs.some(q => statusMissao(q) === 'disponivel')) return '!';
  return null;
}
function rivalBravo(mo) { return !MAPAS_PACIFICOS_MINI().has(G.mapa.id) && mo.d.aggro > 0; }
function MAPAS_PACIFICOS_MINI() { return typeof MAPAS_PACIFICOS !== 'undefined' ? MAPAS_PACIFICOS : new Set(); }

/* ---------- desenho dos marcadores (serve ao minimapa e ao mapa grande) ---------- */
// tx/ty: converte coordenada do mundo (tiles) para o canvas; e = escala dos ícones
function desenhaMarcadores(x, tx, ty, e, grande) {
  const m = G.mapa; const t = G.agora || performance.now();
  const contorno = (w = 2) => { x.strokeStyle = '#1a1026'; x.lineWidth = w * e; };
  // pontos especiais (pênalti, baú)
  for (const pt of (m.pontos || [])) { const ic = pt.tipo === 'penalti' ? '⚽' : pt.tipo === 'bau' ? '🎁' : null; if (!ic) continue; x.font = `${9 * e}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ic, tx(pt.x + 0.5), ty(pt.y + 0.5)); }
  // saídas: seta apontando para fora do mapa
  for (const s of (m.saidas || [])) {
    if (s.porta) continue; // portas de prédio já têm o nome do prédio
    const cx = tx(s.x + 0.5), cy = ty(s.y + 0.5);
    const bordas = [s.x, m.w - 1 - s.x, s.y, m.h - 1 - s.y]; // esquerda, direita, cima, baixo
    const ang = [Math.PI, 0, -Math.PI / 2, Math.PI / 2][bordas.indexOf(Math.min(...bordas))];
    x.save(); x.translate(cx, cy); x.rotate(ang); x.fillStyle = '#ffd23f'; contorno(1.6);
    x.beginPath(); x.moveTo(6 * e, 0); x.lineTo(-4 * e, -5 * e); x.lineTo(-4 * e, 5 * e); x.closePath(); x.fill(); x.stroke(); x.restore();
    if (grande && s.para && MAPAS_DEF[s.para]) { const nm = '→ ' + getMapa(s.para).nome.split(' —')[0]; rotuloMini(x, nm, cx, cy - 11 * e, e, '#ffe9a8'); }
  }
  // adversários
  for (const mo of G.mons) {
    const cx = tx(mo.x), cy = ty(mo.y);
    if (mo.d.treino) { x.fillStyle = '#b0a898'; x.beginPath(); x.arc(cx, cy, 2.4 * e, 0, 7); x.fill(); continue; }
    if (mo.d.chefe) {
      // chefão: coroa
      x.save(); x.translate(cx, cy); x.fillStyle = '#ffcf3a'; contorno(1.4);
      x.beginPath(); x.moveTo(-6 * e, 4 * e); x.lineTo(-6 * e, -3 * e); x.lineTo(-3 * e, 0); x.lineTo(0, -5 * e); x.lineTo(3 * e, 0); x.lineTo(6 * e, -3 * e); x.lineTo(6 * e, 4 * e); x.closePath(); x.fill(); x.stroke();
      x.fillStyle = '#d42a2a'; x.beginPath(); x.arc(0, 1.5 * e, 1.4 * e, 0, 7); x.fill(); x.restore();
      if (grande) rotuloMini(x, mo.d.nome.split(',')[0], cx, cy - 10 * e, e, '#ffd0d0');
      continue;
    }
    const bravo = rivalBravo(mo);
    x.fillStyle = bravo ? '#e8413a' : '#f39c34'; contorno(1.2); x.beginPath(); x.arc(cx, cy, 2.8 * e, 0, 7); x.fill(); x.stroke();
    if (mo.bravo) { x.strokeStyle = `rgba(255,60,60,${0.5 + 0.5 * Math.sin(t / 150)})`; x.lineWidth = 1.5 * e; x.beginPath(); x.arc(cx, cy, 5 * e, 0, 7); x.stroke(); }
  }
  // NPCs
  for (const n of G.npcs) {
    const cx = tx(n.x), cy = ty(n.y); const ic = iconeNPC(n); const mq = marcaMissaoNPC(n);
    x.fillStyle = '#3aa0ff'; x.strokeStyle = '#ffffff'; x.lineWidth = 1.6 * e; x.beginPath(); x.arc(cx, cy, 3.4 * e, 0, 7); x.fill(); x.stroke();
    if (ic) { x.font = `${(grande ? 11 : 9) * e}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ic, cx + 7 * e, cy - 1 * e); }
    if (mq) {
      const by = cy - 8 * e - Math.abs(Math.sin(t / 250)) * 2 * e;
      x.fillStyle = mq === '?' ? '#5ad86a' : '#ffd23f'; contorno(1.3); x.beginPath(); x.arc(cx, by, 4.2 * e, 0, 7); x.fill(); x.stroke();
      x.fillStyle = '#1a1026'; x.font = `800 ${7 * e}px Fredoka, Nunito, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(mq, cx, by + 0.5 * e);
    }
    if (grande) rotuloMini(x, n.d.nome, cx, cy + 11 * e, e, '#ffffff');
  }
  // objetivo da seta amarela
  const alvo = typeof alvoGuia === 'function' ? alvoGuia() : null;
  if (alvo) { const cx = tx(alvo.x), cy = ty(alvo.y); const k = 1 + 0.25 * Math.sin(t / 220); x.strokeStyle = '#ffd23f'; x.lineWidth = 2.2 * e; x.beginPath(); x.arc(cx, cy, 6.5 * e * k, 0, 7); x.stroke(); x.strokeStyle = 'rgba(26,16,38,0.6)'; x.lineWidth = 1 * e; x.beginPath(); x.arc(cx, cy, 6.5 * e * k + 1.6 * e, 0, 7); x.stroke(); }
  // você: seta virada para onde o personagem olha
  const p = G.p; const vista = p.vista || 'frente';
  const ang = vista === 'costas' ? -Math.PI / 2 : vista === 'frente' ? Math.PI / 2 : p.flip ? Math.PI : 0;
  x.save(); x.translate(tx(p.x), ty(p.y)); x.rotate(ang);
  x.fillStyle = '#ff3aff'; x.strokeStyle = '#ffffff'; x.lineWidth = 2 * e; x.beginPath(); x.moveTo(7 * e, 0); x.lineTo(-5 * e, -5.5 * e); x.lineTo(-2.5 * e, 0); x.lineTo(-5 * e, 5.5 * e); x.closePath(); x.fill(); x.stroke(); x.restore();
}
// rótulos do mapa grande desviam uns dos outros (sobem/descem um pouco; se não couber, somem)
let ROTULOS = null;
function rotuloMini(x, txt, cx, cy, e, cor) {
  x.font = `700 ${10 * e}px Fredoka, Nunito, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
  if (ROTULOS) {
    const w = x.measureText(txt).width + 6, h = 12 * e; const livre = y => !ROTULOS.some(r => Math.abs(r.x - cx) < (r.w + w) / 2 && Math.abs(r.y - y) < (r.h + h) / 2);
    const tentativas = [0, h, -h, 2 * h, -2 * h]; const d = tentativas.find(dy => livre(cy + dy)); if (d === undefined) return;
    cy += d; ROTULOS.push({ x: cx, y: cy, w, h });
  }
  x.strokeStyle = '#1a1026'; x.lineWidth = 3 * e; x.lineJoin = 'round'; x.strokeText(txt, cx, cy); x.fillStyle = cor; x.fillText(txt, cx, cy);
}

/* ---------- minimapa lateral: acompanha você ---------- */
let MINI_T = 0, MINI_CAM = null; // câmera do minimapa desliza atrás do jogador
desenhaMini = function () {
  const mc = $('#mini'); if (!mc || !G.mapa || !G.p) return;
  const agora = performance.now(); const dt = Math.min(100, agora - (MINI_T || agora)); MINI_T = agora;
  const m = G.mapa; const base = renderMiniHD(m);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const larg = Math.max(120, Math.round((mc.clientWidth || 220) * dpr)), alt = Math.round(larg * 0.78);
  if (mc.width !== larg || mc.height !== alt) { mc.width = larg; mc.height = alt; }
  const x = mc.getContext('2d');
  // janela de tiles centrada no jogador (ou o mapa inteiro, se couber)
  let vw = Math.min(m.w, MINI_VISTA), vh = vw * alt / larg; if (vh > m.h) { vh = m.h; vw = Math.min(m.w, vh * larg / alt); }
  if (!MINI_CAM || MINI_CAM.mapa !== m.id || Math.hypot(MINI_CAM.x - G.p.x, MINI_CAM.y - G.p.y) > 12) MINI_CAM = { mapa: m.id, x: G.p.x, y: G.p.y }; // mapa novo/teleporte: pula direto
  const k0 = 1 - Math.exp(-dt / 110); MINI_CAM.x += (G.p.x - MINI_CAM.x) * k0; MINI_CAM.y += (G.p.y - MINI_CAM.y) * k0;
  let x0 = clamp(MINI_CAM.x - vw / 2, 0, Math.max(0, m.w - vw)), y0 = clamp(MINI_CAM.y - vh / 2, 0, Math.max(0, m.h - vh));
  const k = larg / vw; const ox = (larg - vw * k) / 2, oy = (alt - vh * k) / 2;
  x.fillStyle = '#1a1026'; x.fillRect(0, 0, larg, alt);
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  x.drawImage(base, x0 * MINI_S, y0 * MINI_S, vw * MINI_S, vh * MINI_S, ox, oy, vw * k, vh * k);
  // noite escurece um pouco o minimapa também
  const h = G.save.hora / 60; if (!m.interior && (h >= 19 || h < 6)) { x.fillStyle = 'rgba(20,24,80,0.25)'; x.fillRect(0, 0, larg, alt); }
  const e = Math.max(0.9, k / 9); // ícones acompanham o zoom
  desenhaMarcadores(x, wx => ox + (wx - x0) * k, wy => oy + (wy - y0) * k, e, false);
  // moldura
  x.strokeStyle = 'rgba(255,233,168,0.55)'; x.lineWidth = 2 * dpr; x.strokeRect(1, 1, larg - 2, alt - 2);
};
// o mapa lateral abre o mapa grande
document.addEventListener('click', ev => { if (ev.target && ev.target.id === 'mini' && G.rodando && typeof modalMapa === 'function') modalMapa(); });

/* ---------- mapa grande (tecla M) ---------- */
modalMapa = function () {
  const m = G.mapa; const base = renderMiniHD(m);
  const esc = Math.min(1.6, Math.max(0.6, 860 / base.width)); const c = mkCanvas(Math.round(base.width * esc), Math.round(base.height * esc)); const x = c.getContext('2d');
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(base, 0, 0, c.width, c.height);
  const k = MINI_S * esc; const e = Math.max(1, k / 8);
  ROTULOS = [];
  // nomes dos prédios
  for (const b of (m.predios || [])) if (b.interior && MAPAS_DEF[b.interior]) rotuloMini(x, getMapa(b.interior).nome, (b.porta.x + 0.5) * k, (b.porta.y + 1.9) * k, e * 0.9, '#ffe9a8');
  for (const z of (m.zonas || [])) rotuloMini(x, '⚠ ' + z.nome, (z.x + z.w / 2) * k, (z.y + 1) * k, e * 0.9, '#ffb0b0');
  desenhaMarcadores(x, wx => wx * k, wy => wy * k, e, true); ROTULOS = null;
  c.className = 'mapa-grande';
  const L = (html, txt) => el('span', { class: 'leg-item' }, el('span', { class: 'leg-ic ' + html[0] }, html[1]), txt);
  const legenda = el('div', { class: 'legenda-mapa' },
    L(['leg-voce', '➤'], 'Você'), L(['leg-alvo', '◯'], 'Objetivo (seta amarela)'), L(['leg-saida', '▶'], 'Saída'),
    L(['leg-npc', ''], 'Pessoa'), L(['leg-miss', '!'], 'Missão nova'), L(['leg-pronta', '?'], 'Missão pronta'),
    L(['leg-bravo', ''], 'Rival que vem te desafiar'), L(['leg-calmo', ''], 'Rival (só se você desafiar)'), L(['leg-chefe', '♛'], 'Chefão'),
    el('span', { class: 'leg-item' }, '🛒 loja · 🔨 forja · ✈️ voos · 🚌 ônibus · ❤️ cura · 🎓 dribles · 📰 quiz · 📘 aula · 💼 empresário · 📋 desafios'));
  const regioes = el('div', { class: 'opcoes' }, ...MAPAS_ORDEM.map(id => { const f = MAPAS_FLAG[id]; const ok = !f || G.save.flags[f]; return el('span', { class: 'tag-reg' + (ok ? '' : ' bloq') + (G.mapa.id === id ? ' aqui' : '') }, (ok ? '' : '🔒 ') + getMapa(id).nome); }));
  abreModal.largo = true;
  abreModal(el('h2', {}, `Mapa — ${m.nome}`), legenda, c, el('h3', {}, 'Regiões'), regioes);
  // anima os marcadores enquanto o mapa está aberto
  const anima = () => { if ($('#modal').hidden || !document.body.contains(c)) { ROTULOS = null; return; } ROTULOS = []; x.drawImage(base, 0, 0, c.width, c.height);
    for (const b of (m.predios || [])) if (b.interior && MAPAS_DEF[b.interior]) rotuloMini(x, getMapa(b.interior).nome, (b.porta.x + 0.5) * k, (b.porta.y + 1.9) * k, e * 0.9, '#ffe9a8');
    for (const z of (m.zonas || [])) rotuloMini(x, '⚠ ' + z.nome, (z.x + z.w / 2) * k, (z.y + 1) * k, e * 0.9, '#ffb0b0');
    desenhaMarcadores(x, wx => wx * k, wy => wy * k, e, true); ROTULOS = null; setTimeout(anima, 120); };
  setTimeout(anima, 120);
};

(function () {
  if (document.getElementById('minimapa-css')) return;
  const st = document.createElement('style'); st.id = 'minimapa-css';
  st.textContent = `
  #mini { image-rendering: auto !important; cursor: zoom-in; border-radius: 6px; }
  .legenda-mapa { display: flex; flex-wrap: wrap; gap: 4px 12px; font: 700 12px Nunito, sans-serif; margin: 4px 0 8px; align-items: center; }
  .leg-item { display: inline-flex; align-items: center; gap: 4px; }
  .leg-ic { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; font: 800 10px Fredoka, Nunito, sans-serif; color: #1a1026; border: 2px solid #1a1026; }
  .leg-voce { background: #ff3aff; color: #fff; border-color: #fff; box-shadow: 0 0 0 1px #1a1026; }
  .leg-alvo { background: transparent; border-color: #ffd23f; color: #ffd23f; }
  .leg-saida { background: #ffd23f; border-radius: 3px; }
  .leg-npc { background: #3aa0ff; border-color: #fff; box-shadow: 0 0 0 1px #1a1026; }
  .leg-miss { background: #ffd23f; } .leg-pronta { background: #5ad86a; }
  .leg-bravo { background: #e8413a; } .leg-calmo { background: #f39c34; } .leg-chefe { background: #ffcf3a; border-radius: 4px; }
  `;
  document.head.append(st);
})();
