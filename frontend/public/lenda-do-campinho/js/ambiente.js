/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🌳 AMBIENTE (v153): cidades com cara de cidade de RPG
   (inspirado nas vilas de Stardew Valley, Pokémon e Tibia):
   - praça calçada em volta de cada monumento, com dois postes na frente;
   - avenidas arborizadas: a árvore típica de cada cidade, em ritmo, nas calçadas das ruas principais;
   - cerca viva nas beiradas do mapa (o mapa "fecha" com natureza, não com o chão cortado);
   Tudo com cuidado: nada na frente de porta, placa ou pessoa, e nenhum caminho pode fechar.
   Carregar DEPOIS de ruas.js.
   ============================================================ */
const AMB_ARVORE = { cairo: 'palmeira_tamara', toquio: 'cerejeira', doha: 'palmeira_real', miami: 'palmeira_real', milao: 'cipreste', munique: 'pinheiro', paris: 'arvore', buenos: 'arvore', rio: 'coqueiro', santos: 'arvore', lisboa: 'arvore', londres: 'arvore', madri: 'arvore' };

function ambienta(m) {
  if (m.interior || m._amb) return; m._amb = true;
  const W = m.w, H = m.h, i = (x, y) => y * W + x, dentro = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const c = typeof CIDADES !== 'undefined' && CIDADES.find(k => k.id === m.id);
  const { tipo } = faixasRua(m, tiposRua(m.id)); const rua = (x, y) => dentro(x, y) && tipo[i(x, y)] > 0;
  const conta = {}; for (const t of m.chao) conta[t] = (conta[t] || 0) + 1;
  const base = +Object.keys(conta).filter(t => CH_ANDA(+t) && +t !== CH.AGUA).sort((a, b) => conta[b] - conta[a])[0];
  const naZona = (x, y) => (m.zonas || []).some(z => x >= z.x - 1 && x <= z.x + z.w && y >= z.y - 1 && y <= z.y + z.h);
  const noCampo = (x, y) => m.campos.some(f => x >= f.x - 1 && x <= f.x + f.w && y >= f.y - 1 && y <= f.y + f.h);
  const debaixoPredio = (x, y) => m.predios.some(p => x >= p.x - 1 && x <= p.x + p.w && y >= p.y - 1 && y <= p.y + p.h + 1);
  const pertoDeGente = (x, y, r) => m.npcs.some(n => Math.abs(n.x - x) <= r && Math.abs(n.y - y) <= r) || m.saidas.some(s => Math.abs(s.x - x) <= r && Math.abs(s.y - y + (s.porta ? 1 : 0)) <= r)
    || m.placas.some(p => Math.abs(p.x - x) <= 1 && Math.abs(p.y - y) <= 1) || m.pontos.some(p => Math.abs(p.x - x) <= r && Math.abs(p.y - y) <= r)
    || m.spawns.some(s => s.qtd === 1 && Math.abs(s.x - x) <= 2 && Math.abs(s.y - y) <= 2); // o chefão precisa de espaço
  const livre = (x, y) => dentro(x, y) && x > 0 && y > 0 && x < W - 1 && y < H - 1 && !m.obj[i(x, y)] && CH_ANDA(m.chao[i(x, y)]) && m.chao[i(x, y)] !== CH.AGUA && !rua(x, y);
  const vizinhosVazios = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const o = dentro(x + dx, y + dy) && m.obj[i(x + dx, y + dy)]; if (o && o.t !== 'x') return false; } return true; };
  // o que não pode ficar sem acesso
  const inicio = m.renasce || m.inicio || { x: W >> 1, y: H >> 1 };
  const antes = alcancaveis(m, inicio), importantes = pontosImportantes(m).filter(pt => antes[pt.y * W + pt.x]);
  const poe = [];
  const tenta = (x, y, t) => { if (!livre(x, y)) return false; m.obj[i(x, y)] = { t, v: (hash2(x, y) * 1000) | 0 }; poe.push([x, y]); return true; };
  const confere = () => { // se algo fechou caminho, tira o que foi posto por último até abrir
    let d = alcancaveis(m, inicio);
    while (poe.length && !importantes.every(pt => d[pt.y * W + pt.x])) { const [x, y] = poe.pop(); m.obj[i(x, y)] = null; d = alcancaveis(m, inicio); }
    poe.length = 0;
  };

  // 1) praça em volta dos monumentos
  const piso = (c && c.rua === CH.PEDRA) || base === CH.PEDRA ? CH.CALCADA : CH.PEDRA;
  for (const p of m.predios.filter(p => p.monumento)) {
    for (let y = p.y - 1; y <= p.y + p.h + 1; y++) for (let x = p.x - 2; x <= p.x + p.w + 1; x++)
      if (dentro(x, y) && CH_ANDA(m.chao[i(x, y)]) && m.chao[i(x, y)] !== CH.AGUA && !rua(x, y) && !noCampo(x, y) && !m.predios.some(q => q !== p && x >= q.x && x < q.x + q.w && y >= q.y && y < q.y + q.h)) m.chao[i(x, y)] = piso;
    for (const x of [p.x - 2, p.x + p.w + 1]) { const y = p.y + p.h + 1; if (!m.placas.some(pl => Math.abs(pl.x - x) <= 1 && Math.abs(pl.y - y) <= 1)) tenta(x, y, 'poste3'); }
  }
  confere();

  // 2) avenidas arborizadas (calçada colada na rua, a cada 5 quadros, longe de cruzamento, porta e gente)
  const arv = AMB_ARVORE[m.id] || (c && c.arvores && c.arvores[0]) || 'arvore';
  const perto3 = (x, y) => { for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (dentro(x + dx, y + dy) && tipo[i(x + dx, y + dy)] === 3) return true; return false; };
  const porta = (x, y) => m.predios.some(p => p.porta && Math.abs(p.porta.x - x) <= 2 && y >= p.porta.y && y <= p.porta.y + 3);
  const calcadas = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const k = i(x, y); if (tipo[k] !== 1 && tipo[k] !== 2) continue;
    const viz = tipo[k] === 1 ? [[x, y - 1], [x, y + 1]] : [[x - 1, y], [x + 1, y]];
    for (const [a, b] of viz) if (!rua(a, b) && ((tipo[k] === 1 ? x : y) % 5 === 2)) calcadas.push([a, b]);
  }
  for (const [x, y] of calcadas) {
    if (!livre(x, y) || naZona(x, y) || noCampo(x, y) || debaixoPredio(x, y) || perto3(x, y) || porta(x, y) || pertoDeGente(x, y, 2) || !vizinhosVazios(x, y)) continue;
    if (m.chao[i(x, y)] !== base && m.chao[i(x, y)] !== (c && c.cais)) continue; // só na calçada comum
    tenta(x, y, arv);
  }
  confere();

  // 3) cerca viva nas beiradas (2ª fileira; a 1ª é a parede invisível)
  for (let x = 1; x < W - 1; x++) for (const y of [1]) if (!naZona(x, y) && !pertoDeGente(x, y, 3) && !debaixoPredio(x, y)) tenta(x, y, x % 6 === 3 ? arv : 'arbusto');
  for (let y = 2; y < H - 1; y++) for (const x of [1, W - 2]) if (!naZona(x, y) && !pertoDeGente(x, y, 3) && !debaixoPredio(x, y) && m.chao[i(x, y + 1)] !== CH.AGUA) tenta(x, y, y % 6 === 3 ? arv : 'arbusto');
  confere();

  delete m._chao; // o chão mudou
}
for (const id of Object.keys(AMB_ARVORE)) {
  const base = MAPAS_DEF[id]; if (!base) continue;
  MAPAS_DEF[id] = function () { const m = base(); try { ambienta(m); } catch (e) { console.error('ambiente', id, e); } return m; };
}
