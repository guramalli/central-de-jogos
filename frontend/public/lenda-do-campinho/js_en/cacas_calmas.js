/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🎯 CAÇAS SEM "CHUVA DE BOLAS" NA ENTRADA (v307), a pedido do dono: em algumas áreas de caça os
   adversários que chutam de longe nasciam perto da entrada (até 11 a menos de 8 passos, no Carrossel
   dos Anéis) e, ao entrar, a tela enchia de gente chutando em você.
   1) ENTRADA TRANQUILA: nas áreas de caça (caca_*), cada grupo de quem chuta de longe que nascia a menos
      de 8 quadrados de uma entrada/saída passa a nascer mais para dentro (9 a 22 passos a pé da entrada, o grupo inteiro,
      no lugar livre mais perto de onde era).
   2) NO MÁXIMO 4 CHUTANDO DE LONGE AO MESMO TEMPO em você: os outros esperam a vez (continuam perto,
      andando e brigando colado normalmente). Vale em todo o mundo.
   Carregar NO FIM.
   ============================================================ */
{
  const RAIO_CALMO = 8, MIN_PASSOS = 9, MAX_PASSOS = 22, MAX_ATIRADORES = 4, JANELA_TIRO = 1400;
  const anda = (m, x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && CH_ANDA(m.chao[y * m.w + x]) && !(m.obj[y * m.w + x] && OBJ_BLOQUEIA.has(m.obj[y * m.w + x].t));
  function acalma(m) {
    if (!m || m._calma || !m.spawns) return; m._calma = true;
    const ents = [...(m.saidas || []), m.inicio, m.renasce].filter(Boolean).map(e => ({ x: Math.floor(e.x), y: Math.floor(e.y) }));
    if (!ents.length) return;
    // passos a pé desde as entradas (BFS)
    const W = m.w, dist = new Int32Array(W * m.h).fill(-1), fila = [];
    for (const e of ents) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = e.x + dx, y = e.y + dy; if (anda(m, x, y) && dist[y * W + x] < 0) { dist[y * W + x] = 0; fila.push(y * W + x); } }
    for (let h = 0; h < fila.length; h++) {
      const i = fila[h], x = i % W, y = (i / W) | 0, d = dist[i]; if (d >= MAX_PASSOS) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, j = ny * W + nx; if (anda(m, nx, ny) && dist[j] < 0) { dist[j] = d + 1; fila.push(j); } }
    }
    let n = 0;
    for (const sp of m.spawns) {
      const d = MONSTROS[sp.m]; if (!d || !d.ranged) continue;
      const perto = Math.min(...ents.map(e => Math.hypot(e.x - sp.x, e.y - sp.y))) - (sp.raio || 0);
      if (perto >= RAIO_CALMO) continue;
      let melhor = null, bd = 1e9; const r = Math.min(sp.raio || 0, 3); // o grupo inteiro (com o espalhamento) fica longe da entrada
      for (let i = 0; i < dist.length; i++) {
        if (dist[i] < MIN_PASSOS + r) continue; const x = i % W, y = (i / W) | 0;
        if (Math.min(...ents.map(e => Math.hypot(e.x - x, e.y - y))) < RAIO_CALMO + r) continue;
        const dd = Math.hypot(x - sp.x, y - sp.y); if (dd < bd) { bd = dd; melhor = { x, y }; }
      }
      if (melhor) { sp.x = melhor.x; sp.y = melhor.y; sp.raio = r; n++; }
    }
    if (n) m._calmaMovidos = n;
  }
  const _getMapaCalma = getMapa;
  getMapa = function (id) {
    const m = _getMapaCalma.apply(this, arguments);
    try { if (/^caca_/.test(id)) acalma(m); } catch (e) { }
    return m;
  };
  // mapa em que você já está (save aberto dentro de uma caça): arruma na próxima entrada
  // no máximo 4 chutando de longe ao mesmo tempo
  const recentes = new Map(); // uid → quando chutou
  const _projCalma = projetil;
  projetil = function (de, para, tipo, cb) {
    try {
      if (de && de.d && de.d.ranged && para === G.p && de.golpe === G.agora) {
        const ag = G.agora; for (const [k, t] of recentes) if (ag - t > JANELA_TIRO) recentes.delete(k);
        if (!recentes.has(de.uid) && recentes.size >= MAX_ATIRADORES) { de.cdRng = ag + 350 + Math.random() * 400; de.golpe = 0; return; } // espera a vez
        recentes.set(de.uid, ag);
      }
    } catch (e) { }
    return _projCalma.apply(this, arguments);
  };
  window.acalmaCaca = acalma; // (para os testes)
}
