/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🔲 MOVIMENTO EM QUADRADINHOS (v166) — igual ao Tibia
   - Todo mundo (você, adversários) anda de quadrado em quadrado, deslizando
     suave; 8 direções. Cada quadrado comporta UMA criatura (ninguém encavala).
   - Colado = os 8 quadrados em volta; jogadas em área acertam o quadrado exato
     (3×3, 5×5...) e os quadrados atingidos piscam no chão.
   - Como: trocamos só as peças básicas (mover/separar). A inteligência dos
     adversários, caminhos e cliques continuam os mesmos.
   - v178: não tem mais a opção "andar livre" (vale para todo mundo, como no Tibia).
   Carregar no FIM.
   ============================================================ */
// v178: sempre em quadradinhos (o "andar livre" deixava os adversários encavalados; pedido do dono)
const GRADE = { on: true, dt: 16 };
// v185: regras do Tibia (tiradas do OTClient, o cliente aberto do Tibia):
const GR_DIAG = 1;       // passo na diagonal leva o MESMO tempo que o reto (no Tibia é 3x; pedido do dono)
const GR_REPETE = 200;   // segurando a tecla, o passo só se repete 200 ms depois de apertar (o 1º passo é na hora)
// apertou uma tecla de andar (de verdade, não a repetição do teclado)
function grApertou(tok) {
  const d = typeof DIR_VET !== 'undefined' && DIR_VET[tok], p = G.p; if (!d || !p || !GRADE.on) return;
  p.dirDesde = G.agora;
  if (!p.pas) p.fila = d;                                               // parado: anda já
  else if (d[0] !== p.pas.dir[0] || d[1] !== p.pas.dir[1]) p.fila = d;  // andando: outra direção entra na fila (a mais nova substitui); a mesma é ignorada
}
{ const T0 = G.teclas, _add = T0.add.bind(T0); T0.add = function (v) { if (!T0.has(v)) try { grApertou(v); } catch (e) { } return _add(v); }; }

function grTile(e) { const s = e.pas; return s ? { x: s.tx, y: s.ty } : { x: Math.floor(e.x), y: Math.floor(e.y) }; }
// v294: quem VOA também ocupa o quadrado (morcegos, fantasmas, ETs flutuantes se empilhavam e passavam de 8 em volta
// de você). Só a gaivota da praia fica de fora: é enfeite, não briga.
function grOcupa(e) { return e && !(e.d && e.d.look && e.d.look.tipo === 'gaivota'); }
function grOcupado(tx, ty, eu) {
  // v319: mesma conta sem montar listas/objetos novos a cada pergunta (é chamada milhares de vezes por quadro na hunt)
  const um = o => { if (!o || o === eu || !grOcupa(o)) return false; const s = o.pas; return s ? s.tx === tx && s.ty === ty : Math.floor(o.x) === tx && Math.floor(o.y) === ty; };
  if (um(G.p)) return true;
  const ms = G.mons, ns = G.npcs;
  for (let i = 0; i < ms.length; i++) if (um(ms[i])) return true;
  for (let i = 0; i < ns.length; i++) if (um(ns[i])) return true;
  return false;
}
// v319: os quadrados ocupados agora (mesma regra de grOcupado), para buscas que perguntam centenas de vezes
function grMapaOcupacao(eu) {
  const S = new Set(), poe = o => { if (!o || o === eu || !grOcupa(o)) return; const s = o.pas; if (s) S.add(s.ty * 65536 + s.tx); else S.add(Math.floor(o.y) * 65536 + Math.floor(o.x)); };
  poe(G.p); for (const o of G.mons) poe(o); for (const o of G.npcs) poe(o);
  return S;
}
function grLivre(tx, ty, eu) { return !tileBloq(tx, ty) && !grOcupado(tx, ty, eu); }
function grPasso(e, tx, ty, velTiles) {
  const cx = tx + 0.5, cy = ty + 0.5, d = Math.hypot(cx - e.x, cy - e.y); if (d < 0.01) return false;
  const diag = Math.abs(tx - Math.floor(e.x)) + Math.abs(ty - Math.floor(e.y)) === 2;
  const dur = Math.max(70, 1000 * d / Math.max(0.5, velTiles) * (diag ? GR_DIAG / Math.SQRT2 : 1));
  e.pas = { x0: e.x, y0: e.y, tx, ty, t: 0, dur, dir: [Math.sign(tx + 0.5 - e.x), Math.sign(ty + 0.5 - e.y)] };
  if (e === G.p) { const d = e.pas.dir; if (d[0]) e.flip = d[0] < 0; if (typeof olha === 'function') olha(e, d[0], d[1]); } // já começa o passo olhando para onde vai
  return true;
}
// avança os passos de todo mundo (antes do resto do jogo, a cada quadro)
function grAvanca(dt) {
  for (const e of [G.p, ...G.mons]) {
    if (!e) continue; e._movQ = 0; const s = e.pas; if (!s) continue;
    s.t += dt; const k = Math.min(1, s.t / s.dur); const nx = s.x0 + (s.tx + 0.5 - s.x0) * k, ny = s.y0 + (s.ty + 0.5 - s.y0) * k;
    e._movQ = Math.hypot(nx - e.x, ny - e.y) || 0.0006; e.x = nx; e.y = ny;
    if (k >= 1) { e.x = s.tx + 0.5; e.y = s.ty + 0.5; e.pas = null; e.fimPasso = G.agora; e.ultDir = s.dir; }
  }
}
// escolhe o quadrado vizinho na direção pedida (e, se ocupado, um dos lados)
function grVizinho(e, dx, dy, deLado) {
  const a = Math.atan2(dy, dx); const cur = { x: Math.floor(e.x), y: Math.floor(e.y) };
  const oct = Math.round(a / (Math.PI / 4));
  // diagonal custa 3 (reto custa 1): quem anda sozinho (adversário, clique, perseguir) prefere o reto, como o caminho do Tibia
  const lado = a / (Math.PI / 4) - oct >= 0 ? 1 : -1, diag = GR_DIAG >= 2 && Math.abs(oct) % 2 === 1; // só compensa desviar da diagonal se ela for cara
  const dirs = !deLado ? [0] : diag ? [lado, -lado, 0, 2 * lado, -2 * lado] : [0, 1, -1, 2, -2];
  for (const k of dirs) {
    const o = oct + k; const sx = Math.round(Math.cos(o * Math.PI / 4)), sy = Math.round(Math.sin(o * Math.PI / 4));
    const tx = cur.x + sx, ty = cur.y + sy;
    if (!grLivre(tx, ty, e)) continue;
    if (sx && sy && tileBloq(cur.x + sx, cur.y) && tileBloq(cur.x, cur.y + sy)) continue; // não atravessa quina de parede
    if (Math.abs(k) === 2 && deLado) { // de lado só se não afastar muito
      const antes = Math.hypot(dx, dy), depois = Math.hypot(dx - sx, dy - sy); if (depois > antes + 0.2) continue;
    }
    if (diag && Math.abs(k) === 1 && deLado) { // o reto só vale se aproximar de verdade (não fica rodando em volta)
      const n = Math.hypot(dx, dy) || 1; if ((sx * dx + sy * dy) / n < 0.6) continue;
    }
    return { x: tx, y: ty };
  }
  if (!deLado && Math.abs(dx) > 0.2 && Math.abs(dy) > 0.2) { // diagonal bloqueada (jogador): tenta o eixo mais forte
    const opc = Math.abs(dx) >= Math.abs(dy) ? [[Math.sign(dx), 0], [0, Math.sign(dy)]] : [[0, Math.sign(dy)], [Math.sign(dx), 0]];
    for (const [sx, sy] of opc) if (grLivre(cur.x + sx, cur.y + sy, e)) return { x: cur.x + sx, y: cur.y + sy };
  }
  return null;
}

/* ---------- as peças trocadas ---------- */
{
  const _mover = mover;
  mover = function (e, dx, dy, r) {
    if (!GRADE.on || !e || (e !== G.p && !G.mons.includes(e))) return _mover.apply(this, arguments);
    if (e.pas) return e._movQ || 0.0006; // no meio do passo não muda nada (a próxima direção fica na fila)
    const cx = Math.floor(e.x) + 0.5, cy = Math.floor(e.y) + 0.5;
    const vel = e === G.p ? velJogador() : Math.max(0.5, Math.hypot(dx, dy) / Math.max(0.001, GRADE.dt / 1000));
    if (Math.hypot(e.x - cx, e.y - cy) > 0.05) { grPasso(e, Math.floor(e.x), Math.floor(e.y), vel); return 0.0006; } // centraliza primeiro
    if (Math.hypot(dx, dy) < 1e-6) return 0;
    // teclado (como no Tibia): o 1º passo é na hora; segurando, repete só depois de 200 ms; toque no meio do passo = próximo passo
    if (e === G.p && !G.joy && G.teclas.size) {
      const h = dirTeclas(); if (h[0] || h[1]) {
        let d; if (e.fila) { d = e.fila; e.fila = null; } else if (G.agora >= (e.dirDesde || 0) + GR_REPETE) d = h; else return 0;
        const alvoT = grVizinho(e, d[0], d[1], false); if (!alvoT) return 0;
        grPasso(e, alvoT.x, alvoT.y, vel); return 0.0006;
      }
    }
    const alvo = grVizinho(e, dx, dy, e !== G.p || (!G.teclas.size && !G.joy)); // teclado/joystick: só na direção pedida; seguindo caminho/alvo: pode desviar
    if (!alvo) return 0;
    grPasso(e, alvo.x, alvo.y, vel); return 0.0006;
  };
  // v224: adversário indo até você (como no Tibia): colado em qualquer um dos 8 quadrados em volta, PARA e ataca
  // (antes, na diagonal ele achava que ainda estava longe e ficava indo e voltando). Longe: segue um caminho de
  // verdade até um quadrado livre do seu lado, desviando dos outros; com a sua "box" cheia, espera no lugar.
  const _andaAte = andaAte;
  const passoAteJogador = (m, comGente) => {
    const p = grTile(G.p), o = grTile(m), R = 12, W = 2 * R + 1, x0 = o.x - R, y0 = o.y - R;
    const visto = new Int16Array(W * W).fill(-1), fila = [o.x, o.y]; visto[R * W + R] = R * W + R;
    // v319: quem ocupa cada quadrado é anotado UMA vez por busca (nada se mexe durante ela) — antes cada quadrado
    // visitado varria todos os personagens do mapa (com a box cheia, 20 ms+ por quadro nas hunts cheias)
    const ocup = comGente ? grMapaOcupacao(m) : null;
    const bloq = (x, y) => tileBloq(x, y) || (comGente && ocup.has(y * 65536 + x));
    for (let k = 0; k < fila.length; k += 2) {
      const x = fila[k], y = fila[k + 1];
      if (Math.max(Math.abs(x - p.x), Math.abs(y - p.y)) === 1) { // chegou do lado do jogador: volta até o 1º passo
        let i = (y - y0) * W + (x - x0); const ini = R * W + R;
        while (visto[i] !== ini) i = visto[i];
        return { x: x0 + i % W, y: y0 + Math.floor(i / W) };
      }
      for (const [sx, sy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        const nx = x + sx, ny = y + sy, lx = nx - x0, ly = ny - y0; if (lx < 0 || ly < 0 || lx >= W || ly >= W) continue;
        const j = ly * W + lx; if (visto[j] !== -1 || (nx === p.x && ny === p.y) || bloq(nx, ny)) continue;
        if (sx && sy && tileBloq(x + sx, y) && tileBloq(x, y + sy)) continue; // não corta quina de parede
        visto[j] = (y - y0) * W + (x - x0); fila.push(nx, ny);
      }
    }
    return null;
  };
  andaAte = function (m, alvo, v, afastar) {
    if (!GRADE.on || afastar || alvo !== G.p || !G.mons.includes(m) || m.pas) return _andaAte.apply(this, arguments);
    const o = grTile(m), p = grTile(G.p), dx = G.p.x - m.x, dy = G.p.y - m.y;
    const encara = () => { if (Math.abs(dx) > 0.02) m.flip = dx < 0; olha(m, dx, dy); };
    if (Math.max(Math.abs(o.x - p.x), Math.abs(o.y - p.y)) <= 1 && (o.x !== p.x || o.y !== p.y)) { if (Math.hypot(m.x - o.x - 0.5, m.y - o.y - 0.5) > 0.05) return _andaAte.apply(this, arguments); m.mov = false; encara(); return; }
    const passo = passoAteJogador(m, true);
    if (passo) { grPasso(m, passo.x, passo.y, Math.max(0.5, v / Math.max(0.001, GRADE.dt / 1000))); m.mov = true; encara(); m.fase += 0.3; return; }
    // sem caminho agora: se for só gente no meio (box cheia), espera ali mesmo sem desistir; parede de verdade: deixa desistir
    m.mov = false; encara(); if (Math.hypot(dx, dy) < 7 && passoAteJogador(m, false)) m.tParado = 0;
  };
  // v190: andar clicando — na grade só se para no CENTRO do quadrado. O ponto final era o lugar exato do clique
  // (fora do centro): o boneco nunca "chegava" e ficava indo e voltando entre dois quadrados.
  const _segue = segue;
  segue = function (e, cam) {
    if (GRADE.on && cam && cam.length) for (const pt of cam) if (!pt._gr) { pt.x = Math.floor(pt.x) + 0.5; pt.y = Math.floor(pt.y) + 0.5; pt._gr = 1; }
    return _segue.apply(this, arguments);
  };
  const _separa = separa;
  separa = function (e) {
    if (!GRADE.on) return _separa.apply(this, arguments);
    // dois no mesmo quadrado (nasceu junto, jogada que atravessou): o adversário dá um passo para um vizinho livre
    if (!e || e.pas || e === G.p || !grOcupa(e)) return;
    const ie = G.mons.indexOf(e); if (ie < 0) return;
    // v319: mesma regra, sem listas novas e sem indexOf dentro do laço
    const t = grTile(e), aqui = o => o && o !== e && grOcupa(o) && !o.pas && Math.floor(o.x) === t.x && Math.floor(o.y) === t.y;
    let outro = aqui(G.p);
    for (let i = 0; i < ie && !outro; i++) if (aqui(G.mons[i])) outro = true;
    for (let i = 0; i < G.npcs.length && !outro; i++) if (aqui(G.npcs[i])) outro = true;
    if (!outro) return;
    for (const [sx, sy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) if (grLivre(t.x + sx, t.y + sy, e)) { grPasso(e, t.x + sx, t.y + sy, 3); return; }
  };
  const _atualiza = atualiza;
  atualiza = function (dt) {
    GRADE.dt = dt || 16;
    if (GRADE.on && G.mapa && !G.pausado) try { grAvanca(dt || 16); if (G.p && !G.p.pas && !G.jogada) separaJogador(); if (!G.fut) grDesempilha(); } catch (e) { }
    const r = _atualiza.apply(this, arguments);
    const p = G.p;
    if (GRADE.on && p && !G.pausado) {
      // durante o passo, olha para onde está indo (antes virava para a tecla apertada e "andava de costas")
      if (p.pas && p.pas.dir) { const d = p.pas.dir; if (d[0]) p.flip = d[0] < 0; if (typeof olha === 'function') olha(p, d[0], d[1]); }
      // o toque que ficou na fila vira UM passo, mesmo que a tecla já tenha sido solta
      else if (p.fila && !G.joy && !G.caminho && !G.jogada) { const h = dirTeclas(); if (!h[0] && !h[1]) { const d = p.fila; p.fila = null; const alvo = grVizinho(p, d[0], d[1], false); if (alvo) grPasso(p, alvo.x, alvo.y, velJogador()); } }
    }
    return r;
  };
}
// v294: ninguém divide quadrado. Quem nasceu, voltou para casa ou foi parar em cima de outro (ou de você) e não tinha
// vizinho livre (a sua "box" de 8 cheia) ficava ali preso; agora procura o quadrado livre mais perto, até 3 de distância.
let grDesempilhaEm = 0;
function grDesempilha() {
  if (G.agora < grDesempilhaEm) return; grDesempilhaEm = G.agora + 200;
  const ocup = new Map(), tile = e => Math.floor(e.x) + ',' + Math.floor(e.y);
  if (G.p) ocup.set(tile(G.p), G.p);
  for (const n of G.npcs) if (n) ocup.set(tile(n), n);
  for (const m of G.mons) {
    if (!m || !grOcupa(m) || m.hp <= 0) continue;
    if (m.pas) { ocup.set(m.pas.tx + ',' + m.pas.ty, m); continue; }
    const k = tile(m); if (!ocup.has(k)) { ocup.set(k, m); continue; }
    // esse quadrado já tem dono: vai para o livre mais perto
    const x0 = Math.floor(m.x), y0 = Math.floor(m.y); let foi = false;
    for (let r = 1; r <= 3 && !foi; r++) for (let dy = -r; dy <= r && !foi; dy++) for (let dx = -r; dx <= r && !foi; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const tx = x0 + dx, ty = y0 + dy;
      if (tileBloq(tx, ty) || ocup.has(tx + ',' + ty) || grOcupado(tx, ty, m)) continue;
      grPasso(m, tx, ty, 4 + r); ocup.set(tx + ',' + ty, m); foi = true;
    }
  }
}
// o jogador também não pode ficar em cima de ninguém (ex.: chegou por uma porta onde havia alguém)
function separaJogador() {
  const p = G.p, t = { x: Math.floor(p.x), y: Math.floor(p.y) };
  if (!G.mons.some(m => grOcupa(m) && !m.pas && Math.floor(m.x) === t.x && Math.floor(m.y) === t.y) && !G.npcs.some(n => Math.floor(n.x) === t.x && Math.floor(n.y) === t.y)) return;
  for (const [sx, sy] of [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) if (grLivre(t.x + sx, t.y + sy, p)) { grPasso(p, t.x + sx, t.y + sy, velJogador()); return; }
}
// trocar de mapa / carregar: começa certinho no quadrado
{ const _entrarMapaG = entrarMapa; entrarMapa = function () { const r = _entrarMapaG.apply(this, arguments); if (G.p) { G.p.pas = null; G.p.fila = null; if (GRADE.on) { G.p.x = Math.floor(G.p.x) + 0.5; G.p.y = Math.floor(G.p.y) + 0.5; } } for (const m of G.mons) { m.pas = null; if (GRADE.on) { m.x = Math.floor(m.x) + 0.5; m.y = Math.floor(m.y) + 0.5; } } return r; }; }
{ const _criaMonstroG = criaMonstro; criaMonstro = function () { const m = _criaMonstroG.apply(this, arguments); if (m && GRADE.on) { m.x = Math.floor(m.x) + 0.5; m.y = Math.floor(m.y) + 0.5; } return m; }; }

// jogada que atravessa o adversário (Chapéu/Caneta) move o jogador sozinha: sem passo em andamento
if (typeof iniciaJogada === 'function') { const _iniciaJogadaG = iniciaJogada; iniciaJogada = function () { const r = _iniciaJogadaG.apply(this, arguments); if (G.jogada && G.jogada.fim && G.p) G.p.pas = null; return r; }; }

/* ---------- área: os quadrados atingidos piscam no chão ---------- */
G.areaGrade = null;
{
  const _usarDribleG = usarDrible;
  usarDrible = function (id) {
    const dr = DRIBLES[id]; const antes = G.cds[id]; const a = G.alvo && G.mons.includes(G.alvo) ? G.alvo : null;
    const r = _usarDribleG.apply(this, arguments);
    if (GRADE.on && dr && G.cds[id] !== antes) {
      let c = null, raio = 0;
      if (dr.tipo === 'area') { c = G.p; raio = Math.max(1, Math.round(dr.raio)); } else if (dr.areaAlvo && a) { c = a; raio = Math.max(1, Math.round(dr.areaAlvo)); }
      if (c) G.areaGrade = { x: Math.floor(c.x), y: Math.floor(c.y), raio, cor: dr.cor || '#ffe14a', t0: G.agora, eu: dr.areaAlvo && a ? { x: Math.floor(G.p.x), y: Math.floor(G.p.y) } : null }; // no alvo: pisca também em volta de você
    }
    return r;
  };
  const _dcc = desenhaChaoClima;
  desenhaChaoClima = function (ctx) {
    const r = _dcc.apply(this, arguments);
    const A = G.areaGrade; if (A && GRADE.on) {
      const k = (G.agora - A.t0) / 700; if (k > 1) G.areaGrade = null;
      else { ctx.save(); const al = 1 - k; ctx.fillStyle = A.cor; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; // v300: bem mais transparente (antes 55% e borda grossa)
        const qs = new Set(); for (let y = A.y - A.raio; y <= A.y + A.raio; y++) for (let x = A.x - A.raio; x <= A.x + A.raio; x++) qs.add(x + ',' + y);
        if (A.eu) for (let y = A.eu.y - 1; y <= A.eu.y + 1; y++) for (let x = A.eu.x - 1; x <= A.eu.x + 1; x++) if (x !== A.eu.x || y !== A.eu.y) qs.add(x + ',' + y);
        for (const q of qs) { const [x, y] = q.split(',').map(Number); ctx.globalAlpha = 0.2 * al; ctx.fillRect(x * T + 2, y * T + 2, T - 4, T - 4); ctx.globalAlpha = 0.35 * al; ctx.strokeRect(x * T + 2, y * T + 2, T - 4, T - 4); }
        ctx.restore(); }
    }
    return r;
  };
}
// quadradinho do alvo marcado (como no Tibia): um quadrado vermelho no chão, embaixo dele
{
  const _dcc2 = desenhaChaoClima;
  desenhaChaoClima = function (ctx) {
    const r = _dcc2.apply(this, arguments);
    // v184: segue a posição de verdade da criatura (antes usava o quadrado de destino e chegava antes dela)
    if (GRADE.on && G.alvo && G.mons.includes(G.alvo)) { const a = G.alvo; ctx.save(); ctx.strokeStyle = 'rgba(255,60,60,0.9)'; ctx.lineWidth = 3; ctx.strokeRect((a.x - 0.5) * T + 3, (a.y - 0.5) * T + 3, T - 6, T - 6); ctx.restore(); }
    return r;
  };
}

