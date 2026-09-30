/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🤿🚀 EQUIPAMENTO DE VIAGEM (v308), a pedido do dono:
   - Para descer a ATLÂNTIDA é preciso um CAPACETE DE MERGULHO; para ir ao ESPAÇO, uma ROUPA DE ASTRONAUTA.
   - Cada um se ganha numa missão: a Capitã Iara (nível 190) e a Dra. Estela (nível 290) pedem os
     materiais (itens que os adversários da faixa deixam cair) e montam o equipamento.
   - A Capitã e a Dra. Estela agora ficam na praça do aeroporto do Rio (antes, escondidas na areia), e o
     AEROPORTO de qualquer cidade mostra Atlântida e a Estação Espacial com o nível mínimo e o que falta.
   - Quem já esteve em Atlântida/no espaço antes disso recebe o equipamento automaticamente.
   Carregar NO FIM (depois de atlantida.js, espaco.js, montarias.js e europa.js).
   ============================================================ */
{
  Object.assign(ITENS, {
    capacete_mergulho: { nome: 'Capacete de Mergulho', tipo: 'chave', desc: 'Feito pela Capitã Iara. Deixa você respirar no fundo do mar: é com ele que se desce de submarino para Atlântida.' },
    traje_astronauta: { nome: 'Roupa de Astronauta', tipo: 'chave', desc: 'Feita pela Dra. Estela. Protege do frio e do vácuo do espaço: é com ela que se decola de foguete para a Estação Espacial.' },
  });
  for (const n of ['i_capacete_mergulho', 'i_traje_astronauta']) if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); }
  const xpDe = L => Math.round((xpPara(L + 1) - xpPara(L)) * 0.6);
  const Q_CAP = { id: 'iara_capacete', npc: 'capita_iara', titulo: 'O Capacete de Mergulho', lvl: 190,
    texto: 'Lá embaixo não tem ar, craque! Para descer comigo até Atlântida você precisa de um CAPACETE DE MERGULHO. Eu monto um pra você: me traga 15 Pedaços de Couro para a vedação, 10 Retalhos de Tecido para o forro e 30.000 tostões para as peças de latão. Couro e retalhos caem dos adversários de Londres (Camden e East End) e de Santos.',
    req: { itens: [['couro', 15], ['retalho', 10]], ouro: 30000 }, rec: { xp: xpDe(190), itens: [['capacete_mergulho', 1]] },
    fim: 'Prontinho, bem vedado! Com esse capacete você respira no fundo do mar. Quando quiser, é só embarcar no submarino!' };
  const Q_TRAJE = { id: 'estela_traje', npc: 'estela', titulo: 'A Roupa de Astronauta', lvl: 290,
    texto: 'No espaço faz um frio de congelar e não tem ar nenhum! Para decolar comigo você precisa de uma ROUPA DE ASTRONAUTA. Eu costuro uma: me traga 20 Tufos de Pelo de Yeti (isolamento), 10 Lençóis de Fantasma (tecido leve), 5 Escamas de Dragão (placas contra o calor da decolagem) e 150.000 tostões. Tudo isso cai nos portais de Atlântida.',
    req: { itens: [['pelo_yeti', 20], ['lencol_fantasma', 10], ['escama_dragao', 5]], ouro: 150000 }, rec: { xp: xpDe(290), itens: [['traje_astronauta', 1]] },
    fim: 'Sob medida! Com essa roupa você aguenta o frio e o vácuo. Os extraterrestres que se preparem!' };
  MISSOES.push(Q_CAP, Q_TRAJE);
  const tem = id => (typeof contaItem === 'function' ? contaItem(id) : 0) > 0 || !!(G.save && G.save.equipViagem && G.save.equipViagem[id]);

  // quem já foi antes desta versão ganha o equipamento
  // v309: só contam os personagens que existem SÓ lá. Antes entrava o Quadro de Caças (que existe em quase todo mapa):
  // quem fez missão do Quadro em qualquer cidade "já tinha ido" e ganhava o capacete sem a missão.
  function soDeLa(mapas) {
    const la = new Set(), fora = new Set(['quadro']);
    for (const id of mapas) { try { for (const n of getMapa(id).npcs) la.add(n.id); } catch (e) { } }
    for (const id of Object.keys(MAPAS_DEF)) { if (mapas.has(id) || /^caca_|^casa_|^interior/.test(id)) continue; const m = MAPAS[id]; if (m) for (const n of m.npcs || []) fora.add(n.id); }
    for (const n of fora) la.delete(n); return la;
  }
  function jaFoi(mapas, contaMapaAtual = true) {
    const s = G.save; if (!s) return false;
    if (contaMapaAtual && G.mapa && mapas.has(G.mapa.id)) return true;
    const npcs = soDeLa(mapas), deViagem = new Set(['iara_capacete', 'estela_traje']);
    return MISSOES.some(q => npcs.has(q.npc) && !deViagem.has(q.id) && s.quests[q.id]);
  }
  function mapasDe(raiz) { const set = new Set(raiz); for (const id of raiz) { try { for (const sd of getMapa(id).saidas || []) if (sd.para) set.add(sd.para); } catch (e) { } } return set; }
  let conferido = false;
  setInterval(() => {
    try {
      if (conferido || !G.save || !G.rodando) return; conferido = true; const s = G.save;
      s.equipViagem = s.equipViagem || {};
      const ATL = mapasDe(['atlantida']), ESP = mapasDe(['estacao', ...(typeof PLANETAS !== 'undefined' ? PLANETAS.map(p => p.id) : [])]);
      for (const [id, mapas, q] of [['capacete_mergulho', ATL, Q_CAP], ['traje_astronauta', ESP, Q_TRAJE]]) {
        if (tem(id) || !jaFoi(mapas)) continue;
        s.equipViagem[id] = true; if (!s.quests[q.id]) s.quests[q.id] = { s: 'feita' };
        recebeItem(id, 1); log(`🎒 Você já tinha viajado para lá: ganhou ${ITENS[id].nome}.`, 'l-loot');
      }
    } catch (e) { }
  }, 1500);

  /* ---------- a Capitã e a Dra. Estela: missão + exigência ---------- */
  function modalEquip(npc, q, item, nomeLugar, original) {
    if (tem(item)) return original(npc);
    const st = statusMissao(q), [a, b] = progressoMissao(q), d = npc.d;
    const ops = el('div', { class: 'opcoes' }); let fala = d.ola; const extras = [];
    if (st === 'pronta') { fala = 'Você trouxe tudo!'; ops.append(el('button', { class: 'btn amarelo', onclick: () => { entregaMissao(q); abrirNPCDepois(npc, q.fim); } }, `Entregar: ${q.titulo}`)); }
    else if (st === 'ativa') extras.push(el('div', { class: 'linha-item' }, el('div', { class: 'nm' }, el('b', {}, q.titulo), el('small', {}, `${descMissao(q)}${b > 1 ? ` — ${a}/${b}` : ''}`))));
    else if (st === 'disponivel') ops.append(el('button', { class: 'btn amarelo', onclick: () => modalMissao(npc, q) }, `Missão: ${q.titulo}`));
    else extras.push(el('p', {}, `(Volte no nível ${q.lvl}: eu preparo o ${ITENS[item].nome.toLowerCase()} com você.)`));
    ops.append(el('button', { class: 'btn', disabled: 'disabled' }, `🔒 Precisa de: ${ITENS[item].nome}`), el('button', { class: 'btn', onclick: fechaModal }, 'Tchau!'));
    abreModal(el('h2', {}, d.nome), el('div', { class: 'npc-topo' }, retratoNPC(npc), el('div', { class: 'fala' }, el('p', {}, fala), ...extras)),
      el('p', { class: 'dica' }, `Para ir a ${nomeLugar} você precisa de: ${ITENS[item].nome} (missão "${q.titulo}", a partir do nível ${q.lvl}).`), ops);
  }
  const _subOrig = modalSubmarino;
  modalSubmarino = function (npc) { if (npc.d.submarino !== 'descer') return _subOrig.apply(this, arguments); return modalEquip(npc, Q_CAP, 'capacete_mergulho', 'Atlântida', _subOrig); };
  const _espOrig = modalViagemEspaco;
  modalViagemEspaco = function (npc) { if (npc.d.viagemEsp !== 'decolar') return _espOrig.apply(this, arguments); return modalEquip(npc, Q_TRAJE, 'traje_astronauta', 'o espaço', _espOrig); };

  /* ---------- aeroporto: Atlântida e o espaço na lista, com o que é preciso ---------- */
  const _vooViagem = modalVoo;
  modalVoo = function (npc) {
    const r = _vooViagem.apply(this, arguments);
    try {
      const lista = document.querySelector('#modalConteudo .lista'); if (!lista) return r;
      const s = G.save;
      const linha = (emoji, nome, nivel, item, q, npcId, abre) => {
        const falta = s.nivel < nivel ? `Precisa do nível ${nivel}` : !tem(item) ? `Precisa de: ${ITENS[item].nome} (missão da ${NPCS[npcId].nome.split(',')[0]})` : '';
        const ok = s.nivel >= nivel;
        lista.append(el('div', { class: 'linha-item' + (ok ? '' : ' bloq') },
          el('div', { class: 'nm' }, el('b', {}, `${emoji} ${nome}`), el('small', {}, `A partir do nível ${nivel} · ${ITENS[item].nome}${falta ? ' — ' + falta : ' ✔'}`)),
          el('button', { class: 'btn amarelo mini', disabled: ok ? null : 'disabled', onclick: () => abre({ id: npcId, d: NPCS[npcId], x: 0, y: 0 }) }, ok ? (tem(item) ? 'Embarcar' : 'Ver missão') : '🔒')));
      };
      linha('🌊', 'Atlântida (submarino da Capitã Iara)', 195, 'capacete_mergulho', Q_CAP, 'capita_iara', modalSubmarino);
      linha('🚀', 'Estação Espacial (foguete da Dra. Estela)', 298, 'traje_astronauta', Q_TRAJE, 'estela', modalViagemEspaco);
    } catch (e) { }
    return r;
  };
}
