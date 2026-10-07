/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🧺 MISSÕES DE COLEÇÃO (v287): os itens que os adversários deixam cair agora são PEDIDOS em missões.
   Antes, 41 dos 67 itens de drop só serviam para vender (quase todos das cavernas de Atlântida e do espaço,
   que acabavam "passando batido"). Agora cada um tem DUAS missões:
   - COLEÇÃO: 10 unidades · ENCOMENDA GRANDE: 25 unidades (v407 Raio-X A3; eram 20 e 50) (libera depois da primeira), com prêmio maior + fios de ouro.
   Quem pede: em Atlântida, o PROFESSOR CORAL (colecionador, novo); nos planetas, o técnico de cada um;
   nas cidades, o líder do bairro (Paris, Buenos Aires, Rio e Santos).
   O texto de cada missão diz quem deixa cair o item e em que caverna.
   Carregar NO FIM (depois de atlantida.js, espaco.js, cidades.js, cacadas.js).
   ============================================================ */
{
  // Professor Coral: o colecionador de Atlântida
  NPCS.prof_coral = { nome: 'Professor Coral, the collector', ola: 'Hello, young star! I study EVERYTHING in the caves of Atlantis. Bring me what the opponents drop and I\'ll pay well for my collection!',
    look: { tipo: 'humano', corpo: 'm', alt: 1.72, pele: 'pele-clara', cabelo: 'cabelo-curto', corCabelo: 'grisalho', roupa: 'roupa-jaleco', baixo: 'baixo-jeans', rosto: 'rosto-redondos' } };
  if (MAPAS_DEF.atlantida) { const base = MAPAS_DEF.atlantida; MAPAS_DEF.atlantida = function () { const m = base.apply(this, arguments); try { if (typeof poeNpcPerto === 'function') poeNpcPerto(m, 'prof_coral', 'lider_atl'); } catch (e) { console.error('coral', e); } return m; }; }

  const QUEM_PEDE = { atlantida: 'prof_coral', lua: 'lider_lua', marte: 'lider_marte', saturno: 'lider_saturno', nebulosa: 'lider_nebulosa' };
  const FALA = {
    prof_coral: ['My deep-sea collection needs', 'I\'m building a museum in Atlantis and I\'m missing'],
    lider_lua: ['The Moon scientists want to study', 'For our lunar lab, I need'],
    lider_marte: ['The Mars engineers asked for', 'To fix the Mars base, I need'],
    lider_saturno: ['Saturn\'s rings hold secrets! I need', 'My observatory needs'],
    lider_nebulosa: ['The Nebula is full of mysteries. Bring', 'For the Nebula star map, I need'],
    lider_paris: ['A museum in Paris wants to display', 'The Montmartre artists want'],
    lider_buenos: ['The San Telmo Fair wants to sell', 'The tango musicians asked for'],
    lider_rio: ['The samba school wants', 'For Carnival, we need'],
    lider_santos: ['The Coffee Museum wants', 'The port warehouses asked for'],
  };
  const CIDADE_ITENS = { boina: 'lider_paris', mini_eiffel: 'lider_paris', bandoneon: 'lider_buenos', insignia_estrela: 'lider_buenos', pandeiro: 'lider_rio', bandeira_verde: 'lider_rio', saca_cafe: 'lider_santos' };

  // o que já é pedido em alguma missão (esses ficam de fora)
  const pedidos = new Set(); MISSOES.forEach(q => JSON.stringify(q.req || {}).replace(/"([a-z0-9_]+)"/g, (m, g) => { pedidos.add(g); return m; }));
  const quemDeixa = id => Object.entries(MONSTROS).filter(([k, d]) => !d.chefe && !d.treino && (d.loot || []).some(l => l[0] === id)).map(([k, d]) => ({ k, d, nv: nivelMonstro(d) })).sort((a, b) => a.nv - b.nv);
  const cacaDe = m => CACADAS.find(c => c.m === m);
  const xpNv = L => Math.max(100, (xpPara(L + 1) - xpPara(L)) || 100);
  let n = 0;
  for (const [id, it] of Object.entries(ITENS)) {
    if (it.tipo !== 'loot' || pedidos.has(id) || it.trofeuArena || it.cacador) continue;
    const fontes = quemDeixa(id); if (!fontes.length) continue;
    const f = fontes[0], L = f.nv, c = cacaDe(f.k);
    const npc = CIDADE_ITENS[id] || (c && QUEM_PEDE[c.host]); if (!npc || !NPCS[npc]) continue;
    const onde = `Who drops it: ${f.d.nome}${c ? ` (${c.nome})` : fontes[1] ? ` e ${fontes[1].d.nome}` : ''}.`;
    const fala = FALA[npc] || ['I need', 'Bring'];
    const base = `col_${id}`;
    MISSOES.push(
      { id: base + '_1', npc, titulo: `Collection: ${it.nome}`, lvl: Math.max(1, L - 3), texto: `${fala[0]} 10× ${it.nome}. ${onde}`, req: { itens: [[id, 10]] }, /* v407 (Raio-X A3): eram 20 */
        rec: { xp: Math.round(xpNv(L) * 0.6), ouro: L * 300 }, fim: `How lovely! My collection of ${it.nome} is growing. If you bring more, I have a big order!` },
      { id: base + '_2', npc, titulo: `Big order: ${it.nome}`, lvl: Math.max(1, L - 3), pre: base + '_1', texto: `${fala[1]} 25× ${it.nome} — it’s a big order, but the prize is worth it! ${onde}`, req: { itens: [[id, 25]] }, /* v407 (Raio-X A3): eram 50 */
        rec: { xp: Math.round(xpNv(L) * 1.5), ouro: L * 800, itens: [['fio_ouro', Math.max(1, Math.round(L / 60))]] }, fim: `Amazing! 25× ${it.nome}! Nobody has ever brought me this many. Take these gold threads to the Forge!` });
    n += 2;
  }
  window.COLECAO_MISSOES = n; // (para os testes)
}
