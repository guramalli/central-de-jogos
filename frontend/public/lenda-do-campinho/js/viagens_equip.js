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
   v310: em Atlântida o boneco usa o capacete e no espaço a roupa inteira, sozinho.
   Carregar NO FIM (depois de atlantida.js, espaco.js, montarias.js, europa.js, roupas_tecidos.js e chapeus_arte.js).
   ============================================================ */
{
  Object.assign(ITENS, {
    capacete_mergulho: { nome: 'Capacete de Mergulho', tipo: 'chave', desc: 'Feito pela Capitã Iara. Deixa você respirar no fundo do mar: é com ele que se desce de submarino para Atlântida.' },
    traje_astronauta: { nome: 'Roupa de Astronauta', tipo: 'chave', desc: 'Feita pela Dra. Estela. Protege do frio e do vácuo do espaço: é com ela que se decola de foguete para a Estação Espacial.' },
  });
  for (const n of ['i_capacete_mergulho', 'i_traje_astronauta']) if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); }
  const xpDe = L => Math.round((xpPara(L + 1) - xpPara(L)) * 0.6);
  // v407 (Raio-X, textos longos): pedido curto + "📖 Saiba mais" (campo mais)
  const Q_CAP = { id: 'iara_capacete', npc: 'capita_iara', titulo: 'O Capacete de Mergulho', lvl: 190,
    texto: 'Lá embaixo não tem ar, craque! Para descer comigo até Atlântida, me traga 15 Pedaços de Couro, 10 Retalhos de Tecido e 30.000 tostões, e eu monto um Capacete de Mergulho.', mais: 'O couro serve para a vedação, os retalhos para o forro e os tostões para as peças de latão. Couro e retalhos caem dos adversários de Santos e de Londres (Camden e East End).',
    req: { itens: [['couro', 15], ['retalho', 10]], ouro: 30000 }, rec: { xp: xpDe(190), itens: [['capacete_mergulho', 1]] },
    fim: 'Prontinho, bem vedado! Com esse capacete você respira no fundo do mar. Quando quiser, é só embarcar no submarino!' };
  const Q_TRAJE = { id: 'estela_traje', npc: 'estela', titulo: 'A Roupa de Astronauta', lvl: 290,
    texto: 'No espaço não tem ar! Para decolar comigo, traga 20 Tufos de Pelo de Yeti, 10 Lençóis de Fantasma, 5 Escamas de Dragão e 150.000 tostões: eu costuro uma Roupa de Astronauta.', mais: 'No espaço faz um frio de congelar. O pelo de yeti é o isolamento, o lençol de fantasma é o tecido leve e as escamas de dragão protegem do calor da decolagem. Tudo isso cai nos portais de Atlântida.',
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

  /* ---------- v310: vestido automaticamente ----------
     No fundo do mar (Atlântida) o boneco põe o Capacete de Mergulho; no espaço (Estação, planetas e as
     caças de lá), a Roupa de Astronauta inteira: capacete de vidro, macacão branco e laranja e botas.
     Ao voltar, tira sozinho. (Os portais de Atlântida levam a mundos perdidos em terra: lá não precisa.) */
  const FUNDO_DO_MAR = new Set(['atlantida']);
  let ESPACO = null; const espaco = () => ESPACO || (ESPACO = mapasDe(['estacao', ...(typeof PLANETAS !== 'undefined' ? PLANETAS.map(p => p.id) : []), 'copa_intergalactica']));
  if (typeof CHAPEUS_ARTE !== 'undefined') Object.assign(CHAPEUS_ARTE, { capacete_mergulho: 'elmo', capacete_astro: 'elmo' });
  for (const n of ['ch_capacete_mergulho_f', 'ch_capacete_mergulho_l', 'ch_capacete_mergulho_c', 'ch_capacete_astro_f', 'ch_capacete_astro_l', 'ch_capacete_astro_c', 'tx_traje_corpo', 'tx_traje_calca', 'tx_traje_meia']) if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); }
  function vestindo() {
    if (!G.mapa || !G.save) return null;
    if (FUNDO_DO_MAR.has(G.mapa.id) && tem('capacete_mergulho')) return 'mar';
    if (espaco().has(G.mapa.id) && tem('traje_astronauta')) return 'espaco';
    return null;
  }
  const _lookVeste = lookJogador;
  lookJogador = function (retrato) {
    const L = _lookVeste.apply(this, arguments);
    try {
      const v = retrato ? null : vestindo(); if (!L || !v || L.folha) return L;
      L.chapeu = 'chapeu-cartola'; // (o recorte do boneco reserva espaço de chapéu alto)
      if (v === 'mar') L.chapeuVar = 'capacete_mergulho';
      else {
        L.chapeuVar = 'capacete_astro'; L.roupa = 'roupa-futebol'; L.corRoupa = '#f4f4f8'; L.estampa = 'tx_traje_corpo'; L.cor2 = '#ff8a2a';
        L.txCalcao = 'tx_traje_calca'; L.txCanel = 'tx_traje_meia'; L.corPe = '#ff7a1a'; delete L.pescoco;
      }
      delete L._kb;
    } catch (e) { }
    return L;
  };
  let vestiu = null;
  const _entrarVeste = entrarMapa;
  entrarMapa = function () {
    const r = _entrarVeste.apply(this, arguments);
    try {
      const v = vestindo();
      if (v !== vestiu) {
        if (v === 'mar') log('🤿 Você colocou o Capacete de Mergulho para respirar no fundo do mar.', 'l-sis');
        else if (v === 'espaco') log('👩‍🚀 Você vestiu a Roupa de Astronauta: nada de frio nem de falta de ar no espaço!', 'l-sis');
        else if (vestiu === 'mar') log('🤿 De volta à terra firme: você tirou o Capacete de Mergulho.', 'l-sis');
        else if (vestiu === 'espaco') log('👩‍🚀 De volta à Terra: você tirou a Roupa de Astronauta.', 'l-sis');
        vestiu = v;
      }
    } catch (e) { }
    return r;
  };

  /* ---------- v311: personagens temáticos ----------
     A Capitã Iara usa o traje de mergulhador completo; a Dra. Estela e todo mundo da Estação e dos planetas,
     a roupa de astronauta. Quem MORA em Atlântida (respira no fundo do mar) veste roupas do mar. */
  for (const n of ['tx_mergulho_corpo', 'tx_mergulho_cinto', 'tx_mergulho_calca', 'tx_camisa_mare', 'tx_calcao_tsunami', 'tx_camisa_coral', 'tx_camisa_abissal']) if (!ASSET_SET.has(n)) { ASSETS.push(n); ASSET_SET.add(n); }
  const TRAJE = {
    mergulho: { chapeu: 'chapeu-cartola', chapeuVar: 'capacete_mergulho', roupa: 'roupa-futebol', corRoupa: '#c8902a', estampa: 'tx_mergulho_cinto', cor2: '#6a3a1a', baixo: 'baixo-shorts', txCalcao: 'tx_mergulho_calca', txCanel: 'tx_mergulho_corpo', corPe: '#b8862a' },
    astronauta: { chapeu: 'chapeu-cartola', chapeuVar: 'capacete_astro', roupa: 'roupa-futebol', corRoupa: '#f4f4f8', estampa: 'tx_traje_corpo', cor2: '#ff8a2a', baixo: 'baixo-shorts', txCalcao: 'tx_traje_calca', txCanel: 'tx_traje_meia', corPe: '#ff7a1a' },
  };
  const veste = (id, extra) => { const d = NPCS[id]; if (!d || !d.look) return; Object.assign(d.look, extra); delete d.look.pescoco; delete d.look.mao; delete d.look._kb; };
  ['capita_iara', 'capita_atl'].forEach(id => veste(id, TRAJE.mergulho));
  ['estela', 'estela_estacao', 'torre_esp', 'loja_esp', 'lider_esp', 'piloto_lua', 'lider_lua', 'lider_marte', 'piloto_marte', 'piloto_saturno', 'lider_saturno', 'lider_nebulosa', 'piloto_nebulosa', 'piloto_copa'].forEach(id => veste(id, TRAJE.astronauta));
  // Atlântida: roupas do mar
  const mar = (id, x) => { const d = NPCS[id]; if (!d || !d.look) return; Object.assign(d.look, x); delete d.look._kb; };
  mar('lider_atl', { roupa: 'roupa-futebol', corRoupa: '#2ab8c8', estampa: 'tx_camisa_mare', cor2: '#ffffff', txCalcao: 'tx_calcao_tsunami', chapeu: 'chapeu-coroa', chapeuVar: 'coroa_estelar', pescoco: 'pescoco-havaiano', pescocoVar: 'colar_perolas', corPe: '#e8c060' });
  mar('loja_atl', { roupa: 'roupa-futebol', corRoupa: '#e05a3a', estampa: 'tx_camisa_coral', cor2: '#ffd0a0', pescoco: 'pescoco-medalha', pescocoVar: 'colar_perola' });
  mar('prof_coral', { corRoupa: '#1a5a6a', estampa: 'tx_camisa_abissal', cor2: '#7af0ff', pescoco: 'pescoco-medalha', pescocoVar: 'amuleto_lunar' });
}
