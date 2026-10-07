/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🏪 FEIRA DOS JOGADORES — "MMO leve", etapa 4 (v383; dono: "lojas para venda de itens no jogo, baseado no Metin2";
   escolhas: "Tudo, com limites" + "Barraca na cidade + mercado"). Só TOSTÕES — nada de dinheiro de verdade.
   - ☰ Mais › 🏪 Feira (nas cidades): 🛒 Comprar (mercado central, busca pelo nome) e 🏪 Minha loja (anunciar itens da
     mochila, cancelar, recolher os tostões das vendas e os anúncios vencidos, montar a BARRACA).
   - O item anunciado sai da sua mochila e fica guardado no servidor; quem compra paga em tostões e recebe o item (o
     refino vai junto). Você recolhe os tostões depois (5% de taxa). Anúncio dura 3 dias.
   - Limites (servidor): nível 30 para vender, 12 anúncios ativos, 20 por dia, preço entre 50% e 25× o valor do item.
   - PRAÇA DA FEIRA (v383, dono: "crie um espaço específico onde ficarão concentradas as vendinhas"): mapa só das
     barracas, com 36 VAGAS marcadas no chão; ☰ Mais › 🏪 Feira › "Ir à Praça da Feira" (a saída devolve você para onde
     estava). Cada barraca tem um título de lista na placa; chegue perto e aperte E. É mundo compartilhado (todos se veem).
   Servidor: /api/lenda/mercado (routes/lendaMercado.js). Steam: desligado (lá não tem conta do site).
   Carregar DEPOIS de mundo_online.js.
   ============================================================ */
const MKT = { barracas: [], ents: [], mapaB: null, tB: 0, opcoes: null };
const MKT_LIBERADO = true;
const MKT_TITULOS = ['Sale!', 'Rare items', 'Potions and food', 'Equipment', 'Materials', 'Everything’s cheap!', 'New arrivals', 'For beginners', 'For the Multiverse', 'Relics and treasures', 'Upgraded items', 'Buy 2!'];
const MKT_CORES = ['Red', 'Blue', 'Green', 'Purple'];
const MKT_NIVEL = 30;
const mktLigado = () => MKT_LIBERADO && typeof PORTAL !== 'undefined' && PORTAL.ativo && !!PORTAL.token && !window.LENDA_STEAM;
const mktNaCidade = () => !!(G.mapa && typeof MUNDO !== 'undefined' && MUNDO.moPublico(G.mapa));
const mktFmt = n => Math.round(n).toLocaleString('en-US');
const mktNomeItem = (id, r) => `${(ITENS[id] || {}).nome || id}${r ? ` +${r}` : ''}`;
async function mktPede(metodo, caminho, corpo) {
  const r = await fetch(PORTAL.api + '/api/lenda/mercado' + caminho, { method: metodo, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + PORTAL.token }, body: corpo ? JSON.stringify(corpo) : undefined });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, dados: j };
}
const mktErro = r => (r && r.dados && r.dados.error) || (r && r.status === 503 ? 'The market is still on its way to the server. Try again later!' : 'That didn\'t work right now. Try again in a moment.');
const mktIcone = id => { try { return el('span', { class: 'mkt-ic' }, iconeClone(iconeItem(id))); } catch (e) { return el('span', { class: 'mkt-ic' }, '📦'); } };
// um item que voltou ou foi comprado entra na mochila (refinado: separado; cheia: armazém)
function mktRecebe(it) {
  const s = G.save, id = it.itemId, q = it.qtd || 1, r = it.refino || 0;
  if (!ITENS[id]) return;
  const o0 = RECEBE_ORIGEM; RECEBE_ORIGEM = 'Players’ Market'; // (bug 06/10/2026: o 📜 Histórico do armazém diz de onde veio)
  try {
    if (!r) { recebeItem(id, q); return; }
    if (s.mochila.length < capMochila() && pesoMochila(s) + pesoItem(id) <= capPeso(s)) s.mochila.unshift(poeNaBolsa({ id, q: 1, r }, s));
    else { const pesado = s.mochila.length < capMochila(), passou = guardaArmazemSempre(id, 1, r); armHistorico(id, 1, r); avisaArmazem([[id, 1, r, passou]], pesado ? 'peso' : 'espaco'); } // (antes: armazém cheio → "pendente" sem o refino e sem aparecer em lugar nenhum)
  } finally { RECEBE_ORIGEM = o0; }
  G.uiSujo = true;
}
// tira da mochila exatamente o que vai ser anunciado (o refinado: aquela peça)
function mktTira(id, q, r) {
  const s = G.save;
  if (r) { const i = s.mochila.findIndex(x => x.id === id && (x.r || 0) === r); if (i < 0) return false; if (s.mochila[i].q > 1) s.mochila[i].q--; else s.mochila.splice(i, 1); G.uiSujo = true; return true; }
  if (contaItem(id) < q) return false;
  return removeItem(id, q);
}

/* ---------- janela ---------- */
async function mktAbre(aba) {
  if (!mktLigado()) return avisoJogo('🏪 The market only works on the website (educacaogamer.com.br), with your account.');
  if (!mktNaCidade()) return avisoJogo('🏪 Open the market in a city or hub (Village, Rio, Tokyo, Station, Multiverse...): from there you can go to Market Square.');
  await mktResolvePendente();
  // v407 (Raio-X I8): quantas barracas tem na praça (vazia: o botão avisa "seja o primeiro")
  try { const b = await mktPede('GET', '/barracas'); if (b.ok) MKT.qtdPraca = (b.dados.barracas || []).length; } catch (e) { }
  (aba === 'minha' ? mktMinhaLoja : mktComprar)();
}
const mktAbas = ativa => el('div', { class: 'mkt-abas' },
  el('button', { class: 'btn' + (ativa === 'comprar' ? ' amarelo' : ''), type: 'button', onclick: () => mktComprar() }, '🛒 Buy'),
  el('button', { class: 'btn' + (ativa === 'minha' ? ' amarelo' : ''), type: 'button', onclick: () => mktMinhaLoja() }, '🏪 My Shop'),
  mktNaFeira() ? '' : el('button', { class: 'btn', type: 'button', onclick: mktVaiFeira, title: MKT.qtdPraca === 0 ? 'There are no stalls in the square yet: set up the first one!' : '' }, MKT.qtdPraca === 0 ? '🚶 Market Square (empty: be the first!)' : '🚶 Go to Market Square'));
function mktLinhaAnuncio(a, depois) {
  const total = el('b', {}, `${mktFmt(a.preco)} 🪙`);
  const qIn = a.qtd > 1 ? el('input', { type: 'number', min: 1, max: a.qtd, value: 1, style: 'width:64px', oninput: e => { const q = Math.max(1, Math.min(a.qtd, e.target.value | 0)); total.textContent = `${mktFmt(a.preco * q)} 🪙`; } }) : null;
  if (qIn) qIn.addEventListener('keydown', e => e.stopPropagation());
  const nv = (ITENS[a.itemId] || {}).lvl || 0;
  return el('div', { class: 'mkt-linha' }, mktIcone(a.itemId),
    el('div', { class: 'mkt-info' }, el('b', {}, mktNomeItem(a.itemId, a.refino)), el('small', {}, `${a.qtd > 1 ? `${a.qtd} pcs · ` : ''}${mktFmt(a.preco)} each · from ${a.vendedor}${nv ? ` · level ${nv}` : ''}`)),
    qIn || '', total,
    a.vendedorId === PORTAL.contaId ? el('small', {}, 'seu') : el('button', { class: 'btn mini amarelo', type: 'button', onclick: () => mktCompra(a, qIn ? Math.max(1, Math.min(a.qtd, qIn.value | 0)) : 1, depois) }, 'Buy'));
}
async function mktComprar(busca = '') {
  const q = el('input', { placeholder: 'Search for an item by name...', value: busca, style: 'flex:1;min-width:160px' });
  const lista = el('div', { class: 'mkt-lista' }, el('p', { class: 'vazio' }, 'Loading...'));
  const procura = () => mktComprar(q.value.trim());
  q.addEventListener('keydown', e => { if (e.key === 'Enter') procura(); e.stopPropagation(); });
  abreModal(el('h2', {}, '🏪 Players’ Market'), mktAbas('comprar'),
    el('div', { class: 'opcoes', style: 'align-items:center' }, q, el('button', { class: 'btn', type: 'button', onclick: procura }, '🔎 Search')),
    el('p', { class: 'dica' }, `You have ${mktFmt(G.save.ouro)} coins. ${busca ? 'Cheapest to most expensive.' : 'Newest listings.'}`), lista);
  setTimeout(() => q.focus(), 50);
  let r; try { r = await mktPede('GET', '/busca' + (busca ? '?q=' + encodeURIComponent(busca) : '')); } catch (e) { r = { ok: false }; }
  lista.innerHTML = '';
  if (!r.ok) return lista.append(el('p', {}, mktErro(r)));
  const an = r.dados.anuncios || [];
  if (!an.length) lista.append(el('p', { class: 'vazio' }, busca ? 'Nobody is selling that right now.' : 'The market is empty. How about being the first to list something?'));
  for (const a of an) lista.append(mktLinhaAnuncio(a, () => mktComprar(busca)));
}
async function mktCompra(a, q, depois) {
  const total = a.preco * q;
  if (G.save.ouro < total) return avisoJogo(`🏪 You need ${mktFmt(total - G.save.ouro)} more coins.`);
  if (!(await perguntaJogo(`Buy ${q > 1 ? q + 'x ' : ''}${mktNomeItem(a.itemId, a.refino)} from ${a.vendedor} for ${mktFmt(total)} coins?`, { sim: 'Buy', nao: 'Cancel' }))) return depois && depois();
  let r; try { r = await mktPede('POST', `/comprar/${a.id}`, { qtd: q }); } catch (e) { r = { ok: false }; }
  if (!r.ok) { avisoJogo('🏪 ' + mktErro(r)); return depois && depois(); }
  G.save.ouro -= r.dados.total; mktRecebe(r.dados.item); som('moeda');
  log(`🏪 You bought ${q > 1 ? q + 'x ' : ''}${mktNomeItem(a.itemId, a.refino)} from ${a.vendedor} for ${mktFmt(r.dados.total)} coins.`, 'l-loot');
  G.uiSujo = true; salvar(); if (depois) depois();
}
async function mktMinhaLoja() {
  abreModal(el('h2', {}, '🏪 Players’ Market'), mktAbas('minha'), el('p', { class: 'vazio' }, 'Loading...'));
  let r; try { r = await mktPede('GET', '/minhas'); } catch (e) { r = { ok: false }; }
  if (!r.ok) return abreModal(el('h2', {}, '🏪 Players’ Market'), mktAbas('minha'), el('p', {}, mktErro(r)));
  const d = r.dados, podeVender = G.save.nivel >= MKT_NIVEL;
  const receber = d.aReceber > 0 ? el('div', { class: 'mkt-receber' }, `💰 You have ${mktFmt(d.aReceber)} coins from sales to collect.`, el('button', { class: 'btn amarelo', type: 'button', onclick: mktColeta }, 'Collect')) : '';
  const ativos = d.ativos.map(a => el('div', { class: 'mkt-linha' }, mktIcone(a.itemId), el('div', { class: 'mkt-info' }, el('b', {}, mktNomeItem(a.itemId, a.refino)), el('small', {}, `${a.qtd > 1 ? a.qtd + ' pcs · ' : ''}${mktFmt(a.preco)} each · expires ${new Date(a.expiraEm).toLocaleDateString('en-US')}`)),
    el('button', { class: 'btn mini', type: 'button', onclick: () => mktCancela(a, 'Cancel') }, 'Cancel')));
  const vencidos = d.vencidos.map(a => el('div', { class: 'mkt-linha mkt-venc' }, mktIcone(a.itemId), el('div', { class: 'mkt-info' }, el('b', {}, mktNomeItem(a.itemId, a.refino)), el('small', {}, `${a.qtd > 1 ? a.qtd + ' pcs · ' : ''}nobody bought it: it comes back to you`)),
    el('button', { class: 'btn mini amarelo', type: 'button', onclick: () => mktCancela(a, 'Collect') }, 'Collect')));
  const vendas = d.vendas.map(v => el('div', { class: 'mkt-linha' }, mktIcone(v.itemId), el('div', { class: 'mkt-info' }, el('b', {}, `${v.qtd > 1 ? v.qtd + 'x ' : ''}${mktNomeItem(v.itemId, v.refino)}`), el('small', {}, `to ${v.comprador} · +${mktFmt(v.recebe)} 🪙${v.coletado ? '' : ' (to collect)'}`))));
  const b = d.barraca, aqui = G.mapa && G.mapa.id;
  const barraca = el('div', { class: 'mkt-barraca' },
    b ? el('p', {}, `🏪 Your stall "${MKT_TITULOS[b.titulo]}" is in SPOT ${b.vaga + 1} of Market Square.`) : el('p', { class: 'vazio' }, 'Set up a stall in Market Square: everyone who walks by will see it.'),
    d.ativos.length ? mktFormBarraca(b) : el('p', { class: 'dica' }, 'List at least one item to set up your stall.'),
    b ? el('button', { class: 'btn mini', type: 'button', onclick: async () => { await mktPede('DELETE', '/barraca'); MKT.tB = 0; mktCarregaBarracas(true); mktMinhaLoja(); } }, 'Take down') : '');
  abreModal(el('h2', {}, '🏪 Players’ Market'), mktAbas('minha'), receber,
    el('h3', {}, '➕ List an item'), podeVender ? mktFormAnuncio(d) : el('p', { class: 'vazio' }, `You need to be level ${MKT_NIVEL} to sell. You can buy right now!`),
    el('h3', {}, `📋 My listings (${d.ativos.length}/12 · today ${d.anunciosHoje}/20)`), d.ativos.length ? el('div', { class: 'mkt-lista' }, ...ativos) : el('p', { class: 'vazio' }, 'No listings.'),
    vencidos.length ? el('h3', {}, '⏰ Expired (collect)') : '', vencidos.length ? el('div', { class: 'mkt-lista' }, ...vencidos) : '',
    el('h3', {}, '🏪 Stall'), barraca,
    vendas.length ? el('details', {}, el('summary', {}, `🧾 Latest sales (${vendas.length})`), el('div', { class: 'mkt-lista' }, ...vendas)) : '',
    el('p', { class: 'dica' }, 'The listed item leaves your backpack and is kept at the market. When someone buys it, you collect the coins here (the market keeps 5%). A listing lasts 3 days; if nobody buys it, it comes back to you.'));
}
function mktFormBarraca(b) {
  if (!mktNaFeira()) return el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: mktVaiFeira }, '🚶 Go to Market Square to set up'));
  const t = el('select', {}, ...MKT_TITULOS.map((x, i) => el('option', { value: i, selected: b && b.titulo === i ? 'selected' : null }, x)));
  const c = el('select', {}, ...MKT_CORES.map((x, i) => el('option', { value: i, selected: b && b.cor === i ? 'selected' : null }, x)));
  return el('div', { class: 'opcoes', style: 'align-items:center' }, 'Title:', t, 'Awning:', c,
    el('button', { class: 'btn amarelo', type: 'button', onclick: async () => {
      if (!mktNaFeira()) return avisoJogo('🏪 You can only set up your stall in Market Square.');
      await mktCarregaBarracas(true); const vaga = mktVagaPerto();
      if (vaga == null) return avisoJogo('🏪 Stand in front of a free SPOT (the numbered rectangles on the ground) and try again.');
      const r = await mktPede('POST', '/barraca', { vaga, titulo: +t.value, cor: +c.value });
      if (!r.ok) return avisoJogo('🏪 ' + mktErro(r));
      som('moeda'); banner('🏪 Stall set up!', MKT_TITULOS[+t.value]); MKT.tB = 0; mktCarregaBarracas(true); mktMinhaLoja();
    } }, b ? '📍 Move to the nearest spot' : '🏪 Set up at the nearest spot'));
}
function mktFormAnuncio(d) {
  const s = G.save;
  // o que dá para vender: o que está na mochila (o refinado aparece separado)
  const vistos = new Map();
  for (const x of s.mochila) { if (!ITENS[x.id] || ITENS[x.id].tipo === 'chave' || ITENS[x.id].tipo === 'bolsa' || (typeof ehBolsa === 'function' && ehBolsa(x.id))) continue; const k = x.id + '|' + (x.r || 0); vistos.set(k, { id: x.id, r: x.r || 0, q: (vistos.get(k)?.q || 0) + x.q }); }
  const itens = [...vistos.values()].sort((a, b) => ((ITENS[b.id].venda || 0) - (ITENS[a.id].venda || 0)));
  if (!itens.length) return el('p', { class: 'vazio' }, 'Your backpack has nothing to sell.');
  let esc = null, faixa = null;
  const qIn = el('input', { type: 'number', min: 1, value: 1, style: 'width:70px' }), pIn = el('input', { type: 'number', min: 1, style: 'width:110px' });
  [qIn, pIn].forEach(i => i.addEventListener('keydown', e => e.stopPropagation()));
  const info = el('small', {}, 'Choose an item.'), btn = el('button', { class: 'btn amarelo', type: 'button', disabled: 'disabled' }, 'List it');
  const grade = el('div', { class: 'mkt-grade' }, ...itens.slice(0, 60).map(it => {
    const b = el('button', { type: 'button', class: 'mkt-op', title: mktNomeItem(it.id, it.r) }, mktIcone(it.id), el('small', {}, it.r ? `+${it.r}` : `${it.q}`));
    b.onclick = async () => {
      [...grade.children].forEach(c => c.classList.toggle('on', c === b)); esc = it; info.textContent = 'Loading the price...';
      qIn.max = it.r ? 1 : it.q; qIn.value = it.r ? 1 : Math.min(it.q, +qIn.value || 1); qIn.disabled = !!it.r || it.q === 1;
      let r; try { r = await mktPede('GET', `/faixa/${encodeURIComponent(it.id)}?refino=${it.r}`); } catch (e) { r = { ok: false }; }
      if (!r.ok) { faixa = null; info.textContent = mktErro(r); btn.disabled = true; return; }
      faixa = r.dados; pIn.min = faixa.min; pIn.max = faixa.max; pIn.value = Math.max(faixa.min, Math.min(faixa.max, (ITENS[it.id].venda || faixa.min) * 2 * (1 + it.r)));
      info.textContent = `${mktNomeItem(it.id, it.r)} — price per unit between ${mktFmt(faixa.min)} and ${mktFmt(faixa.max)} coins (the city shop buys it for ${mktFmt(ITENS[it.id].venda || 0)}).`; btn.disabled = false;
    };
    return b;
  }));
  btn.onclick = async () => {
    if (!esc || !faixa) return;
    const q = esc.r ? 1 : Math.max(1, Math.min(esc.q, qIn.value | 0)), p = Math.max(faixa.min, Math.min(faixa.max, pIn.value | 0));
    btn.disabled = true;
    await mktAnuncia(esc.id, esc.r, q, p);
  };
  return el('div', { class: 'mkt-form' }, grade, el('div', { class: 'opcoes', style: 'align-items:center' }, 'Quantity:', qIn, 'Price (each):', pIn, btn), info);
}
// anunciar: tira da mochila ANTES (e devolve se o servidor recusar); sem resposta, guarda para conferir depois
async function mktAnuncia(id, r, q, p) {
  const s = G.save;
  // v407 (Raio-X U7): o servidor confere se o item está no save ONLINE — salva antes de tirar da mochila
  try { if (typeof enviaSave === 'function' && typeof NUVEM !== 'undefined' && NUVEM.ativa && !NUVEM.parada) { NUVEM.sujo = true; await enviaSave(true); } } catch (e) { }
  if (!mktTira(id, q, r)) return avisoJogo('🏪 That item isn’t in your backpack anymore.');
  s.mktPend = { itemId: id, refino: r, qtd: q, preco: p, t: Date.now() }; salvar();
  let res; try { res = await mktPede('POST', '/anunciar', { itemId: id, refino: r, qtd: q, preco: p, nivel: s.nivel }); } catch (e) { res = null; }
  if (!res) { avisoJogo('🏪 No answer from the market. Next time you open it, I’ll check if the listing went through (if it didn’t, the item comes back).'); return; }
  delete s.mktPend;
  if (!res.ok) { mktRecebe({ itemId: id, refino: r, qtd: q }); salvar(); avisoJogo('🏪 ' + mktErro(res)); return mktMinhaLoja(); }
  som('moeda'); log(`🏪 Listed: ${q > 1 ? q + 'x ' : ''}${mktNomeItem(id, r)} for ${mktFmt(p)} coins each.`, 'l-loot'); salvar(); mktMinhaLoja();
}
// anúncio que ficou sem resposta: entrou? (procura um igual criado logo depois) — senão, o item volta
async function mktResolvePendente() {
  const s = G.save, pd = s && s.mktPend; if (!pd) return;
  let r; try { r = await mktPede('GET', '/minhas'); } catch (e) { return; }
  if (!r.ok) return;
  const achou = [...r.dados.ativos, ...r.dados.vencidos].some(a => a.itemId === pd.itemId && (a.refino || 0) === pd.refino && a.preco === pd.preco && Math.abs(new Date(a.expiraEm) - (pd.t + 3 * 864e5)) < 5 * 60e3);
  if (!achou) { mktRecebe(pd); log(`🏪 The listing for ${mktNomeItem(pd.itemId, pd.refino)} didn’t go through: the item went back to your backpack.`, 'l-sis'); }
  delete s.mktPend; salvar();
}
async function mktCancela(a, verbo) {
  const r = await mktPede('POST', `/cancelar/${a.id}`);
  if (!r.ok) { avisoJogo('🏪 ' + mktErro(r)); return mktMinhaLoja(); }
  mktRecebe(r.dados.item); som('moeda'); log(`🏪 ${verbo === 'Collect' ? 'Collected' : 'Canceled'}: ${mktNomeItem(a.itemId, a.refino)} came back to you.`, 'l-loot'); salvar(); MKT.tB = 0; mktMinhaLoja();
}
async function mktColeta() {
  const r = await mktPede('POST', '/coletar');
  if (!r.ok) return avisoJogo('🏪 ' + mktErro(r));
  if (r.dados.tostoes > 0) { G.save.ouro += r.dados.tostoes; som('moeda'); banner('🏪 Sales collected!', `+${mktFmt(r.dados.tostoes)} coins`); log(`🏪 You collected ${mktFmt(r.dados.tostoes)} coins from ${r.dados.vendas} sale(s) at the market.`, 'l-xp'); G.uiSujo = true; salvar(); }
  if (r.dados.aviso) log('🏪 ' + r.dados.aviso, 'l-sis'); // v407 (Raio-X U7): teto de tostões recolhidos por dia
  mktMinhaLoja();
}
// a loja de alguém (ao chegar perto da barraca)
async function mktLojaDe(vendedorId) {
  abreModal(el('h2', {}, '🏪 Stall'), el('p', { class: 'vazio' }, 'Loading...'));
  let r; try { r = await mktPede('GET', `/loja/${encodeURIComponent(vendedorId)}`); } catch (e) { r = { ok: false }; }
  if (!r.ok) return abreModal(el('h2', {}, '🏪 Stall'), el('p', {}, mktErro(r)));
  const an = r.dados.anuncios || [], b = MKT.barracas.find(x => x.vendedorId === vendedorId);
  abreModal(el('h2', {}, `🏪 ${r.dados.vendedor}’s Stall`), b ? el('p', { class: 'dica' }, `"${MKT_TITULOS[b.titulo]}"`) : '',
    el('p', { class: 'dica' }, `You have ${mktFmt(G.save.ouro)} coins.`),
    an.length ? el('div', { class: 'mkt-lista' }, ...an.map(a => mktLinhaAnuncio(a, () => mktLojaDe(vendedorId)))) : el('p', { class: 'vazio' }, 'This stall sold everything!'),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: () => mktComprar() }, '🛒 See the whole market')));
}

/* ---------- a PRAÇA DA FEIRA ---------- */
const FEIRA_W = 46, FEIRA_H = 34, FEIRA_ID = 'praca_feira';
// 36 vagas: 4 fileiras (y) × 9 colunas (x); a barraca fica em pé na vaga, virada para o corredor
const FEIRA_VAGAS = [7, 12, 23, 28].flatMap(y => Array.from({ length: 9 }, (_, k) => ({ x: 6 + 4 * k, y })));
// o chão da praça: lajes claras de pedra (e o mosaico em leque em volta do chafariz) — arte própria (Higgsfield, v383)
Object.assign(CH, { PRACA_FEIRA: 110, PRACA_CENTRO: 111 });
if (typeof ESTILO_CHAO !== 'undefined') { ESTILO_CHAO[CH.PRACA_FEIRA] = Object.assign({}, ESTILO_CHAO[CH.PARALELO], { cor: '#e2c48e', borda: '#9c7a48' }); ESTILO_CHAO[CH.PRACA_CENTRO] = Object.assign({}, ESTILO_CHAO[CH.PARALELO], { cor: '#d99a62', borda: '#8a5a32', o: (ESTILO_CHAO[CH.PARALELO].o || 5) + 0.01 }); }
if (typeof TEX_CHAO !== 'undefined') { TEX_CHAO[CH.PRACA_FEIRA] = TEX_CHAO[CH.PARALELO]; TEX_CHAO[CH.PRACA_CENTRO] = TEX_CHAO[CH.PARALELO]; }
if (typeof CHAO2 !== 'undefined') { Object.assign(CHAO2.tex, { [CH.PRACA_FEIRA]: ['t2_praca_feira', 6], [CH.PRACA_CENTRO]: ['t2_praca_centro', 5] }); CHAO2.piso.add(CH.PRACA_FEIRA); CHAO2.piso.add(CH.PRACA_CENTRO); }
function criaPracaFeira() {
  const W = FEIRA_W, H = FEIRA_H, b = new Construtor(FEIRA_ID, '🏪 Market Square', W, H, CH.GRAMA, 7341);
  b.ret(2, 2, W - 4, H - 3, CH.PRACA_FEIRA); // lajes de pedra (chão novo, borda acabada com sombra)
  b.ret(17, 14, 13, 7, CH.PRACA_CENTRO);   // a pracinha do chafariz
  for (const [x, y] of [[3, 3], [W - 6, 3], [3, H - 6], [W - 6, H - 6]]) b.ret(x, y, 3, 3, CH.GRAMA_FLOR); // canteiros nos cantos
  b.borda('arvore', 1, 'palmeira_real');
  b.obj(23, 17, 'fonte_italiana');
  for (const [x, y] of [[19, 15], [27, 15], [19, 19], [27, 19]]) b.obj(x, y, 'banco');
  for (const [x, y] of [[17, 17], [29, 17]]) b.obj(x, y, 'palmeira_vaso');
  for (const y of [7, 23]) for (let k = 0; k < 8; k++) b.obj(8 + 4 * k, y, 'poste3'); // postes entre as barracas das fileiras de trás
  // entrada/saída embaixo, no meio (volta para onde você estava: entrarMapa abaixo)
  // (o destino escrito é a chegada da Vila; entrarMapa abaixo troca pelo lugar de onde você veio)
  const vi = (() => { try { const v = getMapa('vila'); return v.renasce || v.inicio; } catch (e) { return { x: 20, y: 20 }; } })();
  for (let x = 21; x <= 25; x++) { b.chao(x, H - 1, CH.PRACA_FEIRA); b.obj(x, H - 1, null); b.m.saidas.push({ x, y: H - 1, para: 'vila', tx: vi.x, ty: vi.y }); }
  b.placa(20, H - 3, '🏪 MARKET SQUARE — set up your stall in a free SPOT (☰ More › 🏪 Market). Get close to a stall and press E to look.');
  b.m.inicio = { x: 23, y: H - 3 }; b.m.renasce = { x: 23, y: H - 3 };
  b.m.feira = true;
  return b.m;
}
MAPAS_DEF[FEIRA_ID] = criaPracaFeira;
if (typeof CHAO2 !== 'undefined') CHAO2.mapas[FEIRA_ID] = 'floresta'; // (motor de chão novo: grama em volta, pedra com borda)
function mktVaiFeira() {
  const s = G.save; if (!G.mapa || G.mapa.id === FEIRA_ID) return;
  s.feiraVolta = { mapa: G.mapa.id, x: G.p.x, y: G.p.y };
  fechaModal(); trocaMapa(FEIRA_ID, 23.5, FEIRA_H - 2.5);
}
{ // a saída da praça devolve para onde você estava
  const _entFeira = entrarMapa;
  entrarMapa = function (id, x, y) {
    if (G.mapa && G.mapa.id === FEIRA_ID && id === 'vila' && G.save && G.save.feiraVolta) { // (a única saída da praça vai para a Vila)
      const v = G.save.feiraVolta; delete G.save.feiraVolta;
      try { getMapa(v.mapa); return _entFeira.call(this, v.mapa, v.x, v.y); } catch (e) { }
    }
    return _entFeira.apply(this, arguments);
  };
}
// as vagas pintadas no chão (a barraca cobre a vaga quando está montada)
{
  const _rcFeira = renderChao;
  renderChao = function (m) {
    const c = _rcFeira.apply(this, arguments);
    if (m && m.id === FEIRA_ID && c && !c._vagas) {
      c._vagas = true; const x = c.getContext('2d');
      FEIRA_VAGAS.forEach((v, i) => {
        const cx = (v.x + 0.5) * T, cy = (v.y + 0.45) * T, w = T * 2.7, h = T * 1.25;
        x.save(); x.fillStyle = 'rgba(255,240,200,0.28)'; x.strokeStyle = 'rgba(120,70,20,0.55)'; x.lineWidth = T * 0.05; x.setLineDash([T * 0.18, T * 0.12]);
        x.beginPath(); x.roundRect(cx - w / 2, cy - h / 2, w, h, T * 0.2); x.fill(); x.stroke(); x.setLineDash([]);
        x.fillStyle = 'rgba(110,60,20,0.6)'; x.font = `800 ${T * 0.32}px Fredoka, Nunito, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(i + 1), cx, cy);
        x.restore();
      });
    }
    return c;
  };
}
const mktNaFeira = () => !!(G.mapa && G.mapa.id === FEIRA_ID);
// a vaga livre mais perto (até 3 passos)
function mktVagaPerto() {
  const ocup = new Set(MKT.barracas.filter(b => b.vendedorId !== PORTAL.contaId).map(b => b.vaga));
  let melhor = null, d0 = 3;
  FEIRA_VAGAS.forEach((v, i) => { if (ocup.has(i)) return; const d = Math.hypot(G.p.x - (v.x + 0.5), G.p.y - (v.y + 1.2)); if (d < d0) { d0 = d; melhor = i; } });
  return melhor;
}

/* ---------- barracas na praça ---------- */
if (typeof ALTURA_BICHO !== 'undefined') ALTURA_BICHO.barraca_loja = 2.7;
async function mktCarregaBarracas(forca) {
  if (!mktLigado() || !G.mapa) return;
  if (!mktNaFeira()) { MKT.barracas = []; MKT.ents = []; MKT.mapaB = null; return; }
  if (!forca && MKT.mapaB === FEIRA_ID && Date.now() - MKT.tB < 30000) return;
  MKT.mapaB = FEIRA_ID; MKT.tB = Date.now();
  let r; try { r = await mktPede('GET', '/barracas'); } catch (e) { return; }
  if (!r.ok || !mktNaFeira()) return;
  MKT.barracas = (r.dados.barracas || []).filter(b => FEIRA_VAGAS[b.vaga]); MKT.qtdPraca = MKT.barracas.length;
  if (forca && !MKT.barracas.length) log('🏪 Market Square is still empty: be the first to set up a stall! (☰ Menu › 🏪 Market › My Shop)', 'l-sis'); // v407 (Raio-X I8)
  MKT.ents = MKT.barracas.map(b => { const v = FEIRA_VAGAS[b.vaga]; return { id: 'barraca_' + b.vendedorId, barraca: b, d: { nome: `🏪 ${b.vendedor} · ${b.itens} ${b.itens === 1 ? 'item' : 'itens'}`, look: { tipo: 'barraca_loja' }, ola: '' }, x: v.x + 0.5, y: v.y + 0.5, r: 0.6, flip: false, fase: 0, mov: false }; });
  for (let k = 1; k <= 4; k++) spr('barraca_jog_' + k);
}
setInterval(() => { try { if (G.rodando) mktCarregaBarracas(); } catch (e) { } }, 5000);
{
  const _entMkt = entrarMapa;
  entrarMapa = function () { const r = _entMkt.apply(this, arguments); MKT.ents = []; MKT.barracas = []; MKT.tB = 0; try { mktCarregaBarracas(true); } catch (e) { } return r; };
  // desenho e "aperte E" (as barracas não bloqueiam o caminho)
  const comBarracas = fn => function () {
    if (!MKT.ents.length) return fn.apply(this, arguments);
    const antes = G.npcs; G.npcs = antes.concat(MKT.ents);
    try { return fn.apply(this, arguments); } finally { G.npcs = antes; }
  };
  desenha = comBarracas(desenha);
  const _intMkt = interacaoPerto;
  interacaoPerto = comBarracas(function () { const r = _intMkt.apply(this, arguments); if (r && r.n && r.n.barraca) r.txt = `See ${r.n.barraca.vendedor}’s stall`; return r; });
  const _abreMkt = abrirNPC;
  abrirNPC = function (npc) { if (npc && npc.barraca) return mktLojaDe(npc.barraca.vendedorId); return _abreMkt.apply(this, arguments); };
  const _entDesMkt = desenhaEnt;
  desenhaEnt = function (ctx, e) {
    if (!e || !e.barraca) return _entDesMkt.apply(this, arguments);
    const b = e.barraca, s = spr('barraca_jog_' + (b.cor + 1)); if (!s || !s.ok) return;
    const w = T * 2.9, h = w * s.im.height / s.im.width, x = e.x * T, y = e.y * T + T * 0.35;
    ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, y - 4, w * 0.46, T * 0.22, 0, 0, 7); ctx.fill(); ctx.restore();
    ctx.drawImage(s.im, x - w / 2, y - h, w, h);
    // o título na placa de madeira
    const tx = MKT_TITULOS[b.titulo] || '', py = y - h + h * 0.285;
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let tam = T * 0.27; ctx.font = `800 ${tam}px Fredoka, Nunito, sans-serif`; const lim = w * 0.4; while (ctx.measureText(tx).width > lim && tam > T * 0.13) { tam -= 1; ctx.font = `800 ${tam}px Fredoka, Nunito, sans-serif`; }
    ctx.fillStyle = '#4a2a10'; ctx.fillText(tx, x, py); ctx.restore();
  };
}
// a plaquinha em cima da barraca (laranja)
{
  const _plMkt = placaNPC;
  placaNPC = function (ctx, n, x, y, forte) {
    if (!n || !n.barraca) return _plMkt.apply(this, arguments);
    const s = 11 * G.dpr; ctx.font = `700 ${s}px Fredoka, Nunito, sans-serif`;
    const txt = n.d.nome, w = ctx.measureText(txt).width + 14 * G.dpr, h = s + 8 * G.dpr, cy = y - h / 2 + 2 * G.dpr;
    ctx.globalAlpha = forte ? 1 : 0.82; ctx.fillStyle = 'rgba(110,52,8,0.9)'; ctx.strokeStyle = '#ffc06a'; ctx.lineWidth = 1.5 * G.dpr;
    ctx.beginPath(); ctx.roundRect(x - w / 2, cy - h / 2, w, h, 4 * G.dpr); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff3e0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, cy + 0.5 * G.dpr); ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
  };
}

/* ---------- no menu ☰ Mais ---------- */
(function poeBotaoMkt(t = 0) {
  if (!mktLigado()) return;
  const lista = document.querySelector('.tb-lista'); if (!lista) { if (t < 40) setTimeout(() => poeBotaoMkt(t + 1), 500); return; }
  if (document.getElementById('btnFeira')) return;
  const b = el('button', { class: 'btn', id: 'btnFeira', type: 'button', role: 'menuitem' }, '🏪 Players’ Market'); b.onclick = () => mktAbre();
  lista.append(b);
})();
{
  const css = document.createElement('style');
  css.textContent = `.mkt-abas { display: flex; gap: 6px; margin-bottom: 8px; }
  .mkt-lista { display: flex; flex-direction: column; gap: 4px; max-height: 46vh; overflow: auto; }
  .mkt-linha { display: flex; align-items: center; gap: 8px; padding: 5px 8px; border-radius: 10px; background: rgba(0,0,0,.05); } .mkt-venc { background: rgba(255,170,40,.15); }
  .mkt-info { flex: 1; display: flex; flex-direction: column; min-width: 0; } .mkt-info small { opacity: .75; }
  .mkt-ic canvas { width: 34px; height: 34px; image-rendering: auto; } .mkt-ic { display: inline-flex; width: 34px; height: 34px; align-items: center; justify-content: center; }
  .mkt-receber { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px; border-radius: 10px; background: rgba(46,204,113,.18); font-weight: 700; margin-bottom: 6px; }
  .mkt-grade { display: flex; flex-wrap: wrap; gap: 4px; max-height: 24vh; overflow: auto; margin-bottom: 6px; }
  .mkt-op { display: flex; flex-direction: column; align-items: center; width: 52px; padding: 3px; border-radius: 8px; border: 2px solid transparent; background: rgba(0,0,0,.05); cursor: pointer; } .mkt-op.on { border-color: #f1c40f; background: rgba(241,196,15,.2); }
  .mkt-op small { font-size: 10px; font-weight: 700; } .mkt-barraca { padding: 6px 8px; border-radius: 10px; background: rgba(0,0,0,.04); }`;
  document.head.append(css);
}
window.FEIRA = { MKT, mktRecebe, mktTira, MKT_TITULOS, FEIRA_VAGAS, FEIRA_ID, mktVaiFeira, mktVagaPerto };
