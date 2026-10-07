/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🌟 AGÊNCIA 3.0 — ETAPA 8: REPUTAÇÃO E A PONTE COM O RPG (v343). Do documento do dono:
   - Títulos para o perfil ("Descobridor de joias", "Agente internacional"...), com banner na hora.
   - As LENDAS DA AGÊNCIA aparecem no RPG: elas visitam o escritório na Vila e vendem as melhores garrafas de fôlego
     e de foco do seu nível com 20% de desconto (a "loja da Lenda").
   - Ouro das comissões (já vai para os seus tostões), lembranças temáticas no armazém (etapa 6) e troféus no escritório.
   - Os profissionais da sua agência aparecem no Mercado do seu clube (modo Time), na escala do clube.
   Carregar DEPOIS de agencia_eventos.js.
   ============================================================ */
const AGM_TITULOS_V3 = [ // [id, nome, como conquistar, (a) => feito]
  ['joias', '💎 Gem Finder', 'Sign a kid with a real potential of 4★ or more.', a => (a.marcos.joias || 0) >= 1],
  ['peneiras', '🏟️ Tryout King', 'Get 10 approvals at tryouts or trials.', a => a.marcos.aprovados >= 10],
  ['empresario', '💼 A Real Agent', 'Land 5 professional contracts.', a => a.marcos.contratos >= 5],
  ['internacional', '🌍 International Agent', 'Sell a player to Europe.', a => a.lendas.length >= 1],
  ['paises', '🗺️ Agent Without Borders', 'Sell players to clubs in 3 countries.', a => Object.keys(a.paises || {}).length >= 3],
  ['formador', '🌟 Legend Maker', 'Develop 3 Agency Legends.', a => a.lendas.length >= 3],
];
function agmTitulosV3(a, lin) {
  a = a || agDados(); if (!a) return; a.titulos = a.titulos || {};
  for (const [id, nome] of AGM_TITULOS_V3) if (!a.titulos['v3_' + id] && AGM_TITULOS_V3.find(t => t[0] === id)[3](a)) {
    a.titulos['v3_' + id] = a.semana || 1; agmGanhaRep(a, 2);
    try { banner(nome, 'Agent title earned!'); som('nivel'); } catch (e) { }
    const t = `🏆 Title earned: ${nome}! (reputation +2)`; if (lin) lin(t, 1); else log(t, 'l-lvl');
  }
}
AGM_GANCHOS_SEMANA.push((a, lin) => agmTitulosV3(a, lin));
// descobridor de joias: assinar um garoto de potencial real 4★+
{ const _assina = agmAssinaContrato; agmAssinaContrato = function (j) { const r = _assina.apply(this, arguments); try { const a = agDados(); if (j.P >= 4) a.marcos.joias = (a.marcos.joias || 0) + 1; agmTitulosV3(a); } catch (e) { } return r; }; }

/* ---------- as Lendas no escritório (e a loja delas, com desconto) ---------- */
const AGM_LENDA_POS = [[4, 6], [8, 6], [10, 6]];
for (let k = 0; k < AGM_LENDA_POS.length; k++) NPCS['ag_lenda_' + k] = { nome: 'Agency Legend', look: AG_LOOK.olheiro, agLenda: k, ola: 'Hey, boss!' };
function agmEscritorioLendas(mapa) {
  const a = AGM_ATIVO && G.save && agDados(), ls = a && a.v === AGM_VERSAO ? a.lendas.slice(-AGM_LENDA_POS.length) : [];
  ls.forEach((L, k) => Object.assign(NPCS['ag_lenda_' + k], { nome: `🌟 ${L.nome}, Agency Legend`, look: { ...L.look, roupa: 'roupa-futebol', corRoupa: '#f4f4f8', alt: 1.74 }, lendaId: L.id,
    ola: `Boss! I came from ${AGM_REGIOES[L.regiao] ? AGM_REGIOES[L.regiao][0].replace(/^\S+\s/, '').toLowerCase() : 'sandlot'} and today I play for ${L.clube} (${L.pais}). I'll never forget who discovered me. If you need bottles, I'll give you a friend's price!` }));
  const m = mapa || (typeof MAPAS !== 'undefined' && MAPAS.agencia_escritorio); if (!m) return;
  m.npcs = m.npcs.filter(n => !/^ag_lenda_/.test(n.id)).concat(ls.map((L, k) => ({ id: 'ag_lenda_' + k, x: AGM_LENDA_POS[k][0], y: AGM_LENDA_POS[k][1] })));
}
{
  const _mapaEsc = MAPAS_DEF.agencia_escritorio;
  MAPAS_DEF.agencia_escritorio = function () { const m = _mapaEsc.apply(this, arguments); try { agmEscritorioLendas(m); } catch (e) { } return m; };
  const _iniLendas = iniciarJogo;
  iniciarJogo = async function (...x) { const r = await _iniLendas.apply(this, x); try { agmEscritorioLendas(); } catch (e) { } return r; };
  const _abrirNPCLenda = abrirNPC;
  abrirNPC = function (npc) { const d = npc && npc.d; if (d && d.agLenda != null) return agmLojaLenda(d); return _abrirNPCLenda.apply(this, arguments); };
  const _ico = iconeNPC; iconeNPC = function (n) { const d = (n && (n.d || NPCS[n.id])) || {}; return d.agLenda != null ? '🌟' : _ico.apply(this, arguments); };
}
function agmLojaLenda(d) {
  const s = G.save, ids = [tarMelhor('hp'), tarMelhor('foco')].filter(Boolean);
  const preco = id => Math.max(1, Math.round((ITENS[id].preco || 100) * 0.8));
  const ret = mkCanvas(96, 120); [0, 400, 1500].forEach(ms => setTimeout(() => { try { pintaAparencia(ret, d.look, { inteiro: true }); } catch (e) { } }, ms));
  abreModal(el('h2', {}, d.nome), el('div', { class: 'npc-topo' }, ret, el('div', { class: 'fala' }, el('p', {}, d.ola))),
    el('div', { class: 'lista' }, ...ids.map(id => el('div', { class: 'linha-item' }, iconeClone(iconeItem(id)), el('div', { class: 'nm' }, el('b', {}, ITENS[id].nome), el('small', {}, `${ITENS[id].desc || ''} · friend's price: ${agFmt(preco(id))} (−20%)`)),
      el('div', { class: 'ag-acoes' }, ...[10, 50].map(n => el('button', { class: 'btn amarelo mini', type: 'button', onclick: () => { const c = preco(id) * n; if (s.ouro < c) { log('Not enough coins.', 'l-dano'); return; } s.ouro -= c; recebeItem(id, n); log(`🌟 Bought ${n}× ${ITENS[id].nome} from the Legend (${agFmt(c)}).`, 'l-loot'); try { som('moeda'); } catch (e) { } salvar(); } }, `${n}× · ${agFmt(preco(id) * n)}`)))))),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Thanks, ace!')));
}

/* ---------- títulos e Lendas na aba Agência ---------- */
{
  const _telaAg = agmTelaAgencia;
  agmTelaAgencia = function (a) {
    const box = _telaAg.apply(this, arguments);
    const tit = el('div', { class: 'ag-medalhas' }, ...AGM_TITULOS_V3.map(([id, nome, como]) => el('div', { class: 'ag-medalha' + (a.titulos['v3_' + id] ? ' tem' : ''), title: como }, el('div', { class: 'agm-tit-ic' }, nome.split(' ')[0]), el('b', {}, nome.replace(/^\S+\s/, '')), el('small', {}, a.titulos['v3_' + id] ? '✅ earned' : como))));
    const lendas = a.lendas.length ? el('div', { class: 'lista' }, ...a.lendas.map(L => el('div', { class: 'linha-item' }, L.look ? agRetrato(L, 44) : '', el('div', { class: 'nm' }, el('b', {}, `🌟 ${L.nome} · ${AGM_POS[L.pos] ? AGM_POS[L.pos][0] : ''} · overall ${agmN(L.ovr)}`), el('small', {}, `Sold${L.look && L.look.corpo === 'f' ? '' : ''} to ${L.clube} (${L.pais}) for ${agFmt(L.venda)} · visits the office in the Village`)))))
      : el('p', { class: 'vazio' }, 'When one of your kids is sold to Europe, they become an Agency Legend: they leave the calendar, get a spot here, and start visiting the office in the Village (with friend\'s prices on bottles!).');
    const lembr = Object.keys(a.lembrancas || {}).map(k => AGM_LEMBRANCAS[k] && AGM_LEMBRANCAS[k].nome).filter(Boolean);
    box.prepend(el('h3', {}, '🏆 Titles'), tit, el('h3', {}, `🌟 Agency Legends (${a.lendas.length})`), lendas, lembr.length ? el('p', { class: 'dica' }, '🎁 Souvenirs in your storage: ' + lembr.join(' · ')) : '');
    return box;
  };
}

/* ---------- os profissionais da agência no Mercado do seu clube (modo Time) ---------- */
if (typeof telaMercado === 'function') {
  const _mercadoV3 = telaMercado;
  telaMercado = function () {
    const wrap = _mercadoV3.apply(this, arguments);
    try {
      const a = AGM_ATIVO && agDados(), t = G.save.time; if (!a || a.v !== AGM_VERSAO || !t) return wrap;
      const pros = a.jogadores.filter(j => j.fase === 'carreira' && !t.elenco.some(x => x.agId === j.id)); if (!pros.length) return wrap;
      wrap.append(el('h3', {}, '⭐ Stars from Your Agency'));
      const l = el('div', { class: 'lista' });
      for (const j of pros) {
        const e = k => Math.round((j.atr[k] || 0) * 5); // escala 1–20 da agência → escala do clube
        const cj = { id: 'A_' + j.id, agId: j.id, nome: j.nome, pos: j.pos === 'GOL' ? 'GOL' : j.pos, atq: Math.round((e('fin') + e('dri')) / 2) || e('ref'), def: e('mar'), pas: e('pas'), fis: e('vel'), pot: Math.round(agmTeto(j.P) * 5), nivel: 1, xp: 0, energia: 100, idade: agmIdade(j) | 0, look: { corpo: j.look.corpo, pele: j.look.pele, cabelo: j.look.cabelo, corCabelo: j.look.corCabelo } };
        const preco = Math.round(precoJogador(cj) * 0.9), teto = DIVS[t.div].base + AG_MERCADO_FOLGA;
        if (ovr(cj) > teto) { l.append(el('div', { class: 'linha-item bloq' }, el('div', { class: 'nm' }, el('b', {}, `⭐ ${j.nome} · rating ${ovr(cj)}`), el('small', {}, `Only accepts a stronger club: move up a division (here they'll accept up to rating ${teto}).`)))); continue; }
        l.append(cartaJogador(cj, el('span', { class: 'preco-col' }, precoTag(preco), el('button', { class: 'btn amarelo mini', onclick: () => {
          if (t.elenco.length >= 19 || t.caixa < preco) { log(t.caixa < preco ? 'Not enough club funds.' : 'Squad is full.', 'l-dano'); return; }
          t.caixa -= preco; t.finTemp.sai -= preco; t.elenco.push(cj); j.clube = { nome: t.nome, pais: 'Brazil', cor: t.cor1, nivel: clamp(Math.floor((DIVS[t.div].base - 36) / 9), 0, 4), tipo: 'pro', degrau: 'grande', meu: true };
          agmHist(j, `was signed${agmO(j)} by YOUR club, ${t.nome}`); log(`⭐ ${j.nome}, from your agency, now plays for ${t.nome}!`, 'l-lvl'); som('moeda'); salvar(); abrirTime('mercado');
        } }, 'Sign'))));
      }
      wrap.append(l);
    } catch (e) { }
    return wrap;
  };
}
{
  const st = document.createElement('style');
  st.textContent = `.agm-tit-ic { font-size: 34px; line-height: 1.1; } .ag-medalha:not(.tem) .agm-tit-ic { filter: grayscale(1); opacity: .5; }`;
  document.head.append(st);
}
