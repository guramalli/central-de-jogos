/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📚 BESTIÁRIO (v405; dono: "vamos criar um bestiário?" — escolheu: etapas por vitórias, pontos + bônus por criatura,
   o Bestiário no lugar da Wiki de adversários, no Menu e numa tecla). Como no Tibia:
   - cada criatura tem 3 etapas, liberadas pelas vitórias contra ela (s.kills, que o jogo já contava: quem já jogou
     começa com o progresso que tem). Nunca enfrentou = silhueta e "???".
       etapa 1 (1ª vitória): nome, retrato, nível e onde vive (com o caminho);
       etapa 2: fôlego, ataque, defesa, XP, tostões e QUAIS itens deixa cair;
       etapa 3 (completa): a chance de cada item, as falas e os Pontos de Bestiário.
     Normal: 1 / 25 / 250 vitórias. Chefão: 1 / 3 / 5.
   - Pontos de Bestiário (de cada criatura completa) compram ENFEITES para o cartão daquela criatura (v407, Raio-X T1;
     antes eram +5% de dano, +5% de XP e +10% de chance de item). Não dá para comprar pontos: só caçando.
   Save: s.bestiario = { b: { tipo: ['dano', 'xp', 'loot'] } }. Carregar DEPOIS de olhar.js (o Shift + clique mostra o
   progresso).
   ============================================================ */
const BST_ETAPAS = { normal: [1, 25, 250], chefe: [1, 3, 5] };
const BST_BONUS = {
  // v407 (Raio-X T1: o jogo parou de criar fontes de poder): os pontos compram ENFEITES para o cartão da criatura (antes:
  // +5% de dano, +5% de XP e +10% de itens contra ela). Os ids continuam os mesmos: quem já tinha comprado fica com o enfeite.
  dano: { ic: '🏅', nome: 'Medal', txt: 'Medal on its card', custo: 10 },
  xp: { ic: '⭐', nome: 'Star', txt: 'Gold star on its card', custo: 10 },
  loot: { ic: '👑', nome: 'Crown', txt: 'Crown on its card', custo: 15 },
};
const BST_FORA = /^(est_|pedra_|ce_guard_)/; // jogadores de estádio, pedras do Vale e os guardas gerados da Caçada Épica não são criaturas
const bstEtapas = d => (d && d.chefe ? BST_ETAPAS.chefe : BST_ETAPAS.normal);
const bstKills = k => (G.save && G.save.kills && G.save.kills[k]) || 0;
function bstEtapa(k) { const e = bstEtapas(MONSTROS[k]), n = bstKills(k); return n >= e[2] ? 3 : n >= e[1] ? 2 : n >= e[0] ? 1 : 0; }
function bstNivel(d) { try { return nivelMonstro(d); } catch (e) { return d.nivel || 1; } }
function bstPontosDe(k) { const d = MONSTROS[k]; return d.chefe ? 20 : Math.max(5, Math.min(30, 5 + Math.floor(bstNivel(d) / 25))); }
function bstDados() { const s = G.save; if (!s.bestiario || typeof s.bestiario !== 'object') s.bestiario = {}; if (!s.bestiario.b) s.bestiario.b = {}; return s.bestiario; }
const bstTem = (k, b) => { const s = G.save; return !!(s && s.bestiario && s.bestiario.b && (s.bestiario.b[k] || []).includes(b)); };
// todas as criaturas: as que vivem em algum lugar (a lista da Wiki) + qualquer uma que você já venceu
let BST_LUG = null;
function bstLugares() {
  if (BST_LUG) return BST_LUG;
  const de = {}, lugares = [];
  try { for (const L of dadosWiki()) { lugares.push({ id: L.id, nome: L.nome.replace(/ \(entrada:.*$/, '') }); for (const k of L.mons) (de[k] = de[k] || []).push(L.id); } } catch (e) { console.warn('bestiário', e); }
  return (BST_LUG = { de, lugares });
}
function bstLista() {
  const { de } = bstLugares(), set = new Set(Object.keys(de));
  for (const k of Object.keys((G.save && G.save.kills) || {})) if (MONSTROS[k] && !MONSTROS[k].treino && !BST_FORA.test(k)) set.add(k);
  return [...set].filter(k => MONSTROS[k] && !MONSTROS[k].treino).sort((a, b) => bstNivel(MONSTROS[a]) - bstNivel(MONSTROS[b]) || MONSTROS[a].nome.localeCompare(MONSTROS[b].nome));
}
function bstResumo() {
  const l = bstLista(); let conh = 0, comp = 0, ganhos = 0;
  for (const k of l) { const e = bstEtapa(k); if (e) conh++; if (e === 3) { comp++; ganhos += bstPontosDe(k); } }
  let gastos = 0; const b = (G.save.bestiario && G.save.bestiario.b) || {};
  for (const k in b) for (const x of b[k]) gastos += (BST_BONUS[x] || {}).custo || 0;
  return { total: l.length, conh, comp, ganhos, gastos, livres: ganhos - gastos };
}
function bstCompra(k, b) {
  const R = bstResumo(), c = BST_BONUS[b]; if (!c || bstEtapa(k) < 3 || bstTem(k, b)) return;
  if (R.livres < c.custo) { log(`📚 You need ${c.custo - R.livres} more Bestiary Points (complete more creatures).`, 'l-sis'); som('erro'); return; }
  const D = bstDados(); D.b[k] = [...(D.b[k] || []), b]; som('nivel');
  log(`📚 ${c.ic} ${c.nome} for ${MONSTROS[k].nome}: ${c.txt}!`, 'l-xp'); G.uiSujo = true;
}

/* ---------- os bônus valendo ---------- */
let BST_ATUAL = null; // quem você está vencendo agora (para a XP e os itens)
{
  const _apB = aplicaDano;
  // v407 (Raio-X T1): os bônus viraram só enfeite — sem +5% de dano, +5% de XP e +10% de itens (os embrulhos ficam, sem efeito)
  aplicaDano = function (m, dano) { return _apB.call(this, m, dano); };
  const _xpB = ganhaXp;
  ganhaXp = function (n) { return _xpB.call(this, n); };
  const _mdB = typeof multDrop === 'function' ? multDrop : () => 1;
  window.multDrop = () => _mdB();
  // avisos de etapa nova
  const _mtB = matar;
  matar = function (m) {
    const k = m && m.tipo, ok = k && MONSTROS[k] && !MONSTROS[k].treino && !BST_FORA.test(k) && G.save, e0 = ok ? bstEtapa(k) : 0;
    BST_ATUAL = k || null; let r;
    try { r = _mtB.apply(this, arguments); } finally { BST_ATUAL = null; }
    if (ok) { const e1 = bstEtapa(k); if (e1 > e0) bstAvisa(k, e1); }
    return r;
  };
}
function bstAvisa(k, e) {
  const d = MONSTROS[k];
  if (e === 1) log(`📚 Bestiary: you discovered ${d.nome}! (key ${typeof nomeTecla === 'function' ? nomeTecla(teclaDe('bestiario'), true) : 'N'})`, 'l-info');
  else if (e === 2) log(`📚 Bestiary: ${d.nome}'s entry is open (stamina, attack, XP and the items it drops).`, 'l-info');
  else { log(`📚 Bestiary COMPLETE: ${d.nome}! +${bstPontosDe(k)} Bestiary Points to decorate its card.`, 'l-xp'); banner('📚 Bestiary complete!', d.nome); som('raro'); }
}

/* ---------- a janela ---------- */
const BST_F = { busca: '', lugar: '', ver: 'todas', sel: null, rola: 0 };
function bstRetrato(k, tam, escura) {
  const c = mkCanvas(tam, Math.round(tam * 1.25)); c.className = 'bst-ret' + (escura ? ' escura' : '');
  c._pinta = () => { try { pintaAparencia(c, MONSTROS[k].look || { tipo: 'pombo' }); } catch (e) { } };
  return c;
}
// desenha os retratos só quando aparecem (são mais de 300)
let BST_OBS = null;
function bstObserva(raiz) {
  if (BST_OBS) BST_OBS.disconnect();
  const pinta = c => { if (c._pinta && !c._feito) { c._feito = true; c._pinta(); } };
  if (!('IntersectionObserver' in window)) { raiz.querySelectorAll('canvas.bst-ret').forEach(pinta); return; }
  BST_OBS = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { pinta(e.target); BST_OBS.unobserve(e.target); } }), { root: raiz.closest('.bst-grade') || null, rootMargin: '120px' });
  raiz.querySelectorAll('canvas.bst-ret').forEach(c => BST_OBS.observe(c));
}
function bstBarra(k) {
  const e = bstEtapa(k), et = bstEtapas(MONSTROS[k]), n = bstKills(k);
  if (e >= 3) return { pc: 100, txt: `${fmt(n)} ✔` };
  const de = e ? et[e - 1] : 0, ate = et[e];
  return { pc: Math.floor((n - de) / (ate - de) * 100), txt: `${fmt(n)}/${fmt(ate)}` };
}
function bstCartao(k) {
  const d = MONSTROS[k], e = bstEtapa(k), b = bstBarra(k);
  const c = el('button', { type: 'button', class: 'bst-c' + (d.chefe ? ' chefe' : '') + (e === 3 ? ' completa' : '') + (e === 0 ? ' nova' : ''), title: e ? d.nome : 'Not faced yet', onclick: () => { BST_F.sel = k; modalBestiario(); } },
    bstRetrato(k, 48, e === 0),
    el('span', { class: 'bst-nm' }, e ? (d.chefe ? '♛ ' : '') + d.nome + Object.keys(BST_BONUS).filter(b => bstTem(k, b)).map(b => ' ' + BST_BONUS[b].ic).join('') : '???'), // v407: os enfeites comprados aparecem no cartão
    el('span', { class: 'bst-et' }, ...[1, 2, 3].map(i => el('i', { class: i <= e ? 'on' : '' }))),
    el('span', { class: 'bst-b' }, el('i', { style: `width:${b.pc}%` }), el('small', {}, b.txt)));
  return c;
}
function bstOnde(k) {
  const linhas = [];
  try {
    const sp = typeof ccSpawns === 'function' ? ccSpawns(k) : [];
    const nomes = [...new Set(sp.map(o => ccNome(o.mapa)))];
    const o = typeof ccOndeMonstro === 'function' ? ccOndeMonstro(k) : null;
    if (nomes.length) linhas.push(el('div', {}, el('b', {}, '🗺️ Lives in: '), nomes.slice(0, 6).join(', ') + (nomes.length > 6 ? ` and ${nomes.length - 6} more` : '')));
    else if (o) linhas.push(el('div', {}, el('b', {}, '🗺️ Where: '), ccNome(o.mapa)));
    if (o) {
      const pl = typeof ccPlaca === 'function' ? ccPlaca(o.mapa, o.x, o.y, MONSTROS[k].nome) : '', rota = ccRota(o.mapa), cam = ccCaminhoTxt(rota);
      if (pl) linhas.push(el('div', {}, el('b', {}, '🪧 '), pl));
      if (rota && rota.viagem) linhas.push(el('div', {}, el('b', {}, '🧭 Travel: '), rota.viagem));
      if (cam) linhas.push(el('div', {}, el('b', {}, '🧭 Route: '), cam));
    }
  } catch (e) { }
  return linhas;
}
function bstFicha(k) {
  const d = MONSTROS[k], e = bstEtapa(k), et = bstEtapas(d), n = bstKills(k), nv = bstNivel(d), R = bstResumo();
  const ret = bstRetrato(k, 110, e === 0); setTimeout(() => ret._pinta(), 0);
  const prox = e < 3 ? `${fmt(et[e] - n)} more win${et[e] - n > 1 ? 's' : ''} to reach stage ${e + 1}.` : 'Complete!';
  const corpo = [el('div', { class: 'bst-f-cab' }, ret, el('div', { class: 'bst-f-info' },
    el('h3', {}, e ? (d.chefe ? '♛ ' : '') + d.nome : '??? (not faced yet)'),
    e ? el('div', { class: 'bst-f-nv' }, `Level ${fmt(nv)}${d.chefe ? ' · boss' : ''}${d.aggro > 0 ? ' · comes to challenge you' : ''}`) : '',
    el('div', { class: 'bst-et grande' }, ...[1, 2, 3].map(i => el('i', { class: i <= e ? 'on' : '', title: `Stage ${i}: ${fmt(et[i - 1])} win${et[i - 1] > 1 ? 's' : ''}` }))),
    el('div', { class: 'bst-f-kills' }, `${fmt(n)} win${n === 1 ? '' : 's'} · ${prox}`)))];
  if (!e) { corpo.push(el('p', { class: 'bst-dica' }, 'Beat this creature once to find out who it is and where it lives.')); return corpo; }
  corpo.push(el('div', { class: 'bst-sec' }, ...bstOnde(k)));
  if (e >= 2) {
    const ouro = d.ouro ? (d.ouro[0] === d.ouro[1] ? `${d.ouro[0]}` : `${d.ouro[0]}–${d.ouro[1]}`) : '0';
    corpo.push(el('div', { class: 'bst-sec bst-st' },
      ...[['❤️', 'Stamina', fmt(d.hp)], ['⚔️', 'Attack', fmt(d.atk || 0)], ['🛡️', 'Defense', fmt(d.def || 0)], ['⭐', 'XP', fmt(d.xp || 0)], ['🪙', 'Coins', ouro]]
        .map(([ic, t, v]) => el('div', {}, el('span', {}, ic + ' ' + t), el('b', {}, v)))));
    const itens = (d.loot || []).filter(([i]) => ITENS[i]);
    corpo.push(el('div', { class: 'bst-sec' }, el('b', {}, '🎒 Drops'), itens.length ? el('div', { class: 'bst-loot' }, ...itens.map(([iid, ch, mn, mx]) => {
      const ic = iconeClone(iconeItem(iid)); ic.className = 'wk-ic';
      return el('div', { class: 'wk-item' }, ic, el('span', { class: 'wk-nome' }, ITENS[iid].nome), el('small', {}, mn === mx ? `${mn}x` : `${mn}–${mx}x`), el('b', {}, e >= 3 ? pctWiki(ch) : '?'));
    })) : el('small', { class: 'vazio' }, ' nada.'), e < 3 ? el('small', { class: 'bst-dica' }, `The drop chances show up at stage 3 (${fmt(et[2])} wins).`) : ''));
  } else corpo.push(el('p', { class: 'bst-dica' }, `Stamina, attack, XP and the items it drops show up at stage 2 (${fmt(et[1])} wins).`));
  if (e >= 3) {
    if (d.falas && d.falas.length) corpo.push(el('div', { class: 'bst-sec' }, el('b', {}, '💬 Often says: '), d.falas.slice(0, 4).map(f => `“${f}”`).join(' ')));
    corpo.push(el('div', { class: 'bst-sec bst-bonus' }, el('b', {}, `🏅 ${d.nome}'s decorations`), el('small', {}, ` (you have ${R.livres} points; this creature gave ${bstPontosDe(k)})`),
      el('div', { class: 'bst-bt' }, ...Object.entries(BST_BONUS).map(([b, c]) => bstTem(k, b)
        ? el('span', { class: 'bst-tem' }, `${c.ic} ${c.txt} ✔`)
        : el('button', { class: 'btn mini' + (R.livres >= c.custo ? ' amarelo' : ''), type: 'button', onclick: () => { bstCompra(k, b); modalBestiario(); } }, `${c.ic} ${c.txt} — ${c.custo} pts`)))));
  } else corpo.push(el('p', { class: 'bst-dica' }, `Complete it (${fmt(et[2])} wins) to earn ${bstPontosDe(k)} Bestiary Points and decorate its card.`));
  return corpo;
}
function modalBestiario() {
  if (!G.save) return;
  const R = bstResumo(), { de, lugares } = bstLugares();
  const topo = el('div', { class: 'bst-topo' },
    el('span', {}, '👁️ Known ', el('b', {}, `${R.conh}/${R.total}`)),
    el('span', {}, '✔ Complete ', el('b', {}, String(R.comp))),
    el('span', { title: 'Earned by completing creatures; spend them on a completed creature\'s entry' }, '🏅 Points ', el('b', {}, String(R.livres))));
  if (BST_F.sel && MONSTROS[BST_F.sel]) {
    abreModal.largo = true;
    abreModal(el('h2', {}, '📚 Bestiary'), topo, el('div', { class: 'bst-ficha' }, ...bstFicha(BST_F.sel)),
      el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: () => { BST_F.sel = null; modalBestiario(); } }, '← Back to the list')));
    bstAbas(); return;
  }
  const busca = el('input', { type: 'search', class: 'wk-busca', placeholder: '🔎 Search for a creature or an item it drops...', value: BST_F.busca });
  const lugar = el('select', { class: 'bst-sel' }, el('option', { value: '' }, '🗺️ All places'), ...lugares.map(L => el('option', { value: L.id }, L.nome)));
  lugar.value = BST_F.lugar;
  const VER = [['todas', 'All'], ['conhecidas', 'Known'], ['faltam', 'Not complete yet'], ['completas', 'Complete'], ['chefes', '♛ Bosses']];
  const chips = el('div', { class: 'bst-chips' }, ...VER.map(([v, t]) => el('button', { type: 'button', class: 'btn mini' + (BST_F.ver === v ? ' amarelo' : ''), onclick: () => { BST_F.ver = v; BST_F.rola = 0; modalBestiario(); } }, t)));
  const grade = el('div', { class: 'bst-grade' });
  const monta = () => {
    const q = busca.value.trim().toLowerCase(); BST_F.busca = busca.value; BST_F.lugar = lugar.value;
    grade.innerHTML = ''; let n = 0;
    for (const k of bstLista()) {
      const d = MONSTROS[k], e = bstEtapa(k);
      if (BST_F.lugar && !(de[k] || []).includes(BST_F.lugar)) continue;
      if (BST_F.ver === 'conhecidas' && !e) continue; if (BST_F.ver === 'faltam' && e === 3) continue; if (BST_F.ver === 'completas' && e < 3) continue; if (BST_F.ver === 'chefes' && !d.chefe) continue;
      if (q) { const nome = e ? d.nome.toLowerCase() : '', itens = e >= 2 ? (d.loot || []).map(([i]) => ITENS[i] ? ITENS[i].nome.toLowerCase() : '').join(' ') : ''; if (!nome.includes(q) && !itens.includes(q)) continue; }
      grade.append(bstCartao(k)); n++;
    }
    if (!n) grade.append(el('p', { class: 'vazio' }, q ? 'Nothing found (items only show up for creatures at stage 2 or higher).' : 'No creatures here.'));
    bstObserva(grade);
  };
  busca.addEventListener('input', monta); busca.addEventListener('keydown', ev => ev.stopPropagation()); lugar.addEventListener('change', monta);
  const nota = el('details', { class: 'wk-nota bst-como' }, el('summary', {}, 'How does it work?'), `every win counts. Stage 1 (1st win): name and where it lives. Stage 2 (${BST_ETAPAS.normal[1]}): stamina, attack, XP and items. Stage 3 (${BST_ETAPAS.normal[2]}): item drop chances and Bestiary Points to decorate the creature's card (medal, star and crown). Bosses: ${BST_ETAPAS.chefe.join(' / ')} wins.`);
  abreModal.largo = true;
  abreModal(el('h2', {}, '📚 Bestiary'), topo, nota, el('div', { class: 'bst-filtros' }, busca, lugar), chips, grade);
  monta(); bstAbas();
  if (BST_F.rola) grade.scrollTop = BST_F.rola;
  grade.addEventListener('scroll', () => { BST_F.rola = grade.scrollTop; }, { passive: true });
}
// as abas da Wiki (Mascotes, Caçada Épica...) continuam em cima
function bstAbas() {
  const h2 = document.querySelector('#modalConteudo h2'); if (!h2 || document.querySelector('.wx-abas')) return;
  const ABAS = [['drops', '📚 Bestiary'], ['mascotes', '🐾 Pets'], ['epica', '👑 Epic Hunt'], ['reliquias', '✨ Upgrades and relics'], ['novo', '📰 What\'s New']];
  h2.after(el('div', { class: 'opcoes wx-abas' }, ...ABAS.map(([k, t]) => el('button', { class: 'btn mini' + (k === 'drops' ? ' amarelo' : ''), type: 'button', onclick: () => { if (k === 'drops') { BST_F.sel = null; modalBestiario(); } else modalWiki(k); } }, t))));
}
// a Wiki de adversários vira o Bestiário (na tela inicial, sem jogo carregado, ela abre nas Novidades)
{
  const _mwB = modalWiki;
  modalWiki = function (aba = 'drops') {
    if (aba !== 'drops') return _mwB.apply(this, arguments);
    if (G.save && G.rodando) { BST_F.sel = null; return modalBestiario(); }
    _mwB.call(this, 'novo');
    const C = document.getElementById('modalConteudo'); if (C) C.append(el('p', { class: 'wk-nota' }, '📚 The Bestiary (the creatures and what they drop) is inside the game: log in with your character and press N.'));
  };
  const rotula = (t = 0) => {
    const b = document.getElementById('btnWiki'); if (b) b.textContent = '📚 Bestiary and Wiki';
    const bi = document.getElementById('btnWikiInicio'); if (bi) bi.textContent = '📖 Wiki and what\'s new';
    if (!b && t < 20) setTimeout(() => rotula(t + 1), 500);
  };
  rotula();
  // celular: o menu ☰ é montado depois (ao entrar no modo celular); o botão entra quando ele aparecer
  setInterval(() => {
    const g = document.querySelector('#celMenu .cm-grade'); if (!g || document.getElementById('cmBest')) return;
    const velho = document.getElementById('cmWiki'); if (velho) velho.remove();
    g.append(el('button', { class: 'btn cm-bt', id: 'cmBest', type: 'button', onclick: () => { if (typeof fechaMenuCel === 'function') fechaMenuCel(); BST_F.sel = null; modalBestiario(); } }, el('span', { class: 'cm-ic' }, '📚'), 'Bestiary'));
  }, 1500);
}
// Shift + clique numa criatura: o progresso no Bestiário
if (typeof olhEnt === 'function') {
  const _olB = olhEnt;
  olhEnt = function (e) {
    const r = _olB.apply(this, arguments);
    try { if (e && e !== G.p && e.hp !== undefined && e.tipo && MONSTROS[e.tipo] && !MONSTROS[e.tipo].treino && !BST_FORA.test(e.tipo)) { const et = bstEtapa(e.tipo), b = bstBarra(e.tipo); log(`📚 Bestiary: stage ${et}/3 (${b.txt} wins).`, 'l-info'); } } catch (er) { }
    return r;
  };
}
{
  const st = document.createElement('style');
  st.textContent = `
  .bst-topo { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 13px; margin: 0 0 6px; padding: 5px 9px; border-radius: 8px; background: var(--madeira2, #5e2f14); color: #ffe9a8; }
  .bst-topo b { color: #fff; }
  .bst-filtros { display: flex; gap: 6px; } .bst-filtros .wk-busca { flex: 1; margin: 0; }
  .bst-sel { max-width: 40%; border-radius: 8px; border: 2px solid var(--madeira3, #b88a5a); font: 700 13px Nunito, sans-serif; padding: 4px; }
  .bst-como > summary { cursor: pointer; font-weight: 800; } .bst-como { padding: 4px 9px; }
  .bst-chips { display: flex; flex-wrap: wrap; gap: 4px; margin: 6px 0; }
  .bst-grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 5px; max-height: 52vh; overflow-y: auto; padding: 2px 4px 2px 0; }
  .bst-c { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 4px 3px 5px; border-radius: 8px; border: 2px solid #d8c09a; background: #fffaf0; cursor: pointer; font: 700 11px/1.15 Nunito, sans-serif; color: #3d2b3a; min-width: 0; }
  .bst-c:hover { border-color: #b88a3a; background: #fff3d6; }
  .bst-c.chefe { border-color: #e0a020; } .bst-c.completa { background: #eaffdf; border-color: #5aa83a; } .bst-c.nova { background: #efe9df; }
  .bst-ret { width: 48px; height: 60px; } .bst-ret.escura { filter: brightness(0) opacity(.35); }
  .bst-nm { width: 100%; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bst-et { display: flex; gap: 3px; } .bst-et i { width: 7px; height: 7px; border-radius: 50%; background: #d8c8b0; box-shadow: inset 0 0 0 1px rgba(0,0,0,.25); } .bst-et i.on { background: #e0a020; }
  .bst-et.grande i { width: 12px; height: 12px; }
  .bst-b { position: relative; width: 100%; height: 11px; border-radius: 6px; background: #3a2a1a; overflow: hidden; }
  .bst-b i { position: absolute; left: 0; top: 0; bottom: 0; background: #3fb34a; } .bst-c.completa .bst-b i { background: #e0a020; }
  .bst-b small { position: relative; display: block; text-align: center; font: 800 8.5px/11px Nunito, sans-serif; color: #fff; text-shadow: 0 1px 1px #000; }
  .bst-ficha { max-height: 58vh; overflow-y: auto; padding-right: 4px; }
  .bst-f-cab { display: flex; gap: 12px; align-items: center; }
  .bst-f-cab .bst-ret { width: 110px; height: 138px; flex: none; background: radial-gradient(#fff8e6, #f0dfbf); border-radius: 10px; border: 2px solid #d8c09a; }
  .bst-f-info h3 { margin: 0 0 3px; font: 800 19px Fredoka, sans-serif; color: #3d2b3a; } .bst-f-nv { font-size: 13px; opacity: .8; margin-bottom: 4px; }
  .bst-f-kills { font-size: 12.5px; margin-top: 4px; }
  .bst-sec { margin-top: 8px; padding: 6px 8px; border-radius: 8px; background: #fffaf0; border: 1px solid #e3d2b4; font-size: 13px; line-height: 1.45; color: #3d2b3a; }
  .bst-st { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 2px 14px; }
  .bst-st > div { display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(138,75,36,.2); }
  .bst-loot { display: flex; flex-direction: column; gap: 2px; margin-top: 3px; }
  .bst-dica { font-size: 12px; opacity: .8; margin: 6px 0 0; display: block; }
  .bst-bonus .bst-bt { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px; }
  .bst-tem { font-size: 12px; font-weight: 800; color: #1f7a2e; background: rgba(58,194,106,.15); border-radius: 6px; padding: 3px 7px; }
  `;
  document.head.append(st);
}
window.BESTIARIO = { bstEtapa, bstResumo, bstLista, bstTem, modalBestiario };
