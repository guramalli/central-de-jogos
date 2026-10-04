/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🌐 MUNDO COMPARTILHADO — "MMO leve", etapa 1 (v381; dono: "um MMO leve seria legal")
   Nas cidades e centros (não nas caças, casas, arenas e Torre) você vê os outros jogadores que estão no mesmo mapa, andando
   com o personagem deles. Cada mapa tem "canais" de até 25 (os amigos caem no mesmo canal).
   - Sem texto livre (público infantil): a conversa são 8 EMOTES e 16 FRASES PRONTAS (botão 💬 ou tecla Y).
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
  s.on('mundo-perfil', mb => { const o = MO.outros.get(mb.id); if (o) { o.ent.d.look = moLook(mb.look); o.ent.d.nome = moNome(mb); try { preCarrega(o.ent.d.look); } catch (e) { } } });
  s.on('mundo-pos', lista => { for (const [id, x, y, f, m, fa, v] of lista || []) { const o = MO.outros.get(id); if (!o) continue; o.ent.alvo = { x, y }; o.ent.flip = !!f; o.ent.mov = !!m; o.ent.fase = fa; o.ent.vista = MO_VISTAS[v] || 'frente'; o.ent.tVista = G.agora; o.t = Date.now(); } });
  s.on('mundo-emote', ({ de, i }) => moMostra(de, MO_EMOTES[i], true));
  s.on('mundo-frase', ({ de, i }) => moMostra(de, MO_FRASES[i], false));
  s.on('connect', () => { if (MO.mapa) { const m = MO.mapa; MO.mapa = null; moEntra(m); } }); // voltou depois de cair
  s.on('disconnect', () => moLimpa());
}

/* ---------- os outros na tela ---------- */
const moLook = l => l && l.tipo === 'humano' ? l : { tipo: 'humano', corpo: 'm', pele: 'pele-morena', cabelo: 'cabelo-curto', roupa: 'roupa-camiseta', baixo: 'baixo-shorts' };
const MO_VISTAS = ['frente', 'costas', 'lado'];
const moNome = mb => `Nv ${mb.nivel} · ${mb.apelido}`;
function moPoe(mb) {
  if (!mb || !mb.id || mb.id === PORTAL.contaId) return;
  const look = moLook(mb.look); try { preCarrega(look); } catch (e) { }
  const x = +mb.x || (G.p ? G.p.x : 0), y = +mb.y || (G.p ? G.p.y : 0);
  const ent = { id: 'mundo_' + mb.id, mundo: mb.id, coop: 'mundo', d: { nome: moNome(mb), look, ola: '' }, x, y, alvo: { x, y }, flip: !!mb.f, r: 0.32, fase: +mb.fa || 0, mov: !!mb.m, vista: MO_VISTAS[mb.v] || 'frente', tVista: G.agora };
  MO.outros.set(mb.id, { ent, apelido: mb.apelido, nivel: mb.nivel, t: Date.now() });
}
function moTira(id) { MO.outros.delete(id); }
function moLimpa() { MO.outros.clear(); }
function moMostra(de, txt, emote) {
  if (!txt) return;
  const eu = de === PORTAL.contaId, o = MO.outros.get(de);
  if (!eu && (!o || MO_ESCONDE || MO_MUDOS.has(de))) return;
  const ent = eu ? G.p : o.ent;
  if (emote) texto(ent, txt, '#ffffff', 1800, -1.1); else fala(ent, txt, eu ? '#ffe37a' : '#bfe8ff');
}
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
  MO.canal = r.canal; moLimpa(); for (const mb of r.membros || []) moPoe(mb);
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
  };
}

/* ---------- painel 💬 ---------- */
function moFala(tipo, i) {
  if (!MO.sock || !MO.sock.connected || !MO.mapa) return;
  const agora = Date.now(); if (agora - (MO.tFala || 0) < 1200) return; MO.tFala = agora;
  MO.sock.emit(tipo === 'e' ? 'mundo-emote' : 'mundo-frase', { i });
}
function moPainel() {
  if (!MO.mapa) return avisoJogo('🌐 Aqui é só seu: os outros jogadores aparecem nas cidades e nos centros (não nas caças, casas e arenas).');
  const n = MO.outros.size;
  const lista = [...MO.outros].sort((a, b) => a[1].apelido.localeCompare(b[1].apelido)).map(([id, o]) => el('div', { class: 'mo-pessoa' },
    el('span', {}, `${o.apelido} · Nv ${o.nivel}`),
    el('button', { class: 'btn mini', type: 'button', onclick: () => { MO_MUDOS.has(id) ? MO_MUDOS.delete(id) : MO_MUDOS.add(id); moGrava('rac_mundo_mudos', [...MO_MUDOS].slice(-300)); moPainel(); } }, MO_MUDOS.has(id) ? '🔈 Mostrar' : '🔇 Silenciar')));
  abreModal(el('h2', {}, '💬 Falar com quem está aqui'),
    el('p', { class: 'dica' }, `🌐 ${n} ${n === 1 ? 'jogador' : 'jogadores'} neste lugar (canal ${MO.canal}). Sem chat livre: escolha um emote ou uma frase.`),
    el('div', { class: 'mo-emotes' }, ...MO_EMOTES.map((e, i) => el('button', { type: 'button', onclick: () => { moFala('e', i); fechaModal(); } }, e))),
    el('div', { class: 'mo-frases' }, ...MO_FRASES.map((f, i) => el('button', { class: 'btn', type: 'button', onclick: () => { moFala('f', i); fechaModal(); } }, f))),
    el('label', { class: 'mo-esconde' }, el('input', { type: 'checkbox', checked: MO_ESCONDE, onchange: e => { MO_ESCONDE = e.target.checked; moGrava('rac_mundo_esconde', MO_ESCONDE); } }), ' 🙈 Esconder os outros jogadores'),
    n ? el('details', {}, el('summary', {}, `👥 Quem está aqui (${n})`), el('div', { class: 'mo-lista' }, ...lista)) : el('p', { class: 'vazio' }, 'Ninguém por aqui agora.'));
}
function moBotao() {
  if (document.getElementById('moBtn')) return;
  const b = el('button', { id: 'moBtn', type: 'button', title: 'Emotes e frases para quem está aqui (Y)' }, '💬'); b.onclick = moPainel;
  document.body.append(b);
}
setInterval(() => { // o botão só aparece onde tem mundo compartilhado; o número mostra quantos estão aqui
  const b = document.getElementById('moBtn'); if (!b) return;
  const on = !!(MO.mapa && G.rodando); b.style.display = on ? '' : 'none';
  if (on && typeof CV !== 'undefined') { const r = CV.getBoundingClientRect(); const cel = document.body.classList.contains('cel3'); b.style.left = Math.round(cel ? r.left + 10 : r.right - 58) + 'px'; b.style.top = Math.round(cel ? r.top + r.height * 0.42 : r.top + 44) + 'px'; } // canto do mapa (celular: na lateral)
  b.dataset.n = MO.outros.size ? String(MO.outros.size) : '';
}, 1000);
document.addEventListener('keydown', e => {
  if (e.code !== 'KeyY' || e.repeat || e.ctrlKey || e.metaKey || e.altKey || !MO.mapa || !G.rodando) return;
  const a = document.activeElement; if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
  if (!document.getElementById('modal').hidden) return;
  moPainel();
});
{
  const css = document.createElement('style');
  css.textContent = `#moBtn { position: fixed; left: 12px; top: 50%; z-index: 60; width: 46px; height: 46px; border-radius: 50%; border: 2px solid #5ad8ff; background: rgba(10,25,45,.85); font-size: 22px; cursor: pointer; }
  #moBtn[data-n]:not([data-n=""])::after { content: attr(data-n); position: absolute; top: -6px; right: -6px; min-width: 18px; height: 18px; border-radius: 9px; background: #2a9df4; color: #fff; font: 700 11px/18px Fredoka, sans-serif; }
  .mo-emotes { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; } .mo-emotes button { font-size: 24px; width: 46px; height: 42px; border: 0; border-radius: 10px; background: rgba(0,0,0,.07); cursor: pointer; }
  .mo-frases { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 6px; margin-bottom: 8px; }
  .mo-esconde { display: block; margin: 6px 0; font-weight: 700; } .mo-lista { display: flex; flex-direction: column; gap: 4px; max-height: 30vh; overflow: auto; }
  .mo-pessoa { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 4px 8px; border-radius: 8px; background: rgba(0,0,0,.05); font-weight: 700; }`;
  document.head.append(css);
}
window.MUNDO = { MO, moPublico, moEntra, MO_FRASES, MO_EMOTES };
