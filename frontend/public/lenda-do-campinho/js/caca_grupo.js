/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   👥 CAÇA EM GRUPO — "MMO leve", etapa 2 (v381; dono: "caçar juntos... jogarem juntos mesmo")
   2 a 4 AMIGOS do site num grupo (☰ Mais › 👥 Caçar em grupo). O grupo dura enquanto vocês jogam.
   - Quando o LÍDER entra numa área de caça, os outros recebem "Ir junto?". Na caça, o jogo do líder roda os
     adversários e manda o "retrato" para quem está lá; os golpes dos outros valem lá no líder; as criaturas
     correm atrás de quem estiver mais perto. Cada um leva os golpes no próprio jogo.
   - Prêmio: cada um ganha XP, tostões e itens dos adversários que AJUDOU a derrubar (bateu nos últimos 20 s),
     no próprio jogo. Dono: "a caça em grupo deve dar uma porcentagem a menos de XP, por conseguirem matar muito
     mais adversários por tempo" → CG_FATOR por tamanho do grupo NA CAÇA (XP, tostões e chance de item;
     itens que uma missão pede continuam com a chance cheia).
   - O líder saiu da caça: quem ficou continua caçando sozinho ali (os adversários voltam a ser do seu jogo).
   - Sem chat: 8 emotes. Só com a conta do site; Steam: desligado.
   Servidor: eventos "grupo-*" (backend src/lenda/socketGrupo.js). Carregar DEPOIS de torre_coop.js e mundo_online.js.
   ============================================================ */
const CG = { sock: null, carregando: null, grupo: null, convites: [], remotos: new Map(), espelhos: new Map(), danei: new Map(), mortos: [],
  snap: null, modo: null, mapaModo: null, tEu: 0, tMundo: 0, fatorAgora: null, remotoDano: false, proxy: false, ondeEnviado: undefined, perguntou: null };
const CG_LIBERADO = true; // (v381: servidor "grupo-*" no ar)
const CG_FATOR = { 1: 1, 2: 0.65, 3: 0.5, 4: 0.4 }; // prêmio por adversário, pelo tamanho do grupo na caça
// dono: "deve existir uma diferença mínima entre os players para poder fazer party": o nível mais alto pode ser no máximo
// 50% maior que o mais baixo (folga mínima de 10 níveis). Mesma conta do servidor (entrar no grupo) e daqui (caçar junto:
// quem subiu demais depois continua no grupo, mas na caça cada um fica sozinho)
const cgFaixaOk = (a, b) => { const lo = Math.min(a, b), hi = Math.max(a, b); return hi <= Math.max(lo * 1.5, lo + 10); };
const cgFaixaDe = n => ({ de: Math.max(1, Math.min(n - 10, Math.ceil(n / 1.5))), ate: Math.max(n + 10, Math.floor(n * 1.5)) });
const cgPerto = id => { const m = cgMembro(id); return !!(m && G.save && cgFaixaOk(m.nivel || 1, G.save.nivel)); };
const CG_EMOTES = ['👍', '👏', '⚽', '🔥', '😂', '😮', '💪', '🆘'];
const CG_TESTE = (() => { try { return localStorage.getItem('rac_mundo_teste'); } catch (e) { return null; } })();
const cgLigado = () => (CG_LIBERADO || !!CG_TESTE) && typeof PORTAL !== 'undefined' && (PORTAL.ativo || !!CG_TESTE) && !!PORTAL.token && !window.LENDA_STEAM;
const cgApi = () => CG_TESTE || PORTAL.api;
const cgEu = () => PORTAL.contaId;
const cgEhCaca = id => !!(id && typeof CACA_POR_ID !== 'undefined' && CACA_POR_ID[id]);
function cgPerfil() { let look = null; try { look = lookJogador(); } catch (e) { } return { nivel: G.save.nivel, look }; }
const cgLider = () => !!(CG.grupo && CG.grupo.lider === cgEu());
const cgMembro = id => CG.grupo && CG.grupo.membros.find(m => m.id === id);
// quantos do grupo estão nesta caça agora (com você)
const cgNaCaca = () => 1 + [...CG.remotos.keys()].filter(id => (cgMembro(id) || {}).mapa === (G.mapa && G.mapa.id)).length;
const cgFator = () => CG_FATOR[Math.min(4, cgNaCaca())] || 1;

/* ---------- conexão ---------- */
function cgCarregaCliente() {
  if (window.io) return Promise.resolve();
  if (CG.carregando) return CG.carregando;
  return CG.carregando = new Promise((ok, erro) => { const s = document.createElement('script'); s.src = cgApi() + '/socket.io/socket.io.js'; s.onload = ok; s.onerror = () => { CG.carregando = null; erro(new Error('sem servidor')); }; document.head.append(s); });
}
async function cgConecta() {
  if (CG.sock && CG.sock.connected) return CG.sock;
  await cgCarregaCliente();
  if (!CG.sock) { CG.sock = typeof lendaSock === 'function' ? lendaSock(cgApi()) : window.io(cgApi(), { auth: { token: PORTAL.token }, transports: ['websocket'] }); cgEscuta(CG.sock); } // v407 (Raio-X A9): conexão compartilhada (torre_coop.js)
  if (!CG.sock.connected) await new Promise((ok, erro) => { const t = setTimeout(() => erro(new Error('tempo')), 8000); CG.sock.once('connect', () => { clearTimeout(t); ok(); }); CG.sock.once('connect_error', e => { clearTimeout(t); erro(e); }); });
  return CG.sock;
}
const cgPede = (ev, d) => new Promise(ok => { if (!CG.sock) return ok({ erro: 'Sem conexão.' }); const t = setTimeout(() => ok({ erro: 'O servidor não respondeu.' }), 8000); CG.sock.emit(ev, d, r => { clearTimeout(t); ok(r || {}); }); });
function cgEscuta(s) {
  s.on('grupo-convite', c => {
    CG.convites = CG.convites.filter(x => x.codigo !== c.codigo).concat([{ ...c, t: Date.now() }]).slice(-3);
    log(`👥 ${c.de} chamou você para caçar em grupo! Abra ☰ Mais › 👥 Caçar em grupo.`, 'l-xp'); banner(`👥 ${c.de} chamou você!`, 'Caça em grupo'); som('raro');
    if (G.rodando && !G.pausado && typeof perguntaJogo === 'function') perguntaJogo(`👥 ${c.de} chamou você para caçar em grupo. Entrar no grupo?`, { sim: 'Entrar', nao: 'Agora não' }).then(r => { if (r) cgEntrar(c.codigo); });
  });
  s.on('grupo-sala', g => cgAtualizaGrupo(g));
  s.on('grupo-saiu', ({ id }) => { const m = cgMembro(id); if (m) log(`👥 ${m.apelido} saiu do grupo.`, 'l-sis'); cgTiraRemoto(id); });
  s.on('grupo-fim', () => { log('👥 O líder saiu: o grupo acabou.', 'l-sis'); cgSaiDoModo(); CG.grupo = null; cgRedesenhaPainel(); });
  s.on('grupo-eu', ({ de, mapa, d }) => cgRecebeEu(de, mapa, d));
  s.on('grupo-mundo', ({ mapa, d }) => { if (CG.modo === 'convidado' && G.mapa && mapa === G.mapa.id) CG.snap = d; });
  s.on('grupo-dano', ({ de, mapa, d }) => cgRecebeDano(de, mapa, d));
  s.on('grupo-emote', ({ de, i }) => { const e = CG_EMOTES[i]; if (!e) return; const alvo = de === cgEu() ? G.p : (CG.remotos.get(de) || {}).ent; if (alvo) texto(alvo, e, '#ffffff', 1600, -1.1); else { const m = cgMembro(de); if (m) log(`👥 ${m.apelido}: ${e}`, 'l-sis'); } });
  s.on('connect', () => { if (CG.grupo) CG.sock.emit('grupo-entrar', { codigo: CG.grupo.codigo, perfil: cgPerfil(), mapa: G.mapa && G.mapa.id }, r => { if (r && r.grupo) cgAtualizaGrupo(r.grupo); }); CG.ondeEnviado = undefined; });
}
function cgAtualizaGrupo(g) {
  const antes = CG.grupo; CG.grupo = g;
  // o líder entrou numa caça: chama quem não está lá
  const lider = g.membros.find(m => m.id === g.lider), eu = cgEu();
  if (lider && lider.id !== eu && cgEhCaca(lider.mapa) && (!G.mapa || G.mapa.id !== lider.mapa) && CG.perguntou !== lider.mapa) {
    CG.perguntou = lider.mapa; const nome = (CACA_POR_ID[lider.mapa] || {}).nome || 'uma área de caça';
    banner(`👥 ${lider.apelido} entrou em ${nome}`, 'Caça em grupo');
    if (G.rodando && typeof perguntaJogo === 'function') perguntaJogo(`👥 ${lider.apelido} (líder do grupo) entrou em ${nome}. Ir junto?`, { sim: 'Ir junto!', nao: 'Agora não' }).then(r => { if (r && CG.grupo) { const l2 = cgMembro(CG.grupo.lider); if (l2 && l2.mapa === lider.mapa) { fechaModal(); trocaMapa(lider.mapa); } else avisoJogo('👥 O líder já saiu de lá.'); } });
  }
  if (lider && !cgEhCaca(lider.mapa)) CG.perguntou = null;
  // quem saiu do grupo some da tela
  for (const id of [...CG.remotos.keys()]) if (!g.membros.some(m => m.id === id)) cgTiraRemoto(id);
  if (!antes) cgRedesenhaPainel(); else if (CG.painelAberto) cgRedesenhaPainel();
}

/* ---------- os colegas na tela (só desenho: não bloqueiam caminho nem conversam) ---------- */
const cgLook = l => l && l.tipo === 'humano' ? l : { tipo: 'humano', corpo: 'm', pele: 'pele-morena', cabelo: 'cabelo-curto', roupa: 'roupa-camiseta', baixo: 'baixo-shorts' };
function cgPoeRemoto(id) {
  const m = cgMembro(id); if (!m || id === cgEu()) return null;
  const look = cgLook(m.look); try { preCarrega(look); } catch (e) { }
  const ent = { id: 'grupo_' + id, mundo: 'grupo_' + id, coop: 'grupo', d: { nome: `👥 ${m.apelido}`, look, ola: '' }, x: G.p.x, y: G.p.y, alvo: { x: G.p.x, y: G.p.y }, flip: false, r: 0.32, fase: 0, mov: false, coHp: 100 };
  const r = { ent, t: Date.now() }; CG.remotos.set(id, r); return r;
}
function cgTiraRemoto(id) { CG.remotos.delete(id); }
function cgRecebeEu(de, mapa, d) {
  if (!d || !G.mapa || mapa !== G.mapa.id) return;
  if (typeof CO !== 'undefined' && CO.jogando) return; // v409: na Torre em grupo quem mostra o colega é a Torre (antes aparecia DOBRADO)
  if (d.saiu || !cgPerto(de)) { cgTiraRemoto(de); return; } // (fora da faixa de nível: na caça cada um fica no seu jogo)
  const r = CG.remotos.get(de) || cgPoeRemoto(de); if (!r) return;
  const e = r.ent, nx = Number.isFinite(+d.x) ? +d.x : e.x, ny = Number.isFinite(+d.y) ? +d.y : e.y;
  if (!r.novo) { r.novo = true; e.x = nx; e.y = ny; }
  e.alvo = { x: nx, y: ny }; e.flip = !!d.f;
  if (typeof suavRecebe === 'function' && Number.isFinite(d.t) && suavRecebe(r.canal || (r.canal = suavCanal()), d.t)) suavPoe(e, r.canal, d.t, nx, ny); e.mov = !!d.m; e.fase = +d.fa || 0; e.vista = ['frente', 'costas', 'lado'][d.v] || 'frente'; e.tVista = G.agora; e.coHp = +d.h; r.t = Date.now(); // v409: movimento suave (torre_coop.js)
  const m = cgMembro(de); e.d.nome = `👥 ${m ? m.apelido : ''}` + (d.h < 100 ? ` · ${d.h}%` : '');
}
{
  const _desGr = desenha;
  desenha = function () {
    if (!CG.remotos.size) return _desGr.apply(this, arguments);
    const antes = G.npcs; G.npcs = antes.concat([...CG.remotos.values()].map(r => r.ent));
    try { return _desGr.apply(this, arguments); } finally { G.npcs = antes; }
  };
}

/* ---------- o modo da caça: líder (roda os adversários) / convidado (vê o espelho) / sozinho ---------- */
function cgDecideModo() {
  const g = CG.grupo, mapa = G.mapa && G.mapa.id;
  let modo = null;
  if (g && cgEhCaca(mapa)) {
    const aqui = g.membros.filter(m => m.mapa === mapa && m.id !== cgEu() && cgFaixaOk(m.nivel || 1, G.save.nivel));
    if (cgLider() && aqui.length) modo = 'lider';
    else if (!cgLider() && aqui.some(m => m.id === g.lider)) modo = 'convidado';
  }
  if (modo === CG.modo && CG.mapaModo === mapa) return;
  const era = CG.modo; CG.modo = modo; CG.mapaModo = mapa; CG.snap = null; CG.espelhos.clear(); CG.danei.clear(); CG.mortos = [];
  if (modo === 'convidado') { G.mons = []; G.respawns = []; G.alvo = null; banner('👥 Caça em grupo!', `Caçando com o grupo: cada adversário dá ${Math.round(cgFator() * 100)}% do prêmio.`); }
  else if (era === 'convidado' && cgEhCaca(mapa)) { // o líder saiu: os adversários voltam a ser do seu jogo
    entrarMapa(mapa, G.p.x, G.p.y, true); avisoJogo('👥 O líder saiu daqui: agora você caça sozinho nesta área.');
  }
  if (modo === 'lider' && era !== 'lider') banner('👥 Caça em grupo!', 'Você é o líder: os adversários são do seu jogo. Se você sair, cada um continua sozinho.');
}
function cgSaiDoModo() { if (CG.modo === 'convidado' && G.mapa) entrarMapa(G.mapa.id, G.p.x, G.p.y, true); CG.modo = null; CG.mapaModo = null; CG.remotos.clear(); CG.espelhos.clear(); CG.snap = null; }

{
  const _atuGr = atualiza;
  atualiza = function (dt) {
    const r = _atuGr.apply(this, arguments);
    try { if (CG.grupo && CG.sock) cgPasso(dt || 16); } catch (e) { }
    return r;
  };
}
function cgPasso(dt) {
  const agora = Date.now(), p = G.p, mapa = G.mapa && G.mapa.id;
  if (CG.ondeEnviado !== mapa && CG.sock.connected) { // conta para o grupo onde você está
    const era = CG.ondeEnviado; CG.ondeEnviado = mapa; CG.sock.emit('grupo-onde', { mapa });
    if (era && era !== mapa) CG.remotos.clear();
    const eu = cgMembro(cgEu()); if (eu) eu.mapa = mapa;
  }
  if (CG.nivelEnviado !== G.save.nivel && CG.sock.connected) { CG.nivelEnviado = G.save.nivel; CG.sock.emit('grupo-perfil', { perfil: cgPerfil() }); const eu = cgMembro(cgEu()); if (eu) eu.nivel = G.save.nivel; }
  cgDecideModo();
  if (typeof CO !== 'undefined' && CO.jogando) { if (CG.remotos.size) CG.remotos.clear(); return; } // v409: na Torre em grupo, só a Torre manda a posição (sem tráfego dobrado)
  if (agora - CG.tEu > 110 && CG.sock.connected) {
    CG.tEu = agora; const st = stats();
    CG.sock.emit('grupo-eu', { t: typeof suavT === 'function' ? suavT() : undefined, x: +p.x.toFixed(2), y: +p.y.toFixed(2), f: p.flip ? 1 : 0, m: p.mov ? 1 : 0, fa: +(p.fase || 0).toFixed(2), v: Math.max(0, ['frente', 'costas', 'lado'].indexOf(p.vista || 'frente')), h: Math.round(G.save.hp / st.maxHp * 100) });
  }
  const k = Math.min(1, dt / 90);
  for (const [id, r] of CG.remotos) {
    if (agora - r.t > 6000 || (cgMembro(id) || {}).mapa !== mapa) { CG.remotos.delete(id); continue; }
    const e = r.ent; if (typeof suavAnda === 'function') { suavAnda(e, dt, e.alvo.x, e.alvo.y); continue; } // v409: suave (torre_coop.js)
    if (!Number.isFinite(e.x) || !Number.isFinite(e.y) || Math.hypot(e.alvo.x - e.x, e.alvo.y - e.y) > 6) { e.x = e.alvo.x; e.y = e.alvo.y; } else { e.x += (e.alvo.x - e.x) * k; e.y += (e.alvo.y - e.y) * k; }
  }
  if (CG.modo === 'lider' && agora - CG.tMundo > 120) {
    CG.tMundo = agora;
    const perto = [G.p, ...[...CG.remotos.values()].map(r => r.ent)];
    const lista = G.mons.filter(m => m.uid && perto.some(q => Math.abs(m.x - q.x) < 13 && Math.abs(m.y - q.y) < 10)).slice(0, 70)
      .map(m => [m.uid, m.tipo, +m.x.toFixed(1), +m.y.toFixed(1), Math.max(0, Math.round(m.hp)), m.flip ? 1 : 0, m.mov ? 1 : 0]);
    CG.sock.emit('grupo-mundo', { t: typeof suavT === 'function' ? suavT() : undefined, m: lista, k: CG.mortos.splice(0) });
  } else if (CG.modo === 'convidado') cgAplicaMundo(dt);
}
// convidado: a caça é o espelho do líder
function cgAplicaMundo(dt) {
  G.respawns = [];
  const S = CG.snap; if (!S) return; CG.snap = null;
  const comHora = typeof suavRecebe === 'function' && suavRecebe(CG.canalMundo || (CG.canalMundo = suavCanal()), S.t); // v409
  const vistos = new Set();
  for (const uid of S.k || []) { // caíram lá no líder
    const m = CG.espelhos.get(uid); if (!m) continue; CG.espelhos.delete(uid);
    if (Date.now() - (CG.danei.get(uid) || 0) < 20000) { m.hp = 0; try { matar(m); } catch (e) { } } // ajudou: prêmio no seu jogo
    else { efeito('puff', m.x, m.y); G.mons = G.mons.filter(x => x !== m); }
  }
  for (const [uid, tipo, x, y, hp, flip, mov] of S.m || []) {
    vistos.add(uid);
    let m = CG.espelhos.get(uid);
    if (!m) {
      if (!MONSTROS[tipo]) continue;
      m = criaMonstro({ m: tipo, x: Math.floor(x), y: Math.floor(y), raio: 0 }); if (!m) continue;
      m.x = x; m.y = y; m.espelho = true; m.cgUid = uid; CG.espelhos.set(uid, m); G.mons.push(m);
    }
    m.alvoX = x; m.alvoY = y; m.hp = hp; m.flip = !!flip; m.movRemoto = !!mov;
    if (comHora) suavPoe(m, CG.canalMundo, S.t, x, y);
  }
  for (const [uid, m] of CG.espelhos) if (!vistos.has(uid)) { CG.espelhos.delete(uid); G.mons = G.mons.filter(x => x !== m); } // longe de todos: some (continua vivo lá)
  G.mons = G.mons.filter(m => m.espelho || m.d.treino); // nada de adversário "só seu" no meio do grupo
}
{ // anda os espelhos todo quadro (o retrato chega ~8× por segundo)
  const _atuGr2 = atualiza;
  atualiza = function (dt) {
    const r = _atuGr2.apply(this, arguments);
    try { if (CG.modo === 'convidado') { const k = Math.min(1, (dt || 16) / 90); for (const m of CG.espelhos.values()) { if (m.alvoX == null) continue; if (typeof suavAnda === 'function') suavAnda(m, dt || 16, m.alvoX, m.alvoY); else { m.x += (m.alvoX - m.x) * k; m.y += (m.alvoY - m.y) * k; } if (m.movRemoto) { m.mov = true; m.fase = (m.fase || 0) + (dt || 16) / 90; } } } } catch (e) { }
    return r;
  };
}

/* ---------- dano, quem ajudou e o prêmio de grupo ---------- */
{
  const _danoGr = aplicaDano;
  aplicaDano = function (m, dano) {
    if (CG.modo === 'convidado' && m && m.espelho) { // o golpe vale lá no líder
      m.bravo = true; if (dano <= 0) { efeito('puff', m.x, m.y); texto(m, 'defendeu', '#d8e0ff', 700); return; }
      m.hitT = G.agora; texto(m, dano, '#ffcf4a'); CG.danei.set(m.cgUid, Date.now());
      if (CG.sock) CG.sock.emit('grupo-dano', { u: m.cgUid, d: Math.round(dano) });
      return;
    }
    if (CG.modo && m && !CG.remotoDano) m._grEu = Date.now(); // você bateu (para o prêmio)
    return _danoGr.apply(this, arguments);
  };
  const _matarGr = matar;
  matar = function (m) {
    if (!CG.modo || !m) return _matarGr.apply(this, arguments);
    if (CG.modo === 'lider' && m.uid) CG.mortos.push(m.uid);
    const ajudei = CG.modo === 'convidado' || Date.now() - (m._grEu || 0) < 20000;
    CG.fatorAgora = ajudei ? cgFator() : 0; CG.semPremio = !ajudei;
    try { return _matarGr.apply(this, arguments); } finally { CG.fatorAgora = null; CG.semPremio = false; }
  };
  // quem não bateu: a linha do chat diz que foi o grupo (e que não teve prêmio), não "Você passou por..."
  const _logGr = log;
  log = function (txt) {
    if (CG.semPremio && typeof txt === 'string' && /^Você passou por /.test(txt)) arguments[0] = txt.replace(/^Você passou por ([^.]*)\..*$/, '👥 O grupo passou por $1 (você não chegou a bater: sem prêmio).');
    return _logGr.apply(this, arguments);
  };
  const _penGr = penalidadeNivel;
  penalidadeNivel = function () {
    const p = _penGr.apply(this, arguments);
    if (CG.fatorAgora == null || !p) return p;
    return Object.assign({}, p, { xp: p.xp * CG.fatorAgora, drop: p.drop * CG.fatorAgora });
  };
}
function cgRecebeDano(de, mapa, d) {
  if (CG.modo !== 'lider' || !d || !G.mapa || mapa !== G.mapa.id) return;
  const m = G.mons.find(x => x.uid === d.u); const dano = Math.max(0, Math.min(1e12, Math.round(+d.d || 0)));
  if (!m || !dano) return;
  const p0 = G.semEmpurrao; G.semEmpurrao = true; CG.remotoDano = true;
  try { aplicaDano(m, dano); } finally { G.semEmpurrao = p0; CG.remotoDano = false; }
}
// líder: as criaturas correm atrás do jogador MAIS PERTO (G.p vira o colega só durante a conta)
{
  const _amGr = atualizaMonstro;
  atualizaMonstro = function (m, dt) {
    if (CG.modo === 'convidado' && m.espelho) { const x0 = m.x, y0 = m.y, r = _amGr.apply(this, arguments); m.x = x0; m.y = y0; return r; } // quem anda é o líder; aqui só valem os golpes
    if (CG.modo !== 'lider' || !CG.remotos.size) return _amGr.apply(this, arguments);
    let alvo = G.p, d0 = G.save.hp > 0 ? Math.hypot(m.x - G.p.x, m.y - G.p.y) : 1e9;
    for (const { ent } of CG.remotos.values()) { const d = Math.hypot(m.x - ent.x, m.y - ent.y); if (ent.coHp > 0 && d < d0) { d0 = d; alvo = ent; } }
    if (alvo === G.p) return _amGr.apply(this, arguments);
    const real = G.p; G.p = alvo; CG.proxy = true;
    try { return _amGr.apply(this, arguments); } finally { G.p = real; CG.proxy = false; }
  };
  const _ataGr = monstroAtaca;
  monstroAtaca = function () { if (CG.proxy) return; return _ataGr.apply(this, arguments); };
  const _projGr = projetil;
  projetil = function (de, para, tipo, cb) { if (CG.proxy) return _projGr.call(this, de, para, tipo, () => { }); return _projGr.apply(this, arguments); };
}

/* ---------- janela do grupo ---------- */
async function cgAbre() {
  if (!cgLigado()) return avisoJogo('👥 A caça em grupo só funciona no site (educacaogamer.com.br), com a sua conta.');
  CG.painelAberto = true;
  abreModal(el('h2', {}, '👥 Caçar em grupo'), el('p', { class: 'vazio' }, 'Conectando...'));
  try { await cgConecta(); } catch (e) { return abreModal(el('h2', {}, '👥 Caçar em grupo'), el('p', {}, 'Não deu para conectar agora. Tente de novo em instantes.')); }
  cgRedesenhaPainel(true);
}
async function cgCriar() { const r = await cgPede('grupo-criar', { perfil: cgPerfil(), mapa: G.mapa && G.mapa.id }); if (r.erro) return avisoJogo('👥 ' + r.erro); CG.ondeEnviado = G.mapa && G.mapa.id; cgAtualizaGrupo(r.grupo); cgRedesenhaPainel(true); }
async function cgEntrar(codigo) {
  try { await cgConecta(); } catch (e) { return avisoJogo('👥 Não deu para conectar agora.'); }
  const r = await cgPede('grupo-entrar', { codigo, perfil: cgPerfil(), mapa: G.mapa && G.mapa.id }); if (r.erro) return avisoJogo('👥 ' + r.erro);
  CG.ondeEnviado = G.mapa && G.mapa.id; CG.painelAberto = true; cgAtualizaGrupo(r.grupo); cgRedesenhaPainel(true);
}
async function cgSair() { await cgPede('grupo-sair', {}); cgSaiDoModo(); CG.grupo = null; CG.painelAberto = false; fechaModal(); }
const cgOnde = id => !id ? '—' : (typeof CACA_POR_ID !== 'undefined' && CACA_POR_ID[id] ? '⚔️ ' + CACA_POR_ID[id].nome : '📍 ' + ((getMapa(id) || {}).nome || id));
async function cgRedesenhaPainel(forcar) {
  if (!forcar && !CG.painelAberto) return;
  const g = CG.grupo, fat = Object.entries(CG_FATOR).filter(([n]) => n > 1).map(([n, f]) => `${n} juntos: ${Math.round(f * 100)}%`).join(' · ');
  const fx = cgFaixaDe(G.save.nivel);
  const regra = el('p', { class: 'dica' }, `🎚️ Você (nível ${G.save.nivel}) caça em grupo com quem está entre os níveis ${fx.de} e ${fx.ate} (o mais alto pode ser no máximo 50% maior que o mais baixo). Na caça em grupo vocês derrubam muito mais adversários por minuto, então cada adversário dá menos XP, tostões e chance de item (${fat}). Itens que uma missão pede caem como sempre.`);
  if (!g) {
    const cod = el('input', { maxlength: 5, placeholder: 'CÓDIGO', style: 'width:110px;text-transform:uppercase;font-weight:800;text-align:center' });
    const conv = CG.convites.filter(c => Date.now() - c.t < 10 * 60000);
    abreModal(el('h2', {}, '👥 Caçar em grupo'),
      el('p', {}, 'Monte um grupo com até 3 amigos. Quando o líder entra numa área de caça, os outros podem ir junto e caçar os MESMOS adversários.'),
      conv.length ? el('div', { class: 'opcoes' }, ...conv.map(c => el('button', { class: 'btn amarelo', onclick: () => cgEntrar(c.codigo) }, `📨 Entrar no grupo de ${c.de}`))) : '',
      el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', onclick: cgCriar }, '➕ Criar um grupo (eu sou o líder)')),
      el('div', { class: 'opcoes', style: 'align-items:center' }, 'Tem um código?', cod, el('button', { class: 'btn', onclick: () => cgEntrar(cod.value) }, 'Entrar')),
      regra, el('p', { class: 'dica' }, 'Só amigos de quem criou o grupo podem entrar (☰ Mais › 🤝 Amigos: dá para adicionar pelo apelido ou pedir amizade a quem está perto na cidade). Para falar com o grupo há 8 emojis — nada de chat.'));
    return;
  }
  const souLider = g.lider === cgEu();
  const membros = el('div', { class: 'co-membros' }, ...g.membros.map(m => el('div', { class: 'co-membro' }, `${m.id === g.lider ? '👑 ' : '⚽ '}${m.apelido} · Nv ${m.nivel} · ${cgOnde(m.mapa)}`, m.id !== cgEu() && !cgFaixaOk(m.nivel || 1, G.save.nivel) ? el('span', { class: 'cg-longe' }, ' ⚠️ nível longe demais: na caça cada um fica sozinho') : '')));
  const lider = g.membros.find(m => m.id === g.lider), ir = lider && !souLider && cgEhCaca(lider.mapa) && (!G.mapa || G.mapa.id !== lider.mapa);
  const chamar = el('div', { class: 'co-amigos' }, souLider ? el('p', { class: 'vazio' }, 'Carregando amigos...') : '');
  abreModal(el('h2', {}, `👥 Grupo ${g.codigo}`), el('p', {}, 'Código para os amigos: ', el('b', { class: 'co-codigo' }, g.codigo), ` (${g.membros.length}/4)`), membros,
    souLider ? el('p', { class: 'dica' }, '👑 Você é o líder: entre numa área de caça e os outros recebem o convite para ir junto.') : el('p', { class: 'dica' }, `Quando ${lider ? lider.apelido : 'o líder'} entrar numa área de caça, você recebe o convite.`),
    ir ? el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', onclick: () => { fechaModal(); trocaMapa(lider.mapa); } }, `⚔️ Ir até ${lider.apelido} (${CACA_POR_ID[lider.mapa].nome})`)) : '',
    el('div', { class: 'gr-emotes' }, ...CG_EMOTES.map((e, i) => el('button', { type: 'button', onclick: () => CG.sock && CG.sock.emit('grupo-emote', { i }) }, e))),
    regra,
    souLider ? el('h3', {}, '📨 Chamar amigos') : '', chamar,
    el('div', { class: 'opcoes' }, el('button', { class: 'btn', onclick: cgSair }, '🚪 Sair do grupo'), el('button', { class: 'btn', onclick: () => { CG.painelAberto = false; fechaModal(); } }, 'Fechar (continuo no grupo)')));
  if (!souLider) return;
  try {
    const r = await amgPede('GET', '/amigos'); const lista = (r.ok && r.dados.amigos) || [];
    chamar.innerHTML = '';
    if (!lista.length) chamar.append(el('p', { class: 'vazio' }, 'Nenhum amigo seu joga o Lenda ainda.'));
    chamar.append(el('button', { class: 'btn mini', type: 'button', onclick: () => typeof modalAmigos === 'function' && modalAmigos() }, '➕ Adicionar amigos'));
    for (const a of lista.filter(a => !g.membros.some(m => m.id === a.id)).slice(0, 12))
      chamar.append(el('div', { class: 'amg-linha' }, el('span', {}, `${a.apelido} · Nv ${a.nivel}`), el('button', { class: 'btn mini', onclick: async ev => { const r2 = await cgPede('grupo-convidar', { amigoId: a.id }); ev.target.textContent = r2.ok ? '✅ Chamado' : '❌'; ev.target.disabled = true; } }, '📨 Chamar')));
  } catch (e) { chamar.innerHTML = ''; chamar.append(el('p', { class: 'vazio' }, 'Passe o código para os amigos.')); }
}
// fechou a janela pelo ✕: para de redesenhar
{ const _fmGr = fechaModal; fechaModal = function () { CG.painelAberto = false; return _fmGr.apply(this, arguments); }; }

/* ---------- no menu ☰ Mais ---------- */
(function poeBotaoGr(t = 0) {
  if (!cgLigado()) return;
  const lista = document.querySelector('.tb-lista'); if (!lista) { if (t < 40) setTimeout(() => poeBotaoGr(t + 1), 500); return; }
  if (document.getElementById('btnGrupo')) return;
  const b = el('button', { class: 'btn', id: 'btnGrupo', type: 'button', role: 'menuitem' }, '👥 Caçar em grupo'); b.onclick = cgAbre;
  lista.append(b);
})();
{
  const css = document.createElement('style');
  css.textContent = `.cg-longe { color: #c0392b; font-weight: 700; } .gr-emotes { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; } .gr-emotes button { font-size: 22px; width: 42px; height: 38px; border: 0; border-radius: 10px; background: rgba(0,0,0,.07); cursor: pointer; }`;
  document.head.append(css);
}
window.GRUPO = { CG, CG_FATOR, cgFator, cgNaCaca, cgDecideModo };
