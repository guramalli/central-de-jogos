/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🛡️ ZONA SEGURA PERTO DAS PESSOAS (v193) — como a "protection zone" do Tibia.
   Antes: os rivais valentes atacavam quem ia falar com um vendedor que ficava
   perto da área deles. Agora, nos 5×5 quadrados em volta de cada pessoa
   (vendedor, professor, quadro de desafios...):
   - os adversários não te desafiam nem atacam (nem de longe); se você ficar
     lá, eles desistem e voltam para casa;
   - os adversários não entram (quem nasceu dentro pode sair);
   - você também não começa desafio de dentro (senão dava para bater sem apanhar).
   Carregar DEPOIS de grade.js.
   ============================================================ */
const ZS_RAIO = 2; // quadrados em volta da pessoa (5×5)
const ZS = { mapa: null, n: -1, tiles: new Set(), avisou: 0 };
function zonaSegura() {
  const m = G.mapa; if (!m) return ZS.tiles;
  if (ZS.mapa !== m || ZS.n !== G.npcs.length) {
    ZS.mapa = m; ZS.n = G.npcs.length; ZS.tiles = new Set();
    for (const n of G.npcs) { const nx = Math.floor(n.x), ny = Math.floor(n.y); for (let y = ny - ZS_RAIO; y <= ny + ZS_RAIO; y++) for (let x = nx - ZS_RAIO; x <= nx + ZS_RAIO; x++) ZS.tiles.add(y * m.w + x); }
    const c = m.centroTreino; if (c && c.X != null) for (let y = c.Y - 1; y <= c.Y + c.H; y++) for (let x = c.X - 1; x <= c.X + c.W; x++) ZS.tiles.add(y * m.w + x); // centro de treinamento: treinar em paz
  }
  return ZS.tiles;
}
function naZonaSegura(e) { const m = G.mapa; if (!m || !e || G.desafio || m.arena) return false; return zonaSegura().has(Math.floor(e.y) * m.w + Math.floor(e.x)); } // desafio de estádio e arena: sem zona

// adversário: não desafia, não ataca e acaba desistindo de quem está na zona
{
  const _atualizaMonstroZS = atualizaMonstro;
  atualizaMonstro = function (m, dt) {
    if (!m || !m.d || m.d.treino || m.d.chefe || !naZonaSegura(G.p)) { if (m) m.zsDesde = 0; return _atualizaMonstroZS.apply(this, arguments); }
    m.calmoAte = Math.max(m.calmoAte || 0, G.agora + 250);                  // não fica bravo por chegar perto
    m.cdAtk = Math.max(m.cdAtk || 0, G.agora + 250); m.cdRng = Math.max(m.cdRng || 0, G.agora + 250); // não ataca
    if (m.bravo) {
      if (!m.zsDesde) m.zsDesde = G.agora;
      else if (G.agora - m.zsDesde > 2500) { m.bravo = false; m.voltando = true; m.volta0 = G.agora; m.cam = null; m.dest = null; m.tParado = 0; m.zsDesde = 0; } // desiste e volta
    }
    return _atualizaMonstroZS.apply(this, arguments);
  };
}
// adversário não entra na zona (se nasceu dentro, pode sair)
if (typeof grLivre === 'function') {
  const _grLivreZS = grLivre;
  grLivre = function (tx, ty, eu) {
    if (!_grLivreZS.apply(this, arguments)) return false;
    if (eu && eu !== G.p && G.mons.includes(eu) && !(eu.d && eu.d.chefe) && G.mapa) {
      const z = G.desafio || G.mapa.arena ? new Set() : zonaSegura(); if (z.has(ty * G.mapa.w + tx) && !z.has(Math.floor(eu.y) * G.mapa.w + Math.floor(eu.x))) return false;
    }
    return true;
  };
}
// você também não começa desafio de dentro da zona
function avisaZonaSegura() {
  if (G.agora - ZS.avisou < 2500) return; ZS.avisou = G.agora;
  const t = '🛡️ Zona segura: perto das pessoas ninguém desafia ninguém. Dê uns passos para longe para jogar.';
  log(t, 'l-sis'); if (typeof avisoTela === 'function') avisoTela(t, 'l-info');
}
{
  const _ataqueZS = ataqueAutomatico;
  ataqueAutomatico = function () {
    const a = G.alvo; if (a && a.d && !a.d.treino && naZonaSegura(G.p)) { if (dist(a, G.p) < 6) avisaZonaSegura(); return; }
    return _ataqueZS.apply(this, arguments);
  };
  const _usarDribleZS = usarDrible;
  usarDrible = function (id) {
    const dr = DRIBLES[id]; const ataque = dr && ['melee', 'dist', 'area'].includes(dr.tipo);
    if (ataque && naZonaSegura(G.p) && !(G.alvo && G.alvo.d && G.alvo.d.treino)) { avisaZonaSegura(); return; } // boneco de treino pode
    return _usarDribleZS.apply(this, arguments);
  };
}
