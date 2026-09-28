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
   - Chave: ☰ Mais → "Movimento: quadradinhos / livre" (fica guardado neste aparelho).
   Carregar no FIM.
   ============================================================ */
const GRADE = { on: true, dt: 16 };
try { GRADE.on = localStorage.getItem('rac_grade_v1') !== '0'; } catch (e) { }
const GR_DIAG = 1.35; // passo na diagonal demora um pouco mais

function grTile(e) { const s = e.pas; return s ? { x: s.tx, y: s.ty } : { x: Math.floor(e.x), y: Math.floor(e.y) }; }
function grOcupa(e) { return e && !(e.d && e.d.look && (e.d.look.tipo === 'gaivota' || e.d.look.voa || e.d.voa)); }
function grOcupado(tx, ty, eu) {
  for (const o of [G.p, ...G.mons, ...G.npcs]) {
    if (!o || o === eu || !grOcupa(o)) continue; const t = grTile(o);
    if (t.x === tx && t.y === ty) return true;
  }
  return false;
}
function grLivre(tx, ty, eu) { return !tileBloq(tx, ty) && !grOcupado(tx, ty, eu); }
function grPasso(e, tx, ty, velTiles) {
  const cx = tx + 0.5, cy = ty + 0.5, d = Math.hypot(cx - e.x, cy - e.y); if (d < 0.01) return false;
  const diag = Math.abs(tx - Math.floor(e.x)) + Math.abs(ty - Math.floor(e.y)) === 2;
  const dur = Math.max(70, 1000 * d / Math.max(0.5, velTiles) * (diag ? GR_DIAG / Math.SQRT2 : 1));
  e.pas = { x0: e.x, y0: e.y, tx, ty, t: 0, dur }; return true;
}
// avança os passos de todo mundo (antes do resto do jogo, a cada quadro)
function grAvanca(dt) {
  for (const e of [G.p, ...G.mons]) {
    if (!e) continue; e._movQ = 0; const s = e.pas; if (!s) continue;
    s.t += dt; const k = Math.min(1, s.t / s.dur); const nx = s.x0 + (s.tx + 0.5 - s.x0) * k, ny = s.y0 + (s.ty + 0.5 - s.y0) * k;
    e._movQ = Math.hypot(nx - e.x, ny - e.y) || 0.0006; e.x = nx; e.y = ny;
    if (k >= 1) { e.x = s.tx + 0.5; e.y = s.ty + 0.5; e.pas = null; }
  }
}
// escolhe o quadrado vizinho na direção pedida (e, se ocupado, um dos lados)
function grVizinho(e, dx, dy, deLado) {
  const a = Math.atan2(dy, dx); const cur = { x: Math.floor(e.x), y: Math.floor(e.y) };
  const oct = Math.round(a / (Math.PI / 4)); const dirs = deLado ? [0, 1, -1, 2, -2] : [0];
  for (const k of dirs) {
    const o = oct + k; const sx = Math.round(Math.cos(o * Math.PI / 4)), sy = Math.round(Math.sin(o * Math.PI / 4));
    const tx = cur.x + sx, ty = cur.y + sy;
    if (!grLivre(tx, ty, e)) continue;
    if (sx && sy && tileBloq(cur.x + sx, cur.y) && tileBloq(cur.x, cur.y + sy)) continue; // não atravessa quina de parede
    if (Math.abs(k) === 2 && deLado) { // de lado só se não afastar muito
      const antes = Math.hypot(dx, dy), depois = Math.hypot(dx - sx, dy - sy); if (depois > antes + 0.2) continue;
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
    if (e.pas) return e._movQ || 0.0006; // já está indo para o próximo quadrado
    const cx = Math.floor(e.x) + 0.5, cy = Math.floor(e.y) + 0.5;
    const vel = e === G.p ? velJogador() : Math.max(0.5, Math.hypot(dx, dy) / Math.max(0.001, GRADE.dt / 1000));
    if (Math.hypot(e.x - cx, e.y - cy) > 0.05) { grPasso(e, Math.floor(e.x), Math.floor(e.y), vel); return 0.0006; } // centraliza primeiro
    if (Math.hypot(dx, dy) < 1e-6) return 0;
    const alvo = grVizinho(e, dx, dy, e !== G.p || (!G.teclas.size && !G.joy)); // teclado/joystick: só na direção pedida; seguindo caminho/alvo: pode desviar
    if (!alvo) return 0;
    grPasso(e, alvo.x, alvo.y, vel); return 0.0006;
  };
  const _separa = separa;
  separa = function (e) {
    if (!GRADE.on) return _separa.apply(this, arguments);
    // dois no mesmo quadrado (nasceu junto, jogada que atravessou): o adversário dá um passo para um vizinho livre
    if (!e || e.pas || e === G.p || !G.mons.includes(e) || !grOcupa(e)) return;
    const t = grTile(e); const outro = [G.p, ...G.mons, ...G.npcs].some(o => o && o !== e && grOcupa(o) && !o.pas && Math.floor(o.x) === t.x && Math.floor(o.y) === t.y && (o === G.p || G.mons.indexOf(o) < G.mons.indexOf(e) || G.npcs.includes(o)));
    if (!outro) return;
    for (const [sx, sy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) if (grLivre(t.x + sx, t.y + sy, e)) { grPasso(e, t.x + sx, t.y + sy, 3); return; }
  };
  const _atualiza = atualiza;
  atualiza = function (dt) {
    GRADE.dt = dt || 16;
    if (GRADE.on && G.mapa && !G.pausado) try { grAvanca(dt || 16); if (G.p && !G.p.pas && !G.jogada) separaJogador(); } catch (e) { }
    return _atualiza.apply(this, arguments);
  };
}
// o jogador também não pode ficar em cima de ninguém (ex.: chegou por uma porta onde havia alguém)
function separaJogador() {
  const p = G.p, t = { x: Math.floor(p.x), y: Math.floor(p.y) };
  if (!G.mons.some(m => grOcupa(m) && !m.pas && Math.floor(m.x) === t.x && Math.floor(m.y) === t.y) && !G.npcs.some(n => Math.floor(n.x) === t.x && Math.floor(n.y) === t.y)) return;
  for (const [sx, sy] of [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) if (grLivre(t.x + sx, t.y + sy, p)) { grPasso(p, t.x + sx, t.y + sy, velJogador()); return; }
}
// trocar de mapa / carregar: começa certinho no quadrado
{ const _entrarMapaG = entrarMapa; entrarMapa = function () { const r = _entrarMapaG.apply(this, arguments); if (G.p) { G.p.pas = null; if (GRADE.on) { G.p.x = Math.floor(G.p.x) + 0.5; G.p.y = Math.floor(G.p.y) + 0.5; } } for (const m of G.mons) { m.pas = null; if (GRADE.on) { m.x = Math.floor(m.x) + 0.5; m.y = Math.floor(m.y) + 0.5; } } return r; }; }
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
      if (c) G.areaGrade = { x: Math.floor(c.x), y: Math.floor(c.y), raio, cor: dr.cor || '#ffe14a', t0: G.agora };
    }
    return r;
  };
  const _dcc = desenhaChaoClima;
  desenhaChaoClima = function (ctx) {
    const r = _dcc.apply(this, arguments);
    const A = G.areaGrade; if (A && GRADE.on) {
      const k = (G.agora - A.t0) / 700; if (k > 1) G.areaGrade = null;
      else { ctx.save(); ctx.globalAlpha = 0.55 * (1 - k); ctx.fillStyle = A.cor; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
        for (let y = A.y - A.raio; y <= A.y + A.raio; y++) for (let x = A.x - A.raio; x <= A.x + A.raio; x++) { ctx.fillRect(x * T + 2, y * T + 2, T - 4, T - 4); ctx.strokeRect(x * T + 2, y * T + 2, T - 4, T - 4); }
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
    if (GRADE.on && G.alvo && G.mons.includes(G.alvo)) { const t = grTile(G.alvo); ctx.save(); ctx.strokeStyle = 'rgba(255,60,60,0.9)'; ctx.lineWidth = 3; ctx.strokeRect(t.x * T + 3, t.y * T + 3, T - 6, T - 6); ctx.restore(); }
    return r;
  };
}

/* ---------- chave: quadradinhos ou livre ---------- */
function rotuloGrade() { return GRADE.on ? '🔲 Movimento: quadradinhos (trocar para livre)' : '🔲 Movimento: livre (trocar para quadradinhos)'; }
{
  const lista = document.querySelector('.tb-lista');
  if (lista && !document.getElementById('btnGrade')) {
    const b = el('button', { class: 'btn', id: 'btnGrade', type: 'button', role: 'menuitem' }, rotuloGrade());
    b.addEventListener('click', () => {
      GRADE.on = !GRADE.on; try { localStorage.setItem('rac_grade_v1', GRADE.on ? '1' : '0'); } catch (e) { }
      if (G.p) { G.p.pas = null; if (GRADE.on) { G.p.x = Math.floor(G.p.x) + 0.5; G.p.y = Math.floor(G.p.y) + 0.5; } } for (const m of G.mons) m.pas = null;
      b.textContent = rotuloGrade(); log(GRADE.on ? '🔲 Movimento em quadradinhos (como no Tibia): cada um no seu quadrado.' : '🔲 Movimento livre.', 'l-sis');
    });
    lista.append(b);
  }
}
