// Jocelino — mapa_alto_mar.js — o alto-mar com o Seu Lourival (o mergulho do Dave na versão da Vila): das 5h às 9h, sem
// chuva e fora do domingo, Cr$ 20 de óleo, o barco leva o Jocelino (1 h de viagem) a um mar aberto com cardumes; às 15h
// (ou conversando com o Lourival) volta para a praia, a tempo da janta.

const ALTO = { CONVES: { x: 12, y: 6, w: 5, h: 9 }, VOLTA: 15 * 60, OLEO: 20 };
MAPAS_DEF.alto_mar = () => {
  const b = new Construtor('alto_mar', 30, 22, 1979), C = ALTO.CONVES;
  b.fundo = 'texturas/mar';
  b.livre = { x: C.x, y: C.y, w: C.w, h: C.h };
  b.inicio = { x: C.x + 2, y: C.y + 6 };
  b.agua(0, 0, b.larg, C.y, CH.MAR); b.agua(0, C.y + C.h, b.larg, b.alt - C.y - C.h, CH.MAR);
  b.agua(0, C.y, C.x, C.h, CH.MAR); b.agua(C.x + C.w, C.y, b.larg - C.x - C.w, C.h, CH.MAR);
  b.pinta(C.x, C.y, C.w, C.h, CH.MAR);   // por baixo do barco o chão é mar (sem contorno); o convés não é água de pesca (naPonte)
  // O casco é oval: os cantos da proa e da popa, fora dele, não se pisam.
  for (const [x, y] of [[C.x, C.y], [C.x + 1, C.y], [C.x + 3, C.y], [C.x + 4, C.y], [C.x, C.y + 1], [C.x + 4, C.y + 1], [C.x, C.y + C.h - 1], [C.x + 4, C.y + C.h - 1]])
    b.solidos.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE });
  b.desenhaChao = ctx => {
    for (const c of G.cardumes || []) desenhaPe(ctx, 'fx/cardume', c.x, c.y, 0.55);
    const img = spr('objetos/barco_conves'); if (img) ctx.drawImage(img, C.x * TILE, C.y * TILE, C.w * TILE, C.h * TILE);
  };
  const lou = b.morador('lourival', 'Seu Lourival', C.x + 2, C.y + 1, DIR.BAIXO);
  lou.aoConversar = () => { perguntar('Seu Lourival: "Vamos voltar pra praia?"', ['Vamos', 'Mais um pouco'], i => { if (i === 0) voltarDoMar(); }); return true; };
  b.paredesDaBorda();
  return b;
};
// Os cardumes: 3 manchas que andam devagar pela água, em volta do barco.
function novosCardumes() {
  const f = mulberry(G.dia * 131 + 7), C = ALTO.CONVES;
  G.cardumes = Array.from({ length: 3 }, () => { let x, y; do { x = (2 + f() * 26) * TILE; y = (2 + f() * 18) * TILE; } while (x > (C.x - 1) * TILE && x < (C.x + C.w + 1) * TILE && y > (C.y - 1) * TILE && y < (C.y + C.h + 1) * TILE);
    return { x, y, vx: (f() - 0.5) * 30, vy: (f() - 0.5) * 20 }; });
}
ATUALIZADORES.push(dt => {
  if (G.mapaId !== 'alto_mar') return;
  if (!G.cardumes) novosCardumes();
  for (const c of G.cardumes) { c.x += c.vx * dt; c.y += c.vy * dt; if (c.x < 2 * TILE || c.x > 28 * TILE) c.vx *= -1; if (c.y < 2 * TILE || c.y > 20 * TILE) c.vy *= -1; }
  if (G.minutos >= ALTO.VOLTA) voltarDoMar();
});
function cardumeEm(tx, ty) { return G.mapaId === 'alto_mar' && (G.cardumes || []).some(c => Math.hypot(c.x - (tx + 0.5) * TILE, c.y - (ty + 0.5) * TILE) < 1.6 * TILE); }
function ofertaAltoMar() {
  if (G.mapaId !== 'praia') return;
  if (relogio.domingo()) { avisar('Domingo o barco descansa.'); return; }
  if (typeof Clima !== 'undefined' && Clima.chove(G.dia)) { avisar('Com essa chuva o Lourival não sai pro mar.'); return; }
  if (G.minutos < 5 * 60 || G.minutos >= 9 * 60) { avisar('O barco sai cedo, das 5h às 9h.'); return; }
  perguntar(`Seu Lourival: "Bora pro alto-mar? Cr$ ${ALTO.OLEO} do óleo. Volta às 15h, a tempo da janta."`, ['Bora!', 'Hoje não'], i => {
    if (i !== 0) return;
    if (G.dinheiro < ALTO.OLEO) { avisar(`Falta dinheiro do óleo (Cr$ ${ALTO.OLEO}).`); return; }
    G.dinheiro -= ALTO.OLEO; G.gastoHoje += ALTO.OLEO; G.minutos += 60; G.cardumes = null;
    entrarMapa('alto_mar', { x: ALTO.CONVES.x + 2, y: ALTO.CONVES.y + 6 }); sons.tocar('agua', 0.8, 0.05, -2); avisar('Mar aberto! Pesque em cima dos cardumes.'); hudSujo();
  });
}
function voltarDoMar() {
  if (G.mapaId !== 'alto_mar') return;
  if (typeof recolherLinha === 'function') recolherLinha();
  G.minutos += 60; entrarMapa('praia', { x: 14, y: 13 }); avisar('De volta à praia. Ainda dá tempo da janta.');
}

// Carregar o save no barco (ou entrar por fora do convés): o Jocelino fica no convés.
AO_ENTRAR_MAPA.push(id => {
  if (id !== 'alto_mar' || !G.jog) return;
  const C = ALTO.CONVES, p = G.jog.ladrilho();
  if (p.x < C.x || p.x >= C.x + C.w || p.y < C.y || p.y >= C.y + C.h) { G.jog.x = (C.x + 2.5) * TILE; G.jog.y = (C.y + 6) * TILE + 36; }
});
