// Jocelino — mapa_praia.js — a praia da Vila Maré (jogo/mundo/mapa_praia.gd): areia, o mar (y ≥ 16), o píer comprido
// (x 30–31 até y 22), a banca e o barco do Seu Lourival, guarda-sóis, coqueiros e o lote à beira-mar com a placa de
// "vende-se" (o futuro da barraca da Rosa). No verão, guarda-sóis abertos e gente da Vila na areia; no inverno, vazia.

const PRAIA = { MAR_Y: 16, PIER_X: 30, PIER_FIM: 22 };

MAPAS_DEF.praia = () => {
  const b = new Construtor('praia', 40, 24, 1977);
  b.fundo = 'texturas/areia';
  b.livre = { x: 2, y: 2, w: 36, h: 21 };          // a areia (y 2..15) e o píer (até y 22)
  b.inicio = { x: 22, y: 3 };
  b.saida(22, 2, 2, 1, 'vila', 23, 22);
  // O mar, recortado no píer (andável por cima das tábuas).
  const { MAR_Y, PIER_X, PIER_FIM } = PRAIA;
  b.agua(0, MAR_Y, PIER_X, b.alt - MAR_Y, CH.MAR);
  b.agua(PIER_X + 2, MAR_Y, b.larg - PIER_X - 2, b.alt - MAR_Y, CH.MAR);
  b.agua(PIER_X, PIER_FIM + 1, 2, b.alt - PIER_FIM - 1, CH.MAR);
  b.pinta(PIER_X, MAR_Y, 2, PIER_FIM - MAR_Y + 1, CH.MAR);   // por baixo do píer o chão é mar (a pesca da ponta, na etapa 4)
  // O píer é chão: desenhado antes de tudo de pé, por cima do mar.
  b.desenhaChao = ctx => { const img = spr('objetos/pier_longo'); if (img) ctx.drawImage(img, PIER_X * TILE, (MAR_Y - 1) * TILE, 2 * TILE, (PIER_FIM - MAR_Y + 2) * TILE); };
  // Bordas: coqueiros em cima e dos lados.
  for (let x = 0; x <= b.larg; x += 3) if (x < 21 || x > 24) b.enfeite('objetos/coqueiro', x, 1, false);
  for (let y = 3; y < MAR_Y; y += 3) { b.enfeite('objetos/coqueiro', 0, y, false); b.enfeite('objetos/coqueiro', b.larg - 1, y, false); }
  // A banca e o barco do Seu Lourival.
  b.interativo('banca_peixe', 'objetos/banca_peixe', 7, 7, 3, 1, [44, 8]).acao = () => (typeof abrirBanca === 'function' ? abrirBanca() : abrirPlaca('A banca do Lourival.'));
  b.enfeite('objetos/barco_lourival', 14, 14, true, 44, 12);
  const lou = b.morador('lourival', 'Seu Lourival', 9, 9, DIR.BAIXO);
  lou.aoConversar = () => { if (typeof conversarLourival === 'function') return conversarLourival(lou); return false; };

  // O lote à beira-mar (a barraca da Rosa, um dia).
  b.interativo('lote_praia', 'objetos/placa_loteamento', 33, 9, 1, 1, [10, 6]).acao = () =>
    abrirPlaca('"Vende-se: lote à beira-mar." A Rosa sonha com uma barraca de pastel e caldo de cana aqui. Um dia...');
  for (const t of [[17, 5], [5, 13], [27, 4]]) b.enfeite('objetos/coqueiro', t[0], t[1], true, 10);
  b.paredesDaBorda();
  return b;
};
// Verão e primavera: guarda-sóis abertos; verão sem chuva: gente da Vila na areia. Troca ao entrar na praia.
function poeEstacaoDaPraia(b) {
  for (const o of b.objs.filter(o => o.estacao)) b.tirar(o);
  b.moradores = b.moradores.filter(m => !m.banhista);
  const est = relogio.estacao(), chove = typeof Clima !== 'undefined' && Clima.chove(G.dia);
  if (est === 2 || est === 3) for (const t of [[25, 9], [34, 12], [20, 12]]) { const o = b.enfeite('objetos/guarda_sol', t[0], t[1], true, 10); o.estacao = true; }
  if (est === 3 && !chove) for (const [id, nome, x, y] of [['ze', 'Zé', 21, 13], ['zelia', 'Dona Zélia', 26, 11]])
    Object.assign(b.morador(id, nome, x, y, DIR.BAIXO, { vagueia: true, area: { x: (x - 3) * TILE, y: (y - 1) * TILE + 42, w: 6 * TILE, h: 2 * TILE } }), { banhista: true });
}
AO_MONTAR.push(b => { if (b.id === 'praia') poeEstacaoDaPraia(b); });
AO_ENTRAR_MAPA.push(id => { if (id === 'praia') poeEstacaoDaPraia(G.mapa); });
