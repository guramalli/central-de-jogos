/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🔥 POSES PRONTAS ANTES DA HORA (v319, otimização pedida pelo dono: "diminuir travamentos e lags").
   Medido numa hunt cheia: as "travadinhas" que sobravam (10 a 25 ms num quadro só) eram bonecos
   desenhados pela PRIMEIRA vez numa pose — o adversário que vira de costas pela 1ª vez, o 3º passo
   da caminhada de lado... Cada pose nova lê a folha, pinta as cores e põe os acessórios.
   Agora, nos intervalos entre um quadro e outro (quando o navegador está folgado), o jogo já prepara
   as 12 poses (frente, lado, costas × 4 passos) de quem está perto de você. Quando a pose aparece,
   já está pronta. Nada muda no desenho: é o mesmo spriteBoneco, só que adiantado.
   Carregar NO FIM.
   ============================================================ */
{
  const VISTAS = ['frente', 'lado', 'costas'];
  const fila = [], naFila = new Set();
  let ultVarre = 0;
  const chave = (look, v, q) => { try { return chaveBoneco(look) + '|S' + (v === 'costas' ? 'c' : v === 'lado' ? 'l' : 'f') + q; } catch (e) { return null; } };
  const CAP = () => SPR_MAX * 0.9; // não empurra para fora do cache o que já está em uso
  function poe(look, so) {
    if (!look || look.tipo !== 'humano') return;
    try { const f = FOLHAS[folhaDoLook(specDe(look), look)]; if (!f || !f.ok) return; } catch (e) { return; } // folha ainda chegando: depois
    for (const v of so ? [so] : VISTAS) for (let q = 0; q < (so ? 1 : 4); q++) {
      const k = chave(look, v, q); if (!k || naFila.has(k) || SPR_CACHE.has(k)) continue;
      if (SPR_CACHE.size + fila.length >= CAP()) return;
      naFila.add(k); fila.push([look, v, q, k]);
    }
  }
  // quem está perto (até ~16 quadrados), do mais perto para o mais longe: você, os adversários e os NPCs
  function varre() {
    if (!G.mapa || !G.p) return;
    const p = G.p, perto = e => e && Math.abs(e.x - p.x) < 16 && Math.abs(e.y - p.y) < 12;
    try { poe(lookJogador()); } catch (e) { }
    const lista = [...(G.mons || []), ...(G.npcs || [])].filter(perto).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
    const vistos = new Set();
    for (const e of lista) {
      const d = e._dV || e.d, look = d && d.look; // _dV: o jeito próprio de cada adversário (variedade.js)
      if (look && !vistos.has(look)) { vistos.add(look); poe(look); }
      if (e._dV && e.d && e.d.look && !vistos.has(e.d.look)) { vistos.add(e.d.look); poe(e.d.look, 'frente'); } // o retrato da lista de batalha usa o jeito "de wiki"
      if (SPR_CACHE.size + fila.length >= CAP()) return;
    }
  }
  function prepara(limite) {
    const t0 = performance.now();
    while (fila.length && performance.now() - t0 < limite) {
      const [look, v, q, k] = fila.shift(); naFila.delete(k);
      if (SPR_CACHE.has(k)) continue;
      try { spriteBoneco(look, v, q); } catch (e) { }
    }
  }
  function ciclo(dl) {
    try {
      if (!document.hidden && G.rodando !== false) {
        const ag = performance.now();
        if (ag - ultVarre > 1000) { ultVarre = ag; varre(); }
        if (fila.length) {
          if (dl && dl.timeRemaining) { if (dl.timeRemaining() > 5) prepara(Math.min(8, dl.timeRemaining() - 2)); }
          else prepara(4);
        }
      }
    } catch (e) { }
    agenda();
  }
  function agenda() {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(ciclo, { timeout: 400 });
    else setTimeout(ciclo, 50); // Safari (iPhone): um pouquinho de cada vez
  }
  agenda();
  // ao trocar de mapa: prepara já quem está lá
  const _entraAq = entrarMapa;
  entrarMapa = function () { const r = _entraAq.apply(this, arguments); ultVarre = 0; return r; };
  window.AQUECE = { fila, varre, prepara }; // (para os testes)
}
