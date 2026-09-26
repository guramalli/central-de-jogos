/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   RUMO AO CRAQUE — motor v2
   movimento livre, câmera suave, combate por alvo,
   prédios com interior, guia (setas) e tutorial
   ============================================================ */
const SAVE_KEY = 'rac_save_v2', SAVE_V1 = 'rac_save_v1', RANK_KEY = 'rac_ranking_v1';
const R_ENT = 0.28;
const DIRS = [[0, 1], [-1, 0], [1, 0], [0, -1]];
const OBJ_VISAO = new Set(['arvore', 'mangueira', 'coqueiro', 'coqueiro2', 'x', 'estante', 'torre', 'holofote', 'quiosque', 'banca', 'carro', 'carro2', 'placar', 'arquibancada']);

const G = {
  save: null, mapa: null, p: null, mons: [], npcs: [], respawns: [], fx: [], textos: [], falas: [], projs: [], drops: [],
  alvo: null, modo: 'drible', agora: 0, teclas: new Set(), joy: null, caminho: null, acaoChegar: null,
  cds: {}, buffs: {}, cdAtaque: 0, rodando: false, pausado: false, uid: 0,
  tUI: 0, tBatalha: 0, tSave: 0, tRegen: 0, acumHp: 0, acumFoco: 0, uiSujo: true, somOn: true,
  cam: { x: 0, y: 0 }, zoom: 1, dpr: 1, mouse: null, andou: 0, guiaOn: true, dicasFila: [], tMsgSaida: 0,
};

/* ---------------- utilidades ---------------- */
const $ = s => document.querySelector(s);
const rnd = (a, b) => a + Math.random() * (b - a);
const rndi = (a, b) => Math.floor(rnd(a, b + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = n => Math.floor(n).toLocaleString('pt-BR');
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const tileDe = e => ({ x: Math.floor(e.x), y: Math.floor(e.y) });
function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') e.className = attrs[k];
    else if (k === 'html') e.innerHTML = attrs[k];
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== false) e.setAttribute(k, attrs[k]);
  }
  kids.flat().forEach(k => { if (k == null || k === false) return; e.append(k.nodeType ? k : document.createTextNode(k)); });
  return e;
}
// Curva de XP: cúbica (estilo Tibia) e mais íngreme depois do nível 50 (midgame e Europa)
function xpPara(L) { if (L <= 1) return 0; const base = 50 / 9 * (L * L * L - 6 * L * L + 17 * L - 12); const extra = L > 50 ? 1 + (L - 50) / 40 : 1; return Math.round(base * extra); }
function faseIdx(nivel) { let f = 0; FASES.forEach((x, i) => { if (nivel >= x.min) f = i; }); return f; }

/* ---------------- save ---------------- */
function novoSave(d) {
  return {
    v: 2, nome: d.nome, corpo: d.corpo,
    look: { pele: d.pele, cabelo: d.cabelo, corCabelo: d.corCabelo, roupa: d.roupa, baixo: d.baixo, rosto: d.rosto },
    nivel: 1, xp: 0, hp: 100, foco: 40, ouro: 20,
    sk: { drible: { lv: 10, t: 0 }, chute: { lv: 10, t: 0 }, defesa: { lv: 10, t: 0 }, visao: { lv: 0, t: 0 } },
    posicao: null,
    equip: { cabeca: null, camisa: 'camiseta', calcao: 'shorts_rasgado', perna: null, chuteira: 'pe_descalco', acessorio: null },
    mochila: [{ id: 'agua', q: 3 }], hotbar: [{ t: 'i', id: 'agua' }, null, null, null, null, null, null, null, null, null],
    dribles: [], quests: {}, flags: {}, kills: {}, figs: {}, tarefa: null,
    mapa: 'casa', x: 2.5, y: 3.6,
    st: { mortes: 0, gols: 0, quiz: 0, prof: 0, tempo: 0, chefes: 0, abates: 0 },
    criado: Date.now(), dia: 1, hora: 7 * 60, time: null, tut: 0, dicas: {},
    classe: d.classe || null, atr: Object.assign({}, (CLASSES[d.classe] || {}).base || { defesa: 5, habilidade: 5, inteligencia: 5, folego: 5 }), pontos: 0,
  };
}
function lerSave() {
  try {
    let s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (!s) { const v1 = JSON.parse(localStorage.getItem(SAVE_V1) || 'null'); if (v1) { s = v1; s.v = 2; s.x += 0.5; s.y += 0.5; s.tut = 99; s.dicas = {}; } }
    return s && s.v ? s : null;
  } catch { return null; }
}
// prêmio (missão, álbum, baú, desafio...): nunca se perde. Mochila → armazém → guardado até abrir espaço
function recebeItem(id, n = 1) {
  const s = G.save; if (!ITENS[id]) return null;
  const c0 = contaItem(id);
  if (addItem(id, n)) return 'mochila';
  const falta = n - Math.max(0, contaItem(id) - c0); if (falta <= 0) return 'mochila';
  if (typeof guardaNoArmazem === 'function' && (armazem(), guardaNoArmazem(id, falta))) { log(`🎒 Mochila cheia: ${falta}x ${ITENS[id].nome} ${falta > 1 ? 'foram guardados' : 'foi guardado'} no seu ARMAZÉM.`, 'l-loot'); return 'armazem'; }
  (s.pendentes = s.pendentes || []).push([id, falta]);
  log(`🎒 Mochila e armazém cheios: ${falta}x ${ITENS[id].nome} fica guardado para você — libere espaço e ele chega sozinho.`, 'l-dano'); return 'pendente';
}
// prêmios que não couberam em lugar nenhum: chegam quando abrir espaço
function entregaPendentes() {
  const s = G.save; if (!s || !Array.isArray(s.pendentes) || !s.pendentes.length) return;
  const ficam = [];
  for (const [id, n] of s.pendentes) {
    if (!ITENS[id]) continue;
    const cabe = s.mochila.length < 30 || (empilha(id) && s.mochila.some(i => i.id === id));
    if (!cabe) { ficam.push([id, n]); continue; }
    const c0 = contaItem(id); addItem(id, n); const veio = contaItem(id) - c0;
    if (veio > 0) log(`📦 Chegou o prêmio que estava guardado: ${veio}x ${ITENS[id].nome}.`, 'l-loot');
    if (veio < n) ficam.push([id, n - veio]);
  }
  s.pendentes = ficam;
}
function salvar() {
  const s = G.save; if (!s || !G.mapa) return;
  if (s.pendentes && s.pendentes.length) entregaPendentes();
  s.mapa = G.mapa.id; if (Number.isFinite(G.p.x) && Number.isFinite(G.p.y)) { s.x = G.p.x; s.y = G.p.y; }
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch { }
  atualizaRanking();
}
function lerRanking() { try { return JSON.parse(localStorage.getItem(RANK_KEY) || '[]'); } catch { return []; } }
function atualizaRanking() {
  const s = G.save; const lista = lerRanking().filter(r => r.id !== s.criado);
  const time = s.time ? { nome: s.time.nome, div: s.time.div, titulos: s.time.titulos || 0 } : null;
  lista.push({ id: s.criado, nome: s.nome, nivel: s.nivel, xp: s.xp, posicao: s.posicao, fase: FASES[faseIdx(s.nivel)].nome, chefes: s.st.chefes, figs: Object.keys(s.figs).length, time, data: Date.now() });
  lista.sort((a, b) => b.xp - a.xp);
  try { localStorage.setItem(RANK_KEY, JSON.stringify(lista.slice(0, 50))); } catch { }
  enviaRankingOnline(lista.find(r => r.id === s.criado));
}
// Ranking online (site Educação Gamer, PUT /api/lenda/ranking): manda o resumo
// da conta logada no site, no máximo 1x por minuto (salvar() roda toda hora).
// O nome mostrado lá é o apelido da conta, não o do personagem.
let ultimoEnvioRanking = 0;
function enviaRankingOnline(r) {
  if (typeof PORTAL === 'undefined' || !PORTAL.ativo || !PORTAL.token || !r) return;
  if (typeof saveDaConta === 'function' && !saveDaConta()) return; // personagem de outra conta: não entra no ranking desta
  const agora = Date.now(); if (agora - ultimoEnvioRanking < 60000) return; ultimoEnvioRanking = agora;
  const corpo = { nivel: r.nivel, xp: Math.floor(r.xp || 0), posicao: r.posicao || null, fase: r.fase, time: r.time, chefes: r.chefes || 0, figs: r.figs || 0 };
  fetch(PORTAL.api + '/api/lenda/ranking', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + PORTAL.token }, body: JSON.stringify(corpo) })
    .then(async res => { // guarda o resultado: a janela do Ranking mostra se entrou ou por que não entrou
      let msg = ''; if (!res.ok) { try { msg = (await res.json()).error || ''; } catch (e) { } console.warn('[ranking] envio recusado', res.status, msg); }
      RANK_ONLINE = { quando: Date.now(), ok: res.ok, status: res.status, msg };
    })
    .catch(() => { RANK_ONLINE = { quando: Date.now(), ok: false, status: 0, msg: 'sem conexão com o site' }; });
}
let RANK_ONLINE = null; // último envio ao ranking online: { quando, ok, status, msg }
function enviaRankingJa() { ultimoEnvioRanking = 0; if (G.save) atualizaRanking(); }

/* ---------------- atributos ---------------- */
// comidas fazendo efeito agora: [{ id, resta (s) }]. Saves antigos tinham uma só (s.comida).
const COMIDAS_MAX = 3;
function comidasAtivas(s) {
  if (!s) return [];
  if (!Array.isArray(s.comidas)) s.comidas = [];
  if (s.comida) { if (ITENS[s.comida.id] && !s.comidas.some(c => c.id === s.comida.id)) s.comidas.push(s.comida); s.comida = null; }
  return s.comidas;
}
function stats() {
  const s = G.save; const pos = POSICOES[s.posicao];
  let atk = 0, def = 0; const b = { drible: 0, chute: 0, defesa: 0, visao: 0, hp: 0, foco: 0, vel: 0, regen: 0 };
  for (const slot in s.equip) {
    const id = s.equip[slot]; if (!id) continue; const it = ITENS[id]; if (!it) continue;
    const r = (s.equipR && s.equipR[slot]) || 0;
    atk += (it.atk || 0) * (1 + 0.12 * r); def += (it.def || 0) * (1 + 0.12 * r);
    for (const k in (it.st || {})) b[k] += it.st[k] * (1 + 0.1 * r);
  }
  atk = Math.round(atk * 10) / 10; def = Math.round(def * 10) / 10;
  const nivel = s.nivel;
  const buff = (G.buffs.arrancada || 0) > G.agora ? DRIBLES.arrancada.vel : 0;
  const a = Object.assign({}, s.atr || { defesa: 5, habilidade: 5, inteligencia: 5, folego: 5 }); const cl = s.classe;
  // comidas: até COMIDAS_MAX diferentes ao mesmo tempo, os bônus SOMAM
  const coms = comidasAtivas(s).map(c => ITENS[c.id] && ITENS[c.id].efeito).filter(Boolean); const mc = 1 + nivel / 25;
  const com = { vel: 0, regen: 0, regenFoco: 0 };
  for (const e of coms) { for (const k in (e.atr || {})) a[k] += Math.round(e.atr[k] * mc); com.vel += e.vel || 0; com.regen += e.regen || 0; com.regenFoco += e.regenFoco || 0; }
  const velBase = (220 + 2 * (nivel - 1) + b.vel + a.folego * 0.35 + ((com && com.vel) || 0)) * (cl === 'motorzinho' ? 1.08 : 1);
  return {
    nivel, atk, atr: a,
    maxHp: Math.round(100 + (nivel - 1) * (pos ? pos.hp : 10) + b.hp + a.folego * 4),
    maxFoco: Math.round(40 + (nivel - 1) * (pos ? pos.foco : 7) + b.foco + a.inteligencia * 3),
    drible: s.sk.drible.lv + b.drible, chute: s.sk.chute.lv + b.chute, defesa: s.sk.defesa.lv + b.defesa, visao: s.sk.visao.lv + b.visao,
    armadura: def, def: def + (s.sk.defesa.lv + b.defesa) * 0.3 + (s.posicao === 'zagueiro' ? 4 : 0) + a.defesa * 0.35,
    vel: velBase + buff,
    regenHp: (0.6 + nivel * 0.06 + b.regen * 0.5 + (s.posicao === 'zagueiro' ? 0.6 : 0) + a.folego * 0.04 + ((com && com.regen) || 0) * mc) * (cl === 'motorzinho' ? 2 : 1),
    regenFoco: 0.8 + nivel * 0.07 + b.regen * 0.5 + (s.posicao === 'meia' ? 1.2 : 0) + a.inteligencia * 0.03 + ((com && com.regenFoco) || 0) * mc,
    danoMult: (pos ? pos.dano : 1) * (1 + a.habilidade * 0.006),
    crit: Math.min(0.45, 0.03 + a.habilidade * 0.0015 + (cl === 'driblador' ? 0.08 : 0)),
    bloqueio: Math.min(0.35, (cl === 'paredao' ? 0.12 : 0) + a.defesa * 0.001),
    poderMult: 1 + a.inteligencia * 0.008, curaMult: 1 + a.inteligencia * 0.012,
    custoFoco: cl === 'cerebro' ? 0.8 : 1,
    xpEstudo: 1 + a.inteligencia * 0.004 + (cl === 'cerebro' ? 0.25 : 0),
  };
}
function precisaTentativas(sk, lv) {
  const pos = POSICOES[G.save.posicao]; const taxa = pos ? pos.taxa[sk] : 1;
  // v30: cerca de 2x mais rápido que antes (era 110·1,1^lv e 36·1,075^(lv−10))
  if (sk === 'visao') return Math.max(1, Math.round(60 * Math.pow(1.09, lv) * taxa));
  return Math.max(1, Math.round(18 * Math.pow(1.07, lv - 10) * taxa));
}
function treinaSkill(sk, n) {
  const o = G.save.sk[sk]; o.t += n; let subiu = false; G.skSujo = true;
  while (o.t >= precisaTentativas(sk, o.lv)) { o.t -= precisaTentativas(sk, o.lv); o.lv++; subiu = true; }
  if (subiu) { log(`Você avançou para ${SKILLS[sk].nome} ${o.lv}!`, 'l-lvl'); som('skill'); G.uiSujo = true; dica('skill', `Sua habilidade ${SKILLS[sk].nome} subiu! Habilidades melhoram com o USO: quanto mais você dribla, chuta e defende, melhor fica. Veja tudo na aba Habilidades.`, '[data-aba=skills]'); }
}
const ALT_FASE = [1.28, 1.42, 1.56, 1.68, 1.76];
function lookJogador(retrato) {
  const s = G.save, eq = s.equip, fase = faseIdx(s.nivel);
  const av = id => id && ITENS[id] && ITENS[id].avatar;
  const L = { tipo: 'humano', corpo: s.corpo, pele: s.look.pele, cabelo: s.look.cabelo, corCabelo: s.look.corCabelo === 'original' ? null : s.look.corCabelo, rosto: s.look.rosto || null };
  const cam = eq.camisa && ITENS[eq.camisa];
  L.roupa = av(eq.camisa) || (eq.camisa ? s.look.roupa : 'roupa-regata');
  if (cam && cam.avatar === 'roupa-futebol' && cam.cor && eq.camisa !== 'camisa_vila') L.corRoupa = cam.cor;
  L.baixo = av(eq.calcao) || s.look.baixo;
  const cab = av(eq.cabeca); if (cab) L.chapeu = cab;
  const pes = av(eq.acessorio); if (pes) L.pescoco = pes;
  if (fase === 0) L.costas = 'costas-mochila'; if (fase === 4) L.costas = 'costas-anjo';
  if (retrato) { L.fundo = FASES[fase].fundo; if (s.flags.craque) L.mao = 'mao-estatueta-ouro'; else if (s.flags.pegou_bola) L.mao = 'mao-bola'; }
  return L;
}

/* ---------------- colisão e caminhos ---------------- */
function tileBloq(tx, ty) {
  const m = G.mapa; if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return true;
  if (!CH_ANDA(m.chao[ty * m.w + tx])) return true;
  const o = m.obj[ty * m.w + tx]; return !!(o && OBJ_BLOQUEIA.has(o.t));
}
function podeAndar(tx, ty) { return !tileBloq(tx, ty); }
function colide(x, y, r) {
  const x0 = Math.floor(x - r), x1 = Math.floor(x + r), y0 = Math.floor(y - r), y1 = Math.floor(y + r);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (!tileBloq(tx, ty)) continue;
    const cx = clamp(x, tx, tx + 1), cy = clamp(y, ty, ty + 1);
    if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) return true;
  }
  return false;
}
// para onde o personagem está virado: de costas subindo, de frente descendo, de lado andando na horizontal
function olha(e, dx, dy) {
  const ax = Math.abs(dx), ay = Math.abs(dy); if (ax + ay < 1e-4) return;
  e.vista = ay > ax * 1.2 ? (dy < 0 ? 'costas' : 'frente') : 'lado'; e.tVista = G.agora;
}
function mover(e, dx, dy, r = R_ENT) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 0.12)); let mov = 0;
  for (let i = 0; i < n; i++) {
    const sx = dx / n, sy = dy / n;
    if (sx && !colide(e.x + sx, e.y, r)) { e.x += sx; mov += Math.abs(sx); }
    else if (sx && Math.abs(dy) < 1e-6) { // ajuda a contornar quinas
      const fy = e.y - Math.floor(e.y); const al = fy < 0.5 ? -1 : 1; const st = Math.min(0.05, Math.abs(sx));
      if (!colide(e.x + sx, e.y + al * 0.3, r) && !colide(e.x, e.y + al * st, r)) e.y += al * st;
    }
    if (sy && !colide(e.x, e.y + sy, r)) { e.y += sy; mov += Math.abs(sy); }
    else if (sy && Math.abs(dx) < 1e-6) {
      const fx = e.x - Math.floor(e.x); const al = fx < 0.5 ? -1 : 1; const st = Math.min(0.05, Math.abs(sy));
      if (!colide(e.x + al * 0.3, e.y + sy, r) && !colide(e.x + al * st, e.y, r)) e.x += al * st;
    }
  }
  return mov;
}
function corpos() { return [G.p, ...G.mons.filter(m => m.d.look.tipo !== 'gaivota'), ...G.npcs]; }
function separa(e) {
  const r = e.r || R_ENT;
  for (const o of corpos()) {
    if (o === e) continue; const dx = e.x - o.x, dy = e.y - o.y, d = Math.hypot(dx, dy), min = r + (o.r || R_ENT);
    if (d < min) { const k = min - d + 0.001; const ux = d > 1e-4 ? dx / d : 1, uy = d > 1e-4 ? dy / d : 0; const nx = e.x + ux * k, ny = e.y + uy * k; if (!colide(nx, ny, r)) { e.x = nx; e.y = ny; } }
  }
}
function segLivre(ax, ay, bx, by, r = R_ENT) {
  const d = Math.hypot(bx - ax, by - ay); const n = Math.ceil(d / 0.2);
  for (let i = 1; i <= n; i++) { const t = i / n; if (colide(ax + (bx - ax) * t, ay + (by - ay) * t, r)) return false; }
  return true;
}
// BFS nos tiles (ignora entidades); retorna centros dos tiles
function caminho(sx, sy, objetivo, max = 4000) {
  if (objetivo(sx, sy)) return [];
  const m = G.mapa; const vis = new Map(); const fila = [[sx, sy]]; vis.set(sy * m.w + sx, -1); let n = 0;
  while (fila.length && n++ < max) {
    const [x, y] = fila.shift();
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy, k = ny * m.w + nx;
      if (vis.has(k) || tileBloq(nx, ny)) continue;
      const fim = objetivo(nx, ny);
      if (!fim && G.npcs.some(n => Math.floor(n.x) === nx && Math.floor(n.y) === ny)) continue;
      vis.set(k, y * m.w + x);
      if (fim) { const out = []; let c = k; while (c !== sy * m.w + sx) { out.unshift({ x: c % m.w + 0.5, y: Math.floor(c / m.w) + 0.5 }); c = vis.get(c); } return out; }
      fila.push([nx, ny]);
    }
  }
  return null;
}
function segue(e, cam, v, r = R_ENT) { // anda pelos pontos; true quando termina
  while (cam.length > 1 && segLivre(e.x, e.y, cam[1].x, cam[1].y, r)) cam.shift();
  const alvo = cam[0]; if (!alvo) return true;
  const dx = alvo.x - e.x, dy = alvo.y - e.y, d = Math.hypot(dx, dy);
  if (d < 0.08) { cam.shift(); return !cam.length; }
  const k = Math.min(v, d) / d; const mov = mover(e, dx * k, dy * k, r); if (mov > 0.0005) olha(e, dx, dy);
  if (Math.abs(dx) > 0.02) e.flip = dx < 0;
  e.mov = mov > 0.0005; e.fase = (e.fase || 0) + mov * 7;
  if (mov < v * 0.1) e.preso = (e.preso || 0) + 1; else e.preso = 0;
  return false;
}
function linhaVisao(a, b) {
  const n = Math.ceil(dist(a, b) / 0.25); const m = G.mapa;
  for (let i = 1; i < n; i++) {
    const t = i / n; const x = Math.floor(a.x + (b.x - a.x) * t), y = Math.floor(a.y + (b.y - a.y) * t);
    const o = m.obj[y * m.w + x]; if (o && OBJ_VISAO.has(o.t)) return false;
  }
  return true;
}
// lugar livre pra nascer/passear perto de (x,y): só quadros que dá pra ALCANÇAR andando a partir
// do ponto (cerca, grade, prédio e água separam) — antes podia nascer do outro lado da grade
const POS_LIVRE_CACHE = new WeakMap();
function areaDoSpawn(x, y, raio) {
  const m = G.mapa; if (!m) return [];
  let cache = POS_LIVRE_CACHE.get(m); if (!cache) POS_LIVRE_CACHE.set(m, cache = new Map());
  const chave = x + ',' + y + ',' + raio; if (cache.has(chave)) return cache.get(chave);
  let ini = podeAndar(x, y) ? [x, y] : null; // o próprio ponto, ou o livre mais perto dele
  for (let r = 1; r <= 3 && !ini; r++) for (let dy = -r; dy <= r && !ini; dy++) for (let dx = -r; dx <= r && !ini; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r && podeAndar(x + dx, y + dy)) ini = [x + dx, y + dy];
  const ok = [];
  if (ini) {
    const lim = Math.max(0, raio | 0) + (ini[0] !== x || ini[1] !== y ? 1 : 0);
    const vis = new Set([ini[1] * m.w + ini[0]]); const fila = [ini];
    for (let k = 0; k < fila.length; k++) {
      const [cx, cy] = fila[k]; ok.push(fila[k]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy; if (Math.abs(nx - x) > lim || Math.abs(ny - y) > lim) continue;
        const i = ny * m.w + nx; if (vis.has(i) || !podeAndar(nx, ny)) continue; vis.add(i); fila.push([nx, ny]);
      }
    }
  }
  cache.set(chave, ok); return ok;
}
function posLivre(x, y, raio) {
  const ok = areaDoSpawn(x, y, raio);
  if (!ok.length) return podeAndar(x, y) ? { x: x + 0.5, y: y + 0.5 } : null;
  const longe = ok.filter(([i, j]) => !(G.p && Math.hypot(i + 0.5 - G.p.x, j + 0.5 - G.p.y) < 3));
  const lista = longe.length ? longe : ok; const [i, j] = lista[rndi(0, lista.length - 1)];
  return { x: i + 0.5, y: j + 0.5 };
}

/* ---------------- mapa e entidades ---------------- */
function criaMonstro(sp) {
  const d = MONSTROS[sp.m]; const pos = sp.raio === 0 && podeAndar(sp.x, sp.y) ? { x: sp.x + 0.5, y: sp.y + 0.5 } : posLivre(sp.x, sp.y, sp.raio);
  if (!pos) return null;
  return { uid: ++G.uid, tipo: sp.m, d, x: pos.x, y: pos.y, flip: Math.random() < 0.5, fase: 0, mov: false, hp: d.hp, sp, cdAtk: 0, cdRng: G.agora + 1500, prox: G.agora + rnd(300, 3000), bravo: false, r: d.look.grande ? 0.38 : R_ENT };
}
function entrarMapa(id, x, y, silencioso) {
  G.mapa = getMapa(id);
  if (!Number.isFinite(x) || !Number.isFinite(y)) { const r = G.mapa.renasce || G.mapa.inicio || { x: 1, y: 1 }; x = r.x + 0.5; y = r.y + 0.5; } // posição inválida (save antigo quebrado): vai para a chegada do mapa
  G.mons = []; G.respawns = []; G.fx = []; G.textos = []; G.falas = []; G.projs = []; G.drops = []; G.alvo = null; G.caminho = null; G.acaoChegar = null;
  G.npcs = G.mapa.npcs.map(n => ({ id: n.id, d: NPCS[n.id], x: n.x + 0.5, y: n.y + 0.5, flip: false, r: 0.32 }));
  if (!G.p) G.p = { x, y, flip: false, fase: 0, mov: false };
  Object.assign(G.p, { x, y }); G.p.mov = false; G.p.cam = null;
  for (const sp of G.mapa.spawns) for (let i = 0; i < sp.qtd; i++) { const m = criaMonstro(sp); if (m) G.mons.push(m); }
  preCarregaMapa();
  $('#nomeMapa').textContent = G.mapa.nome; { const lt = $('#lugarTela'); if (lt) lt.textContent = '📍 ' + G.mapa.nome; } // nome do lugar também no alto da tela do jogo
  const cam = alvoCamera(); G.cam.x = cam.x; G.cam.y = cam.y;
  if (!silencioso && !G.mapa.interior) { log(`Você chegou em: ${G.mapa.nome}.`, 'l-sis'); banner(G.mapa.nome, FASES[faseIdx(G.save.nivel)].nome + ' — nível ' + G.save.nivel); }
  G.uiSujo = true;
}
function trocaMapa(id, x, y) { entrarMapa(id, x, y); som('porta'); salvar(); }
function preCarregaMapa() {
  preCarrega(lookJogador()); preCarrega(lookJogador(true));
  for (const n of G.npcs) if (n.d.look && n.d.look.tipo === 'humano') preCarrega(n.d.look);
  for (const sp of G.mapa.spawns) { const l = MONSTROS[sp.m].look; if (l.tipo === 'humano') preCarrega(l); }
}

/* ---------------- jogador ---------------- */
function velJogador() {
  const t = tileDe(G.p); const c = G.mapa.chao[t.y * G.mapa.w + t.x];
  return stats().vel / 60 * (c === CH.AREIA || c === CH.AREIA_MOLHADA ? 0.88 : 1);
}
// está na tela? (folga em quadros além da beirada)
function naTela(e, folga = 0) {
  if (!CV || !G.zoom || !G.cam) return true;
  const vw = CV.width / G.zoom, vh = CV.height / G.zoom, x = e.x * T, y = e.y * T, f = folga * T;
  return x >= G.cam.x - f && x <= G.cam.x + vw + f && y >= G.cam.y - f && y <= G.cam.y + vh + f;
}
function atualizaJogador(dt) {
  const p = G.p; p.mov = false;
  // o alvo saiu da tela: perde o foco (senão o jogador volta andando atrás dele)
  if (G.alvo && !naTela(G.alvo, 1)) { G.alvo = null; p.cam = null; G.uiSujo = true; }
  if (G.save.hp <= 0) return;
  const v = velJogador() * dt / 1000;
  let ix = 0, iy = 0;
  if (G.teclas.has('l')) ix -= 1; if (G.teclas.has('r')) ix += 1; if (G.teclas.has('u')) iy -= 1; if (G.teclas.has('d')) iy += 1;
  if (G.joy) { ix = G.joy.x; iy = G.joy.y; }
  const antes = { x: p.x, y: p.y };
  if (ix || iy) {
    G.caminho = null; G.acaoChegar = null;
    const n = Math.hypot(ix, iy); const k = Math.min(1, n) / n;
    const mov = mover(p, ix * k * v, iy * k * v); if (mov > 0.0005) olha(p, ix, iy);
    if (Math.abs(ix) > 0.1) p.flip = ix < 0;
    p.mov = mov > 0.0005; p.fase += mov * 7; G.andou += mov;
  } else if (G.caminho) {
    const fim = segue(p, G.caminho, v); G.andou += p.mov ? v : 0;
    if (fim || (p.preso || 0) > 40) { G.caminho = null; p.preso = 0; if (G.acaoChegar) { const a = G.acaoChegar; G.acaoChegar = null; a(); } }
  } else {
    const a = G.alvo; // perseguir o alvo
    if (a && G.mons.includes(a)) {
      const alc = G.modo === 'chute' ? (typeof alcanceChute === 'function' ? alcanceChute() : 4.3) : 1.05;
      const ok = dist(p, a) <= alc && (alc < 2 || linhaVisao(p, a));
      if (!ok) {
        if (G.modo !== 'chute' && segLivre(p.x, p.y, a.x, a.y)) {
          const dx = a.x - p.x, dy = a.y - p.y, d = Math.hypot(dx, dy); const mov = mover(p, dx / d * v, dy / d * v); if (mov > 0.0005) olha(p, dx, dy);
          p.flip = dx < 0; p.mov = mov > 0.0005; p.fase += mov * 7;
        } else {
          if (!p.cam || G.agora > (p.tCam || 0)) {
            p.tCam = G.agora + 400;
            p.cam = caminho(Math.floor(p.x), Math.floor(p.y), (x, y) => { const d = Math.hypot(x + 0.5 - a.x, y + 0.5 - a.y); return d <= alc && (alc < 2 || linhaVisao({ x: x + 0.5, y: y + 0.5 }, a)); }, 2500) || [];
          }
          if (p.cam.length) segue(p, p.cam, v);
        }
      } else p.flip = a.x < p.x;
    }
  }
  separa(p);
  const t = tileDe(p); const s = G.mapa.saidas.find(s => s.x === t.x && s.y === t.y);
  if (s) {
    if (s.req && s.req.flag && !G.save.flags[s.req.flag]) {
      p.x = antes.x; p.y = antes.y; const dx = p.x - (s.x + 0.5), dy = p.y - (s.y + 0.5); const d = Math.hypot(dx, dy) || 1; mover(p, dx / d * 0.15, dy / d * 0.15);
      G.caminho = null;
      if (G.agora > G.tMsgSaida) { G.tMsgSaida = G.agora + 3000; if (s.req.casa && typeof abreCasaPorta === 'function') abreCasaPorta(s.req.casa); else { log(s.req.msg, 'l-sis'); fala(p, 'Ainda não posso ir...'); } }
    } else { if (s.tx == null || s.ty == null) getMapa(s.para); trocaMapa(s.para, s.tx + 0.5, s.ty + 0.5); } // o destino da porta só existe depois que o mapa de fora é montado
  }
}

/* ---------------- combate ---------------- */
function danoMaxJogador(modo) {
  const s = stats(); const sk = modo === 'chute' ? s.chute : s.drible; const k = modo === 'chute' ? 0.13 : 0.15;
  return (s.nivel / 4 + k * sk * (s.atk + 10)) * s.danoMult;
}
function ataqueAutomatico() {
  const a = G.alvo; if (!a) return;
  if (a.hp <= 0 || !G.mons.includes(a)) { G.alvo = null; G.uiSujo = true; return; }
  if (G.agora < G.cdAtaque || G.save.hp <= 0) return;
  const p = G.p; const d = dist(p, a);
  if (G.modo === 'drible' && d <= 1.15) {
    G.cdAtaque = G.agora + 1500; p.flip = a.x < p.x;
    const dano = Math.round(danoMaxJogador('drible') * (0.15 + 0.85 * Math.random())) - Math.round(a.d.def * (0.5 + 0.5 * Math.random()));
    treinaSkill('drible', 1); efeito('toque', a.x, a.y); som('toque'); p.golpe = G.agora;
    aplicaDano(a, critico(dano, a));
  } else if (G.modo === 'chute' && d <= (typeof alcanceChute === 'function' ? alcanceChute() : 4.3) + 0.2 && linhaVisao(p, a)) { // alcance: Artilheiro chuta de mais longe (vocacoes.js)
    G.cdAtaque = G.agora + 1500; p.flip = a.x < p.x;
    const max = danoMaxJogador('chute'); treinaSkill('chute', 1); som('chute'); p.golpe = G.agora;
    projetil(p, a, 'bola', () => { if (!G.mons.includes(a)) return; aplicaDano(a, critico(Math.round(max * (0.15 + 0.85 * Math.random())) - Math.round(a.d.def * (0.5 + 0.5 * Math.random())), a)); });
  }
}
function critico(dano, m) {
  if (dano <= 0) return dano;
  let c = false;
  if (G.firula > 0) { G.firula--; c = true; } else if (Math.random() < stats().crit) c = true;
  if (!c) return dano;
  texto(m, G.save.classe === 'driblador' ? 'GOLAÇO!' : 'CRÍTICO!', '#ff7ae0', 900, -0.5); efeito('estrelas', m.x, m.y, '#ff7ae0');
  return Math.round(dano * 1.8);
}
function aplicaDano(m, dano) {
  m.bravo = true;
  if (dano <= 0) { efeito('puff', m.x, m.y); texto(m, 'defendeu', '#d8e0ff', 700); return; }
  m.hp -= dano; m.hitT = G.agora; texto(m, dano, '#ffcf4a');
  if (m.d.treino) { m.hp = m.d.hp; return; } // boneco de treino fica parado no lugar
  if (!G.semEmpurrao) { const dx = m.x - G.p.x, dy = m.y - G.p.y, d = Math.hypot(dx, dy) || 1; mover(m, dx / d * 0.1, dy / d * 0.1, m.r); } // drible comum não empurra (lances.js)
  if (m.hp <= 0) matar(m);
}
const RARIDADE = {
  comum: { nome: 'comum', cor: '#ffffff', log: 'l-loot' },
  incomum: { nome: 'incomum', cor: '#6aff7a', log: 'l-loot' },
  raro: { nome: 'raro', cor: '#5ab4ff', log: 'l-raro' },
  epico: { nome: 'épico', cor: '#c77aff', log: 'l-epico' },
  lendario: { nome: 'lendário', cor: '#ffc83a', log: 'l-lendario' },
};
function raridadeDe(id, chance, chefe) {
  const ordem = ['comum', 'incomum', 'raro', 'epico', 'lendario'];
  if (ITENS[id] && ITENS[id].raro) return 'lendario';
  let n = chance < 0.01 ? 3 : chance < 0.06 ? 2 : chance < 0.2 ? 1 : 0;
  if (ITENS[id] && ITENS[id].tipo === 'equip') n++;
  if (chefe) n++;
  return ordem[Math.min(3, n)];
}
function soltaDrop(m, id, q, rar, i, n) {
  const ang = -Math.PI / 2 + (i - (n - 1) / 2) * 0.7 + rnd(-0.2, 0.2);
  G.drops.push({ id, q, rar, x0: m.x, y0: m.y, dx: Math.cos(ang) * rnd(0.5, 0.9), dy: rnd(0.15, 0.45), t0: G.agora + i * 90, espera: rar === 'comum' || rar === 'incomum' ? 350 : 900 });
}
// adversário muito mais fraco que você rende menos (ou nada): evita "farmar" onde é fácil demais
// alguma missão aceita ainda precisa desse item (e você ainda não tem o suficiente)?
function itemPedidoEmMissao(id) {
  const s = G.save;
  // vale para missão aceita E para missão de juntar itens que já está disponível (dá pra ir juntando antes de aceitar)
  return MISSOES.some(q => { if (!q.req || !q.req.itens) return false; const st = statusMissao(q); return (st === 'ativa' || st === 'disponivel') && q.req.itens.some(([iid, n]) => iid === id && contaItem(iid) < n); });
}
function penalidadeNivel(d) {
  const dif = nivelMonstro(d) - G.save.nivel;
  if (dif >= -5) return { xp: 1, drop: 1, faixa: 0 };
  if (dif >= -9) return { xp: 0.6, drop: 0.8, faixa: 1 };
  if (dif >= -14) return { xp: 0.25, drop: 0.4, faixa: 2 };
  if (dif >= -19) return { xp: 0.1, drop: 0.15, faixa: 3 };
  return { xp: 0, drop: 0, faixa: 4 };
}
function matar(m) {
  const d = m.d; const s = G.save; const pen = penalidadeNivel(d);
  G.mons = G.mons.filter(x => x !== m);
  if (G.alvo === m) G.alvo = null;
  efeito('morte', m.x, m.y); texto(m, 'DRIBLADO!', '#ffffff', 1100);
  s.kills[m.tipo] = (s.kills[m.tipo] || 0) + 1; s.st.abates++;
  const ouro = Math.round(rndi(d.ouro[0], d.ouro[1]) * pen.drop); const ganhos = []; const caidos = [];
  if (ouro > 0) { s.ouro += ouro; ganhos.push(`${ouro} tostões`); caidos.push(['tostao', ouro, 'comum']); }
  let melhor = null; const ordemR = ['comum', 'incomum', 'raro', 'epico', 'lendario'];
  for (const [id, ch, mn, mx] of d.loot) { const daMissao = itemPedidoEmMissao(id); if (Math.random() < ch * (daMissao ? 1 : pen.drop)) { // item que uma missão (aceita ou disponível) ainda pede: chance cheia, mesmo em adversário fraco
    const q = rndi(mn, mx); if (!addItem(id, q)) continue;
    if (daMissao && !itemPedidoEmMissao(id)) log(`✔ Você já juntou todos os ${ITENS[id].nome} que a missão pede!${pen.drop < 1 ? ' (Daqui pra frente eles voltam a cair pouco de adversários fracos.)' : ''}`, 'l-xp');
    const rar = typeof raridadeItem === 'function' ? raridadeItem(id) : raridadeDe(id, ch, d.chefe); ganhos.push(`${q}x ${ITENS[id].nome}`); caidos.push([id, q, rar]);
    if (!melhor || ordemR.indexOf(rar) > ordemR.indexOf(melhor.rar)) melhor = { id, rar };
    if (ordemR.indexOf(rar) >= 2) log(`★ Item ${RARIDADE[rar].nome.toUpperCase()}: ${ITENS[id].nome}!`, RARIDADE[rar].log);
  } }
  caidos.forEach(([id, q, rar], i) => soltaDrop(m, id, q, rar, i, caidos.length));
  if (melhor && ordemR.indexOf(melhor.rar) >= 2) { som('raro'); if (ordemR.indexOf(melhor.rar) >= 3) { const mb = melhor; setTimeout(() => banner(`ITEM ${RARIDADE[mb.rar].nome.toUpperCase()}!`, ITENS[mb.id].nome), 1800); } }
  if (d.fig && Math.random() < (d.chefe ? 0.5 : 1 / 110) * pen.drop) ganhaFigurinha(d.fig);
  const temItemMissao = d.loot.some(([id]) => itemPedidoEmMissao(id)) || caidos.some(([id]) => id !== 'tostao' && MISSOES.some(q => q.req && q.req.itens && q.req.itens.some(([i]) => i === id)));
  const aviso = ['', ' (fraco para o seu nível: XP −40%)', ' (bem mais fraco que você: XP −75%, menos loot)', ' (muito mais fraco: quase nada de XP e loot)', temItemMissao ? ' (fraco demais: sem XP — só caem os itens de missão)' : ' (fraco demais: sem XP e sem loot)'][pen.faixa];
  log(`Você passou por ${d.nome}.${ganhos.length ? ' Ganhou: ' + ganhos.join(', ') + '.' : ''}${aviso}`, pen.faixa >= 3 ? 'l-sis' : 'l-loot');
  if (pen.faixa >= 2) dica('nivel_baixo', `Adversários muito mais fracos que você (nível em CINZA) dão pouca ou nenhuma XP e quase nada de loot. Para evoluir, procure rivais do seu nível (branco) ou mais fortes (laranja/vermelho)!`);
  for (const q of MISSOES) { const e = s.quests[q.id]; if (e && e.s === 'ativa' && q.req.kill === m.tipo) { e.p = (e.p || 0) + 1; if (e.p === q.req.n) { log(`Missão "${q.titulo}" pronta! Volte para falar com ${NPCS[q.npc].nome}.`, 'l-xp'); banner('Missão pronta!', `Fale com ${NPCS[q.npc].nome}`); } } }
  if (s.tarefa && s.tarefa.m === m.tipo && s.tarefa.p < s.tarefa.n) { s.tarefa.p++; if (s.tarefa.p === s.tarefa.n) log('Desafio completo! Resgate a recompensa em qualquer Quadro de Desafios.', 'l-xp'); }
  if (typeof carreiraEvento === 'function') carreiraEvento('abate', { monstro: m.tipo, mapa: G.mapa.id, chefe: !!d.chefe });
  if (d.chefe) { s.st.chefes++; s.flags['venceu_' + m.tipo] = true; banner(`Você venceu ${d.nome}!`, 'Que partida!'); som('nivel'); }
  ganhaXp(Math.round(d.xp * pen.xp));
  if (s.st.abates === 1) dica('loot', 'Boa! Cada adversário vencido dá XP (barra verde embaixo do seu retrato), tostões e às vezes itens. Leia o que você ganhou no chat, lá embaixo.', '#bXp');
  G.respawns.push({ sp: m.sp, em: G.agora + (d.respawn || rnd(22000, 38000)) });
  G.uiSujo = true;
}
function ganhaXp(n) {
  if (!n) return; const s = G.save;
  if (typeof bonusCarreira === 'function') n = Math.round(n * (bonusCarreira().xp || 1));
  s.xp += n; texto(G.p, '+' + n + ' XP', '#b8ff8a', 1200, -0.4);
  let subiu = false;
  while (s.xp >= xpPara(s.nivel + 1)) { const faseAntes = faseIdx(s.nivel); s.nivel++; subiu = true; subiuNivel(faseAntes); }
  if (subiu) salvar();
  G.uiSujo = true;
}
function subiuNivel(faseAntes) {
  const s = G.save;
  s.pontos = (s.pontos || 0) + PONTOS_POR_NIVEL;
  const cl = CLASSES[s.classe]; if (cl && s.atr) s.atr[cl.principal]++;
  const st = stats();
  s.hp = st.maxHp; s.foco = st.maxFoco;
  dica('atributos', `Você ganhou ${PONTOS_POR_NIVEL} pontos de atributo! Aperte C (ou o botão Ficha) para distribuir em Defesa, Habilidade, Inteligência ou Fôlego.`, '#btnFicha');
  log(`Você subiu do nível ${s.nivel - 1} para o nível ${s.nivel}!`, 'l-lvl');
  efeito('nivel', G.p.x, G.p.y); som('nivel');
  const fase = faseIdx(s.nivel);
  if (fase !== faseAntes) {
    banner(`Agora você é ${FASES[fase].nome.toUpperCase()}!`, `Nível ${s.nivel}`);
    log(`Nova fase da vida: ${FASES[fase].nome}! Você cresceu.`, 'l-lvl');
    if (fase === 2) log('Você já é adulto(a)! Procure o Empresário Rodrigues na Cidade para fundar seu próprio TIME.', 'l-xp');
  } else banner(`NÍVEL ${s.nivel}!`, 'Mais fôlego e mais foco!');
  atualizaRetrato();
  for (const id of s.dribles) if (DRIBLES[id].lvl === s.nivel) log(`Agora você pode usar ${DRIBLES[id].nome}!`, 'l-xp');
  if (s.nivel === 10 && !s.posicao) log('Nível 10! Fale com o Seu Zé para fazer a peneira e escolher sua posição.', 'l-xp');
  dica('nivel', 'Você subiu de nível! Fôlego e foco aumentam e o fôlego enche. Pessoas com um "!" amarelo em cima têm missões novas pra você.');
}
function monstroAtaca(m) {
  const s = stats();
  let dano = Math.round(m.d.atk * (0.2 + 0.8 * Math.random()) - s.def * (0.4 + 0.6 * Math.random()));
  m.flip = G.p.x < m.x; m.golpe = G.agora;
  if (Math.random() < s.bloqueio) { treinaSkill('defesa', 1); efeito('escudo', G.p.x, G.p.y, '#7ab8ff'); texto(G.p, 'BLOQUEIO!', '#9ad0ff', 800); return; }
  treinaSkill('defesa', 1);
  if (Math.random() < 0.05 && m.d.falas.length) fala(m, m.d.falas[rndi(0, m.d.falas.length - 1)]);
  if (dano <= 0) { efeito('puff', G.p.x, G.p.y); return; }
  recebeDano(dano, m);
}
function recebeDano(dano, m) {
  const s = G.save; if (s.hp <= 0) return;
  if ((G.buffs.muralha || 0) > G.agora) dano = Math.max(1, Math.round(dano * 0.5));
  s.hp -= dano; texto(G.p, '-' + dano, '#ff5a5a'); G.p.hitT = G.agora; som('ai');
  G.uiSujo = true;
  if (s.hp > 0 && s.hp < stats().maxHp * 0.5) dica('folego', 'Seu FÔLEGO (barra vermelha) está baixo! Aperte a tecla 1 (ou clique na Água da barra de atalhos) para beber. Em casa, a Mãe recupera tudo de graça.', '#hotbar .slot');
  if (s.hp <= 0) { s.hp = 0; morrer(m); }
}
function morrer(m) {
  const s = G.save; s.st.mortes++;
  if (typeof carreiraEvento === 'function') carreiraEvento('exausto', {});
  const base = xpPara(s.nivel), perda = Math.min(s.xp - base, Math.round((xpPara(s.nivel + 1) - base) * 0.35));
  s.xp -= perda; G.alvo = null; G.caminho = null;
  log(`Você ficou sem fôlego${m ? ' contra ' + m.d.nome : ''}, ficou exausto(a) e voltou pra descansar. Perdeu ${fmt(perda)} XP.`, 'l-dano');
  som('morte');
  setTimeout(() => modalMorte(perda, m), 600);
}
function renascer() {
  const s = G.save; const st = stats(); s.hp = st.maxHp; s.foco = st.maxFoco;
  const m = G.mapa.interior ? getMapa('vila') : G.mapa; const r = m.renasce || m.inicio;
  entrarMapa(m.id, r.x + 0.5, r.y + 0.5, true);
  log('Você acordou descansado(a). Bora de novo!', 'l-sis'); salvar();
}

/* ---------------- dribles e itens ---------------- */
function usarDrible(id) {
  const dr = DRIBLES[id]; const s = G.save; const st = stats(); const p = G.p;
  if (!dr || !s.dribles.includes(id) || s.hp <= 0) return;
  if (s.nivel < dr.lvl) { log(`Você precisa do nível ${dr.lvl} para usar ${dr.nome}.`, 'l-sis'); return; }
  const custo = Math.ceil(dr.foco * st.custoFoco);
  if (s.foco < custo) { log(`Foco insuficiente para ${dr.nome} (precisa de ${custo}). O foco (barra azul) volta sozinho com o tempo. Aperte R para beber isotônico.`, 'l-sis'); som('erro'); return; }
  const grupo = dr.tipo === 'cura' ? 'cura' : 'ataque';
  if (G.agora < (G.cds[grupo] || 0) || G.agora < (G.cds[id] || 0)) return;
  const a = G.alvo && G.mons.includes(G.alvo) ? G.alvo : null;
  const danoDe = m => { const sk = st[dr.skill] || st.drible; treinaSkill(dr.skill, 1); return critico(Math.round((st.nivel * 0.3 + sk * dr.poder + st.visao * dr.poder * 0.5) * rnd(0.85, 1.15) * st.danoMult * st.poderMult - m.d.def * 0.3), m); };
  if (dr.tipo === 'melee') {
    if (!a || dist(p, a) > 1.3) { log(`Marque um adversário (clique nele) e chegue colado para usar ${dr.nome}.`, 'l-sis'); return; }
    p.flip = a.x < p.x; efeito(dr.fx, a.x, a.y, dr.cor); efeito('impacto', a.x, a.y, dr.cor); aplicaDano(a, danoDe(a));
  } else if (dr.tipo === 'dist') {
    if (!a || dist(p, a) > dr.alcance + 0.5 || !linhaVisao(p, a)) { log(`Marque um alvo a até ${dr.alcance} passos, sem obstáculo, para usar ${dr.nome}.`, 'l-sis'); return; }
    p.flip = a.x < p.x; const dano = danoDe(a);
    projetil(p, a, dr.fx === 'explosao' ? 'bolaforte' : 'bola', () => { if (G.mons.includes(a)) { efeito(dr.fx === 'bola' ? 'toque' : dr.fx, a.x, a.y, dr.cor); efeito('impacto', a.x, a.y, dr.cor); aplicaDano(a, dano); } });
  } else if (dr.tipo === 'area') {
    const alvos = G.mons.filter(m => dist(p, m) <= dr.raio + 0.6 && !m.d.treino);
    if (!alvos.length && !(a && a.d.treino && dist(p, a) <= dr.raio + 0.6)) { log(`Nenhum adversário perto para a ${dr.nome}.`, 'l-sis'); return; }
    efeito(dr.fx, p.x, p.y, dr.cor, dr.raio);
    (alvos.length ? alvos : [a]).forEach(m => { efeito('impacto', m.x, m.y, dr.cor); aplicaDano(m, danoDe(m)); });
  } else if (dr.tipo === 'cura') {
    const cura = Math.round((st.nivel * 1.2 + st.visao * 3 + 20) * dr.poder * rnd(0.9, 1.1) * (s.posicao === 'meia' ? 1.2 : 1) * st.curaMult);
    s.hp = Math.min(st.maxHp, s.hp + cura); texto(p, '+' + cura, '#6aff9a'); efeito(dr.fx, p.x, p.y, dr.cor);
  } else if (dr.tipo === 'buff') {
    G.buffs.arrancada = G.agora + dr.dur; efeito('vento', p.x, p.y, dr.cor);
    log(`Arrancada! Você está mais rápido(a) por ${dr.dur / 1000} segundos.`, 'l-info');
  }
  s.foco -= custo; treinaSkill('visao', custo);
  G.cds[grupo] = G.agora + (grupo === 'cura' ? 1000 : 2000); G.cds[id] = G.agora + dr.cd;
  tituloSkill(p, dr.nome, dr.cor); p.golpe = G.agora; som('dr_' + id); // cada drible tem seu som
  G.uiSujo = true;
}
function usarClasse() {
  const s = G.save; const cl = CLASSES[s.classe]; if (!cl || s.hp <= 0) return;
  const esp = cl.especial; const p = G.p; const st = stats();
  if (G.agora < (G.cds.classe || 0)) { log(`${esp.nome} ainda recarregando (${Math.ceil((G.cds.classe - G.agora) / 1000)}s).`, 'l-sis'); return; }
  if (esp.id === 'muralha') { G.buffs.muralha = G.agora + esp.dur; efeito('escudo', p.x, p.y, '#7ab8ff'); log('Muralha! Você toma metade do dano por 6 segundos.', 'l-info'); }
  else if (esp.id === 'firula') { G.firula = esp.dur; efeito('estrelas', p.x, p.y, '#ffb03a'); log('Firula! Seus próximos 3 ataques são críticos.', 'l-info'); }
  else if (esp.id === 'leitura') { const f = Math.round(st.maxFoco * 0.35); s.foco = Math.min(st.maxFoco, s.foco + f); texto(p, '+' + f, '#8ac8ff'); G.mons.forEach(m => { if (dist(m, p) < 5 && !m.d.chefe) { m.bravo = false; m.dest = null; m.cam = null; m.calmoAte = G.agora + 6000; } }); efeito('area', p.x, p.y, '#b07aff', 3); log('Leitura de Jogo! Foco recuperado e os adversários por perto se acalmaram.', 'l-info'); }
  else if (esp.id === 'segundo_folego') { const h = Math.round(st.maxHp * 0.4); s.hp = Math.min(st.maxHp, s.hp + h); texto(p, '+' + h, '#6aff9a'); efeito('curaforte', p.x, p.y, '#5affb0'); }
  G.cds.classe = G.agora + esp.cd; tituloSkill(p, esp.nome, cl.cor); som('cl_' + esp.id); p.golpe = G.agora; G.uiSujo = true;
}
function bebeMelhor(tipo) { // tipo: 'hp' | 'foco'
  const s = G.save; const st = stats();
  const falta = tipo === 'hp' ? st.maxHp - s.hp : st.maxFoco - s.foco;
  const ops = s.mochila.map(m => ITENS[m.id] ? { id: m.id, it: ITENS[m.id] } : null).filter(o => o && o.it.tipo === 'consumivel' && o.it.efeito[tipo] && !(o.it.lvl && s.nivel < o.it.lvl));
  if (!ops.length) { log(tipo === 'hp' ? 'Sem bebidas de fôlego! Compre Água no Bazar da Dona Cida.' : 'Sem bebidas de foco! Compre Isotônico no Bazar.', 'l-sis'); som('erro'); return; }
  ops.sort((a, b) => a.it.efeito[tipo] - b.it.efeito[tipo]);
  const escolha = ops.find(o => o.it.efeito[tipo] >= falta * 0.8) || ops[ops.length - 1];
  usarItem(escolha.id);
}
function alternaCaca() { G.caca = !G.caca; log(G.caca ? 'Caça contínua LIGADA: ao vencer um adversário, você já marca o próximo (tecla G desliga).' : 'Caça contínua desligada.', 'l-info'); G.uiSujo = true; }
function contaItem(id) { return G.save.mochila.filter(i => i.id === id).reduce((a, i) => a + i.q, 0); }
function empilha(id) { const t = ITENS[id].tipo; return t === 'consumivel' || t === 'loot' || t === 'comida'; }
function addItem(id, q = 1) {
  const s = G.save; if (!ITENS[id]) return false;
  if (ITENS[id].tipo === 'chave' && contaItem(id)) return true; // item único (chave/troféu): já tem, não ocupa outro espaço
  if (empilha(id)) {
    const ex = s.mochila.find(i => i.id === id);
    if (ex) ex.q += q; else { if (s.mochila.length >= 30) { log('Sua mochila está cheia! Venda ou jogue fora alguma coisa.', 'l-dano'); return false; } s.mochila.push({ id, q }); }
  } else {
    for (let i = 0; i < q; i++) { if (s.mochila.length >= 30) { log('Sua mochila está cheia!', 'l-dano'); return false; } s.mochila.push({ id, q: 1 }); }
  }
  if ((ITENS[id].tipo === 'consumivel' || ITENS[id].tipo === 'comida') && id !== 'pacotinho' && !s.hotbar.some(h => h && h.t === 'i' && h.id === id)) poeNaHotbar('i', id, true);
  if (ITENS[id].tipo === 'comida') dica('comida', `Você ganhou comida: ${ITENS[id].nome}! Comer dá um BÔNUS por alguns minutos (até 3 comidas diferentes ao mesmo tempo: os bônus somam). Use pela barra de atalhos ou pela mochila.`, '#hotbar');
  if (ITENS[id].tipo === 'equip') dica('equip', `Você ganhou um equipamento: ${ITENS[id].nome}! Abra a aba MOCHILA (à direita, ou tecla I), clique nele e escolha "Equipar". Equipamentos deixam você mais forte.`, '[data-aba=mochila]');
  if (id === 'bola') atualizaRetrato();
  G.uiSujo = true; return true;
}
function removeItem(id, q = 1) {
  const s = G.save;
  while (q > 0) { let i = s.mochila.findIndex(x => x.id === id && !x.r); if (i < 0) i = s.mochila.findIndex(x => x.id === id); if (i < 0) return false; const it = s.mochila[i]; const tira = Math.min(q, it.q); it.q -= tira; q -= tira; if (it.q <= 0) s.mochila.splice(i, 1); }
  G.uiSujo = true; return true;
}
function usarItem(id) {
  const it = ITENS[id]; const s = G.save; if (!it || !contaItem(id)) return;
  if (it.tipo === 'equip') return equipar(id);
  if (it.tipo === 'comida') {
    if (it.lvl && s.nivel < it.lvl) { log(`Você precisa do nível ${it.lvl} para comer ${it.nome}.`, 'l-sis'); return; }
    const lista = comidasAtivas(s); const ja = lista.find(c => c.id === id); let extra = '';
    if (ja) { ja.resta = it.efeito.dur; extra = ' (o tempo recomeçou)'; }
    else {
      if (lista.length >= COMIDAS_MAX) { lista.sort((x, y) => x.resta - y.resta); const sai = lista.shift(); extra = ` (substituiu ${ITENS[sai.id] ? ITENS[sai.id].nome : 'a comida mais antiga'}: dá pra ter até ${COMIDAS_MAX} comidas diferentes fazendo efeito juntas)`; }
      lista.push({ id, resta: it.efeito.dur });
      if (!extra && lista.length > 1) extra = ` Agora são ${lista.length} comidas fazendo efeito juntas: os bônus somam!`;
    }
    removeItem(id); som('gole'); efeito('cura', G.p.x, G.p.y, '#ffd23f');
    texto(G.p, 'Nham!', '#ffe14a'); log(`Você comeu ${it.nome}! ${it.desc}${extra}`, 'l-info');
    contaEvento('comer'); G.uiSujo = true; return;
  }
  if (it.tipo !== 'consumivel') { log(`${it.nome}: ${it.desc}`, 'l-info'); return; }
  if (it.lvl && s.nivel < it.lvl) { log(`Você precisa do nível ${it.lvl} para usar ${it.nome}.`, 'l-sis'); return; }
  if (it.efeito.figurinha) { removeItem(id); abrirPacotinho(); return; }
  if (G.agora < (G.cds.pocao || 0) || s.hp <= 0) return;
  const st = stats(); const p = G.p;
  if (it.efeito.hp) { if (s.hp >= st.maxHp) { log('Seu fôlego já está cheio.', 'l-sis'); return; } s.hp = Math.min(st.maxHp, s.hp + it.efeito.hp); texto(p, '+' + it.efeito.hp, '#6aff9a'); efeito('cura', p.x, p.y, '#5affb0'); }
  if (it.efeito.foco) { if (s.foco >= st.maxFoco) { log('Seu foco já está cheio.', 'l-sis'); return; } s.foco = Math.min(st.maxFoco, s.foco + it.efeito.foco); texto(p, '+' + it.efeito.foco, '#8ac8ff'); efeito('cura', p.x, p.y, '#7ab8ff'); }
  removeItem(id); G.cds.pocao = G.agora + 1000; som('gole'); G.uiSujo = true;
}
function removeEquipR(id, r) { const s = G.save; let i = s.mochila.findIndex(x => x.id === id && (x.r || 0) === (r || 0)); if (i < 0) i = s.mochila.findIndex(x => x.id === id); if (i >= 0) s.mochila.splice(i, 1); G.uiSujo = true; }
function equipar(id, r) {
  const it = ITENS[id]; const s = G.save;
  if (it.lvl && s.nivel < it.lvl) { log(`Você precisa do nível ${it.lvl} para usar ${it.nome}.`, 'l-sis'); return; }
  s.equipR = s.equipR || {};
  let i = s.mochila.findIndex(x => x.id === id && (r == null || (x.r || 0) === r)); if (i < 0) i = s.mochila.findIndex(x => x.id === id); if (i < 0) return;
  const rNovo = s.mochila[i].r || 0; s.mochila.splice(i, 1);
  const antigo = s.equip[it.slot]; const rAntigo = s.equipR[it.slot] || 0;
  s.equip[it.slot] = id; s.equipR[it.slot] = rNovo; if (antigo) s.mochila.push(rAntigo ? { id: antigo, q: 1, r: rAntigo } : { id: antigo, q: 1 });
  const st = stats(); s.hp = Math.min(s.hp, st.maxHp); s.foco = Math.min(s.foco, st.maxFoco);
  log(`Você equipou ${it.nome}.`, 'l-info'); som('equip'); atualizaRetrato(); preCarregaMapa(); G.uiSujo = true;
}
function desequipar(slot) {
  const s = G.save; const id = s.equip[slot]; if (!id) return;
  if (s.mochila.length >= 30) { log('Mochila cheia!', 'l-dano'); return; }
  const r = (s.equipR || {})[slot] || 0; s.equip[slot] = null; if (s.equipR) s.equipR[slot] = 0; s.mochila.push(r ? { id, q: 1, r } : { id, q: 1 });
  const st = stats(); s.hp = Math.min(s.hp, st.maxHp); s.foco = Math.min(s.foco, st.maxFoco);
  log(`Você tirou ${ITENS[id].nome}.`, 'l-info'); atualizaRetrato(); preCarregaMapa(); G.uiSujo = true;
}
function poeNaHotbar(t, id, silencioso) {
  const hb = G.save.hotbar; if (hb.some(h => h && h.t === t && h.id === id)) return;
  const i = hb.findIndex(h => !h); if (i < 0) { if (!silencioso) log('Sua barra de atalhos está cheia. Clique com o botão direito num atalho para liberar.', 'l-sis'); return; }
  hb[i] = { t, id }; G.uiSujo = true;
}
function aprendeDrible(id) {
  const s = G.save; if (s.dribles.includes(id)) return;
  s.dribles.push(id); poeNaHotbar('d', id, true);
  const tecla = teclaSlot(s.hotbar.findIndex(h => h && h.t === 'd' && h.id === id));
  log(`Você aprendeu o drible ${DRIBLES[id].nome}! (nível ${DRIBLES[id].lvl}) — tecla ${tecla}.`, 'l-lvl'); banner(DRIBLES[id].nome.toUpperCase(), 'Novo drible aprendido!'); som('nivel');
  dica('drible', `Novo drible: ${DRIBLES[id].nome}! Ele fica na barra de atalhos (tecla ${tecla}). Com um adversário marcado e perto, aperte a tecla para usar. Dribles gastam FOCO (barra azul).`, '#hotbar');
  if (id === 'chute_colocado') dica('modo', 'Dica: aperte X (ou o botão "Modo") para trocar entre DRIBLE (ataca colado) e CHUTE (ataca de longe e treina a habilidade Chute).', '#btnModo');
}
function ganhaFigurinha(fid) {
  const s = G.save; const f = FIGURINHAS.find(x => x.id === fid);
  if (s.figs[fid]) { s.ouro += 25; log(`Figurinha repetida: ${f.nome}. Trocou por 25 tostões.`, 'l-loot'); }
  else { s.figs[fid] = true; log(`FIGURINHA NOVA: ${f.nome}! (${Object.keys(s.figs).length}/${FIGURINHAS.length})`, 'l-xp'); som('moeda'); }
  G.uiSujo = true;
}
function abrirPacotinho() { const f = FIGURINHAS[rndi(0, FIGURINHAS.length - 1)]; ganhaFigurinha(f.id); }

/* ---------------- missões ---------------- */
function statusMissao(q) {
  const s = G.save; const e = s.quests[q.id];
  if (e && e.s === 'feita') return 'feita';
  if (e && e.s === 'ativa') return missaoPronta(q) ? 'pronta' : 'ativa';
  if (q.pre && !(s.quests[q.pre] && s.quests[q.pre].s === 'feita')) return 'bloqueada';
  if (s.nivel < q.lvl) return 'nivel';
  return 'disponivel';
}
const REQ_EVENTOS = ['gols', 'quiz', 'prof', 'copa', 'copaTitulo', 'copa7a0', 'comer', 'refino'];
function progressoMissao(q) {
  const s = G.save; const e = s.quests[q.id] || {}; const r = q.req;
  if (r.kill) return [Math.min(e.p || 0, r.n), r.n];
  if (r.item) return [Math.min(contaItem(r.item), r.n), r.n];
  if (r.flag) return [s.flags[r.flag] ? 1 : 0, 1];
  for (const k of REQ_EVENTOS) if (r[k]) return [Math.min(e.p || 0, r[k]), r[k]];
  return [0, 1];
}
function descMissao(q) {
  const r = q.req; if (r.desc) return r.desc;
  if (r.kill) return `Passe por ${r.n}x ${MONSTROS[r.kill].nome}`;
  if (r.item) return `Junte ${r.n}x ${ITENS[r.item].nome}`;
  return '';
}
function missaoPronta(q) { const [a, b] = progressoMissao(q); return a >= b; }
function aceitaMissao(q) { G.save.quests[q.id] = { s: 'ativa', p: 0 }; log(`Nova missão: ${q.titulo}. ${descMissao(q)}.`, 'l-xp'); som('equip'); G.uiSujo = true; salvar(); }
function entregaMissao(q) {
  const s = G.save; const r = q.rec;
  if (q.req.item) removeItem(q.req.item, q.req.n);
  s.quests[q.id] = { s: 'feita' };
  log(`Missão concluída: ${q.titulo}!`, 'l-lvl');
  if (r.ouro) { s.ouro += r.ouro; log(`Você recebeu ${r.ouro} tostões.`, 'l-loot'); }
  (r.itens || []).forEach(([id, n]) => { if (recebeItem(id, n) === 'mochila') log(`Você recebeu ${n}x ${ITENS[id].nome}.`, 'l-loot'); });
  if (r.flag) s.flags[r.flag] = true;
  if (r.flag === 'libera_praia') dica('praia', 'O caminho para a PRAIA foi liberado! Siga a rua principal para o leste (direita) da vila. A seta amarela sempre mostra seu próximo objetivo.');
  if (r.drible) aprendeDrible(r.drible);
  if (typeof carreiraEvento === 'function') { carreiraEvento('missao', { id: q.id }); if (r.evento) carreiraEvento(r.evento, { cidade: G.mapa.id }); }
  ganhaXp(Math.round((r.xp || 0) * stats().xpEstudo)); som('moeda'); salvar(); G.uiSujo = true;
}
function contaEvento(tipo) {
  if (typeof carreiraEvento === 'function' && ['gols', 'copa', 'copaTitulo'].includes(tipo)) carreiraEvento(tipo === 'gols' ? 'gol' : tipo, {});
  for (const q of MISSOES) { const e = G.save.quests[q.id]; if (e && e.s === 'ativa' && q.req[tipo]) { e.p = (e.p || 0) + 1; if (e.p === q.req[tipo]) log(`Missão "${q.titulo}" pronta! Fale com ${NPCS[q.npc].nome}.`, 'l-xp'); } }
  G.uiSujo = true;
}

/* ---------------- IA dos adversários ---------------- */
function andaAte(m, alvo, v, afastar) {
  let dx = alvo.x - m.x, dy = alvo.y - m.y; const d = Math.hypot(dx, dy) || 1;
  if (afastar) { dx = -dx; dy = -dy; }
  if (afastar || segLivre(m.x, m.y, alvo.x, alvo.y, m.r)) {
    const mov = mover(m, dx / d * v, dy / d * v, m.r); if (mov > 0.0005) olha(m, dx, dy); if (Math.abs(dx) > 0.02) m.flip = dx < 0; m.mov = mov > 0.0005; m.fase += mov * 7; return;
  }
  if (!m.cam || G.agora > (m.tCam || 0)) { m.tCam = G.agora + 700; m.cam = caminho(Math.floor(m.x), Math.floor(m.y), (x, y) => Math.hypot(x + 0.5 - alvo.x, y + 0.5 - alvo.y) < 1.2, 600) || []; }
  if (m.cam.length) segue(m, m.cam, v, m.r);
}
// Áreas tranquilas: ninguém vem desafiar você, só joga quem você desafiar (driblar/chutar).
// No resto do mundo, os rivais vêm tirar satisfação quando você chega perto.
const MAPAS_PACIFICOS = new Set(['vila', 'praia']);
function atualizaMonstro(m, dt) {
  m.mov = false;
  if (m.d.treino) return;
  const p = G.p; const d = dist(m, p); const vivo = G.save.hp > 0;
  const casa = { x: m.sp.x + 0.5, y: m.sp.y + 0.5 };
  const longe = dist(m, casa) > m.sp.raio + 10;
  const v = m.d.vel / 60 * 0.88 * dt / 1000;
  const aggro = Math.max(1, m.d.aggro + (m.d.grupo && G.save.carreira && G.save.carreira.satTorcida < 40 ? 2 : 0) + (G.climaAggro || 0));
  if (m.bravo) m.voltando = false; // levou drible/chute no caminho de volta: encara de novo
  if (vivo && !m.bravo && !m.voltando && !((m.calmoAte || 0) > G.agora) && m.d.aggro > 0 && d <= aggro && !MAPAS_PACIFICOS.has(G.mapa.id)) { // calmoAte: Leitura de Jogo
    m.bravo = true;
    dica('desafio_rivais', `Aqui é diferente da Vila: os rivais vêm te DESAFIAR quando você chega perto! Fique de olho no fôlego, e se precisar, afaste-se para eles desistirem.`);
  }
  if (m.bravo && m.d.grupo && !m.avisouGrupo) { m.avisouGrupo = true; for (const o of G.mons) if (o !== m && o.d.grupo === m.d.grupo && !o.bravo && dist(o, m) < 6) o.bravo = true; if (Math.random() < 0.5) fala(m, m.d.falas[rndi(0, m.d.falas.length - 1)]); }
  if (!m.bravo) m.avisouGrupo = false;
  // desistiu (você foi longe, ele se afastou demais de casa, ou não acha caminho até você): volta pro lugar dele
  const desiste = () => { m.bravo = false; if (m.ar) return; /* chefão de arena tem a regra dele (arenas.js) */ m.voltando = true; m.volta0 = G.agora; m.cam = null; m.dest = null; m.tParado = 0; if (G.alvo === m) G.alvo = null; };
  if (m.bravo && (d > 11 || longe || !vivo)) desiste();
  if (m.voltando) {
    if (dist(m, casa) <= Math.max(1, m.sp.raio)) { // chegou: recupera o fôlego e volta a passear
      m.voltando = false; m.hp = m.d.hp; m.prox = G.agora + rnd(800, 2000);
    } else if (G.agora - m.volta0 > 12000) { // empacou no caminho: reaparece em casa
      efeito('puff', m.x, m.y); const pos = posLivre(m.sp.x, m.sp.y, m.sp.raio) || casa; m.x = pos.x; m.y = pos.y; efeito('puff', m.x, m.y);
      m.voltando = false; m.hp = m.d.hp; m.cam = null; m.prox = G.agora + rnd(800, 2000);
    } else {
      if (segLivre(m.x, m.y, casa.x, casa.y, m.r)) andaAte(m, casa, v);
      else {
        if (!m.cam || !m.cam.length || G.agora > (m.tCam || 0)) { m.tCam = G.agora + 1500; m.cam = caminho(Math.floor(m.x), Math.floor(m.y), (x, y) => Math.hypot(x + 0.5 - casa.x, y + 0.5 - casa.y) <= Math.max(1, m.sp.raio), 5000) || []; }
        if (m.cam.length) segue(m, m.cam, v, m.r);
      }
      separa(m); return;
    }
  }
  if (m.bravo) {
    const alcance = 0.95 + (m.r - R_ENT);
    if (d <= alcance && G.agora >= m.cdAtk) { m.cdAtk = G.agora + m.d.atkCd; monstroAtaca(m); }
    const r = m.d.ranged;
    if (r && d > 1.3 && d <= r.alcance + 0.5 && G.agora >= m.cdRng && linhaVisao(m, p)) {
      m.cdRng = G.agora + r.cd; m.flip = p.x < m.x; m.golpe = G.agora;
      projetil(m, p, r.proj, () => {
        const s = stats(); const dano = Math.round(r.dano * (0.3 + 0.7 * Math.random()) - s.def * (0.3 + 0.4 * Math.random()));
        treinaSkill('defesa', 1);
        if (dano <= 0) efeito('puff', G.p.x, G.p.y); else recebeDano(dano, m);
      });
      if (Math.random() < 0.08 && m.d.falas.length) fala(m, m.d.falas[rndi(0, m.d.falas.length - 1)]);
    }
    if (r) { if (d > r.alcance - 0.3) andaAte(m, p, v); else if (d < 2) andaAte(m, p, v * 0.8, true); else m.flip = p.x < m.x; }
    else if (d > alcance - 0.15) andaAte(m, p, v); else m.flip = p.x < m.x;
    // parado longe de você (sem caminho até você) por uns segundos: desiste e volta
    if (!m.mov && d > (r ? r.alcance + 0.5 : alcance + 1)) { if (!m.tParado) m.tParado = G.agora; else if (G.agora - m.tParado > 2500) desiste(); }
    else m.tParado = 0;
  } else {
    if (!m.dest) {
      if (G.agora > m.prox) { m.dest = posLivre(m.sp.x, m.sp.y, m.sp.raio); m.destT = G.agora + 6000; m.cam = null; }
    } else {
      if (dist(m, m.dest) < 0.15 || G.agora > m.destT) { m.dest = null; m.prox = G.agora + rnd(1500, 4500); }
      else andaAte(m, m.dest, v * 0.55);
    }
  }
  separa(m);
}

/* ---------------- efeitos ---------------- */
function efeito(tipo, x, y, cor, raio) { G.fx.push({ tipo, x, y, cor, raio, t0: G.agora, dur: { puff: 450, toque: 320, morte: 800, nivel: 1500, aura: 750, impacto: 480 }[tipo] || 650 }); }
// nome da habilidade saltando sobre o personagem + anel de energia no chão
function tituloSkill(ent, nome, cor) {
  G.titulos = (G.titulos || []).filter(t => t.ent !== ent);
  G.titulos.push({ ent, txt: nome.toUpperCase() + '!', cor: cor || '#ffe14a', t0: G.agora, dur: 1500 });
  efeito('aura', ent.x, ent.y, cor || '#ffe14a', 1);
}
function desenhaTitulos(ctx, tela) {
  if (!G.titulos || !G.titulos.length) return;
  G.titulos = G.titulos.filter(t => G.agora - t.t0 < t.dur);
  const s = G.dpr;
  for (const ti of G.titulos) {
    const k = (G.agora - ti.t0) / ti.dur; const e = ti.ent;
    const pos = tela(e.x, e.y - alturaEnt(e) - 0.62 - k * 0.45);
    const esc = k < 0.1 ? 0.35 + k / 0.1 * 1.0 : k < 0.2 ? 1.35 - (k - 0.1) / 0.1 * 0.35 : 1;  // "pop"
    ctx.save(); ctx.translate(pos.x, pos.y); ctx.rotate(Math.sin(k * 18) * 0.05 * (1 - Math.min(1, k * 3))); ctx.scale(esc, esc);
    ctx.globalAlpha = k > 0.72 ? (1 - k) / 0.28 : 1;
    ctx.font = `800 ${24 * s}px Fredoka, Nunito, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    const g = ctx.createLinearGradient(0, -12 * s, 0, 12 * s); g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, ti.cor); g.addColorStop(1, ti.cor);
    ctx.shadowColor = ti.cor; ctx.shadowBlur = 14 * s;
    ctx.strokeStyle = '#2a1733'; ctx.lineWidth = 7 * s; ctx.strokeText(ti.txt, 0, 0);
    ctx.shadowBlur = 0; ctx.fillStyle = g; ctx.fillText(ti.txt, 0, 0);
    // brilhos em volta
    const w = ctx.measureText(ti.txt).width;
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2 + k * 3, rx = w * 0.55 + k * 20 * s, ry = 18 * s + k * 12 * s;
      const x = Math.cos(a) * rx, y = Math.sin(a) * ry, r = (4 - k * 3) * s;
      if (r <= 0) continue; ctx.fillStyle = i % 2 ? '#ffffff' : ti.cor; ctx.beginPath();
      for (let j = 0; j < 8; j++) { const aa = j / 8 * Math.PI * 2, rr = j % 2 ? r * 0.4 : r; ctx.lineTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr); } ctx.fill();
    }
    ctx.restore();
  }
}
function texto(ent, txt, cor, dur = 950, dy = 0) { G.textos.push({ x: ent.x, y: ent.y + dy, txt: String(txt), cor, t0: G.agora, dur, ox: rnd(-0.12, 0.12), alt: alturaEnt(ent) }); }
function fala(ent, txt, cor = '#ffb03a') { G.falas = G.falas.filter(f => f.ent !== ent); G.falas.push({ ent, txt, cor, t0: G.agora, dur: 2600 }); }
function projetil(de, para, tipo, cb) { G.projs.push({ x0: de.x, y0: de.y - 0.4, alvo: para, tipo, t0: G.agora, dur: 120 + dist(de, para) * 60, cb }); }

/* ---------------- laço ---------------- */
function atualiza(dt) {
  const s = G.save;
  s.st.tempo += dt / 1000;
  if (!G.mapa.interior) { s.hora += dt / 700; if (s.hora >= 26 * 60) { s.hora = 6 * 60; s.dia++; log(`Amanheceu! Dia ${s.dia}.`, 'l-sis'); } }
  { const lista = comidasAtivas(s);
    for (let i = lista.length - 1; i >= 0; i--) { const c = lista[i]; c.resta -= dt / 1000; if (c.resta <= 0 || !ITENS[c.id]) { if (ITENS[c.id]) log(`O efeito de ${ITENS[c.id].nome} acabou. Hora de comer de novo!`, 'l-sis'); lista.splice(i, 1); G.uiSujo = true; } } }
  G.tRegen += dt;
  if (G.tRegen >= 1000) {
    G.tRegen -= 1000;
    if (s.hp > 0) { const st = stats(); G.acumHp += st.regenHp; G.acumFoco += st.regenFoco; const h = Math.floor(G.acumHp), f = Math.floor(G.acumFoco); G.acumHp -= h; G.acumFoco -= f; s.hp = Math.min(st.maxHp, s.hp + h); s.foco = Math.min(st.maxFoco, s.foco + f); }
  }
  if (G.caca && !G.alvo && G.agora > (G.tCaca || 0) && s.hp > 0) {
    G.tCaca = G.agora + 500;
    const m = ordenaAlvos(G.mons.filter(m => !m.d.treino && !m.d.chefe && dist(m, G.p) < 7))[0];
    if (m) { G.alvo = m; G.uiSujo = true; }
  }
  atualizaJogador(dt);
  ataqueAutomatico();
  for (const m of G.mons) atualizaMonstro(m, dt);
  for (let i = G.respawns.length - 1; i >= 0; i--) { const r = G.respawns[i]; if (G.agora >= r.em) { const m = criaMonstro(r.sp); if (m) { G.mons.push(m); G.respawns.splice(i, 1); } else r.em = G.agora + 3000; } }
  for (let i = G.projs.length - 1; i >= 0; i--) { const pr = G.projs[i]; if (G.agora - pr.t0 >= pr.dur) { G.projs.splice(i, 1); pr.cb && pr.cb(); } }
  G.fx = G.fx.filter(f => G.agora - f.t0 < f.dur);
  G.textos = G.textos.filter(t => G.agora - t.t0 < t.dur);
  G.falas = G.falas.filter(f => G.agora - f.t0 < f.dur);
  atualizaTutorial();
  G.tCarr = (G.tCarr || 0) + dt; if (G.tCarr > 1000) { G.tCarr = 0; if (typeof checaCarreira === 'function') checaCarreira(); }
  { const z = (G.mapa.zonas || []).find(z => G.p.x >= z.x && G.p.x < z.x + z.w && G.p.y >= z.y && G.p.y < z.y + z.h);
    if (z && G.zonaAtual !== z) { banner(z.nome, 'Bairro de torcida rival — os fanáticos andam em GRUPO!'); log(`Você entrou no ${z.nome}. Torcer é festa: vença no jogo limpo!`, 'l-dano'); som('apito'); }
    G.zonaAtual = z || null; }
  G.tUI += dt; if (G.tUI > 120) { G.tUI = 0; atualizaBarras(); }
  G.tBatalha += dt; if (G.tBatalha > 350) { G.tBatalha = 0; atualizaBatalha(); atualizaHotbarCd(); }
  if (G.uiSujo) { G.uiSujo = false; atualizaPaineis(); }
  G.tSave += dt; if (G.tSave > 20000) { G.tSave = 0; salvar(); }
}
let CTX, CV;
function loop(ts) {
  const dt = Math.min(50, ts - (G.ult || ts)); G.ult = ts; G.agora = ts;
  if (G.rodando) { if (!G.pausado) atualiza(dt); desenha(dt); }
  requestAnimationFrame(loop);
}

/* ================= TUTORIAL, DICAS E GUIA ================= */
const TUTORIAL = [
  { txt: 'Use as teclas W A S D (ou as setas) para andar. Também dá pra clicar no chão.', feito: () => G.andou > 3, tecla: 'W A S D' },
  { txt: 'Fale com a sua MÃE: chegue perto dela e aperte E.', alvo: () => alvoNpc('mae'), feito: s => !!s.quests.q_bola, tecla: 'E' },
  { txt: 'Saia de casa pela porta (embaixo) e abra o BAÚ do quintal: chegue perto e aperte E.', alvo: () => alvoPonto('bau_bola'), feito: s => !!s.flags.pegou_bola, tecla: 'E' },
  { txt: 'Achou sua bola! Volte para casa e ENTREGUE a missão para a Mãe (E).', alvo: () => alvoNpc('mae'), feito: s => s.quests.q_bola && s.quests.q_bola.s === 'feita', tecla: 'E' },
  { txt: 'Sua bola e os tostões foram para a MOCHILA (aba Mochila, à direita, ou tecla I). Tudo que você ganha fica lá.', ok: true, destaque: '[data-aba=mochila]' },
  { txt: 'Agora vá ao CAMPINHO (ao sul da vila) e fale com o SEU ZÉ, o treinador.', alvo: () => alvoNpc('ze'), feito: s => !!s.quests.q_pombos, tecla: 'E' },
  { txt: 'CLIQUE num Pombo Folgado para desafiá-lo (aparece um círculo vermelho). Você corre até ele e dribla sozinho!', alvo: () => alvoMonstro('pombo'), feito: s => (s.kills.pombo || 0) >= 1, tecla: 'Clique' },
  { txt: 'Isso! Continue: passe por 6 pombos e volte ao Seu Zé. Siga sempre a SETA AMARELA para achar o próximo objetivo.', ok: true },
];
function atualizaTutorial() {
  const s = G.save; if (s.tut >= TUTORIAL.length) return;
  const st = TUTORIAL[s.tut];
  if (st.feito && st.feito(s)) { s.tut++; som('skill'); G.uiSujo = true; }
}
function avancaTutorial() { const s = G.save; if (s.tut < TUTORIAL.length) { s.tut++; G.uiSujo = true; } }
function pularTutorial() { G.save.tut = TUTORIAL.length; G.uiSujo = true; }
function dica(id, txt, destaque) {
  const s = G.save; if (!s || s.dicas[id]) return;
  s.dicas[id] = true;
  if (!G.dicasFila.some(d => d.id === id)) G.dicasFila.push({ id, txt, destaque });
  G.uiSujo = true;
}
let INDICE = null;
function indice() {
  if (INDICE) return INDICE;
  INDICE = { npc: {}, spawn: {}, ponto: {}, grafo: {} };
  for (const id of Object.keys(MAPAS_DEF)) {
    const m = getMapa(id);
    for (const n of m.npcs) if (!INDICE.npc[n.id]) INDICE.npc[n.id] = { mapa: id, x: n.x + 0.5, y: n.y + 0.5 };
    for (const sp of m.spawns) if (!INDICE.spawn[sp.m]) INDICE.spawn[sp.m] = { mapa: id, x: sp.x + 0.5, y: sp.y + 0.5 };
    for (const p of m.pontos) if (!INDICE.ponto[p.tipo]) INDICE.ponto[p.tipo] = { mapa: id, x: p.x + 0.5, y: p.y + 0.5 };
    INDICE.grafo[id] = m.saidas.map(s => ({ para: s.para, x: s.x + 0.5, y: s.y + 0.5 }));
  }
  return INDICE;
}
function alvoNpc(id) { const n = G.npcs.find(n => n.id === id); if (n) return { mapa: G.mapa.id, x: n.x, y: n.y, ent: n }; return indice().npc[id] || null; }
function alvoPonto(tipo) { return indice().ponto[tipo] || null; }
function alvoMonstro(tipo) {
  const ms = G.mons.filter(m => m.tipo === tipo).sort((a, b) => dist(a, G.p) - dist(b, G.p));
  if (ms.length) return { mapa: G.mapa.id, x: ms[0].x, y: ms[0].y, ent: ms[0] };
  const sp = indice().spawn[tipo]; if (!sp) return null;
  // ainda não voltou (foi vencido há pouco): a seta mostra quanto falta
  const volta = sp.mapa === G.mapa.id ? G.respawns.filter(r => r.sp.m === tipo).map(r => r.em - G.agora).sort((a, b) => a - b)[0] : null;
  return volta > 0 ? { ...sp, espera: volta, quem: MONSTROS[tipo].nome.split(',')[0] } : sp;
}
function proximoPasso(destMapa) {
  const g = indice().grafo; const vis = { [G.mapa.id]: null }; const fila = [G.mapa.id];
  while (fila.length) { const a = fila.shift(); if (a === destMapa) break; for (const e of g[a] || []) if (!(e.para in vis)) { vis[e.para] = { de: a, e }; fila.push(e.para); } }
  if (!(destMapa in vis)) return null;
  let c = destMapa, passo = null;
  while (vis[c]) { passo = vis[c].e; if (vis[c].de === G.mapa.id) break; c = vis[c].de; }
  return passo ? { mapa: G.mapa.id, x: passo.x, y: passo.y, saida: true } : null;
}
function objetivoAtual() {
  const s = G.save;
  if (s.tut < TUTORIAL.length) { const st = TUTORIAL[s.tut]; if (st.alvo) { const a = st.alvo(); if (a) return a; } } // passo sem alvo (ex.: "passe por 6 pombos"): a seta segue a missão ativa
  if (!G.guiaOn) return null;
  for (const q of MISSOES) if (statusMissao(q) === 'pronta') return alvoNpc(q.npc);
  for (const q of MISSOES) if (statusMissao(q) === 'ativa') {
    const r = q.req;
    if (r.kill) return alvoMonstro(r.kill);
    if (r.item) { const tipo = Object.keys(MONSTROS).find(k => MONSTROS[k].loot.some(l => l[0] === r.item)); if (tipo) return alvoMonstro(tipo); }
    if (r.gols) return alvoPonto('penalti');
    if (r.quiz) return alvoNpc('juca');
    if (r.prof) return alvoNpc('lucia');
    if (r.flag === 'pegou_bola') return alvoPonto('bau_bola');
    if (r.flag === 'escolheu_posicao') return alvoNpc('ze');
    if (r.copa || r.copaTitulo || r.copa7a0 || r.comer || r.refino) return alvoNpc(q.npc);
  }
  for (const q of MISSOES) if (statusMissao(q) === 'disponivel') return alvoNpc(q.npc);
  return null;
}
function alvoGuia() {
  const o = objetivoAtual(); if (!o) return null;
  if (o.mapa === G.mapa.id) return o;
  return proximoPasso(o.mapa) || (G.npcs.some(n => n.id === 'comissaria') ? alvoNpc('comissaria') : null);
}

/* ================= RENDERIZAÇÃO ================= */
function ajustaCanvas() {
  const r = CV.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = Math.max(200, Math.round(r.width * dpr)), H = Math.max(150, Math.round(r.height * dpr));
  if (CV.width !== W || CV.height !== H) { CV.width = W; CV.height = H; }
  G.dpr = dpr; const vis = r.width < 640 ? 10 : (G.zoomVis || 15.5); G.zoom = W / ((G.mapa && G.mapa.interior ? Math.min(vis, G.mapa.w + 1.5) : vis) * T);
  // tela mais baixa que 16:10 (janela baixa): garante ~9 quadros de altura, mostrando mais para os lados
  if (!(G.mapa && G.mapa.interior) && r.width >= 640) G.zoom = Math.min(G.zoom, H / (vis * 0.58 * T));
}
function alvoCamera() {
  const m = G.mapa; const vw = CV.width / G.zoom, vh = CV.height / G.zoom;
  let x = G.p.x * T - vw / 2, y = (G.p.y - 0.5) * T - vh / 2;
  x = m.w * T <= vw ? (m.w * T - vw) / 2 : clamp(x, 0, m.w * T - vw);
  y = m.h * T <= vh ? (m.h * T - vh) / 2 : clamp(y, 0, m.h * T - vh);
  return { x, y };
}
function alturaEnt(e) {
  if (e === G.p) return ALT_FASE[faseIdx(G.save.nivel)];
  const l = e.d && e.d.look; if (!l) return 1.4;
  if (l.tipo !== 'humano') return ALTURA_BICHO[l.tipo] || 0.8;
  return (l.alt || 1.66) * (l.grande ? 1.28 : 1);
}
function aSprite(nome) { const e = spr(nome); return e.ok ? e.im : null; }

function desenha(dt) {
  ajustaCanvas();
  const ctx = CTX; const m = G.mapa; const z = G.zoom;
  const alvoC = alvoCamera(); const k = Math.min(1, dt / 110);
  G.cam.x += (alvoC.x - G.cam.x) * k; G.cam.y += (alvoC.y - G.cam.y) * k;
  const cam = G.cam; const vw = CV.width / z, vh = CV.height / z;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = m.interior ? '#1a1024' : '#2b1b5e'; ctx.fillRect(0, 0, CV.width, CV.height);
  ctx.setTransform(z, 0, 0, z, -cam.x * z, -cam.y * z);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  const chao = renderChao(m);
  const sx = Math.max(0, cam.x), sy = Math.max(0, cam.y), sw = Math.min(m.w * T - sx, vw + 2), sh = Math.min(m.h * T - sy, vh + 2);
  if (sw > 0 && sh > 0) ctx.drawImage(chao, sx, sy, sw, sh, sx, sy, sw, sh);
  if (typeof desenhaChaoClima === 'function') desenhaChaoClima(ctx, sx, sy, sw, sh);
  const x0 = Math.max(0, Math.floor(cam.x / T) - 2), y0 = Math.max(0, Math.floor(cam.y / T) - 1), x1 = Math.min(m.w, Math.ceil((cam.x + vw) / T) + 2), y1 = Math.min(m.h, Math.ceil((cam.y + vh) / T) + 4);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (m.chao[y * m.w + x] === CH.AGUA) drawAguaBrilho(ctx, x, y, G.agora);
  for (const pt of m.pontos) if (pt.tipo === 'penalti') { const a = 0.45 + 0.25 * Math.sin(G.agora / 300); ctx.fillStyle = `rgba(255,225,74,${a})`; ctx.beginPath(); ctx.ellipse((pt.x + 0.5) * T, (pt.y + 0.5) * T, T * 0.36, T * 0.24, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke(); }
  for (const s of m.saidas) if (!s.porta) desenhaSaida(ctx, s);
  if (G.alvo && G.mons.includes(G.alvo)) anel(ctx, G.alvo, '#ff3a3a', 1);
  if (G.mouse && G.mouse.ent && G.mouse.ent !== G.alvo) anel(ctx, G.mouse.ent, G.mouse.ent.hp !== undefined ? '#ffb03a' : '#8ad8ff', 0.6);
  if (G.caminho && G.caminho.length) { const d = G.caminho[G.caminho.length - 1]; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(d.x * T, d.y * T, 12, 7, 0, 0, 7); ctx.stroke(); }
  const lista = [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const o = m.obj[y * m.w + x]; if (o && o.t !== 'x') lista.push({ k: (y + 0.9) * T, o, x, y }); }
  for (const b of m.predios) if (b.x < x1 + 4 && b.x + b.w > x0 - 4 && b.y < y1 + 2 && b.y + b.h > y0 - 4) lista.push({ k: (b.y + b.h - 0.05) * T, b });
  const ents = [G.p, ...G.mons, ...G.npcs];
  for (const e of ents) if (e.x > x0 - 2 && e.x < x1 + 2 && e.y > y0 - 1 && e.y < y1 + 1) lista.push({ k: e.y * T, e });
  lista.sort((a, b) => a.k - b.k);
  // o que fica NA FRENTE do personagem (ou do alvo marcado) e o cobre fica translúcido
  const cobertos = [G.p, G.alvo].filter(Boolean).map(e => { const a = alturaEnt(e) * T; return { k: e.y * T, r: [e.x * T - 0.38 * T, e.y * T - a, e.x * T + 0.38 * T, e.y * T] }; });
  for (const it of lista) {
    if (it.e) { desenhaEnt(ctx, it.e); continue; }
    const alvo = it.o || it.b; const ret = it.o ? retObj(it.o, it.x, it.y) : retPredio(it.b);
    const cobre = ret && cobertos.some(c => it.k > c.k && ret[0] < c.r[2] && ret[2] > c.r[0] && ret[1] < c.r[3] && ret[3] > c.r[1]);
    alvo._alfa = alvo._alfa == null ? 1 : alvo._alfa + ((cobre ? 0.3 : 1) - alvo._alfa) * Math.min(1, dt / 120);
    if (alvo._alfa < 0.99) ctx.globalAlpha = alvo._alfa;
    if (it.o) desenhaObj(ctx, it.o, it.x, it.y); else desenhaPredio(ctx, it.b);
    ctx.globalAlpha = 1;
  }
  for (const pr of G.projs) {
    const kk = clamp((G.agora - pr.t0) / pr.dur, 0, 1); const ax = pr.alvo.x, ay = pr.alvo.y - 0.4;
    desenhaProjetil(ctx, pr.tipo, (pr.x0 + (ax - pr.x0) * kk) * T, (pr.y0 + (ay - pr.y0) * kk) * T - Math.sin(kk * Math.PI) * 22, kk);
  }
  for (const f of G.fx) desenhaEfeito(ctx, f);
  desenhaDrops(ctx);
  desenhaNoite(ctx, cam, vw, vh, x0, y0, x1, y1);
  // ---- camada de interface (coordenadas de tela) ----
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const tela = (wx, wy) => ({ x: (wx * T - cam.x) * z, y: (wy * T - cam.y) * z });
  const px = G.dpr;
  for (const e of [...G.mons, ...G.npcs]) {
    const perto = dist(e, G.p) < 3.2, hover = G.mouse && G.mouse.ent === e;
    const topo = tela(e.x, e.y - alturaEnt(e) - 0.08);
    if (topo.x < -50 || topo.x > CV.width + 50 || topo.y < -50 || topo.y > CV.height + 50) continue;
    if (e.hp !== undefined) {
      if (!(e === G.alvo || hover || e.bravo || e.hp < e.d.hp || (e.d.chefe && perto))) continue;
      if (e.d.treino) { rotulo(ctx, e.d.nome, topo.x, topo.y - 4 * px, '#e8e8e8', 12); continue; }
      { const nv = nivelMonstro(e.d); rotulo(ctx, `Nv ${nv}`, topo.x, topo.y - 25 * px, corNivel(nv), 11.5); } // força da criatura
      rotulo(ctx, e.d.nome, topo.x, topo.y - 12 * px, e.d.chefe ? '#ff8a7a' : '#ffffff', 12);
      barraVida(ctx, topo.x, topo.y - 6 * px, e.hp / e.d.hp);
    } else if (perto || hover || dist(e, G.p) < 9) placaNPC(ctx, e, topo.x, topo.y - 4 * px, perto || hover); // NPC: plaquinha verde com ícone
  }
  for (const n of G.npcs) {
    const qs = MISSOES.filter(q => q.npc === n.id); let marca = null;
    if (qs.some(q => statusMissao(q) === 'pronta')) marca = '?'; else if (qs.some(q => statusMissao(q) === 'disponivel')) marca = '!';
    if (!marca) continue;
    const t = tela(n.x, n.y - alturaEnt(n) - 0.35); const b = Math.sin(G.agora / 250) * 4 * px;
    balao(ctx, t.x, t.y + b - (dist(n, G.p) < 9 ? 16 * px : 0), marca); // acima da plaquinha do nome
  }
  { const s = G.save, st = stats(); const t = tela(G.p.x, G.p.y - alturaEnt(G.p) - 0.06); barraVida(ctx, t.x, t.y - 9 * px, s.hp / st.maxHp); barraVida(ctx, t.x, t.y - 1 * px, s.foco / st.maxFoco, '#4aa6ff', 4); rotulo(ctx, `Nv ${s.nivel} ${s.nome}`, t.x, t.y - 20 * px, '#ffe14a', 12.5); } // nível + nome, fôlego e, embaixo, foco
  for (const f of G.falas) { const t = tela(f.ent.x, f.ent.y - alturaEnt(f.ent) - 0.4); rotulo(ctx, f.txt, t.x, t.y, f.cor, 13); }
  desenhaTitulos(ctx, tela);
  for (const tx of G.textos) { const kk = (G.agora - tx.t0) / tx.dur; const t = tela(tx.x + tx.ox, tx.y - tx.alt * 0.7 - kk * 0.55); ctx.globalAlpha = kk > 0.7 ? (1 - kk) / 0.3 : 1; rotulo(ctx, tx.txt, t.x, t.y, tx.cor, 17); ctx.globalAlpha = 1; }
  const inter = interacaoPerto();
  if (inter) { const t = tela(inter.x, inter.y - (inter.alt || 1) - 0.25); dicaTecla(ctx, t.x, t.y - 16 * px, 'E', inter.txt); }
  desenhaGuia(ctx, tela);
  desenhaBuffs(ctx);
  desenhaMini();
}
function desenhaBuffs(ctx) {
  const s = G.dpr; const itens = [];
  if ((G.buffs.muralha || 0) > G.agora) itens.push(['🛡️ Muralha', Math.ceil((G.buffs.muralha - G.agora) / 1000) + 's', '#4a8ae8']);
  if ((G.buffs.arrancada || 0) > G.agora) itens.push(['⚡ Arrancada', Math.ceil((G.buffs.arrancada - G.agora) / 1000) + 's', '#2ab0c8']);
  if (G.firula > 0) itens.push(['✨ Firula', 'x' + G.firula, '#ff9a3a']);
  for (const c of comidasAtivas(G.save)) { if (!ITENS[c.id]) continue; const r = Math.ceil(c.resta); itens.push(['🍽️ ' + ITENS[c.id].nome, `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`, '#e8a020']); }
  if (G.caca) itens.push(['🎯 Caça contínua', 'G', '#d04a4a']);
  if (G.modo === 'chute') itens.push(['⚽ Modo Chute', 'X', '#2a8ae0']);
  let y = 12 * s;
  ctx.font = `700 ${12.5 * s}px Fredoka, sans-serif`; ctx.textBaseline = 'middle';
  for (const [t, v, cor] of itens) {
    const txt = `${t}  ${v}`; const w = ctx.measureText(txt).width + 20 * s; const x = CV.width - w - 10 * s;
    ctx.fillStyle = 'rgba(30,18,40,0.8)'; ctx.beginPath(); ctx.roundRect(x, y, w, 24 * s, 12 * s); ctx.fill();
    ctx.fillStyle = cor; ctx.beginPath(); ctx.roundRect(x, y, 6 * s, 24 * s, 3 * s); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText(txt, x + 12 * s, y + 12 * s);
    y += 28 * s;
  }
  ctx.textBaseline = 'alphabetic';
}
function desenhaDrops(ctx) {
  const SUBIDA = 480, VOO = 380;
  G.drops = G.drops.filter(dp => G.agora - dp.t0 < SUBIDA + dp.espera + VOO);
  for (const dp of G.drops) {
    const t = G.agora - dp.t0; if (t < 0) continue;
    const cor = RARIDADE[dp.rar].cor; const destX = dp.x0 + dp.dx, destY = dp.y0 + dp.dy;
    let x, y, esc = 1, alfa = 1;
    if (t < SUBIDA) { const k = t / SUBIDA; x = dp.x0 + dp.dx * k; y = dp.y0 + dp.dy * k - Math.sin(k * Math.PI) * 1.1 - (1 - k) * 0.4; }
    else if (t < SUBIDA + dp.espera) { x = destX; y = destY - Math.abs(Math.sin((t - SUBIDA) / 160)) * 0.08; }
    else { const k = (t - SUBIDA - dp.espera) / VOO; const e = k * k; x = destX + (G.p.x - destX) * e; y = destY + (G.p.y - 0.5 - destY) * e; esc = 1 - k * 0.6; alfa = 1 - k * 0.3; }
    const px = x * T, py = y * T; const tam = T * 0.46 * esc;
    const raro = dp.rar !== 'comum';
    if (raro) {
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(px, py - tam / 2, 2, px, py - tam / 2, tam * 1.2); g.addColorStop(0, cor + 'cc'); g.addColorStop(1, cor + '00');
      ctx.fillStyle = g; ctx.fillRect(px - tam * 1.3, py - tam * 1.8, tam * 2.6, tam * 2.6);
      if (dp.rar !== 'incomum' && t > SUBIDA - 100 && t < SUBIDA + dp.espera) { const gb = ctx.createLinearGradient(0, py - T * 2.4, 0, py); gb.addColorStop(0, cor + '00'); gb.addColorStop(1, cor + '99'); ctx.fillStyle = gb; ctx.fillRect(px - 6, py - T * 2.4, 12, T * 2.4); }
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = alfa;
    const ic = dp.id === 'tostao' ? aSprite('i_tostao') : iconeItem(dp.id);
    if (ic) ctx.drawImage(ic, px - tam / 2, py - tam, tam, tam);
    ctx.globalAlpha = 1;
    if (t >= SUBIDA && t < SUBIDA + 60 && !dp.falou) { dp.falou = true; texto({ x: destX, y: destY + 0.3 }, dp.id === 'tostao' ? `+${dp.q} tostões` : `${dp.q > 1 ? dp.q + 'x ' : ''}${ITENS[dp.id].nome}`, dp.id === 'tostao' ? '#ffd23f' : cor, 1300, 0); }
  }
}
function anel(ctx, e, cor, a) {
  const r = (e.r || R_ENT) + 0.12; const pul = 1 + Math.sin(G.agora / 200) * 0.06;
  ctx.globalAlpha = a; ctx.strokeStyle = cor; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.ellipse(e.x * T, e.y * T, r * T * pul, r * T * 0.55 * pul, 0, 0, 7); ctx.stroke();
  ctx.globalAlpha = a * 0.25; ctx.fillStyle = cor; ctx.fill(); ctx.globalAlpha = 1;
}
function desenhaSaida(ctx, s) {
  const x = (s.x + 0.5) * T, y = (s.y + 0.5) * T; const m = G.mapa;
  let ang = Math.PI / 2; if (s.x === 0) ang = Math.PI; else if (s.x === m.w - 1) ang = 0; else if (s.y === 0) ang = -Math.PI / 2;
  const bl = s.req && s.req.flag && !G.save.flags[s.req.flag];
  const b = Math.sin(G.agora / 250) * 5;
  ctx.save(); ctx.translate(x + Math.cos(ang) * b, y + Math.sin(ang) * b); ctx.rotate(ang);
  ctx.fillStyle = bl ? 'rgba(200,200,210,0.55)' : 'rgba(255,225,74,0.9)'; ctx.strokeStyle = 'rgba(60,40,20,0.7)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-6, -12); ctx.lineTo(-6, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}
const JITTER = new Set(['arvore', 'mangueira', 'arbusto', 'pedra', 'coqueiro', 'coqueiro2']);
const ESPELHA = new Set(['arvore', 'mangueira', 'arbusto', 'coqueiro', 'coqueiro2', 'pedra', 'carro', 'carro2']);
function retObj(o, x, y) {
  const info = OBJ_INFO[o.t]; const im = info && aSprite(o.t); if (!im) return null;
  const w = info.w * T, h = w * im.height / im.width; const cx = (x + 0.5) * T, base = (y + 0.94) * T;
  return [cx - w / 2, base - h, cx + w / 2, base - T * 0.25]; // a base (tronco/pé) não precisa sumir
}
function retPredio(b) {
  const im = aSprite(b.spr); if (!im) return null; const porta = PORTAS[b.spr] || { x: 0.5, y: 0.95 };
  const w = (b.w + 0.5) * T, h = w * im.height / im.width; const x0 = (b.porta.x + 0.5) * T - porta.x * w, y0 = (b.porta.y + 1) * T - porta.y * h;
  return [x0, y0, x0 + w, y0 + h];
}
function desenhaObj(ctx, o, x, y) {
  if (o.t === 'gol') { const S = objSprite('gol', 0, o.meta); if (!S.vazio) ctx.drawImage(S.c, x * T + S.ox, y * T + S.oy, S.w, S.h); return; }
  const info = OBJ_INFO[o.t]; const im = info && aSprite(o.t);
  if (!im) return;
  const w = info.w * T, h = w * im.height / im.width;
  const jit = JITTER.has(o.t) ? ((o.v % 7) - 3) * 2.5 : 0;
  const cx = (x + 0.5) * T + jit, base = (y + 0.94) * T;
  if (ESPELHA.has(o.t) && o.v % 2) { ctx.save(); ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.drawImage(im, -w / 2, base - h, w, h); ctx.restore(); }
  else ctx.drawImage(im, cx - w / 2, base - h, w, h);
}
function desenhaPredio(ctx, b) {
  const im = aSprite(b.spr);
  if (!im) { ctx.fillStyle = '#c86a4a'; ctx.fillRect(b.x * T, (b.y - 0.8) * T, b.w * T, (b.h + 0.8) * T); return; }
  const porta = PORTAS[b.spr] || { x: 0.5, y: 0.95 };
  const w = (b.w + 0.5) * T, h = w * im.height / im.width;
  ctx.drawImage(im, (b.porta.x + 0.5) * T - porta.x * w, (b.porta.y + 1) * T - porta.y * h, w, h);
}
function desenhaEnt(ctx, e) {
  const look = e === G.p ? lookJogador() : e.d.look;
  const x = e.x * T, y = e.y * T;
  if (e.d && e.d.quadro) { const im = aSprite('quadro'); if (im) { const w = 1.2 * T, h = w * im.height / im.width; ctx.drawImage(im, x - w / 2, y + 0.4 * T - h, w, h); } return; }
  const alt = alturaEnt(e) * T;
  const hit = e.hitT && G.agora - e.hitT < 180 ? Math.sin((G.agora - e.hitT) / 18) * 4 : 0;
  const golpe = e.golpe && G.agora - e.golpe < 220 ? Math.sin((G.agora - e.golpe) / 220 * Math.PI) : 0;
  ctx.fillStyle = 'rgba(30,20,40,0.25)'; ctx.beginPath(); ctx.ellipse(x, y, Math.min(alt * 0.22, 26), 8, 0, 0, 7); ctx.fill();
  if (e.hp === undefined && e !== G.p) { // NPC (amigo): anel verde-água no chão, pra não confundir com adversário
    const rx = Math.min(alt * 0.26, 30), pul = 1 + Math.sin(G.agora / 500 + e.x + e.y) * 0.05;
    ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, rx * pul, 9.5 * pul, 0, 0, 7);
    ctx.fillStyle = 'rgba(90,240,200,0.15)'; ctx.fill(); ctx.strokeStyle = 'rgba(90,240,200,0.9)'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.restore();
  }
  if (look.tipo !== 'humano') {
    const nome = { pombo: e.mov || e.bravo || Math.sin(G.agora / 900 + (e.uid || 0)) < 0.3 ? 'pombo' : 'pombo2', cachorro: e.mov || e.bravo ? 'cachorro' : 'cachorro2', caranguejo: 'caranguejo', gaivota: 'gaivota', boneco: 'boneco' }[look.tipo];
    const im = aSprite(nome);
    if (!im) { desenhaBicho(ctx, look.tipo, x, y, 1, { fase: e.fase, mov: e.mov, flip: e.flip, t: G.agora, id: e.uid }); return; }
    const voo = look.tipo === 'gaivota' ? -T * 0.5 + Math.sin(G.agora / 300 + (e.uid || 0)) * 5 : 0;
    const bob = e.mov ? Math.abs(Math.sin(e.fase)) * 3 : 0;
    const h = alt, w = h * im.width / im.height;
    const espelha = (FACE_BICHO[nome] || 'e') === 'd' ? e.flip : !e.flip; // sprites olham para a esquerda
    ctx.save(); ctx.translate(x + hit + (e.flip ? -1 : 1) * golpe * 6, y + voo - bob);
    if (look.tipo !== 'caranguejo' && look.tipo !== 'boneco' && espelha) ctx.scale(-1, 1);
    ctx.drawImage(im, -w / 2, -h, w, h); ctx.restore();
    return;
  }
  // parado há um tempo volta a ficar de frente; chutando/driblando fica de lado (virado para o alvo)
  let vista = e.vista || 'frente';
  if (!e.mov && G.agora - (e.tVista || 0) > 2500) vista = 'frente';
  if (e.golpe && G.agora - e.golpe < 450) vista = 'lado';
  // personagem próprio: 3 vistas e 4 quadros de caminhada (boneco.js); sem ele, a arte antiga
  const quadro = e.mov ? Math.floor((e.fase || 0) / (Math.PI / 2)) % 4 : 0;
  const comp = typeof spriteBoneco === 'function' ? spriteBoneco(look, vista, quadro) : ((vista === 'costas' && typeof compoeVista === 'function' ? compoeVista(look, vista) : null) || compoe(look));
  if (!comp) { desenhaSilhueta(ctx, look, x, y, alt); return; }
  const h = alt, w = h * comp.c.width / comp.c.height;
  const dir = e.flip ? -1 : 1, lado = e.mov && vista === 'lado';
  const passo = Math.abs(Math.sin(e.fase));                        // 0 no apoio, 1 no alto do passo
  const bob = e.mov ? passo * h * 0.03 : 0;
  // as pernas já andam no desenho: aqui só um leve gingado e a inclinação para a frente de lado
  const rot = lado ? dir * 0.04 : e.mov ? Math.sin(e.fase) * 0.035 : 0;
  const sy = e.mov ? 1 - (1 - passo) * 0.02 : 1 + Math.sin(G.agora / 450 + (e.uid || 0)) * 0.012, sx = 1;
  ctx.save(); ctx.translate(x + hit + dir * golpe * 7, y - bob); ctx.rotate(rot + dir * golpe * 0.12); ctx.scale((e.flip ? -1 : 1) * sx, sy);
  ctx.drawImage(comp.c, -w / 2, -h, w, h); ctx.restore();
  if (e === G.p && G.save.flags.pegou_bola) {
    const dir = e.flip ? -1 : 1; const pula = e.mov ? Math.abs(Math.sin(e.fase * 0.5)) * 5 : 0;
    desenhaBola(ctx, x + dir * h * 0.2, y - 5 - pula, 6.5, e.fase * 0.8 * dir);
  }
}
function desenhaProjetil(ctx, tipo, x, y, k) {
  if (tipo === 'bola' || tipo === 'bolaforte') { if (tipo === 'bolaforte') { ctx.fillStyle = 'rgba(255,230,120,0.45)'; ctx.beginPath(); ctx.arc(x, y, 14, 0, 7); ctx.fill(); } desenhaBola(ctx, x, y, tipo === 'bolaforte' ? 9 : 7, k * 12); }
  else if (tipo === 'areia') { ctx.fillStyle = '#ead69c'; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(x + rnd(-8, 8), y + rnd(-8, 8), 2.5, 0, 7); ctx.fill(); } }
  else if (tipo === 'cone') { const im = aSprite('cone_deco'); if (im) ctx.drawImage(im, x - 10, y - 14, 20, 20 * im.height / im.width); }
  else if (tipo === 'papel') { ctx.save(); ctx.translate(x, y); ctx.rotate(k * 8); ctx.fillStyle = '#f8f8f8'; ctx.strokeStyle = '#3d2b3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(-7, -9, 14, 18, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c8c8d0'; ctx.beginPath(); ctx.arc(0, -9, 3, 0, 7); ctx.fill(); ctx.restore(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 20, y + 10, x - 36, y - 4); ctx.stroke(); }
  else if (tipo === 'copo') { ctx.save(); ctx.translate(x, y); ctx.rotate(k * 9); ctx.fillStyle = '#ff5a5a'; ctx.strokeStyle = '#3d2b3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(6, -8); ctx.lineTo(4, 8); ctx.lineTo(-4, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
  else if (tipo === 'cartao') { ctx.save(); ctx.translate(x, y); ctx.rotate(k * 10); ctx.fillStyle = Math.floor(k * 6) % 2 ? '#ffd23f' : '#ff3a3a'; ctx.fillRect(-6, -8, 12, 16); ctx.strokeStyle = '#3d2b3a'; ctx.lineWidth = 2; ctx.strokeRect(-6, -8, 12, 16); ctx.restore(); }
}
function desenhaEfeito(ctx, f) {
  const k = (G.agora - f.t0) / f.dur; if (k >= 1 || k < 0) return; // pausado no meio: não desenha além do fim (raio negativo quebrava o quadro)
  const cx = f.x * T, cy = f.y * T - 0.5 * T;
  const pt = (x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
  const estrela = (x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, r2 = i % 2 ? r * 0.4 : r; ctx.lineTo(x + Math.cos(a) * r2, y + Math.sin(a) * r2); } ctx.fill(); };
  switch (f.tipo) {
    case 'aura': { // anel de energia no chão que se abre + faíscas subindo
      const r = (0.3 + k * 1.1) * T; ctx.globalAlpha = 1 - k; ctx.strokeStyle = f.cor; ctx.lineWidth = 6 * (1 - k) + 2;
      ctx.beginPath(); ctx.ellipse(cx, cy + 0.5 * T, r, r * 0.38, 0, 0, 7); ctx.stroke();
      ctx.globalAlpha = (1 - k) * 0.35; ctx.fillStyle = f.cor; ctx.beginPath(); ctx.ellipse(cx, cy + 0.5 * T, r * 0.8, r * 0.3, 0, 0, 7); ctx.fill();
      ctx.globalAlpha = 1 - k; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; estrela(cx + Math.cos(a) * r * 0.7, cy + 0.5 * T - k * 0.9 * T - (i % 3) * 8, 4 * (1 - k) + 1.5, i % 2 ? '#ffffff' : f.cor); }
      ctx.globalAlpha = 1; break; }
    case 'impacto': { // explosão no adversário atingido
      ctx.globalAlpha = 1 - k; ctx.strokeStyle = f.cor; ctx.lineWidth = 4;
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + 0.3, r0 = 10 + k * 26, r1 = r0 + 14 * (1 - k) + 4; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke(); }
      pt(cx, cy, 16 * (1 - k) + 2, 'rgba(255,255,255,0.8)'); for (let i = 0; i < 4; i++) { const a = i * 1.7 + k * 4; estrela(cx + Math.cos(a) * (18 + k * 20), cy + Math.sin(a) * (18 + k * 20), 5 * (1 - k) + 1, f.cor); }
      ctx.globalAlpha = 1; break; }
    case 'toque': estrela(cx, cy, 10 + k * 14, `rgba(255,255,255,${1 - k})`); break;
    case 'escudo': ctx.globalAlpha = (1 - k) * 0.8; ctx.strokeStyle = f.cor; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, 26 + k * 16, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; break;
    case 'estrelas': for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + k * 3; estrela(cx + Math.cos(a) * (14 + k * 26), cy + Math.sin(a) * (10 + k * 18), 6 * (1 - k) + 2, f.cor); } break;
    case 'puff': ctx.globalAlpha = 1 - k; for (let i = 0; i < 5; i++) pt(cx - 16 + i * 8, cy - k * 14 + (i % 2) * 5, 7 + k * 4, '#e8ecf8'); ctx.globalAlpha = 1; break;
    case 'morte': ctx.globalAlpha = 1 - k; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; estrela(cx + Math.cos(a) * k * 36, cy + Math.sin(a) * k * 30 - k * 10, 6, i % 2 ? '#ffe14a' : '#ffffff'); } ctx.globalAlpha = 1; break;
    case 'giro': for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + k * 10; pt(cx + Math.cos(a) * 24, cy + 20 + Math.sin(a) * 10, 4, f.cor); } break;
    case 'chapeu': desenhaBola(ctx, cx - 26 + k * 52, cy + 14 - Math.sin(k * Math.PI) * 56, 7, k * 10); break;
    case 'elastico': desenhaBola(ctx, cx + Math.sin(k * Math.PI * 3) * 22, cy + 22, 7, k * 8); break;
    case 'caneta': desenhaBola(ctx, cx, cy - 16 + k * 44, 7, k * 10); break;
    case 'cura': case 'curaforte': ctx.globalAlpha = 1 - k; ctx.fillStyle = f.cor; ctx.font = '700 16px Fredoka'; for (let i = 0; i < (f.tipo === 'cura' ? 7 : 14); i++) ctx.fillText('+', cx - 22 + ((i * 37) % 44), cy + 24 - k * 56 - (i % 3) * 8); ctx.globalAlpha = 1; break;
    case 'vento': ctx.globalAlpha = 1 - k; ctx.strokeStyle = f.cor; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(cx - 30 + k * 14, cy - 10 + i * 10); ctx.lineTo(cx - 8 + k * 14, cy - 10 + i * 10); ctx.stroke(); } ctx.globalAlpha = 1; break;
    case 'area': case 'raio': { const r = (f.raio || 1) * T * k + 20; ctx.strokeStyle = f.cor; ctx.lineWidth = 5; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.ellipse(cx, cy + 0.5 * T, r, r * 0.55, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; break; }
    case 'bolaforte': case 'explosao': { const r = 8 + k * 34; ctx.globalAlpha = 1 - k; pt(cx, cy, r, f.cor || '#ffe27a'); ctx.globalAlpha = 1; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; estrela(cx + Math.cos(a) * r * 1.3, cy + Math.sin(a) * r * 1.3, 5, '#ffffff'); } break; }
    case 'nivel': ctx.globalAlpha = (1 - k) * 0.7; ctx.fillStyle = '#ffe14a'; ctx.beginPath(); ctx.ellipse(cx, cy + 0.5 * T, 30, 12, 0, 0, 7); ctx.fill(); ctx.fillRect(cx - 22, cy - 70 + k * 20, 44, 100); ctx.globalAlpha = 1; for (let i = 0; i < 12; i++) estrela(cx - 26 + (i * 13) % 52, cy + 20 - k * 80 - (i % 3) * 12, 4, '#ffffff'); break;
  }
}
function desenhaNoite(ctx, cam, vw, vh, x0, y0, x1, y1) {
  if (G.mapa.interior) return;
  const h = G.save.hora / 60; let a = 0;
  if (h >= 17 && h < 19.5) a = (h - 17) / 2.5 * 0.26; else if (h >= 19.5 && h < 22) a = 0.26 + (h - 19.5) / 2.5 * 0.18; else if (h >= 22) a = 0.44; else if (h < 7) a = 0.44 - (h - 6) * 0.44;
  if (G.mapa.id === 'estadio') a *= 0.5;
  if (a <= 0.01) return;
  ctx.fillStyle = h < 19 && h >= 17 ? `rgba(120,50,90,${a})` : `rgba(20,24,80,${a})`; ctx.fillRect(cam.x, cam.y, vw, vh);
  if (a > 0.18) {
    ctx.globalCompositeOperation = 'lighter';
    const luz = (x, y, r, int) => { const g = ctx.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, `rgba(255,205,120,${int})`); g.addColorStop(1, 'rgba(255,205,120,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
    const m = G.mapa;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const o = m.obj[y * m.w + x]; if (o && (o.t === 'poste' || o.t === 'poste2' || o.t === 'holofote')) luz((x + 0.5) * T, (y - 0.6) * T, 110, (a - 0.12) * 0.9); }
    for (const b of m.predios) luz((b.porta.x + 0.5) * T, (b.porta.y + 0.4) * T, 70, (a - 0.12) * 0.7);
    luz(G.p.x * T, (G.p.y - 0.5) * T, 90, (a - 0.12) * 0.5);
    ctx.globalCompositeOperation = 'source-over';
  }
}
// nome do NPC numa plaquinha verde-água com o ícone do que ele faz (🛒 loja, 🎓 professor, 💬 conversa...)
function placaNPC(ctx, n, x, y, forte) {
  const ic = (typeof iconeNPC === 'function' && iconeNPC(n)) || '💬'; const txt = ic + ' ' + n.d.nome;
  const s = 11.5 * G.dpr; ctx.font = `700 ${s}px Fredoka, Nunito, sans-serif`;
  const w = ctx.measureText(txt).width + 14 * G.dpr, h = s + 8 * G.dpr, cy = y - h / 2 + 2 * G.dpr;
  ctx.globalAlpha = forte ? 1 : 0.82;
  ctx.fillStyle = 'rgba(12,72,60,0.9)'; ctx.strokeStyle = '#6ff0c8'; ctx.lineWidth = 1.5 * G.dpr;
  ctx.beginPath(); ctx.roundRect(x - w / 2, cy - h / 2, w, h, h / 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#eafff6'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, cy + 0.5 * G.dpr);
  ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
}
function rotulo(ctx, txt, x, y, cor, tam) {
  const s = tam * G.dpr; ctx.font = `700 ${s}px Fredoka, Nunito, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.lineWidth = s * 0.28; ctx.strokeStyle = 'rgba(30,18,40,0.9)'; ctx.lineJoin = 'round'; ctx.strokeText(txt, x, y); ctx.fillStyle = cor; ctx.fillText(txt, x, y);
}
function barraVida(ctx, x, y, pc, cor, alt = 6) {
  const w = 44 * G.dpr, h = alt * G.dpr; pc = clamp(pc, 0, 1);
  ctx.fillStyle = 'rgba(30,18,40,0.85)'; ctx.beginPath(); ctx.roundRect(x - w / 2 - 2, y - h / 2 - 2, w + 4, h + 4, 4); ctx.fill();
  ctx.fillStyle = cor || (pc > 0.6 ? '#4ad86a' : pc > 0.3 ? '#f0d23a' : '#f0503a'); ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, Math.max(2, w * pc), h, 3); ctx.fill();
}
function balao(ctx, x, y, marca) {
  const r = 13 * G.dpr;
  ctx.fillStyle = marca === '?' ? '#5ad86a' : '#ffd23f'; ctx.strokeStyle = '#3d2b3a'; ctx.lineWidth = 3 * G.dpr;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 5 * G.dpr, y + r - 2); ctx.lineTo(x, y + r + 8 * G.dpr); ctx.lineTo(x + 5 * G.dpr, y + r - 2); ctx.fill();
  ctx.font = `800 ${r * 1.5}px Fredoka, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#3d2b3a'; ctx.fillText(marca, x, y + 1); ctx.textBaseline = 'alphabetic';
}
function dicaTecla(ctx, x, y, tecla, txt) {
  const s = G.dpr; ctx.font = `700 ${13 * s}px Fredoka, sans-serif`; const w = ctx.measureText(txt).width + 34 * s;
  ctx.fillStyle = 'rgba(30,18,40,0.82)'; ctx.beginPath(); ctx.roundRect(x - w / 2, y - 13 * s, w, 26 * s, 13 * s); ctx.fill();
  ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.roundRect(x - w / 2 + 4 * s, y - 9 * s, 18 * s, 18 * s, 4 * s); ctx.fill();
  ctx.fillStyle = '#3d2b3a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(tecla, x - w / 2 + 13 * s, y + 1);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText(txt, x - w / 2 + 27 * s, y + 1); ctx.textBaseline = 'alphabetic';
}
function desenhaGuia(ctx, tela) {
  const alvo = alvoGuia(); G.guiaAlvo = alvo; if (!alvo) return;
  const alt = alvo.ent ? alturaEnt(alvo.ent) + 0.75 : 0.9;
  const t = tela(alvo.x, alvo.y - alt); const s = G.dpr; const b = Math.sin(G.agora / 220) * 7 * s;
  const W = CV.width, H = CV.height, mg = 44 * s;
  if (t.x > mg && t.x < W - mg && t.y > mg && t.y < H - mg) {
    if (dist(G.p, alvo) < 1.2 && !alvo.saida) return;
    ctx.save(); ctx.translate(t.x, t.y + b); seta(ctx, Math.PI / 2, s); ctx.restore();
    if (alvo.espera) { const seg = Math.ceil(alvo.espera / 1000); rotulo(ctx, `${alvo.quem} volta em ${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`, t.x, t.y - 26 * s, '#ffe14a', 16); }
  } else {
    const c = { x: W / 2, y: H / 2 }; const ang = Math.atan2(t.y - c.y, t.x - c.x);
    const ex = clamp(c.x + Math.cos(ang) * W, mg, W - mg), ey = clamp(c.y + Math.sin(ang) * H, mg, H - mg);
    ctx.save(); ctx.translate(ex - Math.cos(ang) * Math.abs(b), ey - Math.sin(ang) * Math.abs(b)); seta(ctx, ang, s); ctx.restore();
    if (alvo.espera) { const seg = Math.ceil(alvo.espera / 1000); rotulo(ctx, `${alvo.quem} volta em ${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`, clamp(ex - Math.cos(ang) * 46 * s, 110 * s, W - 110 * s), clamp(ey - Math.sin(ang) * 40 * s, 30 * s, H - 20 * s), '#ffe14a', 16); }
  }
}
function seta(ctx, ang, s) {
  ctx.rotate(ang);
  ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#3d2b3a'; ctx.lineWidth = 3.5 * s; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(18 * s, 0); ctx.lineTo(-4 * s, -16 * s); ctx.lineTo(-4 * s, -7 * s); ctx.lineTo(-20 * s, -7 * s); ctx.lineTo(-20 * s, 7 * s); ctx.lineTo(-4 * s, 7 * s); ctx.lineTo(-4 * s, 16 * s); ctx.closePath();
  ctx.fill(); ctx.stroke();
}
function desenhaMini() {
  const mc = $('#mini'); if (!mc) return; const m = G.mapa; const img = renderMini(m);
  if (mc.width !== img.width) { mc.width = img.width; mc.height = img.height; }
  const c = mc.getContext('2d'); c.drawImage(img, 0, 0);
  for (const mo of G.mons) { if (mo.d.treino) continue; c.fillStyle = mo.d.chefe ? '#ff2a2a' : '#ff9a3a'; c.fillRect(mo.x * 3 - 1, mo.y * 3 - 1, 3, 3); }
  for (const n of G.npcs) { c.fillStyle = '#5ad8ff'; c.fillRect(n.x * 3 - 1.5, n.y * 3 - 1.5, 3, 3); }
  if (G.guiaAlvo) { c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(G.guiaAlvo.x * 3, G.guiaAlvo.y * 3, 3.5, 0, 7); c.fill(); }
  const p = G.p; c.fillStyle = '#fff'; c.beginPath(); c.arc(p.x * 3, p.y * 3, 3.5, 0, 7); c.fill(); c.fillStyle = '#ff3aff'; c.beginPath(); c.arc(p.x * 3, p.y * 3, 2.2, 0, 7); c.fill();
}

/* ---------------- interação ---------------- */
function interacaoPerto() {
  const p = G.p; if (!p || G.save.hp <= 0) return null;
  let melhor = null, md = 9;
  for (const n of G.npcs) { const d = dist(n, p); if (d < 1.7 && d < md) { md = d; melhor = { tipo: 'npc', n, x: n.x, y: n.y, alt: alturaEnt(n), txt: n.d.quadro ? 'Ver desafios' : 'Falar com ' + n.d.nome }; } }
  for (const pt of G.mapa.pontos) { const c = { x: pt.x + 0.5, y: pt.y + 0.5 }; const d = dist(c, p); const lim = pt.tipo === 'penalti' ? 0.75 : 1.6; if (d < lim && d < md) { md = d; melhor = { tipo: 'ponto', pt, x: c.x, y: c.y, alt: 0.7, txt: pt.tipo === 'penalti' ? 'Bater pênalti' : 'Abrir baú' }; } }
  for (const pl of G.mapa.placas) { const c = { x: pl.x + 0.5, y: pl.y + 0.5 }; const d = dist(c, p); if (d < 1.6 && d < md) { md = d; melhor = { tipo: 'placa', pl, x: c.x, y: c.y, alt: 0.9, txt: 'Ler placa' }; } }
  return melhor;
}
function interagir() {
  const it = interacaoPerto();
  if (!it) { const adj = G.mons.filter(m => dist(m, G.p) < 1.6).sort((a, b) => dist(a, G.p) - dist(b, G.p))[0]; if (adj) { G.alvo = adj; G.uiSujo = true; return; } log('Não tem ninguém aqui. Chegue perto de uma pessoa, placa ou baú e aperte E.', 'l-sis'); return; }
  if (it.tipo === 'npc') return abrirNPC(it.n);
  if (it.tipo === 'ponto') return usarPonto(it.pt);
  if (it.tipo === 'placa') { log(`Placa: "${it.pl.texto}"`, 'l-npc'); banner('Placa', it.pl.texto); }
}
function usarPonto(pt) {
  const s = G.save;
  if (pt.tipo === 'bau_bola') {
    if (!s.flags.pegou_bola) { s.flags.pegou_bola = true; recebeItem('bola'); log('Você pegou sua Bola de Capotão! Agora ela vai com você pra todo lado.', 'l-loot'); banner('Sua primeira bola!', 'Volte e fale com a Mãe'); som('moeda'); G.uiSujo = true; salvar(); }
    else log('O baú está vazio. Só tem umas figurinhas velhas de 1994.', 'l-info');
  } else if (pt.tipo === 'penalti') abrirPenalti();
}
function irE(x, y, raio, acao) {
  const p = G.p;
  if (Math.hypot(p.x - x, p.y - y) <= raio + 0.05) { acao(); return; }
  const c = caminho(Math.floor(p.x), Math.floor(p.y), (i, j) => Math.hypot(i + 0.5 - x, j + 0.5 - y) <= raio + 0.3 && !(raio > 0.5 && Math.floor(x) === i && Math.floor(y) === j), 4000);
  if (c) { G.caminho = c; G.acaoChegar = () => { if (Math.hypot(G.p.x - x, G.p.y - y) <= raio + 0.6) acao(); }; } else log('Não consigo chegar lá.', 'l-sis');
}
function mundoDoMouse(ev) {
  const r = CV.getBoundingClientRect();
  const sx = (ev.clientX - r.left) * G.dpr, sy = (ev.clientY - r.top) * G.dpr;
  return { x: (sx / G.zoom + G.cam.x) / T, y: (sy / G.zoom + G.cam.y) / T };
}
function entNoPonto(w) {
  let melhor = null;
  for (const e of [...G.mons, ...G.npcs]) {
    const h = alturaEnt(e), wd = h * 0.4 + 0.12;
    if (w.x > e.x - wd && w.x < e.x + wd && w.y > e.y - h && w.y < e.y + 0.2) if (!melhor || e.y > melhor.y) melhor = e;
  }
  return melhor;
}
function cliqueTela(ev) {
  if (!G.rodando || G.pausado) return;
  const w = mundoDoMouse(ev);
  const e = entNoPonto(w);
  if (e && e.hp !== undefined) { G.alvo = G.alvo === e ? null : e; G.caminho = null; G.uiSujo = true; return; }
  if (e) return irE(e.x, e.y, 1.3, () => abrirNPC(e));
  const tx = Math.floor(w.x), ty = Math.floor(w.y);
  const pt = G.mapa.pontos.find(pt => pt.x === tx && pt.y === ty);
  if (pt) return irE(pt.x + 0.5, pt.y + 0.5, pt.tipo === 'penalti' ? 0 : 1.2, () => usarPonto(pt));
  const pl = G.mapa.placas.find(pl => pl.x === tx && pl.y === ty);
  if (pl) return irE(pl.x + 0.5, pl.y + 0.5, 1.2, () => { log(`Placa: "${pl.texto}"`, 'l-npc'); banner('Placa', pl.texto); });
  const pr = G.mapa.predios.find(b => tx >= b.x && tx < b.x + b.w && ty >= b.y - 2 && ty < b.y + b.h);
  if (pr && pr.interior) return irE(pr.porta.x + 0.5, pr.porta.y + 0.5, 0, () => { });
  if (podeAndar(tx, ty)) { const c = caminho(Math.floor(G.p.x), Math.floor(G.p.y), (i, j) => i === tx && j === ty, 5000); if (c) { if (c.length) c[c.length - 1] = { x: w.x, y: w.y }; else c.push({ x: w.x, y: w.y }); G.caminho = c; G.acaoChegar = null; } }
}
const TECLA_DIR = { ArrowDown: 'd', s: 'd', S: 'd', ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'u', w: 'u', W: 'u' };
// "força" de cada criatura: nível próprio (cidades/Europa) ou estimado pelo XP; chefões = área + 3
function nivelMonstro(d) {
  if (d.nivel) return d.nivel;
  if (d._nv) return d._nv;
  if (!d.chefe) return d._nv = Math.max(1, Math.round(Math.sqrt(d.xp / 0.55)));
  // chefão: nível = o mais forte da área DELE + 3 (não a área onde o jogador está na hora — antes ficava gravado errado)
  const tipo = Object.keys(MONSTROS).find(k => MONSTROS[k] === d || (MONSTROS[k].chefe && MONSTROS[k].nome === d.nome));
  const casa = Object.values(MAPAS).find(m => m && m.spawns && m.spawns.some(sp => sp.m === tipo));
  if (!casa) return Math.round(Math.sqrt(d.xp / 6.6)) + 3; // mapa dele ainda não montado: estimativa (sem gravar)
  const area = casa.spawns.map(sp => MONSTROS[sp.m]).filter(o => o && !o.chefe && !o.treino);
  return d._nv = (area.length ? Math.max(...area.map(nivelMonstro)) : Math.round(Math.sqrt(d.xp / 6.6))) + 3;
}
function corNivel(n) { const dif = n - G.save.nivel; return dif <= -10 ? '#b8b8c0' : dif <= -3 ? '#7aff8a' : dif < 3 ? '#ffffff' : dif < 8 ? '#ffb040' : '#ff5a4a'; }
const MODOS_ALVO = { perto: 'Mais perto', forte: 'Mais forte', fraco: 'Mais fraco', vida: 'Menos fôlego' };
function ordenaAlvos(lista) {
  const p = G.p, modo = G.save.modoAlvo || 'perto', dd = m => dist(m, p);
  const crit = { perto: m => dd(m), forte: m => -nivelMonstro(m.d) * 1000 + dd(m), fraco: m => nivelMonstro(m.d) * 1000 + dd(m), vida: m => (m.hp / m.d.hp) * 1000 + dd(m) }[modo] || dd;
  return lista.sort((a, b) => crit(a) - crit(b));
}
function trocaModoAlvo() {
  const ks = Object.keys(MODOS_ALVO); const s = G.save; s.modoAlvo = ks[(ks.indexOf(s.modoAlvo || 'perto') + 1) % ks.length];
  log(`🎯 Espaço agora marca: ${MODOS_ALVO[s.modoAlvo].toUpperCase()} (tecla V troca).`, 'l-info'); G.alvo = null; G.uiSujo = true; atualizaBotaoAlvo();
}
// prioridade de ataque: fica no alto da aba BATALHA (escolha direta; a tecla V continua trocando)
const NOMES_ALVO = { perto: 'Perto', forte: 'Forte', fraco: 'Fraco', vida: 'Fôlego' };
function atualizaBotaoAlvo() {
  const aba = document.getElementById('aba-batalha'), lista = document.getElementById('listaBatalha'); if (!aba || !lista || !G.save) return;
  let box = document.getElementById('prioAlvo');
  if (!box) {
    box = el('div', { id: 'prioAlvo', class: 'prio-alvo' }, el('span', { class: 'prio-rot', title: 'Como o ESPAÇO escolhe o adversário (tecla V troca)' }, '🎯 Prioridade (V):'));
    for (const k of Object.keys(MODOS_ALVO)) box.append(el('button', { class: 'btn mini', type: 'button', 'data-modo': k, title: `ESPAÇO marca: ${MODOS_ALVO[k]}`, onclick: () => { G.save.modoAlvo = k; G.alvo = null; G.uiSujo = true; log(`🎯 Espaço agora marca: ${MODOS_ALVO[k].toUpperCase()} (tecla V troca).`, 'l-info'); atualizaBotaoAlvo(); } }, NOMES_ALVO[k] || k));
    lista.before(box);
  }
  const atual = G.save.modoAlvo || 'perto';
  box.querySelectorAll('button').forEach(b => b.classList.toggle('ativo', b.dataset.modo === atual));
  const velho = document.getElementById('btnAlvo'); if (velho) velho.remove(); // o botão antigo da barra de ações sai
}
function alvoMaisProximo() {
  const p = G.p; const vis = ordenaAlvos(G.mons.filter(m => !m.d.treino && dist(m, p) < 8 && naTela(m)));
  if (!vis.length) { const t = G.mons.filter(m => m.d.treino && dist(m, p) < 6 && naTela(m)).sort((a, b) => dist(a, p) - dist(b, p)); if (t.length) { G.alvo = t[0]; G.uiSujo = true; } return; }
  const i = vis.indexOf(G.alvo); G.alvo = vis[(i + 1) % vis.length]; G.uiSujo = true;
}
function instalaEntrada() {
  window.addEventListener('keydown', ev => {
    if (!G.rodando) return;
    const tag = (ev.target.tagName || '').toLowerCase(); if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if (ev.key === 'Escape') { if (!$('#modal').hidden) { if (!$('#modal .fechar').hidden) fechaModal(); } else { G.alvo = null; G.caminho = null; G.uiSujo = true; } return; }
    if (G.pausado) { if (window.teclaModal) window.teclaModal(ev); return; }
    if (ev.key in TECLA_DIR) { ev.preventDefault(); G.teclas.add(TECLA_DIR[ev.key]); return; }
    if (ev.key === 'e' || ev.key === 'E' || ev.key === 'Enter') { ev.preventDefault(); interagir(); return; }
    if (ev.key === 'Tab' && ev.shiftKey) { ev.preventDefault(); alvoAnterior(); return; }
    if (ev.key === ' ' || ev.key === 'Tab') { ev.preventDefault(); alvoMaisProximo(); return; }
    const k = ev.key.toLowerCase();
    const atalho = { v: trocaModoAlvo, x: trocaModo, i: () => abreAba('mochila'), q: usarClasse, f: () => bebeMelhor('hp'), r: () => bebeMelhor('foco'), g: alternaCaca, c: abreFicha, m: modalMapa, j: modalMissoes, t: () => abrirTime(), h: modalAtalhos, b: modalAlbum, u: () => (typeof abrirCarreira === 'function' ? abrirCarreira() : null), k: () => abreAba('skills'), l: () => abreAba('batalha') }[k];
    if (atalho && !ev.ctrlKey && !ev.metaKey && !ev.altKey) { ev.preventDefault(); atalho(); return; }
    if (ev.key === '+' || ev.key === '=') { mudaZoom(-1.5); return; }
    if (ev.key === '-' || ev.key === '_') { mudaZoom(1.5); return; }
    const slot = slotDaTecla(ev); if (slot >= 0) { ev.preventDefault(); usarHotbar(slot); return; }
  });
  window.addEventListener('keyup', ev => { if (ev.key in TECLA_DIR) G.teclas.delete(TECLA_DIR[ev.key]); });
  window.addEventListener('blur', () => G.teclas.clear());
  CV.addEventListener('mousedown', ev => { if (ev.button === 0 || ev.button === 2) cliqueTela(ev); });
  CV.addEventListener('contextmenu', ev => ev.preventDefault());
  CV.addEventListener('wheel', ev => { if (!G.rodando) return; ev.preventDefault(); mudaZoom(ev.deltaY > 0 ? 1 : -1); }, { passive: false });
  CV.addEventListener('mousemove', ev => { if (!G.rodando) return; const w = mundoDoMouse(ev); const e = entNoPonto(w); G.mouse = { ...w, ent: e }; CV.style.cursor = e ? (e.hp !== undefined ? 'crosshair' : 'pointer') : 'default'; });
  CV.addEventListener('mouseleave', () => { G.mouse = null; });
  const joy = $('#joy');
  if (joy) {
    const base = joy.querySelector('.joy-base'), bot = joy.querySelector('.joy-bot');
    const mv = t => { const r = base.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; let dx = (t.clientX - cx) / (r.width / 2), dy = (t.clientY - cy) / (r.height / 2); const d = Math.hypot(dx, dy); if (d > 1) { dx /= d; dy /= d; } G.joy = d < 0.15 ? null : { x: dx, y: dy }; bot.style.transform = `translate(${dx * 30}px, ${dy * 30}px)`; };
    joy.addEventListener('touchstart', e => { e.preventDefault(); mv(e.touches[0]); }, { passive: false });
    joy.addEventListener('touchmove', e => { e.preventDefault(); mv(e.touches[0]); }, { passive: false });
    const fim = () => { G.joy = null; bot.style.transform = ''; }; joy.addEventListener('touchend', fim); joy.addEventListener('touchcancel', fim);
  }
  $('#tFalar').addEventListener('click', interagir);
  $('#tAlvo').addEventListener('click', alvoMaisProximo);
  window.addEventListener('resize', () => { if (G.rodando) ajustaCanvas(); });
}
function mudaZoom(d) { G.zoomVis = clamp((G.zoomVis || 15.5) + d, 9, 22); }
function alvoAnterior() {
  const p = G.p; const vis = ordenaAlvos(G.mons.filter(m => !m.d.treino && dist(m, p) < 8 && naTela(m))); if (!vis.length) return;
  const i = vis.indexOf(G.alvo); G.alvo = vis[(i - 1 + vis.length) % vis.length]; G.uiSujo = true;
}
function trocaModo() { G.modo = G.modo === 'drible' ? 'chute' : 'drible'; log(G.modo === 'drible' ? 'Modo DRIBLE: ataca colado no adversário (treina Drible).' : 'Modo CHUTE: ataca de longe (treina Chute).', 'l-info'); G.uiSujo = true; }
// 20 atalhos: fileira de números do teclado = 1..0 (0-9); teclado numérico = N1..N0 (10-19)
const HOTBAR_N = 20;
function slotDaTecla(ev) {
  let m = /^Digit(\d)$/.exec(ev.code || ''); if (m) return (+m[1] + 9) % 10;
  m = /^Numpad(\d)$/.exec(ev.code || ''); if (m) return 10 + (+m[1] + 9) % 10;
  const n = '1234567890'.indexOf(ev.key); return ev.code ? -1 : n; // navegadores sem ev.code
}
function teclaSlot(i) { return i < 10 ? String((i + 1) % 10) : 'N' + ((i - 9) % 10); }
function usarHotbar(i) { const h = G.save.hotbar[i]; if (!h) return; if (h.t === 'd') usarDrible(h.id); else usarItem(h.id); }

/* ---------------- som ---------------- */
let AC = null;
function somNota(freq, dur) {
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const t = AC.currentTime; const o = AC.createOscillator(), g = AC.createGain(); o.connect(g); g.connect(AC.destination); o.type = 'triangle'; o.frequency.setValueAtTime(freq, t); g.gain.setValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.start(t); o.stop(t + dur + 0.02); } catch { }
}
function som(tipo) {
  if (!G.somOn) return;
  if (tipo === 'raro') { [0, 90, 180, 300].forEach((d, i) => setTimeout(() => somNota(['triangle', 660, 880, 1046, 1318][i + 1], 0.14), d)); return; }
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const t = AC.currentTime; const o = AC.createOscillator(), g = AC.createGain(); o.connect(g); g.connect(AC.destination);
    const conf = {
      toque: ['triangle', 330, 220, 0.07, 0.07], chute: ['triangle', 420, 160, 0.09, 0.09], ai: ['sawtooth', 180, 100, 0.09, 0.06],
      moeda: ['square', 988, 1318, 0.12, 0.06], nivel: ['triangle', 523, 1046, 0.45, 0.12], skill: ['triangle', 660, 990, 0.2, 0.08],
      cura: ['sine', 440, 880, 0.25, 0.1], gole: ['sine', 300, 520, 0.12, 0.1], equip: ['triangle', 500, 700, 0.1, 0.07],
      erro: ['square', 160, 120, 0.12, 0.05], morte: ['sawtooth', 300, 70, 0.7, 0.1], gol: ['triangle', 392, 784, 0.6, 0.14], apito: ['sine', 2200, 2000, 0.3, 0.05], porta: ['sine', 260, 180, 0.12, 0.06],
    }[tipo] || ['sine', 440, 440, 0.05, 0.05];
    o.type = conf[0]; o.frequency.setValueAtTime(conf[1], t); o.frequency.exponentialRampToValueAtTime(conf[2], t + conf[3]);
    g.gain.setValueAtTime(conf[4], t); g.gain.exponentialRampToValueAtTime(0.001, t + conf[3]);
    o.start(t); o.stop(t + conf[3] + 0.02);
  } catch { }
}

/* ---------------- início ---------------- */
// save de versão antiga (ou estragado): completa o que falta e tira o que não existe mais, sem mexer no resto
function normalizaSave(s) {
  const pad = novoSave({ nome: s.nome || 'Craque', corpo: s.corpo || 'm', pele: 'pele-morena', cabelo: 'cabelo-curto', corCabelo: 'original', roupa: 'roupa-camiseta', baixo: 'baixo-shorts', rosto: null, classe: CLASSES[s.classe] ? s.classe : null });
  const obj = v => v && typeof v === 'object' && !Array.isArray(v);
  for (const k of ['look', 'sk', 'equip', 'flags', 'quests', 'kills', 'figs', 'dicas', 'atr']) if (!obj(s[k])) s[k] = pad[k];
  for (const k of ['sk', 'equip']) for (const [kk, v] of Object.entries(pad[k])) if (!(kk in s[k])) s[k][kk] = v;
  for (const k of ['mochila', 'dribles']) if (!Array.isArray(s[k])) s[k] = pad[k];
  if (!Array.isArray(s.hotbar)) s.hotbar = pad.hotbar;
  while (s.hotbar.length < 10) s.hotbar.push(null);
  for (const k of ['nivel', 'xp', 'ouro', 'hp', 'foco', 'dia', 'hora']) if (!Number.isFinite(s[k])) s[k] = pad[k];
  if (s.nivel < 1) s.nivel = 1; if (s.ouro < 0) s.ouro = 0; if (s.foco < 0) s.foco = 0;
  if (s.classe && !CLASSES[s.classe]) s.classe = null;
  s.mochila = s.mochila.filter(i => i && ITENS[i.id] && Number.isFinite(i.q) && i.q > 0);
  { const vistos = new Set(); s.mochila = s.mochila.filter(i => ITENS[i.id].tipo !== 'chave' || (!vistos.has(i.id) && vistos.add(i.id))); } // itens únicos repetidos (ex.: várias Bolas de Ouro)
  for (const [slot, id] of Object.entries(s.equip)) if (id && !ITENS[id]) s.equip[slot] = pad.equip[slot] || null;
  s.dribles = s.dribles.filter(id => DRIBLES[id]);
  s.hotbar = s.hotbar.map(h => !h || (h.t === 'i' && !ITENS[h.id]) || (h.t === 'd' && !DRIBLES[h.id]) ? null : h);
  if (!Number.isFinite(s.x) || !Number.isFinite(s.y)) { s.x = undefined; s.y = undefined; }
  return s;
}
async function iniciarJogo(save) {
  normalizaSave(save);
  G.save = save;
  save.st = Object.assign({ mortes: 0, gols: 0, quiz: 0, prof: 0, tempo: 0, chefes: 0, abates: 0 }, save.st);
  save.dicas = save.dicas || {}; if (save.tut == null) save.tut = 99;
  if (save.xp < xpPara(save.nivel)) save.xp = xpPara(save.nivel);
  await telaCarregando(save);
  $('#inicio').hidden = true; $('#app').hidden = false;
  CV = $('#cv'); CTX = CV.getContext('2d');
  if (!G.entradaOk) { instalaEntrada(); G.entradaOk = true; requestAnimationFrame(loop); }
  G.p = null;
  if (!MAPAS_DEF[save.mapa] && /^casa_/.test(save.mapa || '') && typeof garanteTodasAsCasas === 'function') garanteTodasAsCasas(); // salvou dentro de casa
  const mapa = MAPAS_DEF[save.mapa] ? save.mapa : 'vila';
  ajustaCanvas();
  entrarMapa(mapa, save.x, save.y, true);
  if (colide(G.p.x, G.p.y, R_ENT)) { const r = G.mapa.renasce || G.mapa.inicio; G.p.x = r.x + 0.5; G.p.y = r.y + 0.5; }
  const st = stats(); if (save.hp <= 0) save.hp = st.maxHp;
  G.rodando = true;
  if (!save.atr) save.atr = { defesa: 5, habilidade: 5, inteligencia: 5, folego: 5 };
  if (save.pontos == null) save.pontos = 0;
  atualizaRetrato(); montaPaineis(); atualizaPaineis(); atualizaBotaoAlvo();
  if (!save.classe) setTimeout(() => modalEscolheClasse(true), 600);
  if (save.tut === 0) { banner('Lenda do Campinho', 'Dia 1 — um novo craque nasceu!'); log('Bem-vindo(a) ao Lenda do Campinho! Siga as dicas no canto da tela e a seta amarela.', 'l-lvl'); }
  else { banner(G.mapa.nome, `Dia ${save.dia}`); log(`Bem-vindo(a) de volta, ${save.nome}!`, 'l-sis'); }
}
