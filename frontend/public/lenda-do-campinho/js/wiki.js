/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   WIKI: todos os adversários, lugar por lugar, com o que cada um deixa
   cair e a chance de cada item. Abre na tela inicial (botão 📖) e no jogo
   (☰ Mais → Wiki). Tem busca por adversário ou por item.
   Os números vêm direto dos dados do jogo (sempre atualizados).
   Carregar DEPOIS de arenas.js e centrinho.js.
   ============================================================ */
function dadosWiki() {
  const lugares = [];
  const vistos = new Set();
  const ids = Object.keys(MAPAS_DEF).filter(id => !/^arena_|^visita_|^casa_/.test(id));
  for (const id of ids) {
    let m; try { m = getMapa(id); } catch (e) { continue; }
    if (!m || m.interior || !m.spawns || !m.spawns.length) continue;
    const mons = [...new Set(m.spawns.map(sp => sp.m))].filter(k => MONSTROS[k] && !MONSTROS[k].treino);
    if (!mons.length) continue;
    mons.forEach(k => vistos.add(k));
    lugares.push({ id, nome: m.nome, mons });
  }
  if (typeof ARENAS !== 'undefined') for (const a of ARENAS) {
    const mons = [a.chefe.id, a.guarda && a.guarda.id].filter(k => k && MONSTROS[k]);
    mons.forEach(k => vistos.add(k));
    lugares.push({ id: a.id, nome: `🏟️ ${a.nome} (entrada: ${getNomeMapa(a.host)}, nível ${a.req}+)`, mons, arena: a });
  }
  return lugares;
}
function pctWiki(p) { const v = p * 100; return v >= 10 ? Math.round(v) + '%' : v >= 1 ? v.toFixed(1).replace('.', ',') + '%' : v.toFixed(2).replace('.', ',') + '%'; }
function cartaoMonstroWiki(k, arena) {
  const d = MONSTROS[k]; let nv = '?'; try { nv = nivelMonstro(d); } catch (e) { }
  const linhas = [];
  for (const [iid, ch, mn, mx] of (d.loot || [])) {
    const it = ITENS[iid]; if (!it) continue;
    const rar = typeof raridadeItem === 'function' ? raridadeItem(iid) : 'comum';
    const cor = (RARIDADE[rar] || {}).cor || '#888';
    const ic = iconeClone(iconeItem(iid)); ic.className = 'wk-ic'; ic.dataset.item = iid;
    linhas.push(el('div', { class: 'wk-item', 'data-busca': it.nome.toLowerCase() }, ic,
      el('span', { class: 'wk-nome', title: 'Raridade: ' + ((RARIDADE[rar] || {}).nome || rar) }, el('i', { class: 'wk-rar', style: `background:${cor}` }), it.nome), el('small', {}, mn === mx ? `${mn}x` : `${mn}–${mx}x`), el('b', {}, pctWiki(ch))));
  }
  if (d.fig) linhas.push(el('div', { class: 'wk-item', 'data-busca': 'figurinha' }, el('span', { class: 'wk-ic wk-emoji' }, '🎴'), el('span', { class: 'wk-nome' }, 'Figurinha do álbum'), el('small', {}, '1x'), el('b', {}, pctWiki(d.chefe ? 0.5 : 1 / 110))));
  if (arena && k === arena.chefe.id && arena.miticos) {
    const nomes = arena.miticos.map(i => ITENS[i] && ITENS[i].nome).filter(Boolean).join(', ');
    linhas.push(el('div', { class: 'wk-item wk-mitico', 'data-busca': nomes.toLowerCase() + ' mitico mítico' }, el('span', { class: 'wk-ic wk-emoji' }, '✨'), el('span', { class: 'wk-nome', style: `color:${RARIDADE.mitico ? RARIDADE.mitico.cor : '#ff5ad8'}` }, `1 item MÍTICO: ${nomes}`), el('small', {}, '1x'),
      el('b', {}, `${pctWiki(ARENA_MITICO_BASE)} → até ${pctWiki(ARENA_MITICO_MAX)}`)));
  }
  const ouro = d.ouro ? (d.ouro[0] === d.ouro[1] ? `${d.ouro[0]}` : `${d.ouro[0]}–${d.ouro[1]}`) : '0';
  const busca = (d.nome + ' ' + (d.loot || []).map(([i]) => ITENS[i] ? ITENS[i].nome : '').join(' ')).toLowerCase();
  return el('div', { class: 'wk-mon' + (d.chefe ? ' chefe' : ''), 'data-busca': busca },
    el('div', { class: 'wk-cab' }, el('b', {}, (d.chefe ? '♛ ' : '') + d.nome), el('span', { class: 'wk-nv' }, `Nv ${nv}`)),
    el('div', { class: 'wk-st' }, `❤️ ${fmt(d.hp)} fôlego · ⭐ ${fmt(d.xp)} XP · 🪙 ${ouro} tostões${d.aggro > 0 ? ' · vem te desafiar' : ''}`),
    linhas.length ? el('div', { class: 'wk-drops' }, ...linhas) : el('small', { class: 'vazio' }, 'Não deixa item cair.'));
}
function modalWiki() {
  const lugares = dadosWiki();
  const busca = el('input', { type: 'search', class: 'wk-busca', placeholder: '🔎 Procurar adversário ou item (ex.: roda de skate, couro, Tonhão)...' });
  const corpo = el('div', { class: 'wk-corpo' });
  for (const L of lugares) {
    const sec = el('details', { class: 'wk-lugar', open: 'open' }, el('summary', {}, `${L.nome} — ${L.mons.length} adversário${L.mons.length > 1 ? 's' : ''}`));
    const grade = el('div', { class: 'wk-grade' }, ...L.mons.map(k => cartaoMonstroWiki(k, L.arena)));
    sec.append(grade); corpo.append(sec);
  }
  const filtra = () => {
    const q = busca.value.trim().toLowerCase();
    corpo.querySelectorAll('.wk-lugar').forEach(sec => {
      let algum = false;
      sec.querySelectorAll('.wk-mon').forEach(c => { const ok = !q || c.dataset.busca.includes(q); c.hidden = !ok; if (ok) algum = true;
        c.querySelectorAll('.wk-item').forEach(li => li.classList.toggle('achou', !!q && li.dataset.busca.includes(q))); });
      sec.hidden = !algum; if (q && algum) sec.open = true;
    });
  };
  busca.addEventListener('input', filtra); busca.addEventListener('keydown', ev => ev.stopPropagation());
  const nota = el('div', { class: 'wk-nota' },
    el('b', {}, 'Como ler: '), 'a % é a chance de cair em cada adversário vencido. ',
    el('b', {}, 'Nível: '), 'se você estiver muito acima do nível do adversário, a chance diminui (6 a 9 níveis acima: 80%; 10 a 14: 40%; 15 a 19: 15%; 20+: nada). ',
    el('b', {}, 'Missões: '), 'item pedido por uma missão que você aceitou cai com a chance cheia, mesmo em adversário fraco. ',
    el('b', {}, 'Arenas: '), 'a chance do item mítico começa baixa e sobe a cada vitória sem ele.');
  abreModal.largo = true;
  abreModal(el('h2', {}, '📖 Wiki — adversários e o que eles deixam cair'), nota, busca, corpo);
  if (!G.rodando) $('#modal').onclick = null;
  setTimeout(() => busca.focus(), 50);
  // na tela inicial as imagens dos itens ainda estão carregando: troca os ícones quando chegarem
  const refaz = () => corpo.querySelectorAll('canvas.wk-ic[data-item]').forEach(c => { const n = iconeClone(iconeItem(c.dataset.item)); n.className = 'wk-ic'; n.dataset.item = c.dataset.item; c.replaceWith(n); });
  [500, 1500, 3500].forEach(ms => setTimeout(() => { if (document.body.contains(corpo)) refaz(); }, ms));
}
(function () {
  const menu = document.getElementById('inicioMenu');
  if (menu && !document.getElementById('btnWikiInicio')) menu.append(el('button', { class: 'btn', id: 'btnWikiInicio', type: 'button', onclick: () => modalWiki() }, '📖 Wiki: adversários e drops'));
  const lista = document.querySelector('#topo .tb-lista');
  if (lista && !document.getElementById('btnWiki')) { const b = el('button', { class: 'btn', id: 'btnWiki', type: 'button', role: 'menuitem', onclick: () => modalWiki() }, '📖 Wiki: adversários e drops'); const sair = document.getElementById('btnSair'); if (sair) sair.before(b); else lista.append(b); }
  const grade = document.querySelector('#celMenu .cm-grade');
  if (grade && !document.getElementById('cmWiki')) grade.append(el('button', { class: 'btn cm-bt', id: 'cmWiki', type: 'button', onclick: () => { if (typeof fechaMenuCel === 'function') fechaMenuCel(); modalWiki(); } }, el('span', { class: 'cm-ic' }, '📖'), 'Wiki'));
  const st = document.createElement('style');
  st.textContent = `
  .wk-nota { font-size: 12.5px; background: #fff4d6; border: 2px solid #e8c878; border-radius: 8px; padding: 6px 9px; margin-bottom: 8px; line-height: 1.4; }
  .wk-busca { width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 8px; border: 2px solid var(--madeira3, #b88a5a); font: 700 14px Nunito, sans-serif; margin-bottom: 8px; }
  .wk-corpo { max-height: 60vh; overflow-y: auto; padding-right: 4px; }
  .wk-lugar { margin-bottom: 8px; }
  .wk-lugar > summary { cursor: pointer; font: 800 15px Fredoka, sans-serif; padding: 5px 8px; background: var(--madeira2, #5e2f14); color: #ffe9a8; border-radius: 8px; }
  .wk-grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 8px; margin-top: 6px; }
  .wk-mon { background: #fffaf0; border: 2px solid #d8c09a; border-radius: 10px; padding: 7px 8px; }
  .wk-mon.chefe { border-color: #e0a020; background: #fff3d0; }
  .wk-cab { display: flex; justify-content: space-between; align-items: center; gap: 6px; font-size: 14px; }
  .wk-nv { font: 800 12px Fredoka, sans-serif; background: #3a2780; color: #fff; border-radius: 6px; padding: 1px 6px; }
  .wk-st { font-size: 11.5px; opacity: .8; margin: 2px 0 5px; }
  .wk-drops { display: flex; flex-direction: column; gap: 2px; }
  .wk-item { display: grid; grid-template-columns: 22px 1fr auto auto; align-items: center; gap: 6px; font-size: 12.5px; padding: 1px 3px; border-radius: 5px; }
  .wk-item.achou { background: #ffe57a; }
  .wk-item b { min-width: 46px; text-align: right; }
  .wk-item small { opacity: .7; }
  .wk-ic { width: 22px; height: 22px; object-fit: contain; }
  .wk-emoji { display: inline-flex; align-items: center; justify-content: center; font-size: 15px; }
  .wk-nome { font-weight: 800; color: #3d2b3a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .wk-rar { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 5px; vertical-align: middle; box-shadow: 0 0 0 1px rgba(0,0,0,.35); }
  .wk-mitico { grid-template-columns: 22px 1fr auto auto; }
  .wk-mitico .wk-nome { white-space: normal; }
  `;
  document.head.append(st);
})();
