/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🇧🇷 RIO DE JANEIRO — PILOTO DAS CIDADES (v407, Raio-X A7). Antes de mexer nas outras cidades, o dono vê o Rio:
   - TERMINAL DE CHEGADA com a cara do país: piso de pedra portuguesa (as ondas pretas e brancas de Copacabana),
     palmeiras em vaso, bandeirinhas, banca de coco, açaí, bancos, orelhão e a placa de boas-vindas;
   - PRAÇA TIRADENTES preenchida: pedra portuguesa, feirinha (pastel, flores, milho, açaí), canteiros, árvores e bancos;
   - MONUMENTOS em escala de marco (2× maiores) e SEM o quadrado cinza em volta: o Cristo no alto da Floresta da Tijuca
     (gramado e trilha de terra até ele) e o Pão de Açúcar saindo do mar, no fim da praia.
   Tudo passa pelo crivo de mapas: só entra em quadro livre, longe de porta/NPC/placa, fora da rua, e se algum caminho
   fechar o enfeite sai (alcancaveis/pontosImportantes, como ambiente.js).
   Prefixo: rpi. Carregar no FIM do index.html (embrulha MAPAS_DEF.rio por último).
   ============================================================ */
const RPI_MON = { mon_cristo: { w: 11, h: 5 }, mon_paodeacucar: { w: 14, h: 5 } }; // antes 6×4 e 8×4
// v407 (pedido do dono): a pedra portuguesa do terminal e da praça estava forte demais e competia com os bonecos. Chão próprio
// e SUAVE: o mesmo desenho de Copacabana com bem menos contraste (o preto virou cinza-bege médio, o branco virou creme), ondas um
// pouco menores e um leve desfoque — artes feitas por código a partir de t_calcada_pt e t2_calcada_pt
// (a/t_calcada_pt_suave_v407.webp nas cidades; a/t2_calcada_pt_suave_v407.webp no chão novo). O calçadão da praia e Lisboa continuam com a pedra portuguesa de sempre.
CH.CALCADA_PT_SUAVE = 140;
if (typeof ESTILO_CHAO !== 'undefined' && ESTILO_CHAO[CH.CALCADA_PT]) ESTILO_CHAO[CH.CALCADA_PT_SUAVE] = Object.assign({}, ESTILO_CHAO[CH.CALCADA_PT], { cor: '#d6ccb8', borda: '#9a9080', o: (ESTILO_CHAO[CH.CALCADA_PT].o || 6.5) + 0.01 });
if (typeof TEX_CHAO !== 'undefined') TEX_CHAO[CH.CALCADA_PT_SUAVE] = 't_calcada_pt_suave_v407'; // (as cidades usam esta: 320 px = 2,5 quadros, com o desenho 2×2 dentro — ondas ~37% menores)
if (typeof CH_MINI !== 'undefined') CH_MINI[CH.CALCADA_PT_SUAVE] = '#d6ccb8';
if (typeof CHAO2 !== 'undefined') { CHAO2.tex[CH.CALCADA_PT_SUAVE] = ['t2_calcada_pt_suave_v407', 4]; CHAO2.piso.add(CH.CALCADA_PT_SUAVE); }
// v407.2 (dono: "essa praça em Copacabana era para ficar com o piso assim mesmo?" — cinza liso): as texturas novas precisam
// estar na lista de artes; desde a v407 (A2/A8) o chão só baixa e desenha texturas que estão em ASSET_SET
if (typeof ASSETS !== 'undefined' && typeof ASSET_SET !== 'undefined') for (const n of ['t_calcada_pt_suave_v407', 't2_calcada_pt_suave_v407']) if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); }
(function () {
  if (typeof MONUMENTOS === 'undefined' || !MONUMENTOS.rio || typeof CIDADES_NOVAS === 'undefined' || !CIDADES_NOVAS.rio) return;
  for (const d of MONUMENTOS.rio) {
    const n = RPI_MON[d.spr]; if (!n) continue;
    Object.assign(d, n);
    const W = d.w + 0.5, H = W * d.ar; // (mesma conta de monumentos.js)
    PORTAS[d.spr] = { x: d.w % 2 ? 0.5 : 0.5 + 0.5 / W, y: 1 - 0.3 / H };
    d.alto = Math.max(0, Math.ceil(H * 0.97 - d.h));
  }
  // ---------- 1) no desenho da cidade: lotes dos monumentos, ilha do Pão de Açúcar e trilha do Cristo ----------
  const _rioBase = CIDADES_NOVAS.rio;
  CIDADES_NOVAS.rio = function (b, c, K) {
    const r = _rioBase.apply(this, arguments);
    const m = b.m, i = (x, y) => y * m.w + x;
    const limpa = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x > 0 && y > 0 && x < m.w - 1 && y < m.h - 1) { const o = m.obj[i(x, y)]; if (o && !o.predio) m.obj[i(x, y)] = null; } };
    // Cristo: base 11×5 (x 11–21, y 15–19), o desenho sobe até y 3. Gramado em volta e a trilha de terra só NA FRENTE.
    K.chao(14, 15, 3, 12, CH.GRAMA); K.chao(15, 20, 3, 7, CH.TERRA);
    limpa(10, 2, 22, 20); K.mon('mon_cristo', 16, 19);
    m.lotes.caca_cristal = { x: 25, y: 21 };                    // a gruta sai do pé do morro
    // Pão de Açúcar: sai do MAR no fim da praia — a base 14×5 (x 83–96, y 68–72) fica numa ilha (o desenho já tem as pedras
    // e a água em volta); uma prainha estreita (x 81–82) leva da areia até a placa, no pé do morro, como a Praia Vermelha
    K.chao(81, 67, 17, 7, CH.AGUA); K.chao(81, 65, 2, 8, CH.AREIA); // (debaixo da base fica água: o desenho já traz as pedras)
    // v408.2 (dono): a placa e a frente do morro ficavam dentro da água (não dava para chegar). O morro sobe 1 fileira
    // (base y 67–71) e na frente dele fica a PRAIA VERMELHA, uma faixa de areia (y 72) que liga a prainha até o pé do morro.
    K.chao(81, 72, 13, 1, CH.AREIA);
    limpa(80, 60, 98, 73); K.mon('mon_paodeacucar', 90, 71);
    return r;
  };
  // ---------- 2) depois de tudo (monumentos, ambiente, Atlântida, espaço, Multiverso): pisos e enfeites ----------
  const _mapaRio = MAPAS_DEF.rio;
  MAPAS_DEF.rio = function () {
    const m = _mapaRio.apply(this, arguments);
    try { rpiArruma(m); } catch (e) { console.error('rio piloto', e); }
    return m;
  };
})();

function rpiArruma(m) {
  if (m._rpi) return; m._rpi = true;
  const W = m.w, H = m.h, i = (x, y) => y * W + x, dentro = (x, y) => x > 0 && y > 0 && x < W - 1 && y < H - 1;
  // o quadrado cinza que o ambiente.js põe em volta de cada monumento: no Rio volta a ser gramado (Cristo) e areia (Pão de Açúcar)
  for (const p of m.predios.filter(p => p.monumento)) {
    const natural = p.spr === 'mon_cristo' ? CH.GRAMA : p.spr === 'mon_paodeacucar' ? CH.AREIA : null; if (natural == null) continue;
    for (let y = p.y - 1; y <= p.y + p.h + 1; y++) for (let x = p.x - 2; x <= p.x + p.w + 1; x++) if (dentro(x, y) && (m.chao[i(x, y)] === CH.PEDRA || m.chao[i(x, y)] === CH.CALCADA)) m.chao[i(x, y)] = natural;
    for (const x of [p.x - 2, p.x + p.w + 1]) { const y = p.y + p.h + 1; const o = dentro(x, y) && m.obj[i(x, y)]; if (o && o.t === 'poste3') m.obj[i(x, y)] = null; }
    if (p.spr === 'mon_cristo') for (let y = p.y + p.h; y < 27; y++) for (let x = 15; x <= 17; x++) if (dentro(x, y) && m.chao[i(x, y)] === CH.GRAMA) m.chao[i(x, y)] = CH.TERRA;
  }
  // pisos de pedra portuguesa: o terminal de chegada (x 2–30, y 43–50) e a Praça Tiradentes (x 34–53, y 31–39)
  const piso = (x0, y0, w, h, de) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (dentro(x, y) && de.includes(m.chao[i(x, y)])) m.chao[i(x, y)] = CH.CALCADA_PT_SUAVE; };
  piso(2, 43, 29, 8, [CH.CALCADA, CH.PEDRA]); piso(34, 31, 20, 9, [CH.PEDRA, CH.CALCADA]);
  // enfeites: só em quadro livre, fora da rua, longe de porta/NPC/placa/saída, e sem fechar caminho
  const inicio = m.renasce || m.inicio || { x: W >> 1, y: H >> 1 };
  const antes = alcancaveis(m, inicio), importantes = pontosImportantes(m).filter(pt => antes[pt.y * W + pt.x]);
  const pertoDe = (x, y, r) => m.npcs.some(n => Math.abs(n.x - x) <= r && Math.abs(n.y - y) <= r) || m.saidas.some(s => Math.abs(s.x - x) <= r && Math.abs(s.y - y + (s.porta ? 1 : 0)) <= r)
    || m.placas.some(p => Math.abs(p.x - x) <= 1 && Math.abs(p.y - y) <= 1) || m.pontos.some(p => Math.abs(p.x - x) <= r && Math.abs(p.y - y) <= r)
    || (m.inicio && Math.abs(m.inicio.x - x) <= 1 && Math.abs(m.inicio.y - y) <= 1) || (m.renasce && Math.abs(m.renasce.x - x) <= 1 && Math.abs(m.renasce.y - y) <= 1)
    || m.predios.some(p => p.porta && Math.abs(p.porta.x - x) <= 1 && y >= p.porta.y && y <= p.porta.y + 2);
  const livre = (x, y, larg = 1) => { const meia = Math.floor(larg / 2); for (let k = -meia; k <= meia; k++) { const a = x + k; if (!dentro(a, y) || m.obj[i(a, y)] || m.chao[i(a, y)] !== CH.CALCADA_PT_SUAVE) return false; } return true; };
  const postos = [];
  const poe = (x, y, t, larg = 1) => {
    if (!livre(x, y, larg)) return false;
    for (let k = -(larg >> 1); k <= (larg >> 1); k++) if (pertoDe(x + k, y, 1)) return false; // nada colado em NPC, placa, porta ou saída
    const meia = Math.floor(larg / 2); m.obj[i(x, y)] = { t, v: (hash2(x, y) * 1000) | 0 }; const tiles = [i(x, y)];
    for (let k = 1; k <= meia; k++) { m.obj[i(x - k, y)] = { t: 'x', v: 0 }; m.obj[i(x + k, y)] = { t: 'x', v: 0 }; tiles.push(i(x - k, y), i(x + k, y)); }
    postos.push(tiles); return true;
  };
  const confere = () => { let d = alcancaveis(m, inicio); while (postos.length && !importantes.every(pt => d[pt.y * W + pt.x])) { for (const k of postos.pop()) m.obj[k] = null; d = alcancaveis(m, inicio); } postos.length = 0; };
  // TERMINAL: palmeiras em vaso na beirada de cima e de baixo, bandeirinhas, banca de coco, açaí, bancos e orelhão
  for (const x of [3, 13, 17, 25, 29]) poe(x, 43, 'palmeira_vaso');
  for (const x of [3, 7, 11, 19, 23, 27]) poe(x, 50, 'palmeira_vaso');
  poe(9, 50, 'canteiro'); poe(21, 50, 'canteiro'); poe(13, 50, 'canteiro');
  poe(16, 50, 'bandeirinhas', 3) || poe(16, 44, 'bandeirinhas', 3); poe(25, 50, 'bandeirinhas', 3) || poe(24, 44, 'bandeirinhas', 3);
  poe(5, 48, 'banca_coco', 3); poe(25, 43, 'carrinho_acai') || poe(24, 44, 'carrinho_acai');
  poe(17, 48, 'banco_jardim'); poe(20, 48, 'banco_jardim'); poe(29, 47, 'orelhao'); poe(2, 47, 'bicicletario');
  confere();
  // PRAÇA TIRADENTES: feirinha na beirada de baixo, carrinhos, canteiros em volta do chafariz, árvores e bancos virados para ele
  for (const [x, y, t, l] of [[37, 38, 'barraca_pastel', 1], [40, 38, 'carrinho_flores', 1], [48, 38, 'carrinho_milho', 1], [51, 38, 'carrinho_acai', 1],
    [41, 33, 'canteiro', 1], [47, 33, 'canteiro', 1], [41, 37, 'canteiro', 1], [47, 37, 'canteiro', 1],
    [35, 32, 'arvore', 1], [52, 32, 'arvore', 1], [35, 36, 'arvore', 1], [52, 36, 'arvore', 1],
    [42, 35, 'banco_jardim', 1], [46, 35, 'banco_jardim', 1], [39, 31, 'palmeira_vaso', 1], [49, 31, 'palmeira_vaso', 1]]) poe(x, y, t, l);
  confere();
  // placa de boas-vindas no terminal (texto curto para crianças)
  if (!m.placas.some(p => /BEM-VINDO AO RIO/.test(p.texto))) for (const [x, y] of [[13, 48], [12, 49], [16, 50]]) if (livre(x, y) && !pertoDe(x, y, 0)) { m.obj[i(x, y)] = { t: 'placa', v: 1 }; m.placas.push({ x, y, texto: '🇧🇷 BEM-VINDO AO RIO DE JANEIRO! O chão é de pedra portuguesa: as ondas lembram o mar de Copacabana.' }); break; }
  delete m._chao; delete m._chaoV; // o chão mudou
}
