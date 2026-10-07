/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🚪 PORTAS LARGAS DAS CAÇAS (v379, dono: "os portais de entrada e saída das dungeons têm a entrada ou saída apenas por
   alguns pontos, aí acaba ficando ruim às vezes de sair da dungeon").
   O portal é um "prédio" de 3×2 todo bloqueado, com UM quadradinho de porta no meio da fileira de baixo, encaixado entre
   partes bloqueadas: era preciso acertar exatamente esse ponto, chegando de frente. Agora a FILEIRA DE BAIXO INTEIRA do
   portal é porta (mesmo destino), na entrada (na cidade) e na saída (dentro da caça).
   Carregar NO FIM (depois de world.js, cacadas.js e dos mapas).
   ============================================================ */
{
  const CACAS = () => { try { return new Set(CACADAS.map(c => c.id)); } catch (e) { return new Set(); } };
  function alarga(m) {
    if (!m || m._portasLargas || !m.predios) return; m._portasLargas = true;
    const ids = CACAS(), W = m.w;
    for (const p of m.predios) {
      if (!p.porta) continue;
      const ry = p.porta.y, orig = m.saidas.find(s => s.x === p.porta.x && s.y === ry); if (!orig) continue;
      if (!(ids.has(orig.para) || m.caca)) continue; // entrada de uma caça (na cidade) ou a saída de dentro dela
      for (let i = p.x; i < p.x + p.w; i++) {
        if (i === p.porta.x) continue;
        const k = ry * W + i; if (m.obj[k] && !m.obj[k].predio) continue; // (algo de verdade no caminho: não mexe)
        m.obj[k] = null;
        if (!m.saidas.some(s => s.x === i && s.y === ry)) m.saidas.push(Object.assign({}, orig, { x: i, y: ry }));
      }
    }
  }
  const _gmPL = getMapa;
  getMapa = function (id) {
    const novo = !MAPAS[id], m = _gmPL.apply(this, arguments);
    try { if (novo || !m._portasLargas) alarga(m); } catch (e) { console.warn('portas largas', id, e); }
    return m;
  };
  window.alargaPortas = alarga;
}
