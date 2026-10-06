/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   👥 TORRE INFINITA EM GRUPO (v354 — ideia do dono: "mais de um jogador subindo junto")
   2 a 4 AMIGOS do site, ao mesmo tempo, cada um com o seu personagem.
   - Mestra da Torre › "👥 Subir em grupo": cria a sala (código) e chama amigos online, ou entra com o código.
     Só entra amigo de quem criou. Sem chat: 8 emojis fixos.
   - Quem cria é o ANFITRIÃO: o jogo DELE roda as criaturas, as ondas, a Pedra, o chefão e o tempo, e manda um
     "retrato" do andar 10× por segundo. Os outros veem o espelho: o dano deles vai para o anfitrião, e cada um
     leva os golpes das criaturas que chegam perto dele. As criaturas correm atrás do jogador mais perto.
   - O grupo tenta até o próximo andar de quem tem o MENOR recorde. Cada um ganha os seus prêmios no próprio jogo
     (andar vencido, XP e itens das criaturas que ajudou a derrubar).
   - Anfitrião sai/cai/perde o fôlego: o andar acaba para todos. Convidado sem fôlego: acorda no Estádio e o grupo segue.
   Servidor: eventos "torre-*" (backend src/lenda/socketTorre.js), conexão Socket.IO com o login do site. Steam: desligado.
   ============================================================ */
const CO = { sock: null, sala: null, jogando: false, host: false, andar: 0, remotos: new Map(), espelhos: new Map(), danei: new Map(),
  snap: null, tEu: 0, tMundo: 0, liberaFim: false, convites: [], proxy: false, carregando: null };
const CO_EMOTES = ['👍', '👏', '⚽', '🔥', '😂', '😮', '💪', '🆘'];
const CO_LIBERADO = true; // ← liga quando o servidor (socket "torre-*") estiver no ar; até lá nenhum botão aparece
const coLigado = () => CO_LIBERADO && typeof PORTAL !== 'undefined' && PORTAL.ativo && !window.LENDA_STEAM;
const coEu = () => PORTAL.contaId;
function coPerfil() { const t = torreDados(); let look = null; try { look = lookJogador(); } catch (e) { } return { nivel: G.save.nivel, max: t.max || 0, look }; }

/* ---------- conexão (só quando alguém usa o modo em grupo) ---------- */
// v407 (Raio-X A9): UMA conexão só (window.LENDA_SOCK) para a Torre, o mundo compartilhado e a caça em grupo — antes
// cada um abria a sua (até 3 por jogador). Cada parte continua escutando os próprios eventos (torre-*, mundo-*, grupo-*).
function lendaSock(api) {
  const s = window.LENDA_SOCK;
  if (s && s._api === api && s._token === PORTAL.token) return s;
  const n = window.io(api, { auth: { token: PORTAL.token, plataforma: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop' }, transports: ['websocket'] });
  n._api = api; n._token = PORTAL.token; window.LENDA_SOCK = n;
  return n;
}
function coCarregaCliente() {
  if (window.io) return Promise.resolve();
  if (CO.carregando) return CO.carregando;
  return CO.carregando = new Promise((ok, erro) => { const s = document.createElement('script'); s.src = PORTAL.api + '/socket.io/socket.io.js'; s.onload = ok; s.onerror = () => { CO.carregando = null; erro(new Error('sem conexão')); }; document.head.append(s); });
}
async function coConecta() {
  if (CO.sock && CO.sock.connected) return CO.sock;
  await coCarregaCliente();
  if (!CO.sock) {
    CO.sock = lendaSock(PORTAL.api); // v407 (Raio-X A9): a conexão compartilhada
    coEscuta(CO.sock);
  }
  if (!CO.sock.connected) await new Promise((ok, erro) => { const t = setTimeout(() => erro(new Error('tempo')), 8000); CO.sock.once('connect', () => { clearTimeout(t); ok(); }); CO.sock.once('connect_error', e => { clearTimeout(t); erro(e); }); });
  return CO.sock;
}
const coPede = (ev, d) => new Promise(ok => { if (!CO.sock) return ok({ erro: 'Sem conexão.' }); const t = setTimeout(() => ok({ erro: 'O servidor não respondeu.' }), 8000); CO.sock.emit(ev, d, r => { clearTimeout(t); ok(r || {}); }); });

function coEscuta(s) {
  s.on('torre-convite', c => {
    CO.convites = CO.convites.filter(x => x.codigo !== c.codigo).concat([{ ...c, t: Date.now() }]).slice(-3);
    log(`👥 ${c.de} chamou você para subir a Torre Infinita em grupo (andar ${c.andar}). Fale com a Mestra da Torre ou use ☰ Mais › 👥 Torre em grupo.`, 'l-xp');
    banner(`👥 ${c.de} chamou você!`, 'Torre Infinita em grupo'); som('raro');
    if (G.rodando && !G.pausado && typeof perguntaJogo === 'function') perguntaJogo(`👥 ${c.de} chamou você para subir a Torre Infinita em grupo. Entrar na sala?`, { sim: 'Entrar', nao: 'Agora não' }).then(r => { if (r) coEntrar(c.codigo); }).catch(() => { });
  });
  s.on('torre-sala', sala => { CO.sala = sala; if (CO.lobbyAberto && !CO.jogando) coLobby(); });
  s.on('torre-comeca', ({ andar, sala }) => { CO.sala = sala; coInicia(andar); });
  s.on('torre-eu', ({ de, d }) => coRecebeEu(de, d));
  s.on('torre-mundo', ({ d }) => { if (CO.jogando && !CO.host) CO.snap = d; });
  s.on('torre-dano', ({ de, d }) => coRecebeDano(de, d));
  s.on('torre-fx', ({ d }) => coRecebeFx(d));
  s.on('torre-emote', ({ de, i }) => coMostraEmote(de, i));
  s.on('torre-fim', ({ res, andar }) => coFim(res, andar));
  s.on('torre-saiu', ({ id }) => { const r = CO.remotos.get(id); if (r) { log(`👥 ${r.ent.d.nome} saiu do grupo.`, 'l-sis'); coTiraRemoto(id); } });
  s.on('disconnect', () => { if (CO.jogando) log('👥 A conexão caiu. Tentando voltar...', 'l-dano'); });
  s.on('connect', () => { if (CO.sala) CO.sock.emit('torre-entrar', { codigo: CO.sala.codigo, perfil: coPerfil() }, () => { }); });
}

/* ---------- sala (lobby) ---------- */
async function coAbre() {
  if (!coLigado()) return avisoJogo('👥 A Torre em grupo só funciona no site (educacaogamer.com.br), com a sua conta.');
  if (!PORTAL.token) return avisoJogo('👥 Entre com a sua conta do Educação Gamer para subir a Torre com os seus amigos.');
  if (torreDados().max < 1) return avisoJogo('👥 Vença pelo menos o andar 1 da Torre sozinho antes de subir em grupo.');
  abreModal(el('h2', {}, '👥 Torre em grupo'), el('p', { class: 'vazio' }, 'Conectando...'));
  try { await coConecta(); } catch (e) { return abreModal(el('h2', {}, '👥 Torre em grupo'), el('p', {}, 'Não deu para conectar agora. Tente de novo em instantes.')); }
  CO.lobbyAberto = true; coLobby();
}
async function coCriar() { const r = await coPede('torre-criar', { perfil: coPerfil() }); if (r.erro) return avisoJogo('👥 ' + r.erro); CO.sala = r.sala; coLobby(); }
async function coEntrar(codigo) {
  try { await coConecta(); } catch (e) { return avisoJogo('👥 Não deu para conectar agora.'); }
  const r = await coPede('torre-entrar', { codigo, perfil: coPerfil() }); if (r.erro) return avisoJogo('👥 ' + r.erro);
  CO.sala = r.sala; CO.lobbyAberto = true; coLobby();
}
async function coSair() { await coPede('torre-sair', {}); CO.sala = null; coParaJogo(); CO.lobbyAberto = false; fechaModal(); }
const coAndarMax = sala => Math.max(1, Math.min(...sala.membros.map(m => m.max + 1)));
async function coLobby() {
  const s = CO.sala, souHost = s && s.host === coEu();
  if (!s) {
    const cod = el('input', { maxlength: 5, placeholder: 'CÓDIGO', style: 'width:110px;text-transform:uppercase;font-weight:800;text-align:center' });
    const conv = CO.convites.filter(c => Date.now() - c.t < 10 * 60000);
    abreModal(el('h2', {}, '👥 Torre em grupo'),
      el('p', {}, 'Subam juntos (2 a 4 amigos)! Cada um com o seu personagem; as criaturas correm atrás de quem estiver mais perto. O grupo tenta até o próximo andar de quem tem o menor recorde.'),
      conv.length ? el('div', { class: 'opcoes' }, ...conv.map(c => el('button', { class: 'btn amarelo', onclick: () => coEntrar(c.codigo) }, `📨 Entrar na sala de ${c.de}`))) : '',
      el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', onclick: coCriar }, '➕ Criar uma sala')),
      el('div', { class: 'opcoes', style: 'align-items:center' }, 'Tem um código?', cod, el('button', { class: 'btn', onclick: () => coEntrar(cod.value) }, 'Entrar')),
      el('p', { class: 'dica' }, 'Só amigos de quem criou a sala podem entrar (amizades no site, menu Amigos). Para falar com o grupo há 8 emojis — nada de chat.'));
    return;
  }
  const max = coAndarMax(s), membros = el('div', { class: 'co-membros' }, ...s.membros.map(m => el('div', { class: 'co-membro' }, `${m.id === s.host ? '👑 ' : '⚽ '}${m.apelido} · Nv ${m.nivel} · recorde ${m.max}`)));
  const andarIn = el('input', { type: 'number', min: 1, max, value: max, style: 'width:80px' });
  const chamar = el('div', { class: 'co-amigos' }, el('p', { class: 'vazio' }, 'Carregando amigos...'));
  abreModal(el('h2', {}, `👥 Sala ${s.codigo}`), el('p', {}, `Código para os amigos: `, el('b', { class: 'co-codigo' }, s.codigo), ` (${s.membros.length}/4)`), membros,
    souHost ? el('div', { class: 'opcoes', style: 'align-items:center' }, '▶ Começar no andar', andarIn, el('button', { class: 'btn amarelo', disabled: s.membros.length < 2 ? 'disabled' : null, onclick: async () => { const r = await coPede('torre-comecar', { andar: andarIn.value | 0 }); if (r.erro) avisoJogo('👥 ' + r.erro); } }, s.membros.length < 2 ? 'Esperando amigos...' : 'Começar!'))
      : el('p', { class: 'dica' }, `Esperando ${s.membros.find(m => m.id === s.host)?.apelido || 'o anfitrião'} começar (até o andar ${max}).`),
    el('h3', {}, '📨 Chamar amigos'), chamar,
    el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: coSair }, '🚪 Sair da sala'), el('button', { class: 'btn', onclick: () => { CO.lobbyAberto = false; fechaModal(); } }, 'Fechar (continuo na sala)')));
  try {
    const r = await amgPede('GET', '/amigos'); const lista = (r.ok && r.dados.amigos) || [];
    chamar.innerHTML = '';
    if (!lista.length) chamar.append(el('p', { class: 'vazio' }, 'Nenhum amigo seu joga o Lenda ainda.'));
    for (const a of lista.filter(a => !s.membros.some(m => m.id === a.id)).slice(0, 12))
      chamar.append(el('div', { class: 'amg-linha' }, el('span', {}, `${a.apelido} · Nv ${a.nivel}`), el('button', { class: 'btn mini', onclick: async ev => { const r2 = await coPede('torre-convidar', { amigoId: a.id }); ev.target.textContent = r2.ok ? '✅ Chamado' : '❌'; ev.target.disabled = true; } }, '📨 Chamar')));
  } catch (e) { chamar.innerHTML = ''; chamar.append(el('p', { class: 'vazio' }, 'Passe o código para os amigos.')); }
}

/* ---------- começar o andar ---------- */
function coInicia(andar) {
  CO.jogando = true; CO.host = CO.sala.host === coEu(); CO.andar = andar; CO.snap = null; CO.liberaFim = false;
  CO.espelhos.clear(); CO.danei.clear(); CO.remotos.clear(); CO.lobbyAberto = false;
  fechaModal(); torreEntra(andar);
  const idx = CO.sala.membros.findIndex(m => m.id === coEu()); if (G.p) { G.p.x = 17.5 + (idx - 1.5) * 1.1; G.p.y = 24.5; }
  if (!CO.host) { G.mons = []; G.respawns = []; } // o convidado vê o espelho do anfitrião
  for (const m of CO.sala.membros) if (m.id !== coEu()) coPoeRemoto(m);
  coBarraEmotes(true);
  banner(`👥 Andar ${andar} em grupo!`, CO.host ? 'Você é o anfitrião: se você sair, o andar acaba para todos.' : 'Vamos juntos!');
}
function coPoeRemoto(m) {
  const look = m.look && m.look.tipo === 'humano' ? m.look : { tipo: 'humano', corpo: 'm', pele: 'pele-morena', cabelo: 'cabelo-curto', roupa: 'roupa-camiseta', baixo: 'baixo-shorts' };
  try { preCarrega(look); } catch (e) { }
  const ent = { id: 'coop_' + m.id, coop: m.id, d: { nome: `${m.apelido} 👥`, look, ola: '' }, x: 17.5, y: 24.5, flip: false, r: 0.32, fase: 0, mov: false, alvo: { x: 17.5, y: 24.5 }, coHp: 100 }; // ("hp" faria o jogo tratar como adversário)
  G.npcs.push(ent); CO.remotos.set(m.id, { ent, t: Date.now() });
}
function coTiraRemoto(id) { const r = CO.remotos.get(id); if (!r) return; G.npcs = G.npcs.filter(n => n !== r.ent); CO.remotos.delete(id); }
function coParaJogo() {
  CO.jogando = false; CO.snap = null; CO.espelhos.clear();
  for (const id of [...CO.remotos.keys()]) coTiraRemoto(id);
  coBarraEmotes(false);
}

/* ---------- a cada quadro ---------- */
{
  const _atuCo = atualiza;
  atualiza = function (dt) {
    const r = _atuCo.apply(this, arguments);
    try { if (CO.jogando) coPasso(dt || 16); } catch (e) { }
    return r;
  };
}
function coPasso(dt) {
  if (!G.mapa || !G.mapa.torre) { // saiu da Torre (porteiro, renasceu...): deixa a partida
    if (CO.host) coFimHost('derrota'); else if (CO.sock) CO.sock.emit('torre-eu', { saiu: 1 });
    coParaJogo(); return;
  }
  const agora = Date.now(), p = G.p, st = stats();
  if (agora - CO.tEu > 100 && CO.sock) { CO.tEu = agora; CO.sock.emit('torre-eu', { x: +p.x.toFixed(2), y: +p.y.toFixed(2), f: p.flip ? 1 : 0, m: p.mov ? 1 : 0, fa: +(p.fase || 0).toFixed(2), h: Math.round(G.save.hp / st.maxHp * 100) }); }
  for (const { ent } of CO.remotos.values()) { const k = Math.min(1, dt / 90); ent.x += (ent.alvo.x - ent.x) * k; ent.y += (ent.alvo.y - ent.y) * k; }
  if (CO.host) {
    if (agora - CO.tMundo > 100 && CO.sock) {
      CO.tMundo = agora;
      CO.sock.emit('torre-mundo', { r: Math.round(TD.resta), o: TD.onda, n: TD.n, m: G.mons.slice(0, 40).map(m => [m.uid, m.tipo, +m.x.toFixed(2), +m.y.toFixed(2), Math.max(0, Math.round(m.hp)), m.flip ? 1 : 0, m.mov ? 1 : 0, m._cv && m._cv.furia ? 1 : 0]) });
    }
  } else coAplicaMundo(dt);
}
// convidado: o andar é o espelho do anfitrião
function coAplicaMundo(dt) {
  const S = CO.snap; if (!S) return;
  const vivos = new Set();
  for (const [uid, tipo, x, y, hp, flip, mov, furia] of S.m) {
    vivos.add(uid);
    let m = CO.espelhos.get(uid);
    if (!m) {
      if (!MONSTROS[tipo]) continue;
      m = criaMonstro({ m: tipo, x: Math.floor(x), y: Math.floor(y), raio: 0 }); if (!m) continue;
      m.x = x; m.y = y; m.espelho = true; m.coopUid = uid; m.bravo = true; CO.espelhos.set(uid, m); G.mons.push(m);
    }
    m.alvoX = x; m.alvoY = y; m.hp = hp; m.flip = !!flip; m.movRemoto = !!mov;
    if (furia && m._cv) m._cv.furia = true;
  }
  for (const [uid, m] of CO.espelhos) if (!vivos.has(uid)) { // caiu lá no anfitrião
    CO.espelhos.delete(uid);
    if (Date.now() - (CO.danei.get(uid) || 0) < 20000) { m.hp = 0; try { matar(m); } catch (e) { } } // ajudou: ganha XP e prêmios no próprio jogo
    else { efeito('puff', m.x, m.y); G.mons = G.mons.filter(x => x !== m); }
  }
  const k = Math.min(1, dt / 90);
  for (const m of CO.espelhos.values()) { m.x += (m.alvoX - m.x) * k; m.y += (m.alvoY - m.y) * k; if (m.movRemoto) { m.mov = true; m.fase = (m.fase || 0) + dt / 90; } }
  // painel do andar com os números do anfitrião
  Object.assign(TD, { mapa: G.mapa, n: S.n || CO.andar, resta: S.r, onda: S.o });
  tdHud(true);
}
function coRecebeEu(de, d) {
  const r = CO.remotos.get(de); if (!r || !d) return;
  if (d.saiu || d.h === 0) { if (d.saiu) log(`👥 ${r.ent.d.nome} saiu do andar.`, 'l-sis'); coTiraRemoto(de); return; }
  r.ent.alvo = { x: +d.x || r.ent.x, y: +d.y || r.ent.y }; r.ent.flip = !!d.f; r.ent.mov = !!d.m; r.ent.fase = +d.fa || 0; r.ent.coHp = d.h; r.t = Date.now();
  r.ent.d.nome = r.ent.d.nome.replace(/ · \d+%$/, '') + (d.h < 100 ? ` · ${d.h}%` : '');
}

/* ---------- dano ---------- */
{
  const _danoCo = aplicaDano;
  aplicaDano = function (m, dano) {
    if (CO.jogando && !CO.host && m && m.espelho) { // o golpe vale lá no anfitrião
      m.bravo = true; if (dano <= 0) { efeito('puff', m.x, m.y); texto(m, 'defendeu', '#d8e0ff', 700); return; }
      m.hitT = G.agora; texto(m, dano, '#ffcf4a'); CO.danei.set(m.coopUid, Date.now());
      if (CO.sock) CO.sock.emit('torre-dano', { u: m.coopUid, d: Math.round(dano) });
      return;
    }
    return _danoCo.apply(this, arguments);
  };
}
function coRecebeDano(de, d) {
  if (!CO.jogando || !CO.host || !d) return;
  const m = G.mons.find(x => x.uid === d.u); const dano = Math.max(0, Math.min(1e12, Math.round(+d.d || 0)));
  if (!m || !dano) return;
  const p0 = G.semEmpurrao; G.semEmpurrao = true; try { aplicaDano(m, dano); } finally { G.semEmpurrao = p0; }
}
// anfitrião: as criaturas correm atrás do jogador MAIS PERTO (G.p vira o colega só durante a conta)
{
  const _amCo = atualizaMonstro;
  atualizaMonstro = function (m, dt) {
    if (CO.jogando && !CO.host && m.espelho) { // convidado: a criatura espelho só ataca se estiver colada em você
      const x0 = m.x, y0 = m.y, r = _amCo.apply(this, arguments); m.x = x0; m.y = y0; return r; // quem anda é o anfitrião: aqui só valem os golpes
    }
    if (!CO.jogando || !CO.host || !CO.remotos.size || m.d.pedraTorre) return _amCo.apply(this, arguments);
    let alvo = G.p, d0 = G.save.hp > 0 ? Math.hypot(m.x - G.p.x, m.y - G.p.y) : 1e9;
    for (const { ent } of CO.remotos.values()) { const d = Math.hypot(m.x - ent.x, m.y - ent.y); if (ent.coHp > 0 && d < d0) { d0 = d; alvo = ent; } }
    if (alvo === G.p) return _amCo.apply(this, arguments);
    const real = G.p; G.p = alvo; CO.proxy = true;
    try { return _amCo.apply(this, arguments); } finally { G.p = real; CO.proxy = false; }
  };
  // golpe numa criatura que está atrás do colega: quem leva é o colega (no jogo dele)
  const _ataCo = monstroAtaca;
  monstroAtaca = function () { if (CO.proxy) return; return _ataCo.apply(this, arguments); };
  const _projCo = projetil;
  projetil = function (de, para, tipo, cb) { if (CO.proxy) return _projCo.call(this, de, para, tipo, () => { }); return _projCo.apply(this, arguments); };
}
// o convidado não roda as ondas, a Pedra nem o tempo (é tudo do anfitrião)
{
  const _tdCo = tdPasso;
  tdPasso = function () { if (CO.jogando && !CO.host) return; return _tdCo.apply(this, arguments); };
  const _limpouCo = torreLimpou;
  torreLimpou = function () {
    if (CO.jogando && !CO.host && !CO.liberaFim) { G.torreLimpo = false; return; }
    const emGrupo = CO.jogando, host = CO.host;
    const r = _limpouCo.apply(this, arguments);
    if (emGrupo && host && CO.sock) CO.sock.emit('torre-fim', { res: 'limpou' });
    if (emGrupo) coDepoisDoAndar();
    return r;
  };
}
// efeitos do chefão que pegam os colegas (aviso e onda de choque)
function coFx(fx) { if (CO.jogando && CO.host && CO.sock) CO.sock.emit('torre-fx', fx); }
function coRecebeFx(fx) {
  if (!CO.jogando || CO.host || !fx) return;
  if (fx.k === 'aviso') { efeito('area', fx.x, fx.y, '#ff3a3a', 3.5); som('chefe_aviso'); }
  if (fx.k === 'choque') {
    efeito('impacto', fx.x, fx.y, '#ff5a2a', 3.5); efeito('area', fx.x, fx.y, '#ffb03a', 3.5); som('chefe_choque');
    if (G.p && G.save.hp > 0 && Math.hypot(G.p.x - fx.x, G.p.y - fx.y) <= (fx.r || 3.5)) { const m = CO.espelhos.get(fx.u); recebeDano(Math.round(stats().maxHp * Math.min(0.3, fx.p || 0.1)), m || null); }
  }
}

/* ---------- fim do andar ---------- */
function coFimHost(res) { if (CO.jogando && CO.host && CO.sock) CO.sock.emit('torre-fim', { res }); }
function coFim(res, andar) {
  if (res === 'anfitriao_saiu') { CO.sala = null; log('👥 Quem criou a sala saiu: o grupo acabou.', 'l-sis'); if (CO.lobbyAberto) { CO.lobbyAberto = false; fechaModal(); } if (CO.jogando) { avisoJogo('👥 O anfitrião saiu: o grupo acabou.'); coParaJogo(); if (G.mapa && G.mapa.torre) setTimeout(torreVoltaHub, 1200); } return; }
  if (!CO.jogando || CO.host) return;
  if (res === 'limpou') { CO.liberaFim = true; G.mons = []; CO.espelhos.clear(); Object.assign(TD, { mapa: G.mapa, onda: 99, acabou: false }); G.torreLimpo = true; torreLimpou(); return; } // (as ondas são do anfitrião: aqui não espera nenhuma)
  coParaJogo(); TD.acabou = true; G.torreLimpo = true; // nada de ondas "sozinhas" até sair
  if (res === 'tempo') { banner('⏰ Tempo esgotado!', 'A Torre expulsou o grupo... tentem de novo!'); som('erro'); }
  else avisoJogo('👥 O anfitrião ficou sem fôlego: o andar acabou para o grupo.');
  setTimeout(() => { if (G.mapa && G.mapa.torre) torreVoltaHub(); }, 1600);
}
// depois de vencer em grupo: os botões da janela viram "próximo andar com o grupo"
function coDepoisDoAndar() {
  const n = CO.andar; coParaJogo();
  if (CO.sock) CO.sock.emit('torre-perfil', { perfil: coPerfil() }); // recorde novo: o grupo pode subir mais
  const ops = document.querySelector('#modalConteudo .opcoes'); if (!ops || !CO.sala) return;
  ops.innerHTML = '';
  if (CO.host) ops.append(el('button', { class: 'btn amarelo', onclick: async () => { const r = await coPede('torre-comecar', { andar: n + 1 }); if (r.erro) avisoJogo('👥 ' + r.erro); } }, `👥 Próximo andar com o grupo (${n + 1})`));
  else ops.append(el('p', { class: 'dica' }, '👥 Esperando o anfitrião escolher o próximo andar...'));
  ops.append(el('button', { class: 'btn', onclick: async () => { await coSair(); torreVoltaHub(); } }, '🚪 Sair do grupo e voltar ao Estádio'));
}

/* ---------- emojis (o único jeito de "falar" com o grupo) ---------- */
function coMostraEmote(de, i) {
  const e = CO_EMOTES[i]; if (!e) return;
  const alvo = de === coEu() ? G.p : (CO.remotos.get(de) || {}).ent; if (!alvo) return;
  texto(alvo, e, '#ffffff', 1600, -1.1);
}
function coBarraEmotes(on) {
  let b = document.getElementById('coEmotes');
  if (!on) { if (b) b.remove(); return; }
  if (b) return;
  b = el('div', { id: 'coEmotes' }, ...CO_EMOTES.map((e, i) => el('button', { type: 'button', title: 'Mandar para o grupo', onclick: () => CO.sock && CO.sock.emit('torre-emote', { i }) }, e)));
  document.body.append(b);
}

/* ---------- onde abrir ---------- */
// botão na janela da Mestra da Torre
{
  const _mtCo = modalTorre;
  modalTorre = function (npc) {
    const r = _mtCo.apply(this, arguments);
    try { if (coLigado() && npc && npc.d && npc.d.torre === 'mestre') { const ops = document.querySelector('#modalConteudo .opcoes'); if (ops) ops.append(el('button', { class: 'btn', onclick: coAbre }, CO.sala ? `👥 Minha sala de grupo (${CO.sala.codigo})` : '👥 Subir em grupo (2 a 4 amigos)')); } } catch (e) { }
    return r;
  };
}
// colega na tela: clicar nele não abre conversa de NPC
{ const _npcCo = abrirNPC; abrirNPC = function (npc) { if (npc && npc.coop) { texto(npc, '👋', '#fff', 900, -1.1); return; } return _npcCo.apply(this, arguments); }; }
// e no menu ☰ Mais
(function poeBotaoCo(t = 0) {
  if (!coLigado()) return;
  const lista = document.querySelector('.tb-lista'); if (!lista) { if (t < 40) setTimeout(() => poeBotaoCo(t + 1), 500); return; }
  if (document.getElementById('btnCoop')) return;
  const b = el('button', { class: 'btn', id: 'btnCoop', type: 'button', role: 'menuitem' }, '👥 Torre em grupo'); b.onclick = () => { if (torreDados().max < 1 || typeof mvPodeIr === 'function' && !mvPodeIr()) return avisoJogo('👥 A Torre em grupo abre depois que você chega ao Multiverso e vence o andar 1 da Torre.'); coAbre(); };
  lista.append(b);
})();
{
  const css = document.createElement('style');
  css.textContent = `#coEmotes { position: fixed; bottom: 14px; left: 50%; transform: translateX(-50%); z-index: 61; display: flex; gap: 4px; padding: 4px 6px; border-radius: 12px; background: rgba(20,10,30,.8); border: 2px solid #7a5ad8; }
  #coEmotes button { font-size: 20px; width: 36px; height: 34px; border: 0; border-radius: 8px; background: rgba(255,255,255,.08); cursor: pointer; }
  #coEmotes button:hover { background: rgba(255,255,255,.25); }
  .co-membros { display: flex; flex-direction: column; gap: 4px; margin: 6px 0; } .co-membro { padding: 5px 8px; border-radius: 8px; background: rgba(0,0,0,.06); font-weight: 700; }
  .co-codigo { font-size: 22px; letter-spacing: 3px; color: #7a3ad8; } .co-amigos { display: flex; flex-direction: column; gap: 4px; max-height: 30vh; overflow: auto; }`;
  document.head.append(css);
}
