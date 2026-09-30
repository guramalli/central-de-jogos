/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🎮 FUTEBOL DE VIDEOGAME NOS LANCES DA CARREIRA (v284)
   Os lances não são mais "bater no adversário até ele cair": é futebol de verdade,
   com os bonecos do jogo, uma BOLA com física e jogadores com cabeça:
   - você conduz a bola no pé (ela vai para onde você anda);
   - ⚽ CHUTAR (Espaço ou X) · 🎯 PASSAR (C ou E; sem a bola = PEDIR a bola) · 🌀 DRIBLAR (F: a finta deixa o marcador sem equilíbrio);
     na defesa, CHUTAR vira 🦶 DESARMAR (dar o bote no atacante);
   - o marcador aperta e tenta roubar, o outro fecha o espaço, o companheiro se desmarca, toca e chuta,
     o goleiro acompanha a bola e se atira no canto (pode dar REBOTE!);
   - PÊNALTI: escolha o canto (alto, meio, baixo) e o goleiro tenta adivinhar;
   - seus atributos contam (drible, chute, defesa) e a dificuldade sobe com a divisão do clube.
   Carregar DEPOIS de carreira_jogos.js.
   ============================================================ */
const FUT = { x0: 5.05, x1: 34.95, y0: 5.1, y1: 21.9, gy0: 12.15, gy1: 14.85, gx: 34.95, gxN: 5.05, cy: 13.5 };
const FUT_NOMES_EXTRA = ['Tuca', 'Bebel', 'Didi', 'Zico Jr.', 'Pipoca', 'Bolinha', 'Foguete', 'Tatu', 'Gordo', 'Magrão'];
let FUT_UID = 900000;

function futSkill(k) { const s = stats(), exp = 12 + (G.save.nivel || 1) * 0.25; const v = s[k] || 10; return v / (v + exp); } // v295: ~0,45 para quem treina normal (antes o nível alto derrubava para ~0,3)
function futDif() { const t = cjTemp(); return t ? t.tier : 1; }
// um ator (jogador de mentira): usa o desenho de boneco do jogo, sem IA de adversário
function futAtor(nome, look, time, papel, x, y) {
  const d = { nome, look: Object.assign({ tipo: 'humano', corpo: 'm' }, look), treino: true, fut: true, nivel: G.save.nivel, hp: 1, falas: [] };
  const m = { uid: ++FUT_UID, tipo: 'fut_' + papel, d, x: x + 0.5, y: y + 0.5, flip: time === 'eles', fase: 0, mov: false, hp: 1, sp: { x, y, raio: 0, cj: true }, cdAtk: 1e15, cdRng: 1e15, prox: 1e15, bravo: false, r: R_ENT, fut: true, time, papel, dir: { x: time === 'eles' ? -1 : 1, y: 0 }, vista: 'lado', tVista: G.agora, tonto: 0 };
  G.mons.push(m); return m;
}
function futLook(time, pos, k) {
  const J = G.jogoC, T0 = time === 'nos' ? J.t.times[0] : J.adv;
  const peles = ['pele-clara', 'pele-media', 'pele-morena', 'pele-negra', 'pele-retinta'], cab = ['cabelo-curto', 'cabelo-cacheado', 'cabelo-curto', 'cabelo-black-power'];
  const h = hashTxt(T0.nome + pos + k) >>> 0;
  const lk = { pele: peles[h % 5], cabelo: cab[(h >> 3) % 4], corCabelo: ['preto', 'castanho', 'loiro', 'preto'][(h >> 5) % 4], roupa: 'roupa-futebol', corRoupa: pos === 'GOL' ? (time === 'nos' ? '#e8c020' : '#2a2a2a') : T0.cor1, cor2: T0.cor2, baixo: 'baixo-shorts' };
  try { const g = pos === 'GOL' ? 'goleiro' : pos === 'ZAG' ? 'grande' : 'jogador'; const l = GRUPOS_CORPO[g].m.filter(f => META_BONECOS[f]); if (l.length) lk.folha = l[h % l.length]; } catch (e) { }
  return lk;
}
function futNome(time, k) {
  const J = G.jogoC, P = CJ_NOMES[J.t.pais] || CJ_NOMES.brasil, T0 = time === 'nos' ? J.t.times[0] : J.adv;
  if (k === 0) return T0.craque.nome;
  const l = P.jog.concat(FUT_NOMES_EXTRA); return l[(hashTxt(T0.nome + k) >>> 0) % l.length];
}

/* ---------- movimento livre durante o lance ----------
   O jogo anda em QUADRADINHOS (grade.js, igual ao Tibia) e cada quadrado comporta uma criatura: no futebol isso travava
   você atrás do marcador. Durante o lance o movimento fica LIVRE (corrida contínua) e volta ao normal quando o lance acaba. */
function futGradeLivre(on) {
  if (typeof GRADE === 'undefined') return;
  if (on) { if (G._gradeAntes == null) G._gradeAntes = GRADE.on; GRADE.on = false; }
  else if (G._gradeAntes != null) { GRADE.on = G._gradeAntes; G._gradeAntes = null; }
  if (G.p) { delete G.p.pas; G.p.fila = null; G.p.dirDesde = 0; } G.caminho = null;
}

// o jogo afasta você de qualquer criatura encostada (separa): no futebol o marcador cola em você e isso te empurrava para trás
{ const _separaFut = separa; separa = function (e) { if (G.fut && (e === G.p || (e && e.fut))) return; return _separaFut.apply(this, arguments); }; }

/* ---------- montar o lance ---------- */
function futComeca(L) {
  const J = G.jogoC, tier = futDif();
  G.mons = G.mons.filter(m => !m.fut && !(m.d && m.d.cj)); G.alvo = null; G.caminho = null; G.acaoChegar = null; G.projs = [];
  const poeP = (x, y) => { G.p.x = x + 0.5; G.p.y = y + 0.5; G.p.mov = false; G.p.flip = false; G.p.vista = 'lado'; G.p.tVista = G.agora; };
  const st = stats(); G.save.hp = st.maxHp;
  futGradeLivre(true);
  const F = G.fut = { tipo: L.tipo, L, t0: G.agora, fim: G.agora + ({ ataque: 26, passe: 26, defesa: 22, penalti: 60 })[L.tipo] * 1000, atores: [], bola: { x: 0, y: 0, vx: 0, vy: 0, z: 0, vz: 0, dono: null, giro: 0, livreDe: null, livreAte: 0, chute: null }, dirP: { x: 1, y: 0 }, pAnt: { x: 0, y: 0 }, fintaAte: 0, fintaCd: 0, boteCd: 0, tontoP: 0, acabou: null, perdeuAte: 0, passeDe: null, msgAte: 0 };
  const add = (nome, time, papel, pos, k, x, y) => { const a = futAtor(nome, futLook(time, pos, k), time, papel, x, y); F.atores.push(a); return a; };
  const vel = velJogador();
  F.vP = vel;
  if (L.tipo === 'ataque' || L.tipo === 'passe') {
    const px = L.tipo === 'ataque' ? 16 : 12;
    poeP(px, 13);
    F.comp = add(futNome('nos', 0), 'nos', 'comp', 'ATA', 0, L.tipo === 'ataque' ? 18 : 17, 9);
    const defs = [[24, 12], [26, 16], [22, 9]].slice(0, tier >= 8 ? 3 : 2);
    defs.forEach(([x, y], i) => add(futNome('eles', i + 1), 'eles', i === 0 ? 'marca' : 'cobre', i ? 'VOL' : 'ZAG', i + 1, x, y));
    F.golEles = add(futNome('eles', 9), 'eles', 'gol', 'GOL', 9, 33, 13);
    F.bola.dono = 'p';
  } else if (L.tipo === 'defesa') {
    poeP(14, 13);
    const a1 = add(futNome('eles', 0), 'eles', 'ataca', 'ATA', 0, 24, 13), a2 = add(futNome('eles', 2), 'eles', 'apoio', 'MEI', 2, 23, 9);
    if (tier >= 7) add(futNome('eles', 3), 'eles', 'apoio', 'ATA', 3, 22, 17);
    F.comp = add(futNome('nos', 1), 'nos', 'zaga', 'ZAG', 1, 10, 16);
    F.golNos = add(futNome('nos', 9), 'nos', 'gol', 'GOL', 9, 5, 13);
    F.bola.dono = a1; a1.dir = { x: -1, y: 0 };
  } else { // pênalti
    poeP(28, 13); G.p.flip = false;
    F.golEles = add(futNome('eles', 9), 'eles', 'gol', 'GOL', 9, 34, 13); F.golEles.x = 34.2;
    F.bola.dono = null; F.bola.x = 29.6; F.bola.y = 13.55;
    F.penalti = { fase: 'mira' };
  }
  for (const a of F.atores) if (a.papel === 'gol') { a.y = FUT.cy; }
  futBola(); futBotoes(); J._tp = 0;
}
function futAtualizaBolaDono() {
  const F = G.fut, b = F.bola; const o = b.dono === 'p' ? G.p : b.dono; if (!o) return;
  const d = b.dono === 'p' ? F.dirP : o.dir; const n = Math.hypot(d.x, d.y) || 1;
  const tx = o.x + d.x / n * 0.36, ty = o.y + d.y / n * 0.22 + 0.04;
  b.x += (tx - b.x) * 0.5; b.y += (ty - b.y) * 0.5; b.vx = 0; b.vy = 0; b.z = 0; b.vz = 0;
  if (o.mov || (b.dono === 'p' && G.p.mov)) b.giro += 0.35;
}
function futBola() { const F = G.fut, b = F.bola; if (b.dono) { const o = b.dono === 'p' ? G.p : b.dono; b.x = o.x + (b.dono === 'p' ? 0.36 : o.dir.x * 0.36); b.y = o.y + 0.04; } }

/* ---------- ações ---------- */
function futTemBola() { return G.fut && G.fut.bola.dono === 'p'; }
function futChutaPara(de, alvoX, alvoY, vel, alto) {
  const F = G.fut, b = F.bola;
  const dx = alvoX - b.x, dy = alvoY - b.y, n = Math.hypot(dx, dy) || 1;
  b.dono = null; b.vx = dx / n * vel; b.vy = dy / n * vel; b.vz = alto ? 4 + Math.random() * 2 : 1.2; b.z = 0.05;
  b.livreDe = de; b.livreAte = G.agora + 320;
}
function futChutar() {
  const F = G.fut; if (!F || F.acabou) return;
  if (F.tipo === 'penalti') return futPenaltiBate(0);
  if (F.tipo === 'defesa' || !futTemBola()) return futBote();
  const b = F.bola, gk = F.golEles, tier = futDif();
  const dist = Math.hypot(FUT.gx - b.x, FUT.cy - b.y);
  // mira no canto longe do goleiro; o erro depende do chute e da distância
  const canto = gk && gk.y < FUT.cy ? 14.3 : gk && gk.y > FUT.cy ? 12.7 : (Math.random() < 0.5 ? 12.7 : 14.3); // v295: mira mais para dentro da trave
  const q = futSkill('chute');
  const erro = (0.5 - q * 0.4 + Math.max(0, dist - 10) * 0.06) * (Math.random() * 2 - 1); // v295: antes 0.72 − q·0.5 (+ de longe)
  let alvoY = canto + erro;
  const forca = dist > 17 ? 11 : 16;
  // o goleiro vai conseguir? (decidido na hora do chute, o desenho acompanha)
  const noGol = alvoY > FUT.gy0 + 0.05 && alvoY < FUT.gy1 - 0.05;
  let res = noGol ? 'gol' : 'fora';
  if (noGol && gk) {
    const alcance = 1.05 + tier * 0.02, reacao = Math.abs(alvoY - gk.y);
    let p = (0.32 + tier * 0.012) + (dist > 14 ? 0.22 : dist > 10 ? 0.1 : dist < 6 ? -0.12 : 0) - q * 0.25; // v295: goleiro menos paredão (antes 0.6 + tier·0.02)
    if (reacao > alcance) p *= 0.55;
    if (Math.random() < Math.max(0.05, Math.min(0.85, p))) res = Math.random() < 0.7 ? 'defesa' : 'rebote';
  }
  futChutaPara('p', FUT.gx + 1.5, alvoY, forca, dist > 12);
  b.chute = { res, alvoY, de: 'p' };
  som('chute'); G.p.golpe = G.agora; G.p.vista = 'lado'; G.p.tVista = G.agora; if (typeof treinaSkill === 'function') treinaSkill('chute', 1);
  futMsg(dist > 20 ? 'De longe!' : 'Chutou!');
}
function futPassar() {
  const F = G.fut; if (!F || F.acabou || F.tipo === 'penalti') return;
  const b = F.bola;
  if (b.dono === 'p') {
    const c = F.comp; if (!c) return;
    const lead = 1.2;
    futChutaPara('p', c.x + (F.tipo === 'defesa' ? -0.5 : lead), c.y, 12.5, false); b.chute = null; b.passeDe = 'p';
    c.esperaPasse = G.agora + 1500; som('toque'); G.p.golpe = G.agora; futMsg('Tocou!');
    if (typeof treinaSkill === 'function') treinaSkill('visao', 1);
  } else if (b.dono && b.dono.time === 'nos' && b.dono.papel !== 'gol') { // pedir a bola
    b.dono.pedido = G.agora; futMsg('Toca aqui!', b.dono);
  }
}
function futDriblar() {
  const F = G.fut; if (!F || F.acabou || F.tipo === 'penalti') return;
  if (G.agora < F.fintaCd) return; F.fintaCd = G.agora + 1100; // v292: 1600 → 1100
  if (!futTemBola()) return;
  const perto = F.atores.filter(a => a.time === 'eles' && a.papel !== 'gol' && Math.hypot(a.x - G.p.x, a.y - G.p.y) < 2.3);
  F.fintaAte = G.agora + 800; G.p.golpe = G.agora;
  if (typeof efeito === 'function') efeito('aura', G.p.x, G.p.y, '#ffd23f');
  if (!perto.length) { futMsg('Firula!'); return; }
  const q = futSkill('drible'), tier = futDif();
  for (const a of perto) {
    if (Math.random() < 0.58 + q * 0.45 - tier * 0.008) { a.tonto = G.agora + 1600; texto(a, 'Caiu na finta!', '#ffe14a', 900); efeito('estrelas', a.x, a.y, '#ffe14a'); }
    else texto(a, 'Não caiu!', '#ff9a8a', 800);
  }
  som('toque'); if (typeof treinaSkill === 'function') treinaSkill('drible', 1);
}
function futBote() {
  const F = G.fut; if (!F || F.acabou) return;
  if (G.agora < F.boteCd || G.agora < F.tontoP) return; F.boteCd = G.agora + 900;
  const b = F.bola, dono = b.dono;
  G.p.golpe = G.agora;
  if (!dono || dono === 'p' || dono.time !== 'eles' || dono.papel === 'gol') {
    // bola solta perto: dá um chutão pra frente
    if (!dono && Math.hypot(b.x - G.p.x, b.y - G.p.y) < 1.1) { futChutaPara('p', b.x + 8, b.y + (Math.random() * 4 - 2), 12, true); futMsg('Chutão!'); som('chute'); }
    return;
  }
  const d = Math.hypot(dono.x - G.p.x, dono.y - G.p.y); if (d > 1.6) { futMsg('Longe demais!'); return; }
  const q = futSkill('defesa'), tier = futDif();
  if (Math.random() < 0.58 + q * 0.35 - tier * 0.008) { // v292: antes 0.5 + q·0.4 − tier·0.012
    b.dono = null; futChutaPara('p', b.x + (F.tipo === 'defesa' ? 3 : 2), b.y + (Math.random() * 2 - 1), 5, false); b.livreAte = G.agora + 120;
    dono.tonto = G.agora + 900; texto(dono, 'Desarmado!', '#9ad0ff', 900); efeito('escudo', G.p.x, G.p.y, '#7ab8ff'); som('toque');
    if (typeof treinaSkill === 'function') treinaSkill('defesa', 1);
  } else { F.tontoP = G.agora + 650; texto(G.p, 'Passou direto!', '#ff9a8a', 800); som('erro'); }
}
function futMsg(txt, quem) { try { texto(quem || G.p, txt, '#ffffff', 700); } catch (e) { } }

/* ---------- pênalti ---------- */
function futPenaltiBate(dir) { // dir: -1 alto, 0 meio, 1 baixo
  const F = G.fut; if (!F || F.tipo !== 'penalti' || F.penalti.fase !== 'mira') return;
  F.penalti.fase = 'voo';
  const q = futSkill('chute'), tier = futDif();
  const erro = (0.55 - q * 0.45) * (Math.random() * 2 - 1);
  const alvoY = FUT.cy + dir * 1.05 + erro;
  const gDir = Math.random() < 0.34 ? 0 : Math.random() < 0.5 ? -1 : 1; // o goleiro escolhe um canto
  const noGol = alvoY > FUT.gy0 + 0.05 && alvoY < FUT.gy1 - 0.05;
  let res = noGol ? 'gol' : 'fora';
  if (noGol && gDir === dir) res = Math.random() < (dir === 0 ? 0.8 : 0.55 + tier * 0.015) ? 'defesa' : 'gol';
  F.penalti.gDir = gDir;
  G.p.x = 28.9; futChutaPara('p', FUT.gx + 1.5, alvoY, 15, dir === -1); F.bola.chute = { res, alvoY, de: 'p', penalti: true };
  som('chute'); G.p.golpe = G.agora; futBotoes();
}

/* ---------- a cabeça dos jogadores ---------- */
function futAnda(a, tx, ty, v, dt) {
  const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
  if (d < 0.05) { a.mov = false; return; }
  const passo = Math.min(d, v * dt);
  a.x += dx / d * passo; a.y += dy / d * passo;
  a.x = Math.max(FUT.x0 + 0.2, Math.min(FUT.x1 - 0.2, a.x)); a.y = Math.max(FUT.y0 + 0.2, Math.min(FUT.y1 - 0.2, a.y));
  a.mov = passo > 0.002; a.fase += passo * 7; if (Math.abs(dx) > 0.02) a.flip = dx < 0;
  a.dir = { x: dx / d, y: dy / d }; olha(a, dx, dy);
}
function futAlvoGol(time) { return time === 'nos' ? { x: FUT.gx, y: FUT.cy } : { x: FUT.gxN, y: FUT.cy }; }
function futCaminhoLivre(de, para, time) { // ninguém do outro time no caminho do passe
  const F = G.fut; const vx = para.x - de.x, vy = para.y - de.y, L = Math.hypot(vx, vy) || 1;
  return !F.atores.some(a => a.time !== time && a.papel !== 'gol' && (() => { const t = ((a.x - de.x) * vx + (a.y - de.y) * vy) / (L * L); if (t < 0.05 || t > 0.95) return false; const px = de.x + vx * t, py = de.y + vy * t; return Math.hypot(a.x - px, a.y - py) < 0.8; })());
}
function futIA(dt) {
  const F = G.fut, b = F.bola, p = G.p, tier = futDif(), v = F.vP, agora = G.agora;
  const dono = b.dono, pos = dono === 'p' ? p : dono;
  for (const a of F.atores) {
    if (a.tonto > agora) { a.mov = false; continue; }
    const vel = v * (a.papel === 'gol' ? 0.7 : a.time === 'eles' ? 0.74 + tier * 0.004 : 0.86); // v292: marcadores mais lentos (antes 0.8 + tier·0.008 ≈ 89% da sua velocidade)
    const temBola = dono === a;
    if (a.papel === 'gol') {
      const linha = a.time === 'eles' ? 34.1 : 5.9;
      let ty = Math.max(12.3, Math.min(14.7, b.y));
      if (b.chute && a.time === 'eles' && b.chute.de !== 'eles') ty = b.chute.res === 'gol' ? a.y + (b.chute.alvoY > a.y ? 0.35 : -0.35) : b.chute.alvoY; // se atira
      if (b.chute && a.time === 'nos' && b.chute.de === 'eles') ty = b.chute.res === 'gol' ? a.y : b.chute.alvoY;
      if (F.penalti && F.penalti.gDir != null && F.penalti.fase === 'voo') ty = FUT.cy + F.penalti.gDir * 1.05;
      futAnda(a, linha, ty, b.chute ? vel * 2.2 : vel, dt);
      if (temBola && agora > (a.segura || 0)) { // goleiro repõe: acabou o lance
        a.segura = agora + 1e9;
      }
      continue;
    }
    if (temBola) {
      // com a bola: vai para o gol; apertado, toca; perto, chuta
      const g = futAlvoGol(a.time), dg = Math.hypot(g.x - a.x, g.y - a.y);
      const perto = (a.time === 'eles' ? [p, ...F.atores.filter(o => o.time === 'nos' && o.papel !== 'gol')] : F.atores.filter(o => o.time === 'eles' && o.papel !== 'gol')).some(o => Math.hypot(o.x - a.x, o.y - a.y) < 1.4);
      const parceiros = a.time === 'nos' ? [p] : F.atores.filter(o => o.time === 'eles' && o !== a && o.papel !== 'gol');
      if (a.time === 'nos' && a.pedido && agora - a.pedido < 1200 && futCaminhoLivre(a, p, 'nos')) { a.pedido = 0; futChutaPara(a, p.x + F.dirP.x * 0.6, p.y, 12.5, false); b.passeDe = a; futMsg('Toma!', a); continue; }
      if (dg < 8.5 && (Math.random() < 1.6 * dt || dg < 5)) { futChutaIA(a); continue; }
      if (perto && Math.random() < 2.2 * dt) { const par = parceiros.filter(o => futCaminhoLivre(a, o, a.time)).sort((x, y) => Math.hypot(g.x - x.x, g.y - x.y) - Math.hypot(g.x - y.x, g.y - y.y))[0]; if (par) { futChutaPara(a, par.x + (a.time === 'nos' ? 0.8 : -0.8), par.y, 12, false); b.passeDe = a; futMsg('Toca!', a); continue; } }
      futAnda(a, g.x + (a.time === 'nos' ? -3 : 3), g.y + Math.sin(agora / 700 + a.uid) * 2, vel * 0.92, dt);
      continue;
    }
    if (a.time === 'nos') {
      // companheiro: se desmarca na frente (ataque) ou fecha a entrada da área (defesa)
      if (F.tipo === 'defesa') {
        const alvo = dono && dono !== 'p' && dono.time === 'eles' ? dono : b; futAnda(a, Math.max(7, alvo.x - 1.5), alvo.y + (a.y > alvo.y ? 0.8 : -0.8), vel, dt);
        if (!dono && Math.hypot(b.x - a.x, b.y - a.y) < 3) futAnda(a, b.x, b.y, vel, dt);
      } else if (!dono || dono === 'p') {
        if (!dono && Math.hypot(b.x - a.x, b.y - a.y) < 2.8 && b.livreDe !== a) futAnda(a, b.x, b.y, vel, dt);
        else { const ax = Math.min(31, Math.max(p.x + 3.5, 20)), ay = p.y < FUT.cy ? 16.5 : 10.5; futAnda(a, ax, ay + Math.sin(agora / 900) * 1.2, vel * (a.esperaPasse > agora ? 1.1 : 0.9), dt); }
      } else futAnda(a, a.x + 0.3, a.y, vel * 0.5, dt);
    } else {
      // adversário sem a bola
      if (F.tipo === 'defesa') { // eles atacam: quem não tem a bola se oferece
        if (!dono && Math.hypot(b.x - a.x, b.y - a.y) < 3.5) futAnda(a, b.x, b.y, vel, dt);
        else futAnda(a, Math.max(9, (pos ? pos.x : b.x) - 2), a.papel === 'apoio' ? (a.y < FUT.cy ? 10 : 17) : FUT.cy, vel * 0.9, dt);
      } else if (a.papel === 'marca' || !dono || (pos && Math.hypot(pos.x - a.x, pos.y - a.y) < 2.2)) { // aperta quem tem a bola / vai na bola solta
        const alvo = pos || b; futAnda(a, alvo.x + 0.45, alvo.y, vel, dt);
      } else { // cobre: fica entre a bola e o gol
        const g = futAlvoGol('nos'); const bx = pos ? pos.x : b.x, by = pos ? pos.y : b.y;
        futAnda(a, bx + (g.x - bx) * 0.45, by + (g.y - by) * 0.45, vel * 0.85, dt);
      }
    }
  }
  // separa quem está muito perto (ninguém fica em cima do outro)
  const todos = F.atores.concat([p]);
  for (let i = 0; i < todos.length; i++) for (let j = i + 1; j < todos.length; j++) {
    const A = todos[i], B = todos[j]; const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy);
    if (d > 0 && d < 0.55) { const k = (0.55 - d) / 2 / d; if (A !== p) { A.x -= dx * k; A.y -= dy * k; } if (B !== p) { B.x += dx * k; B.y += dy * k; } }
  }
}
function futChutaIA(a) {
  const F = G.fut, b = F.bola, tier = futDif();
  const g = futAlvoGol(a.time), dist = Math.hypot(g.x - b.x, g.y - b.y);
  const q = a.time === 'eles' ? 0.45 + tier * 0.02 : 0.55;
  const canto = Math.random() < 0.5 ? 12.45 : 14.55, alvoY = canto + (0.9 - q * 0.6 + Math.max(0, dist - 7) * 0.06) * (Math.random() * 2 - 1);
  const noGol = alvoY > FUT.gy0 + 0.05 && alvoY < FUT.gy1 - 0.05;
  let res = noGol ? 'gol' : 'fora';
  const gk = a.time === 'nos' ? F.golEles : F.golNos;
  if (noGol && gk) { let p = a.time === 'eles' ? 0.42 - tier * 0.012 : 0.3 + tier * 0.02; if (Math.abs(alvoY - gk.y) > 0.9) p *= 0.4; if (Math.random() < p) res = Math.random() < 0.55 ? 'defesa' : 'rebote'; }
  futChutaPara(a, g.x + (a.time === 'nos' ? 1.5 : -1.5), alvoY, 14, dist > 10);
  b.chute = { res, alvoY, de: a.time === 'nos' ? 'comp' : 'eles', quem: a };
  a.golpe = G.agora; som('chute'); futMsg('Chutou!', a);
}

/* ---------- a bola ---------- */
function futFisica(dt) {
  const F = G.fut, b = F.bola, p = G.p, agora = G.agora;
  if (b.dono) { futAtualizaBolaDono(); return; }
  b.x += b.vx * dt; b.y += b.vy * dt; b.giro += Math.hypot(b.vx, b.vy) * dt * 2;
  const atr = Math.pow(0.42, dt); b.vx *= atr; b.vy *= atr;
  if (b.z > 0 || b.vz > 0) { b.z += b.vz * dt; b.vz -= 18 * dt; if (b.z <= 0) { b.z = 0; b.vz = Math.abs(b.vz) > 2.5 ? -b.vz * 0.35 : 0; } }
  // chute a gol: o goleiro decide na linha dele
  const c = b.chute;
  if (c) {
    const indoDeles = b.vx > 0, gk = indoDeles ? F.golEles : F.golNos, linha = indoDeles ? 33.7 : 6.3;
    if (gk && ((indoDeles && b.x >= linha) || (!indoDeles && b.x <= linha))) {
      if (c.res === 'defesa') { b.chute = null; b.dono = gk; gk.dir = { x: indoDeles ? -1 : 1, y: 0 }; futMsg('Que defesa!', gk); som('toque'); efeito('escudo', gk.x, gk.y, '#9ad0ff'); F.fimMotivo = 'defesa'; }
      else if (c.res === 'rebote') { b.chute = null; b.vx = -b.vx * 0.4; b.vy = (Math.random() * 2 - 1) * 3; b.vz = 2; b.livreDe = gk; b.livreAte = agora + 300; futMsg('Rebote!', gk); som('toque'); }
    }
  }
  // gol?
  if (b.x >= FUT.gx && b.y > FUT.gy0 && b.y < FUT.gy1) return futFimLance('golNos');
  if (b.x <= FUT.gxN && b.y > FUT.gy0 && b.y < FUT.gy1) return futFimLance('golEles');
  if (b.x > FUT.x1 + 0.3 || b.x < FUT.x0 - 0.3 || b.y < FUT.y0 - 0.2 || b.y > FUT.y1 + 0.2) return futFimLance('fora');
  // alguém domina a bola solta
  const rapida = Math.hypot(b.vx, b.vy) > 8.5 || b.z > 0.5; // chute forte/alto: quase ninguém segura no meio do caminho
  {
    const cand = [{ o: 'p', x: p.x, y: p.y, r: 0.5 }].concat(F.atores.filter(a => a.tonto <= agora && !(a.papel === 'gol' && b.chute && (b.chute.res === 'gol' || b.chute.res === 'fora')) && (!rapida || a.papel === 'gol' || (b.chute == null && a.time === 'nos') || Math.random() < 0.012)).map(a => ({ o: a, x: a.x, y: a.y, r: a.papel === 'gol' ? 0.75 : rapida ? 0.3 : 0.45 })));
    let melhor = null, md = 9;
    for (const k of cand) { if (b.livreDe === k.o && agora < b.livreAte) continue; if (k.o === 'p' && agora < F.tontoP) continue; const d = Math.hypot(b.x - k.x, b.y - k.y); if (d < k.r && d < md) { md = d; melhor = k.o; } }
    if (melhor) { b.dono = melhor; b.chute = null; b.vx = b.vy = 0; b.z = 0; if (melhor !== 'p') melhor.dir = { x: melhor.time === 'eles' ? -1 : 1, y: 0 }; if (melhor === 'p' && b.passeDe && b.passeDe !== 'p') futMsg('Dominou!'); }
  }
}
// roubada de bola: marcador colado em quem conduz
function futDisputa(dt) {
  const F = G.fut, b = F.bola, agora = G.agora, tier = futDif();
  if (!b.dono || (b.dono !== 'p' && b.dono.papel === 'gol')) return;
  const dono = b.dono === 'p' ? G.p : b.dono, timeDono = b.dono === 'p' ? 'nos' : b.dono.time;
  if (b.dono === 'p' && agora < F.fintaAte) return;
  const rivais = timeDono === 'nos' ? F.atores.filter(a => a.time === 'eles' && a.papel !== 'gol' && a.tonto <= agora) : [];
  for (const r of rivais) {
    const d = Math.hypot(r.x - dono.x, r.y - dono.y); if (d > 0.7 || agora < (r.boteEm || 0)) continue;
    // o bote: de tempos em tempos (não é contínuo) — quem corre e ginga escapa
    r.boteEm = agora + 1000; r.golpe = agora;
    const q = b.dono === 'p' ? futSkill('drible') : 0.5;
    const chance = Math.max(0.05, Math.min(0.4, 0.22 - q * 0.2 + tier * 0.005 + (b.dono === 'p' && G.p.mov ? 0 : 0.12))); // v295: antes (v292) 0.30 − q·0.25 + tier·0.006
    if (Math.random() < chance) { b.dono = r; r.dir = { x: -1, y: 0 }; texto(r, 'Roubou!', '#ff9a8a', 800); som('erro'); if (timeDono === 'nos') { F.perdeuAte = agora + 2500; if (b.dono && dono === G.p) setTimeout(() => { try { if (G.fut === F && !F.acabou) texto(G.p, 'Recupera! (ESPAÇO colado nele)', '#ffe14a', 1400); } catch (e) { } }, 250); } return; } // v295: 2,5 s para recuperar (antes o lance acabava em 0,7 s)
    else if (b.dono === 'p') { texto(r, 'Errou o bote!', '#ffe14a', 600); r.tonto = agora + 450; } // quem erra o bote fica um instante parado: dá para escapar
  }
}

/* ---------- fim do lance ---------- */
function futTick(dt) {
  const F = G.fut; if (!F) return;
  const agora = G.agora, s = dt / 1000, p = G.p;
  if (F.acabou) { // a bola ainda rola um pouquinho (entra na rede) e o lance acaba
    const b = F.bola; if (!b.dono) { b.x += b.vx * s * 0.5; b.y += b.vy * s * 0.5; b.vx *= 0.9; b.vy *= 0.9; b.x = Math.min(b.x, 36); b.x = Math.max(b.x, 4); }
    if (agora >= F.fimEm) { G.mons = G.mons.filter(m => !m.fut); G.fut = null; futGradeLivre(false); futBotoes(); cjFimLanceFut(F.res); }
    return;
  }
  G.alvo = null; // aqui é futebol: nada de atacar ninguém
  // para onde você está virado (a bola vai no seu pé)
  const mx = p.x - F.pAnt.x, my = p.y - F.pAnt.y; if (Math.hypot(mx, my) > 0.004) { const n = Math.hypot(mx, my); F.dirP = { x: mx / n, y: my / n }; }
  F.pAnt = { x: p.x, y: p.y };
  if (agora < F.tontoP) { p.x = F.pAnt.x; p.y = F.pAnt.y; }
  // o jogador não sai do campo
  p.x = Math.max(FUT.x0 + 0.2, Math.min(FUT.x1 - 0.3, p.x)); p.y = Math.max(FUT.y0 + 0.2, Math.min(FUT.y1 - 0.2, p.y));
  if (F.tipo === 'penalti') { futFisicaPenalti(s); return; }
  futIA(s); futDisputa(s); futFisica(s);
  if (F.acabou) return;
  const b = F.bola;
  // v295: CHUTE AUTOMÁTICO — chegou na área com a bola e não chutou em ~1 s: o seu jogador chuta sozinho
  if (F.tipo !== 'defesa' && b.dono === 'p' && Math.hypot(FUT.gx - p.x, FUT.cy - p.y) < 8.5) {
    if (!F.naArea) F.naArea = agora; else if (agora - F.naArea > 1000) { F.naArea = 0; futChutar(); futMsg('Chutou sozinho!'); if (F.acabou || !G.fut) return; }
  } else F.naArea = 0;
  // fim por posse
  if (F.tipo === 'defesa') {
    if (b.dono === 'p' || (b.dono && b.dono.time === 'nos')) return futFimLance('recuperou');
  } else {
    if (b.dono && b.dono.time === 'eles') { if (b.dono.papel === 'gol') return futFimLance(F.fimMotivo === 'defesa' ? 'defesa' : 'goleiro'); if (agora > F.perdeuAte) return futFimLance('perdeu'); }
  }
  if (agora >= F.fim) return futFimLance('tempo');
}
function futFisicaPenalti(s) {
  const F = G.fut, b = F.bola;
  if (F.penalti.fase === 'mira') { G.p.x = 28.5; G.p.y = 13.5; F.fim = G.agora + 60000; futIA(s); return; }
  if (!F.penalti.fimVoo) F.penalti.fimVoo = G.agora + 3500;
  futIA(s); futFisica(s);
  if (F.acabou) return;
  // o goleiro segurou, ou a bola parou no campo depois do rebote: pênalti perdido
  if ((b.dono && b.dono !== 'p' && b.dono.papel === 'gol') || (!b.dono && !b.chute && Math.hypot(b.vx, b.vy) < 0.6) || b.dono === 'p' || G.agora > F.penalti.fimVoo) futFimLance('defesa');
}
function futFimLance(motivo) {
  const F = G.fut; if (!F || F.acabou) return; F.acabou = motivo;
  const b = F.bola; let res;
  if (F.tipo === 'defesa') res = { ok: motivo !== 'golEles', gol: motivo === 'golEles' ? 'contra' : null, motivo };
  else if (motivo === 'golNos') { const quem = b.chute ? b.chute.de : (b.livreDe === 'p' ? 'p' : 'comp'); const autor = F.ultimoChute || quem; res = { ok: true, gol: autor === 'p' ? 'eu' : 'comp', assist: autor !== 'p' && F.passeP, motivo }; }
  else res = { ok: false, gol: null, motivo };
  if (motivo === 'golNos' && b.chute) res.gol = b.chute.de === 'p' ? 'eu' : 'comp';
  if (res.gol === 'comp') res.assist = !!F.tocouPassou;
  F.res = res;
  F.fimEm = G.agora + (motivo === 'golNos' || motivo === 'golEles' ? 1000 : 450); futBotoes(); // um respiro (a bola entra na rede) antes de encerrar
}
// guarda quem deu o último passe/chute (para a assistência)
{
  const _ch = futChutaPara;
  futChutaPara = function (de, x, y, v, alto) { const F = G.fut; if (F) { if (de === 'p') F.tocouPassou = false; if (de === 'p' && F.bola.dono === 'p' && F.comp && Math.hypot(F.comp.x - x, F.comp.y - y) < 2.5) F.tocouPassou = true; } return _ch.apply(this, arguments); };
}

/* ---------- desenho: a bola, a marquinha de cada time e os botões ---------- */
{
  const _desenhaFut = desenha;
  desenha = function (dt) {
    const r = _desenhaFut.apply(this, arguments);
    const F = G.fut; if (!F || !G.cam || !G.zoom) return r;
    try {
      const ctx = CTX, z = G.zoom; ctx.setTransform(z, 0, 0, z, -G.cam.x * z, -G.cam.y * z);
      if (F._bolaQuadro !== G.agora) futDesenhaBola(ctx); // ninguém estava na frente dela
      // seta em cima de você quando está com a bola / pênalti: a mira
      if (F.tipo === 'penalti' && F.penalti.fase === 'mira') { ctx.fillStyle = 'rgba(255,225,74,0.9)'; ctx.font = 'bold 16px Nunito'; ctx.textAlign = 'center'; ctx.fillText('⬆ alto · ⏺ meio · ⬇ baixo', 31 * T, 10.4 * T); }
    } catch (e) { }
    return r;
  };
  // anel colorido no pé de cada jogador (amarelo = seu time, vermelho = adversário)
  const _entFut = desenhaEnt;
  desenhaEnt = function (ctx, e) {
    // a bola entra na ordem certa: antes de quem está mais "para baixo" (na frente) do que ela
    const F = G.fut; if (F && e && (e.fut || e === G.p) && F._bolaQuadro !== G.agora && e.y > F.bola.y) futDesenhaBola(ctx);
    if (e && e.fut) { ctx.save(); ctx.strokeStyle = e.time === 'nos' ? 'rgba(255,225,74,.9)' : 'rgba(255,90,80,.85)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(e.x * T, e.y * T, 17, 6.5, 0, 0, 7); ctx.stroke(); ctx.restore(); }
    if (e === G.p && G.fut) { ctx.save(); ctx.strokeStyle = 'rgba(90,255,140,.95)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(e.x * T, e.y * T, 19, 7, 0, 0, 7); ctx.stroke(); ctx.restore(); const f = G.save.flags, tinha = f.pegou_bola; f.pegou_bola = false; try { return _entFut.apply(this, arguments); } finally { f.pegou_bola = tinha; } }
    return _entFut.apply(this, arguments);
  };
}
function futDesenhaBola(ctx) {
  const F = G.fut; if (!F) return; F._bolaQuadro = G.agora;
  const b = F.bola, x = b.x * T, y = b.y * T;
  ctx.fillStyle = 'rgba(20,30,20,0.3)'; ctx.beginPath(); ctx.ellipse(x, y + 2, 7, 3.2, 0, 0, 7); ctx.fill();
  desenhaBola(ctx, x, y - 5 - b.z * T * 0.35, 7, b.giro);
}
function futBotoes() {
  let box = document.getElementById('futBtns'); const F = G.fut;
  document.body.classList.toggle('fut-on', !!(F && !F.acabou));
  if (!F || F.acabou) { if (box) box.remove(); return; }
  if (!box) { box = el('div', { id: 'futBtns' }); document.body.append(box); }
  box.innerHTML = '';
  const bt = (txt, tecla, fn, cls) => { const b = el('button', { class: 'fut-bt ' + (cls || ''), type: 'button' }, el('span', { class: 'ic' }, txt), el('small', {}, tecla)); b.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); fn(); }); return b; };
  if (F.tipo === 'penalti') {
    if (F.penalti.fase === 'mira') box.append(bt('⬆ Alto', 'W', () => futPenaltiBate(-1)), bt('⚽ Meio', 'Espaço', () => futPenaltiBate(0), 'grande'), bt('⬇ Baixo', 'S', () => futPenaltiBate(1)));
    futPosiciona(); return;
  }
  if (F.tipo === 'defesa') box.append(bt('🦶 Desarmar', 'Espaço / X', futBote, 'grande'), bt('🎯 Passar', 'C / E', futPassar));
  else box.append(bt('⚽ Chutar', 'Espaço / X', futChutar, 'grande'), bt('🎯 Passar', 'C / E', futPassar), bt('🌀 Driblar', 'F', futDriblar));
  futPosiciona();
}
// placar e botões dentro da área do jogo (no computador o jogo não ocupa a tela toda)
function futPosiciona() {
  if (document.body.classList.contains('cel3')) return; // celular: o CSS já cuida
  const cv = document.getElementById('cv'); if (!cv) return; const r = cv.getBoundingClientRect();
  const box = document.getElementById('futBtns'); if (box) { box.style.left = (r.left + r.width / 2) + 'px'; box.style.top = Math.max(r.top + 40, r.bottom - box.offsetHeight - 14) + 'px'; box.style.bottom = 'auto'; }
  const pl = document.getElementById('placarCj'); if (pl) { pl.style.left = (r.left + 10) + 'px'; pl.style.top = (r.top + 10) + 'px'; pl.style.transform = 'none'; }
}
window.addEventListener('resize', () => { if (G.jogoC) futPosiciona(); });
{ const _plc = cjPlacar; cjPlacar = function () { const r = _plc.apply(this, arguments); try { futPosiciona(); } catch (e) { } return r; }; }
// teclado (só durante o lance)
window.addEventListener('keydown', ev => {
  const F = G.fut; if (!F || F.acabou || (typeof $ === 'function' && !$('#modal').hidden)) return;
  const c = ev.code; let fn = null;
  if (F.tipo === 'penalti' && F.penalti.fase === 'mira') fn = c === 'KeyW' || c === 'ArrowUp' ? () => futPenaltiBate(-1) : c === 'KeyS' || c === 'ArrowDown' ? () => futPenaltiBate(1) : c === 'Space' || c === 'KeyX' ? () => futPenaltiBate(0) : null;
  else if (c === 'Space' || c === 'KeyX' || c === 'KeyK') fn = F.tipo === 'defesa' ? futBote : futChutar;
  else if (c === 'KeyC' || c === 'KeyE' || c === 'KeyJ') fn = futPassar;
  else if (c === 'KeyF' || c === 'KeyL' || c === 'ShiftLeft') fn = F.tipo === 'defesa' ? futBote : futDriblar;
  if (fn) { ev.preventDefault(); ev.stopImmediatePropagation(); if (!ev.repeat) fn(); }
}, true);
{
  const st = document.createElement('style');
  st.textContent = `#futBtns{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);pointer-events:auto;z-index:60;display:flex;gap:10px;align-items:flex-end}
.fut-bt{min-width:92px;padding:8px 12px;border-radius:16px;border:3px solid #5e2f14;background:linear-gradient(#fff4c8,#ffd23f);color:#3a1a08;font:900 16px Nunito,sans-serif;box-shadow:0 4px 0 #8a4a14,0 6px 14px rgba(0,0,0,.35);display:flex;flex-direction:column;align-items:center;cursor:pointer;touch-action:none}
.fut-bt .ic{font-size:17px}.fut-bt small{font-size:10px;opacity:.7;font-weight:800}
.fut-bt.grande{min-width:120px;padding:12px 16px;font-size:19px;background:linear-gradient(#b8ffcf,#3ad86a);border-color:#1a5a2a;box-shadow:0 4px 0 #1a6a3a,0 6px 14px rgba(0,0,0,.35)}
.fut-bt:active{transform:translateY(3px);box-shadow:0 1px 0 #8a4a14}
body.cel3 #futBtns{bottom:auto;top:auto;right:14px;left:auto;transform:none;bottom:calc(20px + env(safe-area-inset-bottom));flex-direction:column-reverse}
body.cel3 .fut-bt small{display:none}
body.cel3.fut-on #barraAcoes,body.cel3.fut-on #btnCaca,body.cel3.fut-on #btnClasse,body.cel3.fut-on #tAlvo,body.cel3.fut-on #tFalar,body.cel3.fut-on #c3Mais{visibility:hidden!important}
body.cel3 #placarCj{max-width:62vw;padding:4px 10px}
body.cel3 #placarCj .l1{font-size:15px;white-space:nowrap}
body.cel3 #placarCj .l2{font-size:11px}`;
  document.head.append(st);
}
