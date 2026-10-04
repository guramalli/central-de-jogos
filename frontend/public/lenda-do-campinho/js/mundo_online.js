/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🌐 MUNDO COMPARTILHADO — "MMO leve", etapa 1 (v381; dono: "um MMO leve seria legal")
   Nas cidades e centros (não nas caças, casas, arenas e Torre) você vê os outros jogadores que estão no mesmo mapa, andando
   com o personagem deles. Cada mapa tem "canais" de até 25 (os amigos caem no mesmo canal).
   - Sem texto livre (público infantil): a conversa são 8 EMOTES e 16 FRASES PRONTAS (botão 💬 no canto do chat, ou tecla Y;
     v382, dono: "não deixe o botão fixo"). Na lista de quem está aqui: ➕ pedir amizade.
   - Ninguém atrapalha ninguém: os outros não bloqueiam o caminho, não dá para clicar neles nem brigar.
   - 🔇 silenciar alguém (só para você) e "🙈 esconder os outros" no painel 💬.
   - Só com a conta do site (o servidor confere o login). Steam: desligado (lá não tem conta do site).
   Servidor: eventos "mundo-*" (backend src/lenda/socketMundo.js). Carregar DEPOIS de torre_coop.js.
   ============================================================ */
const MO = { sock: null, carregando: null, mapa: null, canal: 0, entrando: null, outros: new Map(), tEu: 0, ultimoEu: '', tPerfil: 0, perfilTxt: '' };
const MO_LIBERADO = true; // (v381: servidor "mundo-*" no ar)
const MO_EMOTES = ['👋', '👍', '👏', '⚽', '🔥', '😂', '😮', '🎉'];
const MO_FRASES = ['Oi! 👋', 'Bora caçar?', 'Valeu! 🙏', 'Boa! ⚽', 'Me segue!', 'Espera aí!', 'Tchau! 👋', 'Que legal!',
  'Parabéns! 🎉', 'Vou para a loja', 'Vou para a caça', 'Onde fica isso?', 'Sim 👍', 'Não 👎', 'Haha 😂', 'Bom jogo!'];
const MO_TESTE = (() => { try { return localStorage.getItem('rac_mundo_teste'); } catch (e) { return null; } })(); // (testes: endereço de um servidor local)
const moLe = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const moGrava = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
let MO_ESCONDE = moLe('rac_mundo_esconde', false), MO_MUDOS = new Set(moLe('rac_mundo_mudos', []));
const moLigado = () => (MO_LIBERADO || !!MO_TESTE) && typeof PORTAL !== 'undefined' && (PORTAL.ativo || !!MO_TESTE) && !!PORTAL.token && !window.LENDA_STEAM;
const moApi = () => MO_TESTE || PORTAL.api;
// mapa compartilhado: cidades e centros (Vila, Rio, Tóquio, Estação, Multiverso...). Fora: casas por dentro, caças,
// andares da Torre, arenas de chefão e partidas. (Cada um enfrenta os SEUS adversários: os dos outros não aparecem.)
function moPublico(m) {
  if (!m || m.interior || m.torre || m.caca) return false;
  if (typeof CACA_POR_ID !== 'undefined' && CACA_POR_ID[m.id]) return false;
  return !/^(arena_|casa_|jogo_|torre_|vale_z\d|jur_labirinto|jur_trex)/.test(m.id); // (zonas do Vale e do Jurássico = caça)
}
function moPerfil() { let look = null; try { look = lookJogador(); } catch (e) { } return { nivel: G.save.nivel, look }; }

/* ---------- conexão ---------- */
function moCarregaCliente() {
  if (window.io) return Promise.resolve();
  if (MO.carregando) return MO.carregando;
  return MO.carregando = new Promise((ok, erro) => { const s = document.createElement('script'); s.src = moApi() + '/socket.io/socket.io.js'; s.onload = ok; s.onerror = () => { MO.carregando = null; erro(new Error('sem servidor')); }; document.head.append(s); });
}
async function moConecta() {
  if (MO.sock && MO.sock.connected) return MO.sock;
  await moCarregaCliente();
  if (!MO.sock) {
    MO.sock = window.io(moApi(), { auth: { token: PORTAL.token }, transports: ['websocket'] });
    moEscuta(MO.sock);
  }
  if (!MO.sock.connected) await new Promise((ok, erro) => { const t = setTimeout(() => erro(new Error('tempo')), 8000); MO.sock.once('connect', () => { clearTimeout(t); ok(); }); MO.sock.once('connect_error', e => { clearTimeout(t); erro(e); }); });
  return MO.sock;
}
function moEscuta(s) {
  s.on('mundo-chegou', mb => moPoe(mb));
  s.on('mundo-saiu', ({ id }) => moTira(id));
  s.on('mundo-top', ids => { MO.top = (ids || []).map(String); moRenomeia(); for (let k = 1; k <= 3; k++) spr('louro_' + k); });
  s.on('mundo-perfil', mb => { const o = MO.outros.get(mb.id); if (o) { o.guilda = mb.guilda; o.nivel = mb.nivel; o.ent.d.look = moLook(mb.look); o.ent.d.nome = moNome(mb); try { preCarrega(o.ent.d.look); } catch (e) { } } });
  s.on('mundo-pos', lista => { for (const [id, x, y, f, m, fa, v] of lista || []) { const o = MO.outros.get(id); if (!o) continue; o.ent.alvo = { x, y }; o.ent.flip = !!f; o.ent.mov = !!m; o.ent.fase = fa; o.ent.vista = MO_VISTAS[v] || 'frente'; o.ent.tVista = G.agora; o.t = Date.now(); } });
  s.on('mundo-emote', ({ de, i }) => moMostra(de, MO_EMOTES[i], true));
  s.on('mundo-frase', ({ de, i }) => moMostra(de, MO_FRASES[i], false));
  s.on('connect', () => { if (MO.mapa) { const m = MO.mapa; MO.mapa = null; moEntra(m); } }); // voltou depois de cair
  s.on('disconnect', () => moLimpa());
}

/* ---------- os outros na tela ---------- */
const moLook = l => l && l.tipo === 'humano' ? l : { tipo: 'humano', corpo: 'm', pele: 'pele-morena', cabelo: 'cabelo-curto', roupa: 'roupa-camiseta', baixo: 'baixo-shorts' };
const MO_VISTAS = ['frente', 'costas', 'lado'];
// v382: escudo da guilda na frente do nome. Os 3 primeiros do ranking de XP: v384 (dono: "o emblema ficou ruim... um louro
// acima do nick e do jogador e o número do ranking... levemente translúcido") → coroa de louros (ouro/prata/bronze, arte
// a/louro_1..3) em cima do nome, com o número no meio (moLouro)
const moRank = id => (MO.top || []).indexOf(String(id).replace(/^grupo_/, '')) + 1; // 0 = fora do top 3 (colega de grupo: "grupo_<id>")
// v384b (dono: "apareceu na praia mas em outros mapas não"): o top 3 vem do ranking público (ao abrir e a cada 5 min), não
// só ao entrar numa cidade — e o SEU louro aparece em qualquer mapa (caças, casas, arenas)
async function moBuscaTop() {
  if (typeof PORTAL === 'undefined' || !PORTAL.ativo || window.LENDA_STEAM) return;
  try {
    const r = await fetch(PORTAL.api + '/api/lenda/ranking'); if (!r.ok) return;
    const lista = await r.json(); if (!Array.isArray(lista)) return;
    MO.top = lista.slice(0, 3).map(x => String(x.userId)); for (let k = 1; k <= 3; k++) spr('louro_' + k);
  } catch (e) { }
}
setTimeout(moBuscaTop, 8000); setInterval(moBuscaTop, 5 * 60000);
const moNome = mb => `${mb.guilda && mb.guilda.escudo ? mb.guilda.escudo + ' ' : ''}Nv ${mb.nivel} · ${mb.apelido}`;
const MO_LOURO_COR = ['#ffe27a', '#eef3fa', '#ffb27a'];
function moLouro(ctx, rank, x, yBase) { // yBase = em cima do nome (coordenadas de tela)
  const s = typeof spr === 'function' ? spr('louro_' + rank) : null; if (!s || !s.ok) return;
  const px = G.dpr, w = 34 * px, h = w * s.im.height / s.im.width, y = yBase - h;
  ctx.save(); ctx.globalAlpha = 0.78;
  ctx.drawImage(s.im, x - w / 2, y, w, h);
  ctx.font = `800 ${13 * px}px Fredoka, Nunito, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 3 * px; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(30,18,40,0.85)'; ctx.strokeText(String(rank), x, y + h * 0.47);
  ctx.fillStyle = MO_LOURO_COR[rank - 1]; ctx.fillText(String(rank), x, y + h * 0.47);
  ctx.restore();
}
function moRenomeia() { for (const [id, o] of MO.outros) o.ent.d.nome = moNome({ id, apelido: o.apelido, nivel: o.nivel, guilda: o.guilda }); }
function moPoe(mb) {
  if (!mb || !mb.id || mb.id === PORTAL.contaId) return;
  const look = moLook(mb.look); try { preCarrega(look); } catch (e) { }
  const x = +mb.x || (G.p ? G.p.x : 0), y = +mb.y || (G.p ? G.p.y : 0);
  const ent = { id: 'mundo_' + mb.id, mundo: mb.id, coop: 'mundo', d: { nome: moNome(mb), look, ola: '' }, x, y, alvo: { x, y }, flip: !!mb.f, r: 0.32, fase: +mb.fa || 0, mov: !!mb.m, vista: MO_VISTAS[mb.v] || 'frente', tVista: G.agora };
  MO.outros.set(mb.id, { ent, apelido: mb.apelido, nivel: mb.nivel, guilda: mb.guilda, t: Date.now() });
}
function moTira(id) { MO.outros.delete(id); }
function moLimpa() { MO.outros.clear(); }
// v384 (dono: "o texto está aparecendo por cima do nick, mal dá para ver"): frase e emote viram um BALÃO DE FALA acima do
// nome (e do louro), desenhado junto da plaquinha (moBalaoDesenha)
MO.baloes = new Map(); // id (ou 'eu') -> { txt, t0, dur, emote }
function moBalao(id, txt, emote) { if (!txt) return; MO.baloes.set(String(id), { txt, t0: performance.now(), dur: emote ? 2600 : 4500, emote: !!emote }); }
function moMostra(de, txt, emote) {
  if (!txt) return;
  const eu = de === PORTAL.contaId, o = MO.outros.get(de);
  if (!eu && (!o || MO_ESCONDE || MO_MUDOS.has(de))) return;
  moBalao(eu ? 'eu' : de, txt, emote);
}
function moBalaoDesenha(ctx, id, x, yBase) { // yBase = em cima do nome/louro (tela)
  const b = MO.baloes.get(String(id)); if (!b) return;
  const t = performance.now() - b.t0; if (t > b.dur) { MO.baloes.delete(String(id)); return; }
  const px = G.dpr, tam = (b.emote ? 20 : 12.5) * px;
  ctx.save(); ctx.globalAlpha = t > b.dur - 400 ? Math.max(0, (b.dur - t) / 400) : 1;
  ctx.font = `700 ${tam}px Fredoka, Nunito, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(b.txt).width + 16 * px, h = tam + 10 * px, cy = yBase - 7 * px - h / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.96)'; ctx.strokeStyle = 'rgba(40,24,60,0.85)'; ctx.lineWidth = 1.6 * px;
  ctx.beginPath(); ctx.roundRect(x - w / 2, cy - h / 2, w, h, 9 * px); ctx.moveTo(x - 5 * px, cy + h / 2); ctx.lineTo(x, cy + h / 2 + 6 * px); ctx.lineTo(x + 5 * px, cy + h / 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.96)'; ctx.fillRect(x - 4 * px, cy + h / 2 - 2 * px, 8 * px, 3 * px); // (apaga o traço da base embaixo do bico)
  ctx.fillStyle = '#2a1a3a'; ctx.fillText(b.txt, x, cy + 0.5 * px);
  ctx.restore();
}
window.moBalao = moBalao;
const moVisiveis = () => MO_ESCONDE ? [] : [...MO.outros].filter(([id]) => !MO_MUDOS.has(id)).map(([, o]) => o.ent);

/* ---------- entrar/sair do mapa ---------- */
async function moEntra(id) {
  if (!moLigado() || !G.save || !G.p) return;
  const m = G.mapa; const publico = m && m.id === id && moPublico(m);
  if (MO.mapa === (publico ? id : null)) return;
  moLimpa();
  if (!publico) { MO.mapa = null; MO.canal = 0; if (MO.sock && MO.sock.connected) MO.sock.emit('mundo-sair', null, () => { }); return; }
  MO.mapa = id;
  try { await moConecta(); } catch (e) { MO.mapa = null; return; }
  if (MO.mapa !== id) return; // trocou de mapa enquanto conectava
  const p = G.p, r = await new Promise(ok => { const t = setTimeout(() => ok({ erro: 'tempo' }), 8000); MO.sock.emit('mundo-entrar', { mapa: id, perfil: moPerfil(), x: p.x, y: p.y, f: p.flip ? 1 : 0, m: 0, fa: 0 }, r2 => { clearTimeout(t); ok(r2 || {}); }); });
  if (MO.mapa !== id) return;
  if (!r.ok) { MO.mapa = null; return; }
  MO.canal = r.canal; if (r.top) { MO.top = r.top.map(String); for (let k = 1; k <= 3; k++) spr('louro_' + k); } moLimpa(); for (const mb of r.membros || []) moPoe(mb);
  if (MO.outros.size && !MO.avisou) { MO.avisou = true; log('🌐 Tem outros jogadores aqui! Para mandar um emote ou uma frase pronta: o botão 💬 no canto do chat (ou a tecla Y). Lá também dá para pedir amizade.', 'l-sis'); }
  MO.perfilTxt = JSON.stringify(moPerfil());
  moBotao();
}
{
  const _entMo = entrarMapa;
  entrarMapa = function (id) {
    const r = _entMo.apply(this, arguments);
    try { if (moLigado()) moEntra(G.mapa && G.mapa.id); } catch (e) { }
    return r;
  };
}

/* ---------- a cada quadro: manda a sua posição (só quando muda) e anda os outros ---------- */
{
  const _atuMo = atualiza;
  atualiza = function (dt) {
    const r = _atuMo.apply(this, arguments);
    try { if (MO.mapa && G.mapa && G.mapa.id === MO.mapa) moPasso(dt || 16); } catch (e) { }
    return r;
  };
}
function moPasso(dt) {
  const agora = Date.now(), p = G.p;
  if (MO.sock && MO.sock.connected && agora - MO.tEu > 140) {
    const d = { x: +p.x.toFixed(2), y: +p.y.toFixed(2), f: p.flip ? 1 : 0, m: p.mov ? 1 : 0, fa: +(p.fase || 0).toFixed(2), v: Math.max(0, MO_VISTAS.indexOf(p.vista || 'frente')) }, txt = JSON.stringify(d);
    if (txt !== MO.ultimoEu || agora - MO.tEu > 3000) { MO.tEu = agora; MO.ultimoEu = txt; MO.sock.emit('mundo-eu', d); }
  }
  if (MO.sock && MO.sock.connected && agora - MO.tPerfil > 5000) { // trocou de roupa / subiu de nível
    MO.tPerfil = agora; const pf = moPerfil(), txt = JSON.stringify(pf);
    if (txt !== MO.perfilTxt) { MO.perfilTxt = txt; MO.sock.emit('mundo-perfil', { perfil: pf }); }
  }
  const k = Math.min(1, dt / 110);
  for (const o of MO.outros.values()) {
    const e = o.ent, dx = e.alvo.x - e.x, dy = e.alvo.y - e.y;
    if (Math.hypot(dx, dy) > 6) { e.x = e.alvo.x; e.y = e.alvo.y; } else { e.x += dx * k; e.y += dy * k; } // (pulou longe: teletransporte)
  }
}

/* ---------- desenho: os outros entram na fila do desenho só na hora de desenhar (não bloqueiam nem conversam) ---------- */
{
  const _desMo = desenha;
  desenha = function () {
    return moDesenha.apply(this, arguments);
  };
  const moDesenha = function () {
    if (!MO.mapa || !MO.outros.size || !G.mapa || G.mapa.id !== MO.mapa) return _desMo.apply(this, arguments);
    const extra = moVisiveis(); if (!extra.length) return _desMo.apply(this, arguments);
    const antes = G.npcs; G.npcs = antes.concat(extra);
    try { return _desMo.apply(this, arguments); } finally { G.npcs = antes; }
  };
  const _intMo = interacaoPerto;
  interacaoPerto = function () { // ("Falar com Fulano" nunca aparece para um jogador)
    if (!G.npcs.some(n => n.mundo)) return _intMo.apply(this, arguments);
    const antes = G.npcs; G.npcs = antes.filter(n => !n.mundo);
    try { return _intMo.apply(this, arguments); } finally { G.npcs = antes; }
  };
}

// a plaquinha de um JOGADOR é azul e sem o 💬 (a dos personagens do jogo é verde: com eles dá para conversar)
{
  const _plMo = placaNPC;
  placaNPC = function (ctx, n, x, y, forte) {
    if (!n || !n.mundo) return _plMo.apply(this, arguments);
    const s = 11 * G.dpr; ctx.font = `700 ${s}px Fredoka, Nunito, sans-serif`;
    const txt = n.d.nome, w = ctx.measureText(txt).width + 14 * G.dpr, h = s + 8 * G.dpr, cy = y - h / 2 + 2 * G.dpr;
    ctx.globalAlpha = forte ? 1 : 0.8;
    ctx.fillStyle = 'rgba(14,38,86,0.88)'; ctx.strokeStyle = '#7ec8ff'; ctx.lineWidth = 1.5 * G.dpr;
    ctx.beginPath(); ctx.roundRect(x - w / 2, cy - h / 2, w, h, 4 * G.dpr); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e6f3ff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, cy + 0.5 * G.dpr);
    ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
    const rk = moRank(n.mundo), topo = cy - h / 2 - 1 * G.dpr; if (rk) moLouro(ctx, rk, x, topo);
    moBalaoDesenha(ctx, n.mundo, x, topo - (rk ? 34 * G.dpr * 0.96 : 0));
  };
  // e em cima do SEU nome (o jogo desenha "Nv N Nome" com rotulo)
  const _rotMo = rotulo;
  rotulo = function (ctx, txt, x, y, cor, tam) {
    const r = _rotMo.apply(this, arguments);
    try { if (G.save && PORTAL.contaId && !window.LENDA_STEAM && tam === 12.5 && txt === `Nv ${G.save.nivel} ${G.save.nome}`) { const rk = moRank(PORTAL.contaId), topo = y - tam * G.dpr - 2 * G.dpr; if (rk) moLouro(ctx, rk, x, topo); moBalaoDesenha(ctx, 'eu', x, topo - (rk ? 34 * G.dpr * 0.96 : 0)); } } catch (e) { }
    return r;
  };
}

/* ---------- painel 💬 ---------- */
function moFala(tipo, i) {
  if (!MO.sock || !MO.sock.connected || !MO.mapa) return;
  const agora = Date.now(); if (agora - (MO.tFala || 0) < 1200) return; MO.tFala = agora;
  MO.sock.emit(tipo === 'e' ? 'mundo-emote' : 'mundo-frase', { i });
}
async function moAmigosIds() { // quem já é amigo (ou tem pedido), para o botão ➕ (guardado 1 min)
  if (MO.amigos && Date.now() - MO.amigos.t < 60000) return MO.amigos.ids;
  const ids = new Set();
  try { const r = await fetch(PORTAL.api + '/api/friends', { headers: { Authorization: 'Bearer ' + PORTAL.token } }); const j = await r.json(); for (const k of ['friends', 'receivedPending', 'sentPending']) for (const a of j[k] || []) ids.add(String(a.userId)); } catch (e) { }
  MO.amigos = { t: Date.now(), ids }; return ids;
}
async function moPainel() {
  const amigos = MO.mapa ? await moAmigosIds() : new Set();
  if (!MO.mapa) return avisoJogo('🌐 Aqui é só seu: os outros jogadores aparecem nas cidades e nos centros (não nas caças, casas e arenas).');
  const n = MO.outros.size;
  const lista = [...MO.outros].sort((a, b) => a[1].apelido.localeCompare(b[1].apelido)).map(([id, o]) => el('div', { class: 'mo-pessoa' },
    el('span', {}, `${o.apelido} · Nv ${o.nivel}`),
    amigos.has(String(id)) ? el('small', {}, '🤝 amigo') : el('button', { class: 'btn mini', type: 'button', onclick: ev => { ev.target.disabled = true; typeof amgPedeAmizade === 'function' && amgPedeAmizade({ targetUserId: id }, ok => { if (ok) { MO.amigos = null; ev.target.textContent = '✅ Pedido enviado'; } else ev.target.disabled = false; }); } }, '➕ Amigo'),
    el('button', { class: 'btn mini', type: 'button', onclick: () => { MO_MUDOS.has(id) ? MO_MUDOS.delete(id) : MO_MUDOS.add(id); moGrava('rac_mundo_mudos', [...MO_MUDOS].slice(-300)); moPainel(); } }, MO_MUDOS.has(id) ? '🔈 Mostrar' : '🔇 Silenciar')));
  abreModal(el('h2', {}, '💬 Falar com quem está aqui'),
    el('p', { class: 'dica' }, `🌐 ${n} ${n === 1 ? 'jogador' : 'jogadores'} neste lugar (canal ${MO.canal}). Sem chat livre: escolha um emote ou uma frase.`),
    el('div', { class: 'mo-emotes' }, ...MO_EMOTES.map((e, i) => el('button', { type: 'button', onclick: () => { moFala('e', i); fechaModal(); } }, e))),
    el('div', { class: 'mo-frases' }, ...MO_FRASES.map((f, i) => el('button', { class: 'btn', type: 'button', onclick: () => { moFala('f', i); fechaModal(); } }, f))),
    el('label', { class: 'mo-esconde' }, el('input', { type: 'checkbox', checked: MO_ESCONDE, onchange: e => { MO_ESCONDE = e.target.checked; moGrava('rac_mundo_esconde', MO_ESCONDE); } }), ' 🙈 Esconder os outros jogadores'),
    n ? el('details', {}, el('summary', {}, `👥 Quem está aqui (${n})`), el('div', { class: 'mo-lista' }, ...lista)) : el('p', { class: 'vazio' }, 'Ninguém por aqui agora.'));
}
// v384 (dono: "o botão do chat está ficando na lista, tem que aparecer em algum local fixo na tela, mesmo que seja pequeno...
// pode ser no chat ali mesmo"): botãozinho 💬 no canto da caixa de chat (ao lado do ⤢); tecla Y continua
function moBotao() {
  if (document.getElementById('btnFalar')) return;
  const b = el('button', { class: 'btn mini', id: 'btnFalar', type: 'button', title: 'Falar com quem está aqui (Y): emotes e frases prontas' }, '💬'); b.onclick = moPainel;
  document.body.append(b);
}
function moPosBotao() {
  const b = document.getElementById('btnFalar'); if (!b) return;
  const L = document.getElementById('log'), on = !!(MO.mapa && G.rodando && L);
  if (!on) { b.style.display = 'none'; return; }
  const r = L.getBoundingClientRect(), cel = document.body.classList.contains('cel3') || document.body.classList.contains('modo-celular');
  const visivel = r.width > 0 && r.height > 20;
  Object.assign(b.style, { position: 'fixed', zIndex: 61, display: visivel ? '' : 'none', top: (r.top + 4) + 'px', left: (r.right - (cel ? 40 : 76)) + 'px' });
  b.textContent = MO.outros.size ? `💬 ${MO.outros.size}` : '💬';
}
setInterval(() => { try { moPosBotao(); } catch (e) { } }, 500);
window.addEventListener('resize', () => { try { moPosBotao(); } catch (e) { } });
document.addEventListener('keydown', e => {
  if (e.code !== 'KeyY' || e.repeat || e.ctrlKey || e.metaKey || e.altKey || !MO.mapa || !G.rodando) return;
  const a = document.activeElement; if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
  if (!document.getElementById('modal').hidden) return;
  moPainel();
});
{
  const css = document.createElement('style');
  css.textContent = `#btnFalar { padding: 1px 7px; font-size: 13px; line-height: 1.2; opacity: .9; } #btnFalar:hover { opacity: 1; }
  /* v384 (dono: "o botão de aumentar o chat fica sobreposto quando abrimos o menu Mais"): com o ☰ Mais aberto, os botões do canto do chat somem */
  body:has(.tb-lista:not([hidden])) #btnLogGrande, body:has(.tb-lista:not([hidden])) #btnFalar { display: none !important; }
  .mo-emotes { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; } .mo-emotes button { font-size: 24px; width: 46px; height: 42px; border: 0; border-radius: 10px; background: rgba(0,0,0,.07); cursor: pointer; }
  .mo-frases { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 6px; margin-bottom: 8px; }
  .mo-esconde { display: block; margin: 6px 0; font-weight: 700; } .mo-lista { display: flex; flex-direction: column; gap: 4px; max-height: 30vh; overflow: auto; }
  .mo-pessoa { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 4px 8px; border-radius: 8px; background: rgba(0,0,0,.05); font-weight: 700; }`;
  document.head.append(css);
}
window.MUNDO = { MO, moPublico, moEntra, MO_FRASES, MO_EMOTES };
