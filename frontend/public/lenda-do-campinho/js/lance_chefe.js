/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ⚽ FUTEBOL DE VERDADE NOS MOMENTOS FORTES — v408 (Raio-X I4, o dono aprovou)
   O combate do dia a dia é de RPG; o futebol jogável ficava só na Carreira (nível 25+) e no pênalti.
   Agora o tema volta nos momentos fortes, sem mudar o combate:
   1) "GOOOL!" — vencer um chefão (d.chefe: chefões de mapa, de arena, da Torre, Guardiões, Ecos...) mostra uma
      comemoração CURTA (1,8 s) por cima do jogo: rede desenhada por código, bola entrando, confete e torcida, som de gol.
      Não para o jogo (só desenho, sem clique). Dá para desligar em ⚙️ Configurações › 🎮 Jogo.
   2) "Hora do lance!" — quando um chefão chega a ~15% do fôlego, aparece um convite "⚽ Hora do lance! (E)"
      (só jogando sozinho: fora de caça em grupo, Torre e Ecos, que têm relógio). Aceitou: minijogo de até 8 s contra
      um goleiro GIGANTE com a cara do chefão — ele balança de um lado para o outro e você chuta no canto vazio
      (setas/A-D, clique ou toque no canto, ou os botões). GOL → o chefão cai na hora + "GOOOL!" + bônus pequeno
      (só tostões e XP do próprio chefão: +25% dos tostões médios dele e +10% da XP dele; nenhuma fonte de poder nova).
      Errou, fechou ou deixou passar → a luta continua normal (NUNCA pune). Um convite por chefão.
   3) Placar nas missões de caça: no rastreador, no "🎯 Agora:" e na janela de Missões, cada 10 vitórias = 1 gol
      ("⚽ 3 × 0"). Só visual.
   Prefixo: lch / LCH. Carregar NO FIM do index.html (depois de opcoes.js, objetivo_agora.js, missoes_org.js, chefes_vivos.js).
   ============================================================ */
const LCH = { gol: null, convite: null, lance: null, tChk: 0, subProx: null };
const LCH_GOL_MS = 1800, LCH_PCT = 0.15, LCH_CONVITE_MS = 7000, LCH_TEMPO_MS = 8000;
const lchOpc = k => !(typeof OPC !== 'undefined' && OPC && OPC[k] === false); // opções em ⚙️ (opcoes.js); ligado por padrão
const lchChefe = m => !!(m && m.d && m.d.chefe && !m.d.treino && !m.d.pedraTorre && !m.d.pedra && !m.d.quadro);
const lchCelular = () => document.body.classList.contains('modo-celular');

/* ============ 1) GOOOL! na vitória sobre o chefão ============ */
function lchGolDeChefe(m, sub) {
  if (!lchOpc('golChefe')) return;
  const cores = ['#ffd60a', '#ff5a4d', '#06d6a0', '#4f82ff', '#ffffff', '#ff8ccb'], conf = [];
  for (let i = 0; i < 46; i++) conf.push({ a: rnd(-Math.PI * 0.95, -Math.PI * 0.05), v: rnd(0.25, 0.75), c: cores[i % cores.length], s: rnd(4, 8), r: rnd(0, 6), vr: rnd(-0.015, 0.015) });
  LCH.gol = { t0: performance.now(), nome: (m && m.d && m.d.nome) || '', sub: sub || '', conf };
  try { som('gol'); } catch (e) { }
}
function lchDesenhaGol(ctx, W, H) {
  const g = LCH.gol; if (!g) return;
  const t = performance.now() - g.t0; if (t < 0 || t > LCH_GOL_MS) { LCH.gol = null; return; }
  const u = Math.max(0.45, Math.min(W, H) / 560), cx = W / 2, cy = H * 0.64; // abaixo do #banner (top 32%): o "Você venceu..." e o "NÍVEL N!" continuam legíveis
  const gw = 200 * u, gh = 86 * u, x1 = cx - gw / 2, x2 = cx + gw / 2, y1 = cy - gh / 2, y2 = cy + gh / 2;
  const fade = t > LCH_GOL_MS - 350 ? (LCH_GOL_MS - t) / 350 : Math.min(1, t / 120);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = Math.max(0, fade);
  // ---- a rede (com o "bojo" onde a bola entra) ----
  const bx = cx + gw * 0.24, by = cy - gh * 0.12, kr = clamp((t - 420) / 560, 0, 1);
  const bojo = (x, y) => { if (kr <= 0 || kr >= 1) return 0; const d = Math.hypot(x - bx, y - by); return Math.exp(-d * d / (1500 * u * u)) * 13 * u * Math.sin(kr * Math.PI); };
  ctx.fillStyle = 'rgba(12,28,18,0.5)'; ctx.fillRect(x1, y1, gw, gh);
  ctx.strokeStyle = 'rgba(240,245,255,0.75)'; ctx.lineWidth = Math.max(1, u);
  for (let x = x1 + 7 * u; x < x2; x += 9 * u) { ctx.beginPath(); let p = true; for (let y = y1 + 2; y <= y2; y += 6 * u) { const b = bojo(x, y), px = x + (x - cx) * b * 0.012, py = y - b * 0.5; if (p) { ctx.moveTo(px, py); p = false; } else ctx.lineTo(px, py); } ctx.stroke(); }
  for (let y = y1 + 7 * u; y < y2; y += 9 * u) { ctx.beginPath(); let p = true; for (let x = x1 + 2; x <= x2 - 2; x += 6 * u) { const b = bojo(x, y), py = y - b * 0.8; if (p) { ctx.moveTo(x, py); p = false; } else ctx.lineTo(x, py); } ctx.stroke(); }
  // traves (tremem um pouquinho quando a bola entra)
  const tr = t > 420 && t < 800 ? Math.sin((t - 420) / 22) * 2 * u * (1 - (t - 420) / 380) : 0, pw = 7 * u;
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#8a90a0'; ctx.lineWidth = Math.max(1, 1.4 * u);
  for (const [rx, ry, rw, rh] of [[x1 - pw + tr, y1 - pw, pw, gh + pw], [x2 + tr, y1 - pw, pw, gh + pw], [x1 - pw, y1 - pw + tr, gw + pw * 2, pw]]) { ctx.fillRect(rx, ry, rw, rh); ctx.strokeRect(rx, ry, rw, rh); }
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(x1 - gw * 0.25, y2, gw * 1.5, Math.max(1.5, 2 * u)); // linha do gol
  // ---- a bola: vem de baixo e entra no canto ----
  if (typeof desenhaBola === 'function') {
    if (t < 420) { const k = t / 420, sx = cx - gw * 0.1, sy = H * 0.86; desenhaBola(ctx, sx + (bx - sx) * k, sy + (by - sy) * k - Math.sin(k * Math.PI) * 40 * u, (17 - 9 * k) * u, k * 14); }
    else desenhaBola(ctx, bx, Math.min(y2 - 8 * u, by + Math.pow(Math.min(1, (t - 420) / 500), 2) * 30 * u), 8 * u, 14);
  }
  // ---- confete ----
  if (t > 380) { const p = t - 380; for (const c of g.conf) { const x = cx + Math.cos(c.a) * c.v * p * u, y = cy + Math.sin(c.a) * c.v * p * u + 0.00045 * p * p * u; ctx.save(); ctx.translate(x, y); ctx.rotate(c.r + c.vr * p); ctx.fillStyle = c.c; ctx.fillRect(-c.s * u / 2, -c.s * u / 4, c.s * u, c.s * u / 2); ctx.restore(); } }
  // ---- torcida pulando no pé da tela ----
  if (t > 150) {
    const passo = 24 * u, n = Math.ceil(W / passo) + 1, cores = ['#ff5a4d', '#ffd60a', '#ffffff', '#4f82ff', '#06d6a0', '#ff8ccb', '#ffb86f'];
    ctx.fillStyle = 'rgba(29,18,66,0.55)'; ctx.fillRect(0, H - 34 * u, W, 34 * u);
    for (let i = 0; i < n; i++) {
      const x = i * passo + passo / 2, pula = Math.abs(Math.sin(t / 130 + i * 0.8)) * 9 * u, y = H - 14 * u - pula, c = cores[(i * 3) % cores.length];
      ctx.fillStyle = c; ctx.fillRect(x - 6 * u, y, 12 * u, 16 * u); // corpo (camisa)
      ctx.fillStyle = '#f2c79a'; ctx.beginPath(); ctx.arc(x, y - 5 * u, 5 * u, 0, 7); ctx.fill(); // cabeça
      ctx.strokeStyle = c; ctx.lineWidth = Math.max(1.5, 2.5 * u); ctx.beginPath(); ctx.moveTo(x - 5 * u, y + 2 * u); ctx.lineTo(x - 9 * u, y - 9 * u - pula * 0.3); ctx.moveTo(x + 5 * u, y + 2 * u); ctx.lineTo(x + 9 * u, y - 9 * u - pula * 0.3); ctx.stroke(); // braços para cima
    }
  }
  // ---- GOOOL! ----
  if (t > 300) {
    const k = clamp((t - 300) / 260, 0, 1), esc = k < 1 ? 0.4 + 0.75 * Math.sin(k * Math.PI * 0.62) / Math.sin(Math.PI * 0.62) : 1;
    ctx.save(); ctx.translate(cx, y1 - 22 * u); ctx.scale(esc, esc); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = `700 ${Math.round(58 * u)}px Fredoka, 'Trebuchet MS', sans-serif`; ctx.lineJoin = 'round';
    ctx.lineWidth = 9 * u; ctx.strokeStyle = '#1d1242'; ctx.strokeText('GOOOL!', 0, 0); ctx.fillStyle = '#ffd60a'; ctx.fillText('GOOOL!', 0, 0);
    ctx.restore();
    const linha = g.sub; // (o "Você venceu ...!" já aparece no banner do jogo)
    if (linha) { ctx.textAlign = 'center'; ctx.font = `800 ${Math.round(17 * u)}px Nunito, sans-serif`; ctx.lineWidth = 5 * u; ctx.strokeStyle = '#1d1242'; ctx.strokeText(linha, cx, y2 + 26 * u); ctx.fillStyle = '#ffffff'; ctx.fillText(linha, cx, y2 + 26 * u); }
  }
  ctx.restore();
}
{ // o chefão caiu (qualquer jeito: luta normal ou lance decisivo) → GOOOL!
  const _matarLch = matar;
  matar = function (m) {
    const chefe = lchChefe(m);
    const r = _matarLch.apply(this, arguments);
    if (chefe) try { lchGolDeChefe(m, LCH.subProx); } catch (e) { }
    LCH.subProx = null;
    if (LCH.convite && LCH.convite.m === m) lchFechaConvite();
    return r;
  };
  // desenhado por cima de tudo, depois do quadro do jogo (não para nada: é só desenho)
  const _desenhaLch = desenha;
  desenha = function () {
    const r = _desenhaLch.apply(this, arguments);
    if (LCH.gol) try { lchDesenhaGol(CTX, CV.width, CV.height); } catch (e) { LCH.gol = null; }
    if (LCH.convite) { const b = document.getElementById('lchConvite'); if (b && b.classList.contains('on') === !!G.pausado) b.classList.toggle('on', !G.pausado); } // jogo parado (janela, cena da história): o convite se esconde
    return r;
  };
}

/* ============ 2) Hora do lance! (1×1 contra o goleiro gigante) ============ */
function lchPodeLance() {
  const s = G.save; if (!s || !G.p || !G.mapa || !G.mons || !(s.hp > 0)) return false;
  if (!lchOpc('lanceChefe')) return false;
  if (G.mapa.torre || G.mapa.ecos) return false;                                        // Torre e Ecos/Despertar têm relógio
  if (typeof CG !== 'undefined' && CG && CG.grupo) return false;                          // caça em grupo
  if (typeof CO !== 'undefined' && CO && (CO.sala || CO.jogando)) return false;           // Torre em grupo
  if (s.despertar && s.despertar.lutando) return false;
  if (G.fut || G.jogoC || (typeof HIST !== 'undefined' && HIST)) return false;           // lance da carreira / cena da história
  return true;
}
function lchChefePerto() {
  let melhor = null, dm = 9;
  for (const m of G.mons) {
    if (!lchChefe(m) || m.d.ceEco || m._lchFeito || !m.bravo || !(m.hp > 0) || m.hp > m.d.hp * LCH_PCT) continue;
    const d = Math.hypot(m.x - G.p.x, m.y - G.p.y); if (d < dm) { dm = d; melhor = m; }
  }
  return melhor;
}
function lchPasso() {
  const agora = performance.now(), c = LCH.convite;
  if (c) {
    const m = c.m;
    if (agora > c.ate || G.mapa !== c.mapa || !G.mons.includes(m) || !(m.hp > 0) || !lchPodeLance() || Math.hypot(m.x - G.p.x, m.y - G.p.y) > 12) lchFechaConvite();
    return;
  }
  if (agora < LCH.tChk) return; LCH.tChk = agora + 250;
  if (G.pausado || !lchPodeLance()) return;
  const m = lchChefePerto(); if (m) lchAbreConvite(m);
}
{ const _atuLch = atualiza; atualiza = function () { const r = _atuLch.apply(this, arguments); try { lchPasso(); } catch (e) { } return r; }; }
function lchAbreConvite(m) {
  m._lchFeito = true; // um convite por chefão
  LCH.convite = { m, mapa: G.mapa, ate: performance.now() + LCH_CONVITE_MS };
  let b = document.getElementById('lchConvite');
  if (!b) { b = el('button', { id: 'lchConvite', type: 'button', onclick: ev => { ev.stopPropagation(); lchAbreLance(); } }); document.body.append(b); }
  const tecla = typeof teclaDaAcao === 'function' ? teclaDaAcao('interagir') : 'E';
  b.innerHTML = '';
  b.append(el('b', {}, lchCelular() ? '⚽ Hora do lance! Toque aqui' : `⚽ Hora do lance! (${tecla})`), el('small', {}, `Chute contra o goleiro ${m.d.nome}`));
  b.classList.remove('on'); void b.offsetWidth; b.classList.add('on');
  try { som('apito'); } catch (e) { }
  try { texto(m, '⚽ HORA DO LANCE!', '#ffe14a', 1600, -0.9); } catch (e) { }
}
function lchFechaConvite() { LCH.convite = null; const b = document.getElementById('lchConvite'); if (b) b.classList.remove('on'); }
{ // E (falar/usar) com o convite na tela abre o lance (teclado, botão 💬 do celular e controle chamam interagir)
  const _intLch = interagir;
  interagir = function () { if (LCH.convite && !G.pausado) { lchAbreLance(); return; } return _intLch.apply(this, arguments); };
}
// o goleiro: o próprio desenho do chefão, recortado uma vez (cópia sem aura/brilho de chefe)
function lchRetratoChefe(m) {
  if (m._lchImg) return m._lchImg;
  let img = null;
  try {
    const h0 = Math.max(24, alturaEnt(m) * T), W = Math.ceil(h0 * 3), H = Math.ceil(h0 * 1.7), oc = mkCanvas(W, H), o = oc.getContext('2d');
    const e = Object.create(m); e.hp = 0; e.hitT = 0; e.golpe = 0; e.mov = false; e.flip = false; e.dash = null; // hp 0: sem aura de chefão (chefes_vivos.js) nem anel de NPC
    o.translate(W / 2 - m.x * T, H * 0.94 - m.y * T); desenhaEnt(o, e);
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    try { const px = o.getImageData(0, 0, W, H).data; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (px[(y * W + x) * 4 + 3] > 90) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } } catch (er) { x0 = 0; y0 = 0; x1 = W - 1; y1 = H - 1; }
    if (x1 > x0 + 4 && y1 > y0 + 4) { img = mkCanvas(x1 - x0 + 1, y1 - y0 + 1); img.getContext('2d').drawImage(oc, -x0, -y0); }
  } catch (e) { img = null; }
  if (!img) { try { img = mkCanvas(110, 140); pintaAparencia(img, m.d.look, {}); } catch (e) { img = null; } }
  if (img && img.width > 4) m._lchImg = img;
  return img;
}
// geometria do minijogo (mesma tela do pênalti: 640×400, vista de trás do batedor)
const LCHJ = { W: 640, H: 400, gol: { x1: 150, x2: 490, y1: 92, y2: 226 }, cx: 320, meia: 170, spot: { x: 320, y: 352 }, canto: 0.78, alcance: 0.95, alcanceMeio: 0.45 };
// onde está o goleiro (−1 = canto esquerdo … +1 = direito): balança de um lado para o outro, num ritmo que muda um pouco
const lchGoleiroX = (L, t) => { const dt = t - L.t0; return 0.62 * Math.sin(L.fase0 + dt * 0.00273 + 0.6 * Math.sin(dt / 900)); };
function lchAbreLance() {
  const c = LCH.convite; lchFechaConvite(); if (!c) return;
  const m = c.m; if (!G.mons.includes(m) || !(m.hp > 0) || G.pausado || !lchPodeLance()) return;
  // golpes com aviso no chão ficariam "atrasados" com o jogo parado: somem (nunca prejudicar quem aceitou o lance)
  if (Array.isArray(G.teleArena)) G.teleArena = []; if (Array.isArray(G.magAdv)) G.magAdv = [];
  const cv = el('canvas', { id: 'cvLance', width: LCHJ.W, height: LCHJ.H }), ctx = cv.getContext('2d');
  const passo = el('p', { class: 'pn-passo' }), acoes = el('div', { class: 'opcoes lch-botoes' });
  const L = { m, cv, ctx, passo, fase: 'mira', t0: performance.now(), fase0: Math.random() * Math.PI * 2, mira: 0, chute: null, res: null, raf: 0, gk: lchRetratoChefe(m), eu: typeof lookJogador === 'function' ? lookJogador() : null };
  LCH.lance = L; document.body.classList.add('lch-on'); // (a barra do chefão fica por cima das janelas: some durante o lance)
  passo.textContent = lchCelular() ? 'O goleiro balança de um lado para o outro. Toque no canto VAZIO!' : 'O goleiro balança de um lado para o outro. Chute no canto VAZIO: ← ou → (↑ no meio), ou clique no canto.';
  const bt = (txt, dir) => el('button', { class: 'btn amarelo', type: 'button', onclick: ev => { ev.stopPropagation(); lchChuta(L, dir); } }, txt);
  acoes.append(bt('⬅ Canto esquerdo', -1), bt('⬆ No meio', 0), bt('Canto direito ➡', 1));
  const zona = ev => { const r = cv.getBoundingClientRect(), p = ev.touches ? (ev.touches[0] || ev.changedTouches[0]) : ev, x = (p.clientX - r.left) * LCHJ.W / r.width; return x < 262 ? -1 : x > 378 ? 1 : 0; };
  cv.addEventListener('mousemove', ev => { if (L.fase === 'mira') L.mira = zona(ev); });
  cv.addEventListener('click', ev => lchChuta(L, zona(ev)));
  cv.addEventListener('touchstart', ev => { ev.preventDefault(); lchChuta(L, zona(ev)); }, { passive: false });
  window.teclaModal = ev => {
    if (ev.repeat) return;
    const k = ev.key, dir = { ArrowLeft: -1, a: -1, A: -1, ArrowRight: 1, d: 1, D: 1, ArrowUp: 0, w: 0, W: 0 }[k];
    if (dir !== undefined) { ev.preventDefault(); lchChuta(L, dir); return; }
    if (k === ' ' || k === 'Enter' || k === 'e' || k === 'E') { ev.preventDefault(); lchChuta(L, L.mira); }
  };
  setTimeout(() => { if (LCH.lance === L && L.fase === 'mira') { L.fase = 'res'; L.res = 'tempo'; L.tRes = performance.now(); setTimeout(() => lchFimLance(L), 1300); } }, LCH_TEMPO_MS);
  abreModal.largo = true;
  abreModal(el('h2', {}, '⚽ Hora do lance!'), el('div', { class: 'penalti-wrap pn-novo lch-lance' }, cv, passo, acoes),
    el('p', { class: 'vazio' }, `Um contra um com ${m.d.nome} no gol. Fez o gol, ele cai na hora! Errou? Sem problema: a partida continua.`));
  const quadro = () => { if (LCH.lance !== L) return; if (!cv.isConnected) { if (LCH.lance === L) { LCH.lance = null; document.body.classList.remove('lch-on'); } return; } try { lchDesenhaLance(L, performance.now()); } catch (e) { } L.raf = requestAnimationFrame(quadro); };
  L.raf = requestAnimationFrame(quadro);
  try { lchDesenhaLance(L, performance.now()); } catch (e) { }
}
function lchChuta(L, dir) {
  if (LCH.lance !== L || L.fase !== 'mira') return;
  if (performance.now() - L.t0 < 250) return; // o mesmo aperto que abriu o lance não chuta sozinho
  const t = performance.now(), k = lchGoleiroX(L, t), bx = dir * LCHJ.canto;
  const defende = Math.abs(k - bx) < (dir === 0 ? LCHJ.alcanceMeio : LCHJ.alcance);
  const kAlvo = defende ? bx : k + Math.sign((bx - k) || 1) * 0.3; // o goleiro sempre pula para o lado da bola; no gol, não alcança
  L.fase = 'voo'; L.res = defende ? 'defesa' : 'gol'; L.chute = { t, dir, k0: k, kAlvo, tx: LCHJ.cx + bx * LCHJ.meia, ty: LCHJ.gol.y1 + (dir === 0 ? 34 : 26) };
  try { som('chute'); } catch (e) { }
  setTimeout(() => {
    if (LCH.lance !== L) return;
    L.fase = 'res'; L.tRes = performance.now();
    try { som(L.res === 'gol' ? 'gol' : 'toque'); } catch (e) { }
    setTimeout(() => lchFimLance(L), 1300);
  }, 480);
}
function lchFimLance(L) {
  if (LCH.lance !== L) return; // a janela foi fechada antes (X / Esc): nada acontece, a luta continua
  const m = L.m, ok = L.res === 'gol';
  LCH.lance = null; cancelAnimationFrame(L.raf); document.body.classList.remove('lch-on');
  if (L.cv.isConnected) fechaModal();
  if (ok) lchGolLance(m);
  else {
    log(L.res === 'tempo' ? `⚽ O tempo do lance acabou. A partida continua: você ainda pode vencer ${m.d.nome}!` : `🧤 ${m.d.nome} defendeu! A partida continua: você ainda pode vencer do jeito normal.`, 'l-info');
    try { if (G.mons.includes(m)) texto(m, L.res === 'tempo' ? 'Segue o jogo!' : 'DEFENDEU!', '#8ae8ff', 1200, -0.9); } catch (e) { }
  }
}
function lchGolLance(m) {
  const s = G.save, d = m.d;
  if (!G.mons.includes(m) || !(m.hp > 0)) return; // ele já tinha caído
  // bônus pequeno, só do próprio chefão: +25% dos tostões médios dele e +10% da XP dele (sem fonte de poder nova)
  const ouroB = Math.round(((d.ouro && d.ouro.length ? (d.ouro[0] + d.ouro[1]) / 2 : 0) || 0) * 0.25), xpB = Math.round((d.xp || 0) * 0.10);
  LCH.subProx = '⚽ Lance decisivo! O chefão caiu!';
  try { texto(m, 'GOL!', '#ffd60a', 1200, -0.6); } catch (e) { }
  m.hp = 0; matar(m);
  if (ouroB > 0) s.ouro += ouroB;
  if (xpB > 0) ganhaXp(xpB);
  s.st.lancesChefe = (s.st.lancesChefe || 0) + 1;
  log(`⚽ Lance decisivo: GOL em cima de ${d.nome}!${ouroB || xpB ? ` Bônus: ${[ouroB ? `+${ouroB} tostões` : '', xpB ? `+${xpB} XP` : ''].filter(Boolean).join(' e ')}.` : ''}`, 'l-lvl');
  G.uiSujo = true;
}
{ // fechar a janela (X, Esc, outra janela por cima) no meio do lance: nada acontece, a luta continua
  const _fmLch = fechaModal;
  fechaModal = function () { const L = LCH.lance; if (L) { LCH.lance = null; cancelAnimationFrame(L.raf); } document.body.classList.remove('lch-on'); return _fmLch.apply(this, arguments); };
}
// ---- desenho do minijogo ----
let LCH_TORCIDA = null;
function lchDesenhaLance(L, t) {
  const ctx = L.ctx, { W, H, gol, cx, meia } = LCHJ, { x1, x2, y1, y2 } = gol;
  if (!LCH_TORCIDA) { LCH_TORCIDA = mkCanvas(W, 100); const x = LCH_TORCIDA.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 100); g.addColorStop(0, '#1d1242'); g.addColorStop(1, '#3d2a80'); x.fillStyle = g; x.fillRect(0, 0, W, 100);
    const cores = ['#ff5a4d', '#ffd60a', '#ffffff', '#4f82ff', '#06d6a0', '#ff8ccb', '#ffb86f'];
    for (let f = 0; f < 7; f++) for (let i = 0; i < 70; i++) { x.fillStyle = cores[(i * 7 + f * 3) % cores.length]; x.globalAlpha = 0.55 + ((i * 13 + f) % 5) / 12; x.beginPath(); x.arc(i * 9.3 + (f % 2) * 4 + 3, 8 + f * 11, 3.4, 0, 7); x.fill(); }
    x.globalAlpha = 1; }
  ctx.clearRect(0, 0, W, H);
  const festa = L.fase === 'res' && L.res === 'gol';
  ctx.drawImage(LCH_TORCIDA, 0, festa ? Math.sin(t / 60) * 2 : 0);
  ctx.fillStyle = '#e60000'; ctx.fillRect(0, 84, W, 12); ctx.font = '800 10px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
  for (let i = 0; i < 4; i++) ctx.fillText('⚽ HORA DO LANCE ⚽', i * 160 + 80, 93);
  for (let i = 0; i < 12; i++) { const a = 96 + i * i * 2.2, b = 96 + (i + 1) * (i + 1) * 2.2; ctx.fillStyle = i % 2 ? '#48b052' : '#3fa34a'; ctx.fillRect(0, a, W, b - a + 1); }
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(0, y2); ctx.lineTo(W, y2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(110, y2); ctx.lineTo(80, 300); ctx.lineTo(560, 300); ctx.lineTo(530, y2); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(LCHJ.spot.x, LCHJ.spot.y + 8, 5, 2.5, 0, 0, 7); ctx.fill();
  // rede
  const ch = L.chute, rip = festa ? { x: ch.tx, y: ch.ty, k: clamp((t - L.tRes) / 700, 0, 1) } : null;
  const bojo = (x, y) => { if (!rip || rip.k >= 1) return 0; const d = Math.hypot(x - rip.x, y - rip.y); return Math.exp(-d * d / 1800) * 14 * Math.sin(rip.k * Math.PI); };
  ctx.fillStyle = 'rgba(20,40,20,0.35)'; ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
  ctx.strokeStyle = 'rgba(240,245,255,0.55)'; ctx.lineWidth = 1;
  for (let x = x1 + 8; x < x2; x += 10) { ctx.beginPath(); let p = true; for (let y = y1 + 4; y <= y2; y += 6) { const b = bojo(x, y), py = y - b * 0.6; if (p) { ctx.moveTo(x, py); p = false; } else ctx.lineTo(x, py); } ctx.stroke(); }
  for (let y = y1 + 8; y < y2; y += 10) { ctx.beginPath(); let p = true; for (let x = x1 + 2; x <= x2 - 2; x += 6) { const b = bojo(x, y), py = y - b * 0.9; if (p) { ctx.moveTo(x, py); p = false; } else ctx.lineTo(x, py); } ctx.stroke(); }
  // canto vazio brilhando (ajuda quem ainda está aprendendo a "ler" o goleiro)
  const kAgora = L.fase === 'mira' ? lchGoleiroX(L, t) : ch ? ch.k0 : 0;
  if (L.fase === 'mira') for (const lado of [-1, 1]) {
    const aberto = clamp((lado < 0 ? kAgora - 0.17 : -kAgora - 0.17) / 0.3, 0, 1); if (aberto <= 0) continue;
    const gx = cx + lado * LCHJ.canto * meia, gy = y1 + 30, pul = 1 + Math.sin(t / 140) * 0.12;
    const gr = ctx.createRadialGradient(gx, gy, 2, gx, gy, 44 * pul); gr.addColorStop(0, `rgba(120,255,140,${0.75 * aberto})`); gr.addColorStop(1, 'rgba(120,255,140,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(gx, gy, 44 * pul, 0, 7); ctx.fill();
  }
  // mira do mouse (qual canto está escolhido)
  if (L.fase === 'mira' && !lchCelular()) { const mx = cx + L.mira * LCHJ.canto * meia, my = y1 + (L.mira === 0 ? 34 : 26); ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(mx, my, 15, 0, 7); ctx.stroke(); ctx.strokeStyle = '#ff2a2a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(mx, my, 15, 0, 7); ctx.stroke(); }
  // goleiro gigante (o chefão): balança; no chute, pula para o lado da bola
  let kx = kAgora, rot = 0, sobe = 0;
  if (ch) { const e = clamp((t - ch.t - 60) / 380, 0, 1), ee = 1 - Math.pow(1 - e, 3); kx = ch.k0 + (ch.kAlvo - ch.k0) * ee; const lado = Math.sign(ch.kAlvo - ch.k0); rot = lado * ee * (ch.dir === 0 ? 0.1 : 0.85); sobe = Math.sin(ee * Math.PI * 0.85) * (ch.dir === 0 ? 30 : 22); }
  const gxk = cx + kx * meia;
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(gxk, y2 + 2, 46, 9, 0, 0, 7); ctx.fill();
  const desenhaBolaJ = () => {
    let bx = LCHJ.spot.x, by = LCHJ.spot.y, r = 13, giro = 0;
    if (ch) {
      const k = clamp((t - ch.t) / 480, 0, 1);
      if (k < 1 || L.res === 'gol') { const kk = Math.min(1, k); bx = LCHJ.spot.x + (ch.tx - LCHJ.spot.x) * kk; by = LCHJ.spot.y + (ch.ty - LCHJ.spot.y) * kk - Math.sin(kk * Math.PI) * 30; r = 13 - 6 * kk; giro = kk * 14; if (k >= 1) by = Math.min(y2 - 6, ch.ty + Math.pow(clamp((t - ch.t - 480) / 500, 0, 1), 2) * 50); }
      else { const k2 = clamp((t - ch.t - 480) / 700, 0, 1.2); bx = ch.tx + (ch.dir || 1) * -40 * k2; by = ch.ty + 70 * k2 + k2 * k2 * 40; r = 7 + 2 * k2; giro = 14 + k2 * 8; }
    }
    if (typeof desenhaBola === 'function') desenhaBola(ctx, bx, by, r, giro); else { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bx, by, r, 0, 7); ctx.fill(); }
  };
  // traves (antes do goleiro: o gigante fica NA FRENTE do gol)
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#9aa0b0'; ctx.lineWidth = 1.5;
  ctx.fillRect(x1 - 7, y1 - 7, 7, y2 - y1 + 7); ctx.strokeRect(x1 - 7, y1 - 7, 7, y2 - y1 + 7);
  ctx.fillRect(x2, y1 - 7, 7, y2 - y1 + 7); ctx.strokeRect(x2, y1 - 7, 7, y2 - y1 + 7);
  ctx.fillRect(x1 - 7, y1 - 7, x2 - x1 + 14, 7); ctx.strokeRect(x1 - 7, y1 - 7, x2 - x1 + 14, 7);
  const bolaAtras = ch && L.res === 'gol' && t - ch.t > 380;
  if (bolaAtras) desenhaBolaJ();
  if (L.gk) {
    const im = L.gk, esc = Math.min(210 / im.width, 200 / im.height), w = im.width * esc, h = im.height * esc;
    const bal = L.fase === 'mira' ? Math.sin(t / 180) * 3 : 0;
    ctx.save(); ctx.translate(gxk, y2 + 4 - sobe - h * 0.45); ctx.rotate(rot); ctx.drawImage(im, -w / 2, -h * 0.55 + bal, w, h);
    ctx.fillStyle = '#ffd60a'; ctx.strokeStyle = '#3d2b3a'; ctx.lineWidth = 2; // luvas de goleiro
    for (const lx of [-w * 0.44, w * 0.44]) { ctx.beginPath(); ctx.arc(lx, -h * 0.05, 8, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
  if (!bolaAtras) desenhaBolaJ();
  // o batedor (você, de costas)
  try { if (L.eu && typeof spriteBoneco === 'function') { const corre = ch && t - ch.t < 300, spr = spriteBoneco(L.eu, 'costas', corre ? Math.floor((t - ch.t) / 90) % 4 : 0); if (spr) { const h = 150, w = h * spr.c.width / spr.c.height, k = ch ? clamp((t - ch.t) / 300, 0, 1) : 0; ctx.drawImage(spr.c, 262 + 30 * k - w / 2, H + 34 - 20 * k - h, w, h); } } } catch (e) { }
  // nome do goleiro + relógio do lance
  if (L.fase !== 'res') { ctx.textAlign = 'center'; ctx.font = "800 15px Nunito, sans-serif"; ctx.lineWidth = 4; ctx.strokeStyle = '#1d1242'; const nome = `🧤 Goleiro: ${L.m.d.nome}`;
    ctx.strokeText(nome, cx, 40); ctx.fillStyle = '#ffe3b0'; ctx.fillText(nome, cx, 40); }
  if (L.fase === 'mira') { const resta = clamp(1 - (t - L.t0) / LCH_TEMPO_MS, 0, 1); ctx.fillStyle = 'rgba(20,10,40,0.7)'; ctx.fillRect(170, 8, 300, 12); ctx.fillStyle = resta > 0.35 ? '#3ad86a' : '#ffb03a'; ctx.fillRect(172, 10, 296 * resta, 8); }
  // resultado
  if (L.fase === 'res') {
    const txt = L.res === 'gol' ? 'GOOOL!' : L.res === 'defesa' ? 'DEFENDEU!' : 'ACABOU O TEMPO!', cor = L.res === 'gol' ? '#ffd60a' : '#8ae8ff';
    const sub = L.res === 'gol' ? 'O chefão caiu!' : 'Sem problema: a partida continua!';
    const k = clamp((t - L.tRes) / 250, 0, 1);
    ctx.save(); ctx.translate(cx, 66); ctx.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k); ctx.textAlign = 'center';
    ctx.font = "700 52px Fredoka, 'Trebuchet MS', sans-serif"; ctx.lineWidth = 8; ctx.strokeStyle = '#1d1242'; ctx.strokeText(txt, 0, 0); ctx.fillStyle = cor; ctx.fillText(txt, 0, 0);
    ctx.font = "700 20px Fredoka, sans-serif"; ctx.lineWidth = 5; ctx.strokeText(sub, 0, 30); ctx.fillStyle = '#fff'; ctx.fillText(sub, 0, 30); ctx.restore();
    if (festa) for (let i = 0; i < 28; i++) { const a = i * 2.4 + (t - L.tRes) / 900, r = ((t - L.tRes) / 4 + i * 9) % 260; ctx.fillStyle = ['#ffd60a', '#ff5a4d', '#06d6a0', '#4f82ff', '#fff'][i % 5]; ctx.fillRect(cx + Math.cos(a) * r, 150 + Math.sin(a) * r * 0.6, 6, 3); }
  }
}

/* ============ 3) Placar de futebol nas missões de caça (só visual) ============ */
// cada 10 vitórias = 1 gol; missões com menos de 10 vitórias não mostram placar
function lchPlacar(a, n) {
  if (!(n >= 10)) return null;
  const meta = Math.ceil(n / 10), gols = a >= n ? meta : Math.floor(a / 10);
  return { gols, meta, txt: `⚽ ${gols} × 0`, dica: `Placar da caçada: cada 10 vitórias = 1 gol (meta: ${meta} gol${meta > 1 ? 's' : ''})` };
}
const lchAtivasCaca = () => (typeof MISSOES === 'undefined' || !G.save) ? [] : MISSOES.filter(q => q.req && q.req.kill && G.save.quests[q.id] && G.save.quests[q.id].s === 'ativa');
const lchSpanPlacar = p => el('span', { class: 'lch-placar', title: p.dica }, p.txt);
function lchPlacarRastreador() {
  const R = document.getElementById('rastreador'); if (!R || !G.save) return;
  const ativas = lchAtivasCaca();
  for (const card of R.querySelectorAll('.rast-q')) {
    if (card.querySelector('.lch-placar')) continue;
    const b = card.querySelector('b'), q = b && ativas.find(x => x.titulo === b.textContent); if (!q) continue;
    const [a, n] = progressoMissao(q), p = lchPlacar(a, n); if (!p) continue;
    const onde = card.querySelector('.rast-onde'); if (onde) onde.before(lchSpanPlacar(p)); else card.append(lchSpanPlacar(p));
  }
  const t = G.save.tarefa; // desafio do Quadro de Desafios
  if (t && t.n) for (const card of R.querySelectorAll('.rast:not(.rast-q)')) if (/^Desafio:/.test(card.textContent) && !card.querySelector('.lch-placar')) { const p = lchPlacar(t.p || 0, t.n); if (p) card.append(lchSpanPlacar(p)); }
}
{ const _rastLch = atualizaRastreador; atualizaRastreador = function () { const r = _rastLch.apply(this, arguments); try { lchPlacarRastreador(); } catch (e) { } return r; }; }
if (typeof objetivoTexto === 'function') { // o "🎯 Agora:" (objetivo_agora.js) também ganha o placar
  const _objLch = objetivoTexto;
  objetivoTexto = function () {
    const o = _objLch.apply(this, arguments);
    // v412: a 1ª missão ativa pelo statusMissao (com uma 📌 acompanhada, é ela — missao_fixa.js), e só se for de vencer
    try { if (o && !o.pronta) { const q = MISSOES.find(x => statusMissao(x) === 'ativa'); if (q && q.req && q.req.kill) { const [a, n] = progressoMissao(q), p = lchPlacar(a, n); if (p) o.txt += ` · ${p.txt}`; } } } catch (e) { }
    return o;
  };
}
{ const _mmLch = modalMissoes; modalMissoes = function () {
    const r = _mmLch.apply(this, arguments);
    try {
      const box = document.getElementById('modalConteudo'), ativas = lchAtivasCaca();
      if (box && ativas.length) for (const li of box.querySelectorAll('.linha-item')) {
        const b = li.querySelector('.nm b'), sm = li.querySelector('.nm small'); if (!b || !sm || li.querySelector('.lch-placar')) continue;
        const q = ativas.find(x => b.textContent.endsWith(x.titulo)); if (!q) continue;
        const [a, n] = progressoMissao(q), p = lchPlacar(a, n); if (p) sm.append(' ', lchSpanPlacar(p));
      }
    } catch (e) { }
    return r;
  };
}

/* ============ ⚙️ Configurações › 🎮 Jogo: ligar/desligar ============ */
if (typeof opcConteudo === 'function' && typeof opcChave === 'function') {
  const _opcLch = opcConteudo;
  opcConteudo = function (aba) {
    const c = _opcLch.apply(this, arguments);
    try {
      if (aba === 'jogo') {
        const nos = [opcTit('⚽ Futebol nos chefões'),
          opcChave('Comemoração de GOL', 'Ao vencer um chefão aparece um "GOOOL!" rapidinho, com torcida e confete (não para o jogo).', OPC.golChefe !== false, v => { OPC.golChefe = v; opcGrava(); }),
          opcChave('Hora do lance', 'Quando um chefão está quase cansado, você pode tentar um gol 1×1 contra ele. Errar não tira nada.', OPC.lanceChefe !== false, v => { OPC.lanceChefe = v; opcGrava(); if (!v) lchFechaConvite(); })];
        const rod = c.querySelector('.opc-rodape'); if (rod) rod.before(...nos); else c.append(...nos);
      }
    } catch (e) { }
    return c;
  };
}

{
  const css = document.createElement('style');
  css.textContent = `#lchConvite { position: fixed; left: 50%; bottom: 150px; transform: translate(-50%, 20px) scale(.9); opacity: 0; pointer-events: none; z-index: 46;
    display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 9px 20px; border-radius: 18px; border: 3px solid #1a5a2a; cursor: pointer;
    background: linear-gradient(#c8ffd8, #3ad86a); color: #10301a; box-shadow: 0 4px 0 #1a6a3a, 0 8px 22px rgba(0,0,0,.4); transition: opacity .25s, transform .25s; touch-action: manipulation; }
  #lchConvite.on { opacity: 1; pointer-events: auto; transform: translate(-50%, 0) scale(1); animation: lchPulsa .9s ease-in-out infinite alternate; }
  #lchConvite b { font: 900 19px Fredoka, Nunito, sans-serif; white-space: nowrap; }
  #lchConvite small { font: 800 11.5px Nunito, sans-serif; opacity: .8; }
  #lchConvite:active { transform: translate(-50%, 3px) scale(1); box-shadow: 0 1px 0 #1a6a3a; }
  body.modo-celular #lchConvite { bottom: calc(200px + env(safe-area-inset-bottom)); padding: 12px 22px; }
  body.modo-celular #lchConvite b { font-size: 21px; }
  @keyframes lchPulsa { from { box-shadow: 0 4px 0 #1a6a3a, 0 0 0 0 rgba(255,225,74,.0); } to { box-shadow: 0 4px 0 #1a6a3a, 0 0 0 7px rgba(255,225,74,.75); } }
  @media (prefers-reduced-motion: reduce) { #lchConvite.on { animation: none; } }
  body.lch-on #chefeBarra { display: none; }
  body:has(#modal:not([hidden])) #chefeBarra { display: none; } /* (a barra do chefão, z-index 59, ficava por cima de QUALQUER janela aberta perto de um chefão) */
  .lch-lance canvas { cursor: pointer; }
  .lch-botoes { justify-content: center; flex-wrap: wrap; gap: 8px; }
  .lch-botoes .btn { min-width: 150px; font-size: 16px; }
  body.modo-celular .lch-botoes { flex-wrap: nowrap; gap: 5px; }
  body.modo-celular .lch-botoes .btn { min-width: 0; flex: 1 1 30%; font-size: 13.5px; padding: 12px 4px; }
  .lch-placar { display: inline-block; margin: 2px 0 0 6px; padding: 0 7px; border-radius: 9px; background: #1d5a2a; color: #fff; font-weight: 900; font-size: 11.5px; line-height: 18px; white-space: nowrap; box-shadow: inset 0 0 0 1.5px #ffe14a; }`;
  document.head.append(css);
}
